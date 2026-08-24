import { COMPANY_PROFILE, type CompanyOffice } from "@/lib/companyContacts";

export type OfficeId = "ottawa" | "cameroon";

export type OfficeContact = {
  id: OfficeId;
  label: string;
  shortLabel: string;
  flag: string;
  whatsappNumber: string;
  whatsappDisplay: string;
  timeZone: string;
  timeZoneLabel: string;
  openingHours: readonly string[];
  addressLines: readonly string[];
  mapQuery: string;
};

const toOfficeContact = (id: OfficeId, office: CompanyOffice): OfficeContact => ({ id, ...office });

export const OFFICE_CONTACTS: Record<OfficeId, OfficeContact> = {
  ottawa: toOfficeContact("ottawa", COMPANY_PROFILE.offices.ottawa),
  cameroon: toOfficeContact("cameroon", COMPANY_PROFILE.offices.cameroon),
};

export const OFFICE_CONTACT_LIST = Object.values(OFFICE_CONTACTS);

export const officeWhatsAppUrl = (office: OfficeContact, message: string) =>
  `https://wa.me/${office.whatsappNumber}?text=${encodeURIComponent(message)}`;

export const officeMapsUrl = (office: OfficeContact) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.mapQuery)}`;

export const officeMapEmbedUrl = (office: OfficeContact) =>
  `https://www.google.com/maps?q=${encodeURIComponent(office.mapQuery)}&z=14&output=embed`;

export type QuickOfficeContact = { name: string; email: string; message: string };

export function validateQuickOfficeContact(contact: QuickOfficeContact) {
  if (contact.name.trim().length < 2) return "Indiquez votre nom.";
  if (!/^\S+@\S+\.\S+$/.test(contact.email)) return "Indiquez une adresse e-mail valide.";
  if (contact.message.trim().length < 10) return "Décrivez votre demande en au moins 10 caractères.";
  return null;
}

export function buildQuickOfficeContactMessage(office: OfficeContact, contact: QuickOfficeContact) {
  return [
    `Bonjour ${office.label},`,
    `Nom : ${contact.name.trim()}`,
    `E-mail : ${contact.email.trim()}`,
    "",
    contact.message.trim(),
  ].join("\n");
}

export const formatOfficeTime = (office: OfficeContact, date = new Date()) =>
  new Intl.DateTimeFormat("fr-FR", {
    timeZone: office.timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
