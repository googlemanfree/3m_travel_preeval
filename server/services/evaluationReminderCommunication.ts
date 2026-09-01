import { buildCandidateSpaceAccessUrl } from "./candidateAccessLink";
import { escapeHtmlText } from "./evaluationEmailCommunication";

export type EvaluationReminderLanguage = "fr" | "en";

export function buildEvaluationReminderEmailSubject(dossierNumber: string, language: EvaluationReminderLanguage): string {
  return language === "en"
    ? `Reminder: your evaluation report is available — File ${dossierNumber}`
    : `Rappel : votre bilan d’évaluation est disponible — Dossier ${dossierNumber}`;
}

export function buildEvaluationReminderEmailHtml(fullName: string, dossierNumber: string, language: EvaluationReminderLanguage = "fr", customMessage?: string): string {
  const candidateSpaceUrl = buildCandidateSpaceAccessUrl(dossierNumber);
  const safeName = escapeHtmlText(fullName);
  const safeCustomMessage = customMessage?.trim() ? customMessage.trim().split(/\n{2,}/).map((paragraph) => `<p>${escapeHtmlText(paragraph).replace(/\n/g, "<br />")}</p>`).join("") : "";
  if (language === "en") {
    return `<p>Hello ${safeName},</p>${safeCustomMessage}<p>Your evaluation report is available in your secure client area. We invite you to review it so that you can prepare the next steps for your file.</p><p><a href="${candidateSpaceUrl}">Open my secure client area</a></p><p>3M Travel &amp; Services remains available should you need clarification.</p>`;
  }
  return `<p>Bonjour ${safeName},</p>${safeCustomMessage}<p>Votre bilan d’évaluation reste disponible dans votre espace client sécurisé. Nous vous invitons à le consulter afin de préparer les prochaines étapes de votre dossier.</p><p><a href="${candidateSpaceUrl}">Ouvrir mon espace client sécurisé</a></p><p>3M Travel &amp; Services reste disponible si vous avez besoin d’une précision.</p>`;
}
