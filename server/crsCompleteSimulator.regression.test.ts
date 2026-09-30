import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../client/src/components/CanadaScoreSimulator.tsx", import.meta.url), "utf8");

describe("simulateur CRS complet", () => {
  it("propose un parcours guidé et une collecte de profil", () => {
    expect(source).toContain("Évaluation guidée 3M Travel");
    expect(source).toContain("crs-full-name");
    expect(source).toContain("crs-residence");
    expect(source).toContain("crs-test-date");
    expect(source).toContain("frenchReading");
    expect(source).toContain("englishSpeaking");
  });

  it("génère un lien partageable et un partage WhatsApp", () => {
    expect(source).toContain("shareProfile");
    expect(source).toContain("handleShareWhatsApp");
    expect(source).toContain("?crs=");
    expect(source).toContain("wa.me/237698104832");
  });

  it("anime les étapes et prépare l’envoi du PDF par e-mail", () => {
    expect(source).toContain('key="profile-step"');
    expect(source).toContain('key="criteria-step"');
    expect(source).toContain("handleEmailPdf");
    expect(source).toContain("navigator.share");
    expect(source).toContain("mailto:");
    expect(source).toContain("Envoyer le PDF par e-mail");
  });

  it("sauvegarde localement le brouillon et restaure le parcours", () => {
    expect(source).toContain("3m-crs-simulator-draft-v2");
    expect(source).toContain("isDraftLoaded");
    expect(source).toContain("Votre dernière simulation a été restaurée.");
    expect(source).toContain("languageScores");
  });

  it("affiche un récapitulatif éditable avant le partage", () => {
    expect(source).toContain("Vérifiez vos réponses avant le rapport");
    expect(source).toContain("Modifier le profil");
    expect(source).toContain("Modifier les critères");
    expect(source).toContain('key="review-step"');
  });

  it("insère les recommandations personnalisées dans le PDF", () => {
    expect(source).toContain("pdfRecommendations");
    expect(source).toContain("Recommandations personnalisées");
    expect(source).toContain("Point à travailler");
    expect(source).toContain("ne remplacent pas les règles officielles IRCC");
  });

	it("compose un PDF avec marque et coordonnées de l’agence", () => {
		expect(source).toContain("3M TRAVEL AGENCY");
		expect(source).toContain("pasted_file_lJvrPx_logo3Mfull_25c12e97.jpeg");
		expect(source).toContain("Yaoundé · Ottawa");
		expect(source).toContain("Résultats indicatifs, sans garantie d'invitation");
	});

	it("propose un rendez-vous en ligne depuis les résultats et le PDF", () => {
		expect(source).toContain('appointmentPath = "/consultation?source=crs-simulator"');
		expect(source).toContain("Prendre rendez-vous en ligne");
		expect(source).toContain("textWithLink");
		expect(source).toContain("appointmentUrl");
	});

	it("adapte le formulaire au programme canadien choisi", () => {
		expect(source).toContain("CANADA_PROGRAMS");
		expect(source).toContain('selectedProgram: CanadaProgram');
		expect(source).toContain("Programme ou voie envisagée");
		expect(source).toContain("Volet ou type de demande");
		expect(source).toContain("Informations propres à ce programme");
		expect(source).toContain("Programme de visa pour démarrage d’entreprise");
	});
});
