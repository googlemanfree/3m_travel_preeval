/**
 * Après l’envoi d’un bilan :
 * — relance automatique (J+2, J+5, J+10) : espace client + e-mail + WhatsApp, sans jamais relancer un candidat qui a répondu ;
 * — envoi direct du bilan en PDF par WhatsApp (pièce jointe), avec repli en lien WhatsApp prérempli si l’envoi automatique n’est pas configuré.
 *
 * Le compteur de relances (agency_settings « bilan_reminder:<id> ») est partagé avec la relance manuelle de l’administrateur :
 * les deux ne se doublonnent jamais (48 h minimum entre deux relances).
 */

import { desc, eq, inArray } from "drizzle-orm";
import { agencySettings, applications, candidates } from "../../drizzle/schema";
import { clientNotifications } from "../../drizzle/caseTrackingSchema";
import {
  buildAutoRelanceMessage,
  buildBilanPdfWhatsAppMessage,
  buildWhatsAppManualLink,
  isWithinSendWindow,
  planAutoRelance,
} from "../../shared/bilanRelanceAuto";
import type { DecisionLite, ReminderLite } from "../../shared/bilanFollowUp";
import { evaluationDisplayReference } from "../../shared/evaluationReference";
import { firstName } from "../../shared/remoteSupport";
import { toE164WhatsApp } from "../../shared/whatsappPhone";
import { sendClientNotificationEmail } from "../emailService";
import type { getDb } from "../db";
import { sendWhatsAppDocument, sendWhatsAppMessage, isWhatsAppConfigured } from "../whatsappService";
import { emailAllowed } from "./candidateSecurity";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export const DECISION_PREFIX = "evaluation_decision:";
export const REMINDER_PREFIX = "bilan_reminder:";
export const WHATSAPP_PREFIX = "bilan_whatsapp:";
export const AUTO_RELANCE_SETTING = "bilan_auto_relance";
export const AUTO_RELANCE_ACTOR = "system:bilan-auto-relance";
/** Nombre maximal de relances envoyées par passage : borne l’envoi en cas de gros arriéré. */
export const AUTO_RELANCE_BATCH = 25;

function siteUrl(): string {
  return (process.env.SITE_URL || process.env.VITE_SITE_URL || "https://www.3mtravelagency.com").replace(/\/+$/, "");
}

function parse<T>(value: string | undefined): T | undefined {
  try {
    return value ? (JSON.parse(value) as T) : undefined;
  } catch {
    return undefined;
  }
}

async function settingsByKey(db: Db, keys: string[]): Promise<Map<string, string>> {
  if (keys.length === 0) return new Map();
  const rows = await db
    .select({ settingKey: agencySettings.settingKey, settingValue: agencySettings.settingValue })
    .from(agencySettings)
    .where(inArray(agencySettings.settingKey, keys));
  return new Map(rows.map((row) => [row.settingKey, row.settingValue ?? ""]));
}

async function writeSetting(db: Db, key: string, value: string): Promise<void> {
  const [existing] = await db.select({ id: agencySettings.id }).from(agencySettings).where(eq(agencySettings.settingKey, key)).limit(1);
  if (existing) await db.update(agencySettings).set({ settingValue: value }).where(eq(agencySettings.id, existing.id));
  else await db.insert(agencySettings).values({ settingKey: key, settingValue: value });
}

/** La relance automatique est active par défaut ; l’administrateur peut la couper (« off ») ou la variable BILAN_RELANCE_AUTO=off. */
export async function isAutoRelanceEnabled(db: Db): Promise<boolean> {
  if ((process.env.BILAN_RELANCE_AUTO || "").toLowerCase() === "off") return false;
  const value = (await settingsByKey(db, [AUTO_RELANCE_SETTING])).get(AUTO_RELANCE_SETTING);
  return (value ?? "on").toLowerCase() !== "off";
}

export async function setAutoRelanceEnabled(db: Db, enabled: boolean): Promise<void> {
  await writeSetting(db, AUTO_RELANCE_SETTING, enabled ? "on" : "off");
}

export type AutoRelanceOutcome = {
  applicationId: number;
  dossierNumber: string;
  step: 1 | 2 | 3;
  emailSent: boolean;
  whatsappSent: boolean;
  notified: boolean;
};

export type AutoRelanceReport = {
  enabled: boolean;
  dryRun: boolean;
  /** Relances qui seraient / ont été envoyées dans ce passage (borné par AUTO_RELANCE_BATCH). */
  due: number;
  /** Dossiers en attente au-delà du lot (traités aux passages suivants). */
  deferred: number;
  sent: number;
  outcomes: AutoRelanceOutcome[];
};

/** Un passage de relance automatique. `dryRun` ne fait que compter, sans rien envoyer ni écrire. */
export async function runBilanAutoRelances(
  db: Db,
  options: { dryRun?: boolean; now?: Date; ignoreWindow?: boolean } = {},
): Promise<AutoRelanceReport> {
  const now = options.now ?? new Date();
  const dryRun = Boolean(options.dryRun);
  const enabled = await isAutoRelanceEnabled(db);
  const empty: AutoRelanceReport = { enabled, dryRun, due: 0, deferred: 0, sent: 0, outcomes: [] };
  if (!enabled) return empty;
  if (!dryRun && !options.ignoreWindow && !isWithinSendWindow(now)) return empty;

  const rows = await db
    .select()
    .from(applications)
    .where(eq(applications.evaluationDeliveryStatus, "sent"))
    .orderBy(desc(applications.evaluationCompletedAt))
    .limit(600);
  const settings = await settingsByKey(db, rows.flatMap((row) => [`${DECISION_PREFIX}${row.id}`, `${REMINDER_PREFIX}${row.id}`]));

  const planned = rows.flatMap((row) => {
    const plan = planAutoRelance(
      {
        candidateId: row.candidateId ?? null,
        sentAt: row.evaluationCompletedAt ? new Date(row.evaluationCompletedAt).toISOString() : null,
        viewedAt: row.evaluationReportViewedAt ? new Date(row.evaluationReportViewedAt).toISOString() : null,
        paymentStatus: row.paymentStatus ?? null,
        activationRequestedAt: row.activationRequestedAt ? new Date(row.activationRequestedAt).toISOString() : null,
      },
      parse<DecisionLite>(settings.get(`${DECISION_PREFIX}${row.id}`)),
      parse<ReminderLite>(settings.get(`${REMINDER_PREFIX}${row.id}`)),
      now,
    );
    return plan.due ? [{ row, plan }] : [];
  });
  // Les bilans les plus anciens d’abord : ce sont ceux qui attendent depuis le plus longtemps.
  planned.sort((a, b) => (a.row.evaluationCompletedAt?.getTime() ?? 0) - (b.row.evaluationCompletedAt?.getTime() ?? 0));

  const batch = planned.slice(0, AUTO_RELANCE_BATCH);
  const report: AutoRelanceReport = { ...empty, due: batch.length, deferred: Math.max(0, planned.length - batch.length) };
  if (dryRun) return report;

  for (const { row, plan } of batch) {
    if (!plan.due || !row.candidateId) continue;
    const dossierNumber = evaluationDisplayReference(row) ?? "";
    const spaceUrl = `${siteUrl()}/mon-espace`;
    // Bilan jamais consulté : le lien de téléchargement part avec la relance (l'e-mail est peut-être dans les indésirables).
    const message = buildAutoRelanceMessage({ step: plan.step, viewed: plan.viewed, firstName: firstName(row.fullName), dossierNumber, spaceUrl, pdfUrl: !plan.viewed && row.evaluationReportPdfUrl ? absoluteSiteUrl(row.evaluationReportPdfUrl) : null });

    let notified = false;
    try {
      await db.insert(clientNotifications).values({ candidateId: row.candidateId, type: "evaluation_reminder", title: message.title, body: message.body, actionUrl: "/mon-espace", isRead: false });
      notified = true;
    } catch { /* l’e-mail reste tenté */ }

    let emailSent = false;
    if (await emailAllowed(db, row.candidateId, now)) {
      emailSent = await sendClientNotificationEmail({ to: row.email, fullName: row.fullName, title: message.title, body: message.body, actionUrl: "/mon-espace", sourceLabel: "3M TRAVEL AGENCY" }).catch(() => false);
    }

    let whatsappSent = false;
    if (isWhatsAppConfigured() && toE164WhatsApp(row.whatsappNumber)) {
      const result = await sendWhatsAppMessage(row.whatsappNumber, message.whatsapp).catch(() => ({ success: false }));
      whatsappSent = Boolean(result.success);
    }

    // Le compteur avance dès qu’un canal a été tenté, pour ne pas renvoyer en boucle un message qui échoue.
    const previous = parse<ReminderLite>(settings.get(`${REMINDER_PREFIX}${row.id}`));
    await writeSetting(db, `${REMINDER_PREFIX}${row.id}`, JSON.stringify({ at: now.toISOString(), count: (previous?.count ?? 0) + 1, by: AUTO_RELANCE_ACTOR, step: plan.step, email: emailSent, whatsapp: whatsappSent }));
    report.outcomes.push({ applicationId: row.id, dossierNumber, step: plan.step, emailSent, whatsappSent, notified });
    if (notified || emailSent || whatsappSent) report.sent += 1;
  }
  return report;
}

export type BilanWhatsAppResult = {
  /** Message + PDF réellement transmis à WhatsApp par l’envoi automatique. */
  sent: boolean;
  /** L’envoi automatique (Twilio) est-il configuré ? Si non, `manualLink` permet d’envoyer en un clic depuis WhatsApp. */
  configured: boolean;
  phone: string | null;
  manualLink: string | null;
  pdfUrl: string | null;
  messageId?: string;
  error?: string;
};

export function absoluteSiteUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `${siteUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
}

/** Envoie le bilan finalisé (PDF) au candidat par WhatsApp. Le dossier doit avoir un bilan envoyé avec son PDF. */
export async function sendBilanPdfByWhatsApp(db: Db, applicationId: number, now: Date = new Date()): Promise<BilanWhatsAppResult> {
  const [application] = await db.select().from(applications).where(eq(applications.id, applicationId)).limit(1);
  if (!application) throw new Error("Dossier introuvable.");
  if (application.evaluationDeliveryStatus !== "sent") throw new Error("Le bilan de ce dossier n’a pas encore été envoyé : envoyez-le d’abord.");
  if (!application.evaluationReportPdfUrl) throw new Error("Le PDF de ce bilan est introuvable. Régénérez-le depuis l’éditeur du bilan.");

  let phoneSource: string | null = application.whatsappNumber || null;
  if (!toE164WhatsApp(phoneSource) && application.candidateId) {
    const [candidate] = await db.select({ phone: candidates.phone }).from(candidates).where(eq(candidates.id, application.candidateId)).limit(1);
    phoneSource = candidate?.phone ?? null;
  }
  const phone = toE164WhatsApp(phoneSource);
  const pdfUrl = absoluteSiteUrl(application.evaluationReportPdfUrl);
  const message = buildBilanPdfWhatsAppMessage({
    firstName: firstName(application.fullName),
    dossierNumber: evaluationDisplayReference(application) ?? "",
    pdfUrl,
    spaceUrl: `${siteUrl()}/mon-espace`,
  });
  const manualLink = buildWhatsAppManualLink(phone, message);
  if (!phone) return { sent: false, configured: isWhatsAppConfigured(), phone: null, manualLink: null, pdfUrl, error: "Numéro WhatsApp manquant ou invalide pour ce candidat." };

  const result = await sendWhatsAppDocument(phone, message, pdfUrl);
  const previous = parse<{ count: number }>((await settingsByKey(db, [`${WHATSAPP_PREFIX}${applicationId}`])).get(`${WHATSAPP_PREFIX}${applicationId}`));
  await writeSetting(db, `${WHATSAPP_PREFIX}${applicationId}`, JSON.stringify({ at: now.toISOString(), count: (previous?.count ?? 0) + (result.success ? 1 : 0), lastOk: result.success, error: result.error ?? null }));
  return { sent: result.success, configured: result.configured, phone, manualLink, pdfUrl, messageId: result.messageId, error: result.error };
}

let timer: ReturnType<typeof setInterval> | null = null;
const AUTO_RELANCE_INTERVAL_MS = 3 * 60 * 60 * 1000;

/** Démarre la relance automatique (deux minutes après le démarrage, puis toutes les 3 heures, aux heures de bureau). */
export function startBilanAutoRelance(): void {
  if (timer || (process.env.BILAN_RELANCE_AUTO || "").toLowerCase() === "off") return;
  const run = async () => {
    try {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) return;
      const report = await runBilanAutoRelances(db);
      if (report.sent > 0) console.log(`[bilan-relance-auto] ${report.sent} relance(s) envoyée(s), ${report.deferred} en attente du prochain passage`);
    } catch (error) {
      console.warn("[bilan-relance-auto] passage impossible :", error instanceof Error ? error.message : error);
    }
  };
  setTimeout(() => void run(), 120_000).unref?.();
  timer = setInterval(() => void run(), AUTO_RELANCE_INTERVAL_MS);
  timer.unref?.();
}

export function stopBilanAutoRelance(): void {
  if (timer) clearInterval(timer);
  timer = null;
}

