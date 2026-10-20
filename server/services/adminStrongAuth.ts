import { TRPCError } from "@trpc/server";
import { getTwoFactorStatus } from "../twoFactor";

/**
 * Authentification renforcée pour les actions administrateur sensibles (publication en CVthèque, transmission d'une pièce privée).
 *
 * `ADMIN_2FA_ENFORCEMENT=on` rend la double authentification obligatoire pour ces actions. Par défaut (absent ou « off »),
 * l'action reste possible et un avertissement est renvoyé : cela évite de verrouiller les administrateurs avant que chacun
 * ait activé sa double authentification. Le passage à « on » est un simple réglage d'environnement.
 */
export function isStrongAdminEnforced(): boolean {
  return String(process.env.ADMIN_2FA_ENFORCEMENT ?? "").trim().toLowerCase() === "on";
}

export async function requireStrongAdmin(admin: { id: number }): Promise<{ twoFactorEnabled: boolean }> {
  let enabled = false;
  try {
    enabled = (await getTwoFactorStatus("admin", admin.id)).enabled;
  } catch {
    enabled = false;
  }
  if (!enabled && isStrongAdminEnforced()) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Cette action sensible exige la double authentification : activez-la dans votre espace administrateur." });
  }
  return { twoFactorEnabled: enabled };
}
