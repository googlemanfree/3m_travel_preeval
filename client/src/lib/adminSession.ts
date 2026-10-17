/**
 * Session administrateur : dual-read localStorage puis sessionStorage.
 * AdminGuard et AdminLogin écrivent les deux ; certains écrans ne lisaient
 * que sessionStorage et perdaient le jeton après refresh navigateur.
 */
export function getAdminSessionToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("adminSessionToken") || sessionStorage.getItem("adminSessionToken") || "";
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
  sessionStorage.removeItem("adminName");
  sessionStorage.removeItem("adminType");
}
