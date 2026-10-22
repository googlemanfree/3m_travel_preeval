/**
 * Service de gestion des tentatives de connexion
 * Protège contre les attaques par force brute
 * - Bloque après 3 tentatives infructueuses
 * - Déblocage automatique après 15 minutes
 */

import { TRPCError } from "@trpc/server";

// Stockage en mémoire des tentatives (dans un vrai système, utiliser Redis)
const loginAttempts: Map<string, { count: number; lockedUntil: Date | null }> = new Map();
const exemptLoginAlerts: Map<string, { count: number; alertedAt: Date | null }> = new Map();

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const EXEMPT_ALERT_THRESHOLD = 3;
const EXEMPT_ALERT_COOLDOWN = 15 * 60 * 1000;

/** Évite qu’un même e-mail utilisé sur plusieurs espaces partage son verrouillage. */
export function scopedLoginIdentifier(scope: string, identifier: string): string {
  return `${scope}:${identifier.trim().toLowerCase()}`;
}

/**
 * Enregistre une tentative de connexion infructueuse
 */
export function recordFailedAttempt(identifier: string): void {
  const now = new Date();
  const current = loginAttempts.get(identifier) || { count: 0, lockedUntil: null };

  // Si le compte était bloqué et le délai est écoulé, réinitialiser
  if (current.lockedUntil && now > current.lockedUntil) {
    loginAttempts.set(identifier, { count: 1, lockedUntil: null });
    return;
  }

  // Incrémenter le compteur
  const newCount = current.count + 1;

  // Si on atteint le maximum, bloquer le compte
  if (newCount >= MAX_ATTEMPTS) {
    loginAttempts.set(identifier, {
      count: newCount,
      lockedUntil: new Date(now.getTime() + LOCKOUT_DURATION),
    });
  } else {
    loginAttempts.set(identifier, { count: newCount, lockedUntil: null });
  }
}

/**
 * Ralentissement progressif (sans jamais bloquer) : à partir de la 3e erreur récente sur un identifiant, chaque nouvelle tentative
 * attend 1 s de plus, jusqu'à 5 s. Un usage normal ne le voit pas ; tester des milliers de mots de passe devient impraticable.
 */
const recentFailures: Map<string, { count: number; lastAt: number }> = new Map();
const SLOWDOWN_WINDOW_MS = 15 * 60 * 1000;
const SLOWDOWN_START = 3;
const SLOWDOWN_STEP_MS = 1000;
const SLOWDOWN_MAX_MS = 5000;

export function recordSlowdownFailure(identifier: string, now: number = Date.now()): void {
  const current = recentFailures.get(identifier);
  const count = current && now - current.lastAt < SLOWDOWN_WINDOW_MS ? current.count + 1 : 1;
  recentFailures.set(identifier, { count, lastAt: now });
  // Borne la mémoire : on oublie les identifiants inactifs.
  if (recentFailures.size > 5000) {
    Array.from(recentFailures.entries()).forEach(([key, value]) => { if (now - value.lastAt >= SLOWDOWN_WINDOW_MS) recentFailures.delete(key); });
  }
}

export function resetSlowdown(identifier: string): void {
  recentFailures.delete(identifier);
}

/** Attente (en millisecondes) à appliquer avant de traiter la prochaine tentative. */
export function slowdownDelayMs(identifier: string, now: number = Date.now()): number {
  const current = recentFailures.get(identifier);
  if (!current || now - current.lastAt >= SLOWDOWN_WINDOW_MS) return 0;
  if (current.count < SLOWDOWN_START) return 0;
  return Math.min(SLOWDOWN_MAX_MS, (current.count - SLOWDOWN_START + 1) * SLOWDOWN_STEP_MS);
}

/**
 * Réinitialise les tentatives après une connexion réussie
 */
export function resetLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier);
}

/**
 * Compte les échecs du compte exempté sans jamais le verrouiller.
 * Retourne true une seule fois par fenêtre de 15 minutes lorsque le seuil est atteint.
 */
export function recordExemptLoginAttempt(identifier: string): boolean {
  const now = new Date();
  const current = exemptLoginAlerts.get(identifier);
  if (current?.alertedAt && now.getTime() - current.alertedAt.getTime() >= EXEMPT_ALERT_COOLDOWN) {
    exemptLoginAlerts.delete(identifier);
  }

  const refreshed = exemptLoginAlerts.get(identifier) || { count: 0, alertedAt: null };
  const count = refreshed.count + 1;
  const shouldAlert = count >= EXEMPT_ALERT_THRESHOLD && !refreshed.alertedAt;
  exemptLoginAlerts.set(identifier, { count, alertedAt: shouldAlert ? now : refreshed.alertedAt });
  return shouldAlert;
}

/** Réinitialise le compteur d’alerte après une connexion réussie. */
export function resetExemptLoginAttempts(identifier: string): void {
  exemptLoginAlerts.delete(identifier);
}

/**
 * Vérifie si un compte est bloqué
 * @throws TRPCError si le compte est bloqué
 */
export function checkLoginAttempts(identifier: string): void {
  const current = loginAttempts.get(identifier);
  if (!current) return; // Pas de tentatives enregistrées

  const now = new Date();

  // Si le compte était bloqué et le délai est écoulé, déverrouiller
  if (current.lockedUntil && now > current.lockedUntil) {
    loginAttempts.delete(identifier);
    return;
  }

  // Si le compte est actuellement bloqué
  if (current.lockedUntil && now <= current.lockedUntil) {
    const remainingMinutes = Math.ceil((current.lockedUntil.getTime() - now.getTime()) / 60000);
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Trop de tentatives. Compte bloqué pour ${remainingMinutes} minute(s).`,
    });
  }
}

/**
 * Obtient le nombre de tentatives restantes
 */
export function getRemainingAttempts(identifier: string): number {
  const current = loginAttempts.get(identifier);
  if (!current) return MAX_ATTEMPTS;

  const now = new Date();
  if (current.lockedUntil && now > current.lockedUntil) {
    loginAttempts.delete(identifier);
    return MAX_ATTEMPTS;
  }

  return Math.max(0, MAX_ATTEMPTS - current.count);
}

/** Retourne uniquement l’état nécessaire à l’interface de connexion. */
export function getLoginAttemptStatus(identifier: string): { remainingAttempts: number; maxAttempts: number; lockedUntil: Date | null } {
  const current = loginAttempts.get(identifier);
  const remainingAttempts = getRemainingAttempts(identifier);
  return {
    remainingAttempts,
    maxAttempts: MAX_ATTEMPTS,
    lockedUntil: current?.lockedUntil ?? null,
  };
}
