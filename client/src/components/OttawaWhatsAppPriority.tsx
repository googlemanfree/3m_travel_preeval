export const OTTAWA_WHATSAPP_NUMBER = "237698104832";
export const OTTAWA_WHATSAPP_DISPLAY = "+237 698 104 832";

export const ottawaWhatsAppUrl = (message: string) =>
  `https://wa.me/${OTTAWA_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
