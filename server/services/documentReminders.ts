import crypto from "node:crypto";

/**
 * Relances automatiques des pièces manquantes : quand relancer, quoi dire, comment se désinscrire.
 * Règles : une relance seulement si des pièces manquent ou sont à remplacer ; au plus 3 relances depuis la dernière activité
 * du candidat (connexion, dépôt de pièce, paiement) ; J+3, J+7 puis J+14 ; jamais deux relances à moins de 3 jours d'écart ;
 * arrêt immédiat après désinscription. Aucune échéance ni conséquence n'est inventée dans le message.
 */

export const REMINDER_SCHEDULE_DAYS = [3, 7, 14] as const;
export const MIN_DAYS_BETWEEN_REMINDERS = 3;
export const REMINDER_SUBJECT_PREFIX = "Rappel de vos documents";

const DAY_MS = 24 * 60 * 60 * 1000;

export type ReminderCandidate = {
  email: string;
  fullName: string;
  /** Dernière activité du candidat : connexion, dépôt de pièce ou paiement (la plus récente). */
  lastActivityAt: Date;
  /** Relances déjà envoyées depuis cette activité. */
  remindersSinceActivity: number;
  lastReminderAt: Date | null;
  missing: number;
  replace: number;
  total: number;
  optedOut: boolean;
};

export type ReminderDecision = { due: boolean; stage: number; reason: string };

export function planReminder(candidate: ReminderCandidate, now: Date): ReminderDecision {
  if (candidate.optedOut) return { due: false, stage: 0, reason: "désinscrit" };
  if (candidate.missing + candidate.replace <= 0) return { due: false, stage: 0, reason: "rien à relancer" };
  const stageIndex = candidate.remindersSinceActivity;
  if (stageIndex >= REMINDER_SCHEDULE_DAYS.length) return { due: false, stage: 0, reason: "relances épuisées" };
  const daysInactive = (now.getTime() - candidate.lastActivityAt.getTime()) / DAY_MS;
  if (daysInactive < REMINDER_SCHEDULE_DAYS[stageIndex]) return { due: false, stage: 0, reason: "trop tôt" };
  if (candidate.lastReminderAt && (now.getTime() - candidate.lastReminderAt.getTime()) / DAY_MS < MIN_DAYS_BETWEEN_REMINDERS) return { due: false, stage: 0, reason: "relance trop récente" };
  return { due: true, stage: stageIndex + 1, reason: "à relancer" };
}

const escapeHtml = (value: string): string => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const oneLine = (value: string, max = 200): string => value.replace(/[\r\n\t]+/g, " ").trim().slice(0, max);
const plural = (count: number, one: string, many: string) => (count > 1 ? many : one);

/** Jeton de désinscription : signé (HMAC) avec le secret du serveur, lié à l'adresse e-mail. */
export function signReminderStopToken(email: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(`doc-reminder-stop:${email.trim().toLowerCase()}`).digest("hex").slice(0, 32);
}

export function verifyReminderStopToken(email: string, token: string, secret: string): boolean {
  const expected = Buffer.from(signReminderStopToken(email, secret));
  const received = Buffer.from(String(token ?? ""));
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

/** Clé de désinscription dans les réglages de l'agence (aucune adresse en clair dans la clé). */
export const reminderOptOutKey = (email: string): string => `doc_reminder_optout:${crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 40)}`;

export function buildDocumentReminderEmail(input: {
  fullName: string;
  stage: number;
  missing: number;
  replace: number;
  total: number;
  firstLabel: string | null;
  siteUrl: string;
  whatsappNumber: string;
  whatsappDisplay: string;
  stopUrl: string;
}): { subject: string; html: string } {
  const site = input.siteUrl.replace(/\/+$/, "");
  const received = Math.max(0, input.total - input.missing - input.replace);
  const toDo = input.missing + input.replace;
  const headline = input.replace > 0 && input.missing === 0
    ? `${input.replace} ${plural(input.replace, "pièce est à remplacer", "pièces sont à remplacer")}`
    : `Il vous reste ${toDo} ${plural(toDo, "pièce", "pièces")} à envoyer`;
  const intro = input.stage >= 3
    ? "C’est notre dernier rappel automatique. Votre dossier avance dès que vos pièces sont reçues : si vous rencontrez une difficulté, écrivez-nous, nous vous aidons volontiers."
    : "Votre dossier avance dès que vos pièces sont reçues. Chaque pièce s’envoie en un geste depuis votre espace client, photo du téléphone comprise.";
  const whatsappHref = `https://wa.me/${input.whatsappNumber}?text=${encodeURIComponent("Bonjour 3M Travel & Services, j’ai besoin d’aide pour envoyer mes documents.")}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:22px;color:#172554">
<div style="background:#1e3a8a;padding:22px;text-align:center;border-radius:14px 14px 0 0"><h1 style="color:#ffffff;font-size:19px;margin:0">3M Travel &amp; Services</h1><p style="color:#bfdbfe;font-size:13px;margin:6px 0 0">${escapeHtml(headline)}</p></div>
<div style="border:1px solid #e2e8f0;border-top:0;padding:22px;border-radius:0 0 14px 14px">
<p>Bonjour${input.fullName ? ` <strong>${escapeHtml(oneLine(input.fullName, 120))}</strong>` : ""},</p>
<p>${escapeHtml(intro)}</p>
<div style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:8px;padding:14px 16px;margin:14px 0">
<p style="margin:0;font-size:15px"><strong>${received} sur ${input.total}</strong> pièces reçues.</p>
${input.firstLabel ? `<p style="margin:8px 0 0;font-size:14px">Prochaine pièce : <strong>${escapeHtml(oneLine(input.firstLabel, 120))}</strong></p>` : ""}
</div>
<p style="text-align:center;margin:20px 0"><a href="${escapeHtml(site)}/mon-espace?section=documents" style="display:inline-block;background:#1d4ed8;color:#ffffff;padding:13px 26px;border-radius:10px;text-decoration:none;font-weight:bold">Envoyer mes documents</a></p>
<p style="text-align:center;margin:0 0 14px"><a href="${escapeHtml(whatsappHref)}" style="color:#15803d;font-weight:bold;text-decoration:none">Besoin d’aide ? Écrivez-nous sur WhatsApp (${escapeHtml(input.whatsappDisplay)})</a></p>
<p style="font-size:11px;color:#94a3b8;margin:16px 0 0;text-align:center">Ce message est envoyé automatiquement tant que des pièces de votre dossier manquent (3 rappels au maximum). <a href="${escapeHtml(input.stopUrl)}" style="color:#64748b">Ne plus recevoir ces rappels</a></p>
</div></div>`;
  return { subject: oneLine(`${REMINDER_SUBJECT_PREFIX} — ${headline}`), html };
}
