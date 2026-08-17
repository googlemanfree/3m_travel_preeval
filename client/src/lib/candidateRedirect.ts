/** Retourne uniquement une destination interne sûre après connexion candidat. */
export function resolveCandidateReturnPath(rawFrom: string | null | undefined): string {
  if (!rawFrom) return "/dashboard";

  let destination: string;
  try {
    destination = decodeURIComponent(rawFrom);
  } catch {
    return "/dashboard";
  }

  return destination.startsWith("/") && !destination.startsWith("//")
    ? destination
    : "/dashboard";
}
