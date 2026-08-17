import type { EvisaDestination } from "@/data/evisasDatabaseComplete";

export type EvisaMessageSnapshot = {
  destinationId: string;
  country: string;
  officialPortalUrl: string;
  officialPortalLabel: string;
  officialVerifiedAt: string;
  requirements: string;
  fee: string;
  delay: string;
  procedureUrl: string;
};

export function buildEvisaMessageSnapshot(destination: EvisaDestination, siteOrigin = ""): EvisaMessageSnapshot {
  const procedurePath = `/evisas/request?destination=${encodeURIComponent(destination.id)}`;
  const procedureUrl = siteOrigin ? `${siteOrigin.replace(/\/$/, "")}${procedurePath}` : procedurePath;
  return {
    destinationId: destination.id,
    country: destination.country,
    officialPortalUrl: destination.officialPortalUrl || "à confirmer avec votre conseiller",
    officialPortalLabel: destination.officialPortalLabel || "Portail officiel à confirmer",
    officialVerifiedAt: destination.officialVerifiedAt || "à confirmer",
    requirements: destination.docs,
    fee: destination.fee,
    delay: destination.delay,
    procedureUrl,
  };
}

export function buildEvisaMessageTemplate(destination: EvisaDestination, siteOrigin = "") {
  const snapshot = buildEvisaMessageSnapshot(destination, siteOrigin);
  return [
    `Bonjour,`,
    ``,
    `Pour votre procédure e‑Visa ${snapshot.country}, veuillez consulter les informations ci-dessous :`,
    ``,
    `Portail officiel : ${snapshot.officialPortalUrl}`,
    `Référence vérifiée le : ${snapshot.officialVerifiedAt}`,
    `Exigences principales : ${snapshot.requirements}`,
    `Frais et délai indicatifs : ${snapshot.fee} · ${snapshot.delay}`,
    ``,
    `Vous pouvez préparer votre demande ici : ${snapshot.procedureUrl}`,
    ``,
    `Les exigences dépendent de votre nationalité, du motif et de la date de voyage. Notre équipe vérifiera votre éligibilité avant toute démarche ou paiement.`,
  ].join("\n");
}
