import { describe, expect, it } from "vitest";
import { completeMailForClipboard, composeCompleteEvaluationMail } from "../shared/evaluationCompleteMail";
import { NOTIFICATION_PORTAL_PLACEHOLDER, blankAdminVersion, renderNotificationEmail, type AdminEvaluationVersion } from "../shared/evaluationValidation";
import { missingPublishableFields } from "./services/evaluationValidationCore";

const ready = (overrides: Partial<AdminEvaluationVersion> = {}): AdminEvaluationVersion => ({
  ...blankAdminVersion({ priorityCountry: "Allemagne", candidateName: "Awa Diop", evaluationDate: "2026-10-26", profile: "travail" }),
  profileSummary: "Profil technique avec trois ans d’expérience vérifiable.",
  route: "A",
  strengths: ["Expérience dans le secteur visé", "Anglais courant"],
  improvements: ["Traduire les diplômes"],
  actionPlan: [{ title: "Faire traduire les diplômes", horizon: "30 jours", detail: "Traducteur assermenté" }],
  requiredDocuments: [{ label: "Passeport", status: "recu" }, { label: "Diplôme traduit", status: "a_fournir" }],
  alternatives: [{ country: "Pologne", rationale: "Marché plus ouvert à ce métier" }],
  internalComment: "NE JAMAIS MONTRER : candidat difficile",
  ...overrides,
});

describe("mail complet : le bilan en un seul bloc de texte", () => {
  it("reprend résultat, atouts, points à renforcer, plan, documents et alternatives, avec les repères ✓ ▸ ① ②", () => {
    const mail = composeCompleteEvaluationMail(ready(), { candidateName: "Awa Diop" });
    expect(mail.ok).toBe(true);
    if (mail.ok === false) return;
    expect(mail.text).toContain("Bonjour Awa Diop,");
    expect(mail.text).toContain("① VOTRE RÉSULTAT");
    expect(mail.text).toContain("✓ Expérience dans le secteur visé");
    expect(mail.text).toContain("▸ Traduire les diplômes");
    expect(mail.text).toContain("1. Faire traduire les diplômes (30 jours) — Traducteur assermenté");
    expect(mail.text).toContain("▸ Diplôme traduit — À fournir");
    expect(mail.text).toContain("• Pologne — Marché plus ouvert à ce métier");
    expect(mail.text).toContain("Email : hello@3mtravelagency.com");
    expect(mail.subject).toContain("Allemagne");
  });

  it("ne laisse jamais fuiter le commentaire interne ni les justifications internes", () => {
    const mail = composeCompleteEvaluationMail(ready({ countryJustification: "SECRET pays", statusJustification: "SECRET statut" }), { candidateName: "Awa" });
    expect(mail.ok).toBe(true);
    if (mail.ok === false) return;
    expect(mail.text).not.toMatch(/NE JAMAIS MONTRER|SECRET/);
  });

  it("reprend les frais saisis pour CE dossier, et n'invente aucun montant sinon", () => {
    const without = composeCompleteEvaluationMail(ready(), { candidateName: "Awa" });
    const withFees = composeCompleteEvaluationMail(ready({ feesNote: "Frais d’ouverture confirmés par écrit : 80 000 XAF." }), { candidateName: "Awa" });
    if (without.ok === false || withFees.ok === false) throw new Error("mail attendu");
    expect(without.text).not.toMatch(/FRAIS ET PRESTATIONS|XAF|FCFA/i);
    expect(withFees.text).toContain("FRAIS ET PRESTATIONS INCLUSES");
    expect(withFees.text).toContain("80 000 XAF");
  });

  it("signale une promesse de résultat avant l'envoi", () => {
    const mail = composeCompleteEvaluationMail(ready({ clientRemarks: "Visa garanti dans les 30 jours." }), { candidateName: "Awa" });
    if (mail.ok === false) {
      expect(mail.error).toBeTruthy();
    } else {
      expect(mail.warnings.join(" ")).toMatch(/promesse|Formulation/i);
    }
  });

  it("le texte copié contient le lien sécurisé réel, ou un libellé neutre sans lien", () => {
    const mail = composeCompleteEvaluationMail(ready(), { candidateName: "Awa" });
    if (mail.ok === false) throw new Error("mail attendu");
    expect(completeMailForClipboard(mail.text, "https://3mtravelagency.com/espace?t=abc")).toContain("https://3mtravelagency.com/espace?t=abc");
    expect(completeMailForClipboard(mail.text)).toContain("[lien sécurisé vers votre espace]");
    expect(completeMailForClipboard(mail.text)).not.toContain(NOTIFICATION_PORTAL_PLACEHOLDER);
  });

  it("passe par le rendu d'envoi existant (HTML + texte) sans perdre de contenu", () => {
    const mail = composeCompleteEvaluationMail(ready(), { candidateName: "Awa" });
    if (mail.ok === false) throw new Error("mail attendu");
    const rendered = renderNotificationEmail({ subject: mail.subject, body: mail.text, portalUrl: "https://3mtravelagency.com/espace" });
    expect(rendered.html).toContain("Expérience dans le secteur visé");
    expect(rendered.text).toContain("https://3mtravelagency.com/espace");
  });
});

describe("publication : un écart assumé exige un motif écrit", () => {
  it("pays évalué différent du pays demandé → justification obligatoire", () => {
    expect(missingPublishableFields(ready(), "Canada").join(" ")).toMatch(/Justification du pays évalué/);
    expect(missingPublishableFields(ready({ countryJustification: "Le Canada n'ouvre pas ce métier" }), "Canada")).toEqual([]);
    expect(missingPublishableFields(ready(), "allemagne")).toEqual([]);
    expect(missingPublishableFields(ready())).toEqual([]);
  });

  it("statut final différent du statut suggéré par le score → justification obligatoire", () => {
    const base = ready({ finalStatus: "tres_favorable" });
    expect(missingPublishableFields(base).join(" ")).toMatch(/Justification interne du statut final/);
    expect(missingPublishableFields({ ...base, statusJustification: "Dossier renforcé par un contrat signé" })).toEqual([]);
  });
});
