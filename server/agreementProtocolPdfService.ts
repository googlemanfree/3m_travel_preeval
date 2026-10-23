import { jsPDF } from "jspdf";
import { applyLetterhead, letterheadLayout, serviceFocusLabel, type LetterheadOptions } from "../shared/brandLetterhead";
import { loadBrandLogo } from "./utils/brandLogo";
import { storagePut } from "./storage";
import { buildProtocolOneRichText, type ProtocolOneVariables } from "../shared/agreementProtocolCountryTemplates";

function safeText(value: unknown): string {
  return String(value ?? "").replace(/[\u0000-\u001F]/g, " ").trim();
}

const LAYOUT = letterheadLayout({ documentKind: "x" });

function writeParagraph(doc: jsPDF, text: string, x: number, y: number, width: number, lineHeight = 5.5): number {
  const lines = doc.splitTextToSize(text, width) as string[];
  lines.forEach((line) => {
    if (y > LAYOUT.contentBottom) {
      doc.addPage();
      y = LAYOUT.nextPageTop;
    }
    doc.text(line, x, y);
    y += lineHeight;
  });
  return y;
}

export type AgreementProtocolSignature = {
  name: string;
  pngBytes?: Buffer | null;
  signedAt: Date;
  ipAddress?: string | null;
};

export async function createAgreementProtocolOnePdf(input: {
  dossierNumber: string;
  fullName: string;
  destination: string | null;
  variables: ProtocolOneVariables;
  /** Type de visa du dossier : adapte le service affiché en en-tête. */
  visaType?: string | null;
  content?: string;
  /** Titre d’en-tête PDF (ex. Protocole N°02). */
  documentTitle?: string;
  /** Si fourni, le PDF est l’exemplaire signé (bloc signature + statut signé). */
  signature?: AgreementProtocolSignature | null;
}): Promise<{ key: string; url: string; bytes: Buffer }> {
  const destination = input.destination || "Non spécifiée";
  const richText = input.content?.trim() && input.content.trim().length >= 50
    ? input.content.trim()
    : buildProtocolOneRichText(input.variables, destination);
  const signed = Boolean(input.signature?.name);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const defaultTitle = signed
    ? "Protocole d’accord N°01 — exemplaire signé"
    : "Protocole d’accord N°01 — accompagnement administratif";
  const logo = await loadBrandLogo();
  const letterhead: LetterheadOptions = {
    logoDataUri: logo?.dataUri,
    logoFormat: logo?.format,
    documentKind: input.documentTitle?.trim() || defaultTitle,
    reference: safeText(input.dossierNumber),
    recipient: safeText(input.fullName),
    serviceFocus: serviceFocusLabel(input.visaType, input.destination),
  };
  const layout = letterheadLayout(letterhead);
  doc.setTextColor(31, 41, 55);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  let y = layout.firstPageTop + 2;
  doc.text(`Destination : ${safeText(destination)}`, 18, y); y += 6;
  doc.text(`Généré le : ${new Date().toLocaleString("fr-FR", { timeZone: "Africa/Douala" })}`, 18, y); y += 12;
  doc.setDrawColor(201, 151, 43);
  doc.line(18, y - 5, 192, y - 5);
  doc.setFont("helvetica", "normal");
  richText.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean).forEach((paragraph) => {
    if (y > 250) {
      doc.addPage();
      y = layout.nextPageTop;
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

  if (signed && input.signature) {
    if (y > 210) {
      doc.addPage();
      y = layout.nextPageTop;
    }
    doc.setDrawColor(203, 213, 225);
    doc.line(18, y, 192, y);
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 36, 96);
    doc.text("Signature électronique du candidat", 18, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    const signedAtLabel = input.signature.signedAt.toLocaleString("fr-FR", { timeZone: "Africa/Douala" });
    y = writeParagraph(doc, `Signataire : ${safeText(input.signature.name)}`, 18, y, 174) + 1;
    y = writeParagraph(doc, `Date et heure : ${signedAtLabel}`, 18, y, 174) + 1;
    if (input.signature.ipAddress) {
      y = writeParagraph(doc, `Adresse IP : ${safeText(input.signature.ipAddress)}`, 18, y, 174) + 2;
    }
    if (input.signature.pngBytes && input.signature.pngBytes.length > 0) {
      try {
        const dataUrl = `data:image/png;base64,${input.signature.pngBytes.toString("base64")}`;
        if (y > 230) {
          doc.addPage();
          y = layout.nextPageTop;
        }
        doc.addImage(dataUrl, "PNG", 18, y, 70, 28);
        y += 32;
      } catch (error) {
        console.warn("[Agreement PDF] Signature image embed failed:", error);
        y = writeParagraph(doc, "Signature manuscrite électronique enregistrée (aperçu image indisponible dans le PDF).", 18, y, 174) + 2;
      }
    }
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);
    y = writeParagraph(
      doc,
      "Ce document constitue l’exemplaire signé du Protocole d’accord N°01. La signature a été apposée par le candidat dans son espace client sécurisé. 3M TRAVEL AGENCY ne garantit aucune décision d’une autorité, d’un employeur ou d’un partenaire.",
      18,
      y + 2,
      174,
      4.5,
    );
  } else {
    if (y > 258) {
      doc.addPage();
      y = layout.nextPageTop;
    }
    doc.setDrawColor(203, 213, 225);
    doc.line(18, y, 192, y);
    y += 7;
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);
    writeParagraph(
      doc,
      "Ce document est généré après validation administrative du paiement. La signature électronique reste exclusivement accessible au candidat depuis son espace client après confirmation du paiement. 3M TRAVEL AGENCY ne garantit aucune décision d’une autorité, d’un employeur ou d’un partenaire.",
      18,
      y,
      174,
      4.5,
    );
  }

  applyLetterhead(doc, letterhead);
  const bytes = Buffer.from(doc.output("arraybuffer"));
  const reference = safeText(input.dossierNumber || "dossier").replace(/[^a-zA-Z0-9_-]/g, "-");
  const fileName = signed ? "protocole-01-signe.pdf" : "protocole-01.pdf";
  return { ...await storagePut(`agreement-protocols/${reference}/${fileName}`, bytes, "application/pdf"), bytes };
}
