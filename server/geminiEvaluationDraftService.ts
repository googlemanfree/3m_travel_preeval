import { GoogleGenerativeAI } from "@google/generative-ai";

export type GeminiEvaluationDraftInput = {
  destinationCountry: string;
  projectType: "travail" | "etudes" | "tourisme";
  nationality?: string;
  age?: number;
  sector?: string;
  yearsOfExperience?: number;
  educationLevel?: string;
  languages?: string;
  financialGuarantee?: string;
  countryDetails: Record<string, string | number | boolean | undefined>;
  alternativeCountries?: string[];
};

export type GeminiOrientationAlternative = { country: string; rationale: string; checks: string[] };

export type GeminiEvaluationDraft = {
  summary: string;
  strengths: string[];
  gapsToClarify: string[];
  documentPriorities: string[];
  advisorQuestions: string[];
  alternatives: GeminiOrientationAlternative[];
  humanReviewRequired: true;
  disclaimer: string;
};

const DISCLAIMER = "Brouillon d’orientation interne fondé uniquement sur les réponses déclarées. Il ne constitue ni une décision, ni un avis juridique, ni une confirmation d’éligibilité, de visa, d’admission ou d’emploi. Une validation humaine et les sources officielles restent obligatoires.";

const list = (record: Record<string, unknown>, key: string, limit: number): string[] => Array.isArray(record[key]) ? record[key].filter((entry): entry is string => typeof entry === "string").map((entry) => entry.trim()).filter(Boolean).slice(0, limit) : [];

export function buildGeminiEvaluationPrompt(input: GeminiEvaluationDraftInput): string {
  const allowedAlternatives = (input.alternativeCountries ?? []).filter(Boolean).slice(0, 6);
  return `Tu prépares un brouillon interne d’orientation pour un conseiller de mobilité internationale. Tu ne dois utiliser que les informations déclarées ci-dessous. N’invente aucune règle, aucun seuil, aucune exigence officielle, aucun fait de marché ni aucune source. Ne conclus jamais à l’éligibilité, à l’inéligibilité, à l’obtention d’un visa, d’une admission ou d’un emploi. Ne donne ni durée, ni coût, ni salaire, ni promesse de résultat. Signale les informations manquantes et les éléments à vérifier sur les sources officielles.

Pour les alternatives, propose au plus 3 pistes UNIQUEMENT parmi cette liste autorisée : ${allowedAlternatives.join(", ") || "aucune"}. Chaque piste est une comparaison à vérifier, jamais une redirection automatique ou une qualification réglementaire.

Réponds UNIQUEMENT en JSON valide avec les clés summary (string, 600 caractères max), strengths (array max 4), gapsToClarify (array max 6), documentPriorities (array max 6), advisorQuestions (array max 5), alternatives (array max 3 d’objets {country, rationale, checks}), humanReviewRequired (true), disclaimer (string). Utilise le français.

Données déclarées :
${JSON.stringify(input)}`;
}

function normalizeDraft(value: unknown, allowedAlternatives: string[] = []): GeminiEvaluationDraft {
  const record = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const allowed = new Set(allowedAlternatives);
  const alternatives = Array.isArray(record.alternatives) ? record.alternatives.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object").map((item) => ({ country: typeof item.country === "string" ? item.country.trim() : "", rationale: typeof item.rationale === "string" ? item.rationale.trim().slice(0, 360) : "", checks: list(item, "checks", 4) })).filter((item) => allowed.has(item.country) && item.rationale).slice(0, 3) : [];
  return { summary: typeof record.summary === "string" ? record.summary.trim().slice(0, 600) : "Informations à examiner par un conseiller.", strengths: list(record, "strengths", 4), gapsToClarify: list(record, "gapsToClarify", 6), documentPriorities: list(record, "documentPriorities", 6), advisorQuestions: list(record, "advisorQuestions", 5), alternatives, humanReviewRequired: true, disclaimer: DISCLAIMER };
}

export async function generateGeminiEvaluationDraft(input: GeminiEvaluationDraftInput, apiKey = process.env.GEMINI_API_KEY): Promise<GeminiEvaluationDraft> {
  if (!apiKey) throw new Error("Configuration Gemini indisponible.");
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: "gemini-3.6-flash", generationConfig: { temperature: 0.1, responseMimeType: "application/json" } });
  const response = await model.generateContent(buildGeminiEvaluationPrompt(input));
  try { return normalizeDraft(JSON.parse(response.response.text()), input.alternativeCountries); } catch { return normalizeDraft({ summary: response.response.text() }, input.alternativeCountries); }
}
