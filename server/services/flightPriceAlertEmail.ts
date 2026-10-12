/**
 * E-mails des alertes de baisse de tarif : confirmation (double consentement) et alerte de baisse. Aucun montant inventé :
 * le tarif cité est celui relevé chez le fournisseur, présenté comme indicatif et à confirmer par un conseiller.
 */

const escapeHtml = (value: string): string => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const oneLine = (value: string, max: number): string => value.replace(/[\r\n\t]+/g, " ").trim().slice(0, max);
const formatXaf = (amount: number) => `${new Intl.NumberFormat("fr-FR").format(Math.round(amount))} FCFA`;

export type AlertEmailInput = {
  name: string;
  origin: string;
  destination: string;
  tripType: "ONE_WAY" | "ROUND_TRIP";
  departureDate: string;
  returnDate: string;
};

const routeLine = (input: AlertEmailInput) =>
  `${oneLine(input.origin, 3)} → ${oneLine(input.destination, 3)} · départ ${oneLine(input.departureDate, 10)}${input.tripType === "ROUND_TRIP" && input.returnDate ? ` · retour ${oneLine(input.returnDate, 10)}` : " (aller simple)"}`;

const frame = (body: string, footer: string) =>
  `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#172554">${body}<p style="margin:24px 0 0;font-size:12px;color:#94a3b8">3M TRAVEL AGENCY · Yaoundé · hello@3mtravelagency.com. ${footer}</p></div>`;

const button = (href: string, label: string, color: string) =>
  `<p style="margin:0 0 20px"><a href="${escapeHtml(href)}" style="display:inline-block;background:${color};color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">${escapeHtml(label)}</a></p>`;

/** Double consentement : l'alerte ne démarre qu'après ce clic, pour ne jamais écrire à une adresse saisie par un tiers. */
export function buildAlertConfirmationEmail(input: AlertEmailInput & { confirmUrl: string; stopUrl: string; targetPriceXaf: number | null }): { subject: string; html: string } {
  const greeting = input.name ? `Bonjour ${escapeHtml(oneLine(input.name, 120))}` : "Bonjour";
  const target = input.targetPriceXaf ? ` sous ${escapeHtml(formatXaf(input.targetPriceXaf))}` : "";
  const html = frame(
    `<h2 style="margin:0 0 12px;color:#1d4ed8">Confirmez votre alerte de tarif</h2>
<p style="margin:0 0 12px">${greeting},</p>
<p style="margin:0 0 12px">Vous avez demandé à être prévenu si le tarif de ce vol baisse${target} :</p>
<p style="margin:0 0 16px;padding:12px;background:#eff6ff;border-radius:10px;font-weight:bold;color:#1e3a8a">${escapeHtml(routeLine(input))}</p>
<p style="margin:0 0 16px">Pour activer l'alerte, confirmez votre adresse :</p>
${button(input.confirmUrl, "Activer mon alerte", "#16a34a")}
<p style="margin:0 0 8px;font-size:13px;color:#475569">Nous relevons le tarif une fois par jour et nous vous écrivons uniquement si un tarif plus bas est réellement relevé (3 e-mails au plus, alerte valable 60 jours). Les tarifs sont indicatifs et confirmés par un conseiller avant toute réservation.</p>
<p style="margin:0;font-size:13px;color:#475569">Vous n'êtes pas à l'origine de cette demande ? Ne cliquez pas : sans confirmation, rien n'est activé. <a href="${escapeHtml(input.stopUrl)}" style="color:#475569">Supprimer cette alerte</a>.</p>`,
    "Vous recevez ce message parce qu'une alerte de tarif a été demandée avec cette adresse.",
  );
  return { subject: "Confirmez votre alerte de tarif — 3M TRAVEL AGENCY", html };
}

export function buildPriceDropEmail(input: AlertEmailInput & { priceXaf: number; previousXaf: number; searchUrl: string; stopUrl: string; retrievedAt: Date }): { subject: string; html: string } {
  const greeting = input.name ? `Bonjour ${escapeHtml(oneLine(input.name, 120))}` : "Bonjour";
  const day = input.retrievedAt.toISOString().slice(0, 10);
  const html = frame(
    `<h2 style="margin:0 0 12px;color:#1d4ed8">Le tarif de votre vol a baissé</h2>
<p style="margin:0 0 12px">${greeting},</p>
<p style="margin:0 0 12px;padding:12px;background:#eff6ff;border-radius:10px;font-weight:bold;color:#1e3a8a">${escapeHtml(routeLine(input))}</p>
<p style="margin:0 0 4px"><strong>Tarif relevé le ${escapeHtml(day)} :</strong> ${escapeHtml(formatXaf(input.priceXaf))}</p>
<p style="margin:0 0 16px;color:#475569"><strong>Tarif précédent :</strong> ${escapeHtml(formatXaf(input.previousXaf))}</p>
${button(input.searchUrl, "Voir ce vol", "#1d4ed8")}
<p style="margin:0 0 8px;font-size:13px;color:#475569">Tarif indicatif relevé sur Google Flights pour 1 adulte en classe économique ; il peut changer à tout moment. Bagages, conditions, taxes et disponibilité sont confirmés par un conseiller 3M avant toute réservation.</p>
<p style="margin:0;font-size:13px;color:#475569"><a href="${escapeHtml(input.stopUrl)}" style="color:#475569">Arrêter cette alerte</a></p>`,
    "Vous recevez ce message car vous avez activé une alerte de tarif.",
  );
  return { subject: `Le tarif ${oneLine(input.origin, 3)} → ${oneLine(input.destination, 3)} a baissé — 3M TRAVEL AGENCY`, html };
}

export function searchUrlFor(siteUrl: string, input: AlertEmailInput): string {
  const params = new URLSearchParams({ origin: input.origin, destination: input.destination, date: input.departureDate, tripType: input.tripType });
  if (input.tripType === "ROUND_TRIP" && input.returnDate) params.set("returnDate", input.returnDate);
  return `${siteUrl.replace(/\/+$/, "")}/flights?${params.toString()}`;
}
