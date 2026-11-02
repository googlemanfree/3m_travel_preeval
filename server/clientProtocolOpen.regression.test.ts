import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/EvaluationSpace.tsx"), "utf8").replace(/\r\n/g, "\n");

describe("« Ouvrir le protocole » amène réellement le client à la signature", () => {
  it("les trois points d'entrée passent par openProtocol (bandeau, prochaine étape, onglet Documents à signer)", () => {
    expect(source).toContain("const openProtocol = () => {");
    expect(source).toContain("onClick={openProtocol} className=\"h-11 w-full shrink-0 bg-amber-700");
    expect(source).toContain("onOpenProtocol={openProtocol}");
    expect(source).toContain('if (step.id === "agreement") openProtocol();');
    // Aucun de ces boutons ne se contente plus de changer d'onglet.
    expect(source).not.toContain('onOpenProtocol={() => switchToSection("dossier")}');
  });

  it("la carte de signature a une ancre, défile jusqu'à l'écran et passe en tête du dossier quand la signature est attendue", () => {
    expect(source).toContain('<Card id="client-agreement-card" className="scroll-mt-24');
    expect(source).toContain('document.getElementById("client-agreement-card")?.scrollIntoView');
    const tabStart = source.indexOf('{activeTab === "dossier" && (evaluationRequired && !agreementAfterPaymentRequired');
    const firstContent = source.slice(tabStart, tabStart + 400);
    expect(firstContent).toContain("{agreementAfterPaymentRequired ? agreementProtocolCard : null}");
    // Une seule instance de la carte à l'écran : en tête si signature attendue, à sa place habituelle sinon.
    expect(source).toContain("{!agreementAfterPaymentRequired ? agreementProtocolCard : null}");
    expect((source.match(/id="client-agreement-card"/g) ?? []).length).toBe(1);
  });

  it("garde tout le parcours de signature (case, nom, signature, aperçu, PDF)", () => {
    for (const text of ["Protocole d’accord obligatoire", "Il reste visible ici jusqu’à sa signature.", "agency-agreement-sign-panel", "Prévisualiser le PDF signé", "Signer le protocole d’accord", "signAgreementProtocol"]) {
      expect(source, text).toContain(text);
    }
  });
});
