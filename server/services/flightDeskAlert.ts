import { DEFAULT_DESK_WHATSAPP, buildDeskAlertText, clientContactMessage, normalizeWhatsAppNumber, whatsAppLink, type DeskAlertData } from "../../shared/flightDeskAlert";

/**
 * E-mail d'alerte envoyé au comptoir à chaque demande de réservation de vol. Il contient tout ce dont l'agent a besoin
 * pour effectuer une vraie réservation (option) en attendant l'émission réelle, et des liens WhatsApp en un clic.
 * L'envoi automatique de messages WhatsApp exige un compte WhatsApp Business : tant qu'il n'est pas branché, ce sont
 * ces liens (client et comptoir) qui signalent la demande par WhatsApp.
 */

const escapeHtml = (value: string): string => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const oneLine = (value: string): string => value.replace(/[\r\n\t]+/g, " ").trim();

/** Destinataires du comptoir : FLIGHT_DESK_EMAILS (liste séparée par des virgules) ou, à défaut, l'adresse de l'agence. */
export function resolveDeskRecipients(env: Record<string, string | undefined>, fallback = "hello@3mtravelagency.com"): string[] {
  const configured = (env.FLIGHT_DESK_EMAILS ?? "")
    .split(/[,;\s]+/)
    .map((address) => address.trim())
    .filter((address) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address));
  return configured.length > 0 ? Array.from(new Set(configured)) : [fallback];
}

/** Numéro WhatsApp du comptoir : FLIGHT_DESK_WHATSAPP ou, à défaut, la ligne WhatsApp de l'agence. */
export function resolveDeskWhatsApp(env: Record<string, string | undefined>): string {
  return normalizeWhatsAppNumber(env.FLIGHT_DESK_WHATSAPP) ?? DEFAULT_DESK_WHATSAPP;
}

export function buildDeskAlertEmail(data: DeskAlertData, options: { adminUrl: string; deskWhatsApp: string }): { subject: string; html: string } {
  const summary = buildDeskAlertText(data);
  const clientLink = data.passengerPhone && normalizeWhatsAppNumber(data.passengerPhone) ? whatsAppLink(data.passengerPhone, clientContactMessage(data)) : null;
  const deskLink = whatsAppLink(options.deskWhatsApp, summary);
  const urgent = data.priority === "URGENTE";
  const subject = oneLine(`${urgent ? "[URGENT] " : ""}[3M Travel] Réservation vol ${data.requestRef} — ${data.outbound.route} — ${data.outbound.date}`);
  const row = (label: string, value: string) => `<tr><td style="padding:6px 10px;color:#64748b;font-size:12px;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td><td style="padding:6px 10px;font-weight:bold;color:#0f172a;font-size:14px">${value}</td></tr>`;
  const leg = (title: string, value: DeskAlertData["outbound"]) => row(title, `${escapeHtml(value.airline)} ${escapeHtml(value.flightNumber)}<br/><span style="font-weight:normal">${escapeHtml(value.route)} · ${escapeHtml(value.date)} · ${escapeHtml(value.departureTime)} → ${escapeHtml(value.arrivalTime)}</span>`);
  const price = data.quotedTotalPrice === null ? "à confirmer" : `${new Intl.NumberFormat("fr-FR").format(data.quotedTotalPrice)} ${escapeHtml(data.currency)}`;
  const button = (href: string, label: string, color: string) => `<a href="${href}" style="display:inline-block;background:${color};color:#ffffff;padding:11px 18px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:13px;margin:0 8px 8px 0">${escapeHtml(label)}</a>`;

  const html = `<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;padding:20px;color:#172554">
<h2 style="margin:0 0 6px;color:${urgent ? "#b91c1c" : "#1d4ed8"}">Nouvelle demande de réservation de vol</h2>
<p style="margin:0 0 14px;font-size:13px;color:#475569">À traiter par le comptoir : réservation réelle (option) en attente de l’émission du billet. Priorité : <strong>${escapeHtml(data.priority)}</strong>.</p>
<table style="width:100%;border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px">
${row("Référence", escapeHtml(data.requestRef))}
${row("Client", `${escapeHtml(data.passengerName)}${data.passengerPhone ? `<br/><span style="font-weight:normal">${escapeHtml(data.passengerPhone)}</span>` : ""}<br/><span style="font-weight:normal">${escapeHtml(data.passengerEmail)}</span>`)}
${row("Voyageurs / cabine", `${data.travelers ?? "à confirmer"}${data.cabin ? ` · ${escapeHtml(data.cabin)}` : ""}`)}
${leg("Aller", data.outbound)}
${data.inbound ? leg("Retour", data.inbound) : ""}
${row("Tarif relevé", `${price}<br/><span style="font-weight:normal;font-size:12px;color:#b45309">Relevé sur Google Flights : à revalider auprès de la compagnie avant tout paiement.</span>`)}
${data.comment ? row("Commentaire client", escapeHtml(data.comment)) : ""}
</table>
<h3 style="margin:18px 0 6px;font-size:14px">À faire</h3>
<ol style="margin:0 0 16px;padding-left:20px;line-height:1.7;font-size:13px">
<li>Contacter le client (lien WhatsApp ci-dessous) et confirmer l’identité exacte des voyageurs.</li>
<li>Poser une option de réservation auprès de la compagnie ou du GDS et noter le PNR.</li>
<li>Revalider le tarif final et la date limite d’émission.</li>
<li>Saisir le PNR et le statut dans l’administration (Réservations vols).</li>
<li>Émettre le billet <strong>uniquement après paiement validé</strong>.</li>
</ol>
<p style="margin:0 0 4px">${clientLink ? button(clientLink, "Écrire au client sur WhatsApp", "#16a34a") : ""}${button(deskLink, "Transmettre au comptoir par WhatsApp", "#0f766e")}${button(options.adminUrl, "Ouvrir la file des réservations", "#1d4ed8")}</p>
<p style="margin:12px 0 0;font-size:11px;color:#94a3b8">Message automatique du site 3M Travel &amp; Services. Le résumé ci-dessus est aussi disponible en un clic (copier) dans l’administration.</p>
</div>`;
  return { subject, html };
}
