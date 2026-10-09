/**
 * E-mail du protocole N°01 une fois signé dans l’espace client :
 * en-tête agence, pied de page légal, rappel dossier, pièce jointe PDF signée.
 */

const escapeHtml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const oneLine = (value: string, max = 200): string =>
  value.replace(/[\r\n\t]+/g, " ").trim().slice(0, max);

export function buildSignedAgreementEmail(input: {
  fullName: string;
  dossierNumber: string;
  signatureName: string;
  signedAt: Date;
  siteUrl: string;
  protocolFileName: string;
  signatureImageUrl?: string | null;
}): { subject: string; html: string } {
  const site = input.siteUrl.replace(/\/+$/, "");
  const logoUrl = `${site}/favicon.png`;
  const dossier = oneLine(input.dossierNumber, 60);
  const signedLabel = input.signedAt.toLocaleString("fr-FR", {
    timeZone: "Africa/Douala",
    dateStyle: "long",
    timeStyle: "short",
  });
  const generatedOn = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Douala",
  });
  const signatureBlock = input.signatureImageUrl
    ? `<div style="margin:18px 0;padding:16px;border:1px solid #bfdbfe;border-radius:12px;background:#f8fbff;text-align:center">
        <p style="margin:0 0 8px;font-size:12px;font-weight:bold;color:#1e3a8a;text-transform:uppercase;letter-spacing:0.6px">Signature électronique du candidat</p>
        <img src="${escapeHtml(input.signatureImageUrl)}" alt="Signature de ${escapeHtml(oneLine(input.signatureName, 80))}" style="max-width:280px;max-height:90px;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:8px" />
        <p style="margin:10px 0 0;font-size:13px;color:#0f172a"><strong>${escapeHtml(oneLine(input.signatureName, 120))}</strong></p>
        <p style="margin:4px 0 0;font-size:12px;color:#64748b">Signé le ${escapeHtml(signedLabel)}</p>
      </div>`
    : `<div style="margin:18px 0;padding:16px;border:1px solid #bfdbfe;border-radius:12px;background:#f8fbff">
        <p style="margin:0;font-size:13px;color:#0f172a">Signataire : <strong>${escapeHtml(oneLine(input.signatureName, 120))}</strong></p>
        <p style="margin:6px 0 0;font-size:12px;color:#64748b">Signé le ${escapeHtml(signedLabel)}</p>
      </div>`;

  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Protocole signé — ${escapeHtml(dossier)}</title></head>
<body style="margin:0;padding:0;background:#eef2f7;">
<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#eef2f7;padding:24px;">
  <div style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(15,36,96,0.12);">
    <div style="background:linear-gradient(135deg,#0f2460 0%,#1E3A8A 55%,#2563EB 100%);padding:36px 30px 28px;text-align:center;">
      <img src="${escapeHtml(logoUrl)}" alt="3M TRAVEL AGENCY" width="72" height="72" style="width:72px;height:72px;border-radius:50%;background:#ffffff;padding:6px;box-shadow:0 4px 14px rgba(0,0,0,0.25);" />
      <p style="display:inline-block;margin:18px 0 0;background:rgba(255,255,255,0.15);color:#dbeafe;font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;padding:6px 14px;border-radius:999px;">Protocole d’accord N°01 — signé</p>
      <h1 style="color:#ffffff;font-size:24px;margin:14px 0 0;">3M TRAVEL AGENCY</h1>
      <div style="width:60px;height:3px;background:#c9972b;margin:14px auto 0;border-radius:2px;"></div>
    </div>
    <div style="padding:32px 30px;">
      <p style="margin:0 0 14px;font-size:15px;color:#0f172a;line-height:1.6;">Bonjour <strong>${escapeHtml(oneLine(input.fullName, 120))}</strong>,</p>
      <p style="margin:0 0 14px;font-size:14px;color:#334155;line-height:1.7;">Votre protocole d’accord N°01 pour le dossier <strong>${escapeHtml(dossier)}</strong> a bien été signé dans votre espace client. L’exemplaire PDF ci-joint reprend le texte du protocole, votre signature manuscrite électronique, l’en-tête et le pied de page de l’agence.</p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:18px 20px;margin-bottom:8px;">
        <p style="margin:0;font-size:11px;font-weight:bold;color:#2563EB;text-transform:uppercase;letter-spacing:0.5px;">Dossier</p>
        <p style="margin:2px 0 10px;font-size:16px;font-weight:bold;color:#0f2460;">${escapeHtml(dossier)}</p>
        <p style="margin:0;font-size:11px;font-weight:bold;color:#2563EB;text-transform:uppercase;letter-spacing:0.5px;">Pièce jointe</p>
        <p style="margin:2px 0 0;font-size:14px;font-weight:bold;color:#0f2460;">${escapeHtml(oneLine(input.protocolFileName, 120))}</p>
      </div>
      ${signatureBlock}
      <div style="text-align:center;margin-top:24px;">
        <a href="${escapeHtml(site)}/mon-espace" style="background:linear-gradient(135deg,#0f2460,#2563EB);color:#ffffff;text-decoration:none;padding:14px 34px;border-radius:10px;font-weight:bold;font-size:15px;display:inline-block;box-shadow:0 6px 16px rgba(37,99,235,0.35);">Ouvrir mon espace client</a>
      </div>
      <p style="font-size:12px;color:#64748b;margin-top:22px;line-height:1.6;">Conservez ce document. Vous pouvez aussi le télécharger depuis votre espace client (Documents). Une question ? Répondez à ce message ou WhatsApp +237 698 104 832.</p>
    </div>
    <div style="border-top:2px solid #f1f5f9;padding:20px 30px;text-align:center;background:#fafbfc;">
      <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">Ce document est une preuve officielle de votre engagement. Conservez-le précieusement.</p>
      <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;">3M TRAVEL AGENCY — RC/YAO/2019/A/2567 | NIU : M112417203369H</p>
      <p style="margin:0 0 4px;font-size:11px;color:#94a3b8;">Yaoundé, Cameroun • hello@3mtravelagency.com</p>
      <p style="margin:0;font-size:11px;color:#c7cdd6;">Document généré le ${escapeHtml(generatedOn)}</p>
    </div>
  </div>
</div>
</body></html>`;

  return {
    subject: oneLine(`Protocole d’accord N°01 signé — Dossier ${dossier}`),
    html,
  };
}
