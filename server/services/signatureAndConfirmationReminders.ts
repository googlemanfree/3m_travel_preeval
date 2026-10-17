/**
 * Rappels automatiques :
 * - Protocole N°01 non signé après paiement (J+2, anti-doublon 3 j)
 * - Protocole N°02 prêt non signé (J+2)
 * - Confirmation de bilan manquante (J+2)
 */

import { and, desc, eq, gte, isNotNull, isNull, lt, sql } from "drizzle-orm";
import {
  applications,
  candidates,
  candidateMessages,
  paymentAuditLogs,
} from "../../drizzle/schema";
import { clientNotifications } from "../../drizzle/caseTrackingSchema";
import { sendEmail } from "../_core/email";
import { sendClientNotificationEmail } from "../emailService";
import type { getDb } from "../db";
import { composeDynamicRelance } from "./dynamicRelance";
import {
  notifyAgreementSignatureReminderWhatsApp,
  notifyBilanConfirmationReminderWhatsApp,
  notifySecondAgreementSignatureReminderWhatsApp,
} from "./clientWhatsAppNotify";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

const DAY_MS = 24 * 60 * 60 * 1000;
export const REMINDER_MIN_AGE_DAYS = 2;
export const REMINDER_DEDUPE_DAYS = 3;
export const SYSTEM_REMINDER_ACTOR = "system:signature-confirmation-reminders";

export type ReminderKind = "protocol_one" | "protocol_two" | "bilan_confirmation";

export type ReminderOutcome = {
  kind: ReminderKind;
  dossierNumber: string;
  email: string;
  planned: boolean;
  emailSent: boolean;
  whatsappSent: boolean;
  skipped?: string;
};

function siteUrl(): string {
  return (process.env.SITE_URL || "https://www.3mtravelagency.com").replace(/\/+$/, "");
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function recentlyReminded(
  db: Db,
  input: { paymentId: number; email: string; action: string; since: Date },
): Promise<boolean> {
  const [row] = await db
    .select({ id: paymentAuditLogs.id })
    .from(paymentAuditLogs)
    .where(
      and(
        eq(paymentAuditLogs.paymentId, input.paymentId),
        eq(paymentAuditLogs.candidateEmail, input.email),
        eq(paymentAuditLogs.action, input.action),
        gte(paymentAuditLogs.createdAt, input.since),
      ),
    )
    .orderBy(desc(paymentAuditLogs.createdAt))
    .limit(1);
  return Boolean(row);
}

async function resolveCandidateId(db: Db, email: string, candidateId?: number | null): Promise<number | null> {
  if (candidateId) return candidateId;
  const [row] = await db
    .select({ id: candidates.id, phone: candidates.phone })
    .from(candidates)
    .where(and(sql`LOWER(TRIM(${candidates.email})) = ${email.trim().toLowerCase()}`, isNull(candidates.deletedAt)))
    .limit(1);
  return row?.id ?? null;
}

async function resolvePhone(
  db: Db,
  email: string,
  preferred?: string | null,
): Promise<string | null> {
  if (preferred?.trim()) return preferred.trim();
  const [row] = await db
    .select({ phone: candidates.phone })
    .from(candidates)
    .where(and(sql`LOWER(TRIM(${candidates.email})) = ${email.trim().toLowerCase()}`, isNull(candidates.deletedAt)))
    .limit(1);
  return row?.phone || null;
}

function protocolOneEmailHtml(fullName: string, dossierNumber: string): string {
  const safeName = escapeHtml(fullName);
  const safeDossier = escapeHtml(dossierNumber);
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#eef2f7;padding:24px;font-family:Arial,sans-serif"><div style="max-width:620px;margin:auto;background:#fff;border-radius:18px;overflow:hidden"><div style="background:#0f2460;color:#fff;padding:28px;text-align:center"><strong style="font-size:22px">3M TRAVEL AGENCY</strong><p style="margin:8px 0 0;color:#dbeafe">Rappel : signature de votre protocole d’accord</p></div><div style="padding:30px;color:#1f2937"><p>Bonjour ${safeName},</p><p>Votre paiement est confirmé, mais votre protocole d’accord n’est pas encore signé. Pour poursuivre votre dossier <strong>${safeDossier}</strong>, connectez-vous à votre espace client et finalisez la signature.</p><p style="text-align:center;margin:28px 0"><a href="${siteUrl()}/mon-espace?section=dossier" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;border-radius:9px;padding:13px 24px;font-weight:bold">Ouvrir mon espace client</a></p></div><div style="border-top:2px solid #f1f5f9;padding:18px;text-align:center;color:#64748b;font-size:11px">3M TRAVEL AGENCY</div></div></body></html>`;
}

function protocolTwoEmailHtml(fullName: string, dossierNumber: string, employer?: string | null): string {
  const safeName = escapeHtml(fullName);
  const safeDossier = escapeHtml(dossierNumber);
  const employerLine = employer?.trim()
    ? `<p>Employeur / partenaire : <strong>${escapeHtml(employer.trim())}</strong></p>`
    : "";
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#eef2f7;padding:24px;font-family:Arial,sans-serif"><div style="max-width:620px;margin:auto;background:#fff;border-radius:18px;overflow:hidden"><div style="background:#0f2460;color:#fff;padding:28px;text-align:center"><strong style="font-size:22px">3M TRAVEL AGENCY</strong><p style="margin:8px 0 0;color:#dbeafe">Rappel : Protocole N°02 à signer</p></div><div style="padding:30px;color:#1f2937"><p>Bonjour ${safeName},</p><p>Le Protocole d’accord N°02 pour le dossier <strong>${safeDossier}</strong> est prêt.</p>${employerLine}<p style="text-align:center;margin:28px 0"><a href="${siteUrl()}/mon-espace?section=signatures" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;border-radius:9px;padding:13px 24px;font-weight:bold">Signer le Protocole N°02</a></p></div></div></body></html>`;
}

export async function runSignatureAndConfirmationReminders(
  db: Db,
  options?: { dryRun?: boolean; limit?: number; now?: Date },
): Promise<ReminderOutcome[]> {
  const now = options?.now ?? new Date();
  const limit = Math.min(Math.max(options?.limit ?? 80, 1), 200);
  const dryRun = Boolean(options?.dryRun);
  const minAge = new Date(now.getTime() - REMINDER_MIN_AGE_DAYS * DAY_MS);
  const dedupeSince = new Date(now.getTime() - REMINDER_DEDUPE_DAYS * DAY_MS);
  const outcomes: ReminderOutcome[] = [];

  // ——— Protocole N°01 ———
  const protocolOneRows = await db
    .select({
      id: applications.id,
      dossierNumber: applications.dossierNumber,
      fullName: applications.fullName,
      email: applications.email,
      whatsappNumber: applications.whatsappNumber,
      candidateId: applications.candidateId,
      paymentValidatedAt: applications.paymentValidatedAt,
      paymentDate: applications.paymentDate,
    })
    .from(applications)
    .where(
      and(
        isNull(applications.deletedAt),
        eq(applications.paymentStatus, "SUCCESS"),
        eq(applications.agreementSigned, false),
        isNotNull(applications.email),
      ),
    )
    .orderBy(desc(applications.paymentValidatedAt))
    .limit(limit);

  for (const row of protocolOneRows) {
    const paidAt = row.paymentValidatedAt ?? row.paymentDate;
    if (!paidAt || paidAt > minAge) {
      outcomes.push({ kind: "protocol_one", dossierNumber: row.dossierNumber, email: row.email, planned: false, emailSent: false, whatsappSent: false, skipped: "trop_tot" });
      continue;
    }
    if (await recentlyReminded(db, { paymentId: row.id, email: row.email, action: "agreement_signature_reminder_sent", since: dedupeSince })) {
      outcomes.push({ kind: "protocol_one", dossierNumber: row.dossierNumber, email: row.email, planned: false, emailSent: false, whatsappSent: false, skipped: "deja_relance" });
      continue;
    }
    if (dryRun) {
      outcomes.push({ kind: "protocol_one", dossierNumber: row.dossierNumber, email: row.email, planned: true, emailSent: false, whatsappSent: false });
      continue;
    }
    let emailSent = false;
    let whatsappSent = false;
    try {
      await sendEmail({
        to: row.email,
        subject: `Rappel — signature du protocole ${row.dossierNumber}`,
        html: protocolOneEmailHtml(row.fullName, row.dossierNumber),
      });
      emailSent = true;
    } catch (error) {
      console.warn("[signatureReminders] protocol_one email failed", { id: row.id, error });
    }
    const candidateId = await resolveCandidateId(db, row.email, row.candidateId);
    if (candidateId) {
      try {
        await db.insert(clientNotifications).values({
          candidateId,
          type: "agreement_signature_reminder",
          title: "Protocole d’accord à signer",
          body: `Votre paiement est confirmé pour le dossier ${row.dossierNumber}. Connectez-vous pour finaliser la signature.`,
          actionUrl: "/mon-espace?section=dossier",
          isRead: false,
          emailSentAt: emailSent ? now : null,
        });
      } catch {
        /* non bloquant */
      }
    }
    const phone = await resolvePhone(db, row.email, row.whatsappNumber);
    const wa = await notifyAgreementSignatureReminderWhatsApp({
      phone,
      candidateName: row.fullName,
      dossierNumber: row.dossierNumber,
    });
    whatsappSent = wa.sent;
    await db.insert(paymentAuditLogs).values({
      adminName: SYSTEM_REMINDER_ACTOR,
      adminEmail: "",
      action: "agreement_signature_reminder_sent",
      paymentId: row.id,
      candidateEmail: row.email,
      amount: "",
      details: JSON.stringify({ auto: true, kind: "protocol_one", emailSent, whatsappSent, dossierNumber: row.dossierNumber }),
    });
    if (whatsappSent) {
      await db.insert(paymentAuditLogs).values({
        adminName: SYSTEM_REMINDER_ACTOR,
        adminEmail: "",
        action: "agreement_signature_reminder_whatsapp",
        paymentId: row.id,
        candidateEmail: row.email,
        amount: "",
        details: `WhatsApp auto protocole N°01 pour ${row.dossierNumber}`,
      });
    }
    outcomes.push({ kind: "protocol_one", dossierNumber: row.dossierNumber, email: row.email, planned: true, emailSent, whatsappSent });
  }

  // ——— Protocole N°02 ———
  const protocolTwoRows = await db
    .select({
      id: applications.id,
      dossierNumber: applications.dossierNumber,
      fullName: applications.fullName,
      email: applications.email,
      whatsappNumber: applications.whatsappNumber,
      candidateId: applications.candidateId,
      secondAgreementReadyAt: applications.secondAgreementReadyAt,
      secondAgreementEmployer: applications.secondAgreementEmployer,
    })
    .from(applications)
    .where(
      and(
        isNull(applications.deletedAt),
        eq(applications.secondAgreementSigned, false),
        isNotNull(applications.secondAgreementReadyAt),
        lt(applications.secondAgreementReadyAt, minAge),
        isNotNull(applications.email),
      ),
    )
    .orderBy(desc(applications.secondAgreementReadyAt))
    .limit(limit);

  for (const row of protocolTwoRows) {
    if (await recentlyReminded(db, { paymentId: row.id, email: row.email, action: "second_agreement_signature_reminder_sent", since: dedupeSince })) {
      outcomes.push({ kind: "protocol_two", dossierNumber: row.dossierNumber, email: row.email, planned: false, emailSent: false, whatsappSent: false, skipped: "deja_relance" });
      continue;
    }
    if (dryRun) {
      outcomes.push({ kind: "protocol_two", dossierNumber: row.dossierNumber, email: row.email, planned: true, emailSent: false, whatsappSent: false });
      continue;
    }
    let emailSent = false;
    let whatsappSent = false;
    try {
      await sendEmail({
        to: row.email,
        subject: `Rappel — Protocole N°02 ${row.dossierNumber}`,
        html: protocolTwoEmailHtml(row.fullName, row.dossierNumber, row.secondAgreementEmployer),
      });
      emailSent = true;
    } catch (error) {
      console.warn("[signatureReminders] protocol_two email failed", { id: row.id, error });
    }
    const candidateId = await resolveCandidateId(db, row.email, row.candidateId);
    if (candidateId) {
      try {
        await db.insert(clientNotifications).values({
          candidateId,
          type: "agreement_signature_reminder",
          title: "Protocole N°02 à signer",
          body: `Le Protocole N°02 du dossier ${row.dossierNumber} est prêt. Finalisez la signature dans Signatures.`,
          actionUrl: "/mon-espace?section=signatures",
          isRead: false,
          emailSentAt: emailSent ? now : null,
        });
      } catch {
        /* non bloquant */
      }
    }
    const phone = await resolvePhone(db, row.email, row.whatsappNumber);
    const wa = await notifySecondAgreementSignatureReminderWhatsApp({
      phone,
      candidateName: row.fullName,
      dossierNumber: row.dossierNumber,
      employerName: row.secondAgreementEmployer,
    });
    whatsappSent = wa.sent;
    await db.insert(paymentAuditLogs).values({
      adminName: SYSTEM_REMINDER_ACTOR,
      adminEmail: "",
      action: "second_agreement_signature_reminder_sent",
      paymentId: row.id,
      candidateEmail: row.email,
      amount: "",
      details: JSON.stringify({ auto: true, kind: "protocol_two", emailSent, whatsappSent, dossierNumber: row.dossierNumber }),
    });
    outcomes.push({ kind: "protocol_two", dossierNumber: row.dossierNumber, email: row.email, planned: true, emailSent, whatsappSent });
  }

  // ——— Confirmation bilan ———
  const bilanRows = await db
    .select({
      id: applications.id,
      dossierNumber: applications.dossierNumber,
      fullName: applications.fullName,
      email: applications.email,
      whatsappNumber: applications.whatsappNumber,
      candidateId: applications.candidateId,
      destination: applications.destination,
      visaType: applications.visaType,
      evaluationCompletedAt: applications.evaluationCompletedAt,
    })
    .from(applications)
    .where(
      and(
        isNull(applications.deletedAt),
        eq(applications.evaluationDeliveryStatus, "sent"),
        isNull(applications.evaluationClientConfirmedAt),
        isNotNull(applications.evaluationCompletedAt),
        lt(applications.evaluationCompletedAt, minAge),
        isNotNull(applications.email),
      ),
    )
    .orderBy(desc(applications.evaluationCompletedAt))
    .limit(limit);

  for (const row of bilanRows) {
    if (await recentlyReminded(db, { paymentId: row.id, email: row.email, action: "bilan_confirmation_reminder_sent", since: dedupeSince })) {
      outcomes.push({ kind: "bilan_confirmation", dossierNumber: row.dossierNumber, email: row.email, planned: false, emailSent: false, whatsappSent: false, skipped: "deja_relance" });
      continue;
    }
    if (dryRun) {
      outcomes.push({ kind: "bilan_confirmation", dossierNumber: row.dossierNumber, email: row.email, planned: true, emailSent: false, whatsappSent: false });
      continue;
    }
    const composed = await composeDynamicRelance({
      stage: "bilan_confirmation_pending",
      name: row.fullName,
      reference: row.dossierNumber,
      email: row.email,
      destination: row.destination,
      visaType: row.visaType,
      useAi: false,
    });
    let emailSent = false;
    emailSent = await sendClientNotificationEmail({
      to: row.email,
      fullName: row.fullName,
      title: composed.subject,
      body: composed.body,
      actionUrl: "/mon-espace",
      sourceLabel: "3M TRAVEL AGENCY",
    });
    const candidateId = await resolveCandidateId(db, row.email, row.candidateId);
    if (candidateId) {
      try {
        const notif = await db.insert(clientNotifications).values({
          candidateId,
          type: "admin_relance",
          title: composed.subject,
          body: composed.body,
          actionUrl: "/mon-espace",
          isRead: false,
          emailSentAt: emailSent ? now : null,
        });
        const notificationId = Number((notif as any)[0]?.insertId || 0);
        await db.insert(candidateMessages).values({
          candidateId,
          notificationId: notificationId || null,
          senderRole: "advisor",
          content: composed.clientSpaceContent,
          isRead: false,
        });
      } catch {
        /* non bloquant */
      }
    }
    const phone = await resolvePhone(db, row.email, row.whatsappNumber);
    const wa = await notifyBilanConfirmationReminderWhatsApp({
      phone,
      candidateName: row.fullName,
      dossierNumber: row.dossierNumber,
    });
    await db.insert(paymentAuditLogs).values({
      adminName: SYSTEM_REMINDER_ACTOR,
      adminEmail: "",
      action: "bilan_confirmation_reminder_sent",
      paymentId: row.id,
      candidateEmail: row.email,
      amount: "0",
      details: JSON.stringify({ auto: true, kind: "bilan_confirmation", emailSent, whatsappSent: wa.sent, dossierNumber: row.dossierNumber }),
    });
    outcomes.push({
      kind: "bilan_confirmation",
      dossierNumber: row.dossierNumber,
      email: row.email,
      planned: true,
      emailSent,
      whatsappSent: wa.sent,
    });
  }

  return outcomes;
}
