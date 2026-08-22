export const COMPANY_CONTACTS = {
  yaounde: {
    label: "Bureau de Yaoundé, Cameroun",
    address: "Biyem-Assi, Montée Chapelle Obili, Yaoundé, Cameroun",
    whatsappNumber: "+237 698 104 832",
    whatsappUrl: "https://wa.me/237698104832",
    phone: "+237 620 996 045",
    email: "hello@3mtravelagency.com",
  },
} as const;

export const digitalWhatsAppUrl = (message: string) =>
  `${COMPANY_CONTACTS.yaounde.whatsappUrl}?text=${encodeURIComponent(message)}`;
