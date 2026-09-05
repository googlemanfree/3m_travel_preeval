const TECHNICAL_TERMS = [
  /\bintelligence artificielle\b/gi,
  /\bartificial intelligence\b/gi,
  /\bgénéré(?:e|es|s)?\s+par\s+(?:une?\s+)?IA\b/gi,
  /\bgenerated\s+by\s+AI\b/gi,
  /\bIA\b/gi,
  /\bAI\b/gi,
];

/**
 * Nettoie uniquement les textes destinés au candidat. Les libellés internes,
 * journaux techniques et écrans administrateur ne passent pas par ce filtre.
 */
export function sanitizeClientCommunicationText(value: string): string {
  let result = value;
  for (const pattern of TECHNICAL_TERMS) {
    result = result.replace(pattern, "un conseiller 3M Travel");
  }
  return result
    .replace(/un conseiller 3M Travel\s+proposé/gi, "proposé par un conseiller 3M Travel")
    .replace(/un conseiller 3M Travel\s+indisponible/gi, "votre conseiller est momentanément indisponible")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function sanitizeClientCommunicationHtml(value: string): string {
  return sanitizeClientCommunicationText(value);
}
