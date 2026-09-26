import type { DossierProgress } from "../../shared/dossierProgress";

const escapeHtml = (value: string): string => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const oneLine = (value: string, max = 200): string => value.replace(/[\r\n\t]+/g, " ").trim().slice(0, max);

/**
 * E-mail de mise à jour de dossier : le client y lit exactement ce qu'affiche son espace client (statut, « étape N sur M »,
 * étape suivante). Un rappel dit que le calendrier des étapes est indicatif et qu'aucune décision n'est garantie.
 */
export function buildProcedureUpdateEmail(input: { fullName: string; folderCode: string; progress: DossierProgress; siteUrl: string; note?: string | null }): { subject: string; html: string } {
  const { progress } = input;
  const folder = oneLine(input.folderCode, 60);
  const bar = progress.stepNumber === null ? "" : `<div style="height:8px;background:#dbeafe;border-radius:6px;margin:12px 0 4px" aria-hidden="true"><div style="height:8px;width:${progress.percent}%;background:#2563eb;border-radius:6px"></div></div>`;
  const stepBlock = progress.stepNumber === null
    ? ""
    : `<p style="margin:10px 0 0;font-size:14px;color:#1e3a8a"><strong>Étape ${progress.stepNumber} sur ${progress.stepCount} :</strong> ${escapeHtml(progress.stepLabel ?? "")}</p>${bar}${progress.stepDescription ? `<p style="margin:6px 0 0;font-size:13px;color:#475569">${escapeHtml(progress.stepDescription)}</p>` : ""}${progress.nextStepLabel ? `<p style="margin:10px 0 0;font-size:13px;color:#475569"><strong>Étape suivante :</strong> ${escapeHtml(progress.nextStepLabel)}</p>` : ""}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
<div style="background:#1e3a8a;padding:26px 24px;text-align:center"><h1 style="color:#ffffff;font-size:20px;margin:0">3M Travel &amp; Services</h1><p style="color:#bfdbfe;font-size:13px;margin:6px 0 0">Mise à jour de votre dossier</p></div>
<div style="padding:28px 26px;color:#374151">
<p>Bonjour${input.fullName ? ` <strong>${escapeHtml(oneLine(input.fullName, 120))}</strong>` : ""},</p>
<p>Votre dossier <strong>${escapeHtml(folder)}</strong> a évolué.</p>
<div style="background:#eff6ff;border-left:4px solid #2563eb;padding:16px 20px;border-radius:8px;margin:18px 0"><p style="margin:0;font-size:18px;font-weight:700;color:#1e3a8a">${escapeHtml(progress.statusLabel)}</p>${stepBlock}</div>
${input.note ? `<p style="margin:0 0 14px"><strong>Message de l’agence :</strong><br/>${escapeHtml(input.note).replace(/\n/g, "<br/>")}</p>` : ""}
<p style="margin:0 0 18px">Retrouvez le détail de chaque étape, les pièces demandées et vos échanges dans votre espace client.</p>
<a href="${escapeHtml(input.siteUrl.replace(/\/+$/, ""))}/mon-espace" style="display:inline-block;background:#1e3a8a;color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700">Ouvrir mon espace client</a>
<p style="margin:22px 0 0;font-size:12px;color:#64748b">Les étapes décrivent la procédure à suivre ; elles sont indicatives. La décision finale appartient toujours aux autorités, employeurs ou établissements concernés.</p>
</div>
<div style="background:#f8faff;padding:18px 26px;text-align:center;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb"><p style="margin:0">3M Travel &amp; Services — Yaoundé, Cameroun — hello@3mtravelagency.com</p></div>
</div>`;
  return { subject: oneLine(`Mise à jour de votre dossier ${folder} — ${progress.statusLabel}`), html };
}
