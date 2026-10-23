import { jsPDF } from "jspdf";
import { describe, expect, it } from "vitest";
import { applyLetterhead, BRAND, letterheadLayout, renderBrandedEmailHtml, serviceFocusLabel } from "../shared/brandLetterhead";
import { buildPaymentReceiptEmailHtml, buildPaymentReceiptPdf } from "./utils/paymentReceipt";

describe("papier à en-tête officiel", () => {
  it("l'en-tête ne présente que l'accompagnement visa et mobilité internationale", () => {
    const header = BRAND.tagline.join(" ");
    expect(header).toMatch(/visa et mobilité internationale/i);
    for (const forbidden of ["Hôtellerie", "Informatique", "Sécurité", "Prestations de services", "Assurance"]) expect(header).not.toContain(forbidden);
    const html = renderBrandedEmailHtml({ title: "Test", bodyHtml: "<p>x</p>" });
    for (const forbidden of ["Hôtellerie", "Informatique", "Prestations de services"]) expect(html).not.toContain(forbidden);
  });

  it("le service affiché s'adapte au visa et au pays du dossier", () => {
    expect(serviceFocusLabel("Travail", "Canada")).toBe("Visa travail · Canada");
    expect(serviceFocusLabel("etudes", "Allemagne")).toBe("Visa études · Allemagne");
    expect(serviceFocusLabel("e-Visa touristique", "Ouganda")).toBe("e-Visa · Ouganda");
    expect(serviceFocusLabel("tourisme", "autre")).toBe("Visa visiteur");
    expect(serviceFocusLabel("regroupement familial", "France")).toBe("Immigration · France");
    expect(serviceFocusLabel("", "Canada")).toBe("");
    expect(serviceFocusLabel(null, null)).toBe("");
  });

  it("le service du dossier remplace la liste générale dans l'e-mail", () => {
    const html = renderBrandedEmailHtml({ title: "Test", bodyHtml: "<p>x</p>", serviceFocus: "Visa travail · Canada" });
    expect(html).toContain("Visa travail · Canada");
    expect(html).not.toContain("Études · Travail · Voyages");
    expect(renderBrandedEmailHtml({ title: "Test", bodyHtml: "<p>x</p>" })).toContain("Études · Travail · Voyages · Visas · Immigration");
  });

  it("les coordonnées légales et l'identité sont celles de l'agence, échappées dans l'e-mail", () => {
    const html = renderBrandedEmailHtml({ title: "<b>Titre</b>", bodyHtml: "<p>ok</p>", reference: "3M-AGN-0001" });
    expect(html).toContain("RC/YAO/2019/A/2567");
    expect(html).toContain("M112417203369H");
    expect(html).toContain("3M Travel Agency SARL");
    expect(html).toContain("&lt;b&gt;Titre&lt;/b&gt;");
    expect(html).toContain("3M-AGN-0001");
  });

  it("réserve la place de l'en-tête et du pied de page sur chaque page", () => {
    const plain = letterheadLayout();
    const full = letterheadLayout({ documentKind: "Facture", recipient: "A", subject: "B" });
    expect(full.firstPageTop).toBeGreaterThan(plain.firstPageTop);
    expect(full.nextPageTop).toBeGreaterThan(25);
    expect(full.contentBottom).toBeLessThan(261);
  });

  it("peint l'en-tête sur toutes les pages sans erreur (avec ou sans logo)", () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    doc.text("page 1", 20, 70);
    doc.addPage();
    doc.text("page 2", 20, 40);
    expect(() => applyLetterhead(doc, { documentKind: "Test", reference: "REF-1", serviceFocus: "Visa travail · Canada" })).not.toThrow();
    expect(doc.getNumberOfPages()).toBe(2);
  });

  it("le reçu PDF et le reçu e-mail utilisent l'identité de l'agence", async () => {
    const input = { dossierNumber: "3M-AGN-0001", fullName: "Awa Test", email: "awa@example.com", amount: 65000, currency: "XAF", paymentDate: new Date("2026-10-20T10:00:00Z"), paymentMethod: "Espèces", validatedBy: "Conseiller", destination: "Canada", visaType: "Travail" };
    const pdf = await buildPaymentReceiptPdf(input);
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    const html = buildPaymentReceiptEmailHtml(input);
    expect(html).toContain("Visa travail · Canada");
    expect(html).toContain("RC/YAO/2019/A/2567");
  });
});

describe("habillage automatique des e-mails existants", () => {
  it("habille un ancien modèle sans le modifier, une seule fois", async () => {
    const { frameLegacyEmailHtml, BRAND_EMAIL_MARKER } = await import("../shared/brandLetterhead");
    const legacy = "<!doctype html><html><body><div class=\"ancien\">Contenu d'origine</div></body></html>";
    const framed = frameLegacyEmailHtml(legacy);
    expect(framed).toContain("Contenu d'origine");
    expect(framed).toContain("Accompagnement visa et mobilité internationale");
    expect(framed).toContain("RC/YAO/2019/A/2567");
    expect(framed.startsWith(BRAND_EMAIL_MARKER)).toBe(true);
    expect(framed.match(/<html/g)?.length).toBe(1);
    expect(frameLegacyEmailHtml(framed)).toBe(framed);
  });

  it("n'habille ni les messages internes ni ceux marqués techniques", async () => {
    const { shouldBrandEmail } = await import("./_core/email");
    expect(shouldBrandEmail({ to: "candidat@gmail.com" })).toBe(true);
    expect(shouldBrandEmail({ to: "equipe@3mtravelagency.com" })).toBe(false);
    expect(shouldBrandEmail({ to: "candidat@gmail.com", brand: false })).toBe(false);
    expect(shouldBrandEmail({ to: "" })).toBe(false);
  });
});
