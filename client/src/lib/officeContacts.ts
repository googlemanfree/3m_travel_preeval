export type OfficeId = "ottawa" | "cameroon";

export type OfficeContact = {
  id: OfficeId;
  label: string;
  shortLabel: string;
  whatsappNumber: string;
  whatsappDisplay: string;
  timeZone: string;
  timeZoneLabel: string;
  openingHours: readonly string[];
};

export const OFFICE_CONTACTS: Record<OfficeId, OfficeContact> = {
  ottawa: {
    id: "ottawa",
    label: "Bureau 3M Travel d’Ottawa, Canada",
    shortLabel: "Ottawa, Canada",
    whatsappNumber: "16728972999",
    whatsappDisplay: "+1 672 897 2999",
    timeZone: "America/Toronto",
    timeZoneLabel: "Heure de Toronto (ET)",
    openingHours: ["Lun–ven : 08 h 00 – 20 h 00", "Sam–dim : 09 h 00 – 18 h 00"],
  },
  cameroon: {
    id: "cameroon",
    label: "Bureau de Yaoundé, Cameroun",
    shortLabel: "Yaoundé",
    whatsappNumber: "237698104832",
    whatsappDisplay: "+237 698 104 832",
    timeZone: "Africa/Douala",
    timeZoneLabel: "Heure de Douala (WAT)",
    openingHours: ["Lun–ven : 08 h 00 – 20 h 00", "Sam–dim : 09 h 00 – 18 h 00"],
  },
};

export const OFFICE_CONTACT_LIST = Object.values(OFFICE_CONTACTS);

export const officeWhatsAppUrl = (office: OfficeContact, message: string) =>
  `https://wa.me/${office.whatsappNumber}?text=${encodeURIComponent(message)}`;

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
