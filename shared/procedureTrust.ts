/**
 * Ce qui manquait pour uniformiser les pages de procédure : une date de vérification des liens visible pour le visiteur
 * (elle n'existait jusqu'ici que dans un commentaire de code), et un rappel anti-arnaque générique pour les pages qui n'ont
 * pas d'alerte anti-fraude spécifique au pays. Le rappel générique reste volontairement général : il n'invente aucun cas
 * de fraude propre à un pays — seule une page qui a fait ce travail (ex. Luxembourg, avec l'ADEM) peut l'affirmer.
 *
 * `LINKS_VERIFIED_ON` : date du dernier contrôle réel de TOUS les liens officiels des pages qui utilisent ce module
 * (accès direct HTTP, ou confirmation par une source tierce quand l'accès direct est bloqué depuis notre réseau).
 * Mettre à jour cette date UNIQUEMENT après avoir revérifié les liens.
 */
export const LINKS_VERIFIED_ON = { iso: "2026-10-07", label: "7 octobre 2026" } as const;

export const GENERIC_FRAUD_REMINDER =
  "Aucune administration ni agence ne demande de paiement pour garantir la délivrance d'un visa, et aucune décision n'est jamais garantie à l'avance. 3M TRAVEL AGENCY ne facilite aucun accord informel avec une autorité. Avant tout paiement ou envoi de document personnel, vérifiez l'information reçue directement sur le site officiel ci-dessus.";
