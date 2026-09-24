import { describe, expect, it } from "vitest";
import { maskPersonalData } from "./services/cvExcerpt";
import { buildDeclaredProfile, buildStructuredPrompt, type EvaluationRowForDraft } from "./services/structuredEvaluationDraft";

const NOW = new Date("2026-09-24T09:00:00.000Z");
const row = (overrides: Partial<EvaluationRowForDraft> = {}): EvaluationRowForDraft => ({
  id: 7,
  fullName: "Aïcha Nkolo",
  destinationCountry: "Canada",
  destinationCategory: "canada",
  visaType: "canada_travail",
  projectType: "travail",
  projectDetailsJson: JSON.stringify({ preparatoryAnalysisConsent: true }),
  ...overrides,
});

describe("masquage des coordonnées dans les textes libres", () => {
  it("masque téléphone, e-mail, lien, passeport et longue suite de chiffres, et compte les masquages", () => {
    const { text, masked } = maskPersonalData("Appelez-moi au +237 6 98 10 48 32 ou a.nkolo@example.com, cv sur https://linkedin.com/in/aicha, passeport CE1234567, compte 12345678901.");
    expect(text).not.toMatch(/698|10 48|@|linkedin|CE1234567|12345678901/);
    expect(masked).toBe(5);
  });

  it("masque un numéro local avec un chiffre isolé devant, et le format nord-américain", () => {
    expect(maskPersonalData("tél 6 98 10 48 32").text).toBe("tél [numéro]");
    expect(maskPersonalData("tél 698 10 48 32").text).toBe("tél [numéro]");
    expect(maskPersonalData("Montréal (514) 555-0123 ou 514 555 0123").text).toBe("Montréal [numéro] ou [numéro]");
  });

  it("laisse intactes les données utiles à l'évaluation", () => {
    for (const useful of ["Hôpital Central 2018-2021", "Expérience : 3-5 ans", "Niveau B2, IELTS 6.5, TCF 480", "Licence 3 en gestion, promotion 2019", "Budget 3 500 000 FCFA", "Né en 1990, âge 34 ans"]) {
      expect(maskPersonalData(useful), useful).toEqual({ text: useful, masked: 0 });
    }
  });

  it("retire les caractères invisibles qui pourraient cacher un numéro ou une consigne", () => {
    const zeroWidth = String.fromCharCode(0x200b);
    expect(maskPersonalData(`a${zeroWidth}b`).text).toBe("ab");
  });
});

describe("le profil transmis au modèle ne contient aucune coordonnée du candidat", () => {
  const leaky = row({
    message: "Bonjour, joignez-moi au 698104832 ou 0033 6 12 34 56 78, ou à aicha@example.com.",
    mainTasks: "Soins infirmiers ; contact employeur : +237 677 88 99 00 ; www.hopital-central.cm",
    travelReason: "Rejoindre ma sœur (tél 6 98 10 48 32)",
    currentJobTitle: "Infirmière (passeport CE1234567)",
    projectDetailsJson: JSON.stringify({
      preparatoryAnalysisConsent: true,
      sector: "Santé, appelez le +237 6 98 10 48 32",
      dynamicResponses: [{ question: "Avez-vous un contact au Canada ?", answer: "Oui, mon cousin au (514) 555-0123" }],
    }),
  });

  it("masque chaque champ libre avant l'envoi", () => {
    const profile = buildDeclaredProfile(leaky, NOW);
    const serialized = JSON.stringify(profile);
    expect(serialized).not.toMatch(/698104832|0033|56 78|aicha@|677 88|hopital-central|98 10 48|tél 6 \[|CE1234567|514|555-0123/);
    expect(profile.candidateMessage).toContain("[numéro]");
    expect(profile.candidateMessage).toContain("[e-mail]");
    expect(profile.mainTasks).toContain("Soins infirmiers");
    expect(profile.currentJobTitle).toContain("Infirmière");
  });

  it("masque aussi les réponses complémentaires et les détails du projet", () => {
    const details = buildDeclaredProfile(leaky, NOW).projectDetails ?? {};
    expect(JSON.stringify(details)).not.toMatch(/6 98 10 48 32|514|555-0123/);
    expect(details.reponse_complementaire_1).toContain("Avez-vous un contact au Canada");
  });

  it("le prompt final ne contient aucune coordonnée", () => {
    const prompt = buildStructuredPrompt(buildDeclaredProfile(leaky, NOW));
    expect(prompt).not.toMatch(/698104832|aicha@|CE1234567|hopital-central|514|555-0123/);
  });

  it("masque avant de tronquer : un numéro à cheval sur la limite ne fuit pas en morceaux", () => {
    const message = `${"a ".repeat(395)}698104832 fin`;
    const candidate = buildDeclaredProfile(row({ message }), NOW).candidateMessage ?? "";
    expect(candidate).not.toMatch(/6981|98104|04832/);
  });

  it("un profil sans coordonnées reste identique", () => {
    const profile = buildDeclaredProfile(row({ mainTasks: "Coordination d'équipe et formation des stagiaires.", message: "Je souhaite déposer mon dossier en 2027." }), NOW);
    expect(profile.mainTasks).toBe("Coordination d'équipe et formation des stagiaires.");
    expect(profile.candidateMessage).toBe("Je souhaite déposer mon dossier en 2027.");
  });
});
