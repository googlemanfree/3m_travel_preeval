/** Canaux par lesquels un client peut donner son accord de publication d'un témoignage (partagé client / serveur). */
export const CONSENT_CHANNELS = ["whatsapp", "email", "sms", "formulaire_signe", "appel_enregistre", "en_agence"] as const;
export type ConsentChannel = (typeof CONSENT_CHANNELS)[number];

export const CONSENT_CHANNEL_LABELS: Record<ConsentChannel, string> = {
  whatsapp: "Message WhatsApp",
  email: "E-mail",
  sms: "SMS",
  formulaire_signe: "Formulaire signé",
  appel_enregistre: "Appel enregistré avec accord",
  en_agence: "Accord donné en agence (consigné)",
};
