/**
 * Relances des réservations de vol, lancées par la même tâche quotidienne que les relances de documents
 * (POST /api/scheduled/document-reminders, secret CRON_SECRET, {"dryRun":true} = aperçu sans envoi) :
 *  - devis non payé : 2 rappels au plus, 24 h puis 48 h après la demande de règlement ;
 *  - billet émis : un seul rappel, dans les 3 jours avant le départ.
 * Journal : historique de la demande (`quote_reminder_sent`, `predeparture_reminder_sent`). Désinscription : la même que pour les documents.
 */
import { and, eq, inArray } from "drizzle-orm";
import { agencySettings, flightBookingRequestHistory, flightBookingRequests } from "../../drizzle/schema";
import { COMPANY_PROFILE } from "../../client/src/lib/companyContacts";
import { HISTORY, departureAtOf, planPreDepartureReminder, planQuoteReminder } from "../../shared/flightFollowUps";
import { sendEmail } from "../_core/email";
import type { getDb } from "../db";
import { reminderOptOutKey, signReminderStopToken } from "../services/documentReminders";
import { buildPreDepartureEmail, buildQuoteReminderEmail } from "../services/flightFollowUpEmails";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export type FlightFollowUpOutcome = { requestRef: string; kind: "quote_reminder" | "pre_departure"; stage: number; sent: boolean; error?: string };

const siteUrl = () => (process.env.SITE_URL || COMPANY_PROFILE.website || "https://www.3mtravelagency.com").replace(/\/+$/, "");

const routeOf = (flightData: unknown): string => {
  const flight = (flightData && typeof flightData === "object" ? flightData : {}) as Record<string, unknown>;
  const text = (value: unknown, fallback: string) => (typeof value === "string" && value.trim() ? value.trim() : fallback);
  return `${text(flight.originCity, text(flight.origin, "Départ"))} → ${text(flight.destinationCity, text(flight.destination, "Destination"))}`;
};

export async function runFlightFollowUps(db: Db, options: { now?: Date; dryRun?: boolean } = {}): Promise<FlightFollowUpOutcome[]> {
  const now = options.now ?? new Date();
  const outcomes: FlightFollowUpOutcome[] = [];
  const requests = await db.select().from(flightBookingRequests).where(inArray(flightBookingRequests.status, ["revalidated", "awaiting_payment", "issued"])).limit(1000);

  for (const request of requests) {
    try {
      const email = request.candidateEmail.trim().toLowerCase();
      const departureAt = departureAtOf(request.flightData);
      const rows = await db.select().from(flightBookingRequestHistory).where(and(eq(flightBookingRequestHistory.requestId, request.id), inArray(flightBookingRequestHistory.action, [HISTORY.quoteReminder, HISTORY.preDeparture, "status_changed"]))).limit(300);
      const [optOut] = await db.select({ id: agencySettings.id }).from(agencySettings).where(eq(agencySettings.settingKey, reminderOptOutKey(email))).limit(1);
      const stopUrl = `${siteUrl()}/api/reminders/stop?e=${encodeURIComponent(email)}&t=${signReminderStopToken(email, process.env.JWT_SECRET || "")}`;

      if (request.status === "issued") {
        const alreadySent = rows.some((row) => row.action === HISTORY.preDeparture);
        if (optOut || !planPreDepartureReminder({ status: request.status, departureAt, alreadySent, now })) continue;
        const message = buildPreDepartureEmail({ requestRef: request.requestRef, route: routeOf(request.flightData), departureDate: String((request.flightData as Record<string, unknown> | null)?.departureDate ?? ""), pnrReference: request.pnrReference, siteUrl: siteUrl(), stopUrl });
        if (!options.dryRun) {
          await sendEmail({ to: request.candidateEmail, subject: message.subject, html: message.html });
          await db.insert(flightBookingRequestHistory).values({ requestId: request.id, action: HISTORY.preDeparture, changedBy: "système", oldValue: null, newValue: "1", details: "Rappel avant départ envoyé au client." });
        }
        outcomes.push({ requestRef: request.requestRef, kind: "pre_departure", stage: 1, sent: !options.dryRun });
        continue;
      }

      const reminders = rows.filter((row) => row.action === HISTORY.quoteReminder).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const awaitingSince = rows.filter((row) => row.action === "status_changed" && (row.newValue === "revalidated" || row.newValue === "awaiting_payment")).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.createdAt ?? null;
      // Seules les relances envoyées depuis la dernière demande de règlement comptent (une nouvelle demande repart de zéro).
      const sinceAsk = awaitingSince ? reminders.filter((row) => row.createdAt > awaitingSince) : [];
      const decision = planQuoteReminder({ status: request.status, clientValidated: request.clientValidated, awaitingSince, remindersSent: sinceAsk.length, lastReminderAt: sinceAsk[0]?.createdAt ?? null, departureAt, optedOut: Boolean(optOut), now });
      if (!decision.due) continue;
      const message = buildQuoteReminderEmail({ requestRef: request.requestRef, route: routeOf(request.flightData), stage: decision.stage, siteUrl: siteUrl(), whatsappDisplay: COMPANY_PROFILE.offices.cameroon.whatsappDisplay, stopUrl });
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
  return outcomes;
}
