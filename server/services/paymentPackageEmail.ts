const escapeHtml = (value: string): string => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const oneLine = (value: string, max = 200): string => value.replace(/[\r\n\t]+/g, " ").trim().slice(0, max);

/**
 * Un seul e-mail après la confirmation du paiement : le reçu et le Protocole d'accord N°01 arrivent ensemble, en pièces jointes.
 * Le protocole ne vaut engagement qu'une fois signé par le candidat dans son espace client : le message le dit.
 */
export function buildPaymentPackageEmail(input: { fullName: string; dossierNumber: string; amountLabel: string; siteUrl: string; receiptFileName: string; protocolFileName: string }): { subject: string; html: string } {
  const dossier = oneLine(input.dossierNumber, 60);
  const site = input.siteUrl.replace(/\/+$/, "");
  const html = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:22px;color:#172554">
<div style="background:#1e3a8a;padding:24px;text-align:center;border-radius:14px 14px 0 0"><h1 style="color:#ffffff;font-size:20px;margin:0">3M Travel &amp; Services</h1><p style="color:#bfdbfe;font-size:13px;margin:6px 0 0">Paiement confirmé — reçu et Protocole d’accord N°01</p></div>
<div style="border:1px solid #e2e8f0;border-top:0;padding:24px;border-radius:0 0 14px 14px">
<p>Bonjour${input.fullName ? ` <strong>${escapeHtml(oneLine(input.fullName, 120))}</strong>` : ""},</p>
<p>Nous confirmons la réception de votre paiement de <strong>${escapeHtml(input.amountLabel)}</strong> pour le dossier <strong>${escapeHtml(dossier)}</strong>. Vous recevez ci-joint, <strong>en même temps</strong> :</p>
<ul style="line-height:1.8;margin:10px 0 16px;padding-left:20px">
<li><strong>Votre reçu de paiement</strong> — ${escapeHtml(input.receiptFileName)}</li>
<li><strong>Le Protocole d’accord N°01</strong> — ${escapeHtml(input.protocolFileName)}</li>
</ul>
<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px;margin:0 0 16px;font-size:14px"><strong>À faire maintenant :</strong> lisez le protocole, puis signez-le dans votre espace client. Le traitement de votre dossier commence après cette signature.</div>
<p style="text-align:center;margin:20px 0"><a href="${escapeHtml(site)}/mon-espace?section=signatures" style="display:inline-block;background:#1d4ed8;color:#ffffff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:bold">Lire et signer le protocole</a></p>
<p style="font-size:12px;color:#64748b">Conservez ces deux documents. Une question ? Répondez à ce message ou écrivez-nous sur WhatsApp au +237 6 98 10 48 32.</p>
</div>
<p style="text-align:center;font-size:11px;color:#94a3b8;margin:12px 0 0">3M Travel &amp; Services — RC/YAO/2019/A/2567 · NIU : M112417203369H · Yaoundé, Cameroun</p>
</div>`;
  return { subject: oneLine(`Reçu de paiement et Protocole d’accord N°01 — Dossier ${dossier}`), html };
}
