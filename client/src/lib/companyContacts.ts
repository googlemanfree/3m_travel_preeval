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
  mapQuery: string;
};

export const COMPANY_PROFILE = {
  publicName: "3M Travel & Services",
  legalName: "3M Travel Agency SARL",
  publicEmail: "hello@3mtravelagency.com",
  website: "https://www.3mtravelagency.com",
  legalIdentifiers: {
    registration: "RC/YAO/2019/A/2567",
    taxpayerId: "M112417203369H",
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
      timeZoneLabel: "Heure de Douala (WAT)",
      openingHours: ["Lun–ven : 08 h 00 – 20 h 00", "Sam–dim : 09 h 00 – 18 h 00"],
      addressLines: ["Biyem-Assi, Montée Chapelle Obili", "À 10 m de EHS, Yaoundé, Cameroun"],
      mapQuery: "Avenue Marché Biyem-Assi, Yaoundé, Cameroun",
    },
    ottawa: {
      label: "Bureau 3M Travel d’Ottawa, Canada",
      shortLabel: "Ottawa, Canada",
      flag: "🇨🇦",
      whatsappNumber: "16728972999",
      whatsappDisplay: "+1 672 897 2999",
      timeZone: "America/Toronto",
      timeZoneLabel: "Heure de Toronto (ET)",
      openingHours: ["Lun–ven : 08 h 00 – 20 h 00", "Sam–dim : 09 h 00 – 18 h 00"],
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
