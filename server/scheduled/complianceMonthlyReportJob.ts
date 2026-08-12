/**
 * Job Heartbeat — Rapport mensuel de conformité documentaire (Option A)
 * Endpoint: POST /api/scheduled/compliance-monthly-report
 * Cron: "0 0 8 1 * *" (Le 1er de chaque mois à 8h00 UTC)
 */

import { Request, Response } from "express";
import { getDb } from "../db";
import { clientDocuments, emailDeliveryLogs, evaluations } from "../../drizzle/schema";
import { sendEmail } from "../_core/email";
import { and, eq, gte, lt } from "drizzle-orm";

type MonthlyDocumentRecord = {
  destinationCountry: string | null;
  destinationCategory: string | null;
  verificationStatus: "approved" | "pending" | "rejected";
};

export type CountryComplianceStats = {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
};

export function buildCountryComplianceStats(records: MonthlyDocumentRecord[]): Record<string, CountryComplianceStats> {
  return records.reduce<Record<string, CountryComplianceStats>>((stats, record) => {
    const country = record.destinationCountry?.trim() || record.destinationCategory || "Non renseignée";
    const current = stats[country] ?? { total: 0, approved: 0, pending: 0, rejected: 0 };
    current.total += 1;
    current[record.verificationStatus] += 1;
    stats[country] = current;
    return stats;
  }, {});
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export function getAuditorRecipients(): string[] {
  const configuredRecipients = process.env.COMPLIANCE_AUDITOR_EMAILS ?? "";
  return Array.from(new Set(configuredRecipients.split(",").map(email => email.trim().toLowerCase()).filter(email => /^\S+@\S+\.\S+$/.test(email))));
}

export async function handleComplianceMonthlyReportJob(req: Request, res: Response): Promise<void> {
  try {
    console.log("[Compliance Monthly Report] Starting monthly audit report generation...");

    const db = await getDb();
    if (!db) {
      res.status(500).json({ error: "Database unavailable" });
      return;
    }

    const now = new Date();
    const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const monthName = periodStart.toLocaleString("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
    const subject = `[Audit Mensuel] Rapport de conformité documentaire — ${monthName}`;

    const documents = await db.select({
      destinationCountry: evaluations.destinationCountry,
      destinationCategory: evaluations.destinationCategory,
      verificationStatus: clientDocuments.verificationStatus,
    })
      .from(clientDocuments)
      .leftJoin(evaluations, eq(clientDocuments.evaluationId, evaluations.id))
      .where(and(gte(clientDocuments.uploadedAt, periodStart), lt(clientDocuments.uploadedAt, periodEnd)));
    const totalDocs = documents.length;
    const verifiedDocs = documents.filter((d) => d.verificationStatus === "approved").length;
    const pendingDocs = documents.filter((d) => d.verificationStatus === "pending").length;
    const rejectedDocs = documents.filter((d) => d.verificationStatus === "rejected").length;
    const globalComplianceRate = totalDocs > 0 ? Math.round((verifiedDocs / totalDocs) * 100) : 100;
    const countryStats = buildCountryComplianceStats(documents);

    // Construire le contenu HTML du rapport d'audit mensuel
    const reportHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
          Rapport d'Audit Mensuel de Conformité Documentaire — 3M Travel & Services
        </h2>
        <p style="font-size: 14px; color: #64748b;">Période : <strong>${monthName}</strong></p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e293b;">Indicateurs clés</h3>
          <ul style="padding-left: 20px; line-height: 1.6;">
            <li>Documents soumis au total : <strong>${totalDocs}</strong></li>
            <li>Documents vérifiés et approuvés : <strong style="color: #16a34a;">${verifiedDocs}</strong></li>
            <li>Documents en attente de révision : <strong style="color: #ca8a04;">${pendingDocs}</strong></li>
            <li>Documents rejetés / à corriger : <strong style="color: #dc2626;">${rejectedDocs}</strong></li>
            <li>Taux global de conformité : <strong style="color: #2563eb; font-size: 16px;">${globalComplianceRate} %</strong></li>
          </ul>
        </div>

        <h3 style="color: #0f172a;">Détail par pays de destination</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <thead>
            <tr style="background-color: #f1f5f9; text-align: left;">
              <th style="padding: 10px; border: 1px solid #e2e8f0;">Pays de destination</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0;">Total soumis</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0;">Conformes</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0;">Taux</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(countryStats)
              .sort(([left], [right]) => left.localeCompare(right, "fr"))
              .map(([country, stats]) => {
                const rate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;
                return `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${escapeHtml(country)}</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${stats.total}</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${stats.approved}</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: ${rate >= 80 ? '#16a34a' : '#ca8a04'};">${rate} %</td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>

        <p style="font-size: 12px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #e2e8f0; pt-10px;">
          Ce rapport est généré automatiquement par le système de conformité de 3M Travel & Services. Pour toute question, contactez l'administration via <a href="mailto:hello@3mtravelagency.com">hello@3mtravelagency.com</a>.
        </p>
      </div>
    `;

    const auditors = getAuditorRecipients();
    if (auditors.length === 0) {
      res.status(503).json({ error: "COMPLIANCE_AUDITOR_EMAILS doit contenir au moins un auditeur autorisé." });
      return;
    }

    let sentCount = 0;
    for (const auditorEmail of auditors) {
      try {
        const alreadySent = await db.select({ id: emailDeliveryLogs.id })
          .from(emailDeliveryLogs)
          .where(and(
            eq(emailDeliveryLogs.recipientEmail, auditorEmail),
            eq(emailDeliveryLogs.subject, subject),
            eq(emailDeliveryLogs.status, "sent"),
          ))
          .limit(1);
        if (alreadySent.length > 0) continue;

        await sendEmail({
          to: auditorEmail,
          subject,
          html: reportHtml,
        });
        sentCount++;
      } catch (err) {
        console.error(`[Compliance Monthly Report] Failed to send report to ${auditorEmail}:`, err);
      }
    }

    console.log(`[Compliance Monthly Report] Successfully generated and sent report for ${monthName} to ${sentCount} recipients.`);

    res.status(200).json({
      success: true,
      message: `Rapport mensuel généré et envoyé à ${sentCount} auditeurs`,
      month: monthName,
      metrics: {
        totalDocs,
        verifiedDocs,
        pendingDocs,
        rejectedDocs,
        globalComplianceRate,
      },
    });
  } catch (err) {
    console.error("[Compliance Monthly Report] Fatal error:", err);
    res.status(500).json({
      error: "Compliance monthly report job failed",
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
