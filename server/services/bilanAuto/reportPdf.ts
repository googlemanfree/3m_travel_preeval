import { jsPDF } from "jspdf";
import { applyLetterhead, letterheadLayout, type LetterheadOptions } from "../../../shared/brandLetterhead";
import { loadBrandLogo } from "../../utils/brandLogo";
import type { BilanReport } from "./types";

/**
 * PDF du bilan, aux couleurs de 3M (papier à en-tête existant), paragraphes justifiés. Généré depuis le MÊME objet que le HTML et le texte.
 * Aucune ressource distante n'est chargée pendant le rendu (le logo vient du dépôt, jamais d'une adresse fournie par un candidat).
 */

const TEXT_WIDTH = 174;
const LEFT = 18;
const BOTTOM = 257;
const NEW_PAGE_TOP = 34;

const safe = (value: string) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F​-‏‪-‮﻿]/g, "").replace(/[→]/g, "->").replace(/[•]/g, "-").replace(/[─]/g, "-");

function writeJustified(doc: jsPDF, text: string, x: number, y: number, width: number, lineHeight = 5.4): number {
  const lines = doc.splitTextToSize(safe(text), width) as string[];
  lines.forEach((line, index) => {
    if (y > BOTTOM) { doc.addPage(); y = NEW_PAGE_TOP; }
    const last = index === lines.length - 1;
    if (last || lines.length === 1) doc.text(line, x, y);
    else doc.text(line, x, y, { align: "justify", maxWidth: width });
    y += lineHeight;
  });
  return y;
}

export async function renderPdf(report: BilanReport): Promise<Buffer> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await loadBrandLogo();
  const letterhead: LetterheadOptions = {
    logoDataUri: logo?.dataUri,
    logoFormat: logo?.format,
    documentKind: "Bilan d'évaluation préliminaire — projet de travail",
    reference: safe(report.dossierRef ?? ""),
    recipient: safe(report.candidateName),
    subject: "Bilan d'évaluation préliminaire",
    serviceFocus: "Mobilité internationale — travail",
  };
  const layout = letterheadLayout(letterhead);
  doc.setTextColor(31, 41, 55);
  let y = layout.firstPageTop + 2;

  doc.setFont("helvetica", "bold"); doc.setFontSize(13);
  y = writeJustified(doc, report.verdictLabel, LEFT, y, TEXT_WIDTH, 6.5) + 2;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  y = writeJustified(doc, `Date de référence : ${new Date(report.referenceDate).toLocaleDateString("fr-FR", { dateStyle: "long", timeZone: "UTC" })} · grille v${report.gridVersion}`, LEFT, y, TEXT_WIDTH) + 4;

  for (const entry of report.sections) {
    if (y > BOTTOM - 20) { doc.addPage(); y = NEW_PAGE_TOP; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(11);
    y = writeJustified(doc, entry.title, LEFT, y, TEXT_WIDTH, 6) + 1;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
    for (const paragraph of entry.paragraphs) y = writeJustified(doc, paragraph, LEFT, y, TEXT_WIDTH) + 1.5;
    for (const [label, value] of entry.table ?? []) {
      if (y > BOTTOM) { doc.addPage(); y = NEW_PAGE_TOP; }
      doc.text(safe(label), LEFT + 2, y);
      doc.text(safe(value), LEFT + TEXT_WIDTH, y, { align: "right" });
      y += 5.4;
    }
    for (const bullet of entry.bullets) y = writeJustified(doc, `- ${bullet}`, LEFT + 3, y, TEXT_WIDTH - 3, 5) + 0.8;
    y += 3;
  }

  applyLetterhead(doc, letterhead);
  return Buffer.from(doc.output("arraybuffer"));
}

/** Contrôle d'intégrité : en-tête PDF, taille plausible, et nombre de pages > 0. */
export function checkPdfIntegrity(bytes: Buffer): string[] {
  const problems: string[] = [];
  if (bytes.length < 1500) problems.push("PDF anormalement petit");
  if (bytes.subarray(0, 5).toString("latin1") !== "%PDF-") problems.push("En-tête PDF absent");
  if (!bytes.subarray(Math.max(0, bytes.length - 1024)).toString("latin1").includes("%%EOF")) problems.push("Fin de fichier PDF absente");
  return problems;
}
