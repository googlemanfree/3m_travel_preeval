/**
 * Session administrateur : dual-read localStorage puis sessionStorage.
 * AdminGuard et AdminLogin écrivent les deux ; certains écrans ne lisaient
 * que sessionStorage et perdaient le jeton après refresh navigateur.
 *
 * Le serveur ne garde qu'UN jeton par administrateur : une nouvelle connexion (autre onglet, autre appareil) invalide
 * l'ancien. Le jeton le plus récent est donc celui de localStorage, partagé entre les onglets. Tous les appels doivent
 * le lire dans le même ordre : lire sessionStorage d'abord envoyait l'ancien jeton d'un onglet resté ouvert.
 */
export function getAdminSessionToken(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem("adminSessionToken") || sessionStorage.getItem("adminSessionToken") || "";
  } catch {
    return "";
  }
}

export function getAdminEmail(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("adminEmail") || localStorage.getItem("adminEmail") || "";
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("adminSessionToken");
  sessionStorage.removeItem("adminSessionToken");
  sessionStorage.removeItem("adminEmail");
  localStorage.removeItem("adminEmail");
  localStorage.removeItem("adminType");
  localStorage.removeItem("adminName");
  sessionStorage.removeItem("adminName");
  sessionStorage.removeItem("adminType");
}

/** Messages du serveur qui signifient « ce jeton n'ouvre plus de session » (et non « droit insuffisant »). */
const SESSION_LOST_MESSAGES = /^(session invalide|session expir[ée]e|session administrateur requise|session admin(istrateur)? (invalide|expir[ée]e))\.?$/i;

export function isAdminSessionError(error: unknown): boolean {
  const candidate = error as { message?: unknown } | null | undefined;
  const message = typeof candidate?.message === "string" ? candidate.message.trim() : "";
  return Boolean(message) && SESSION_LOST_MESSAGES.test(message);
}

/** Destination de retour après reconnexion : uniquement une page de l'administration, jamais un autre site. */
export function safeAdminNext(next: string | null | undefined): string {
  const value = String(next ?? "");
  if (!value.startsWith("/admin") || value.startsWith("//") || value.includes("://") || value.startsWith("/admin/login")) return "/admin";
  return value.slice(0, 300);
}

export function adminLoginUrl(returnTo: string): string {
  return `/admin/login?reason=expired&next=${encodeURIComponent(safeAdminNext(returnTo))}`;
}
