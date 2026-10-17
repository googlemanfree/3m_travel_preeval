/**
 * Vague 1 — après envoi du bilan d’évaluation, demande pro de justificatifs
 * (e-mail + espace client), une seule fois par candidat.
 */

import { and, desc, eq, sql } from "drizzle-orm";
import {
  candidateMessages,
  candidates,
  paymentAuditLogs,
  applications,
} from "../../drizzle/schema";
import { clientNotifications } from "../../drizzle/caseTrackingSchema";
import {
  buildRegistrationInfoClientSpaceContent,
  buildRegistrationInfoRequest,
  isEvaluationCompleteForJustificatifs,
  registrationInfoRequestEmailHtml,
  registrationInfoRequestPlainBody,
} from "../../shared/registrationInfoRequest";
import { sendEmail } from "../_core/email";
import { sendClientNotificationEmail } from "../emailService";
import type { getDb } from "../db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export const JUSTIFICATIFS_AUTO_ACTOR = "system:bilan-envoye";

export type AutoJustificatifsResult = {
  sent: boolean;
  alreadySent: boolean;
  emailSent: boolean;
  skipped: string | null;
  itemCount: number;
};

/**
 * Envoie la demande de documents justificatifs une fois le bilan livré.
 * Idempotent via notification `registration_info_request`.
 */
export async function maybeSendJustificatifsAfterBilan(
  db: Db,
  applicationId: number,
  options?: { actorEmail?: string | null },
): Promise<AutoJustificatifsResult> {
  const actor = (options?.actorEmail || JUSTIFICATIFS_AUTO_ACTOR).trim() || JUSTIFICATIFS_AUTO_ACTOR;

  const [app] = await db
    .select({
      id: applications.id,
      email: applications.email,
      fullName: applications.fullName,
      destination: applications.destination,
      visaType: applications.visaType,
      dossierNumber: applications.dossierNumber,
      candidateId: applications.candidateId,
      cvUrl: applications.cvUrl,
      evaluationDeliveryStatus: applications.evaluationDeliveryStatus,
      evaluationClientConfirmedAt: applications.evaluationClientConfirmedAt,
    })
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (!app) {
    return { sent: false, alreadySent: false, emailSent: false, skipped: "dossier_introuvable", itemCount: 0 };
  }

  let evaluationDeclarationStatus: string | null = null;
  let evaluationReviewedAt: Date | null = null;
  let candidateId = app.candidateId ?? null;

  if (candidateId) {
    const [account] = await db
      .select({
        evaluationDeclarationStatus: candidates.evaluationDeclarationStatus,
        evaluationReviewedAt: candidates.evaluationReviewedAt,
      })
      .from(candidates)
      .where(eq(candidates.id, candidateId))
      .limit(1);
    evaluationDeclarationStatus = account?.evaluationDeclarationStatus ?? null;
    evaluationReviewedAt = account?.evaluationReviewedAt ?? null;
  } else if (app.email) {
    const [linked] = await db
      .select({
        id: candidates.id,
        evaluationDeclarationStatus: candidates.evaluationDeclarationStatus,
        evaluationReviewedAt: candidates.evaluationReviewedAt,
      })
      .from(candidates)
      .where(sql`LOWER(TRIM(${candidates.email})) = LOWER(TRIM(${app.email}))`)
      .limit(1);
    if (linked) {
      candidateId = linked.id;
      evaluationDeclarationStatus = linked.evaluationDeclarationStatus;
      evaluationReviewedAt = linked.evaluationReviewedAt;
    }
  }

  if (
    !isEvaluationCompleteForJustificatifs({
      evaluationDeclarationStatus,
      evaluationReviewedAt,
      evaluationDeliveryStatus: app.evaluationDeliveryStatus,
      evaluationClientConfirmedAt: app.evaluationClientConfirmedAt,
    })
  ) {
    return { sent: false, alreadySent: false, emailSent: false, skipped: "evaluation_incomplete", itemCount: 0 };
  }

  const destination = String(app.destination || "").trim();
  const visaType = String(app.visaType || "").trim();
  if (!destination || !visaType) {
    return { sent: false, alreadySent: false, emailSent: false, skipped: "destination_ou_visa_manquant", itemCount: 0 };
  }

  if (candidateId) {
    const [existing] = await db
      .select({ id: clientNotifications.id })
      .from(clientNotifications)
      .where(
        and(
          eq(clientNotifications.candidateId, candidateId),
          eq(clientNotifications.type, "registration_info_request"),
        ),
      )
      .orderBy(desc(clientNotifications.createdAt))
      .limit(1);
    if (existing) {
      return { sent: false, alreadySent: true, emailSent: false, skipped: null, itemCount: 0 };
    }
  }

  const request = buildRegistrationInfoRequest({
    destination,
    visaType,
    hasCv: Boolean(app.cvUrl?.trim()),
  });
  const portalUrl = "/mon-espace?section=documents";
  const plainBody = registrationInfoRequestPlainBody({
    fullName: app.fullName,
    destination: request.destination,
    visaType: request.visaType,
    items: request.items,
    reference: app.dossierNumber,
  });
  const clientSpaceContent = buildRegistrationInfoClientSpaceContent({
    destination: request.destination,
    visaType: request.visaType,
    reference: app.dossierNumber,
    body: plainBody,
  });
  const html = registrationInfoRequestEmailHtml({
    fullName: app.fullName,
    destination: request.destination,
    visaType: request.visaType,
    items: request.items,
    portalUrl,
    reference: app.dossierNumber,
  });

  let emailSent = false;
  try {
    await sendEmail({ to: app.email, subject: request.subject, html });
    emailSent = true;
  } catch (error) {
    console.error("[autoJustificatifsAfterBilan] email HTML failed — fallback brandé", error);
    emailSent = await sendClientNotificationEmail({
      to: app.email,
      fullName: app.fullName,
      title: request.subject.replace(/\s*—\s*3M TRAVEL AGENCY$/i, "").trim() || "Documents justificatifs",
      body: plainBody,
      actionUrl: portalUrl,
      sourceLabel: "3M TRAVEL AGENCY",
    });
  }

  if (candidateId) {
    const notificationResult = await db.insert(clientNotifications).values({
      candidateId,
      type: "registration_info_request",
      title: `Documents justificatifs — ${request.destination} · ${request.visaType}`,
      body: `${request.items.length} pièce(s) demandée(s) après évaluation. Consultez Documents dans votre espace.`,
      actionUrl: portalUrl,
      isRead: false,
      emailSentAt: emailSent ? new Date() : null,
    });
    const notificationId = Number((notificationResult as any)[0]?.insertId || 0);
    await db.insert(candidateMessages).values({
      candidateId,
      notificationId: notificationId || null,
      senderRole: "advisor",
      content: clientSpaceContent,
      isRead: false,
    });
  }

  try {
    await db.insert(paymentAuditLogs).values({
      adminName: actor,
      adminEmail: actor.includes("@") ? actor : "",
      action: "justificatifs_info_request_sent",
      paymentId: candidateId || applicationId,
      candidateEmail: app.email,
      amount: "0",
      details: JSON.stringify({
        destination: request.destination,
        visaType: request.visaType,
        itemCount: request.items.length,
        emailSent,
        autoAfterBilan: true,
        reference: app.dossierNumber,
        applicationId,
        sentBy: actor,
      }),
    });
  } catch (error) {
    console.warn("[autoJustificatifsAfterBilan] audit skip", error);
  }

  return {
    sent: true,
    alreadySent: false,
    emailSent,
    skipped: null,
    itemCount: request.items.length,
  };
}
