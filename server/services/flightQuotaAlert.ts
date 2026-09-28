/**
 * Alerte au comptoir quand le quota SearchAPI.io est atteint : sans elle, la panne du 27/09/2026 (quota épuisé, personne
 * prévenu pendant des heures) se reproduit silencieusement. Un seul e-mail par fenêtre de recul, pour ne jamais inonder
 * la boîte de l'agence sous le volume réel de recherches en échec.
 */
import { sendEmail } from "../_core/email";

export const QUOTA_ALERT_COOLDOWN_MS = 6 * 60 * 60 * 1000;

/** Un e-mail est dû si aucun n'est parti dans la fenêtre de recul (ou si aucun n'est jamais parti). */
export function shouldSendQuotaAlert(lastAlertAt: number | null, now: number, cooldownMs = QUOTA_ALERT_COOLDOWN_MS): boolean {
  return lastAlertAt === null || now - lastAlertAt >= cooldownMs;
}

const esc = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function buildQuotaAlertEmail(input: { provider: string; detail: string; occurredAt: Date }): { subject: string; html: string } {
  const when = input.occurredAt.toISOString().replace("T", " ").slice(0, 16);
  return {
    subject: `⚠️ Quota ${input.provider} atteint — recherches de vols affectées`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#172554">
<h2 style="margin:0 0 12px;color:#b91c1c">Quota ${esc(input.provider)} atteint</h2>
<p style="margin:0 0 12px">Le fournisseur de tarifs de vols a répondu que le quota est épuisé (${esc(input.detail)}), le ${esc(when)} UTC.</p>
<p style="margin:0 0 12px"><strong>Effet immédiat :</strong> les visiteurs qui recherchent un vol reçoivent un message « recherche indisponible » (aucun tarif inventé). Les recherches basculent automatiquement sur le fournisseur de secours SerpApi tant que sa réserve gratuite tient ; les « Meilleures offres » de la page /flights, elles, restent vides jusqu'au retour du quota principal.</p>
<p style="margin:0 0 16px"><strong>À faire :</strong> augmenter le plan sur searchapi.io, ou attendre le renouvellement mensuel du quota.</p>
<p style="margin:0;font-size:12px;color:#94a3b8">Cet e-mail ne repart pas avant ${Math.round(QUOTA_ALERT_COOLDOWN_MS / 3_600_000)} h, même si la panne continue.</p>
</div>`,
  };
}

let lastAlertSentAt: number | null = null;
/** Pour les tests. */
export function resetQuotaAlertState() {
  lastAlertSentAt = null;
}

/**
 * Envoie l'alerte si la fenêtre de recul est passée ; ne bloque jamais la réponse au visiteur (échec avalé, journalisé).
 * `to` par défaut : la boîte de l'agence, déjà utilisée ailleurs pour les alertes opérationnelles.
 */
export function maybeAlertQuotaExhausted(provider: string, detail: string, options: { now?: () => number; to?: string } = {}) {
  const now = (options.now ?? Date.now)();
  if (!shouldSendQuotaAlert(lastAlertSentAt, now)) return;
  lastAlertSentAt = now;
  const mail = buildQuotaAlertEmail({ provider, detail, occurredAt: new Date(now) });
  void sendEmail({ to: options.to ?? "hello@3mtravelagency.com", subject: mail.subject, html: mail.html }).catch((error) => {
    console.error("[FlightQuotaAlert] envoi impossible", error);
  });
}
