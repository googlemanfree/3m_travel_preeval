import { jsPDF } from "jspdf";
import type { Application } from "../drizzle/schema";
import { storagePut } from "./storage";

type BilanDraft = {
  finalScore?: number;
  verdict?: string;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
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

function writeParagraph(doc: jsPDF, text: string, x: number, y: number, width: number): number {
  const lines = doc.splitTextToSize(text, width) as string[];
  lines.forEach((line) => {
    if (y > 276) { doc.addPage(); y = 22; }
    doc.text(line, x, y);
    y += 6;
  });
  return y;
}

export async function createFinalEvaluationPdf(application: Application, versionNumber: number): Promise<{ key: string; url: string }> {
  const draft = readDraft(application);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 20;
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, 210, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("3M Travel & Services", 18, 16);
  doc.setFontSize(11);
  doc.text("Bilan d’évaluation préliminaire — document finalisé", 18, 25);
  doc.setTextColor(31, 41, 55);
  y = 48;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Dossier : ${safeText(application.dossierNumber)}`, 18, y); y += 7;
  doc.text(`Candidat : ${safeText(application.fullName)}`, 18, y); y += 7;
  doc.text(`Destination : ${safeText(application.destination || "À définir")}`, 18, y); y += 7;
  doc.text(`Version : ${versionNumber} — Finalisée le ${new Date().toLocaleString("fr-FR")}`, 18, y); y += 12;
  doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text("Synthèse de l’évaluation", 18, y); y += 8;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.text(`Indice de faisabilité préliminaire (IFP 3M) : ${draft.finalScore ?? application.scoringTotal ?? "—"}/100`, 18, y); y += 8;
  if (draft.verdict) { doc.setFont("helvetica", "bold"); doc.text("Verdict du conseiller", 18, y); y += 6; doc.setFont("helvetica", "normal"); y = writeParagraph(doc, safeText(draft.verdict), 18, y, 174) + 5; }
  const sections: Array<[string, string[] | undefined]> = [["Points forts", draft.strengths], ["Axes d’amélioration", draft.weaknesses], ["Recommandations", draft.recommendations]];
  sections.forEach(([title, items]) => {
    if (!items?.length) return;
    if (y > 250) { doc.addPage(); y = 22; }
    doc.setFont("helvetica", "bold"); doc.text(title, 18, y); y += 6; doc.setFont("helvetica", "normal");
    items.forEach((item) => { y = writeParagraph(doc, `• ${safeText(item)}`, 21, y, 171) + 2; });
    y += 4;
  });
  if (y > 255) { doc.addPage(); y = 22; }
  doc.setDrawColor(203, 213, 225); doc.line(18, y, 192, y); y += 8;
  doc.setTextColor(100, 116, 139); doc.setFontSize(8);
  writeParagraph(doc, "Ce bilan est une évaluation indicative établie par 3M Travel & Services. Il ne constitue ni une décision ni une garantie d’immigration délivrée par une autorité publique.", 18, y, 174);
  const bytes = Buffer.from(doc.output("arraybuffer"));
  const reference = safeText(application.dossierNumber || application.id).replace(/[^a-zA-Z0-9_-]/g, "-");
  return storagePut(`evaluation-bilans/${reference}/bilan-final-v${versionNumber}.pdf`, bytes, "application/pdf");
}
