import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildQuickOfficeContactMessage, OFFICE_CONTACTS, officeMapEmbedUrl, officeMapsUrl, officeWhatsAppUrl, validateQuickOfficeContact } from "../client/src/lib/officeContacts";

const root = resolve(import.meta.dirname, "..");
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), "utf8");

describe("contacts multi-bureaux", () => {
  it("déclare Ottawa et Cameroun avec des fuseaux IANA et un WhatsApp distinct", () => {
    const source = read("client/src/lib/officeContacts.ts");
    const config = read("client/src/lib/companyContacts.ts");
    expect(source).toContain('COMPANY_PROFILE.offices.ottawa');
    expect(source).toContain('COMPANY_PROFILE.offices.cameroon');
    expect(config).toContain('timeZone: "America/Toronto"');
    expect(config).toContain('timeZone: "Africa/Douala"');
    expect(config).toContain('whatsappNumber: "16728972999"');
    expect(config).toContain('whatsappNumber: "237698104832"');
    expect(config).toContain('flag: "🇨🇦"');
    expect(config).toContain('flag: "🇨🇲"');
  });

  it("conserve le bureau choisi et prépare le lien WhatsApp avec son message", () => {
    const source = read("client/src/contexts/OfficeContactContext.tsx");
    const panel = read("client/src/components/OfficeContactPanel.tsx");
    expect(source).toContain('3m_selected_contact_office');
    expect(panel).toContain('officeWhatsAppUrl(office, content)');
    expect(panel).toContain('formatOfficeTime(office, now)');
    expect(panel).toContain('officeMapEmbedUrl(office)');
    expect(panel).toContain('Discuter sur WhatsApp');
  });

  it("intègre le sélecteur et le formulaire rapide sur la page de contact", () => {
    const page = read("client/src/pages/Contact.tsx");
    const floating = read("client/src/components/FloatingActionMenu.tsx");
    expect(page).toContain('<OfficeContactPanel />');
    expect(floating).toContain('officeWhatsAppUrl(office');
    expect(floating).toContain('OFFICE_CONTACTS.cameroon');
    expect(read("client/src/App.tsx")).toContain('const showFloatingTools = location !== "/contact"');
  });

  it("fait de Yaoundé le WhatsApp public principal et conserve Ottawa comme contact secondaire", () => {
    const context = read("client/src/contexts/OfficeContactContext.tsx");
    const footer = read("client/src/components/Footer.tsx");

    expect(context).toContain('return "cameroon"');
    expect(footer).toContain('COMPANY_CONTACTS.yaounde.whatsappUrl');
    expect(footer).toContain('OFFICE_CONTACTS.ottawa.whatsappDisplay');
    expect(footer).toContain('COMPANY_CONTACTS.yaounde.whatsappNumber');
    expect(footer).toContain('OFFICE_CONTACTS.ottawa.whatsappDisplay');
  });

  it("distingue le WhatsApp principal, le fixe 620 de Yaoundé et le bureau Ottawa dans le footer", () => {
    const footer = read("client/src/components/Footer.tsx");
    expect(footer).toContain("WhatsApp Yaoundé (principal)");
    expect(footer).toContain("Fixe Yaoundé");
    expect(footer).toContain("Bureau Ottawa");
    expect(footer).toContain("COMPANY_CONTACTS.yaounde.phone");
    expect(footer).toContain("OFFICE_CONTACTS.ottawa.whatsappDisplay");
  });

  it("bascule la destination et le message rapide vers le bureau choisi", () => {
    const contact = { name: "Marie Dupont", email: "marie@example.com", message: "Je souhaite être accompagnée pour mon projet de voyage." };
    const ottawaMessage = buildQuickOfficeContactMessage(OFFICE_CONTACTS.ottawa, contact);
    const cameroonMessage = buildQuickOfficeContactMessage(OFFICE_CONTACTS.cameroon, contact);

    expect(ottawaMessage).toContain("Bureau 3M Travel d’Ottawa, Canada");
    expect(cameroonMessage).toContain("Bureau de Yaoundé, Cameroun");
    expect(officeWhatsAppUrl(OFFICE_CONTACTS.ottawa, ottawaMessage)).toContain("wa.me/16728972999");
    expect(officeWhatsAppUrl(OFFICE_CONTACTS.cameroon, cameroonMessage)).toContain("wa.me/237698104832");
    expect(officeMapsUrl(OFFICE_CONTACTS.ottawa)).toContain(encodeURIComponent("Ottawa, Ontario, Canada"));
    expect(officeMapEmbedUrl(OFFICE_CONTACTS.cameroon)).toContain(encodeURIComponent("Avenue Marché Biyem-Assi, Yaoundé, Cameroun"));
  });

  it("refuse les données incomplètes avant toute ouverture de WhatsApp", () => {
    expect(validateQuickOfficeContact({ name: "", email: "marie@example.com", message: "Un message assez détaillé" })).toBe("Indiquez votre nom.");
    expect(validateQuickOfficeContact({ name: "Marie", email: "invalide", message: "Un message assez détaillé" })).toBe("Indiquez une adresse e-mail valide.");
    expect(validateQuickOfficeContact({ name: "Marie", email: "marie@example.com", message: "Court" })).toBe("Décrivez votre demande en au moins 10 caractères.");
    expect(validateQuickOfficeContact({ name: "Marie", email: "marie@example.com", message: "Un message assez détaillé" })).toBeNull();
  });

  it("regroupe les accès du poste administratif HD sans retirer les onglets opérationnels", () => {
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).toContain('AdminNavGroup title="Pilotage des dossiers"');
    expect(dashboard).toContain('AdminNavGroup title="Services & catalogue"');
    expect(dashboard).toContain('AdminNavGroup title="Réservations & finance"');
    expect(dashboard).toContain('AdminNavGroup title="Communication & qualité"');
    expect(dashboard).toContain('AdminNavGroup title="Supervision"');
    expect(dashboard).toContain('TabsTrigger value="candidates"');
    expect(dashboard).toContain('TabsTrigger value="system-status"');
  });
});
