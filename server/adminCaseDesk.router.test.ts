import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { caseActivityLogs, caseDocuments, clientNotifications, documentRequirements } from "../drizzle/caseTrackingSchema";

const h = vi.hoisted(() => ({
  requirements: [] as any[],
  documentCount: 0,
  inserts: [] as Array<{ table: unknown; values: any }>,
  updates: [] as Array<{ table: unknown; values: any }>,
  stored: [] as Array<{ key: string; type: string; size: number }>,
}));

vi.mock("./routers/adminAuth", () => ({
  requireValidAdminSession: async (token: string) => {
    if (token !== "ok") throw new TRPCError({ code: "UNAUTHORIZED", message: "Session administrateur invalide." });
    return { id: 1, email: "admin@3m.cm" };
  },
}));
vi.mock("./routers/admin", () => ({
  parseAdminCandidateReference: (value: string) => {
    const match = /^(online|agency)-(\d+)$/.exec(value);
    return match ? { source: match[1], id: Number(match[2]) } : null;
  },
  ensureOperationalCase: async () => ({ id: 7, candidateId: 99 }),
}));
vi.mock("./storage", () => ({
  storagePut: async (key: string, data: Buffer, type: string) => {
    h.stored.push({ key, type, size: data.length });
    return { key, url: `/manus-storage/${key}` };
  },
}));
vi.mock("./db", () => ({
  getDb: async () => ({
    select: (fields?: unknown) => ({
      from: () => ({
        where: () => {
          const isCount = Boolean(fields && typeof fields === "object" && "total" in (fields as object));
          const rows = isCount ? [{ total: h.documentCount }] : h.requirements;
          const query: any = Promise.resolve(rows);
          query.limit = async () => rows.slice(0, 1);
          return query;
        },
      }),
    }),
    insert: (table: unknown) => ({ values: async (values: any) => { h.inserts.push({ table, values }); return [{ insertId: 55 }]; } }),
    update: (table: unknown) => ({ set: (values: any) => ({ where: async () => { h.updates.push({ table, values }); } }) }),
  }),
}));

import { adminCaseDeskRouter } from "./routers/adminCaseDesk";

const caller = () => adminCaseDeskRouter.createCaller({ req: { headers: {} } } as any);
const PDF_B64 = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x00]).toString("base64");
const base = { sessionToken: "ok", candidateId: "online-12" };
const insertsOf = (table: unknown) => h.inserts.filter((entry) => entry.table === table).map((entry) => entry.values);
const updatesOf = (table: unknown) => h.updates.filter((entry) => entry.table === table).map((entry) => entry.values);

beforeEach(() => {
  h.requirements = [{ id: 5, caseId: 7, documentType: "Passeport", status: "pending", adminComment: "Valide 6 mois", isRequired: true }];
  h.documentCount = 0;
  h.inserts = [];
  h.updates = [];
  h.stored = [];
});

describe("accès", () => {
  it("chaque procédure exige une session administrateur valide et ne stocke ni n'écrit rien sans elle", async () => {
    const denied = { sessionToken: "faux", candidateId: "online-12" };
    await expect(caller().depositDocument({ ...denied, requirementId: 5, fileName: "a.pdf", base64: PDF_B64, validate: false })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller().setRequirementStatus({ ...denied, requirementId: 5, status: "approved" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller().addRequirement({ ...denied, documentType: "CV" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(h.stored).toHaveLength(0);
    expect(h.inserts).toHaveLength(0);
    expect(h.updates).toHaveLength(0);
  });

  it("refuse une référence de candidat invalide", async () => {
    await expect(caller().setRequirementStatus({ sessionToken: "ok", candidateId: "n-importe-quoi", requirementId: 5, status: "approved" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("dépôt d'un document remis en agence", () => {
  it("stocke le fichier, l'enregistre comme remis en agence, passe la pièce à « à vérifier » et prévient le candidat", async () => {
    h.documentCount = 1;
    const result = await caller().depositDocument({ ...base, requirementId: 5, fileName: "passeport.pdf", base64: PDF_B64, receivedAt: "2026-09-20", note: "Original vu au comptoir", validate: false });
    expect(result).toMatchObject({ success: true, documentId: 55, status: "received" });
    expect(h.stored).toHaveLength(1);
    expect(h.stored[0]).toMatchObject({ type: "application/pdf" });
    expect(h.stored[0].key).toMatch(/^case-documents\/7\/req-5\//);

    const [document] = insertsOf(caseDocuments);
    expect(document).toMatchObject({ caseId: 7, candidateId: 99, documentType: "Passeport", uploadedByRole: "agency", reviewStatus: "received", mimeType: "application/pdf", versionNo: 2, reviewNote: "Original vu au comptoir", reviewedAt: null });
    expect(document.fileKey).toBe(h.stored[0].key);
    expect(document.uploadedAt.toISOString().slice(0, 10)).toBe("2026-09-20");
    expect(updatesOf(documentRequirements)[0]).toMatchObject({ status: "received", validatedAt: null });

    const [notification] = insertsOf(clientNotifications);
    expect(notification).toMatchObject({ candidateId: 99, caseId: 7, type: "document_received_agency", isRead: false, actionUrl: "/mon-espace?section=documents" });
    expect(notification.title).toBe("Document reçu en agence : Passeport");
    expect(insertsOf(caseActivityLogs)[0]).toMatchObject({ caseId: 7, actorRole: "admin", actorId: 1, actionType: "document_deposited_by_agency" });
  });

  it("validé sur place : la pièce est validée tout de suite et le candidat en est informé", async () => {
    const result = await caller().depositDocument({ ...base, requirementId: 5, fileName: "passeport.pdf", base64: PDF_B64, validate: true });
    expect(result.status).toBe("approved");
    expect(insertsOf(caseDocuments)[0]).toMatchObject({ reviewStatus: "approved" });
    expect(insertsOf(caseDocuments)[0].reviewedAt).toBeInstanceOf(Date);
    expect(updatesOf(documentRequirements)[0].status).toBe("approved");
    expect(insertsOf(clientNotifications)[0].type).toBe("document_approved");
  });

  it("refuse un fichier invalide avant tout stockage", async () => {
    const junk = Buffer.from("MZ exécutable").toString("base64");
    await expect(caller().depositDocument({ ...base, requirementId: 5, fileName: "facture.pdf", base64: junk, validate: false })).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringMatching(/Format non accepté/) });
    expect(h.stored).toHaveLength(0);
    expect(h.inserts).toHaveLength(0);
  });

  it("refuse une pièce qui n'appartient pas à ce dossier", async () => {
    h.requirements = [];
    await expect(caller().depositDocument({ ...base, requirementId: 999, fileName: "a.pdf", base64: PDF_B64, validate: false })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(h.stored).toHaveLength(0);
  });

  it("une pièce hors checklist est ajoutée à la checklist, pour que le candidat la voie", async () => {
    await caller().depositDocument({ ...base, documentType: "Attestation d'hébergement", fileName: "hebergement.pdf", base64: PDF_B64, validate: false });
    expect(insertsOf(documentRequirements)[0]).toMatchObject({ caseId: 7, documentType: "Attestation d'hébergement", status: "received", isRequired: true });
    expect(insertsOf(caseDocuments)[0].documentType).toBe("Attestation d'hébergement");
  });

  it("exige de préciser la pièce concernée", async () => {
    await expect(caller().depositDocument({ ...base, fileName: "a.pdf", base64: PDF_B64, validate: false })).rejects.toBeTruthy();
  });

  it("un échec d'enregistrement de la notification ne fait pas échouer le dépôt", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const original = h.inserts.push.bind(h.inserts);
    h.inserts.push = ((entry: { table: unknown; values: any }) => {
      if (entry.table === clientNotifications) throw new Error("table absente");
      return original(entry);
    }) as typeof h.inserts.push;
    await expect(caller().depositDocument({ ...base, requirementId: 5, fileName: "a.pdf", base64: PDF_B64, validate: false })).resolves.toMatchObject({ success: true });
    warn.mockRestore();
  });
});

describe("décision sur une pièce", () => {
  it("refuse « à corriger » sans explication utile, puis l'accepte avec elle et prévient le candidat", async () => {
    await expect(caller().setRequirementStatus({ ...base, requirementId: 5, status: "rejected" })).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringMatching(/corriger/) });
    expect(h.updates).toHaveLength(0);
    await caller().setRequirementStatus({ ...base, requirementId: 5, status: "rejected", comment: "Photo floue : scannez les deux pages." });
    expect(updatesOf(documentRequirements)[0]).toMatchObject({ status: "rejected", adminComment: "Photo floue : scannez les deux pages.", validatedAt: null });
    expect(updatesOf(documentRequirements)[0].rejectedAt).toBeInstanceOf(Date);
    const [notification] = insertsOf(clientNotifications);
    expect(notification.type).toBe("document_rejected");
    expect(notification.body).toContain("scannez les deux pages");
  });

  it("valider : date de validation posée, consigne d'origine conservée, candidat prévenu", async () => {
    await caller().setRequirementStatus({ ...base, requirementId: 5, status: "approved" });
    const update = updatesOf(documentRequirements)[0];
    expect(update.status).toBe("approved");
    expect(update.validatedAt).toBeInstanceOf(Date);
    expect(insertsOf(clientNotifications)[0].type).toBe("document_approved");
  });

  it("non requise et rouvrir sont enregistrées et annoncées", async () => {
    await caller().setRequirementStatus({ ...base, requirementId: 5, status: "waived" });
    await caller().setRequirementStatus({ ...base, requirementId: 5, status: "pending" });
    expect(updatesOf(documentRequirements).map((update) => update.status)).toEqual(["waived", "pending"]);
    expect(insertsOf(clientNotifications).map((notification) => notification.type)).toEqual(["document_waived", "document_requested"]);
  });

  it("refuse une donnée sensible dans le commentaire visible du candidat", async () => {
    await expect(caller().setRequirementStatus({ ...base, requirementId: 5, status: "rejected", comment: "Passeport CE1234567 illisible" })).rejects.toBeTruthy();
    expect(h.updates).toHaveLength(0);
  });
});

describe("ajout d'une pièce", () => {
  it("ajoute une pièce à fournir, avec précision et échéance, et prévient le candidat", async () => {
    h.requirements = [{ id: 5, documentType: "Passeport" }];
    await caller().addRequirement({ ...base, documentType: "Attestation d'hébergement", comment: "Datée de moins de 3 mois", dueAt: "2026-10-15" });
    const [row] = insertsOf(documentRequirements);
    expect(row).toMatchObject({ caseId: 7, documentType: "Attestation d'hébergement", status: "pending", isRequired: true, adminComment: "Datée de moins de 3 mois" });
    expect(row.dueAt.toISOString().slice(0, 10)).toBe("2026-10-15");
    expect(insertsOf(clientNotifications)[0].type).toBe("document_requested");
  });

  it("refuse un doublon (sans tenir compte de la casse)", async () => {
    h.requirements = [{ id: 5, documentType: "Passeport" }];
    await expect(caller().addRequirement({ ...base, documentType: "  passeport " })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(h.inserts).toHaveLength(0);
  });
});
