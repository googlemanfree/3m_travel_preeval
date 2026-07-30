/**
 * Service de gestion des tentatives de connexion
 * Protège contre les attaques par force brute
 * - Bloque après 3 tentatives infructueuses
 * - Déblocage automatique après 15 minutes
 */

import { TRPCError } from "@trpc/server";

// Stockage en mémoire des tentatives (dans un vrai système, utiliser Redis)
const loginAttempts: Map<string, { count: number; lockedUntil: Date | null }> = new Map();

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

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
 * Réinitialise les tentatives après une connexion réussie
 */
export function resetLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier);
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
