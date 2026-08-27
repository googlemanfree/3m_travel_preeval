import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { notifyAdmins } from "./adminNotifications";

const recentAlerts = new Map<string, number>();
const ALERT_COOLDOWN_MS = 15 * 60 * 1000;

export function claimSimulatorAlert(alertKey: string, now = Date.now()) {
  const lastAlert = recentAlerts.get(alertKey) ?? 0;
  if (now - lastAlert < ALERT_COOLDOWN_MS) return false;
  recentAlerts.set(alertKey, now);
  return true;
}

/** Signale uniquement la disponibilité d’un module public, sans données candidat ni trace brute. */
export const simulatorDiagnosticsRouter = router({
  reportFailure: publicProcedure
    .input(z.object({
      route: z.enum(["/", "/canada", "/etudes"]),
      simulator: z.enum(["express", "canada_score", "study_evaluation"]),
    }))
    .mutation(async ({ input }) => {
      const alertKey = `${input.route}:${input.simulator}`;
      if (!claimSimulatorAlert(alertKey)) return { reported: false, throttled: true };
      await notifyAdmins({
        type: "simulator_load_failed",
        title: "Chargement simulateur à surveiller",
        message: `Le simulateur ${input.simulator} a signalé un échec de chargement sur ${input.route}. Aucun renseignement candidat n’a été transmis.`,
        targetAdminType: "evaluation",
      });
      return { reported: true, throttled: false };
    }),
});
