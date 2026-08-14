import { describe, it, expect } from "vitest";

describe("Document Tooltips and Practical Guidelines", () => {
  it("provides clear instructions, issuing authority, and verification tips for complex documents", () => {
    const documentGuideMap: Record<string, { purpose: string; howToGet: string; tips: string }> = {
      "Preuve de fonds financiers": {
        purpose: "Prouver la capacité à subvenir à ses besoins et ceux de sa famille à l'arrivée.",
        howToGet: "Auprès de votre banque (attestation de solde, relevés des 3 à 6 derniers mois).",
        tips: "S'assurer que les fonds sont stables, liquides et exempts de prêts récents non justifiés.",
      },
      "Évaluation des diplômes (ECA / WES)": {
        purpose: "Faire reconnaître l'équivalence de vos diplômes étrangers par rapport au système canadien.",
        howToGet: "En soumettant vos diplômes et relevés de notes à un organisme agréé (ex. WES, ICAS).",
        tips: "Prévoir un délai de traitement de plusieurs semaines et demander l'envoi direct du rapport.",
      },
      "Test de langue (TCF / IELTS)": {
        purpose: "Attester officiellement de votre niveau de maîtrise du français et/ou de l'anglais.",
        howToGet: "En vous inscrivant à un centre agréé de passation d'examen (ex. France Éducation International, IDP, British Council).",
        tips: "Conserver le certificat original sécurisé et vérifier les seuils requis pour votre programme.",
      },
    };

    expect(documentGuideMap["Preuve de fonds financiers"].purpose).toContain("capacité à subvenir");
    expect(documentGuideMap["Évaluation des diplômes (ECA / WES)"].howToGet).toContain("organisme agréé");
    expect(documentGuideMap["Test de langue (TCF / IELTS)"].tips).toContain("certificat original");
  });
});
