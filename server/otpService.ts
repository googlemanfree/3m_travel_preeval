/**
 * Service OTP (One-Time Password)
 * Génère, valide et gère les codes OTP 6 chiffres avec expiration 15 minutes
 */

import { TRPCError } from "@trpc/server";
import { randomInt } from "node:crypto";

/**
 * Génère un code OTP 6 chiffres cryptographiquement sûr
 */
export function generateOTP(): string {
  return randomInt(100000, 1000000).toString();
}

/**
 * Calcule la date d'expiration OTP (15 minutes à partir de maintenant)
 */
export function getOTPExpirationTime(): Date {
  return new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
}

/**
 * Vérifie si un OTP est expiré
 */
export function isOTPExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return new Date() > expiresAt;
}

/**
 * Valide un OTP
 * @throws TRPCError si l'OTP est invalide ou expiré
 */
export function validateOTP(
  providedOTP: string,
  storedOTP: string | null,
  expiresAt: Date | null
): void {
  if (!storedOTP) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Aucun code OTP trouvé. Veuillez en demander un nouveau.",
    });
  }

  if (isOTPExpired(expiresAt)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Le code OTP a expiré. Veuillez en demander un nouveau.",
    });
  }

  if (providedOTP !== storedOTP) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Code OTP incorrect.",
    });
  }
}
