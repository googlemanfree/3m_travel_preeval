import { describe, expect, it } from "vitest";
import {
  buildProtocolOneRichText,
  buildProtocolTwoRichText,
  detectProtocolVisaKind,
  getCountryProtocolProfile,
  paymentReceiptCopyForVisa,
} from "../shared/agreementProtocolCountryTemplates";
import { buildPaymentReceiptEmailHtml } from "./utils/paymentReceipt";

const baseOne = {
  clientNomComplet: "Test Client",
  dossierRef: "3M-TEST-1",
  destinationProjet: "France",
  modePaiement: "Agence",
  dateHeurePaiement: "16/10/2026",
  conseillerEmail: "agent@3mtravelagency.com",
  empreinteSha: "abc123",
  clientIpAddress: "127.0.0.1",
  dateDuJour: "16/10/2026",
};

const baseTwo = {
  clientNomComplet: "Test Client",
  dossierRef: "3M-TEST-1",
  employeurNom: "Partenaire",
  posteRetenu: "Projet",
  systemTimestamp: "2026-10-16T10:00:00Z",
  clientIpAddress: "127.0.0.1",
  dateDuJour: "16/10/2026",
};

describe("protocoles N°01 / N°02 distincts par type de visa — tous pays", () => {
  it("détecte travail / études / visiteurs / famille", () => {
    expect(detectProtocolVisaKind("schengen_travail")).toBe("travail");
    expect(detectProtocolVisaKind("Visa études")).toBe("etudes");
    expect(detectProtocolVisaKind("visiteur")).toBe("visiteurs");
    expect(detectProtocolVisaKind("regroupement familial")).toBe("famille");
  });

  it("adapte Luxembourg / France / Allemagne — pas seulement le Canada", () => {
    const luxEtudes = getCountryProtocolProfile("Luxembourg", "études");
    expect(luxEtudes.procedureProgramLabel).toMatch(/études/i);
    expect(luxEtudes.procedureObjectClause).toMatch(/diplômes|relevés|cycle/i);

    const frVisiteurs = getCountryProtocolProfile("France", "visiteur");
    expect(frVisiteurs.procedureProgramLabel).toMatch(/visiteur/i);
    expect(frVisiteurs.employmentAuthority).toMatch(/non applicable/i);

    const deTravail = getCountryProtocolProfile("Allemagne", "travail");
    expect(deTravail.procedureProgramLabel).toMatch(/travail/i);
    expect(deTravail.procedureObjectClause).toMatch(/poste ouvert|vacance de poste|professionnel/i);
  });

  it("protocole N°01 études / visiteurs sans vacance de poste employeur", () => {
    const etudes = buildProtocolOneRichText(baseOne, "Luxembourg", "études");
    expect(etudes).toMatch(/DOSSIER ÉTUDES/i);
    expect(etudes).toMatch(/admission scolaire|lettre d'admission/i);
    expect(etudes.toLowerCase()).not.toContain("vacance de poste");
    expect(etudes.toLowerCase()).not.toContain("agences de placement");

    const visiteurs = buildProtocolOneRichText(
      { ...baseOne, destinationProjet: "France" },
      "France",
      "visiteur",
    );
    expect(visiteurs).toMatch(/VISITEURS|SÉJOUR TEMPORAIRE/i);
    expect(visiteurs).toMatch(/aucune promesse d'emploi|statut/i);
    expect(visiteurs.toLowerCase()).not.toContain("vacance de poste");

    const travail = buildProtocolOneRichText(
      { ...baseOne, destinationProjet: "Allemagne" },
      "Allemagne",
      "travail",
    );
    expect(travail).toMatch(/poste ouvert \(vacance de poste\)|vacance de poste/i);
    expect(travail).toMatch(/ni emploi, ni contrat de travail/i);
  });

  it("protocole N°02 adapte la mission (études ≠ employeur)", () => {
    const etudes = buildProtocolTwoRichText(baseTwo, "Canada", "études");
    expect(etudes).toMatch(/Permis d’études|lettre d'admission|permis d'études/i);
    expect(etudes).toMatch(/Établissement|Programme/i);

    const visiteurs = buildProtocolTwoRichText(baseTwo, "France", "tourisme");
    expect(visiteurs).toMatch(/séjour temporaire|Motif/i);
    expect(visiteurs.toLowerCase()).not.toContain("vacance de poste");
  });

  it("reçu de paiement aligné sur le type de visa", () => {
    const etudesCopy = paymentReceiptCopyForVisa("études");
    expect(etudesCopy.objectText).toMatch(/études|diplômes|relevés/i);
    expect(etudesCopy.objectText.toLowerCase()).not.toContain("placement");

    const html = buildPaymentReceiptEmailHtml({
      dossierNumber: "3M-TEST",
      fullName: "Aïcha",
      email: "a@test.com",
      amount: 65000,
      currency: "XAF",
      paymentDate: new Date("2026-10-16T10:00:00Z"),
      paymentMethod: "Agence",
      validatedBy: "agent@3mtravelagency.com",
      destination: "Luxembourg",
      visaType: "Études",
    });
    expect(html).toMatch(/dossier d’études|diplômes|relevés/i);
    expect(html.toLowerCase()).not.toContain("contrat de travail");
  });
});
