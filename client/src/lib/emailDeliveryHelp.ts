/**
 * Aides pour les écrans « e-mail envoyé » (confirmation d'adresse, mot de passe oublié) :
 * adresse masquée, raccourci vers la messagerie du destinataire, délai avant un nouvel envoi, message au support.
 * Aucune donnée n'est envoyée ni conservée ailleurs que dans le sessionStorage de l'onglet (délai d'attente).
 */

/** Délai minimal entre deux envois : chaque nouvel envoi remplace le lien précédent, donc on évite les clics en rafale. */
export const RESEND_COOLDOWN_SECONDS = 60;

export const OFFICIAL_MAIL_SENDER = "noreply@3mtravelagency.com";

export type EmailKind = "verification" | "reset";

/** « jean.dupont@gmail.com » → « j***t@gmail.com » (jamais l'adresse entière à l'écran ni dans un message au support). */
export function maskEmail(email: string): string {
  const value = email.trim();
  const at = value.lastIndexOf("@");
  if (at < 1) return "";
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  if (!domain) return "";
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

const WEBMAIL: Array<{ test: RegExp; label: string; url: string }> = [
  { test: /^(gmail|googlemail)\.com$/i, label: "Ouvrir Gmail", url: "https://mail.google.com/mail/u/0/#search/from%3A3mtravelagency.com" },
  { test: /^(outlook|hotmail|live|msn)\.[a-z.]+$/i, label: "Ouvrir Outlook", url: "https://outlook.live.com/mail/0/" },
  { test: /^yahoo\.[a-z.]+$/i, label: "Ouvrir Yahoo Mail", url: "https://mail.yahoo.com/" },
  { test: /^(icloud|me|mac)\.com$/i, label: "Ouvrir iCloud Mail", url: "https://www.icloud.com/mail" },
  { test: /^(proton\.me|protonmail\.com|pm\.me)$/i, label: "Ouvrir Proton Mail", url: "https://mail.proton.me/" },
];

/** Raccourci vers la boîte du destinataire quand son fournisseur est connu ; sinon `null` (pas de bouton inventé). */
export function webmailShortcut(email: string): { label: string; url: string } | null {
  const domain = email.trim().split("@")[1]?.toLowerCase();
  if (!domain) return null;
  const match = WEBMAIL.find(entry => entry.test.test(domain));
  return match ? { label: match.label, url: match.url } : null;
}

export function supportMessage(kind: EmailKind, email: string): string {
  const masked = maskEmail(email);
  const subject = kind === "verification" ? "ne reçois pas l’e-mail de confirmation de mon adresse" : "ne reçois pas l’e-mail de réinitialisation de mon mot de passe";
  return `Bonjour, je ${subject}${masked ? ` (adresse : ${masked})` : ""}. Pouvez-vous m’aider ?`;
}

const cooldownKey = (key: string) => `3m_email_cooldown:${key.trim().toLowerCase()}`;

export function readCooldownEnd(key: string, storage: Pick<Storage, "getItem"> | undefined = safeStorage()): number {
  try {
    const raw = storage?.getItem(cooldownKey(key));
    const value = raw ? Number(raw) : 0;
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

export function writeCooldownEnd(key: string, endsAt: number, storage: Pick<Storage, "setItem"> | undefined = safeStorage()): void {
  try {
    storage?.setItem(cooldownKey(key), String(endsAt));
  } catch {
    // Navigation privée ou stockage refusé : le délai ne survivra pas à un rechargement, sans autre conséquence.
  }
}

export function secondsUntil(endsAt: number, now = Date.now()): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

function safeStorage(): Storage | undefined {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : undefined;
  } catch {
    return undefined;
  }
}
