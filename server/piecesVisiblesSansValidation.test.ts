import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { caseDocuments, documentRequirements } from "../drizzle/caseTrackingSchema";
import {
  ensureRequirementsForDocuments,
  requirementMatchesDocumentType,
  requirementStatusForDocument,
} from "./services/caseDocumentRequirements";
import { REQUIREMENT_STATUS_LABELS, CRM_FILTER_LABELS, ROW_ACTION_LABELS } from "../client/src/lib/requirementsCrm";

const read = (path: string) => readFileSync(path, "utf8");

function makeDb(documents: Array<Record<string, unknown>>, requirements: Array<Record<string, unknown>>) {
  const inserts: Array<Record<string, unknown>> = [];
  const updates: Array<Record<string, unknown>> = [];
  const db = {
    select: () => ({
      from: (table: unknown) => {
        const rows = table === caseDocuments ? documents : table === documentRequirements ? requirements : [];
        const chain: any = { where: () => chain, orderBy: () => chain, limit: async () => rows, then: (resolve: (value: unknown) => void) => resolve(rows) };
        return chain;
      },
    }),
    insert: (table: unknown) => ({ values: async (values: Record<string, unknown>) => { if (table === documentRequirements) inserts.push(values); } }),
    update: (table: unknown) => ({ set: (values: Record<string, unknown>) => ({ where: async () => { if (table === documentRequirements) updates.push(values); } }) }),
  } as any;
  return { db, inserts, updates };
}

const doc = (over: Record<string, unknown>) => ({ id: 1, documentType: "Passeport", reviewStatus: "received", uploadedAt: new Date("2026-11-20T10:00:00Z"), ...over });
const requirement = (over: Record<string, unknown>) => ({ id: 10, caseId: 5, documentType: "Passeport", status: "pending", ...over });

describe("pièces visibles dès leur réception, sans validation", () => {
  it("une pièce reçue sans ligne correspondante crée une ligne « reçue », facultative, visible tout de suite", async () => {
    const { db, inserts } = makeDb([doc({ documentType: "Justificatifs de ressources" })], []);
    const result = await ensureRequirementsForDocuments(db, 5);
    expect(result).toEqual({ created: 1, promoted: 0 });
    expect(inserts[0]).toMatchObject({ caseId: 5, documentType: "Justificatifs de ressources", isRequired: false, status: "received" });
  });

  it("une pièce déjà rattachée à une ligne ne crée rien", async () => {
    const { db, inserts } = makeDb([doc({})], [requirement({ status: "received" })]);
    expect(await ensureRequirementsForDocuments(db, 5)).toEqual({ created: 0, promoted: 0 });
    expect(inserts).toHaveLength(0);
  });

  it("une ligne « à fournir » dont le fichier est déjà là passe à « reçue » : on ne la réclame plus au candidat", async () => {
    const { db, updates } = makeDb([doc({})], [requirement({ status: "pending" })]);
    expect(await ensureRequirementsForDocuments(db, 5)).toEqual({ created: 0, promoted: 1 });
    expect(updates[0]).toMatchObject({ status: "received" });
  });

  it("une pièce rejetée garde son statut rejeté (jamais rouverte automatiquement), une pièce validée reste validée", async () => {
    const rejected = makeDb([doc({ reviewStatus: "rejected" })], [requirement({ status: "pending" })]);
    expect(await ensureRequirementsForDocuments(rejected.db, 5)).toEqual({ created: 0, promoted: 0 });
    expect(requirementStatusForDocument("rejected")).toBe("rejected");
    expect(requirementStatusForDocument("correction_required")).toBe("rejected");
    expect(requirementStatusForDocument("approved")).toBe("approved");
    expect(requirementStatusForDocument("received")).toBe("received");
    expect(requirementStatusForDocument(undefined)).toBe("received");
  });

  it("une seule ligne par type de pièce, même avec plusieurs versions", async () => {
    const { db, inserts } = makeDb([doc({ id: 2, versionNo: 2 }), doc({ id: 1 })], []);
    expect((await ensureRequirementsForDocuments(db, 5)).created).toBe(1);
    expect(inserts).toHaveLength(1);
  });

  it("le rapprochement ignore accents et casse", () => {
    expect(requirementMatchesDocumentType("Relevés de notes", "releves de notes")).toBe(true);
    expect(requirementMatchesDocumentType("Passeport", "Diplôme")).toBe(false);
  });
});

describe("pièces visibles — branchements et libellés", () => {
  it("le rattachement est appelé à la publication candidat, à la publication agence, et à l'ouverture de la fiche", () => {
    expect(read("server/services/publishCandidateFilesToCase.ts")).toContain("await ensureRequirementsForDocuments(db, operational.id)");
    expect(read("server/services/publishAgencyDocumentsToCase.ts")).toContain('const { ensureRequirementsForDocuments } = await import("./caseDocumentRequirements")');
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("Rattrapage automatique, sans action de l'administrateur");
    expect(admin).toContain("await ensureRequirementsForDocuments(db, operationalCase.id)");
  });

  it("l'écran parle de pièces « reçues » (visibles) qu'on peut « rejeter », plus de « à vérifier » obligatoire", () => {
    expect(REQUIREMENT_STATUS_LABELS.received).toBe("Reçue");
    expect(CRM_FILTER_LABELS.to_review).toBe("Reçues");
    expect(ROW_ACTION_LABELS.reject).toBe("Rejeter");
    expect(REQUIREMENT_STATUS_LABELS.rejected).toContain("à corriger");
  });
});
