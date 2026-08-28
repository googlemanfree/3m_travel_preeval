import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { buildDocumentClarificationMessage } from "../client/src/components/DossierDocumentChecklist";

describe("buildDocumentClarificationMessage", () => {
  it("associe la demande à la pièce sans inclure de donnée interne", () => {
    expect(buildDocumentClarificationMessage("Passeport valide", "Quel format est accepté ?")).toBe(
      "Demande de clarification — pièce : Passeport valide\n\nQuel format est accepté ?",
    );
  });

  it("utilise une question neutre et borne le contenu lorsque le candidat ne précise rien", () => {
    const message = buildDocumentClarificationMessage("  Attestation   employeur ", "");
    expect(message).toContain("Attestation employeur");
    expect(message).toContain("Pouvez-vous préciser ce qui est attendu");
    expect(message.length).toBeLessThanOrEqual(2_000);
  });
});

describe("contrat de suivi des clarifications", () => {
  const root = path.resolve(import.meta.dirname, "..");
  const candidateRouter = fs.readFileSync(path.join(root, "server/routers/candidate.ts"), "utf8");
  const adminRouter = fs.readFileSync(path.join(root, "server/routers/admin.ts"), "utf8");
  const checklist = fs.readFileSync(path.join(root, "client/src/components/DossierDocumentChecklist.tsx"), "utf8");

  it("crée et restitue une demande structurée uniquement pour le candidat connecté", () => {
    expect(candidateRouter).toContain("requestDocumentClarification: candidateProcedure");
    expect(candidateRouter).toContain("getDocumentClarifications: candidateProcedure.query");
    expect(candidateRouter).toContain("eq(documentClarificationRequests.candidateId, ctx.candidate.id)");
    expect(candidateRouter).toContain('status: "pending"');
  });

  it("marque uniquement la clarification sélectionnée comme répondue et crée une notification cliente", () => {
    expect(adminRouter).toContain("clarificationRequestId: z.number().int().positive().optional()");
    expect(adminRouter).toContain("Cette demande ne correspond pas au candidat sélectionné");
    expect(adminRouter).toContain("buildDocumentClarificationAnsweredNotification(clarification.documentLabel)");
    expect(adminRouter).toContain('type: clarificationNotification?.type ?? "admin_message"');
    expect(adminRouter).toContain('status: "answered"');
    expect(adminRouter).toContain("answeredByAdminId: admin.id");
  });

  it("signale la demande en attente sans la compter comme une pièce reçue ou validée", () => {
    expect(checklist).toContain("En attente de réponse");
    expect(checklist).toContain('state.kind === "received" || state.kind === "verified"');
    expect(checklist).toContain("Précision demandée");
  });
});
