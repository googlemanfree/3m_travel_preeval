export const OTTAWA_WHATSAPP_NUMBER = "16728972999";
export const OTTAWA_WHATSAPP_DISPLAY = "+1 672 897 2999";

export const ottawaWhatsAppUrl = (message: string) =>
  `https://wa.me/${OTTAWA_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
