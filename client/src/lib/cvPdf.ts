import type { jsPDF as JsPdf } from "jspdf";
import { CV_SECTION_LABELS, type CvDraft, type CvIdentity, type CvLanguage } from "@shared/cvDraft";

export type CvPdfInput = { identity: CvIdentity; draft: CvDraft; language: CvLanguage; includeContact: boolean };

const MARGIN = 18;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BOTTOM = PAGE_HEIGHT - 16;

/** Nom de fichier sûr : « CV_Aicha_Nkolo.pdf ». */
export function cvPdfFileName(fullName: string): string {
  const safe = fullName.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return `CV_${safe || "candidat"}.pdf`;
}

const clean = (value: string | null | undefined) => (value ?? "").replace(/\s+/g, " ").trim();

/** Retire les lignes et blocs vides laissés pendant l'édition (une puce vide ne doit pas s'imprimer). */
export function pruneCvDraft(draft: CvDraft): CvDraft {
  const keep = (values: string[]) => values.map(clean).filter(Boolean);
  return {
    ...draft,
    experiences: draft.experiences.filter((item) => clean(item.role) || clean(item.employer)).map((item) => ({ ...item, bullets: keep(item.bullets) })),
    education: draft.education.filter((item) => clean(item.degree) || clean(item.institution)),
    skills: keep(draft.skills),
    languages: draft.languages.filter((item) => clean(item.language)),
    certifications: keep(draft.certifications),
  };
}

/** Dessine le CV sur le document fourni (testable sans navigateur). Ne crée aucune information : tout vient du brouillon relu. */
export function renderCvPdf(pdf: JsPdf, input: CvPdfInput): void {
  const { identity, language, includeContact } = input;
  const draft = pruneCvDraft(input.draft);
  const labels = CV_SECTION_LABELS[language];
  let y = MARGIN;

  const ensureSpace = (height: number) => {
    if (y + height > BOTTOM) {
      pdf.addPage();
      y = MARGIN;
    }
  };
  const paragraph = (text: string, options: { size?: number; bold?: boolean; indent?: number; color?: [number, number, number]; gap?: number } = {}) => {
    const size = options.size ?? 10.5;
    const indent = options.indent ?? 0;
    pdf.setFont("helvetica", options.bold ? "bold" : "normal");
    pdf.setFontSize(size);
    const color = options.color ?? [30, 41, 59];
    pdf.setTextColor(color[0], color[1], color[2]);
    const lineHeight = size * 0.45;
    for (const line of pdf.splitTextToSize(text, CONTENT_WIDTH - indent) as string[]) {
      ensureSpace(lineHeight + 1);
      pdf.text(line, MARGIN + indent, y);
      y += lineHeight;
    }
    y += options.gap ?? 1;
  };
  const heading = (title: string) => {
    ensureSpace(14);
    y += 3;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11.5);
    pdf.setTextColor(15, 36, 96);
    pdf.text(title.toUpperCase(), MARGIN, y);
    y += 1.8;
    pdf.setDrawColor(15, 36, 96);
    pdf.setLineWidth(0.4);
    pdf.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
    y += 5;
  };

  paragraph(clean(identity.fullName), { size: 20, bold: true, color: [15, 36, 96], gap: 1.5 });
  if (clean(draft.headline)) paragraph(clean(draft.headline), { size: 12, color: [51, 65, 85], gap: 1.5 });
  if (includeContact) {
    const contact = [identity.city, identity.email, identity.phone].map(clean).filter(Boolean).join("  ·  ");
    if (contact) paragraph(contact, { size: 9.5, color: [71, 85, 105], gap: 1 });
  }

  if (clean(draft.summary)) {
    heading(labels.summary);
    paragraph(clean(draft.summary), { gap: 2 });
  }

  if (draft.experiences.length) {
    heading(labels.experience);
    for (const experience of draft.experiences) {
      const period = [clean(experience.start), clean(experience.end)].filter(Boolean).join(" – ");
      const title = [clean(experience.role), clean(experience.employer)].filter(Boolean).join(" — ");
      ensureSpace(16);
      paragraph(title, { bold: true, gap: 0.5 });
      const meta = [period, clean(experience.location)].filter(Boolean).join("  ·  ");
      if (meta) paragraph(meta, { size: 9.5, color: [100, 116, 139], gap: 0.5 });
      for (const bullet of experience.bullets) paragraph(`•  ${clean(bullet)}`, { indent: 3, gap: 0.5 });
      y += 2;
    }
  }

  if (draft.education.length) {
    heading(labels.education);
    for (const education of draft.education) {
      paragraph([clean(education.degree), clean(education.institution)].filter(Boolean).join(" — "), { bold: true, gap: 0.5 });
      const meta = [clean(education.year), clean(education.details)].filter(Boolean).join("  ·  ");
      if (meta) paragraph(meta, { size: 9.5, color: [100, 116, 139], gap: 0.5 });
      y += 1.5;
    }
  }

  if (draft.skills.length) {
    heading(labels.skills);
    paragraph(draft.skills.map(clean).filter(Boolean).join("  ·  "), { gap: 2 });
  }

  if (draft.languages.length) {
    heading(labels.languages);
    paragraph(draft.languages.map((entry) => [clean(entry.language), clean(entry.level)].filter(Boolean).join(" : ")).filter(Boolean).join("  ·  "), { gap: 2 });
  }

  if (draft.certifications.length) {
    heading(labels.certifications);
    for (const certification of draft.certifications) paragraph(`•  ${clean(certification)}`, { indent: 3, gap: 0.5 });
  }
}

/** Génère et télécharge le PDF ; renvoie le nom du fichier. */
export async function downloadCvPdf(input: CvPdfInput): Promise<string> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  renderCvPdf(pdf, input);
  const fileName = cvPdfFileName(input.identity.fullName);
  pdf.save(fileName);
  return fileName;
}
