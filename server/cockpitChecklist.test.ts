import { describe, expect, it } from "vitest";
import { buildCandidateCockpit } from "../shared/candidateCockpit";

const base = { emailVerified: true, evaluationStatus: "validated", hasEvaluationRecord: true, receiptApproved: false, protocolSigned: false, pendingDocuments: 0, workflowStatus: "new" };
const item = (cockpit: ReturnType<typeof buildCandidateCockpit>, key: string) => cockpit.checklist.find((entry) => entry.key === key)!;

describe("checklist de contrôle : jamais de vert sans fait réel", () => {
  it("un dossier non payé n'est pas « activé », même si le dossier existe (cas des dossiers agence)", () => {
    const cockpit = buildCandidateCockpit({ ...base, paymentConfirmed: false, dossierActivated: true, hasAnyDocuments: true });
    expect(item(cockpit, "payment").done).toBe(false);
    expect(item(cockpit, "activation").done).toBe(false);
    const paid = buildCandidateCockpit({ ...base, paymentConfirmed: true, dossierActivated: true, hasAnyDocuments: true });
    expect(item(paid, "activation").done).toBe(true);
  });

  it("« Documents à jour » exige au moins une pièce déposée : aucun document envoyé n'est jamais « à jour », activé ou non", () => {
    for (const dossierActivated of [false, true]) {
      const none = buildCandidateCockpit({ ...base, paymentConfirmed: true, dossierActivated, hasAnyDocuments: false });
      expect(item(none, "documents").done, `activé=${dossierActivated}`).toBe(false);
    }
    expect(item(buildCandidateCockpit({ ...base, paymentConfirmed: true, dossierActivated: true, hasAnyDocuments: true }), "documents").done).toBe(true);
    expect(item(buildCandidateCockpit({ ...base, paymentConfirmed: true, dossierActivated: true, hasAnyDocuments: true, pendingDocuments: 2 }), "documents").done).toBe(false);
  });
});
