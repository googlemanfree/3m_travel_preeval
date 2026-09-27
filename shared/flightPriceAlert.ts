/**
 * Alerte de baisse de tarif d'un vol : règles pures (validation, expiration, décision d'envoi, regroupement des relevés).
 * Une alerte est un réglage `flight_alert:<jeton>` (aucune migration) ; elle n'est active qu'après confirmation par e-mail.
 * Rien n'est inventé : un e-mail part seulement si un tarif plus bas a été RÉELLEMENT relevé chez le fournisseur.
 */

export const FLIGHT_ALERT_PREFIX = "flight_alert:";
export const FLIGHT_ALERTS_LAST_RUN_KEY = "flight_alerts_last_run";
export const MAX_ALERTS_PER_EMAIL = 3;
export const MAX_ACTIVE_ALERTS = 200;
export const ALERT_MAX_AGE_DAYS = 60;
export const ALERT_MAX_NOTIFICATIONS = 3;
/** Baisse minimale (par rapport au dernier tarif connu) pour justifier un e-mail. */
export const MIN_DROP_RATIO = 0.03;
/** Relevés payants au plus par passage quotidien. */
export const MAX_ROUTE_CHECKS_PER_RUN = 8;
/** L'option automatique n'est proposée que si la tâche quotidienne a tourné récemment. */
export const ALERTS_RUN_FRESHNESS_MS = 72 * 60 * 60 * 1000;

const DAY_MS = 24 * 60 * 60 * 1000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type FlightPriceAlert = {
  email: string;
  name: string;
  origin: string;
  destination: string;
  tripType: "ONE_WAY" | "ROUND_TRIP";
  departureDate: string;
  returnDate: string;
  /** Tarif affiché sur l'offre au moment de la demande (FCFA, 1 adulte, économie). */
  baselinePriceXaf: number;
  targetPriceXaf: number | null;
  createdAt: string;
  confirmed: boolean;
  lastCheckedAt: string | null;
  lastNotifiedPriceXaf: number | null;
  notifications: number;
};

export const alertKeyOf = (token: string) => `${FLIGHT_ALERT_PREFIX}${token}`;
export const isValidAlertToken = (token: unknown): token is string => typeof token === "string" && /^[a-f0-9]{32}$/.test(token);

const positiveInt = (value: unknown, max: number): number | null =>
  typeof value === "number" && Number.isFinite(value) && value > 0 && value <= max ? Math.round(value) : null;

/** Relit une alerte stockée : tout ce qui est incomplet ou altéré est ignoré. */
export function parseAlert(raw: string | null | undefined): FlightPriceAlert | null {
  if (!raw || raw.length > 2000) return null;
  let value: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    value = parsed as Record<string, unknown>;
  } catch {
    return null;
  }
  const text = (field: unknown, max: number) => (typeof field === "string" ? field.replace(/[\r\n\t]+/g, " ").trim().slice(0, max) : "");
  const email = text(value.email, 320).toLowerCase();
  const origin = text(value.origin, 3);
  const destination = text(value.destination, 3);
  const departureDate = text(value.departureDate, 10);
  const returnDate = text(value.returnDate, 10);
  const baseline = positiveInt(value.baselinePriceXaf, 100_000_000);
  const createdAt = text(value.createdAt, 40);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return null;
  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination) || origin === destination) return null;
  if (value.tripType !== "ONE_WAY" && value.tripType !== "ROUND_TRIP") return null;
  if (!ISO_DATE.test(departureDate)) return null;
  if (value.tripType === "ROUND_TRIP" && (!ISO_DATE.test(returnDate) || returnDate < departureDate)) return null;
  if (baseline === null || Number.isNaN(Date.parse(createdAt))) return null;
  const notifications = typeof value.notifications === "number" && Number.isInteger(value.notifications) && value.notifications >= 0 ? value.notifications : 0;
  const lastCheckedAt = typeof value.lastCheckedAt === "string" && !Number.isNaN(Date.parse(value.lastCheckedAt)) ? value.lastCheckedAt : null;
  return {
    email,
    name: text(value.name, 120),
    origin,
    destination,
    tripType: value.tripType,
    departureDate,
    returnDate: value.tripType === "ROUND_TRIP" ? returnDate : "",
    baselinePriceXaf: baseline,
    targetPriceXaf: positiveInt(value.targetPriceXaf, 100_000_000),
    createdAt,
    confirmed: value.confirmed === true,
    lastCheckedAt,
    lastNotifiedPriceXaf: positiveInt(value.lastNotifiedPriceXaf, 100_000_000),
    notifications,
  };
}

/** Expirée : départ passé, 60 jours écoulés ou 3 e-mails déjà envoyés. */
export function isAlertExpired(alert: FlightPriceAlert, now: Date): boolean {
  const today = now.toISOString().slice(0, 10);
  if (alert.departureDate < today) return true;
  if (now.getTime() - Date.parse(alert.createdAt) > ALERT_MAX_AGE_DAYS * DAY_MS) return true;
  return alert.notifications >= ALERT_MAX_NOTIFICATIONS;
}

export type AlertDecision = { notify: boolean; reason: "no_data" | "not_lower" | "above_target" | "drop" };

/** Faut-il écrire ? Seulement pour un tarif réellement relevé, plus bas d'au moins 3 % que le dernier connu (et sous la cible si elle existe). */
export function planAlertNotification(alert: FlightPriceAlert, cheapestXaf: number | null): AlertDecision {
  if (cheapestXaf === null || !Number.isFinite(cheapestXaf) || cheapestXaf <= 0) return { notify: false, reason: "no_data" };
  const reference = alert.lastNotifiedPriceXaf ?? alert.baselinePriceXaf;
  if (cheapestXaf > reference * (1 - MIN_DROP_RATIO)) return { notify: false, reason: "not_lower" };
  if (alert.targetPriceXaf !== null && cheapestXaf > alert.targetPriceXaf) return { notify: false, reason: "above_target" };
  return { notify: true, reason: "drop" };
}

export const routeGroupKey = (alert: FlightPriceAlert) => [alert.origin, alert.destination, alert.tripType, alert.departureDate, alert.returnDate].join("|");

export type AlertEntry = { token: string; alert: FlightPriceAlert };

/** Un relevé payant par parcours et par dates, quel que soit le nombre d'alertes : les plus anciennement vérifiés d'abord, plafonnés. */
export function planRouteChecks(entries: AlertEntry[], maxChecks = MAX_ROUTE_CHECKS_PER_RUN): { checks: Array<{ key: string; sample: FlightPriceAlert; entries: AlertEntry[] }>; skippedRoutes: number } {
  const groups = new Map<string, AlertEntry[]>();
  for (const entry of entries) {
    const key = routeGroupKey(entry.alert);
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }
  const oldest = (group: AlertEntry[]) => Math.min(...group.map((entry) => (entry.alert.lastCheckedAt ? Date.parse(entry.alert.lastCheckedAt) : 0)));
  const ordered = Array.from(groups.entries()).sort((left, right) => oldest(left[1]) - oldest(right[1]));
  return {
    checks: ordered.slice(0, maxChecks).map(([key, group]) => ({ key, sample: group[0].alert, entries: group })),
    skippedRoutes: Math.max(0, ordered.length - maxChecks),
  };
}
