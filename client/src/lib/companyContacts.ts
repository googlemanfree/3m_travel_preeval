export type CompanyOfficeId = "ottawa" | "cameroon";

export type CompanyOffice = {
  label: string;
  shortLabel: string;
  flag: string;
  whatsappNumber: string;
  whatsappDisplay: string;
  phoneDisplay?: string;
  timeZone: string;
  timeZoneLabel: string;
  openingHours: readonly string[];
  addressLines: readonly string[];
  /** Adresse en anglais (pages /en) : évite de mêler le français aux pages anglaises. */
  addressLinesEn?: readonly string[];
  mapQuery: string;
};

/** Nom public unique affiché sur tout le site (UI, SEO, e-mails clients). */
export const BRAND_PUBLIC_NAME = "3M TRAVEL AGENCY";

/** Groupe / entité de direction — distinct du nom commercial et du nom légal d’exploitation. */
export const GROUP_LEGAL_NAME = "3M Group SARL";

/** Fondateur & PDG — source canonique pour SEO, JSON-LD et pages publiques. */
export const COMPANY_FOUNDER = {
  name: "Aureol DONFACK",
  givenName: "Aureol",
  familyName: "DONFACK",
  jobTitle: "Fondateur & PDG",
  organization: GROUP_LEGAL_NAME,
  brand: BRAND_PUBLIC_NAME,
  aboutPath: "/about",
  imageHd: "/team/aureol-donfack-fondateur-pdg-3m-group-sarl-hd.jpg",
  imageJpg: "/team/aureol-donfack-fondateur-pdg-3m-group-sarl.jpg",
  imageWebp: "/team/aureol-donfack-fondateur-pdg-3m-group-sarl.webp",
  imageSquare: "/team/aureol-donfack-fondateur-pdg-3m-group-sarl-600.webp",
  imageAlt:
    "Aureol DONFACK, fondateur et PDG de 3M Group SARL (3M TRAVEL AGENCY)",
  description:
    "Aureol DONFACK est le fondateur et PDG de 3M Group SARL, opérateur de 3M TRAVEL AGENCY. Il pilote l’accompagnement des projets de mobilité internationale depuis Yaoundé.",
} as const;

export const COMPANY_PROFILE = {
  publicName: BRAND_PUBLIC_NAME,
  /** Nom légal d’exploitation (contrats, reçus, footer). */
  legalName: "3M Travel Agency SARL",
  /** Groupe dirigé par le fondateur — à exposer aux moteurs de recherche. */
  groupLegalName: GROUP_LEGAL_NAME,
  publicEmail: "hello@3mtravelagency.com",
  website: "https://www.3mtravelagency.com",
  founder: COMPANY_FOUNDER,
  legalIdentifiers: {
    registration: "RC/YAO/2019/A/2567",
    taxpayerId: "M112417203369H",
    country: "Cameroun",
    registryAuthority: "RCCM — greffe du tribunal de commerce de Yaoundé (OHADA)",
    /** Portail officiel OHADA / Cameroun pour orienter une vérification externe. */
    registryPortalUrl: "https://rccm.ohada.org/staticPage/index?alias=cm",
    registrySearchUrl: "https://rccm.ohada.org/prsIndividual/index",
  },
  /** Rôles explicites des numéros publics — éviter la confusion WhatsApp / fixe / Ottawa. */
  contactRoles: {
    yaoundeWhatsapp: "WhatsApp Yaoundé — canal principal (messages, dossiers, urgences)",
    yaoundePhone: "Ligne fixe Yaoundé — appels vocaux uniquement (pas WhatsApp)",
    ottawaWhatsapp: "WhatsApp Ottawa — coordination Canada (secondaire, sur rendez-vous)",
  },
  /** Engagement de délai annoncé côté public — à mesurer en opération. */
  responseSla: {
    label: "sous 24 heures ouvrées",
    definition:
      "Jours ouvrés Yaoundé (lun–ven, hors jours fériés camerounais). Compteur à partir de la réception de l’évaluation ou du message e-mail/WhatsApp complet. Objectif d’accusé ou de première réponse humaine — pas une décision de visa.",
  },
  offices: {
    cameroon: {
      label: "Bureau de Yaoundé, Cameroun",
      shortLabel: "Yaoundé",
      flag: "🇨🇲",
      whatsappNumber: "237698104832",
      whatsappDisplay: "+237 698 104 832",
      phoneDisplay: "+237 620 996 045",
      timeZone: "Africa/Douala",
      timeZoneLabel: "Heure du Cameroun (WAT)",
      openingHours: ["Lun–ven : 08 h 00 – 20 h 00", "Sam–dim : 09 h 00 – 18 h 00"],
      addressLines: ["Biyem-Assi, Montée Chapelle Obili", "À 10 m de EHS, Yaoundé, Cameroun"],
      addressLinesEn: ["Biyem-Assi, Montée Chapelle Obili", "10 m from EHS, Yaoundé, Cameroon"],
      mapQuery: "Biyem-Assi, Montée Chapelle Obili, Yaoundé, Cameroun",
    },
    ottawa: {
      label: "Bureau 3M TRAVEL AGENCY d’Ottawa, Canada",
      shortLabel: "Ottawa, Canada",
      flag: "🇨🇦",
      whatsappNumber: "16728972999",
      whatsappDisplay: "+1 672 897 2999",
      timeZone: "America/Toronto",
      timeZoneLabel: "Heure de Toronto (ET)",
      openingHours: ["Coordination Canada — sur rendez-vous uniquement", "Pas d’horaires d’accueil walk-in publiés"],
      addressLines: ["Ottawa, Ontario, Canada"],
      mapQuery: "Ottawa, Ontario, Canada",
    },
  } satisfies Record<CompanyOfficeId, CompanyOffice>,
} as const;

export const COMPANY_CONTACTS = {
  yaounde: {
    label: COMPANY_PROFILE.offices.cameroon.label,
    address: COMPANY_PROFILE.offices.cameroon.addressLines.join(", "),
    whatsappNumber: COMPANY_PROFILE.offices.cameroon.whatsappDisplay,
    whatsappUrl: `https://wa.me/${COMPANY_PROFILE.offices.cameroon.whatsappNumber}`,
    phone: COMPANY_PROFILE.offices.cameroon.phoneDisplay,
    email: COMPANY_PROFILE.publicEmail,
  },
  ottawa: {
    label: COMPANY_PROFILE.offices.ottawa.label,
    address: COMPANY_PROFILE.offices.ottawa.addressLines.join(", "),
    whatsappNumber: COMPANY_PROFILE.offices.ottawa.whatsappDisplay,
    whatsappUrl: `https://wa.me/${COMPANY_PROFILE.offices.ottawa.whatsappNumber}`,
    email: COMPANY_PROFILE.publicEmail,
  },
} as const;

export const digitalWhatsAppUrl = (message: string) =>
  `${COMPANY_CONTACTS.yaounde.whatsappUrl}?text=${encodeURIComponent(message)}`;
