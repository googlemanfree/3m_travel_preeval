import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { normalizeWhatsAppNumber } from "../../shared/flightDeskAlert";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";
import { assessCandidate, loadCandidatesAwaitingDocuments } from "../scheduled/documentReminderJob";
import { requireValidAdminSession } from "./adminAuth";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Message WhatsApp prérempli du comptoir : nomme la prochaine pièce, sans échéance ni promesse. */
export function followUpMessage(input: { fullName: string; missing: number; replace: number; firstLabel: string | null }): string {
  const toDo = input.missing + input.replace;
  const first = input.fullName.trim().split(/\s+/)[0] || "";
  return [
    `Bonjour ${first}, c'est 3M Travel & Services.`,
    `Il vous reste ${toDo} pièce${toDo > 1 ? "s" : ""} à envoyer pour votre dossier${input.firstLabel ? ` (prochaine pièce : ${input.firstLabel})` : ""}.`,
    "Vous pouvez les envoyer en un geste depuis votre espace client, photo du téléphone comprise. Besoin d'aide ? Répondez ici.",
  ].join("\n");
}

export const documentFollowUpRouter = router({
  /**
   * Candidats dont le dossier attend des pièces, classés par inactivité : de quoi relancer d'un clic (WhatsApp) sans chercher.
   * Lecture seule ; les relances automatiques par e-mail suivent leurs propres règles (3 maximum, désinscription respectée).
   */
  listCandidatesToRemind: publicProcedure.input(z.object({ sessionToken: z.string().min(1).max(512), limit: z.number().int().min(1).max(200).default(100) })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
    const now = Date.now();
    const candidates = await loadCandidatesAwaitingDocuments(db, 500);
    const items = [];
    for (const candidate of candidates) {
      const assessment = await assessCandidate(db, candidate);
      const toDo = assessment.summary.missing + assessment.summary.replace;
      if (toDo <= 0) continue;
      const firstLabel = assessment.summary.firstReplaceLabel ?? assessment.summary.firstMissingLabel;
      items.push({
        candidateId: candidate.id,
        fullName: candidate.fullName,
        email: candidate.email,
        hasWhatsApp: Boolean(normalizeWhatsAppNumber(candidate.phone)),
        whatsappNumber: normalizeWhatsAppNumber(candidate.phone),
        whatsappMessage: followUpMessage({ fullName: candidate.fullName, missing: assessment.summary.missing, replace: assessment.summary.replace, firstLabel }),
        daysInactive: Math.max(0, Math.floor((now - assessment.lastActivityAt.getTime()) / DAY_MS)),
        lastActivityAt: assessment.lastActivityAt.toISOString(),
        missing: assessment.summary.missing,
        replace: assessment.summary.replace,
        total: assessment.summary.total,
        firstLabel,
        remindersSinceActivity: assessment.remindersSinceActivity,
        optedOut: assessment.optedOut,
      });
    }
    items.sort((a, b) => b.daysInactive - a.daysInactive || b.missing - a.missing);
    return { count: items.length, items: items.slice(0, input.limit) };
  }),
});
