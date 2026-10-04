import { CronJob } from "cron";

/**
 * Déclenche en interne les tâches planifiées de server/scheduled/*.ts.
 *
 * Audit du 2026-10-04 : chaque endpoint POST /api/scheduled/* existe, est testé, et exige déjà
 * le secret CRON_SECRET — mais rien, nulle part, ne l'a jamais appelé. Le paquet "cron" est une
 * dépendance du projet, inutilisé jusqu'ici. Résultat concret avant ce module : aucune relance de
 * pièce manquante, aucune invitation d'avis automatique, aucune évaluation automatique de dossier
 * n'est jamais partie, malgré un code entièrement fonctionnel.
 *
 * Ce module reproduit EXACTEMENT ce qu'un cron externe aurait fait : un POST HTTP local avec le
 * même Authorization: Bearer $CRON_SECRET que l'endpoint exige déjà. Aucune logique métier n'est
 * dupliquée ici.
 *
 * Contrôlé par la variable d'environnement SCHEDULED_JOBS_MODE :
 *  - absente ou "off" (défaut) : comportement identique à avant ce module, rien ne se déclenche.
 *  - "dry-run" : n'appelle que les tâches qui savent prévisualiser sans effet de bord réel
 *    (document-reminders, avec {"dryRun":true} — couvre aussi les relances de vols et les
 *    invitations d'avis, qui vivent dans le même job). Les autres tâches sont journalisées comme
 *    "non déclenchées, pas de mode aperçu" plutôt que d'être exécutées à l'aveugle.
 *  - "live" : exécute réellement toutes les tâches, sur la cadence ci-dessous.
 *
 * Avant de passer en "live" la tâche "evaluation-job" (ou "evaluation-bilan-job"), relire son
 * code : elle traite jusqu'à 100 dossiers par exécution et envoie un e-mail réel à chacun. Si des
 * dossiers "nouveau" ou des bilans planifiés se sont accumulés avant l'activation de ce module,
 * le premier déclenchement peut envoyer un volume d'e-mails bien plus important qu'un jour normal.
 */

export type ScheduledJobsMode = "off" | "dry-run" | "live";

export interface ScheduledJobSpec {
  path: string;
  /** Expression cron (secondes incluses, format du paquet "cron"). */
  cronTime: string;
  label: string;
  /** Vrai si ce job envoie des e-mails à des candidats (risque de volume), faux si purement interne/admin. */
  candidateFacing: boolean;
  /** Vrai si le endpoint accepte {"dryRun": true} et renvoie un aperçu sans effet de bord. */
  supportsDryRun: boolean;
}

export const SCHEDULED_JOBS: ScheduledJobSpec[] = [
  // Cadence reprise de l'en-tête de son propre fichier handler.
  { path: "/api/scheduled/evaluation-job", cronTime: "0 0 8 * * *", label: "Évaluation automatique des nouveaux dossiers", candidateFacing: true, supportsDryRun: false },
  { path: "/api/scheduled/compliance-monthly-report", cronTime: "0 0 8 1 * *", label: "Rapport mensuel de conformité documentaire", candidateFacing: false, supportsDryRun: false },
  { path: "/api/scheduled/document-reminders", cronTime: "0 0 10 * * *", label: "Relances pièces manquantes, suivi de vols et invitations d'avis", candidateFacing: true, supportsDryRun: true },
  { path: "/api/scheduled/passport-pending-weekly-alert", cronTime: "0 0 9 * * 1", label: "Alerte hebdomadaire passeports en attente (admin)", candidateFacing: false, supportsDryRun: false },
  // Cadence choisie faute de recommandation dans le handler d'origine — à ajuster si besoin.
  { path: "/api/scheduled/evaluation-bilan-job", cronTime: "0 30 8 * * *", label: "Bilans d'évaluation (livraison planifiée + relance 72 h)", candidateFacing: true, supportsDryRun: false },
];

/**
 * Exclues de SCHEDULED_JOBS : ces deux endpoints ne vérifient pas CRON_SECRET comme les autres, mais appellent en plus
 * sdk.authenticateRequest(req), qui exige un vrai jeton de session Manus dont l'openId commence par "cron_" (voir
 * server/_core/sdk.ts). Un simple "Authorization: Bearer $CRON_SECRET" échoue cette vérification : les planifier ici
 * produirait un échec silencieux à chaque déclenchement, jamais un vrai essai. Seule une tâche planifiée créée côté
 * Manus (qui fournit ce jeton de session) peut les déclencher — voir docs/prerequis-externes-v55.md.
 */
export const PLATFORM_CRON_ONLY_PATHS = ["/api/scheduled/external-link-check", "/api/scheduled/evaluation-review-deadline-alerts"] as const;

export function resolveScheduledJobsMode(rawValue: string | undefined): ScheduledJobsMode {
  const normalized = (rawValue ?? "").trim().toLowerCase();
  if (normalized === "live" || normalized === "dry-run") return normalized;
  return "off";
}

/** Vrai si cette tâche doit réellement être appelée dans ce mode ; faux si elle doit rester silencieuse. */
export function shouldDispatchJob(job: ScheduledJobSpec, mode: ScheduledJobsMode): boolean {
  if (mode === "off") return false;
  if (mode === "dry-run") return job.supportsDryRun;
  return true;
}

async function dispatchJob(baseUrl: string, job: ScheduledJobSpec, mode: ScheduledJobsMode): Promise<void> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn(`[Planificateur interne] CRON_SECRET absent : "${job.label}" non déclenchée.`);
    return;
  }
  if (!shouldDispatchJob(job, mode)) {
    console.warn(`[Planificateur interne] "${job.label}" n'a pas de mode aperçu : laissée inactive en dry-run. Relire son code avant de passer SCHEDULED_JOBS_MODE=live.`);
    return;
  }
  const body = mode === "dry-run" ? JSON.stringify({ dryRun: true }) : undefined;
  try {
    const response = await fetch(`${baseUrl}${job.path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body,
    });
    const payload = await response.json().catch(() => null);
    console.log(`[Planificateur interne] "${job.label}" → HTTP ${response.status}`, payload ?? "");
  } catch (error) {
    console.error(`[Planificateur interne] Échec de l'appel pour "${job.label}"`, error);
  }
}

/**
 * Démarre les tâches planifiées internes. Appelé une fois le serveur réellement en écoute, pour
 * connaître le port effectif (choisi dynamiquement par findAvailablePort).
 * Retourne les CronJob démarrées (utile pour les tests ou un futur arrêt propre).
 */
export function initScheduledJobsCron(port: number): CronJob[] {
  const mode = resolveScheduledJobsMode(process.env.SCHEDULED_JOBS_MODE);
  if (mode === "off") {
    console.log('[Planificateur interne] SCHEDULED_JOBS_MODE=off (ou absent) : aucune tâche planifiée ne sera déclenchée automatiquement.');
    return [];
  }
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[Planificateur interne] Mode "${mode}" : ${SCHEDULED_JOBS.length} tâche(s) programmée(s). ${PLATFORM_CRON_ONLY_PATHS.length} autre(s) (ex. vérification des liens) restent hors de ce module : elles exigent une tâche planifiée Manus, pas CRON_SECRET.`);
  return SCHEDULED_JOBS.map((job) => new CronJob(
    job.cronTime,
    () => { void dispatchJob(baseUrl, job, mode); },
    null,
    true,
    "UTC",
  ));
}
