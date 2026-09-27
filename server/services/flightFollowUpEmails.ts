import { payLink } from "./flightWorkflow";
import { CHANGE_KIND_LABELS, type ChangeKind } from "../../shared/flightFollowUps";

const escapeHtml = (value: string): string => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const oneLine = (value: string, max = 200): string => value.replace(/[\r\n\t]+/g, " ").trim().slice(0, max);
const frame = (title: string, color: string, inner: string): string => `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:22px;color:#172554"><h2 style="margin:0 0 10px;color:${color}">${escapeHtml(title)}</h2>${inner}<p style="margin-top:18px">Cordialement,<br/><strong>3M Travel &amp; Services</strong></p></div>`;
const button = (href: string, label: string, color = "#1d4ed8"): string => `<a href="${escapeHtml(href)}" style="display:inline-block;background:${color};color:#ffffff;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:bold">${escapeHtml(label)}</a>`;
const stopLine = (stopUrl: string): string => `<p style="margin-top:16px;font-size:12px;color:#64748b">Vous ne souhaitez plus recevoir ces rappels ? <a href="${escapeHtml(stopUrl)}" style="color:#64748b">Les arrêter</a>.</p>`;

/** Relance d'un devis non payé (étape 1 ou 2). Aucun tarif n'y est répété : il est déjà dans la demande et à revalider par le conseiller. */
export function buildQuoteReminderEmail(input: { requestRef: string; route: string; stage: number; siteUrl: string; whatsappDisplay: string; stopUrl: string }): { subject: string; html: string } {
  const ref = oneLine(input.requestRef, 60);
  const intro = input.stage >= 2
    ? `<p>Votre réservation <strong>${escapeHtml(ref)}</strong> (${escapeHtml(oneLine(input.route))}) attend toujours son règlement. <strong>Les tarifs de vol évoluent</strong> : plus l’attente se prolonge, plus le conseiller devra revérifier le tarif avant l’émission.</p>`
    : `<p>Nous avons revalidé votre réservation <strong>${escapeHtml(ref)}</strong> (${escapeHtml(oneLine(input.route))}) : il ne reste que le règlement. Le billet n’est émis qu’après confirmation de réception du paiement.</p>`;
  const html = frame("Votre réservation attend son règlement", "#b45309", `<p>Bonjour,</p>${intro}<p style="margin:16px 0">${button(payLink(input.siteUrl, ref), "Comment payer")}</p><p style="font-size:14px">Une question, ou un changement de projet ? Répondez à ce message ou écrivez-nous sur WhatsApp au ${escapeHtml(input.whatsappDisplay)}.</p>${stopLine(input.stopUrl)}`);
  return { subject: `[3M Travel] Rappel — règlement de votre réservation ${ref}`, html };
}

/** Rappel avant le départ : ce que l'agence sait avec certitude (trajet, PNR), et des vérifications à faire. Aucun horaire d'enregistrement n'est inventé. */
export function buildPreDepartureEmail(input: { requestRef: string; route: string; departureDate: string; pnrReference: string | null; siteUrl: string; stopUrl: string }): { subject: string; html: string } {
  const ref = oneLine(input.requestRef, 60);
  const site = input.siteUrl.replace(/\/+$/, "");
  const html = frame("Votre départ approche", "#047857", `<p>Bonjour,</p><p>Votre voyage <strong>${escapeHtml(oneLine(input.route))}</strong> est prévu le <strong>${escapeHtml(oneLine(input.departureDate, 20))}</strong>${input.pnrReference ? ` (référence de réservation <strong>${escapeHtml(oneLine(input.pnrReference, 40))}</strong>)` : ""}.</p><ul style="padding-left:18px;font-size:14px;line-height:1.6"><li>Retrouvez votre billet dans votre espace client (réservation ${escapeHtml(ref)}).</li><li>Vérifiez que votre <strong>passeport</strong> est valide et à portée de main, et que le nom sur le billet est identique à celui du passeport.</li><li>Renseignez-vous sur les <strong>conditions d’entrée</strong> (visa, formalités sanitaires) de votre destination et de vos escales.</li><li>Consultez le site de la compagnie pour les <strong>conditions d’enregistrement et de bagages</strong> de votre billet.</li></ul><p style="margin:16px 0">${button(`${site}/mon-espace`, "Ouvrir mon espace client", "#047857")}</p>${stopLine(input.stopUrl)}`);
  return { subject: `[3M Travel] Votre départ approche — ${ref}`, html };
}

/** Alerte du comptoir : le client demande une modification ou une annulation. */
export function buildChangeRequestDeskAlert(input: { requestRef: string; clientEmail: string; kind: ChangeKind; message: string; adminUrl: string }): { subject: string; html: string } {
  const ref = oneLine(input.requestRef, 60);
  const html = frame("Demande de modification d’une réservation", "#b45309", `<p style="font-size:13px">Le client demande : <strong>${escapeHtml(CHANGE_KIND_LABELS[input.kind])}</strong>. Rien n’est modifié automatiquement : appliquez les conditions de la compagnie, puis marquez la demande comme traitée.</p><table style="width:100%;border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;margin:0 0 14px"><tr><td style="padding:6px 10px;color:#64748b;font-size:12px">Réservation</td><td style="padding:6px 10px;font-weight:bold">${escapeHtml(ref)}</td></tr><tr><td style="padding:6px 10px;color:#64748b;font-size:12px">Client</td><td style="padding:6px 10px;font-weight:bold">${escapeHtml(oneLine(input.clientEmail))}</td></tr><tr><td style="padding:6px 10px;color:#64748b;font-size:12px;vertical-align:top">Message</td><td style="padding:6px 10px">${escapeHtml(input.message).replace(/\n/g, "<br/>")}</td></tr></table>${button(input.adminUrl, "Ouvrir l’administration")}`);
  return { subject: `[3M Travel] Demande de modification — ${ref}`, html };
}

/** Accusé de réception au client : sa demande est prise en compte, sans promettre de remboursement ni de frais. */
export function buildChangeRequestAckEmail(input: { requestRef: string; kind: ChangeKind; whatsappDisplay: string }): { subject: string; html: string } {
  const ref = oneLine(input.requestRef, 60);
  const html = frame("Nous avons bien reçu votre demande", "#1d4ed8", `<p>Bonjour,</p><p>Votre demande « <strong>${escapeHtml(CHANGE_KIND_LABELS[input.kind])}</strong> » pour la réservation <strong>${escapeHtml(ref)}</strong> a été transmise à un conseiller. Les possibilités et les éventuels frais dépendent des conditions de votre billet et de la compagnie : le conseiller vous répond avec ces informations avant toute modification.</p><p style="font-size:14px">Urgent ? WhatsApp : ${escapeHtml(input.whatsappDisplay)}.</p>`);
  return { subject: `[3M Travel] Demande reçue — ${ref}`, html };
}

/** Réponse du comptoir quand la demande de modification est traitée. */
export function buildChangeHandledEmail(input: { requestRef: string; kind: ChangeKind; note: string }): { subject: string; html: string } {
  const ref = oneLine(input.requestRef, 60);
  const html = frame("Votre demande a été traitée", "#047857", `<p>Bonjour,</p><p>Votre demande « <strong>${escapeHtml(CHANGE_KIND_LABELS[input.kind])}</strong> » pour la réservation <strong>${escapeHtml(ref)}</strong> a été traitée par notre équipe.</p>${input.note.trim() ? `<p style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px"><strong>Réponse de l’agence :</strong><br/>${escapeHtml(input.note).replace(/\n/g, "<br/>")}</p>` : ""}`);
  return { subject: `[3M Travel] Demande traitée — ${ref}`, html };
}

/** Relance d'une demande « informations requises » : le message du conseiller est dans l'e-mail précédent, jamais recopié ici (notes internes). */
export function buildNeedsInfoReminderEmail(input: { requestRef: string; route: string; stage: number; siteUrl: string; whatsappDisplay: string; stopUrl: string }): { subject: string; html: string } {
  const ref = oneLine(input.requestRef, 60);
  const site = input.siteUrl.replace(/\/+$/, "");
  const intro = input.stage >= 2
    ? `<p>Sans les informations demandées, nous ne pouvons pas avancer sur votre réservation <strong>${escapeHtml(ref)}</strong> (${escapeHtml(oneLine(input.route))}). Les tarifs évoluent : plus l’attente se prolonge, plus le conseiller devra revérifier le tarif.</p>`
    : `<p>Le conseiller attend une information de votre part pour poursuivre votre réservation <strong>${escapeHtml(ref)}</strong> (${escapeHtml(oneLine(input.route))}). Sa demande figure dans le message que nous vous avons envoyé lors du changement de statut.</p>`;
  const html = frame("Une information manque pour votre réservation", "#b45309", `<p>Bonjour,</p>${intro}<p style="margin:16px 0">${button(`${site}/mon-espace`, "Ouvrir mon espace client")}</p><p style="font-size:14px">Vous pouvez aussi répondre à cet e-mail ou nous écrire sur WhatsApp au ${escapeHtml(input.whatsappDisplay)}.</p>${stopLine(input.stopUrl)}`);
  return { subject: `[3M Travel] Il nous manque une information — ${ref}`, html };
}

/** Alerte groupée du comptoir : options de réservation qui expirent dans les 24 h. */
export function buildOptionAlertEmail(input: { items: Array<{ requestRef: string; route: string; deadline: string }>; adminUrl: string }): { subject: string; html: string } {
  const rows = input.items.map((item) => `<tr><td style="padding:6px 10px;font-family:monospace;font-weight:bold">${escapeHtml(oneLine(item.requestRef, 60))}</td><td style="padding:6px 10px">${escapeHtml(oneLine(item.route))}</td><td style="padding:6px 10px;font-weight:bold;color:#b91c1c">${escapeHtml(oneLine(item.deadline, 40))}</td></tr>`).join("");
  const html = frame("Options de réservation qui expirent", "#b45309", `<p style="font-size:13px">Ces options, posées auprès de la compagnie, expirent dans moins de 24 h : faites payer, émettez ou prolongez-les, sinon le tarif et les places peuvent être perdus. Échéances en heure universelle (UTC).</p><table style="width:100%;border-collapse:collapse;background:#f8fafc;border:1px solid #e2e8f0;margin:0 0 14px"><tr style="color:#64748b;font-size:12px;text-align:left"><th style="padding:6px 10px">Réservation</th><th style="padding:6px 10px">Trajet</th><th style="padding:6px 10px">Expire</th></tr>${rows}</table>${button(input.adminUrl, "Ouvrir l’administration")}`);
  return { subject: `[3M Travel] ${input.items.length} option${input.items.length > 1 ? "s" : ""} de réservation expire${input.items.length > 1 ? "nt" : ""} bientôt`, html };
}
