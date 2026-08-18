export async function initEvaluationCron() {
  // Flux conservé uniquement pour compatibilité au démarrage. Les envois de bilan
  // passent exclusivement par le job planifié qui exige une validation humaine.
  console.warn("[CRON] Ancien envoi automatique à 48 h désactivé : validation humaine obligatoire.");
  return null;
}
