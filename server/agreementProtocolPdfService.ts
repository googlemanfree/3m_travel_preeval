import fs from "node:fs";
import path from "node:path";
import { jsPDF } from "jspdf";
import { storagePut } from "./storage";
import { buildProtocolOneRichText, type ProtocolOneVariables } from "../shared/agreementProtocolCountryTemplates";

function safeText(value: unknown): string {
  return String(value ?? "").replace(/[\u0000-\u001F]/g, " ").trim();
}

function writeParagraph(doc: jsPDF, text: string, x: number, y: number, width: number): number {
  const lines = doc.splitTextToSize(text, width) as string[];
  lines.forEach((line) => {
    if (y > 276) {
      doc.addPage();
      y = 22;
    }
    doc.text(line, x, y);
    y += 5.5;
  });
  return y;
}

function addLogo(doc: jsPDF) {
  const logoCandidates = [
    path.resolve(import.meta.dirname, "../client/public/favicon.png"),
    path.resolve(import.meta.dirname, "public/favicon.png"),
  ];
  const logoPath = logoCandidates.find((candidate) => fs.existsSync(candidate));
  if (!logoPath) return;
  try {
    const logoData = `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;
    doc.addImage(logoData, "PNG", 18, 5, 23, 23);
  } catch (error) {
    console.warn("[Agreement PDF] Logo unavailable:", error);
  }
}

export async function createAgreementProtocolOnePdf(input: {
  dossierNumber: string;
  fullName: string;
  destination: string | null;
  variables: ProtocolOneVariables;
  content?: string;
}): Promise<{ key: string; url: string; bytes: Buffer }> {
  const destination = input.destination || "Non spécifiée";
  const richText = input.content?.trim() && input.content.trim().length >= 50
    ? input.content.trim()
    : buildProtocolOneRichText(input.variables, destination);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFillColor(15, 36, 96);
  doc.rect(0, 0, 210, 34, "F");
  addLogo(doc);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("3M Travel & Services", 48, 16);
  doc.setFontSize(10);
  doc.text("Protocole d’accord N°01 — accompagnement administratif", 48, 25);
  doc.setTextColor(31, 41, 55);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  let y = 48;
  doc.text(`Dossier : ${safeText(input.dossierNumber)}`, 18, y); y += 6;
  doc.text(`Candidat : ${safeText(input.fullName)}`, 18, y); y += 6;
  doc.text(`Destination : ${safeText(destination)}`, 18, y); y += 6;
  doc.text(`Généré le : ${new Date().toLocaleString("fr-FR", { timeZone: "Africa/Douala" })}`, 18, y); y += 12;
  doc.setDrawColor(201, 151, 43);
  doc.line(18, y - 5, 192, y - 5);
  doc.setFont("helvetica", "normal");
  richText.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean).forEach((paragraph) => {
    if (y > 255) {
      doc.addPage();
      y = 22;
    }
    const heading = /^(Article\s+\d+[^:]*):?$/i.test(paragraph.trim());
    if (heading) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      y = writeParagraph(doc, safeText(paragraph), 18, y, 174) + 2;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    } else {
      y = writeParagraph(doc, safeText(paragraph), 18, y, 174) + 3;
    }
  });
  if (y > 258) {
    doc.addPage();
    y = 22;
  }
  doc.setDrawColor(203, 213, 225);
  doc.line(18, y, 192, y);
  y += 7;
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  writeParagraph(doc, "Ce document est généré après validation administrative du paiement. La signature électronique reste exclusivement accessible au candidat depuis son espace client après confirmation du paiement. 3M Travel & Services ne garantit aucune décision d’une autorité, d’un employeur ou d’un partenaire.", 18, y, 174);
  const bytes = Buffer.from(doc.output("arraybuffer"));
  const reference = safeText(input.dossierNumber || "dossier").replace(/[^a-zA-Z0-9_-]/g, "-");
  return { ...await storagePut(`agreement-protocols/${reference}/protocole-01.pdf`, bytes, "application/pdf"), bytes };
}
