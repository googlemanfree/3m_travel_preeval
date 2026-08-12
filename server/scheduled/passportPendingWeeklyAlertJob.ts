/**
 * Job Heartbeat — alerte hebdomadaire des passeports en attente de vérification humaine.
 * Endpoint : POST /api/scheduled/passport-pending-weekly-alert
 * Cron projet : 0 0 9 * * 1 (lundi à 09:00 UTC).
 */

import type { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { clientDocuments, emailDeliveryLogs } from "../../drizzle/schema";
import { sendEmail } from "../_core/email";
import { getAuditorRecipients } from "./complianceMonthlyReportJob";

type PendingPassportRecord = {
  documentType: string;
  uploadedAt: Date;
};

export function buildPendingPassportSummary(records: PendingPassportRecord[]): {
  total: number;
  byType: Record<string, number>;
} {
  return records.reduce(
    (summary, record) => {
      summary.total += 1;
      summary.byType[record.documentType] = (summary.byType[record.documentType] ?? 0) + 1;
      return summary;
    },
    { total: 0, byType: {} as Record<string, number> },
  );
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

export async function handlePassportPendingWeeklyAlertJob(_req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      res.status(500).json({ error: "Database unavailable" });
      return;
    }

    const pendingDocuments = await db
      .select({ documentType: clientDocuments.documentType, uploadedAt: clientDocuments.uploadedAt })
      .from(clientDocuments)
      .where(and(
        eq(clientDocuments.documentType, "passport"),
        eq(clientDocuments.verificationStatus, "pending"),
      ));
    const summary = buildPendingPassportSummary(pendingDocuments);

    if (summary.total === 0) {
      res.status(200).json({ success: true, sentCount: 0, pendingCount: 0, skipped: "no-pending-passports" });
      return;
    }

    const auditors = getAuditorRecipients();
    if (auditors.length === 0) {
      res.status(503).json({ error: "COMPLIANCE_AUDITOR_EMAILS doit contenir au moins un auditeur autorisé." });
      return;
    }

    const weekKey = new Date().toISOString().slice(0, 10);
    const subject = `[Alerte hebdomadaire] ${summary.total} passeport(s) en attente de vérification — 3M Travel & Services`;
    const typeRows = Object.entries(summary.byType)
      .sort(([left], [right]) => left.localeCompare(right, "fr"))
      .map(([type, count]) => `<li><strong>${escapeHtml(type)}</strong> : ${count}</li>`)
      .join("");
    const html = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#1f2937">
      <h2 style="color:#1e3a8a">Vérification humaine requise</h2>
      <p>${summary.total} passeport(s) attendent une décision humaine dans le tableau de bord administrateur.</p>
      <p><strong>Semaine de contrôle :</strong> ${weekKey}</p>
      <ul>${typeRows}</ul>
      <p>La prévalidation automatique est désactivée. Ouvrez la section Documents pour approuver ou rejeter chaque document et laisser une trace de la décision.</p>
      <p><a href="https://www.3mtravelagency.com/admin/documents" style="display:inline-block;background:#1e3a8a;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">Ouvrir les documents</a></p>
      <p style="font-size:12px;color:#64748b">Notification générée automatiquement par 3M Travel & Services.</p>
    </div>`;

    let sentCount = 0;
    for (const auditorEmail of auditors) {
      const alreadySent = await db
        .select({ id: emailDeliveryLogs.id })
        .from(emailDeliveryLogs)
        .where(and(
          eq(emailDeliveryLogs.recipientEmail, auditorEmail),
          eq(emailDeliveryLogs.subject, subject),
          eq(emailDeliveryLogs.status, "sent"),
        ))
        .limit(1);
      if (alreadySent.length > 0) continue;

      try {
        await sendEmail({ to: auditorEmail, subject, html });
        sentCount += 1;
      } catch (error) {
        console.error(`[Passport Pending Weekly Alert] Failed for ${auditorEmail}:`, error);
      }
    }

    res.status(200).json({ success: true, sentCount, pendingCount: summary.total });
  } catch (error) {
    console.error("[Passport Pending Weekly Alert] Fatal error:", error);
    res.status(500).json({
      error: "Passport pending weekly alert failed",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
