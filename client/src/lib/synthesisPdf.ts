import type { jsPDF as JsPdf } from "jspdf";
import {
  formatDisplayName,
  type SynthesisContent,
} from "@shared/candidateSynthesisSheet";

const MARGIN = 14;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BOTTOM = PAGE_HEIGHT - 12;

export function synthesisPdfFileName(displayFirstName: string, lastInitial: string): string {
  const safe = formatDisplayName(displayFirstName, lastInitial)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `Synthese_${safe || "candidat"}.pdf`;
}

const clean = (value: string | null | undefined) => (value ?? "").replace(/\s+/g, " ").trim();

/** Dessine la fiche de synthèse sur 1 page A4 — sans coordonnées ni numéros de pièces. */
export function renderSynthesisPdf(
  pdf: JsPdf,
  input: { content: SynthesisContent; portraitDataUrl?: string | null; profileCode?: string | null },
): void {
  const { content } = input;
  let y = MARGIN;

  const ensure = (h: number) => {
    if (y + h > BOTTOM) y = Math.min(y, BOTTOM - h);
  };
  const line = (text: string, opts: { size?: number; bold?: boolean; color?: [number, number, number]; gap?: number; x?: number; width?: number } = {}) => {
    const size = opts.size ?? 9.5;
    const x = opts.x ?? MARGIN;
    const width = opts.width ?? CONTENT_WIDTH;
    pdf.setFont("helvetica", opts.bold ? "bold" : "normal");
    pdf.setFontSize(size);
    const color = opts.color ?? [30, 41, 59];
    pdf.setTextColor(color[0], color[1], color[2]);
    const lh = size * 0.42;
    for (const row of pdf.splitTextToSize(text, width) as string[]) {
      ensure(lh + 0.8);
      pdf.text(row, x, y);
      y += lh;
    }
    y += opts.gap ?? 0.8;
  };
  const section = (title: string) => {
    y += 2;
    ensure(8);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(15, 36, 96);
    pdf.text(title.toUpperCase(), MARGIN, y);
    y += 1.5;
    pdf.setDrawColor(15, 36, 96);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
    y += 3.5;
  };

  // En-tête
  pdf.setFillColor(15, 36, 96);
  pdf.rect(0, 0, PAGE_WIDTH, 22, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("3M TRAVEL AGENCY — Fiche de synthèse candidat", MARGIN, 10);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(`Réf. dossier ${content.dossierReference}${input.profileCode ? ` · ${input.profileCode}` : ""} · ${content.generatedAtLabel}`, MARGIN, 16);
  y = 28;

  const textX = input.portraitDataUrl ? MARGIN + 32 : MARGIN;
  const textW = input.portraitDataUrl ? CONTENT_WIDTH - 34 : CONTENT_WIDTH;

  if (input.portraitDataUrl) {
    try {
      pdf.addImage(input.portraitDataUrl, "JPEG", MARGIN, y - 2, 28, 34);
    } catch {
      pdf.setDrawColor(203, 213, 225);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(MARGIN, y - 2, 28, 34, 2, 2, "FD");
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139);
      pdf.text("Photo", MARGIN + 9, y + 16);
    }
  } else {
    pdf.setDrawColor(203, 213, 225);
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(MARGIN, y - 2, 28, 34, 2, 2, "FD");
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text("Photo", MARGIN + 9, y + 16);
  }

  const nameY = y;
  y = nameY;
  line(formatDisplayName(content.displayFirstName, content.displayLastInitial), {
    size: 14,
    bold: true,
    color: [15, 36, 96],
    x: textX,
    width: textW,
    gap: 1,
  });
  if (clean(content.profileTitle)) line(clean(content.profileTitle), { size: 10, color: [51, 65, 85], x: textX, width: textW });
  const meta = [content.residenceCity, content.residenceCountry, content.targetDestination, content.targetProcedure]
    .map(clean)
    .filter(Boolean)
    .join(" · ");
  if (meta) line(meta, { size: 8.5, color: [71, 85, 105], x: textX, width: textW });
  y = Math.max(y, nameY + 34);

  if (clean(content.summary)) {
    section("Résumé");
    line(clean(content.summary), { size: 9, gap: 1 });
  }

  if (content.experiences.length) {
    section("Expériences clés");
    for (const exp of content.experiences.slice(0, 3)) {
      line(`${clean(exp.role)} — ${clean(exp.employer)}`, { size: 9, bold: true, gap: 0.3 });
      if (clean(exp.period)) line(clean(exp.period), { size: 8, color: [71, 85, 105], gap: 1.2 });
    }
  }

  if (content.education) {
    section("Formation");
    line(
      [content.education.degree, content.education.institution, content.education.year].map(clean).filter(Boolean).join(" · "),
      { size: 9, gap: 1 },
    );
  }

  if (content.skills.length) {
    section("Compétences");
    line(content.skills.map(clean).filter(Boolean).join(" · "), { size: 8.5, gap: 1 });
  }

  if (content.languages.length) {
    section("Langues");
    line(
      content.languages
        .map((item) => (clean(item.level) ? `${clean(item.language)} (${clean(item.level)})` : clean(item.language)))
        .filter(Boolean)
        .join(" · "),
      { size: 8.5, gap: 1 },
    );
  }

  if (content.documents.length) {
    section("Pièces vérifiées par l’agence");
    for (const doc of content.documents) {
      const status =
        doc.status === "verified" ? "vérifiée" : doc.status === "rejected" ? "refusée" : doc.status === "pending" ? "en contrôle" : "déposée";
      line(`• ${doc.label} — ${status}`, { size: 8, color: [51, 65, 85], gap: 0.5 });
    }
  }

  y = Math.max(y, BOTTOM - 8);
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text(
    "Document confidentiel 3M TRAVEL AGENCY. Aucune coordonnée directe. Contact via l’agence uniquement.",
    MARGIN,
    PAGE_HEIGHT - 8,
  );
}
