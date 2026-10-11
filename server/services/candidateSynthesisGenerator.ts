import { z } from "zod";
import {
  SYNTHESIS_BIO_OUTPUT_SCHEMA,
  SynthesisBioDraftSchema,
  type SynthesisBioDraft,
  type SynthesisContent,
} from "../../shared/candidateSynthesisSheet";
import { invokeLLM, type OutputSchema } from "../_core/llm";
import { GEMINI_EVALUATION_MODEL } from "../geminiEvaluationDraftService";
import type { CvExcerpt } from "./cvExcerpt";
import { cvAnalysisConsented, loadCvExcerpt } from "./cvTextLoader";
import {
  AI_UNAVAILABLE_MESSAGE,
  NO_CONSENT_MESSAGE,
  hasAnalysisConsent,
  serializeCvExcerpt,
  type EvaluationRowForDraft,
} from "./structuredEvaluationDraft";

export const SYNTHESIS_NO_CV_CONSENT = "Le candidat n’a pas donné son accord distinct à la lecture de son CV par l’IA.";
export const SYNTHESIS_NO_SHARE_CONSENT = "Le candidat n’a pas autorisé le partage de sa fiche de synthèse et de sa photo avec les employeurs et agences.";
export const SYNTHESIS_NO_CV = "Aucun CV exploitable n’est enregistré pour ce candidat.";
export const SYNTHESIS_INVALID = "Le brouillon renvoyé par le modèle est invalide : relancez la génération.";

export type SynthesisGenOutcome =
  | { ok: true; bio: SynthesisBioDraft; unverified: string[]; model: string }
  | { ok: false; error: string; reason: "no_consent" | "no_cv_consent" | "no_share_consent" | "no_cv" | "invalid_output" | "unavailable" };

export type SynthesisGenDeps = {
  invoke?: typeof invokeLLM;
  loadCv?: (cvFileUrl: string | null | undefined) => Promise<CvExcerpt | null>;
};

function contentOf(result: Awaited<ReturnType<typeof invokeLLM>>): string {
  const content = result.choices[0]?.message.content;
  if (typeof content === "string") return content;
  return content?.filter((part) => part.type === "text").map((part) => part.text).join("\n") ?? "";
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function unverifiedBio(bio: SynthesisBioDraft, cvText: string): string[] {
  const hay = normalize(cvText);
  const flags: string[] = [];
  const check = (label: string, value: string | null | undefined) => {
    if (!value?.trim()) return;
    const tokens = normalize(value).split(/\s+/).filter((token) => token.length >= 4);
    if (tokens.length && !tokens.every((token) => hay.includes(token))) flags.push(label);
  };
  check("Titre de profil", bio.profileTitle);
  for (const exp of bio.experiences) {
    check(`Expérience · ${exp.role}`, exp.role);
    check(`Employeur · ${exp.employer}`, exp.employer);
  }
  if (bio.education) check(`Formation · ${bio.education.degree}`, bio.education.degree);
  return flags.slice(0, 12);
}

export function buildSynthesisPrompt(input: { cvText: string; destination?: string | null; documentsSummary: string }): string {
  return `Tu prépares un BROUILLON de fiche de synthèse (1 page) pour un administrateur de 3M TRAVEL AGENCY.
Cette fiche sera relue puis, seulement après validation, proposée à des employeurs / agences de placement.

Règles absolues :
- N’utilise QUE les faits présents dans <cv_excerpt>. N’invente rien.
- Information absente → null / liste vide. Pas de déduction.
- Aucune coordonnée (e-mail, téléphone, adresse, n° de document, date de naissance).
- Pas de note, score, taux de réussite ni jugement subjectif.
- Maximum 3 expériences, résumé 3–4 phrases, compétences et langues factuelles.
- Destination indicative : ${input.destination || "non précisée"}.
- Les pièces déjà structurées (ne pas les inventer) : ${input.documentsSummary}

<cv_excerpt>
${serializeCvExcerpt(input.cvText)}
</cv_excerpt>`;
}

export async function generateSynthesisBio(
  row: EvaluationRowForDraft,
  options: { shareConsentGranted: boolean; documentsSummary: string },
  deps: SynthesisGenDeps = {},
): Promise<SynthesisGenOutcome> {
  if (!options.shareConsentGranted) return { ok: false, reason: "no_share_consent", error: SYNTHESIS_NO_SHARE_CONSENT };
  if (!hasAnalysisConsent(row)) return { ok: false, reason: "no_consent", error: NO_CONSENT_MESSAGE };
  if (!cvAnalysisConsented(row)) return { ok: false, reason: "no_cv_consent", error: SYNTHESIS_NO_CV_CONSENT };
  const cv = await (deps.loadCv ?? loadCvExcerpt)(row.cvFileUrl);
  if (!cv) return { ok: false, reason: "no_cv", error: SYNTHESIS_NO_CV };
  try {
    const result = await (deps.invoke ?? invokeLLM)({
      model: GEMINI_EVALUATION_MODEL,
      maxTokens: 2200,
      outputSchema: SYNTHESIS_BIO_OUTPUT_SCHEMA as unknown as OutputSchema,
      messages: [
        { role: "system", content: "Tu rédiges une fiche de synthèse interne factuelle. JSON strict. Aucune invention." },
        { role: "user", content: buildSynthesisPrompt({ cvText: cv.text, destination: row.destinationCountry, documentsSummary: options.documentsSummary }) },
      ],
    });
    const content = contentOf(result).trim();
    if (!content) return { ok: false, reason: "invalid_output", error: SYNTHESIS_INVALID };
    const parsed = SynthesisBioDraftSchema.parse(JSON.parse(content));
    const bio: SynthesisBioDraft = {
      profileTitle: parsed.profileTitle ?? null,
      summary: parsed.summary ?? null,
      experiences: parsed.experiences.map((item) => ({
        role: item.role,
        employer: item.employer,
        period: item.period ?? null,
      })),
      education: parsed.education
        ? {
            degree: parsed.education.degree,
            institution: parsed.education.institution ?? null,
            year: parsed.education.year ?? null,
          }
        : null,
      skills: parsed.skills,
      languages: parsed.languages.map((item) => ({
        language: item.language,
        level: item.level ?? null,
      })),
      missing: parsed.missing,
    };
    return { ok: true, bio, unverified: unverifiedBio(bio, cv.text), model: GEMINI_EVALUATION_MODEL };
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof z.ZodError) return { ok: false, reason: "invalid_output", error: SYNTHESIS_INVALID };
    console.error("[synthesis] modèle indisponible", error instanceof Error ? error.message.slice(0, 300) : error);
    return { ok: false, reason: "unavailable", error: AI_UNAVAILABLE_MESSAGE };
  }
}

export function mergeBioIntoContent(base: SynthesisContent, bio: SynthesisBioDraft): SynthesisContent {
  return {
    ...base,
    profileTitle: bio.profileTitle,
    summary: bio.summary,
    experiences: bio.experiences.slice(0, 3),
    education: bio.education,
    skills: bio.skills.slice(0, 12),
    languages: bio.languages.slice(0, 8),
    missing: Array.from(new Set([...(bio.missing || []), ...(base.missing || [])])).slice(0, 16),
    generatedAtLabel: new Date().toLocaleDateString("fr-FR"),
  };
}
