import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("redirection Google et suivi candidat", () => {
  it("affiche un état de progression accessible pendant la redirection Google", () => {
    const login = read("client/src/pages/Login.tsx");
    expect(login).toContain("isGoogleRedirecting");
    expect(login).toContain('role="status"');
    expect(login).toContain('role="progressbar"');
    expect(login).toContain("Progression de la connexion Google");
    expect(login).toContain("Ne fermez pas cette fenêtre");
  });

  // TODO-VERIFY: legacy feature not found in EvaluationSpace.tsx after ClientDashboard.tsx removal — confirm intentionally dropped or re-add.
  // EvaluationSpace.tsx now reads cProfile.dossierStatus directly from the unified dashboard payload
  // (no dossierData/app fallback chain), and client/src/components/DossierProgressTimeline.tsx (the
  // current status-progress renderer) does not use the aria-labels or currentStatus.action asserted below.
  it("utilise le statut réel du dossier et expose une progression synchronisée", () => {
    const dashboard = read("client/src/pages/EvaluationSpace.tsx");
    expect(dashboard).toContain('dossierStatus={cProfile.dossierStatus}');
    expect(dashboard).toContain('<DossierProgressTimeline');
    expect(dashboard).toContain('currentDossierStatusLabel');
    expect(dashboard).toContain('Avancement de votre procédure');
    expect(dashboard).not.toContain('status: "draft"');
  });

  it("priorise les prérequis du dossier dans l’espace candidat", () => {
    const space = read("client/src/pages/EvaluationSpace.tsx");
    const router = read("server/routers/candidate.ts");
    expect(router).toContain("showAgreementAfterPayment");
    expect(router).toContain("evaluationRequired");
    expect(space).toContain("Évaluation rapide à compléter");
    expect(space).toContain("Signez votre protocole d’accord");
    expect(space).toContain('switchToSection("dossier")');
    expect(space).toContain("<ClientSpaceNavigation compact />");
  });

  it("réduit les raccourcis aux services actifs et maintient le suivi du dossier accessible", () => {
    const navigation = read("client/src/components/ClientSpaceNavigation.tsx");
    expect(navigation).toContain("visibleQuickLinks");
    expect(navigation).toContain('{ href: "/mon-espace?section=dossier", label: "Mon dossier"');
    expect(navigation).toContain("!compact &&");
  });

  it("regroupe les documents à signer sans mélanger les documents ordinaires", () => {
    const space = read("client/src/pages/EvaluationSpace.tsx");
    const signatures = read("client/src/components/SignableDocumentsPanel.tsx");
    expect(space).toContain('id: "signatures", label: "Documents à signer"');
    expect(space).toContain("<SignableDocumentsPanel");
    expect(signatures).toContain("Protocole d’accord 3M Travel &amp; Services");
    expect(signatures).toContain("Le protocole sera rendu signable après la confirmation du paiement.");
    expect(signatures).toContain("documentsToSign");
  });
});
