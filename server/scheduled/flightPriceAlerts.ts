/**
 * Alertes de baisse de tarif : lancées par la même tâche quotidienne que les relances (POST /api/scheduled/document-reminders,
 * secret CRON_SECRET, {"dryRun":true} = aperçu sans relevé payant ni e-mail). Au plus 8 relevés payants par passage, un seul par
 * parcours et par dates quel que soit le nombre d'alertes. Interrupteur : FLIGHT_ALERTS_DISABLED=1.
 */
import type { Request, Response } from "express";
import { eq, like } from "drizzle-orm";
import { agencySettings } from "../../drizzle/schema";
import { COMPANY_PROFILE } from "../../client/src/lib/companyContacts";
import {
  ALERTS_RUN_FRESHNESS_MS,
  FLIGHT_ALERTS_LAST_RUN_KEY,
  FLIGHT_ALERT_PREFIX,
  alertKeyOf,
  isAlertExpired,
  isValidAlertToken,
  parseAlert,
  planAlertNotification,
  planRouteChecks,
  type AlertEntry,
  type FlightPriceAlert,
} from "../../shared/flightPriceAlert";
import { sendEmail } from "../_core/email";
import { getDb } from "../db";
import { reminderOptOutKey } from "../services/documentReminders";
import { buildPriceDropEmail, searchUrlFor } from "../services/flightPriceAlertEmail";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

const DAY_MS = 24 * 60 * 60 * 1000;
/** Une alerte jamais confirmée disparaît au bout de 3 jours. */
const UNCONFIRMED_MAX_AGE_MS = 3 * DAY_MS;

export const siteUrl = () => (process.env.SITE_URL || COMPANY_PROFILE.website || "https://www.3mtravelagency.com").replace(/\/+$/, "");
export const alertStopUrl = (token: string) => `${siteUrl()}/api/flight-alerts/stop?a=${token}`;
export const alertConfirmUrl = (token: string) => `${siteUrl()}/api/flight-alerts/confirm?a=${token}`;

export type AlertMail = { to: string; subject: string; html: string };
export type AlertAction = { token: string; next: FlightPriceAlert | null; mail?: AlertMail; reason: string };
export type AlertRunSummary = { alerts: number; routesChecked: number; routesSkipped: number; notified: number; removed: number; failedRoutes: number };

/**
 * Décide, sans rien écrire ni envoyer, ce qu'il faut faire de chaque alerte. `fetchCheapest` renvoie le tarif le plus bas RÉELLEMENT
 * relevé (FCFA) ou null ; en aperçu (`dryRun`), aucun relevé n'est demandé.
 */
export async function evaluateAlerts(input: {
  entries: AlertEntry[];
  now: Date;
  dryRun: boolean;
  isOptedOut: (email: string) => boolean;
  fetchCheapest: (alert: FlightPriceAlert) => Promise<number | null>;
  stopUrlFor: (token: string) => string;
  searchBaseUrl: string;
}): Promise<{ actions: AlertAction[]; summary: AlertRunSummary }> {
  const { entries, now, dryRun } = input;
  const actions: AlertAction[] = [];
  const active: AlertEntry[] = [];
  let removed = 0;

  for (const entry of entries) {
    const { token, alert } = entry;
    if (isAlertExpired(alert, now)) {
      actions.push({ token, next: null, reason: "expired" });
      removed += 1;
    } else if (!alert.confirmed && now.getTime() - Date.parse(alert.createdAt) > UNCONFIRMED_MAX_AGE_MS) {
      actions.push({ token, next: null, reason: "never_confirmed" });
      removed += 1;
    } else if (input.isOptedOut(alert.email)) {
      actions.push({ token, next: null, reason: "opted_out" });
      removed += 1;
    } else if (alert.confirmed) {
      active.push(entry);
    }
  }

  const { checks, skippedRoutes } = planRouteChecks(active);
  let notified = 0;
  let failedRoutes = 0;

  for (const check of checks) {
    let price: number | null = null;
    if (!dryRun) {
      try {
        price = await input.fetchCheapest(check.sample);
      } catch {
        price = null;
      }
      if (price === null) failedRoutes += 1;
    }
    for (const { token, alert } of check.entries) {
      const checked: FlightPriceAlert = dryRun ? alert : { ...alert, lastCheckedAt: now.toISOString() };
      if (dryRun) {
        actions.push({ token, next: alert, reason: "planned_check" });
        continue;
      }
      const decision = planAlertNotification(checked, price);
      if (!decision.notify || price === null) {
        actions.push({ token, next: checked, reason: decision.reason });
        continue;
      }
      const previous = alert.lastNotifiedPriceXaf ?? alert.baselinePriceXaf;
      const mail = buildPriceDropEmail({
        name: alert.name,
        origin: alert.origin,
        destination: alert.destination,
        tripType: alert.tripType,
        departureDate: alert.departureDate,
        returnDate: alert.returnDate,
        priceXaf: price,
        previousXaf: previous,
        searchUrl: searchUrlFor(input.searchBaseUrl, alert),
        stopUrl: input.stopUrlFor(token),
        retrievedAt: now,
      });
      actions.push({ token, next: { ...checked, lastNotifiedPriceXaf: price, notifications: alert.notifications + 1 }, mail: { to: alert.email, ...mail }, reason: "drop" });
      notified += 1;
    }
  }

  return { actions, summary: { alerts: entries.length, routesChecked: dryRun ? 0 : checks.length, routesSkipped: skippedRoutes, notified: dryRun ? 0 : notified, removed, failedRoutes } };
}

const setting = async (db: Db, key: string) => (await db.select().from(agencySettings).where(eq(agencySettings.settingKey, key)).limit(1))[0];

async function upsertSetting(db: Db, key: string, value: string) {
  const existing = await setting(db, key);
  if (existing) await db.update(agencySettings).set({ settingValue: value, updatedAt: new Date() }).where(eq(agencySettings.settingKey, key));
  else await db.insert(agencySettings).values({ settingKey: key, settingValue: value });
}

export async function loadAlertEntries(db: Db): Promise<AlertEntry[]> {
  const rows = await db.select().from(agencySettings).where(like(agencySettings.settingKey, `${FLIGHT_ALERT_PREFIX}%`)).limit(1000);
  const entries: AlertEntry[] = [];
  for (const row of rows) {
    const token = row.settingKey.slice(FLIGHT_ALERT_PREFIX.length);
    const alert = parseAlert(row.settingValue);
    if (isValidAlertToken(token) && alert) entries.push({ token, alert });
  }
  return entries;
}

export async function runFlightPriceAlerts(
  db: Db,
  options: { now?: Date; dryRun?: boolean; fetchCheapest: (alert: FlightPriceAlert) => Promise<number | null> },
): Promise<AlertRunSummary & { disabled?: boolean }> {
  const now = options.now ?? new Date();
  const dryRun = Boolean(options.dryRun);
  if (process.env.FLIGHT_ALERTS_DISABLED === "1" || !process.env.SEARCHAPI_KEY) {
    return { alerts: 0, routesChecked: 0, routesSkipped: 0, notified: 0, removed: 0, failedRoutes: 0, disabled: true };
  }
  const entries = await loadAlertEntries(db);
  const optedOut = new Set<string>();
  for (const email of Array.from(new Set(entries.map((entry) => entry.alert.email)))) {
    if (await setting(db, reminderOptOutKey(email))) optedOut.add(email);
  }
  const { actions, summary } = await evaluateAlerts({
    entries,
    now,
    dryRun,
    isOptedOut: (email) => optedOut.has(email),
    fetchCheapest: options.fetchCheapest,
    stopUrlFor: alertStopUrl,
    searchBaseUrl: siteUrl(),
  });
  if (dryRun) return summary;

  let notified = 0;
  for (const action of actions) {
    const key = alertKeyOf(action.token);
    try {
      if (action.next === null) {
        await db.delete(agencySettings).where(eq(agencySettings.settingKey, key));
        continue;
      }
      let next = action.next;
      if (action.mail) {
        try {
          await sendEmail({ to: action.mail.to, subject: action.mail.subject, html: action.mail.html });
          notified += 1;
        } catch (error) {
          // E-mail non parti : l'envoi n'est pas compté et sera retenté au prochain passage.
          console.error("[FlightPriceAlerts] mail failed", { token: action.token, error });
          const original = entries.find((entry) => entry.token === action.token)?.alert;
          if (original) next = { ...next, lastNotifiedPriceXaf: original.lastNotifiedPriceXaf, notifications: original.notifications };
        }
      }
      await db.update(agencySettings).set({ settingValue: JSON.stringify(next), updatedAt: new Date() }).where(eq(agencySettings.settingKey, key));
    } catch (error) {
      console.error("[FlightPriceAlerts] update failed", { token: action.token, error });
    }
  }
  await upsertSetting(db, FLIGHT_ALERTS_LAST_RUN_KEY, now.toISOString());
  return { ...summary, notified };
}

/** L'option automatique n'est proposée que si la tâche quotidienne a réellement tourné récemment. */
export async function alertsAreRunning(db: Db, now = new Date()): Promise<boolean> {
  if (process.env.FLIGHT_ALERTS_DISABLED === "1" || !process.env.SEARCHAPI_KEY) return false;
  const row = await setting(db, FLIGHT_ALERTS_LAST_RUN_KEY);
  const last = row ? Date.parse(row.settingValue) : NaN;
  return Number.isFinite(last) && now.getTime() - last <= ALERTS_RUN_FRESHNESS_MS;
}

const page = (title: string, body: string) =>
  `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head><body style="font-family:Arial,sans-serif;max-width:560px;margin:48px auto;padding:0 20px;color:#172554"><h1 style="font-size:22px">${title}</h1><p style="line-height:1.6">${body}</p><p><a href="${siteUrl()}/flights" style="color:#1d4ed8">Retour aux vols 3M Travel</a></p></body></html>`;

async function changeAlert(req: Request, res: Response, mode: "confirm" | "stop"): Promise<void> {
  const token = typeof req.query.a === "string" ? req.query.a : "";
  if (!isValidAlertToken(token)) {
    res.status(400).type("html").send(page("Lien invalide", "Ce lien n’est pas valide ou a été modifié."));
    return;
  }
  try {
    const db = await getDb();
    if (!db) throw new Error("db unavailable");
    const key = alertKeyOf(token);
    const row = await setting(db, key);
    const alert = row ? parseAlert(row.settingValue) : null;
    if (mode === "stop") {
      if (row) await db.delete(agencySettings).where(eq(agencySettings.settingKey, key));
      res.type("html").send(page("Alerte supprimée", "Vous ne recevrez plus d’e-mail pour ce vol. Votre adresse n’est plus liée à cette alerte."));
      return;
    }
    if (!row || !alert) {
      res.status(404).type("html").send(page("Alerte introuvable", "Cette alerte a expiré ou a déjà été supprimée. Vous pouvez en créer une nouvelle depuis la page des vols."));
      return;
    }
    if (isAlertExpired(alert, new Date())) {
      await db.delete(agencySettings).where(eq(agencySettings.settingKey, key));
      res.status(410).type("html").send(page("Alerte expirée", "Le départ est passé ou l’alerte est arrivée à son terme."));
      return;
    }
    if (!alert.confirmed) await db.update(agencySettings).set({ settingValue: JSON.stringify({ ...alert, confirmed: true }), updatedAt: new Date() }).where(eq(agencySettings.settingKey, key));
    res.type("html").send(page("Alerte activée", "Nous relevons le tarif chaque jour et nous vous écrivons si un tarif plus bas est réellement relevé. Vous pouvez arrêter l’alerte depuis chaque e-mail."));
  } catch (error) {
    console.error("[FlightPriceAlerts] link failed", { mode, error });
    res.status(500).type("html").send(page("Une erreur est survenue", "Votre demande n’a pas pu être enregistrée. Écrivez-nous et nous la traiterons manuellement."));
  }
}

export const handleAlertConfirm = (req: Request, res: Response) => changeAlert(req, res, "confirm");
export const handleAlertStop = (req: Request, res: Response) => changeAlert(req, res, "stop");
