import jsPDF from "jspdf";

// Palette 3M Travel
const COLORS = {
  navyDark:  [15,  36,  96]  as [number, number, number],
  navy:      [30,  58, 138]  as [number, number, number],
  blue:      [37,  99, 235]  as [number, number, number],
  skyBlue:   [124,185,232]  as [number, number, number],
  white:     [255,255,255]  as [number, number, number],
  lightGray: [248,250,252]  as [number, number, number],
  gray:      [107,114,128]  as [number, number, number],
  darkGray:  [31, 41,  55]  as [number, number, number],
  green:     [22, 163, 74]  as [number, number, number],
  greenBg:   [240,253,244]  as [number, number, number],
  border:    [226,232,240]  as [number, number, number],
};

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

function setFont(doc: jsPDF, size: number, style: "normal"|"bold" = "normal", color = COLORS.darkGray) {
  doc.setFontSize(size);
  doc.setFont("helvetica", style);
  doc.setTextColor(...color);
}

function drawRect(doc: jsPDF, x: number, y: number, w: number, h: number, color: [number,number,number], radius = 0) {
  doc.setFillColor(...color);
  if (radius > 0) {
    doc.roundedRect(x, y, w, h, radius, radius, "F");
  } else {
    doc.rect(x, y, w, h, "F");
  }
}

function drawLine(doc: jsPDF, x1: number, y1: number, x2: number, y2: number, color: [number,number,number], width = 0.3) {
  doc.setDrawColor(...color);
  doc.setLineWidth(width);
  doc.line(x1, y1, x2, y2);
}

/** Enveloppe le texte long et retourne le nombre de lignes écrites */
function writeWrapped(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  doc.text(lines, x, y);
  return lines.length;
}

export function generateEvaluationPdf(reportText: string, candidateName?: string): void {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const refNum = `3M-EVAL-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-${Math.floor(Math.random()*9000+1000)}`;

  // ── PAGE 1 : EN-TÊTE ──────────────────────────────────────────────────────

  // Fond dégradé simulé (rectangle navy foncé)
  drawRect(doc, 0, 0, PAGE_W, 52, COLORS.navyDark);
  // Bande accent bleue en bas de l'en-tête
  drawRect(doc, 0, 48, PAGE_W, 4, COLORS.blue);

  // Logo textuel 3M
  setFont(doc, 22, "bold", COLORS.white);
  doc.text("3M", MARGIN, 18);
  setFont(doc, 9, "normal", COLORS.skyBlue);
  doc.text("TRAVEL & SERVICES", MARGIN + 13, 18);

  // Titre rapport
  setFont(doc, 16, "bold", COLORS.white);
  doc.text("RAPPORT D'ÉVALUATION", MARGIN, 32);
  setFont(doc, 10, "normal", COLORS.skyBlue);
  doc.text("Analyse personnalisée par Intelligence Artificielle", MARGIN, 39);

  // Référence et date (coin droit)
  setFont(doc, 7, "normal", COLORS.skyBlue);
  doc.text(`Réf. : ${refNum}`, PAGE_W - MARGIN, 28, { align: "right" });
  doc.text(`Émis le : ${dateStr}`, PAGE_W - MARGIN, 34, { align: "right" });
  doc.text("Confidentiel", PAGE_W - MARGIN, 40, { align: "right" });

  // ── BANDEAU CANDIDAT ──────────────────────────────────────────────────────
  drawRect(doc, MARGIN, 58, CONTENT_W, 18, COLORS.lightGray, 3);
  drawRect(doc, MARGIN, 58, 4, 18, COLORS.blue, 2);

  setFont(doc, 7, "normal", COLORS.gray);
  doc.text("CANDIDAT", MARGIN + 8, 65);
  setFont(doc, 11, "bold", COLORS.navy);
  doc.text(candidateName || "Candidat 3M Travel", MARGIN + 8, 72);

  setFont(doc, 7, "normal", COLORS.gray);
  doc.text("DOCUMENT", PAGE_W - MARGIN - 40, 65);
  setFont(doc, 8, "bold", COLORS.navy);
  doc.text("Pré-Évaluation Visa & Immigration", PAGE_W - MARGIN - 40, 72);

  // ── SÉPARATEUR ────────────────────────────────────────────────────────────
  let curY = 86;
  drawLine(doc, MARGIN, curY, PAGE_W - MARGIN, curY, COLORS.border, 0.4);
  curY += 6;

  // ── CONTENU DU RAPPORT ────────────────────────────────────────────────────
  const lines = reportText.split("\n");
  const pageBottom = PAGE_H - 24; // espace footer

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Nouvelle page si nécessaire
    if (curY > pageBottom) {
      addFooter(doc, refNum, dateStr);
      doc.addPage();
      curY = 20;
    }

    if (line === "") {
      curY += 3;
      continue;
    }

    // ── Titre de section (ligne commençant par ===, ---, ou tout en MAJUSCULES > 10 chars)
    const isSectionTitle =
      /^={3,}/.test(line) ||
      /^-{3,}/.test(line) ||
      /^#{1,3}\s/.test(line) ||
      (line === line.toUpperCase() && line.trim().length > 6 && !/^\d/.test(line));

    // ── Sous-titre (ligne se terminant par ":")
    const isSubTitle = /^[A-ZÀÂÉÈÊËÎÏÔÙÛÜÇ][^:]{3,40}:\s*$/.test(line) || /^\*\*[^*]+\*\*$/.test(line);

    // ── Ligne de score/note (contient ":" et un chiffre ou %)
    const isScoreLine = /:\s*\d+/.test(line) && line.length < 80;

    // ── Puce ou numéro
    const isBullet = /^[-•*]\s/.test(line) || /^\d+\.\s/.test(line);

    if (isSectionTitle) {
      if (curY > pageBottom - 14) {
        addFooter(doc, refNum, dateStr);
        doc.addPage();
        curY = 20;
      }
      curY += 4;
      drawRect(doc, MARGIN, curY - 5, CONTENT_W, 12, COLORS.navy, 2);
      setFont(doc, 9, "bold", COLORS.white);
      const cleanTitle = line.replace(/^[=#\-*\s]+/, "").replace(/[=#\-*\s]+$/, "").toUpperCase();
      doc.text(cleanTitle, MARGIN + 4, curY + 2);
      curY += 12;
    } else if (isSubTitle) {
      curY += 2;
      setFont(doc, 9, "bold", COLORS.navy);
      const cleanSub = line.replace(/\*\*/g, "").replace(/:$/, "");
      doc.text(cleanSub, MARGIN, curY);
      curY += 5;
      drawLine(doc, MARGIN, curY, MARGIN + 40, curY, COLORS.skyBlue, 0.6);
      curY += 3;
    } else if (isScoreLine) {
      // Ligne score avec fond coloré
      const parts = line.split(":");
      const label = parts[0].trim();
      const value = parts.slice(1).join(":").trim();

      drawRect(doc, MARGIN, curY - 4, CONTENT_W, 8, COLORS.lightGray, 1);
      setFont(doc, 8, "bold", COLORS.darkGray);
      doc.text(label, MARGIN + 3, curY + 0.5);
      setFont(doc, 8, "bold", COLORS.blue);
      doc.text(value, PAGE_W - MARGIN - 3, curY + 0.5, { align: "right" });
      curY += 9;
    } else if (isBullet) {
      const indent = MARGIN + 5;
      const bulletText = line.replace(/^[-•*]\s/, "").replace(/^\d+\.\s/, "");
      // Point de puce
      doc.setFillColor(...COLORS.blue);
      doc.circle(MARGIN + 2, curY - 1, 0.8, "F");
      setFont(doc, 8, "normal", COLORS.darkGray);
      const nLines = writeWrapped(doc, bulletText, indent, curY, CONTENT_W - 8, 4.5);
      curY += nLines * 4.5 + 1;
    } else {
      // Texte normal
      setFont(doc, 8, "normal", COLORS.darkGray);
      const nLines = writeWrapped(doc, line, MARGIN, curY, CONTENT_W, 4.5);
      curY += nLines * 4.5 + 1;
    }
  }

  // ── ENCADRÉ CONTACT ───────────────────────────────────────────────────────
  if (curY > pageBottom - 30) {
    addFooter(doc, refNum, dateStr);
    doc.addPage();
    curY = 20;
  }

  curY += 6;
  drawRect(doc, MARGIN, curY, CONTENT_W, 28, COLORS.greenBg, 3);
  drawRect(doc, MARGIN, curY, 4, 28, COLORS.green, 2);

  setFont(doc, 9, "bold", COLORS.green);
  doc.text("PROCHAINE ÉTAPE — CONTACTEZ UN CONSEILLER 3M TRAVEL", MARGIN + 8, curY + 8);

  setFont(doc, 8, "normal", COLORS.darkGray);
  doc.text("📞  +237 698 104 832  (WhatsApp)", MARGIN + 8, curY + 15);
  doc.text("🌐  www.3mtravelagency.click", MARGIN + 8, curY + 21);
  doc.text("📧  contact@3mtravelagency.click", MARGIN + 80, curY + 15);

  curY += 34;

  // ── FOOTER DERNIÈRE PAGE ──────────────────────────────────────────────────
  addFooter(doc, refNum, dateStr);

  // ── TÉLÉCHARGEMENT ────────────────────────────────────────────────────────
  const safeName = (candidateName || "candidat").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  doc.save(`rapport-evaluation-3M-Travel-${safeName}.pdf`);
}

function addFooter(doc: jsPDF, refNum: string, dateStr: string) {
  const y = PAGE_H - 14;
  drawRect(doc, 0, y - 4, PAGE_W, 18, COLORS.navyDark);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.skyBlue);
  doc.text("3M Travel & Services  |  Votre mobilité, notre expertise", MARGIN, y + 2);
  doc.text(`Réf. ${refNum}  |  ${dateStr}  |  Document confidentiel`, PAGE_W - MARGIN, y + 2, { align: "right" });
  doc.text("Ce rapport est généré par IA à titre indicatif. Il ne constitue pas un avis juridique.", PAGE_W / 2, y + 7, { align: "center" });
}
