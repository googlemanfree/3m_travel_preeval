import { describe, expect, it } from "vitest";
import {
  clientPhaseLabel,
  describeClientDossierPhase,
  resolveClientDossierPhase,
} from "../shared/clientDossierPhases";
import { resolveGuidedNextAdminAction, ADMIN_STAGE_CATALOG } from "../shared/adminStageCatalog";
import { evaluateAdminStageTransition } from "../shared/transitionGuards";
import { CLIENT_DOSSIER_STATUS_LABELS, clientStatusLabel } from "../shared/dossierProgress";

describe("phases client — peu de libellés stables", () => {
  it("regroupe les micro-statuts en phases lisibles", () => {
    expect(resolveClientDossierPhase("bilan_envoye")).toBe("opening");
    expect(resolveClientDossierPhase("en_attente_paiement")).toBe("opening");
    expect(resolveClientDossierPhase("paye")).toBe("opening");
    expect(resolveClientDossierPhase("soumis_agences")).toBe("processing");
    expect(resolveClientDossierPhase("recherche_employeur")).toBe("processing");
    expect(resolveClientDossierPhase("validation_adem")).toBe("processing");
    expect(resolveClientDossierPhase("contrat_obtenu")).toBe("processing");
    expect(clientPhaseLabel("visa_approuve")).toBe("Décision favorable");
    expect(clientPhaseLabel("refuse")).toBe("Décision défavorable");
    expect(clientPhaseLabel("en_attente_documents")).toBe("Documents à compléter");
  });

  it("n’expose jamais plus de 8 libellés distincts côté client", () => {
    const labels = new Set(Object.values(CLIENT_DOSSIER_STATUS_LABELS));
    expect(labels.size).toBeLessThanOrEqual(8);
    for (const label of labels) {
      expect(label).not.toMatch(/48h|Consulaire|Collecte Documents|Visa Accordé|ADEM/i);
    }
  });

  it("chaque phase a un détail sans jargon admin", () => {
    const info = describeClientDossierPhase("soumis");
    expect(info.label).toBe("Traitement en cours");
    expect(info.detail.length).toBeGreaterThan(20);
    expect(clientStatusLabel("inconnu")).toBe("Suivi en cours");
  });
});

describe("cohérence décision favorable / employeur", () => {
  it("bloque APPROVED sans sélection employeur sur une procédure travail", () => {
    const blocked = evaluateAdminStageTransition({
      targetStage: "APPROVED",
      paymentConfirmed: true,
      protocolSigned: true,
      pendingRequiredDocuments: 0,
      checklistPercent: 100,
      procedureKind: "work",
      employerSelected: false,
    });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.code).toBe("employer_required");
  });

  it("autorise APPROVED travail après sélection employeur", () => {
    const ok = evaluateAdminStageTransition({
      targetStage: "APPROVED",
      paymentConfirmed: true,
      protocolSigned: true,
      pendingRequiredDocuments: 0,
      checklistPercent: 100,
      procedureKind: "work",
      employerSelected: true,
      secondProtocolReady: true,
      secondProtocolSigned: true,
    });
    expect(ok).toEqual({ ok: true });
  });

  it("la prochaine action guidée n’affiche pas Décision favorable sans employeur", () => {
    const guided = resolveGuidedNextAdminAction({
      currentStatus: "SUBMITTED",
      paymentConfirmed: true,
      procedureKind: "work",
      employerSelected: false,
    });
    expect(guided.canAdvance).toBe(false);
    expect(guided.code).toBe("employer_selection");
    expect(guided.buttonLabel).toMatch(/employeur/i);
    expect(guided.buttonLabel).not.toMatch(/favorable|Visa Accordé/i);
  });

  it("le catalogue admin expose détail + phase client pour chaque étape", () => {
    for (const stage of Object.keys(ADMIN_STAGE_CATALOG) as Array<keyof typeof ADMIN_STAGE_CATALOG>) {
      expect(ADMIN_STAGE_CATALOG[stage].detail.length).toBeGreaterThan(10);
      expect(ADMIN_STAGE_CATALOG[stage].clientLabel.length).toBeGreaterThan(3);
      expect(ADMIN_STAGE_CATALOG[stage].prerequisites.length).toBeGreaterThan(0);
    }
  });
});
