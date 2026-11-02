/**
 * Envoi système d’une relance dynamique (sans session admin) :
 * espace client + e-mail brandé, journal d’audit, anti-doublon 24 h.
 */

import { and, desc, eq, gte, isNull } from "drizzle-orm";
import {
  agencyDossiers,
  applications,
  candidateMessages,
  candidates,
  paymentAuditLogs,
} from "../../drizzle/schema";
import { clientNotifications } from "../../drizzle/caseTrackingSchema";
import { accountReference, agencyDossierReference, resolveClientReference } from "../../shared/caseReference";
import { sendClientNotificationEmail } from "../emailService";
import type { getDb } from "../db";
import { composeDynamicRelance, buildWhatsAppUrlFromBody } from "./dynamicRelance";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export const SYSTEM_RELANCE_ACTOR = "system:pilotage-auto";

const DEDUPE_HOURS = 24;

export type DeliverRelanceInput = {
  /** `account_123`, `online_123`, `agency_123` */
  openId: string;
  stage: string;
  channel?: "email" | "whatsapp" | "both";
  useAi?: boolean;
  actorEmail?: string;
  /** Si true, ne vérifie pas le dédoublonnage 24 h. */
  force?: boolean;
};

export type DeliverRelanceResult = {
  sent: boolean;
  alreadySent: boolean;
  emailSent: boolean;
  skipped: string | null;
  stage: string;
  reference: string | null;
};

export async function deliverDynamicRelance(
  db: Db,
  input: DeliverRelanceInput,
): Promise<DeliverRelanceResult> {
  const actor = (input.actorEmail || SYSTEM_RELANCE_ACTOR).trim() || SYSTEM_RELANCE_ACTOR;
  const channel = input.channel || "email";
  const rawId = input.openId.trim();
  const accountMatch = /^account_(\d+)$/.exec(rawId);
  const onlineMatch = /^online_(\d+)$/.exec(rawId);
  const agencyMatch = /^agency_(\d+)$/.exec(rawId);

  let candidateRow: typeof candidates.$inferSelect | null = null;
  let reference = "";
  let destination: string | null = null;
  let visaType: string | null = null;
  let phone: string | null = null;

  if (accountMatch) {
    const id = Number(accountMatch[1]);
    const [row] = await db.select().from(candidates).where(and(eq(candidates.id, id), isNull(candidates.deletedAt))).limit(1);
    if (!row) return { sent: false, alreadySent: false, emailSent: false, skipped: "compte_introuvable", stage: input.stage, reference: null };
    candidateRow = row;
    // Un compte dont le dossier est activé s'adresse par son numéro « 3M-… », jamais par « COMPTE-… » (cohérence avec l'espace client).
    const [activated] = await db.select({ id: agencyDossiers.id, status: agencyDossiers.status, initialPaymentStatus: agencyDossiers.initialPaymentStatus }).from(agencyDossiers)
      .where(and(eq(agencyDossiers.email, row.email), isNull(agencyDossiers.deletedAt))).orderBy(desc(agencyDossiers.createdAt)).limit(1);
    reference = resolveClientReference({ candidateId: row.id, agencyDossier: activated ?? null }).reference;
    destination = row.destination || null;
    visaType = row.visaType || null;
    phone = row.phone || null;
  } else if (onlineMatch) {
    const id = Number(onlineMatch[1]);
    const [app] = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
    if (!app) return { sent: false, alreadySent: false, emailSent: false, skipped: "dossier_introuvable", stage: input.stage, reference: null };
    const [row] = await db.select().from(candidates).where(eq(candidates.email, app.email)).limit(1);
    if (!row) return { sent: false, alreadySent: false, emailSent: false, skipped: "compte_lie_introuvable", stage: input.stage, reference: app.dossierNumber };
    candidateRow = row;
    reference = app.dossierNumber || accountReference(row.id);
    destination = app.destination || row.destination || null;
    visaType = app.visaType || row.visaType || null;
    phone = app.whatsappNumber || row.phone || null;
  } else if (agencyMatch) {
    const id = Number(agencyMatch[1]);
    const [dossier] = await db.select().from(agencyDossiers).where(and(eq(agencyDossiers.id, id), isNull(agencyDossiers.deletedAt))).limit(1);
    if (!dossier) return { sent: false, alreadySent: false, emailSent: false, skipped: "agence_introuvable", stage: input.stage, reference: null };
    const [row] = await db.select().from(candidates).where(eq(candidates.email, dossier.email)).limit(1);
    if (!row) return { sent: false, alreadySent: false, emailSent: false, skipped: "compte_lie_introuvable", stage: input.stage, reference: agencyDossierReference(dossier.id) };
    candidateRow = row;
    reference = agencyDossierReference(dossier.id);
    destination = dossier.destination || row.destination || null;
    visaType = dossier.visaType || row.visaType || null;
    phone = dossier.phone || row.phone || null;
  } else {
    return { sent: false, alreadySent: false, emailSent: false, skipped: "reference_invalide", stage: input.stage, reference: null };
  }

  if (!input.force) {
    const since = new Date(Date.now() - DEDUPE_HOURS * 60 * 60 * 1000);
    const [existing] = await db
      .select({ id: paymentAuditLogs.id, details: paymentAuditLogs.details })
      .from(paymentAuditLogs)
      .where(
        and(
          eq(paymentAuditLogs.paymentId, candidateRow.id),
          eq(paymentAuditLogs.candidateEmail, candidateRow.email),
          eq(paymentAuditLogs.action, "dynamic_relance_sent"),
          gte(paymentAuditLogs.createdAt, since),
        ),
      )
      .orderBy(desc(paymentAuditLogs.createdAt))
      .limit(5);
    if (existing) {
      try {
        const details = JSON.parse(existing.details || "{}") as { stage?: string; autoPilotage?: boolean };
        if (details.stage === input.stage || details.autoPilotage) {
          return { sent: false, alreadySent: true, emailSent: false, skipped: null, stage: input.stage, reference };
        }
      } catch {
        return { sent: false, alreadySent: true, emailSent: false, skipped: null, stage: input.stage, reference };
      }
    }
  }

  const composed = await composeDynamicRelance({
    stage: input.stage,
    name: candidateRow.fullName,
    reference,
    email: candidateRow.email,
    phone,
    visaType,
    projectType: visaType,
    destination,
    useAi: input.useAi === true,
  });

  const notificationResult = await db.insert(clientNotifications).values({
    candidateId: candidateRow.id,
    type: "admin_relance",
    title: composed.subject,
    body: composed.body,
    actionUrl: "/mon-espace",
    isRead: false,
  });
  const notificationId = Number((notificationResult as any)[0]?.insertId || 0);
  await db.insert(candidateMessages).values({
    candidateId: candidateRow.id,
    notificationId: notificationId || null,
    senderRole: "advisor",
    content: composed.clientSpaceContent,
    isRead: false,
  });

  let emailSent = false;
  if (channel === "email" || channel === "both") {
    emailSent = await sendClientNotificationEmail({
      to: candidateRow.email,
      fullName: candidateRow.fullName,
      title: composed.subject,
      body: composed.body,
      actionUrl: "/mon-espace",
      sourceLabel: "3M TRAVEL AGENCY",
    });
    if (emailSent && notificationId > 0) {
      await db.update(clientNotifications).set({ emailSentAt: new Date() }).where(eq(clientNotifications.id, notificationId));
    }
  }

  if (channel === "whatsapp" || channel === "both") {
    buildWhatsAppUrlFromBody(phone, composed.body);
  }

  await db.insert(paymentAuditLogs).values({
    adminName: actor,
    adminEmail: actor.includes("@") ? actor : "",
    action: "dynamic_relance_sent",
    paymentId: candidateRow.id,
    candidateEmail: candidateRow.email,
    amount: "0",
    details: JSON.stringify({
      stage: composed.stage,
      channel,
      emailSent,
      autoPilotage: true,
      reference,
      openId: rawId,
      sentBy: actor,
    }),
  });

  return { sent: true, alreadySent: false, emailSent, skipped: null, stage: composed.stage, reference };
}
