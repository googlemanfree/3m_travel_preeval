import { TRPCError } from "@trpc/server";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { runDocumentReminders } from "../scheduled/documentReminderJob";
import { getSchedulerHistory, recordSchedulerExecution } from "../cron/schedulerHistory";
import { SCHEDULED_JOBS, resolveScheduledJobsMode } from "../cron/scheduledJobsCron";

const DOCUMENT_REMINDERS_PATH = "/api/scheduled/document-reminders";
const DOCUMENT_REMINDERS_LABEL = "Relances pièces manquantes, suivi de vols et invitations d'avis";

export const schedulerAdminRouter = router({
  getStatus: adminProcedure.query(() => {
    const mode = resolveScheduledJobsMode(process.env.SCHEDULED_JOBS_MODE);
    return {
      mode,
      enabled: mode !== "off",
      documentReminders: {
        path: DOCUMENT_REMINDERS_PATH,
        label: DOCUMENT_REMINDERS_LABEL,
        supportsDryRun: true,
      },
      scheduledJobsCount: SCHEDULED_JOBS.length,
      history: getSchedulerHistory(20),
      checkedAt: new Date(),
    };
  }),

  runDocumentRemindersDryRun: adminProcedure.mutation(async () => {
    const mode = resolveScheduledJobsMode(process.env.SCHEDULED_JOBS_MODE);
    if (mode !== "dry-run") {
      throw new TRPCError({
        code: mode === "live" ? "FORBIDDEN" : "PRECONDITION_FAILED",
        message: mode === "live"
          ? "Le déclenchement manuel est désactivé en mode live pour éviter un envoi accidentel."
          : "Le planificateur interne est désactivé. Activez le mode dry-run avant de tester.",
      });
    }

    const startedAt = new Date();
    try {
      const db = await getDb();
      if (!db) throw new Error("Base de données indisponible");
      const outcomes = await runDocumentReminders(db, { dryRun: true });
      const finishedAt = new Date();
      const failed = outcomes.filter((outcome) => outcome.error).length;
      const execution = recordSchedulerExecution({
        job: DOCUMENT_REMINDERS_LABEL,
        path: DOCUMENT_REMINDERS_PATH,
        mode,
        startedAt,
        finishedAt,
        status: failed ? "failed" : "success",
        planned: outcomes.length,
        sent: 0,
        failed,
        source: "manual",
      });
      return {
        execution,
        dryRun: true,
        planned: outcomes.length,
        sent: 0,
        failed,
        message: `${outcomes.length} relance(s) seraient envoyée(s). Aucun e-mail n'a été envoyé.`,
      };
    } catch (error) {
      const finishedAt = new Date();
      recordSchedulerExecution({
        job: DOCUMENT_REMINDERS_LABEL,
        path: DOCUMENT_REMINDERS_PATH,
        mode,
        startedAt,
        finishedAt,
        status: "failed",
        planned: 0,
        sent: 0,
        failed: 1,
        source: "manual",
        error: "exécution impossible",
      });
      console.error("[SchedulerAdmin] document-reminders dry-run failed", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Le test des relances n'a pas pu être exécuté." });
    }
  }),
});
