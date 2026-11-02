/**
 * Sécurité du compte candidat : déconnexion de tous les appareils (sans changer le mot de passe) et connexions récentes.
 * La date limite de session est conservée dans agency_settings ; un jeton émis avant elle n'ouvre plus rien.
 */
import { createHash } from "node:crypto";
import { and, desc, eq, gte } from "drizzle-orm";
import { agencySettings } from "../../drizzle/schema";
import { clientNotifications } from "../../drizzle/caseTrackingSchema";
import { candidateLoginEvents, candidateNotificationPrefs } from "../../drizzle/remoteSupportSchema";
import type { getDb } from "../db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export const SESSION_CUTOFF_PREFIX = "candidate_session_cutoff:";

/** Date limite en secondes (même unité que le champ `iat` du jeton), ou null. */
export async function getSessionCutoff(db: Db, candidateId: number): Promise<number | null> {
  const [row] = await db.select({ settingValue: agencySettings.settingValue }).from(agencySettings).where(eq(agencySettings.settingKey, `${SESSION_CUTOFF_PREFIX}${candidateId}`)).limit(1);
  const value = Number(row?.settingValue);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Tout jeton émis avant cet instant est refusé. Le jeton d'une reconnexion faite ensuite reste valable. */
export async function revokeAllSessions(db: Db, candidateId: number, now: Date = new Date()): Promise<void> {
  const key = `${SESSION_CUTOFF_PREFIX}${candidateId}`;
  const value = String(Math.floor(now.getTime() / 1000));
  const [existing] = await db.select({ id: agencySettings.id }).from(agencySettings).where(eq(agencySettings.settingKey, key)).limit(1);
  if (existing) await db.update(agencySettings).set({ settingValue: value, updatedAt: now }).where(eq(agencySettings.id, existing.id));
  else await db.insert(agencySettings).values({ settingKey: key, settingValue: value });
}

/** « Chrome sur Android » : suffisant pour reconnaître son propre appareil, sans empreinte invasive. */
export function deviceLabelFromUserAgent(userAgent: string | undefined | null): string {
  const ua = String(userAgent ?? "");
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\/|CriOS\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Navigateur";
  const system = /Android/.test(ua) ? "Android" : /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac OS X|Macintosh/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "appareil inconnu";
  return `${browser} sur ${system}`;
}

export const deviceHash = (label: string, acceptLanguage: string | undefined | null): string => createHash("sha256").update(`${label}|${String(acceptLanguage ?? "").slice(0, 20)}`).digest("hex");

type RequestLike = { headers?: Record<string, string | string[] | undefined> } | undefined;
const header = (req: RequestLike, name: string): string | undefined => {
  const value = req?.headers?.[name];
  return Array.isArray(value) ? value[0] : value;
};

/** Enregistre la connexion ; prévient le candidat dans son espace si l'appareil est nouveau (et qu'il en avait déjà utilisé d'autres). */
export async function recordLoginEvent(db: Db, candidateId: number, req: RequestLike): Promise<{ newDevice: boolean }> {
  const label = deviceLabelFromUserAgent(header(req, "user-agent"));
  const hash = deviceHash(label, header(req, "accept-language"));
  const earlier = await db.select({ deviceHash: candidateLoginEvents.deviceHash }).from(candidateLoginEvents).where(and(eq(candidateLoginEvents.candidateId, candidateId), gte(candidateLoginEvents.createdAt, new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)))).limit(50);
  const newDevice = earlier.length > 0 && !earlier.some((row) => row.deviceHash === hash);
  await db.insert(candidateLoginEvents).values({ candidateId, deviceHash: hash, deviceLabel: label });
  if (newDevice) {
    await db.insert(clientNotifications).values({
      candidateId, type: "new_device_login", title: "Nouvelle connexion à votre espace",
      body: `Votre espace a été ouvert depuis un nouvel appareil (${label}). Si ce n'est pas vous, ouvrez « Mon compte » puis « Me déconnecter de tous les appareils », et changez votre mot de passe.`,
      actionUrl: "/mon-espace", isRead: false,
    });
  }
  return { newDevice };
}

export async function recentLogins(db: Db, candidateId: number) {
  return db.select({ label: candidateLoginEvents.deviceLabel, at: candidateLoginEvents.createdAt }).from(candidateLoginEvents).where(eq(candidateLoginEvents.candidateId, candidateId)).orderBy(desc(candidateLoginEvents.createdAt)).limit(10);
}

/** Heure (0-23) au Cameroun : les heures de silence se règlent dans ce fuseau. */
export const douala = (now: Date = new Date()): number => {
  const hour = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: "Africa/Douala" }).formatToParts(now).find((part) => part.type === "hour")?.value;
  return Number(hour) % 24;
};

export function inQuietHours(from: number | null | undefined, to: number | null | undefined, hour: number): boolean {
  if (from === null || from === undefined || to === null || to === undefined || from === to) return false;
  return from < to ? hour >= from && hour < to : hour >= from || hour < to;
}

/** Faut-il envoyer un e-mail non obligatoire à ce candidat maintenant ? Les messages indispensables (bilan, sécurité) ne passent pas par ici. */
export async function emailAllowed(db: Db, candidateId: number, now: Date = new Date()): Promise<boolean> {
  try {
    const [prefs] = await db.select({ emailEnabled: candidateNotificationPrefs.emailEnabled, quietFrom: candidateNotificationPrefs.quietFrom, quietTo: candidateNotificationPrefs.quietTo }).from(candidateNotificationPrefs).where(eq(candidateNotificationPrefs.candidateId, candidateId)).limit(1);
    if (!prefs) return true;
    if (prefs.emailEnabled === 0) return false;
    return !inQuietHours(prefs.quietFrom, prefs.quietTo, douala(now));
  } catch {
    return true;
  }
}
