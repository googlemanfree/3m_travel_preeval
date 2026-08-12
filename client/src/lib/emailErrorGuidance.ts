export function getEmailErrorTitle(error: string): string {
  const normalized = error.toLowerCase();
  if (normalized.includes("invalid `to`") || normalized.includes("invalid email") || normalized.includes("recipient")) return "Adresse destinataire invalide";
  if (normalized.includes("domain") && (normalized.includes("verify") || normalized.includes("verified"))) return "Domaine d’envoi non vérifié";
  if (normalized.includes("rate limit") || normalized.includes("too many")) return "Limite d’envoi atteinte";
  if (normalized.includes("api key") || normalized.includes("unauthorized") || normalized.includes("authentication")) return "Configuration Resend invalide";
  return "Échec d’envoi à analyser";
}

export function getEmailErrorGuidance(error: string): string {
  const normalized = error.toLowerCase();
  if (normalized.includes("invalid `to`") || normalized.includes("invalid email") || normalized.includes("recipient")) return "Vérifiez l’adresse du candidat : aucun espace, faute de frappe ou domaine incomplet. Corrigez-la dans son dossier puis utilisez « Renvoyer l’e-mail de confirmation ».";
  if (normalized.includes("domain") && (normalized.includes("verify") || normalized.includes("verified"))) return "Vérifiez le domaine d’expédition dans Resend et confirmez les enregistrements SPF/DKIM avant de renvoyer le message.";
  if (normalized.includes("rate limit") || normalized.includes("too many")) return "Attendez quelques instants avant un nouvel envoi et évitez les renvois répétés du même message.";
  if (normalized.includes("api key") || normalized.includes("unauthorized") || normalized.includes("authentication")) return "Vérifiez la variable RESEND_API_KEY et la configuration de l’expéditeur côté serveur. Ne saisissez jamais la clé dans le navigateur.";
  return "Consultez le détail Resend affiché, vérifiez le destinataire et réessayez. Si l’erreur persiste, transmettez le message complet au support technique.";
}
