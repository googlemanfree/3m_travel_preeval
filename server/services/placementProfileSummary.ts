import { createHash } from "node:crypto";
import { jsPDF } from "jspdf";
import { applyLetterhead, letterheadLayout, type LetterheadOptions } from "../../shared/brandLetterhead";
import { loadBrandLogoSync } from "../utils/brandLogo";
import { z } from "zod";
import type { CvDraft } from "../../shared/cvDraft";

/**
 * Fiche de synthèse d'un candidat, remise aux employeurs et agences de placement (PDF d'une page).
 *
 * - identité externe = prénom + initiale du nom, jamais le nom complet ni une coordonnée ;
 * - le portrait n'est imprimé que si le candidat a donné son accord distinct « photo » ET qu'une photo exploitable existe ;
 * - tout texte est expurgé des e-mails, téléphones et numéros d'identité avant d'entrer dans la fiche ;
 * - la fiche est relue, corrigée et validée par un administrateur avant toute diffusion.
 */

type SummaryDocument = {
  type?: string | null;
  name?: string | null;
  status?: string | null;
  comment?: string | null;
};

export type PlacementSummaryInput = {
  fullName: string;
  destination: string;
  procedure: string;
  sector?: string | null;
  yearsExperience?: string | null;
  languages?: string | null;
  profileSummary?: string | null;
  documents?: SummaryDocument[];
};

export type PlacementSummaryDraft = {
  firstName: string;
  identity: string;
  destination: string;
  procedure: string;
  sector: string;
  experience: string;
  languages: string;
  profileSummary: string;
  documents: Array<{ type: string; status: string }>;
  /** Intitulé du profil (ex. « Gestionnaire logistique »), tiré du CV. */
  headline?: string;
  /** Points clés (3 à 5) : expériences, formation, compétences. */
  highlights?: string[];
  /** Synthèse complète pour les employeurs (tous facultatifs) : parcours détaillé, formation, compétences, disponibilité. */
  experiences?: string[];
  education?: string[];
  skills?: string[];
  availability?: string;
};

const TYPE_LABELS: Record<string, string> = {
  cv: "CV",
  passeport: "Passeport",
  diplome: "Diplôme",
  releve_notes: "Relevé de notes",
  photo: "Photo",
  contrat: "Contrat",
  autre: "Autre",
};

export const MAX_HIGHLIGHTS = 5;
export const MAX_EXPERIENCES = 6;
export const MAX_EDUCATION = 4;
export const MAX_SKILLS = 12;

export function identityFromName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || "Candidat";
  const lastName = parts.slice(1).join(" ");
  return { firstName, identity: lastName ? `${firstName} ${lastName[0].toUpperCase()}.` : firstName };
}

export function sanitizeSummaryText(value?: string | null, fallback = "À préciser", maxLength = 900) {
  return String(value || fallback)
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[coordonnée masquée]")
    .replace(/(?:\+?\d[\d .()/-]{7,}\d)/g, "[coordonnée masquée]")
    .replace(/\b(?:passeport|passport|n[°o]\s*)[A-Z0-9 -]{4,}\b/gi, "[identifiant masqué]")
    .replace(/\b[A-Z]{1,4}[ -]?\d{5,}\b/g, "[identifiant masqué]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeType(value?: string | null) {
  const key = String(value || "autre").trim().toLowerCase().replace(/[éèêë]/g, "e").replace(/\s+/g, "_");
  return TYPE_LABELS[key] || value?.trim() || "Autre";
}

export function buildPlacementSummaryDraft(input: PlacementSummaryInput): PlacementSummaryDraft {
  const identity = identityFromName(input.fullName);
  const documents = new Map<string, { type: string; status: string }>();
  for (const document of input.documents || []) {
    const type = normalizeType(document.type || document.name);
    const status = document.status === "verified" || document.status === "approved" ? "Validé" : document.status === "rejected" ? "À corriger" : "En vérification";
    const existing = documents.get(type);
    const rank = { "Validé": 3, "À corriger": 2, "En vérification": 1 } as const;
    if (!existing || rank[status as keyof typeof rank] > rank[existing.status as keyof typeof rank]) documents.set(type, { type, status });
  }
  return {
    ...identity,
    destination: sanitizeSummaryText(input.destination),
    procedure: sanitizeSummaryText(input.procedure),
    sector: sanitizeSummaryText(input.sector),
    experience: sanitizeSummaryText(input.yearsExperience),
    languages: sanitizeSummaryText(input.languages),
    profileSummary: sanitizeSummaryText(input.profileSummary, "Profil préparé et suivi par 3M."),
    documents: Array.from(documents.values()).sort((a, b) => a.type.localeCompare(b.type, "fr")),
  };
}

// ---- Brouillon relu par l'administrateur ---------------------------------------------------------------------------

const shortText = (max: number) => z.string().trim().max(max).optional();

/** Forme acceptée pour un brouillon corrigé par l'administrateur (tout le reste est refusé). */
export const PlacementSummaryDraftSchema = z.object({
  destination: z.string().trim().max(200),
  procedure: z.string().trim().max(200),
  sector: z.string().trim().max(200),
  experience: z.string().trim().max(200),
  languages: z.string().trim().max(300),
  profileSummary: z.string().trim().min(10).max(900),
  headline: shortText(160),
  highlights: z.array(z.string().trim().max(240)).max(MAX_HIGHLIGHTS).optional(),
  experiences: z.array(z.string().trim().max(420)).max(MAX_EXPERIENCES).optional(),
  education: z.array(z.string().trim().max(240)).max(MAX_EDUCATION).optional(),
  skills: z.array(z.string().trim().max(60)).max(MAX_SKILLS).optional(),
  availability: shortText(160),
});

/**
 * Brouillon final = champs relus par l'administrateur (nettoyés des coordonnées) + éléments imposés par le dossier :
 * identité externe (prénom + initiale) et pièces avec leur statut réel.
 */
export function normalizePlacementSummaryDraft(
  edited: unknown,
  base: Pick<PlacementSummaryDraft, "firstName" | "identity" | "documents">,
): PlacementSummaryDraft {
  const parsed = PlacementSummaryDraftSchema.parse(edited);
  const highlights = (parsed.highlights ?? []).map((line) => sanitizeSummaryText(line, "", 240)).filter(Boolean);
  const headline = parsed.headline ? sanitizeSummaryText(parsed.headline, "", 160) : "";
  const clean = (lines: string[] | undefined, max: number) => (lines ?? []).map((line) => sanitizeSummaryText(line, "", max)).filter(Boolean);
  const experiences = clean(parsed.experiences, 420);
  const education = clean(parsed.education, 240);
  const skills = clean(parsed.skills, 60);
  const availability = parsed.availability ? sanitizeSummaryText(parsed.availability, "", 160) : "";
  return {
    firstName: base.firstName,
    identity: base.identity,
    destination: sanitizeSummaryText(parsed.destination),
    procedure: sanitizeSummaryText(parsed.procedure),
    sector: sanitizeSummaryText(parsed.sector),
    experience: sanitizeSummaryText(parsed.experience),
    languages: sanitizeSummaryText(parsed.languages),
    profileSummary: sanitizeSummaryText(parsed.profileSummary, "Profil préparé et suivi par 3M."),
    ...(headline ? { headline } : {}),
    ...(highlights.length ? { highlights } : {}),
    ...(experiences.length ? { experiences } : {}),
    ...(education.length ? { education } : {}),
    ...(skills.length ? { skills } : {}),
    ...(availability ? { availability } : {}),
    documents: base.documents,
  };
}

/** Empreinte de ce que la fiche dit. */
export function fingerprintPlacementSummary(draft: PlacementSummaryDraft) {
  return createHash("sha256").update(JSON.stringify(draft)).digest("hex");
}

/**
 * Empreinte des SOURCES de la fiche (dossier, pièces, accord photo, photo disponible). Elle ne dépend pas des
 * corrections de l'administrateur : une fiche validée repasse « à revalider » seulement si le dossier a changé.
 */
export function fingerprintPlacementSources(input: { draft: PlacementSummaryDraft; fullName: string; photoConsent: boolean; photoId: number | null }) {
  const sources = {
    fullName: input.fullName,
    destination: input.draft.destination,
    procedure: input.draft.procedure,
    sector: input.draft.sector,
    experience: input.draft.experience,
    languages: input.draft.languages,
    documents: input.draft.documents,
    photoConsent: input.photoConsent,
    photoId: input.photoConsent ? input.photoId : null,
  };
  return createHash("sha256").update(JSON.stringify(sources)).digest("hex");
}

// ---- Résumé tiré du CV -----------------------------------------------------------------------------------------------

export type SummaryFieldsFromCv = Pick<PlacementSummaryDraft, "headline" | "profileSummary" | "highlights" | "languages" | "experiences" | "education" | "skills">;

/**
 * Transforme le brouillon de CV (déjà généré à partir du CV du candidat, avec ses consentements) en champs de fiche.
 * Rien n'est inventé : seuls des éléments présents dans le brouillon de CV sont repris.
 */
export function summaryFieldsFromCvDraft(cv: CvDraft): SummaryFieldsFromCv {
  const period = (start?: string | null, end?: string | null) => (start || end ? ` (${[start, end].filter(Boolean).join(" – ")})` : "");
  const experiences = cv.experiences
    .filter((item) => item.role?.trim() || item.employer?.trim())
    .slice(0, 3)
    .map((item) => `${[item.role?.trim(), item.employer?.trim()].filter(Boolean).join(" — ")}${period(item.start, item.end)}`);
  const education = cv.education
    .filter((item) => item.degree?.trim())
    .slice(0, 1)
    .map((item) => `Formation : ${item.degree.trim()}${item.institution?.trim() ? `, ${item.institution.trim()}` : ""}${item.year ? ` (${item.year})` : ""}`);
  const skills = cv.skills.map((skill) => skill.trim()).filter(Boolean).slice(0, 6);
  const highlights = [...experiences, ...education, ...(skills.length ? [`Compétences : ${skills.join(", ")}`] : [])].slice(0, MAX_HIGHLIGHTS).map((line) => sanitizeSummaryText(line, "", 240));
  const languages = cv.languages
    .filter((item) => item.language?.trim())
    .map((item) => `${item.language.trim()}${item.level?.trim() ? ` (${item.level.trim()})` : ""}`)
    .join(", ");
  // Synthèse complète : parcours détaillé (poste, employeur, période, deux réalisations au plus), formation et compétences, tels que dans le CV.
  const fullExperiences = cv.experiences
    .filter((item) => item.role?.trim() || item.employer?.trim())
    .slice(0, MAX_EXPERIENCES)
    .map((item) => {
      const head = `${[item.role?.trim(), item.employer?.trim()].filter(Boolean).join(" — ")}${period(item.start, item.end)}`;
      const bullets = (item.bullets ?? []).map((bullet) => bullet.trim()).filter(Boolean).slice(0, 2);
      return sanitizeSummaryText(bullets.length ? `${head} : ${bullets.join(" ; ")}` : head, "", 420);
    });
  const fullEducation = cv.education
    .filter((item) => item.degree?.trim())
    .slice(0, MAX_EDUCATION)
    .map((item) => sanitizeSummaryText(`${item.degree.trim()}${item.institution?.trim() ? `, ${item.institution.trim()}` : ""}${item.year ? ` (${item.year})` : ""}`, "", 240));
  const allSkills = cv.skills.map((skill) => sanitizeSummaryText(skill, "", 60)).filter(Boolean).slice(0, MAX_SKILLS);
  const headline = cv.headline?.trim() || cv.experiences[0]?.role?.trim() || "";
  return {
    headline: headline ? sanitizeSummaryText(headline, "", 160) : undefined,
    profileSummary: sanitizeSummaryText(cv.summary, "Profil préparé et suivi par 3M."),
    highlights: highlights.length ? highlights : undefined,
    languages: languages ? sanitizeSummaryText(languages, "", 300) : "",
    experiences: fullExperiences.length ? fullExperiences : undefined,
    education: fullEducation.length ? fullEducation : undefined,
    skills: allSkills.length ? allSkills : undefined,
  };
}

// ---- PDF ---------------------------------------------------------------------------------------------------------------

export type SummaryPortrait = { data: Buffer; mime: "image/jpeg" | "image/png" };

const MAX_PORTRAIT_BYTES = 5 * 1024 * 1024;

/** Reconnaît JPEG / PNG par leur signature (jamais par l'extension ni le type annoncé). */
export function detectPortrait(buffer: Buffer | null | undefined): SummaryPortrait | null {
  if (!buffer || buffer.length < 8 || buffer.length > MAX_PORTRAIT_BYTES) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { data: buffer, mime: "image/jpeg" };
  if (buffer[0] === 0x89 && buffer.subarray(1, 4).toString("ascii") === "PNG") return { data: buffer, mime: "image/png" };
  return null;
}

/** Les polices standard du PDF ne couvrent que Windows-1252 : les signes typographiques sont ramenés à leur forme simple. */
export function pdfSafe(value: string): string {
  return value
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—−]/g, "-")
    .replace(/…/g, "...")
    .replace(/[   ]/g, " ")
    .replace(/[^\x20-\x7e¡-ÿ]/g, "");
}

export type SummaryPdfOptions = {
  portrait?: SummaryPortrait | null;
  reference?: string | null;
  generatedAt?: Date;
};

const NAVY: [number, number, number] = [23, 55, 94];
const BLUE: [number, number, number] = [43, 108, 184];
const INK: [number, number, number] = [30, 41, 59];
const MUTED: [number, number, number] = [100, 116, 139];

export function buildPlacementSummaryPdf(draft: PlacementSummaryDraft, options: SummaryPdfOptions = {}): Buffer {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = 210;
  const logo = loadBrandLogoSync();
  const letterhead: LetterheadOptions = {
    logoDataUri: logo?.dataUri,
    logoFormat: logo?.format,
    documentKind: "Fiche de synthèse candidat",
    reference: options.reference ?? null,
    dateLabel: (options.generatedAt ?? new Date()).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Douala" }),
  };
  const layout = letterheadLayout(letterhead);
  const margin = layout.marginLeft;
  const bottom = layout.contentBottom;
  const portrait = options.portrait && detectPortrait(options.portrait.data) ? options.portrait : null;
  const textWidthFull = pageWidth - margin * 2;
  const portraitWidth = 38;
  const portraitHeight = 48;
  const textWidthBesidePortrait = textWidthFull - portraitWidth - 6;
  let y = 0;
  let page = 1;

  const ensureRoom = (needed: number) => {
    if (y + needed <= bottom) return;
    pdf.addPage();
    page += 1;
    y = layout.nextPageTop;
  };
  const write = (text: string, x: number, size: number, style: "normal" | "bold", color: [number, number, number]) => {
    pdf.setFont("helvetica", style);
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
    pdf.text(pdfSafe(text), x, y);
  };
  const paragraph = (text: string, size: number, width: number, lineHeight: number, color = INK, indent = 0) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(pdfSafe(text), width - indent) as string[];
    for (const line of lines) {
      ensureRoom(lineHeight);
      pdf.setTextColor(...color);
      pdf.text(line, margin + indent, y);
      y += lineHeight;
    }
  };
  const sectionTitle = (title: string) => {
    ensureRoom(14);
    y += 4;
    write(title.toUpperCase(), margin, 8.5, "bold", BLUE);
    pdf.setDrawColor(203, 213, 225);
    pdf.line(margin, y + 1.5, pageWidth - margin, y + 1.5);
    y += 6.5;
  };

  // Identité (+ portrait à droite si autorisé)
  const identityTop = layout.firstPageTop + 4;
  if (portrait) {
    const x = pageWidth - margin - portraitWidth;
    try {
      pdf.addImage(portrait.data.toString("base64"), portrait.mime === "image/png" ? "PNG" : "JPEG", x, identityTop - 4, portraitWidth, portraitHeight, undefined, "FAST");
      pdf.setDrawColor(203, 213, 225);
      pdf.roundedRect(x, identityTop - 4, portraitWidth, portraitHeight, 1.5, 1.5, "S");
    } catch {
      // Photo illisible : la fiche reste complète sans portrait.
    }
  }
  const identityWidth = portrait ? textWidthBesidePortrait : textWidthFull;
  y = identityTop + 4;
  write(draft.identity, margin, 20, "bold", NAVY);
  y += 7.5;
  if (draft.headline) paragraph(draft.headline, 12, identityWidth, 5.5, INK);
  y += 1.5;
  paragraph([draft.destination, draft.procedure, draft.sector].filter(Boolean).join("  |  "), 9.5, identityWidth, 4.8, MUTED);
  y = Math.max(y, portrait ? identityTop - 4 + portraitHeight + 2 : y);

  // Bandeau d'état du dossier : calculé depuis les pièces réelles (jamais saisi à la main).
  const totalDocuments = draft.documents.length;
  const validatedDocuments = draft.documents.filter((document) => document.status === "Validé").length;
  const complete = totalDocuments > 0 && validatedDocuments === totalDocuments;
  y += 2;
  ensureRoom(12);
  const bannerTop = y;
  pdf.setFillColor(...(complete ? ([220, 252, 231] as [number, number, number]) : ([254, 243, 199] as [number, number, number])));
  pdf.roundedRect(margin, bannerTop, textWidthFull, 9, 1.5, 1.5, "F");
  y = bannerTop + 6;
  write(complete ? `Dossier complet : ${totalDocuments} pièce(s) validée(s) par 3M, prêt pour présentation` : totalDocuments > 0 ? `Dossier en cours : ${validatedDocuments} pièce(s) validée(s) sur ${totalDocuments}` : "Pièces en cours de collecte", margin + 3, 9.5, "bold", complete ? [21, 128, 61] : [180, 83, 9]);
  y = bannerTop + 12;

  sectionTitle("Profil");
  paragraph(draft.profileSummary, 10, textWidthFull, 5, INK);

  if (draft.highlights?.length) {
    sectionTitle("Points clés");
    for (const line of draft.highlights) {
      ensureRoom(6);
      write("-", margin, 10, "bold", BLUE);
      paragraph(line, 10, textWidthFull, 5, INK, 4);
      y += 0.8;
    }
  }

  const listSection = (title: string, lines: string[] | undefined) => {
    if (!lines?.length) return;
    sectionTitle(title);
    for (const line of lines) {
      ensureRoom(6);
      write("-", margin, 10, "bold", BLUE);
      paragraph(line, 10, textWidthFull, 5, INK, 4);
      y += 0.8;
    }
  };
  listSection("Parcours professionnel", draft.experiences);
  listSection("Formation", draft.education);
  if (draft.skills?.length) {
    sectionTitle("Compétences");
    paragraph(draft.skills.join("  |  "), 10, textWidthFull, 5, INK);
  }
  if (draft.availability) {
    sectionTitle("Disponibilité");
    paragraph(draft.availability, 10, textWidthFull, 5, INK);
  }

  sectionTitle("Expérience et langues");
  paragraph(`Expérience : ${draft.experience}`, 10, textWidthFull, 5, INK);
  paragraph(`Langues : ${draft.languages}`, 10, textWidthFull, 5, INK);

  sectionTitle("Pièces du dossier");
  if (draft.documents.length === 0) {
    paragraph("Aucune pièce référencée pour le moment.", 10, textWidthFull, 5, MUTED);
  } else {
    for (const document of draft.documents) {
      ensureRoom(5.5);
      write(document.type, margin, 10, "normal", INK);
      write(document.status, margin + 70, 10, "bold", document.status === "Validé" ? [21, 128, 61] : document.status === "À corriger" ? [185, 28, 28] : [180, 83, 9]);
      y += 5.5;
    }
  }

  y += 8;
  paragraph("Contact : 3M TRAVEL AGENCY uniquement. Les coordonnées du candidat sont transmises par l'agence.", 8.5, textWidthFull, 4, MUTED);
  applyLetterhead(pdf, letterhead);

  return Buffer.from(pdf.output("arraybuffer"));
}
