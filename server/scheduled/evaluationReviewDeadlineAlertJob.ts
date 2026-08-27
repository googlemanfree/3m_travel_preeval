import type { Request, Response } from "express";
import { and, eq, gte, isNull, lte } from "drizzle-orm";
import { adminNotifications, evaluations } from "../../drizzle/schema";
import { sdk } from "../_core/sdk";
import { getDb } from "../db";

export const REVIEW_ALERT_WINDOW_MS = 4 * 60 * 60 * 1000;

type ReviewAlertCandidate = {
  id: number;
  referenceCode: string | null;
  destinationCountry: string | null;
  reviewDeadline: Date | null;
  reviewedAt: Date | null;
  reviewDeadlineAlertedAt: Date | null;
};

export function shouldCreateReviewDeadlineAlert(
  evaluation: ReviewAlertCandidate,
  now = new Date(),
): boolean {
  if (!evaluation.reviewDeadline || evaluation.reviewedAt || evaluation.reviewDeadlineAlertedAt) return false;
  const deadline = evaluation.reviewDeadline.getTime();
  const current = now.getTime();
  return deadline > current && deadline <= current + REVIEW_ALERT_WINDOW_MS;
}

/**
 * Alerte interne idempotente : aucun e-mail candidat, aucune donnée sensible
 * ni décision. Les conseillers de type « evaluation » reçoivent une entrée
 * dans leur centre de notifications avant l’échéance de revue.
 */
export async function handleEvaluationReviewDeadlineAlertJob(req: Request, res: Response): Promise<void> {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      res.status(403).json({ error: "cron-only" });
      return;
    }

    const db = await getDb();
    if (!db) {
      res.status(500).json({ error: "database-unavailable", timestamp: new Date().toISOString() });
      return;
    }

    const now = new Date();
    const alertLimit = new Date(now.getTime() + REVIEW_ALERT_WINDOW_MS);
    const candidates = await db
      .select({
        id: evaluations.id,
        referenceCode: evaluations.referenceCode,
        destinationCountry: evaluations.destinationCountry,
        reviewDeadline: evaluations.reviewDeadline,
        reviewedAt: evaluations.reviewedAt,
        reviewDeadlineAlertedAt: evaluations.reviewDeadlineAlertedAt,
      })
      .from(evaluations)
      .where(and(
        isNull(evaluations.reviewedAt),
        isNull(evaluations.reviewDeadlineAlertedAt),
        gte(evaluations.reviewDeadline, now),
        lte(evaluations.reviewDeadline, alertLimit),
      ))
      .limit(200);

    let created = 0;
    let skipped = 0;
    for (const candidate of candidates) {
      if (!shouldCreateReviewDeadlineAlert(candidate, now)) {
        skipped++;
        continue;
      }

      const claimAt = new Date();
      const claim = await db
        .update(evaluations)
        .set({ reviewDeadlineAlertedAt: claimAt })
        .where(and(
          eq(evaluations.id, candidate.id),
          isNull(evaluations.reviewedAt),
          isNull(evaluations.reviewDeadlineAlertedAt),
        ));
      const claimed = Number((claim as any)[0]?.affectedRows ?? 0) > 0;
      if (!claimed) {
        skipped++;
        continue;
      }

      try {
        const reference = candidate.referenceCode ?? `#${candidate.id}`;
        const destination = candidate.destinationCountry ? ` — ${candidate.destinationCountry}` : "";
        await db.insert(adminNotifications).values({
          type: "evaluation_review_deadline",
          title: "Revue d’évaluation à traiter bientôt",
          message: `La revue ${reference}${destination} atteint son échéance dans moins de 4 heures. Ouvrez la file de revue pour la traiter ou documenter le suivi.`,
          relatedId: String(candidate.id),
          targetAdminType: "evaluation",
          isRead: false,
        });
        created++;
      } catch (error) {
        // Libère le marqueur seulement lorsque la création de l’alerte a échoué,
        // afin qu’un nouveau passage puisse réessayer sans dupliquer une alerte réussie.
        await db
          .update(evaluations)
          .set({ reviewDeadlineAlertedAt: null })
          .where(and(eq(evaluations.id, candidate.id), eq(evaluations.reviewDeadlineAlertedAt, claimAt)));
        throw error;
      }
    }

    res.status(200).json({ ok: true, created, skipped, checked: candidates.length, timestamp: now.toISOString() });
  } catch (error) {
    res.status(500).json({
      error: "evaluation-review-alert-job-failed",
      message: error instanceof Error ? error.message : "unknown-error",
      timestamp: new Date().toISOString(),
    });
  }
}
