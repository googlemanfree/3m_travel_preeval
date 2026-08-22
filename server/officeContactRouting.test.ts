import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildQuickOfficeContactMessage, OFFICE_CONTACTS, officeWhatsAppUrl, validateQuickOfficeContact } from "../client/src/lib/officeContacts";

const root = resolve(import.meta.dirname, "..");
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), "utf8");

describe("contacts multi-bureaux", () => {
  it("déclare Ottawa et Cameroun avec des fuseaux IANA et un WhatsApp distinct", () => {
    const source = read("client/src/lib/officeContacts.ts");
    expect(source).toContain('ottawa:');
    expect(source).toContain('cameroon:');
    expect(source).toContain('timeZone: "America/Toronto"');
    expect(source).toContain('timeZone: "Africa/Douala"');
    expect(source).toContain('whatsappNumber: "16728972999"');
    expect(source).toContain('whatsappNumber: "237698104832"');
  });

  it("conserve le bureau choisi et prépare le lien WhatsApp avec son message", () => {
    const source = read("client/src/contexts/OfficeContactContext.tsx");
    const panel = read("client/src/components/OfficeContactPanel.tsx");
    expect(source).toContain('3m_selected_contact_office');
    expect(panel).toContain('officeWhatsAppUrl(office, content)');
    expect(panel).toContain('formatOfficeTime(office, now)');
  });

  it("intègre le sélecteur et le formulaire rapide sur la page de contact", () => {
    const page = read("client/src/pages/Contact.tsx");
    const floating = read("client/src/components/FloatingActionMenu.tsx");
    expect(page).toContain('<OfficeContactPanel />');
    expect(floating).toContain('useOfficeContact()');
    expect(floating).toContain('officeWhatsAppUrl(office');
    expect(read("client/src/App.tsx")).toContain('const showFloatingTools = location !== "/contact"');
  });

  it("bascule la destination et le message rapide vers le bureau choisi", () => {
    const contact = { name: "Marie Dupont", email: "marie@example.com", message: "Je souhaite être accompagnée pour mon projet de voyage." };
    const ottawaMessage = buildQuickOfficeContactMessage(OFFICE_CONTACTS.ottawa, contact);
    const cameroonMessage = buildQuickOfficeContactMessage(OFFICE_CONTACTS.cameroon, contact);

    expect(ottawaMessage).toContain("Bureau 3M Travel d’Ottawa, Canada");
    expect(cameroonMessage).toContain("Bureau de Yaoundé, Cameroun");
    expect(officeWhatsAppUrl(OFFICE_CONTACTS.ottawa, ottawaMessage)).toContain("wa.me/16728972999");
    expect(officeWhatsAppUrl(OFFICE_CONTACTS.cameroon, cameroonMessage)).toContain("wa.me/237698104832");
  });

  it("refuse les données incomplètes avant toute ouverture de WhatsApp", () => {
    expect(validateQuickOfficeContact({ name: "", email: "marie@example.com", message: "Un message assez détaillé" })).toBe("Indiquez votre nom.");
    expect(validateQuickOfficeContact({ name: "Marie", email: "invalide", message: "Un message assez détaillé" })).toBe("Indiquez une adresse e-mail valide.");
    expect(validateQuickOfficeContact({ name: "Marie", email: "marie@example.com", message: "Court" })).toBe("Décrivez votre demande en au moins 10 caractères.");
    expect(validateQuickOfficeContact({ name: "Marie", email: "marie@example.com", message: "Un message assez détaillé" })).toBeNull();
  });
});
