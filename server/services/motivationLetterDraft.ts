import { z } from "zod";
import type { CvDraft, CvLanguage } from "../../shared/cvDraft";
import { invokeLLM } from "../_core/llm";
import { GEMINI_EVALUATION_MODEL } from "../geminiEvaluationDraftService";
import { AI_UNAVAILABLE_MESSAGE } from "./structuredEvaluationDraft";

/**
 * Brouillon de lettre de motivation à partir du CV relu (pas du fichier brut).
 * Relu par l’admin avant publication dans le pack candidature.
 */

export const MOTIVATION_INVALID_MESSAGE = "La lettre renvoyée par le modèle est invalide : relancez la génération.";

const LetterSchema = z.object({ letter: z.string().trim().min(80).max(4000) });

export type MotivationOutcome =
  | { ok: true; letter: string; model: string }
  | { ok: false; error: string; reason: "invalid_output" | "unavailable" };

export function buildMotivationPrompt(input: {
  language: CvLanguage;
  destination?: string | null;
  targetRole?: string | null;
  draft: CvDraft;
}): string {
  const language = input.language === "en" ? "anglais" : "français";
  const facts = [
    input.draft.headline ? `Titre : ${input.draft.headline}` : null,
    input.draft.summary ? `Profil : ${input.draft.summary}` : null,
    ...input.draft.experiences.slice(0, 3).map((item) => `Expérience : ${item.role} — ${item.employer}`),
    ...input.draft.education.slice(0, 2).map((item) => `Formation : ${item.degree}${item.institution ? ` — ${item.institution}` : ""}`),
    input.draft.skills.slice(0, 8).length ? `Compétences : ${input.draft.skills.slice(0, 8).join(", ")}` : null,
  ].filter(Boolean);

  return `Tu rédiges un BROUILLON de lettre de motivation pour un administrateur de 3M TRAVEL AGENCY. Il la relira avant de la publier dans l’espace candidat.

Règles :
- N’utilise QUE les faits listés ci-dessous (issus du CV relu). N’invente aucun employeur, diplôme, date ni résultat.
- Ne promets ni visa, ni emploi, ni admission. Ton professionnel, sobre, 250 à 450 mots.
- Rédige en ${language}.
- Destinataire générique (Madame, Monsieur / Dear Hiring Manager).
${input.destination ? `- Pays / marché visé : ${input.destination}` : ""}
${input.targetRole?.trim() ? `- Poste / métier visé : ${input.targetRole.trim().slice(0, 160)}` : ""}

Faits autorisés :
${facts.map((line) => `- ${line}`).join("\n")}

Réponds en JSON strict : { "letter": "…" }.`;
}

export async function generateMotivationLetter(
  input: { language: CvLanguage; destination?: string | null; targetRole?: string | null; draft: CvDraft },
  deps: { invoke?: typeof invokeLLM } = {},
): Promise<MotivationOutcome> {
  try {
    const result = await (deps.invoke ?? invokeLLM)({
      model: GEMINI_EVALUATION_MODEL,
      maxTokens: 1800,
      messages: [
        { role: "system", content: "Tu rédiges une lettre de motivation interne. Réponse JSON uniquement, sans invention." },
        { role: "user", content: buildMotivationPrompt(input) },
      ],
    });
    const content = result.choices[0]?.message.content;
    const raw = typeof content === "string" ? content : content?.filter((part) => part.type === "text").map((part) => part.text).join("\n") ?? "";
    const trimmed = raw.trim();
    if (!trimmed) return { ok: false, reason: "invalid_output", error: MOTIVATION_INVALID_MESSAGE };
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    const parsed = LetterSchema.parse(JSON.parse(jsonMatch?.[0] ?? trimmed));
    return { ok: true, letter: parsed.letter, model: GEMINI_EVALUATION_MODEL };
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof z.ZodError) return { ok: false, reason: "invalid_output", error: MOTIVATION_INVALID_MESSAGE };
    console.error("[motivationLetter] modèle indisponible", error instanceof Error ? error.message.slice(0, 300) : error);
    return { ok: false, reason: "unavailable", error: AI_UNAVAILABLE_MESSAGE };
  }
}
