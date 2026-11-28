import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildProtocolOneRichText, detectProtocolVisaKind, paymentReceiptCopyForVisa, procedureStepLabels } from "../shared/agreementProtocolCountryTemplates";
import { getEnrichedCandidateJourney } from "../shared/candidateJourneyCatalog";
import { needsProcedureRefresh, resolveProcedureKind } from "../shared/procedureKind";
import { paymentNatureSentence, paymentNatureError } from "../shared/paymentNature";
import { applyReceiptDraft, validateReceiptDraft } from "./services/documentDrafts";
import { buildPaymentReceiptEmailHtml } from "./utils/paymentReceipt";

const vars: any = {
  clientNomComplet: "Aïcha Test", dossierRef: "3M-2026-0042", destinationProjet: "Canada", clientEmail: "a@x.test",
  montantValide: 150000, modePaiement: "Mobile Money", dateHeurePaiement: "01/01/2026", conseillerEmail: "c@x.test",
  empreinteSha: "abc", clientIpAddress: "-", dateDuJour: "01/01/2026",
};
const protocol = (destination: string, visa: string, extra: object = {}) => buildProtocolOneRichText({ ...vars, destinationProjet: destination, ...extra }, destination, visa);

describe("type de procédure canonique", () => {
  it.each([
    ["Canada RP", "residence"], ["canada_rp", "residence"], ["Résidence / installation", "residence"], ["Entrée Express", "residence"],
    ["Travail", "travail"], ["canada_travail", "travail"], ["Études", "etudes"], ["schengen_etude", "etudes"],
    ["Tourisme / visite", "visiteur"], ["Regroupement familial", "famille"], ["e-Visa / autorisation électronique", "evisa"], ["", "autre"],
  ])("%s → %s", (label, kind) => expect(resolveProcedureKind(label)).toBe(kind));
});

describe("le protocole suit la procédure choisie", () => {
  const rp = protocol("Canada", "Canada RP");
  const work = protocol("Canada", "Travail");
  const lux = protocol("Luxembourg", "Travail");
  const study = protocol("Canada", "Études");
  const visit = protocol("Canada", "Tourisme / visite");

  it("RP Canada n'a ni employeur ni EIMT, contrairement au travail", () => {
    expect(rp).toContain("RÉSIDENCE PERMANENTE");
    expect(rp).toContain("Résidence permanente (RP)");
    expect(rp).not.toContain("DÉPÔT DE SOUMISSION PARTENAIRES");
    expect(work).toContain("Permis de travail — Canada");
    expect(work).toContain("EIMT / LMIA");
    expect(rp).not.toContain("EIMT / LMIA ou exemption");
  });
  it("les six procédures donnent des textes différents", () => {
    expect(new Set([rp, work, lux, study, visit]).size).toBe(5);
    expect(lux).toContain("Luxembourg");
    expect(lux).toContain("ADEM");
  });
  it("chaque protocole annexe les étapes de SA procédure", () => {
    expect(rp).toContain("ANNEXE — Étapes de la procédure retenue");
    expect(rp).toContain("Invitation et dossier complet");
    expect(work).toContain("Demande de permis de travail IRCC");
    expect(study).toContain("Admission dans un établissement désigné (DLI)");
    expect(lux).toContain("Déclaration de poste vacant ADEM");
    expect(rp).not.toContain("Demande de permis de travail IRCC");
  });
  it("le numéro de dossier actif 3M-… figure avec l'ancienne référence de compte", () => {
    const text = protocol("Canada", "Canada RP", { ancienneReferenceCompte: "COMPTE-00012" });
    expect(text).toContain("Dossier actif n° 3M-2026-0042 (ancienne référence de compte : COMPTE-00012)");
  });
  it("avance ou somme totale : mentionné dans l'article 2 et l'article 1", () => {
    const avance = protocol("Canada", "Canada RP", { natureVersement: "avance", soldeRestant: 50000, devise: "XAF" });
    expect(avance).toContain("AVANCE");
    expect(avance).toContain("50 000 XAF");
    expect(avance).toContain("(avance)");
    const total = protocol("Canada", "Canada RP", { natureVersement: "total", devise: "XAF" });
    expect(total).toContain("somme totale des frais d'ouverture");
    expect(protocol("Canada", "Canada RP")).not.toContain("AVANCE");
  });
});

describe("le reçu suit la procédure choisie", () => {
  it("RP et e-Visa n'ont plus le texte de placement d'emploi", () => {
    const rp = paymentReceiptCopyForVisa("Canada RP", "Canada");
    const evisa = paymentReceiptCopyForVisa("e-Visa / autorisation électronique", "Canada");
    const work = paymentReceiptCopyForVisa("Travail", "Canada");
    expect(rp.objectText).toContain("résidence permanente");
    expect(rp.objectText).not.toContain("agences de placement");
    expect(evisa.objectText).toContain("e-Visa");
    expect(work.objectText).toContain("agences de placement");
    expect(new Set([rp.objectText, evisa.objectText, work.objectText]).size).toBe(3);
  });
  it("les étapes du reçu viennent de la procédure et du pays", () => {
    expect(paymentReceiptCopyForVisa("Canada RP", "Canada").steps).toContain("Invitation et dossier complet");
    expect(paymentReceiptCopyForVisa("Travail", "Luxembourg").steps).toContain("Déclaration de poste vacant ADEM");
  });
  it("l'e-mail du reçu porte la nature du versement et les étapes", () => {
    const html = buildPaymentReceiptEmailHtml({
      dossierNumber: "3M-2026-0042", fullName: "A", email: "a@x.test", amount: 100000, currency: "XAF", paymentDate: new Date(), paymentMethod: "OM",
      validatedBy: "c", destination: "Canada", visaType: "Canada RP", paymentNature: "avance", balanceDue: 50000,
    });
    expect(html).toContain("Avance sur les frais d&#039;ouverture");
    expect(html).toContain("50 000 XAF");
    expect(html).toContain("Invitation et dossier complet");
  });
});

describe("parcours candidat", () => {
  it("RP, e-Visa et résidence n'affichent plus les étapes visiteur", () => {
    for (const visa of ["Canada RP", "canada_rp", "Résidence / installation"]) {
      const steps = procedureStepLabels("Canada", visa);
      expect(steps).toContain("Invitation et dossier complet");
      expect(steps).not.toContain("Objet du séjour et attaches");
    }
    expect(procedureStepLabels("France", "Résidence / installation")).toContain("Demande de résidence permanente");
    expect(procedureStepLabels("France", "Regroupement familial")).toContain("Dépôt de la demande de regroupement");
    expect(getEnrichedCandidateJourney("Luxembourg", "Résidence / installation", "Résidence / installation").title).not.toContain("Visiteur");
  });
  it("détecte le type côté protocole", () => {
    expect(detectProtocolVisaKind("Canada RP")).toBe("residence");
    expect(detectProtocolVisaKind("Tourisme / visite")).toBe("visiteurs");
  });
});

describe("écrans d'administration", () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
  it("l'éditeur du reçu propose avance / somme totale", () => {
    const editor = read("../client/src/components/AdminReceiptProtocolEditor.tsx");
    expect(editor).toContain('data-testid="receipt-nature"');
    expect(editor).toContain('data-testid="receipt-balance"');
  });
  it("le poste de travail signale les lots à revoir", () => {
    expect(read("../client/src/components/AdminContractsReceiptsDesk.tsx")).toContain("row-procedure-refresh-");
    expect(read("./routers/adminCandidateManagement.ts")).toContain("procedureRefreshNeeded");
  });
});

describe("nature du versement et dossiers déjà envoyés", () => {
  it("validation de l'avance", () => {
    expect(paymentNatureError("avance", -5)).toBeTruthy();
    expect(paymentNatureError("avance", null)).toBeNull();
    expect(paymentNatureSentence({ nature: null, amount: 1, currency: "XAF" })).toBe("");
    const base = { amount: 1000, currency: "XAF", paymentDate: new Date().toISOString(), paymentMethod: "OM", paymentReference: null };
    expect(validateReceiptDraft({ ...base, paymentNature: "avance", balanceDue: 500 })).toBeNull();
    expect(validateReceiptDraft({ ...base, paymentNature: "avance", balanceDue: -1 })).toBeTruthy();
  });
  it("le brouillon du reçu applique la nature au dossier", () => {
    const dossier: any = { amount: 1, currency: "XAF", paymentDate: new Date(), paymentMethod: "x", paymentReference: null };
    applyReceiptDraft(dossier, { amount: 2000, currency: "XAF", paymentDate: new Date().toISOString(), paymentMethod: "OM", paymentReference: null, paymentNature: "avance", balanceDue: 900, updatedAt: "", updatedBy: "" });
    expect(dossier.paymentNature).toBe("avance");
    expect(dossier.balanceDue).toBe(900);
  });
  it("signale les lots envoyés avant l'adaptation pour résidence / e-Visa / inconnu, pas les autres", () => {
    expect(needsProcedureRefresh("residence", "2026-11-01T10:00:00Z")).toBe(true);
    expect(needsProcedureRefresh("evisa", "2026-11-01T10:00:00Z")).toBe(true);
    expect(needsProcedureRefresh("travail", "2026-11-01T10:00:00Z")).toBe(false);
    expect(needsProcedureRefresh("residence", "2026-12-05T10:00:00Z")).toBe(false);
    expect(needsProcedureRefresh("residence", null)).toBe(false);
  });
});
