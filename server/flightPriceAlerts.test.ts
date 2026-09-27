import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  ALERT_MAX_AGE_DAYS,
  MAX_ROUTE_CHECKS_PER_RUN,
  isAlertExpired,
  isValidAlertToken,
  parseAlert,
  planAlertNotification,
  planRouteChecks,
  type AlertEntry,
  type FlightPriceAlert,
} from "../shared/flightPriceAlert";
import { evaluateAlerts } from "./scheduled/flightPriceAlerts";
import { buildAlertConfirmationEmail, buildPriceDropEmail, searchUrlFor } from "./services/flightPriceAlertEmail";

const NOW = new Date("2026-10-01T06:00:00Z");
const TOKEN = "a".repeat(32);

const alert = (patch: Partial<FlightPriceAlert> = {}): FlightPriceAlert => ({
  email: "awa@example.com",
  name: "Awa",
  origin: "NSI",
  destination: "CDG",
  tripType: "ROUND_TRIP",
  departureDate: "2026-11-23",
  returnDate: "2026-12-03",
  baselinePriceXaf: 500_000,
  targetPriceXaf: null,
  createdAt: "2026-09-27T10:00:00Z",
  confirmed: true,
  lastCheckedAt: null,
  lastNotifiedPriceXaf: null,
  notifications: 0,
  ...patch,
});
const token = (n: number) => String(n).padStart(32, "0");
const entry = (n: number, patch: Partial<FlightPriceAlert> = {}): AlertEntry => ({ token: token(n), alert: alert(patch) });

describe("lecture d'une alerte stockée", () => {
  it("relit une alerte valide et ignore tout ce qui est incomplet ou altéré", () => {
    expect(parseAlert(JSON.stringify(alert()))).toEqual(alert());
    for (const bad of [null, "", "pas du json", "[]", "x".repeat(2100), JSON.stringify(alert({ email: "pas-un-email" })), JSON.stringify(alert({ origin: "nsi" })),
      JSON.stringify(alert({ destination: "NSI" })), JSON.stringify(alert({ departureDate: "demain" })), JSON.stringify(alert({ returnDate: "2026-11-01" })),
      JSON.stringify(alert({ baselinePriceXaf: 0 })), JSON.stringify({ ...alert(), tripType: "MULTI" }), JSON.stringify({ ...alert(), createdAt: "hier" })]) {
      expect(parseAlert(bad as string | null), String(bad).slice(0, 40)).toBeNull();
    }
  });

  it("un aller simple n'a jamais de date de retour ; l'adresse est mise en minuscules ; les champs inconnus sont écartés", () => {
    const parsed = parseAlert(JSON.stringify({ ...alert({ tripType: "ONE_WAY", returnDate: "" }), email: "AWA@Example.COM", extra: "x" }))!;
    expect(parsed.returnDate).toBe("");
    expect(parsed.email).toBe("awa@example.com");
    expect(Object.keys(parsed)).not.toContain("extra");
  });

  it("le jeton est un secret de 32 caractères hexadécimaux", () => {
    expect(isValidAlertToken(TOKEN)).toBe(true);
    for (const bad of ["", "A".repeat(32), "a".repeat(31), "g".repeat(32), "../etc", 12, null]) expect(isValidAlertToken(bad)).toBe(false);
  });
});

describe("expiration", () => {
  it("départ passé, 60 jours écoulés ou 3 e-mails déjà envoyés", () => {
    expect(isAlertExpired(alert(), NOW)).toBe(false);
    expect(isAlertExpired(alert({ departureDate: "2026-09-30" }), NOW)).toBe(true);
    expect(isAlertExpired(alert({ departureDate: "2026-10-01" }), NOW)).toBe(false);
    const old = new Date(Date.parse("2026-09-27T10:00:00Z") + (ALERT_MAX_AGE_DAYS * 86_400_000 + 1000)).toISOString();
    expect(isAlertExpired(alert(), new Date(old))).toBe(true);
    expect(isAlertExpired(alert({ notifications: 3 }), NOW)).toBe(true);
    expect(isAlertExpired(alert({ notifications: 2 }), NOW)).toBe(false);
  });
});

describe("décision d'envoi : seulement pour un tarif réellement relevé et plus bas", () => {
  it("aucun relevé exploitable : rien", () => {
    for (const price of [null, 0, -5, Number.NaN]) expect(planAlertNotification(alert(), price)).toEqual({ notify: false, reason: "no_data" });
  });

  it("baisse d'au moins 3 % par rapport à la référence", () => {
    expect(planAlertNotification(alert(), 485_000)).toEqual({ notify: true, reason: "drop" });
    expect(planAlertNotification(alert(), 485_001)).toEqual({ notify: false, reason: "not_lower" });
    expect(planAlertNotification(alert(), 520_000).notify).toBe(false);
  });

  it("après un e-mail, la référence devient le dernier tarif notifié (pas de doublon pour le même prix)", () => {
    const notified = alert({ lastNotifiedPriceXaf: 480_000, notifications: 1 });
    expect(planAlertNotification(notified, 480_000).notify).toBe(false);
    expect(planAlertNotification(notified, 470_000).notify).toBe(false);
    expect(planAlertNotification(notified, 465_000).notify).toBe(true);
  });

  it("avec une cible, il faut aussi passer sous la cible", () => {
    expect(planAlertNotification(alert({ targetPriceXaf: 400_000 }), 450_000)).toEqual({ notify: false, reason: "above_target" });
    expect(planAlertNotification(alert({ targetPriceXaf: 400_000 }), 399_000).notify).toBe(true);
  });
});

describe("regroupement des relevés payants", () => {
  it("un seul relevé par parcours et par dates, quel que soit le nombre d'alertes", () => {
    const { checks } = planRouteChecks([entry(1), entry(2), entry(3, { email: "b@example.com" }), entry(4, { destination: "BRU" })]);
    expect(checks).toHaveLength(2);
    expect(checks.map((check) => check.entries.length).sort()).toEqual([1, 3]);
  });

  it("plafonné à 8 par passage, les moins récemment vérifiés d'abord", () => {
    const many = Array.from({ length: 12 }, (_, index) => entry(index + 1, { departureDate: `2026-11-${String(10 + index).padStart(2, "0")}`, returnDate: `2026-12-${String(10 + index).padStart(2, "0")}`, lastCheckedAt: index < 4 ? "2026-09-30T00:00:00Z" : null }));
    const { checks, skippedRoutes } = planRouteChecks(many);
    expect(checks).toHaveLength(MAX_ROUTE_CHECKS_PER_RUN);
    expect(skippedRoutes).toBe(4);
    const kept = new Set(checks.flatMap((check) => check.entries.map((item) => item.token)));
    for (let index = 0; index < 4; index += 1) expect(kept.has(token(index + 1)), `récemment vérifiée ${index}`).toBe(false);
  });
});

describe("passage quotidien", () => {
  const run = (entries: AlertEntry[], fetchCheapest: (a: FlightPriceAlert) => Promise<number | null>, options: { dryRun?: boolean; optedOut?: string[] } = {}) =>
    evaluateAlerts({
      entries,
      now: NOW,
      dryRun: Boolean(options.dryRun),
      isOptedOut: (email) => (options.optedOut ?? []).includes(email),
      fetchCheapest,
      stopUrlFor: (t) => `https://site.test/api/flight-alerts/stop?a=${t}`,
      searchBaseUrl: "https://site.test",
    });

  it("un tarif plus bas réellement relevé : un e-mail avec le vrai prix, et la référence est mise à jour", async () => {
    const { actions, summary } = await run([entry(1)], async () => 470_000);
    expect(summary).toMatchObject({ notified: 1, routesChecked: 1, removed: 0 });
    expect(actions[0].mail?.to).toBe("awa@example.com");
    expect(actions[0].mail?.html).toContain("470");
    expect(actions[0].mail?.html).toContain("500");
    expect(actions[0].next).toMatchObject({ lastNotifiedPriceXaf: 470_000, notifications: 1, lastCheckedAt: NOW.toISOString() });
  });

  it("un relevé pour plusieurs alertes du même parcours : un seul appel payant, chacune évaluée selon sa cible", async () => {
    const fetchCheapest = vi.fn(async () => 450_000);
    const { actions } = await run([entry(1), entry(2, { targetPriceXaf: 400_000 })], fetchCheapest);
    expect(fetchCheapest).toHaveBeenCalledTimes(1);
    expect(actions.find((a) => a.token === token(1))?.mail).toBeTruthy();
    expect(actions.find((a) => a.token === token(2))?.mail).toBeUndefined();
  });

  it("fournisseur en panne : aucun e-mail, l'alerte est conservée, jamais un prix de remplacement", async () => {
    const throwing = await run([entry(1)], async () => { throw new Error("quota"); });
    expect(throwing.summary).toMatchObject({ notified: 0, failedRoutes: 1 });
    expect(throwing.actions[0].mail).toBeUndefined();
    expect(throwing.actions[0].next).not.toBeNull();
    const empty = await run([entry(1)], async () => null);
    expect(empty.actions[0].mail).toBeUndefined();
  });

  it("alertes expirées, jamais confirmées depuis 3 jours ou désinscrites : supprimées, sans relevé ni e-mail", async () => {
    const fetchCheapest = vi.fn(async () => 100_000);
    const { actions, summary } = await run(
      [entry(1, { departureDate: "2026-09-01", returnDate: "2026-09-10" }), entry(2, { confirmed: false, createdAt: "2026-09-26T00:00:00Z" }), entry(3, { email: "stop@example.com" })],
      fetchCheapest,
      { optedOut: ["stop@example.com"] },
    );
    expect(actions.map((a) => [a.reason, a.next])).toEqual([["expired", null], ["never_confirmed", null], ["opted_out", null]]);
    expect(summary.removed).toBe(3);
    expect(fetchCheapest).not.toHaveBeenCalled();
  });

  it("alerte non confirmée et récente : ni relevé ni e-mail (double consentement)", async () => {
    const fetchCheapest = vi.fn(async () => 100_000);
    const { actions } = await run([entry(1, { confirmed: false, createdAt: "2026-10-01T05:00:00Z" })], fetchCheapest);
    expect(actions).toEqual([]);
    expect(fetchCheapest).not.toHaveBeenCalled();
  });

  it("aperçu : aucun relevé payant, aucun e-mail", async () => {
    const fetchCheapest = vi.fn(async () => 100_000);
    const { actions, summary } = await run([entry(1)], fetchCheapest, { dryRun: true });
    expect(fetchCheapest).not.toHaveBeenCalled();
    expect(actions.every((a) => !a.mail)).toBe(true);
    expect(summary).toMatchObject({ notified: 0, routesChecked: 0 });
  });
});

describe("e-mails d'alerte", () => {
  const base = { name: "Awa", origin: "NSI", destination: "CDG", tripType: "ROUND_TRIP" as const, departureDate: "2026-11-23", returnDate: "2026-12-03" };

  it("la confirmation explique le double consentement et offre la suppression", () => {
    const { subject, html } = buildAlertConfirmationEmail({ ...base, confirmUrl: "https://site.test/api/flight-alerts/confirm?a=x", stopUrl: "https://site.test/api/flight-alerts/stop?a=x", targetPriceXaf: 400_000 });
    expect(subject).toContain("Confirmez");
    expect(html).toContain("flight-alerts/confirm");
    expect(html).toContain("flight-alerts/stop");
    expect(html).toContain("NSI → CDG");
    expect(html).toMatch(/sous 400\s000 FCFA/);
    expect(html).toContain("sans confirmation, rien n'est activé");
    expect(html).not.toMatch(/garanti(?!r)/i);
  });

  it("l'alerte de baisse cite le vrai tarif, l'ancien, la date du relevé, et reste indicative", () => {
    const { subject, html } = buildPriceDropEmail({ ...base, priceXaf: 470_000, previousXaf: 500_000, searchUrl: searchUrlFor("https://site.test/", base), stopUrl: "https://site.test/api/flight-alerts/stop?a=x", retrievedAt: NOW });
    expect(subject).toContain("NSI → CDG");
    expect(html).toMatch(/470\s000 FCFA/);
    expect(html).toMatch(/500\s000 FCFA/);
    expect(html).toContain("2026-10-01");
    expect(html).toContain("confirmés par un conseiller");
    expect(html).toContain("date=2026-11-23");
    expect(html).toContain("returnDate=2026-12-03");
  });

  it("neutralise tout HTML venu du nom saisi", () => {
    const { html } = buildAlertConfirmationEmail({ ...base, name: '<img src=x onerror="alert(1)">', confirmUrl: "https://s/c", stopUrl: "https://s/s", targetPriceXaf: null });
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });

  it("le lien de recherche reprend les paramètres lus par la page de vols", () => {
    const url = new URL(searchUrlFor("https://site.test", base));
    expect(url.pathname).toBe("/flights");
    expect(Object.fromEntries(url.searchParams)).toEqual({ origin: "NSI", destination: "CDG", date: "2026-11-23", tripType: "ROUND_TRIP", returnDate: "2026-12-03" });
    const page = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/Flights.tsx"), "utf8");
    for (const param of ["origin", "destination", "date", "tripType", "returnDate"]) expect(page).toContain(`initialParams.get("${param}")`);
  });
});

describe("branchement", () => {
  const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), "utf8").split(String.fromCharCode(13)).join("");

  it("routes de confirmation et d'arrêt, tâche quotidienne, procédures publiques limitées en débit", () => {
    const index = read("server/_core/index.ts");
    expect(index).toContain('app.get("/api/flight-alerts/confirm"');
    expect(index).toContain('app.get("/api/flight-alerts/stop"');
    expect(read("server/scheduled/documentReminderJob.ts")).toContain("runFlightPriceAlerts(db, { dryRun, fetchCheapest: fetchCheapestForAlert })");
    const router = read("server/routers/flights.ts");
    expect(router).toContain("priceAlertGuard.assertAllowed(ctx?.req, email);");
    expect(router).toContain("consent: z.literal(true)");
    expect(router).toContain("confirmed: false,");
    // L'option automatique n'est jamais créée si la tâche quotidienne ne tourne pas.
    expect(router).toContain("!(await alertsAreRunning(db))");
  });

  it("interrupteur FLIGHT_ALERTS_DISABLED et clé fournisseur exigée avant tout relevé payant", () => {
    const job = read("server/scheduled/flightPriceAlerts.ts");
    expect(job).toContain('process.env.FLIGHT_ALERTS_DISABLED === "1" || !process.env.SEARCHAPI_KEY');
    expect(job).toContain("if (dryRun) return summary;");
  });
});
