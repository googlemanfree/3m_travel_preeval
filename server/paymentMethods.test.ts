import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  EMPTY_PAYMENT_INSTRUCTIONS,
  MANUAL_METHOD_CODES,
  describePaymentMethods,
  formatAmount,
  parsePaymentInstructions,
  paymentFallbackMessage,
  sanitizePaymentInstructions,
  toPublicInstructions,
} from "../shared/paymentMethods";
import { buildManualPaymentAgencyEmail, buildManualPaymentClientEmail, buildPaymentSettingsChangedEmail } from "./services/manualPaymentEmails";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");

const filled = {
  bankTransfer: { bankName: "Banque Test", accountHolder: "3M Test SARL", iban: "fr76 3000 6000 0112 3456 7890 189", bic: "agrifrpp", accountNumber: "", note: "Motif : votre référence" },
  mobileMoney: [{ operator: "mtn", number: "+237 6 70 00 00 00", accountName: "Titulaire Test" }],
  agency: { address: "", hours: "", note: "" },
  generalNote: "",
};
const agency = { address: "Yaoundé, Cameroun", hours: "Lun–Ven 8h–17h", whatsappNumber: "237698104832", whatsappDisplay: "+237 6 98 10 48 32", phoneDisplay: "+237 6 98 10 48 32" };

describe("coordonnées de paiement : saisie de l'administrateur", () => {
  it("aucune coordonnée n'est écrite dans le code : vide par défaut", () => {
    expect(EMPTY_PAYMENT_INSTRUCTIONS.bankTransfer.iban).toBe("");
    expect(EMPTY_PAYMENT_INSTRUCTIONS.mobileMoney).toEqual([]);
    for (const file of ["shared/paymentMethods.ts", "server/routers/paymentInstructions.ts", "server/services/manualPaymentEmails.ts", "client/src/components/PaymentMethodsPanel.tsx", "client/src/components/PaymentFallbackPanel.tsx"]) {
      const text = read(file);
      expect(text, file).not.toMatch(/\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){3,}/);
      expect(text, file).not.toMatch(/\bCM\d{2} ?\d{4}/);
    }
  });

  it("assainit, met l'IBAN et le BIC en majuscules et accepte une saisie valide", () => {
    const { value, issues } = sanitizePaymentInstructions(filled);
    expect(issues).toEqual([]);
    expect(value.bankTransfer.iban).toBe("FR76 3000 6000 0112 3456 7890 189");
    expect(value.bankTransfer.bic).toBe("AGRIFRPP");
    expect(value.mobileMoney[0]).toMatchObject({ operator: "mtn", accountName: "Titulaire Test" });
  });

  it("refuse (sans corriger) un IBAN, un numéro ou une section incomplète", () => {
    expect(sanitizePaymentInstructions({ ...filled, bankTransfer: { ...filled.bankTransfer, iban: "12" } }).issues.map((issue) => issue.field)).toContain("bankTransfer.iban");
    expect(sanitizePaymentInstructions({ ...filled, mobileMoney: [{ operator: "mtn", number: "123", accountName: "X" }] }).issues.map((issue) => issue.field)).toContain("mobileMoney.0.number");
    expect(sanitizePaymentInstructions({ ...filled, mobileMoney: [{ operator: "mtn", number: "670000000", accountName: "" }] }).issues.map((issue) => issue.field)).toContain("mobileMoney.0.accountName");
    expect(sanitizePaymentInstructions({ bankTransfer: { bankName: "Banque seule" } }).issues.map((issue) => issue.field)).toContain("bankTransfer");
  });

  it("une section entièrement vide n'est pas une erreur", () => {
    expect(sanitizePaymentInstructions({}).issues).toEqual([]);
    expect(sanitizePaymentInstructions(null).issues).toEqual([]);
  });

  it("retire les caractères de contrôle et invisibles, borne le nombre de numéros", () => {
    const dirty = "Banque" + String.fromCharCode(0, 8203, 65279) + " Test";
    const { value } = sanitizePaymentInstructions({ ...filled, bankTransfer: { ...filled.bankTransfer, bankName: dirty }, mobileMoney: Array.from({ length: 9 }, () => filled.mobileMoney[0]) });
    expect(value.bankTransfer.bankName).toBe("Banque Test");
    expect(value.mobileMoney).toHaveLength(4);
  });

  it("relit un JSON absent ou corrompu sans exception", () => {
    expect(parsePaymentInstructions(null)).toEqual(EMPTY_PAYMENT_INSTRUCTIONS);
    expect(parsePaymentInstructions("{pas du json")).toEqual(EMPTY_PAYMENT_INSTRUCTIONS);
    const stored = parsePaymentInstructions(JSON.stringify({ ...filled, updatedAt: "2026-09-25T10:00:00.000Z", updatedBy: "admin@example.com" }));
    expect(stored.updatedBy).toBe("admin@example.com");
    expect(toPublicInstructions(stored).updatedBy).toBeNull();
  });
});

describe("état réel de chaque moyen de paiement", () => {
  const byId = (instructions: any, online: boolean) => Object.fromEntries(describePaymentMethods(instructions, online).map((method) => [method.id, method]));

  it("sans passerelle ni coordonnées : en ligne « bientôt », virement et dépôt « sur demande », agence toujours disponible", () => {
    const methods = byId(EMPTY_PAYMENT_INSTRUCTIONS, false);
    expect(methods.card.status).toBe("soon");
    expect(methods.mobile_money_online.status).toBe("soon");
    expect(methods.bank_transfer.status).toBe("on_request");
    expect(methods.mobile_money_deposit.status).toBe("on_request");
    expect(methods.cash_agency.status).toBe("available");
  });

  it("jamais « disponible » pour un moyen non configuré ; disponible dès que l'admin a saisi ses coordonnées", () => {
    const configured = parsePaymentInstructions(JSON.stringify(filled));
    const methods = byId(configured, true);
    expect(methods.card.status).toBe("available");
    expect(methods.bank_transfer.status).toBe("available");
    expect(methods.mobile_money_deposit.status).toBe("available");
    const bankOnly = byId(parsePaymentInstructions(JSON.stringify({ ...filled, mobileMoney: [] })), false);
    expect(bankOnly.mobile_money_deposit.status).toBe("on_request");
  });
});

describe("message de repli WhatsApp", () => {
  it("reprend référence, montant, nom et mode choisi", () => {
    const message = paymentFallbackMessage({ reference: "3M-2026-1234", amount: 65000, name: "Aïcha", method: "bank_transfer" });
    expect(message).toContain("3M-2026-1234");
    expect(message).toContain("65");
    expect(message).toContain("XAF");
    expect(message).toContain("Aïcha");
    expect(message).toContain("virement bancaire");
  });

  it("n'invente jamais un montant ni une référence", () => {
    const message = paymentFallbackMessage({ reference: "", amount: null });
    expect(message).toContain("à préciser");
    expect(message).toContain("montant à confirmer");
    expect(formatAmount(Number.NaN)).toBe("montant à confirmer");
  });
});

describe("e-mails de règlement manuel", () => {
  const base = { reference: "3M-2026-1234", fullName: "Aïcha Nkolo", amount: 65000, currency: "XAF", trigger: "chosen" as const, agency };

  it("envoie uniquement les coordonnées saisies par l'admin, avec nom du titulaire et consignes de sécurité", () => {
    const instructions = parsePaymentInstructions(JSON.stringify(filled));
    const bank = buildManualPaymentClientEmail({ ...base, method: "bank_transfer", instructions }).html;
    for (const expected of ["Banque Test", "3M Test SARL", "FR76 3000 6000 0112 3456 7890 189", "AGRIFRPP", "3M-2026-1234", "Rien n’est activé avant cette confirmation", "ne réglez que sur les coordonnées"]) expect(bank, expected).toContain(expected);
    const momo = buildManualPaymentClientEmail({ ...base, method: "mobile_money_deposit", instructions }).html;
    for (const expected of ["+237 6 70 00 00 00", "Titulaire Test", "MTN Mobile Money"]) expect(momo, expected).toContain(expected);
  });

  it("sans coordonnées saisies : renvoie vers l'agence, ne fabrique aucun compte", () => {
    const html = buildManualPaymentClientEmail({ ...base, method: "bank_transfer", instructions: EMPTY_PAYMENT_INSTRUCTIONS }).html;
    expect(html).toContain("communiquées par l’agence");
    expect(html).toContain("Ne payez sur aucun autre compte");
    expect(html).not.toMatch(/IBAN/);
  });

  it("dit clairement que le paiement en ligne n'a pas abouti et qu'aucun règlement n'est enregistré", () => {
    const html = buildManualPaymentClientEmail({ ...base, trigger: "online_failed", method: "cash_agency", instructions: EMPTY_PAYMENT_INSTRUCTIONS }).html;
    expect(html).toContain("n’a pas abouti");
    expect(html).toContain("Aucun règlement n’est enregistré");
    expect(html).toContain("Yaoundé, Cameroun");
  });

  it("neutralise le HTML et les retours à la ligne venus du client", () => {
    const { html, subject } = buildManualPaymentClientEmail({ ...base, fullName: "<img src=x onerror=alert(1)>", reference: "REF\r\nBcc: victime@example.com", method: "cash_agency", instructions: EMPTY_PAYMENT_INSTRUCTIONS });
    expect(html).not.toContain("<img");
    expect(subject).not.toMatch(/[\r\n]/);
    const agencyMail = buildManualPaymentAgencyEmail({ reference: "X\nY", kind: "flight", fullName: "<b>x</b>", email: "a@b.c", amount: null, currency: "XAF", method: "bank_transfer", trigger: "online_failed", adminUrl: "https://example.com/admin" });
    expect(agencyMail.html).not.toContain("<b>x</b>");
    expect(agencyMail.subject).not.toMatch(/[\r\n]/);
    expect(agencyMail.html).toContain("Ne demander l’émission du billet qu’après cette validation");
  });

  it("l'alerte de modification nomme l'administrateur, les sections et la marche à suivre", () => {
    const { subject, html } = buildPaymentSettingsChangedEmail({ adminEmail: "admin@example.com", changedSections: ["virement bancaire"], at: new Date("2026-09-25T10:00:00Z") });
    expect(subject).toContain("ALERTE");
    for (const expected of ["admin@example.com", "virement bancaire", "2026-09-25T10:00:00.000Z", "rétablissez"]) expect(html, expected).toContain(expected);
  });
});

describe("routeur paymentInstructions : sécurité", () => {
  const source = read("server/routers/paymentInstructions.ts");
  const update = source.slice(source.indexOf("update: publicProcedure"), source.indexOf("requestManualPayment: candidateProcedure"));
  const request = source.slice(source.indexOf("requestManualPayment: candidateProcedure"));

  it("la lecture publique n'expose ni l'administrateur ni aucune clé de passerelle", () => {
    const getPublic = source.slice(source.indexOf("getPublic:"), source.indexOf("getForAdmin:"));
    expect(getPublic).toContain("toPublicInstructions(");
    expect(getPublic).not.toMatch(/API_KEY|process\.env\.CINETPAY_API_KEY(?!\))/);
    expect(source).toContain("Boolean(env.CINETPAY_SITE_ID && env.CINETPAY_API_KEY)");
  });

  it("l'écriture exige une session admin valide, valide la saisie avant la base, et alerte l'agence", () => {
    expect(update.indexOf("requireValidAdminSession(")).toBeGreaterThan(-1);
    expect(update.indexOf("requireValidAdminSession(")).toBeLessThan(update.indexOf("getDb()"));
    expect(update.indexOf("sanitizePaymentInstructions(")).toBeLessThan(update.indexOf("db.update(agencySettings)"));
    expect(update).toContain("BAD_REQUEST");
    expect(update).toContain("buildPaymentSettingsChangedEmail(");
    expect(update.indexOf("db.insert(agencySettings)")).toBeLessThan(update.indexOf("buildPaymentSettingsChangedEmail("));
    expect(source).toContain("getForAdmin: publicProcedure.input(z.object({ sessionToken");
    expect(source.slice(source.indexOf("getForAdmin:"), source.indexOf("update: publicProcedure"))).toContain("requireValidAdminSession(");
  });

  it("la demande manuelle : plafond avant écriture, propriété vérifiée, états terminaux refusés, jamais de validation", () => {
    expect(request.indexOf("manualPaymentGuard.assertAllowed(")).toBeGreaterThan(-1);
    expect(request.indexOf("manualPaymentGuard.assertAllowed(")).toBeLessThan(request.indexOf("await getDb()"));
    expect(request).toContain("Dossier introuvable.");
    expect(request).toContain('application.paymentStatus === "SUCCESS"');
    expect(request).toContain('booking.status === "issued" || booking.status === "cancelled"');
    expect(request.indexOf("Dossier introuvable.")).toBeLessThan(request.indexOf("db.update(applications)"));
    expect(request).not.toMatch(/paymentStatus:\s*"SUCCESS"|status:\s*"(paid|issued|confirmed)"/);
    expect(request).toContain("MANUAL_METHOD_CODES[input.method]");
    expect(request).toContain("notifyAdmins(");
  });

  it("les codes enregistrés tiennent dans la colonne paymentMethod (varchar 50)", () => {
    for (const code of Object.values(MANUAL_METHOD_CODES)) expect(code.length).toBeLessThanOrEqual(50);
  });

  it("est branché dans le routeur principal", () => {
    expect(read("server/routers.ts")).toContain("paymentInstructions: paymentInstructionsRouter");
  });
});

describe("intégration côté site", () => {
  it("la page /paiement est déclarée (application et prérendu) et le repli est présent sur les écrans d'échec", () => {
    expect(read("client/src/App.tsx")).toContain('path={"/paiement"}');
    expect(read("server/publicPrerender.ts")).toContain('"/paiement"');
    for (const page of ["client/src/pages/PaymentFailed.tsx", "client/src/pages/PaymentErrorPage.tsx", "client/src/pages/CinetPayPayment.tsx"]) {
      expect(read(page), page).toContain("PaymentFallbackPanel");
    }
  });

  it("la sélection de mode n'affiche plus de délai simulé ni Paystack et renvoie vers /paiement", () => {
    const text = read("client/src/pages/PaymentMethodSelection.tsx");
    expect(text).not.toMatch(/Paystack|setTimeout|Simuler/);
    expect(text).toContain("/paiement");
  });

  it("l'administration propose la saisie des coordonnées dans l'onglet paiements", () => {
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).toContain("<AdminPaymentInstructions");
    expect(read("client/src/components/AdminPaymentInstructions.tsx")).toContain("trpc.paymentInstructions.update.useMutation");
  });
});

describe("réservation de vol : accès aux moyens de paiement", () => {
  it("la confirmation renvoie vers /paiement avec la référence, sans montant supposé", () => {
    const checkout = read("client/src/pages/FlightBookingCheckout.tsx");
    expect(checkout).toContain('data-testid="how-to-pay"');
    expect(checkout).toContain("/paiement?ref=${encodeURIComponent(dossierRef)}&type=vol");
    expect(checkout).not.toMatch(/paiement\?[^`"]*montant=/);
  });
});
