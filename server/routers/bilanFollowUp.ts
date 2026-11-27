import { evaluationDisplayReference } from "../../shared/evaluationReference";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { agencySettings, applications, evaluationEmails } from "../../drizzle/schema";
import { clientNotifications } from "../../drizzle/caseTrackingSchema";
import { paymentScheduleItems } from "../../drizzle/remoteSupportSchema";
import { buildFollowUp, reminderMessage, splitInTwo, type DecisionLite, type FollowUpRow, type ReminderLite } from "../../shared/bilanFollowUp";
import { firstName } from "../../shared/remoteSupport";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { sendClientNotificationEmail } from "../emailService";
import { adminLabel } from "../services/partnerProfiles";
import { emailAllowed } from "../services/candidateSecurity";
import { isWhatsAppConfigured } from "../whatsappService";
import { absoluteSiteUrl, runBilanAutoRelances, sendBilanPdfByWhatsApp, setAutoRelanceEnabled, WHATSAPP_PREFIX } from "../services/bilanFollowUpActions";
import { recordPrivacyEvent } from "../services/privacyAudit";
import { requireValidAdminSession } from "./adminAuth";
import { unifiedRequestsRouter } from "./unifiedRequests";

/**
 * Suivi des bilans envoyés : liste de ceux qui n'ont pas répondu, entonnoir, motifs de refus, relance manuelle (une par 24 h) et proposition de paiement
 * en deux versements. Rien ne part tout seul : chaque action est déclenchée par un administrateur et inscrite au journal.
 */
const DECISION_PREFIX = "evaluation_decision:";
const REMINDER_PREFIX = "bilan_reminder:";
const session = z.string().min(1).max(512);

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
async function requireDb(): Promise<Db> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
  return db;
}

async function settingsByKey(db: Db, keys: string[]): Promise<Map<string, string>> {
  if (keys.length === 0) return new Map();
  const rows = await db.select({ settingKey: agencySettings.settingKey, settingValue: agencySettings.settingValue }).from(agencySettings).where(inArray(agencySettings.settingKey, keys));
  return new Map(rows.map((row) => [row.settingKey, row.settingValue ?? ""]));
}
const parse = <T,>(value: string | undefined): T | undefined => { try { return value ? (JSON.parse(value) as T) : undefined; } catch { return undefined; } };

async function loadApplication(db: Db, applicationId: number) {
  const [application] = await db.select().from(applications).where(eq(applications.id, applicationId)).limit(1);
  if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable." });
  if (application.evaluationDeliveryStatus !== "sent") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le bilan de ce dossier n'a pas encore été envoyé." });
  return application;
}

export const bilanFollowUpRouter = router({
  pending: publicProcedure.input(z.object({ sessionToken: session })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const rows = await db.select().from(applications).where(eq(applications.evaluationDeliveryStatus, "sent")).orderBy(desc(applications.evaluationCompletedAt)).limit(400);
    const settings = await settingsByKey(db, rows.flatMap((row) => [`${DECISION_PREFIX}${row.id}`, `${REMINDER_PREFIX}${row.id}`, `${WHATSAPP_PREFIX}${row.id}`]));
    // dernier e-mail du bilan par dossier : permet de repérer un envoi échoué ou rebondi (le candidat ne l'a alors jamais reçu)
    const emailStatus = new Map<number, "sent" | "failed" | "bounced" | "pending">();
    if (rows.length > 0) {
      try {
        const emails = await db.select({ evaluationId: evaluationEmails.evaluationId, status: evaluationEmails.status }).from(evaluationEmails).where(and(inArray(evaluationEmails.evaluationId, rows.map((row) => row.id)), eq(evaluationEmails.emailType, "admissibility_report"))).orderBy(evaluationEmails.id);
        for (const email of emails) emailStatus.set(email.evaluationId, email.status);
      } catch { /* suivi des e-mails indisponible : le reste de la liste fonctionne */ }
    }
    const decisions: Record<number, DecisionLite | undefined> = {};
    const reminders: Record<number, ReminderLite | undefined> = {};
    for (const row of rows) {
      decisions[row.id] = parse<DecisionLite>(settings.get(`${DECISION_PREFIX}${row.id}`));
      reminders[row.id] = parse<ReminderLite>(settings.get(`${REMINDER_PREFIX}${row.id}`));
    }
    const lines: FollowUpRow[] = rows.map((row) => ({
      id: row.id,
      candidateId: row.candidateId ?? null,
      fullName: row.fullName,
      email: row.email,
      dossierNumber: evaluationDisplayReference(row) ?? "sans référence",
      destination: row.destination ?? null,
      visaType: row.visaType ?? null,
      paymentAmount: Number(row.paymentAmount) || 0,
      paymentStatus: row.paymentStatus ?? null,
      sentAt: row.evaluationCompletedAt ? new Date(row.evaluationCompletedAt).toISOString() : null,
      viewedAt: row.evaluationReportViewedAt ? new Date(row.evaluationReportViewedAt).toISOString() : null,
      activationRequestedAt: row.activationRequestedAt ? new Date(row.activationRequestedAt).toISOString() : null,
      pdfUrl: row.evaluationReportPdfUrl ? absoluteSiteUrl(row.evaluationReportPdfUrl) : null,
      emailStatus: emailStatus.get(row.id) ?? null,
      whatsappSentAt: parse<{ at: string; lastOk?: boolean }>(settings.get(`${WHATSAPP_PREFIX}${row.id}`))?.lastOk ? parse<{ at: string }>(settings.get(`${WHATSAPP_PREFIX}${row.id}`))?.at ?? null : null,
    }));
    return buildFollowUp(lines, decisions, reminders);
  }),

  /** Relance manuelle : notification dans l'espace client et e-mail (si le candidat l'accepte), au plus une par 24 h et par dossier. */
  remind: publicProcedure.input(z.object({ sessionToken: session, applicationId: z.number().int().positive() })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const application = await loadApplication(db, input.applicationId);
    if (!application.candidateId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Ce dossier n'est rattaché à aucun compte candidat." });
    if (application.paymentStatus === "SUCCESS" || application.activationRequestedAt) throw new TRPCError({ code: "CONFLICT", message: "Ce candidat a déjà demandé l'ouverture de son dossier." });
    const key = `${REMINDER_PREFIX}${application.id}`;
    const previous = parse<ReminderLite>((await settingsByKey(db, [key])).get(key));
    if (previous && Date.now() - new Date(previous.at).getTime() < 24 * 60 * 60 * 1000) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Une relance a déjà été envoyée il y a moins de 24 heures." });
    const message = reminderMessage(firstName(application.fullName), application.evaluationReportPdfUrl ? absoluteSiteUrl(application.evaluationReportPdfUrl) : null);
    try { await db.insert(clientNotifications).values({ candidateId: application.candidateId, type: "evaluation_reminder", title: message.title, body: message.body, actionUrl: "/mon-espace", isRead: false }); } catch { /* l'e-mail reste tenté */ }
    let emailSent = false;
    if (await emailAllowed(db, application.candidateId)) {
      emailSent = await sendClientNotificationEmail({ to: application.email, fullName: application.fullName, title: message.title, body: message.body, actionUrl: "/mon-espace", sourceLabel: "3M TRAVEL AGENCY" }).catch(() => false);
    }
    const value = JSON.stringify({ at: new Date().toISOString(), count: (previous?.count ?? 0) + 1 } satisfies ReminderLite);
    const [existing] = await db.select({ id: agencySettings.id }).from(agencySettings).where(eq(agencySettings.settingKey, key)).limit(1);
    if (existing) await db.update(agencySettings).set({ settingValue: value }).where(eq(agencySettings.id, existing.id));
    else await db.insert(agencySettings).values({ settingKey: key, settingValue: value });
    await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: adminLabel(admin), action: "evaluation.reminded", resourceType: "application", resourceId: application.id, details: emailSent ? "relance : notification + e-mail" : "relance : notification seulement" });
    return { ok: true as const, emailSent };
  }),

  /** Envoi direct du bilan (PDF en pièce jointe) par WhatsApp ; sans WhatsApp automatique configuré, renvoie un lien WhatsApp prérempli. */
  sendWhatsApp: publicProcedure.input(z.object({ sessionToken: session, applicationId: z.number().int().positive() })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    await loadApplication(db, input.applicationId);
    let result;
    try {
      result = await sendBilanPdfByWhatsApp(db, input.applicationId);
    } catch (error) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: error instanceof Error ? error.message : "Envoi WhatsApp impossible." });
    }
    await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: adminLabel(admin), action: "evaluation.whatsapp_sent", resourceType: "application", resourceId: input.applicationId, details: result.sent ? "bilan PDF envoyé par WhatsApp" : result.configured ? "envoi WhatsApp refusé" : "WhatsApp non configuré : lien manuel proposé" });
    return result;
  }),

  /** Lien de téléchargement du bilan en PDF (à copier et coller dans WhatsApp, SMS ou e-mail). */
  pdfLink: publicProcedure.input(z.object({ sessionToken: session, applicationId: z.number().int().positive() })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const application = await loadApplication(db, input.applicationId);
    if (!application.evaluationReportPdfUrl) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le PDF de ce bilan est introuvable. Régénérez-le depuis l'éditeur du bilan." });
    return { url: absoluteSiteUrl(application.evaluationReportPdfUrl) };
  }),

  /** État de la relance automatique, avec le nombre de relances prévues au prochain passage. */
  autoRelanceStatus: publicProcedure.input(z.object({ sessionToken: session })).query(async ({ input }) => {
    await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const preview = await runBilanAutoRelances(db, { dryRun: true });
    return { enabled: preview.enabled, due: preview.due, deferred: preview.deferred, whatsappConfigured: isWhatsAppConfigured() };
  }),

  setAutoRelance: publicProcedure.input(z.object({ sessionToken: session, enabled: z.boolean() })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    await setAutoRelanceEnabled(db, input.enabled);
    await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: adminLabel(admin), action: input.enabled ? "evaluation.auto_relance_enabled" : "evaluation.auto_relance_disabled", resourceType: "settings", resourceId: 0, details: "relance automatique des bilans" });
    return { enabled: input.enabled };
  }),

  /** Lance un passage tout de suite (hors heures de bureau aussi) : « maintenant » ne s’applique qu’aux relances déjà dues. */
  runAutoRelanceNow: publicProcedure.input(z.object({ sessionToken: session })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const report = await runBilanAutoRelances(db, { ignoreWindow: true });
    await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: adminLabel(admin), action: "evaluation.auto_relance_run", resourceType: "settings", resourceId: 0, details: `${report.sent} relance(s)` });
    return { enabled: report.enabled, sent: report.sent, deferred: report.deferred };
  }),

  /** Frais d'ouverture en deux versements (le montant du dossier est inchangé) ; refusé si déjà payés ou déjà proposés. */
  proposeInstallments: publicProcedure.input(z.object({ sessionToken: session, applicationId: z.number().int().positive() })).mutation(async ({ input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    const db = await requireDb();
    const application = await loadApplication(db, input.applicationId);
    if (!application.candidateId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Ce dossier n'est rattaché à aucun compte candidat." });
    if (application.paymentStatus === "SUCCESS") throw new TRPCError({ code: "CONFLICT", message: "Les frais d'ouverture sont déjà payés." });
    const total = Number(application.paymentAmount) || 0;
    if (total < 2000) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Définissez d'abord le montant des frais d'ouverture du dossier." });
    const existing = await db.select({ label: paymentScheduleItems.label, status: paymentScheduleItems.status }).from(paymentScheduleItems).where(eq(paymentScheduleItems.candidateId, application.candidateId));
    if (existing.some((item) => item.label.startsWith("Frais d'ouverture") && item.status === "pending")) throw new TRPCError({ code: "CONFLICT", message: "Un échéancier des frais d'ouverture est déjà en cours pour ce candidat." });
    const items = splitInTwo(total, new Date());
    await db.insert(paymentScheduleItems).values(items.map((item) => ({ candidateId: application.candidateId!, label: item.label, amount: item.amount, dueOn: item.dueOn, createdBy: adminLabel(admin) })));
    try { await db.insert(clientNotifications).values({ candidateId: application.candidateId, type: "payment_schedule", title: "Paiement en deux versements proposé", body: `Vos frais d'ouverture peuvent être réglés en deux versements (${items[0].amount} puis ${items[1].amount} XAF). Retrouvez l'échéancier dans votre espace client.`, actionUrl: "/mon-espace", isRead: false }); } catch { /* notification facultative */ }
    await recordPrivacyEvent(db, { actorType: "admin", actorId: admin.id, actorLabel: adminLabel(admin), action: "payment_schedule.installments_proposed", resourceType: "application", resourceId: application.id, details: "deux versements" });
    return { ok: true as const, items };
  }),

  /** E-mail de test : le vrai message, à l'administrateur connecté seulement, jamais au candidat. Le brouillon doit être enregistré. */
  sendTest: publicProcedure.input(z.object({ sessionToken: session, sourceRecordId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const admin = await requireValidAdminSession(input.sessionToken);
    if (!admin.email) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Votre compte administrateur n'a pas d'adresse e-mail." });
    return unifiedRequestsRouter.createCaller(ctx as never).sendEvaluationTestEmail({ sessionToken: input.sessionToken, sourceRecordId: input.sourceRecordId, testEmail: admin.email });
  }),
});
