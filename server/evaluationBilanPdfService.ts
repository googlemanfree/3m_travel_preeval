import { evaluationDisplayReference } from "../shared/evaluationReference";
import { jsPDF } from "jspdf";
import type { Application } from "../drizzle/schema";
import { PROFILE_DEFS, resolveEvaluationProfile } from "../shared/evaluationProfiles";
import { applyLetterhead, letterheadLayout, serviceFocusLabel, type LetterheadOptions } from "../shared/brandLetterhead";
import { loadBrandLogo } from "./utils/brandLogo";
import { drawBilanBlocks, parsePdfBlocks } from "./services/bilanPdfRichText";
import { bilanVariablesFrom, draftExtras, resolveBilanVariables } from "../shared/bilanVariables";
import { storagePut } from "./storage";

type BilanDraft = {
  /** Bilan libre collé par l'administrateur (HTML déjà nettoyé) : remplace la structure verdict / points forts / recommandations. */
  bilanHtml?: string;
  finalScore?: number;
  verdict?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  advisorValidated?: boolean;
  advisorValidatedAt?: string;
  advisorValidatedByAdminId?: number;
};

export type EvaluationPdfAuditEntry = {
  versionNumber: number;
  createdAt?: Date | null;
  createdByAdminAccountId?: number | null;
  approvalStatus?: string | null;
  approvedAt?: Date | null;
  approvedByAdminId?: number | null;
  approvalComment?: string | null;
  sentAt?: Date | null;
};

function readDraft(application: Application): BilanDraft {
  try {
    return JSON.parse(application.scoringDetails || "{}").adminDraft || {};
  } catch {
    return {};
  }
}

function safeText(value: unknown): string {
  return String(value ?? "").replace(/[\u0000-\u001F]/g, " ").trim();
}

export function buildEvaluationPdfAuditLines(draft: BilanDraft, auditTrail: EvaluationPdfAuditEntry[]): string[] {
  const auditLines: string[] = [];
  if (draft.advisorValidatedAt) {
    auditLines.push(`Validation conseiller : ${safeText(new Date(draft.advisorValidatedAt).toLocaleString("fr-FR"))}${draft.advisorValidatedByAdminId ? ` — compte administrateur #${draft.advisorValidatedByAdminId}` : ""}.`);
  }
  auditTrail.slice().sort((left, right) => left.versionNumber - right.versionNumber).forEach((entry) => {
    const createdAt = entry.createdAt ? new Date(entry.createdAt).toLocaleString("fr-FR") : "date non disponible";
    auditLines.push(`Version ${entry.versionNumber} enregistrée le ${safeText(createdAt)}${entry.createdByAdminAccountId ? ` — compte administrateur #${entry.createdByAdminAccountId}` : ""}.`);
    if (entry.approvedAt) {
      auditLines.push(`Version ${entry.versionNumber} : seconde approbation le ${safeText(new Date(entry.approvedAt).toLocaleString("fr-FR"))}${entry.approvedByAdminId ? ` — compte administrateur #${entry.approvedByAdminId}` : ""}${entry.approvalComment ? ` — ${safeText(entry.approvalComment)}` : ""}.`);
    }
  });
  return auditLines;
}

function writeParagraph(doc: jsPDF, text: string, x: number, y: number, width: number): number {
  const lines = doc.splitTextToSize(text, width) as string[];
  lines.forEach((line) => {
    if (y > 257) { doc.addPage(); y = 34; }
    doc.text(line, x, y);
    y += 6;
  });
  return y;
}

export async function createFinalEvaluationPdf(application: Application, versionNumber: number, auditTrail: EvaluationPdfAuditEntry[] = [], options: { preview?: boolean } = {}): Promise<{ key: string; url: string; bytes: Buffer }> {
  const draft = readDraft(application);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await loadBrandLogo();
  const letterhead: LetterheadOptions = {
    logoDataUri: logo?.dataUri,
    logoFormat: logo?.format,
    // le bilan parle du projet du candidat : études, travail, séjour, e-Visa ou installation
    documentKind: `Résultat d’évaluation — ${PROFILE_DEFS[resolveEvaluationProfile({ visaType: application.visaType, projectType: application.visaType })].label}`,
    reference: safeText(evaluationDisplayReference(application) ?? ""),
    recipient: safeText(application.fullName),
    subject: options.preview ? "APERÇU INTERNE — bilan non encore validé" : "Bilan d’évaluation préliminaire — document finalisé",
    serviceFocus: serviceFocusLabel(application.visaType, application.destination),
  };
  const layout = letterheadLayout(letterhead);
  doc.setTextColor(31, 41, 55);
  let y = layout.firstPageTop + 2;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Destination : ${safeText(application.destination || "À définir")}`, 18, y); y += 7;
  doc.text(`Version : ${versionNumber} — ${options.preview ? "Aperçu du" : "Finalisée le"} ${new Date().toLocaleString("fr-FR")}`, 18, y); y += 12;
  const freeBilan = typeof draft.bilanHtml === "string" && draft.bilanHtml.trim().length > 0;
  if (freeBilan) {
    // Bilan libre : le contenu rédigé par l'administrateur est repris tel quel (titres, listes, tableaux), sans structure imposée.
    if (typeof draft.finalScore === "number" && draft.finalScore > 0) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(10);
      doc.text(`Indice de préparation (IFP 3M) : ${draft.finalScore}/100`, 18, y); y += 8;
    }
    y = drawBilanBlocks(doc, parsePdfBlocks(resolveBilanVariables(draft.bilanHtml as string, bilanVariablesFrom({ fullName: application.fullName, dossierNumber: application.dossierNumber, destination: application.destination, visaType: application.visaType, paymentAmount: application.paymentAmount, score: typeof draft.finalScore === "number" ? draft.finalScore : null, ...draftExtras(draft) }))), { left: layout.marginLeft, width: layout.contentWidth, nextTop: layout.nextPageTop, bottom: layout.contentBottom }, y) + 4;
    doc.setTextColor(31, 41, 55);
  } else {
  doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text("Synthèse de l’évaluation", 18, y); y += 8;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.text(`Indice de faisabilité préliminaire (IFP 3M) : ${draft.finalScore ?? application.scoringTotal ?? "—"}/100`, 18, y); y += 8;
  if (draft.verdict) { doc.setFont("helvetica", "bold"); doc.text("Verdict du conseiller", 18, y); y += 6; doc.setFont("helvetica", "normal"); y = writeParagraph(doc, safeText(draft.verdict), 18, y, 174) + 5; }
  const sections: Array<[string, string[] | undefined]> = [["Points forts", draft.strengths], ["Axes d’amélioration", draft.weaknesses], ["Recommandations", draft.recommendations]];
  sections.forEach(([title, items]) => {
    if (!items?.length) return;
    if (y > 238) { doc.addPage(); y = 34; }
    doc.setFont("helvetica", "bold"); doc.text(title, 18, y); y += 6; doc.setFont("helvetica", "normal");
    items.forEach((item) => { y = writeParagraph(doc, `• ${safeText(item)}`, 21, y, 171) + 2; });
    y += 4;
  });
  }
  const auditLines = buildEvaluationPdfAuditLines(draft, auditTrail);
  if (auditLines.length) {
    if (y > 225) { doc.addPage(); y = 34; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("Historique administratif du bilan", 18, y); y += 7;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    auditLines.forEach((line) => { y = writeParagraph(doc, `• ${line}`, 21, y, 171) + 1; });
  }
  if (y > 240) { doc.addPage(); y = 34; }
  doc.setDrawColor(203, 213, 225); doc.line(18, y, 192, y); y += 8;
  doc.setTextColor(100, 116, 139); doc.setFontSize(8);
  writeParagraph(doc, "Ce bilan est une évaluation indicative établie par 3M TRAVEL AGENCY. Il ne constitue ni une décision ni une garantie d’immigration délivrée par une autorité publique.", 18, y, 174);
  applyLetterhead(doc, letterhead);
  const bytes = Buffer.from(doc.output("arraybuffer"));
  const reference = safeText(evaluationDisplayReference(application) || application.id).replace(/[^a-zA-Z0-9_-]/g, "-");
  // L'aperçu ne remplace jamais le PDF final : fichier distinct.
  const stored = await storagePut(`evaluation-bilans/${reference}/bilan-${options.preview ? "apercu" : "final"}-v${versionNumber}.pdf`, bytes, "application/pdf");
  return { ...stored, bytes };
}
