/**
 * E-mail de confirmation de réception d'une demande de réservation de vol. Il donne au client sa référence (qu'il
 * perdrait en fermant la fenêtre) et rappelle ce qui va se passer : vérification de la disponibilité et du tarif par
 * un conseiller, aucun paiement à ce stade. Aucune promesse de billet ni de prix.
 */

const escapeHtml = (value: string): string => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type BookingConfirmationInput = {
  requestRef: string;
  fullName: string;
  origin: string;
  destination: string;
  airline: string;
  departure: string;
  whatsappNumber?: string;
};

const oneLine = (value: string, max: number): string => value.replace(/[\r\n\t]+/g, " ").trim().slice(0, max);

export function buildBookingConfirmationEmail(input: BookingConfirmationInput): { subject: string; html: string } {
  const requestRef = oneLine(input.requestRef, 40);
  const fullName = oneLine(input.fullName, 120);
  const greeting = fullName ? `Bonjour ${fullName}` : "Bonjour";
  const route = `${oneLine(input.origin, 80)} → ${oneLine(input.destination, 80)}`;
  const airline = oneLine(input.airline, 80);
  const departure = oneLine(input.departure, 40);
  const whatsapp = (input.whatsappNumber ?? "237698104832").replace(/\D/g, "");
  const whatsappHref = `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Bonjour, je souhaite suivre ma demande de réservation ${requestRef}.`)}`;

  const subject = `Votre demande de réservation ${requestRef} — 3M Travel & Services`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#172554">
<h2 style="margin:0 0 12px;color:#1d4ed8">Nous avons bien reçu votre demande</h2>
<p style="margin:0 0 16px">${escapeHtml(greeting)},</p>
<p style="margin:0 0 16px">Votre demande de réservation de vol a été transmise à 3M Travel &amp; Services. Conservez votre référence :</p>
<p style="margin:0 0 16px;padding:14px;background:#eff6ff;border:2px dashed #2563eb;border-radius:10px;font-size:18px;font-weight:bold;text-align:center;color:#1e3a8a">${escapeHtml(requestRef)}</p>
<p style="margin:0 0 4px"><strong>Trajet :</strong> ${escapeHtml(route)}</p>
<p style="margin:0 0 4px"><strong>Compagnie :</strong> ${escapeHtml(airline)}</p>
<p style="margin:0 0 16px"><strong>Départ :</strong> ${escapeHtml(departure)}</p>
<p style="margin:0 0 8px"><strong>Et maintenant ?</strong></p>
<ol style="margin:0 0 16px;padding-left:20px;line-height:1.6">
<li>Un conseiller vérifie la disponibilité et le tarif auprès de la compagnie.</li>
<li>Il vous contacte pour confirmer le prix définitif et les conditions.</li>
<li>Aucun paiement n’est demandé avant cette confirmation.</li>
</ol>
<p style="margin:0 0 16px;font-size:13px;color:#475569">Le tarif affiché sur le site est indicatif : il peut évoluer jusqu’à la confirmation. Cette demande n’est pas un billet.</p>
<p style="margin:0 0 20px"><a href="${whatsappHref}" style="display:inline-block;background:#16a34a;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Suivre ma demande sur WhatsApp</a></p>
<p style="margin:0;font-size:12px;color:#94a3b8">3M Travel &amp; Services · Yaoundé · hello@3mtravelagency.com. Vous recevez ce message parce qu’une demande a été envoyée avec cette adresse ; si ce n’est pas vous, ignorez-le.</p>
</div>`;
  return { subject, html };
}
