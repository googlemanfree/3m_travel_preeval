import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  rows: new Map<unknown, any[]>(),
  updates: [] as Array<{ table: unknown; values: any }>,
}));

vi.mock("./db", () => ({
  getDb: async () => {
    const chain = (rows: any[]) => {
      const c: any = { where: () => c, limit: () => c, orderBy: () => c, then: (resolve: (value: any[]) => unknown) => resolve(rows) };
      return c;
    };
    return {
      select: () => ({ from: (table: unknown) => chain(state.rows.get(table) ?? []) }),
      update: (table: unknown) => ({ set: (values: any) => ({ where: async () => { state.updates.push({ table, values }); return [{ affectedRows: 1 }]; } }) }),
    };
  },
}));
vi.mock("./routers/adminAuth", () => ({ requireValidAdminSession: async () => ({ id: 1, email: "agent@3mtravelagency.com" }) }));

import { candidateFiles, candidates } from "../drizzle/schema";
import { adminPassportIdentityRouter } from "./routers/adminPassportIdentity";
import { buildPassportIdentity } from "../shared/passportIdentity";

const token = "t".repeat(40);
const caller = () => adminPassportIdentityRouter.createCaller({ req: { headers: {} }, res: {} } as any);
const identity = (expiryDate: string) =>
  JSON.stringify(buildPassportIdentity({ surname: "NKOLO", givenNames: "Aïcha", dateOfBirth: "1995-03-14", passportNumber: "AB123456", expiryDate, plannedTravelDate: null }, "agent@3mtravelagency.com", new Date()));

beforeEach(() => {
  state.rows = new Map();
  state.updates = [];
});

describe("contrôle du passeport (admin)", () => {
  it("get : renvoie l'identité saisie, la validité et les écarts avec la fiche", async () => {
    state.rows.set(candidates, [{ id: 5, fullName: "Fatou Diallo", dateOfBirth: "1990-01-01" }]);
    state.rows.set(candidateFiles, [{ id: 9, fileName: "passeport.pdf", status: "uploaded", extractedData: identity("2026-01-01"), uploadedAt: new Date() }]);
    const result = await caller().get({ sessionToken: token, candidateId: 5 });
    expect(result.file).toMatchObject({ id: 9, fileName: "passeport.pdf" });
    expect(result.expiry?.status).toBe("expired");
    expect(result.discrepancies.map((item) => item.field).sort()).toEqual(["dateOfBirth", "name"]);
  });

  it("get : un passeport rejeté n'est pas contrôlé ; sans passeport, rien n'est inventé", async () => {
    state.rows.set(candidates, [{ id: 5, fullName: "Aïcha Nkolo", dateOfBirth: null }]);
    state.rows.set(candidateFiles, [{ id: 9, fileName: "vieux.pdf", status: "rejected", extractedData: null, uploadedAt: new Date() }]);
    const result = await caller().get({ sessionToken: token, candidateId: 5 });
    expect(result).toMatchObject({ file: null, identity: null, expiry: null, discrepancies: [] });
  });

  it("get : les anciens blocs « extraction » inventés sont ignorés (aucune validité affichée)", async () => {
    state.rows.set(candidates, [{ id: 5, fullName: "Aïcha Nkolo", dateOfBirth: null }]);
    state.rows.set(candidateFiles, [{ id: 9, fileName: "passeport.pdf", status: "uploaded", extractedData: JSON.stringify({ documentTypeDetected: "Passeport Biométrique", expirationDate: "2029-10-16" }), uploadedAt: new Date() }]);
    const result = await caller().get({ sessionToken: token, candidateId: 5 });
    expect(result.file?.id).toBe(9);
    expect(result.identity).toBeNull();
    expect(result.expiry).toBeNull();
  });

  it("save : enregistre l'identité dans le fichier passeport, avec l'agent et la date", async () => {
    state.rows.set(candidateFiles, [{ id: 9, candidateId: 5, fileType: "passeport" }]);
    const result = await caller().save({ sessionToken: token, candidateId: 5, fileId: 9, surname: "Nkolo", givenNames: "Aïcha", dateOfBirth: "1995-03-14", passportNumber: "ab123456", expiryDate: "2031-01-01" });
    expect(result.success).toBe(true);
    const stored = JSON.parse(state.updates[0].values.extractedData);
    expect(stored).toMatchObject({ kind: "passport_identity_v1", passportNumber: "AB123456", enteredBy: "agent@3mtravelagency.com" });
  });

  it("save : refuse un fichier d'un autre candidat, une pièce qui n'est pas un passeport et des dates incohérentes", async () => {
    const payload = { sessionToken: token, candidateId: 5, fileId: 9, surname: "Nkolo", givenNames: "Aïcha", dateOfBirth: "1995-03-14", passportNumber: "AB123456", expiryDate: "2031-01-01" };
    state.rows.set(candidateFiles, [{ id: 9, candidateId: 6, fileType: "passeport" }]);
    await expect(caller().save(payload)).rejects.toThrow(/introuvable/);
    state.rows.set(candidateFiles, [{ id: 9, candidateId: 5, fileType: "cv" }]);
    await expect(caller().save(payload)).rejects.toThrow(/pas un passeport/);
    state.rows.set(candidateFiles, [{ id: 9, candidateId: 5, fileType: "passeport" }]);
    await expect(caller().save({ ...payload, expiryDate: "1990-01-01" })).rejects.toThrow(/postérieure/);
    expect(state.updates).toEqual([]);
  });

  it("alerts : ne liste que les passeports saisis expirés ou trop courts, un seul par candidat, les plus urgents d'abord", async () => {
    state.rows.set(candidateFiles, [
      { id: 1, candidateId: 5, status: "uploaded", extractedData: identity("2025-01-01"), uploadedAt: new Date("2026-05-01") },
      { id: 2, candidateId: 5, status: "uploaded", extractedData: identity("2035-01-01"), uploadedAt: new Date("2026-04-01") }, // plus ancien : ignoré
      { id: 3, candidateId: 6, status: "verified", extractedData: identity("2036-01-01"), uploadedAt: new Date("2026-05-01") },
      { id: 4, candidateId: 7, status: "uploaded", extractedData: null, uploadedAt: new Date("2026-05-01") },
    ]);
    const result = await caller().alerts({ sessionToken: token });
    expect(result.total).toBe(1);
    expect(result.alerts[0]).toMatchObject({ candidateId: 5, fileId: 1, status: "expired" });
  });
});
