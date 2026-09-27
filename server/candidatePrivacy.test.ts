import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  rows: new Map<any, any[]>(),
  inserts: [] as Array<{ table: any; values: any }>,
  updates: [] as Array<{ table: any; values: any }>,
  emails: [] as any[],
  notified: [] as any[],
  candidate: { id: 9, email: "client@example.com", fullName: "Aïcha Nkolo", passwordHash: "secret-hash" } as any,
  nextId: 100,
  failEmail: false,
}));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({ from: (table: any) => { const chain: any = { where: () => chain, limit: () => chain, then: (resolveRows: (rows: any[]) => unknown) => resolveRows(state.rows.get(table) ?? []) }; return chain; } }),
    insert: (table: any) => ({ values: async (values: any) => { const row = { id: state.nextId++, updatedAt: new Date(), ...values }; state.inserts.push({ table, values: row }); state.rows.set(table, [...(state.rows.get(table) ?? []), row]); } }),
    update: (table: any) => ({ set: (values: any) => ({ where: async () => { state.updates.push({ table, values }); state.rows.set(table, (state.rows.get(table) ?? []).map((row) => ({ ...row, ...values }))); } }) }),
  }),
}));
vi.mock("./routers/adminAuth", () => ({ requireValidAdminSession: async () => ({ email: "agent@3mtravelagency.com" }) }));
vi.mock("./_core/email", () => ({ sendEmail: async (message: any) => { if (state.failEmail) throw new Error("smtp down"); state.emails.push(message); } }));
vi.mock("./routers/adminNotifications", () => ({ notifyAdmins: async (input: any) => { state.notified.push(input); } }));
vi.mock("./routers/candidate", async () => {
  const { publicProcedure } = await import("./_core/trpc");
  return { candidateProcedure: publicProcedure.use(async ({ next }) => next({ ctx: { candidate: state.candidate } as any })), findCandidateFromAuthorizationHeader: async () => null, getOrCreateCandidateForPlatformUser: async () => null };
});

import { agencyDossiers, agencySettings, applications, candidates, customerReviews, evaluations, flightBookingRequests } from "../drizzle/schema";
import { PRIVACY_DELETION_REQUEST_PREFIX, parsePrivacyDeletionRequest, privacyDeletionRequestKey } from "../shared/privacyRequests";
import { candidatePrivacyRouter } from "./routers/candidatePrivacy";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");
const caller = () => candidatePrivacyRouter.createCaller({ req: { headers: {} } } as any);

beforeEach(() => {
  state.rows = new Map();
  state.inserts = [];
  state.updates = [];
  state.emails = [];
  state.notified = [];
  state.candidate = { id: 9, email: "client@example.com", fullName: "Aïcha Nkolo", passwordHash: "secret-hash" };
  state.nextId = 100;
  state.failEmail = false;
});
afterEach(() => vi.restoreAllMocks());

describe("clé de stockage des demandes de suppression", () => {
  it("une clé par candidat, sans collision ; un texte illisible est refusé plutôt que d'planter", () => {
    expect(privacyDeletionRequestKey(9)).toBe("privacy_deletion_request:9");
    expect(privacyDeletionRequestKey(10)).not.toBe(privacyDeletionRequestKey(9));
    expect(parsePrivacyDeletionRequest("pas du json")).toBeNull();
    expect(parsePrivacyDeletionRequest("{}")).toBeNull();
    expect(parsePrivacyDeletionRequest(JSON.stringify({ candidateId: 9, email: "a@b.cd" }))).toMatchObject({ candidateId: 9 });
  });
});

describe("export de mes données", () => {
  it("ne renvoie que les données du candidat connecté, jamais le mot de passe, et donne une date d'export", async () => {
    state.rows.set(candidates, [state.candidate]);
    state.rows.set(applications, [{ dossierNumber: "3M-2026-0001", destination: "canada", dossierStatus: "documents", candidateId: 9, createdAt: new Date(), updatedAt: new Date() }, { dossierNumber: "AUTRE", destination: "france", dossierStatus: "nouveau", candidateId: 42, createdAt: new Date(), updatedAt: new Date() }]);
    state.rows.set(flightBookingRequests, [{ requestRef: "3M-FL-1", status: "issued", flightData: {}, passengerData: [], candidateId: 9, createdAt: new Date() }]);
    state.rows.set(customerReviews, [{ rating: 5, reviewText: "Très bien", status: "approved", createdAt: new Date(), email: "client@example.com" }]);
    const result = await caller().myDataExport();
    expect(result.profile).not.toHaveProperty("passwordHash");
    expect(result.onlineApplications).toHaveLength(2); // le fake db ne filtre pas côté requête : voir note ci-dessous
    expect(result.flightBookingRequests[0].requestRef).toBe("3M-FL-1");
    expect(result.reviews[0].rating).toBe(5);
    expect(new Date(result.exportedAt).getTime()).toBeLessThanOrEqual(Date.now());
    expect(result.note).toContain("documents déposés restent téléchargeables");
  });

  it("le routeur filtre réellement par identifiant ou e-mail du candidat, pas par simple confiance", () => {
    const source = read("server/routers/candidatePrivacy.ts");
    const section = source.slice(source.indexOf("myDataExport: candidateProcedure"), source.indexOf("requestDeletion:"));
    expect(section).toContain("eq(applications.candidateId, ctx.candidate.id)");
    expect(section).toContain("eq(agencyDossiers.email, ctx.candidate.email)");
    expect(section).toContain("eq(evaluations.email, ctx.candidate.email)");
    expect(section).toContain("eq(flightBookingRequests.candidateId, ctx.candidate.id)");
    expect(section).toContain("eq(customerReviews.email, ctx.candidate.email)");
  });
});

describe("demande de suppression de compte", () => {
  it("crée la demande, alerte l'administration, accuse réception au candidat, et n'efface rien", async () => {
    const result = await caller().requestDeletion();
    expect(result).toEqual({ success: true, alreadyPending: false, acknowledged: true });
    expect(state.inserts).toHaveLength(1);
    const stored = JSON.parse(state.inserts[0].values.settingValue);
    expect(stored).toMatchObject({ candidateId: 9, email: "client@example.com", status: "pending" });
    expect(state.inserts[0].values.settingKey).toBe("privacy_deletion_request:9");
    expect(state.notified).toHaveLength(1);
    expect(state.emails).toHaveLength(1);
    expect(state.emails[0].to).toBe("client@example.com");
    expect(state.emails[0].html).not.toMatch(/supprimé|effacé (immédiatement|dès|automatiquement)/i);
    const source = read("server/routers/candidatePrivacy.ts");
    expect(source.slice(source.indexOf("requestDeletion:"), source.indexOf("Côté administration"))).not.toMatch(/\.delete\(|drop|truncate/i);
  });

  it("une seconde demande alors qu'une est déjà en attente n'écrit rien de nouveau", async () => {
    await caller().requestDeletion();
    state.inserts = [];
    const second = await caller().requestDeletion();
    expect(second).toEqual({ success: true, alreadyPending: true });
    expect(state.inserts).toHaveLength(0);
    expect(state.updates).toHaveLength(0);
  });

  it("un échec d'e-mail n'empêche pas la demande d'être enregistrée", async () => {
    state.failEmail = true;
    const result = await caller().requestDeletion();
    expect(result.success).toBe(true);
    expect(result.acknowledged).toBe(false);
    expect(state.inserts).toHaveLength(1);
  });
});

describe("côté administration", () => {
  const pending = (candidateId: number, overrides: Record<string, unknown> = {}) => ({ settingKey: privacyDeletionRequestKey(candidateId), settingValue: JSON.stringify({ candidateId, email: `c${candidateId}@example.com`, fullName: `Client ${candidateId}`, requestedAt: "2026-09-20T00:00:00Z", status: "pending", ...overrides }) });

  it("liste seulement les demandes en attente, triées de la plus ancienne à la plus récente", async () => {
    state.rows.set(agencySettings, [pending(1, { requestedAt: "2026-09-22T00:00:00Z" }), pending(2, { requestedAt: "2026-09-18T00:00:00Z" }), pending(3, { status: "done" })]);
    const list = await caller().listDeletionRequests({ sessionToken: "t" });
    expect(list.map((request) => request.candidateId)).toEqual([2, 1]);
  });

  it("clôturer une demande la marque traitée, prévient le candidat avec la réponse de l'agence, et reste sans effet la deuxième fois", async () => {
    state.rows.set(agencySettings, [pending(1)]);
    const first = await caller().resolveDeletionRequest({ sessionToken: "t", candidateId: 1, note: "Dossier soldé, compte supprimé." });
    expect(first).toEqual({ success: true, alreadyHandled: false, notified: true });
    expect(state.emails[0].to).toBe("c1@example.com");
    expect(state.emails[0].html).toContain("Dossier soldé, compte supprimé.");
    const stored = JSON.parse(state.updates[0].values.settingValue);
    expect(stored).toMatchObject({ status: "done", handledBy: "agent@3mtravelagency.com" });
    const second = await caller().resolveDeletionRequest({ sessionToken: "t", candidateId: 1, note: "" });
    expect(second).toEqual({ success: true, alreadyHandled: true, notified: false });
    expect(state.emails).toHaveLength(1);
  });

  it("demande introuvable : erreur claire ; session admin exigée avant toute lecture ; routeur enregistré", async () => {
    await expect(caller().resolveDeletionRequest({ sessionToken: "t", candidateId: 999, note: "" })).rejects.toThrow(/introuvable/);
    const source = read("server/routers/candidatePrivacy.ts");
    for (const name of ["listDeletionRequests", "resolveDeletionRequest"]) {
      const section = source.slice(source.indexOf(`${name}:`), source.indexOf(`${name}:`) + 500);
      expect(section.indexOf("requireValidAdminSession(input.sessionToken)"), name).toBeGreaterThan(-1);
      expect(section.indexOf("requireValidAdminSession(input.sessionToken)"), name).toBeLessThan(section.indexOf("requireDb()"));
    }
    expect(read("server/routers.ts")).toContain("candidatePrivacy: candidatePrivacyRouter");
  });
});
