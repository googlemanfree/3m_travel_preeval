/**
 * /.well-known/security.txt (RFC 9116) : où signaler une faille de sécurité.
 * La date d'expiration est fixe et à renouveler chaque année (un test échoue 30 jours avant l'échéance).
 */
export const SECURITY_TXT_EXPIRES = "2027-10-19T00:00:00.000Z";

export function renderSecurityTxt(origin = "https://www.3mtravelagency.com"): string {
  return [
    "Contact: mailto:hello@3mtravelagency.com",
    `Expires: ${SECURITY_TXT_EXPIRES}`,
    "Preferred-Languages: fr, en",
    `Canonical: ${origin}/.well-known/security.txt`,
    "",
  ].join("\n");
}
