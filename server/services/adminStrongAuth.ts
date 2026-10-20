import { TRPCError } from "@trpc/server";
import { getTwoFactorStatus } from "../twoFactor";

/**
 * Authentification renforcée pour les actions administrateur sensibles (publication en CVthèque, transmission d'une pièce privée).
 *
 * Par défaut la porte est FERMÉE : un administrateur sans double authentification ne peut pas effectuer ces actions
 * (la connexion d'un administrateur qui a activé la double authentification exige déjà son code). Seul un réglage
 * explicite `ADMIN_2FA_ENFORCEMENT=off` peut l'ouvrir, par exemple le temps que chaque administrateur l'active.
 * En cas d'erreur de vérification, l'action est refusée plutôt qu'autorisée.
 */
export function isStrongAdminEnforced(): boolean {
  return String(process.env.ADMIN_2FA_ENFORCEMENT ?? "on").trim().toLowerCase() !== "off";
}

export async function requireStrongAdmin(admin: { id: number }): Promise<{ twoFactorEnabled: boolean }> {
  if (!isStrongAdminEnforced()) return { twoFactorEnabled: false };
  let enabled = false;
  try {
    enabled = (await getTwoFactorStatus("admin", admin.id)).enabled;
  } catch {
    throw new TRPCError({ code: "FORBIDDEN", message: "Impossible de vérifier votre double authentification : l’action sensible est refusée par précaution." });
  }
  if (!enabled) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Cette action sensible exige la double authentification : activez-la dans votre espace administrateur." });
  }
  return { twoFactorEnabled: true };
}
