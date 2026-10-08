const escapeHtml = (value: string): string => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const frame = (title: string, color: string, inner: string): string => `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:22px;color:#172554"><h2 style="margin:0 0 10px;color:${color}">${escapeHtml(title)}</h2>${inner}<p style="margin-top:18px">Cordialement,<br/><strong>3M TRAVEL AGENCY</strong></p></div>`;

/** Accusé de réception envoyé au candidat qui demande la suppression de son compte : aucun délai n'est promis, aucune suppression n'est encore faite. */
export function buildDeletionRequestAckEmail(input: { fullName: string; whatsappDisplay: string }): { subject: string; html: string } {
  const name = input.fullName.trim() || "Bonjour";
  const html = frame("Votre demande de suppression a été reçue", "#1d4ed8", `<p>${escapeHtml(name)},</p><p>Votre demande de suppression de compte a bien été transmise à notre équipe. Un conseiller vérifie d'abord qu'aucun dossier en cours ou obligation légale (comptabilité, procédure administrative) n'empêche cette suppression, puis vous recontacte pour confirmer ce qu'il en est.</p><p style="font-size:14px">Une question en attendant ? WhatsApp : ${escapeHtml(input.whatsappDisplay)}.</p>`);
  return { subject: "[3M TRAVEL AGENCY] Demande de suppression de compte reçue", html };
}

/** Réponse envoyée quand l'administrateur a traité la demande (suppression faite, ou motif du report/refus expliqué). */
export function buildDeletionRequestHandledEmail(input: { fullName: string; note: string }): { subject: string; html: string } {
  const name = input.fullName.trim() || "Bonjour";
  const html = frame("Votre demande de suppression a été traitée", "#047857", `<p>${escapeHtml(name)},</p><p>Votre demande de suppression de compte a été traitée par notre équipe.</p>${input.note.trim() ? `<p style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px"><strong>Réponse de l'agence :</strong><br/>${escapeHtml(input.note).replace(/\n/g, "<br/>")}</p>` : ""}`);
  return { subject: "[3M TRAVEL AGENCY] Demande de suppression traitée", html };
}
