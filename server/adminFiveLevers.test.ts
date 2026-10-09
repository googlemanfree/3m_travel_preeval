import { describe, expect, it } from "vitest";
import { buildCountryProcedureDocumentChecklist, summarizeCountryProcedureChecklist } from "../shared/countryProcedureChecklist";
import { evaluateAdminStageTransition } from "../shared/transitionGuards";
import { buildJourneyStepSla, slaDaysForJourneyStep, suggestedDueAtForAdminStage } from "../shared/journeyStepSla";
import { describeSecondProtocolState, dualOpportunityHandoffMessage } from "../shared/secondAgreementProtocol";

describe("checklist pays/procédure", () => {
  it("fusionne pièces pays, procédure et parcours sans inventer de doublons", () => {
    const checklist = buildCountryProcedureDocumentChecklist({
      destination: "Luxembourg",
      procedureType: "travail",
      customDocuments: ["Attestation ADEM"],
    });
    expect(checklist.label.toLowerCase()).toMatch(/travail|permis/);
    expect(checklist.documents.length).toBeGreaterThan(5);
    expect(checklist.documents.some((line) => /passeport/i.test(line.documentType))).toBe(true);
    expect(checklist.documents.some((line) => line.documentType === "Attestation ADEM")).toBe(true);
    const labels = checklist.documents.map((line) => line.documentType.toLowerCase());
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("calcule la progression à partir des pièces déjà déposées", () => {
    const snapshot = summarizeCountryProcedureChecklist({
      destination: "Canada",
      procedureType: "etudes",
      documents: [
        { documentType: "Passeport valide", verificationStatus: "verified" },
        { documentType: "Lettre d’admission", status: "received" },
      ],
    });
    expect(snapshot.total).toBeGreaterThan(0);
    expect(snapshot.verified + snapshot.received).toBeGreaterThan(0);
    expect(snapshot.percent).toBeGreaterThan(0);
  });
});

describe("gardes de transition", () => {
  it("bloque la soumission sans paiement ni protocole", () => {
    const blocked = evaluateAdminStageTransition({
      targetStage: "SUBMITTED",
      paymentConfirmed: false,
      protocolSigned: false,
      pendingRequiredDocuments: 0,
      checklistPercent: 100,
    });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.code).toBe("payment_required");
  });

  it("autorise documents_check après paiement et protocole", () => {
    const ok = evaluateAdminStageTransition({
      targetStage: "DOCUMENTS_CHECK",
      paymentConfirmed: true,
      protocolSigned: true,
      evaluationClientConfirmed: true,
    });
    expect(ok).toEqual({ ok: true });
  });

  it("exige le protocole 02 signé avant APPROVED s’il a été proposé", () => {
    const blocked = evaluateAdminStageTransition({
      targetStage: "APPROVED",
      paymentConfirmed: true,
      protocolSigned: true,
      pendingRequiredDocuments: 0,
      checklistPercent: 100,
      secondProtocolReady: true,
      secondProtocolSigned: false,
    });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.code).toBe("protocol_two_required");
  });
});

describe("SLA par étape", () => {
  it("associe un délai cohérent aux étapes documents et décision", () => {
    expect(slaDaysForJourneyStep("supporting_documents")).toBe(10);
    expect(slaDaysForJourneyStep("decision")).toBe(30);
    expect(suggestedDueAtForAdminStage("DOCUMENTS_CHECK").getTime()).toBeGreaterThan(Date.now());
  });

  it("produit un snapshot SLA pour un parcours Canada études", () => {
    const sla = buildJourneyStepSla({
      destination: "Canada",
      visaType: "études",
      procedureLabel: "Permis d'études",
      internalStatus: "en_attente_documents",
      paymentConfirmed: true,
      now: new Date("2026-10-09T12:00:00Z"),
      stepEnteredAt: new Date("2026-10-01T12:00:00Z"),
    });
    expect(sla.slaDays).toBeGreaterThan(0);
    expect(sla.label).toMatch(/SLA/);
    expect(sla.dueAt).toBeInstanceOf(Date);
  });
});

describe("Protocole N°02 et double opportunité", () => {
  it("décrit les bloqueurs avant activation", () => {
    const state = describeSecondProtocolState({
      destination: "luxembourg",
      paymentConfirmed: true,
      protocolOneSigned: true,
      secondProtocolReady: false,
    });
    expect(state.canSign).toBe(false);
    expect(state.formulas?.length).toBe(3);
    expect(state.blockers.some((item) => /sélection/i.test(item))).toBe(true);
  });

  it("autorise la signature quand la sélection est complète avec formule", () => {
    const state = describeSecondProtocolState({
      destination: "luxembourg",
      paymentConfirmed: true,
      protocolOneSigned: true,
      secondProtocolReady: true,
      employerName: "Employeur SA",
      positionTitle: "Aide-soignant",
      formulaChosen: "integral",
    });
    expect(state.canSign).toBe(true);
    expect(state.blockers).toEqual([]);
  });

  it("génère un message de handoff multi-procédures", () => {
    const message = dualOpportunityHandoffMessage({
      currentProcedure: "travail",
      siblingProcedures: [{ projectType: "etudes", folderCode: "3M-2026-0002", destinationCountry: "Canada" }],
    });
    expect(message).toMatch(/Double opportunité/);
    expect(message).toContain("3M-2026-0002");
  });
});
