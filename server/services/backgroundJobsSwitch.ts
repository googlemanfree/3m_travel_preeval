/**
 * Interrupteur unique des tâches automatiques (relances de bilans, garde d'activation, planificateur, rafraîchissement des guides,
 * traitement automatique des bilans). `JOBS_ENABLED=off` les coupe toutes : à mettre sur toute instance qui n'est pas la production
 * (test, copie de la base…), pour qu'elle n'envoie jamais un message en double. Absent ou toute autre valeur : comportement inchangé.
 */
export function backgroundJobsEnabled(value: string | undefined = process.env.JOBS_ENABLED): boolean {
  const normalized = (value ?? "").trim().toLowerCase();
  return !["off", "false", "0", "non", "no"].includes(normalized);
}
