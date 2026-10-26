import {
  DOCUMENT_STATUS_LABELS,
  NOTIFICATION_EMAIL_SIGNATURE,
  NOTIFICATION_PORTAL_PLACEHOLDER,
  EMAIL_DISCLAIMER,
  RISK_LEVEL_LABELS,
  buildClientReport,
  findForbiddenTerms,
  findSensitiveValues,
  type AdminEvaluationVersion,
} from "./evaluationValidation";

/**
 * Deuxième modèle d'e-mail : le bilan COMPLET en un seul bloc de texte brut (copiable tel quel dans un autre outil de messagerie),
 * à côté du modèle court « notification + lien sécurisé ». Le contenu vient exclusivement du rapport client (buildClientReport) :
 * commentaire interne, justifications internes et brouillon IA n'y figurent jamais. Module pur : même code côté navigateur et serveur.
 */

const NUMBERS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "⑪", "⑫"];
const RULE = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
const DOCUMENT_MARK: Record<string, string> = { recu: "✓", a_fournir: "▸", a_mettre_a_jour: "▸", a_verifier: "▸" };

export type CompleteMailResult =
  | { ok: true; subject: string; text: string; warnings: string[] }
  | { ok: false; error: string };

export function composeCompleteEvaluationMail(version: AdminEvaluationVersion, meta: { candidateName: string; validatedAt?: string }): CompleteMailResult {
  let report;
  try {
    report = buildClientReport(version, { candidateName: meta.candidateName, validatedAt: meta.validatedAt ?? new Date().toISOString() });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Le bilan n'est pas encore prêt pour un e-mail complet." };
  }

  let index = 0;
  const section = (title: string, lines: string[]): string[] => (lines.length === 0 ? [] : [RULE, `${NUMBERS[index++] ?? `${index}.`} ${title.toUpperCase()}`, "", ...lines, ""]);
  const bullet = (mark: string, items: string[]) => items.map((item) => `${mark} ${item}`);

  const result: string[] = [`Bonjour ${report.candidateName},`, "", `Votre bilan d’évaluation (${report.profileLabel}) pour ${report.priorityCountry} a été examiné et validé par notre équipe. Voici votre synthèse complète.`, ""];

  result.push(...section("Votre résultat", [
    `Score : ${report.score}/${report.scoreMax}`,
    `Statut : ${report.statusLabel}`,
    ...(report.route ? [`Voie principale recommandée : ${report.route.label}`] : []),
    ...(report.riskLevel ? [`Niveau de vigilance : ${RISK_LEVEL_LABELS[report.riskLevel]}`] : []),
  ]));
  result.push(...section("Résumé de votre profil", report.profileSummary.trim() ? [report.profileSummary.trim()] : []));
  result.push(...section("Détail du score", bullet("•", report.scoreBreakdown.map((entry) => `${entry.label} : ${entry.score}/${entry.max}`))));
  result.push(...section("Vos atouts", bullet("✓", report.strengths)));
  result.push(...section("Points à renforcer", bullet("▸", report.improvements)));
  result.push(...section("Plan d’action", report.actionPlan.map((step, i) => `${i + 1}. ${step.title}${step.horizon ? ` (${step.horizon})` : ""}${step.detail ? ` — ${step.detail}` : ""}`)));
  result.push(...section("Documents", report.documents.map((document) => `${DOCUMENT_MARK[document.status] ?? "▸"} ${document.label} — ${DOCUMENT_STATUS_LABELS[document.status]}`)));
  result.push(...section("Autres pays à envisager", report.alternatives.map((alternative) => `• ${alternative.country} — ${alternative.rationale}`)));
  const fees = (version.feesNote ?? "").trim();
  result.push(...section("Frais et prestations incluses", fees ? [fees] : []));
  const remarks = [report.remarks.trim(), report.validUntil ? `Cette évaluation est valable jusqu’au ${report.validUntil}.` : ""].filter(Boolean);
  result.push(...section("Observations", remarks));

  result.push(RULE, "Retrouvez ce bilan, vos documents et les prochaines étapes dans votre espace sécurisé :", NOTIFICATION_PORTAL_PLACEHOLDER, "", EMAIL_DISCLAIMER, "", NOTIFICATION_EMAIL_SIGNATURE);

  const text = result.join("\n").replace(/\n{3,}/g, "\n\n");
  const subject = `Votre bilan d’évaluation complet — ${report.priorityCountry} — 3M TRAVEL AGENCY`;

  const warnings: string[] = [];
  const forbidden = findForbiddenTerms(`${subject}\n${text}`);
  if (forbidden.length > 0) warnings.push(`Formulation à revoir (promesse de résultat) : ${forbidden.join(", ")}.`);
  const sensitive = findSensitiveValues(`${subject}\n${text}`);
  if (sensitive.length > 0) warnings.push(`Donnée sensible à retirer : ${sensitive.join(", ")}.`);
  return { ok: true, subject, text, warnings };
}

/** Texte prêt à coller ailleurs : le lien sécurisé réel remplace le repère, ou un libellé neutre s'il n'est pas encore connu. */
export function completeMailForClipboard(text: string, portalUrl?: string | null): string {
  return text.split(NOTIFICATION_PORTAL_PLACEHOLDER).join(portalUrl && portalUrl.trim() ? portalUrl.trim() : "[lien sécurisé vers votre espace]");
}
