/**
 * Relances des réservations de vol, lancées par la même tâche quotidienne que les relances de documents
 * (POST /api/scheduled/document-reminders, secret CRON_SECRET, {"dryRun":true} = aperçu sans envoi) :
 *  - devis non payé : 2 rappels au plus, 24 h puis 48 h après la demande de règlement ;
 *  - « informations requises » sans réponse : 2 rappels au plus, 48 h puis 5 jours après la demande ;
 *  - billet émis : un seul rappel, dans les 3 jours avant le départ ;
 *  - comptoir : un e-mail groupé quand une option de réservation expire dans les 24 h.
 * Journal : historique de la demande (`quote_reminder_sent`, `needs_info_reminder_sent`, `predeparture_reminder_sent`, `option_alert_sent`).
 * Désinscription des clients : la même que pour les documents.
 */
import { and, eq, inArray } from "drizzle-orm";
import { agencySettings, flightBookingRequestHistory, flightBookingRequests } from "../../drizzle/schema";
import { COMPANY_PROFILE } from "../../client/src/lib/companyContacts";
import { DESK_THRESHOLDS, HISTORY, currentOptionDeadline, departureAtOf, planNeedsInfoReminder, planPreDepartureReminder, planQuoteReminder, type HistoryRow } from "../../shared/flightFollowUps";
import { sendEmail } from "../_core/email";
import type { getDb } from "../db";
import { reminderOptOutKey, signReminderStopToken } from "../services/documentReminders";
import { resolveDeskRecipients } from "../services/flightDeskAlert";
import { buildNeedsInfoReminderEmail, buildOptionAlertEmail, buildPreDepartureEmail, buildQuoteReminderEmail } from "../services/flightFollowUpEmails";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export type FlightFollowUpOutcome = { requestRef: string; kind: "quote_reminder" | "needs_info_reminder" | "pre_departure" | "option_alert"; stage: number; sent: boolean; error?: string };

const siteUrl = () => (process.env.SITE_URL || COMPANY_PROFILE.website || "https://www.3mtravelagency.com").replace(/\/+$/, "");
const HOUR = 3_600_000;

const routeOf = (flightData: unknown): string => {
  const flight = (flightData && typeof flightData === "object" ? flightData : {}) as Record<string, unknown>;
  const text = (value: unknown, fallback: string) => (typeof value === "string" && value.trim() ? value.trim() : fallback);
  return `${text(flight.originCity, text(flight.origin, "Départ"))} → ${text(flight.destinationCity, text(flight.destination, "Destination"))}`;
};

const latestChangeTo = (rows: Array<typeof flightBookingRequestHistory.$inferSelect>, statuses: string[]): Date | null =>
  rows.filter((row) => row.action === "status_changed" && statuses.includes(String(row.newValue))).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.createdAt ?? null;

export async function runFlightFollowUps(db: Db, options: { now?: Date; dryRun?: boolean } = {}): Promise<FlightFollowUpOutcome[]> {
  const now = options.now ?? new Date();
  const outcomes: FlightFollowUpOutcome[] = [];
  const requests = await db.select().from(flightBookingRequests).where(inArray(flightBookingRequests.status, ["pending_review", "assigned", "needs_info", "revalidated", "awaiting_payment", "issued"])).limit(1000);
  const optionAlerts: Array<{ requestRef: string; requestId: number; deadline: Date; route: string }> = [];

  for (const request of requests) {
    try {
      const email = request.candidateEmail.trim().toLowerCase();
      const departureAt = departureAtOf(request.flightData);
      const fetched = await db.select().from(flightBookingRequestHistory).where(and(eq(flightBookingRequestHistory.requestId, request.id), inArray(flightBookingRequestHistory.action, [HISTORY.quoteReminder, HISTORY.needsInfoReminder, HISTORY.preDeparture, HISTORY.optionDeadline, HISTORY.optionAlert, "status_changed"]))).limit(300);
      // Filtre redondant avec la requête, mais garde le calcul juste quel que soit le moteur qui répond.
      const rows = fetched.filter((row) => row.requestId === request.id);
      const [optOut] = await db.select({ id: agencySettings.id }).from(agencySettings).where(eq(agencySettings.settingKey, reminderOptOutKey(email))).limit(1);
      const stopUrl = `${siteUrl()}/api/reminders/stop?e=${encodeURIComponent(email)}&t=${signReminderStopToken(email, process.env.JWT_SECRET || "")}`;
      const route = routeOf(request.flightData);

      // Option de réservation qui expire : alerte du comptoir (une par échéance saisie).
      const deadline = currentOptionDeadline(rows as HistoryRow[]);
      if (deadline && deadline.getTime() > now.getTime() && deadline.getTime() - now.getTime() <= DESK_THRESHOLDS.optionAlertEmailHours * HOUR) {
        const alerted = rows.some((row) => row.action === HISTORY.optionAlert && row.newValue === deadline.toISOString());
        if (!alerted) optionAlerts.push({ requestRef: request.requestRef, requestId: request.id, deadline, route });
      }

      if (request.status === "issued") {
        const alreadySent = rows.some((row) => row.action === HISTORY.preDeparture);
        if (optOut || !planPreDepartureReminder({ status: request.status, departureAt, alreadySent, now })) continue;
        const message = buildPreDepartureEmail({ requestRef: request.requestRef, route, departureDate: String((request.flightData as Record<string, unknown> | null)?.departureDate ?? ""), pnrReference: request.pnrReference, siteUrl: siteUrl(), stopUrl });
        if (!options.dryRun) {
          await sendEmail({ to: request.candidateEmail, subject: message.subject, html: message.html });
          await db.insert(flightBookingRequestHistory).values({ requestId: request.id, action: HISTORY.preDeparture, changedBy: "système", oldValue: null, newValue: "1", details: "Rappel avant départ envoyé au client." });
        }
        outcomes.push({ requestRef: request.requestRef, kind: "pre_departure", stage: 1, sent: !options.dryRun });
        continue;
      }

      if (request.status === "needs_info") {
        const since = latestChangeTo(rows, ["needs_info"]);
        const sent = rows.filter((row) => row.action === HISTORY.needsInfoReminder && since && row.createdAt > since).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const decision = planNeedsInfoReminder({ status: request.status, since, remindersSent: sent.length, lastReminderAt: sent[0]?.createdAt ?? null, departureAt, optedOut: Boolean(optOut), now });
        if (!decision.due) continue;
        const message = buildNeedsInfoReminderEmail({ requestRef: request.requestRef, route, stage: decision.stage, siteUrl: siteUrl(), whatsappDisplay: COMPANY_PROFILE.offices.cameroon.whatsappDisplay, stopUrl });
        if (!options.dryRun) {
          await sendEmail({ to: request.candidateEmail, subject: message.subject, html: message.html });
          await db.insert(flightBookingRequestHistory).values({ requestId: request.id, action: HISTORY.needsInfoReminder, changedBy: "système", oldValue: null, newValue: String(decision.stage), details: `Relance ${decision.stage} des informations demandées envoyée au client.` });
        }
        outcomes.push({ requestRef: request.requestRef, kind: "needs_info_reminder", stage: decision.stage, sent: !options.dryRun });
        continue;
      }

      const reminders = rows.filter((row) => row.action === HISTORY.quoteReminder).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const awaitingSince = latestChangeTo(rows, ["revalidated", "awaiting_payment"]);
      // Seules les relances envoyées depuis la dernière demande de règlement comptent (une nouvelle demande repart de zéro).
      const sinceAsk = awaitingSince ? reminders.filter((row) => row.createdAt > awaitingSince) : [];
      const decision = planQuoteReminder({ status: request.status, clientValidated: request.clientValidated, awaitingSince, remindersSent: sinceAsk.length, lastReminderAt: sinceAsk[0]?.createdAt ?? null, departureAt, optedOut: Boolean(optOut), now });
      if (!decision.due) continue;
      const message = buildQuoteReminderEmail({ requestRef: request.requestRef, route, stage: decision.stage, siteUrl: siteUrl(), whatsappDisplay: COMPANY_PROFILE.offices.cameroon.whatsappDisplay, stopUrl });
      if (!options.dryRun) {
        await sendEmail({ to: request.candidateEmail, subject: message.subject, html: message.html });
        await db.insert(flightBookingRequestHistory).values({ requestId: request.id, action: HISTORY.quoteReminder, changedBy: "système", oldValue: null, newValue: String(decision.stage), details: `Relance ${decision.stage} du règlement envoyée au client.` });
      }
      outcomes.push({ requestRef: request.requestRef, kind: "quote_reminder", stage: decision.stage, sent: !options.dryRun });
    } catch (error) {
      console.error("[FlightFollowUps] request failed", { requestId: request.id, error });
      outcomes.push({ requestRef: request.requestRef, kind: "quote_reminder", stage: 0, sent: false, error: "échec" });
    }
  }

  if (optionAlerts.length > 0) {
    try {
      if (!options.dryRun) {
        const alert = buildOptionAlertEmail({ items: optionAlerts.map((item) => ({ requestRef: item.requestRef, route: item.route, deadline: item.deadline.toISOString() })), adminUrl: `${siteUrl()}/admin` });
        await sendEmail({ to: resolveDeskRecipients(process.env).join(","), subject: alert.subject, html: alert.html });
        for (const item of optionAlerts) await db.insert(flightBookingRequestHistory).values({ requestId: item.requestId, action: HISTORY.optionAlert, changedBy: "système", oldValue: null, newValue: item.deadline.toISOString(), details: "Alerte d’expiration d’option envoyée au comptoir." });
      }
      for (const item of optionAlerts) outcomes.push({ requestRef: item.requestRef, kind: "option_alert", stage: 1, sent: !options.dryRun });
    } catch (error) {
      console.error("[FlightFollowUps] option alert failed", error);
      for (const item of optionAlerts) outcomes.push({ requestRef: item.requestRef, kind: "option_alert", stage: 0, sent: false, error: "échec" });
    }
  }
  return outcomes;
}
