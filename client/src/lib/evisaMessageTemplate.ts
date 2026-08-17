import type { EvisaDestination } from "@/data/evisasDatabaseComplete";

export function buildEvisaMessageTemplate(destination: EvisaDestination, siteOrigin = "") {
  const procedurePath = `/evisas/request?destination=${encodeURIComponent(destination.id)}`;
  const procedureUrl = siteOrigin ? `${siteOrigin.replace(/\/$/, "")}${procedurePath}` : procedurePath;
  return [
    `Bonjour,`,
    ``,
    `Pour votre procédure e‑Visa ${destination.country}, veuillez consulter les informations ci-dessous :`,
    ``,
    `Portail officiel : ${destination.officialPortalUrl || "à confirmer avec votre conseiller"}`,
    `Référence vérifiée le : ${destination.officialVerifiedAt || "à confirmer"}`,
    `Exigences principales : ${destination.docs}`,
    `Frais et délai indicatifs : ${destination.fee} · ${destination.delay}`,
    ``,
    `Vous pouvez préparer votre demande ici : ${procedureUrl}`,
    ``,
    `Les exigences dépendent de votre nationalité, du motif et de la date de voyage. Notre équipe vérifiera votre éligibilité avant toute démarche ou paiement.`,
  ].join("\n");
}
