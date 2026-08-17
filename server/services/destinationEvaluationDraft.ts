import { invokeLLM } from "../_core/llm";

export const evaluationDestinations = ["canada", "luxembourg", "europe"] as const;
export type EvaluationDestination = typeof evaluationDestinations[number];

export type DestinationEvaluationDraft = {
  destination: EvaluationDestination;
  modelLabel: string;
  finalScore: number;
  verdict: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  criteria: {
    education: number;
    experience: number;
    languages: number;
    market: number;
    profile: number;
  };
  checklist: string[];
  humanReviewRequired: true;
};

type ApplicationSnapshot = {
  fullName: string;
  destination: string | null;
  academicLevel: string | null;
  diplomaTitle: string | null;
  fieldOfStudy: string | null;
  experienceYears: number | null;
  currentJobTitle: string | null;
  jobSector: string | null;
  languageSkills: string | null;
  nationality: string | null;
  age: number | null;
};

const destinationGuidance: Record<EvaluationDestination, { label: string; focus: string; checklist: string[] }> = {
  canada: {
    label: "Canada — évaluation préliminaire",
    focus: "Vérifier le niveau linguistique officiel, le niveau d’études, l’expérience qualifiée et les critères du programme applicable au moment de la demande.",
    checklist: ["Passeport valide", "Diplômes et relevés", "Résultat linguistique officiel si requis", "Preuves d’expérience", "CV actualisé"],
  },
  luxembourg: {
    label: "Luxembourg — évaluation préliminaire",
    focus: "Vérifier l’adéquation du métier, l’offre d’employeur, les conditions d’autorisation applicables et les justificatifs professionnels.",
    checklist: ["Passeport valide", "Diplômes et relevés", "Attestations d’emploi", "Contrats et bulletins de paie", "CV actualisé"],
  },
  europe: {
    label: "Europe — évaluation préliminaire",
    focus: "Vérifier le pays cible, la disponibilité d’une offre, les exigences de visa ou permis et les conditions prévues par l’employeur.",
    checklist: ["Passeport valide", "CV actualisé", "Diplômes et relevés", "Preuves d’expérience", "Documents spécifiques au pays et au poste"],
  },
};

function contentFrom(result: Awaited<ReturnType<typeof invokeLLM>>): string {
  const value = result.choices[0]?.message.content;
  if (typeof value === "string") return value;
  return value?.filter((part) => part.type === "text").map((part) => part.text).join("\n") || "";
}

function asScore(value: unknown, max: number): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(max, Math.round(numeric))) : 0;
}

function strings(value: unknown, max: number): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, max) : [];
}

export async function generateDestinationEvaluationDraft(application: ApplicationSnapshot, destination: EvaluationDestination): Promise<DestinationEvaluationDraft> {
  const guide = destinationGuidance[destination];
  const profile = {
    nom: application.fullName,
    age: application.age ?? "Non renseigné",
    formation: application.diplomaTitle || application.academicLevel || "Non renseigné",
    domaine: application.fieldOfStudy || application.jobSector || "Non renseigné",
    experienceAnnees: application.experienceYears ?? "Non renseigné",
    poste: application.currentJobTitle || "Non renseigné",
    langues: application.languageSkills || "Non renseigné",
    nationalite: application.nationality || "Non renseigné",
  };
  const result = await invokeLLM({
    model: "gpt-5-mini",
    maxTokens: 1300,
    outputSchema: {
      name: "destination_evaluation_draft",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          verdict: { type: "string" },
          strengths: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
          weaknesses: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
          recommendations: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 6 },
          criteria: {
            type: "object",
            additionalProperties: false,
            properties: {
              education: { type: "integer", minimum: 0, maximum: 20 },
              experience: { type: "integer", minimum: 0, maximum: 20 },
              languages: { type: "integer", minimum: 0, maximum: 15 },
              market: { type: "integer", minimum: 0, maximum: 30 },
              profile: { type: "integer", minimum: 0, maximum: 15 },
            },
            required: ["education", "experience", "languages", "market", "profile"],
          },
        },
        required: ["verdict", "strengths", "weaknesses", "recommendations", "criteria"],
      },
    },
    messages: [
      { role: "system", content: "Tu aides un conseiller de mobilité internationale. N’invente aucun fait. Toute donnée absente doit être décrite comme à vérifier. Ne promets jamais un visa, un emploi, une admission ou un délai. Réponds seulement au JSON conforme." },
      { role: "user", content: `Prépare un brouillon interne pour ${guide.label}. Profil déclaré : ${JSON.stringify(profile)}. Objectif destination : ${guide.focus}.

Applique la grille interne sur 100 points : formation /20, expérience /20, langues /15, adéquation indicative marché /30, profil et cohérence /15. Le score final sera recalculé par le système. Rédige un verdict prudent, des atouts uniquement fondés sur le profil, des points à vérifier et des recommandations concrètes de pièces ou actions. La validation humaine est obligatoire avant envoi.` },
    ],
  });
  const raw = JSON.parse(contentFrom(result)) as Record<string, unknown>;
  const criteriaSource = (raw.criteria || {}) as Record<string, unknown>;
  const criteria = {
    education: asScore(criteriaSource.education, 20),
    experience: asScore(criteriaSource.experience, 20),
    languages: asScore(criteriaSource.languages, 15),
    market: asScore(criteriaSource.market, 30),
    profile: asScore(criteriaSource.profile, 15),
  };
  return {
    destination,
    modelLabel: guide.label,
    finalScore: criteria.education + criteria.experience + criteria.languages + criteria.market + criteria.profile,
    verdict: typeof raw.verdict === "string" ? raw.verdict.trim() : "Évaluation préliminaire à vérifier par un conseiller.",
    strengths: strings(raw.strengths, 5),
    weaknesses: strings(raw.weaknesses, 5),
    recommendations: strings(raw.recommendations, 6),
    criteria,
    checklist: guide.checklist,
    humanReviewRequired: true,
  };
}
