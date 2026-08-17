import { invokeLLM, listLLMModels } from "../_core/llm";

export type EvisaCatalogueSuggestion = {
  requirements: string[];
  feeSuggestion: string;
  delaySuggestion: string;
  procedureSteps: string[];
  precautions: string[];
  adminReviewNote: string;
  requiresOfficialVerification: true;
};

function contentFrom(result: Awaited<ReturnType<typeof invokeLLM>>): string {
  const value = result.choices[0]?.message.content;
  return typeof value === "string" ? value : value?.filter((part) => part.type === "text").map((part) => part.text).join("\n") || "";
}

function list(value: unknown, max: number): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, max) : [];
}

export function sanitizeEvisaCatalogueSuggestion(raw: Record<string, unknown>): EvisaCatalogueSuggestion {
  const text = (value: unknown, fallback: string) => typeof value === "string" && value.trim() ? value.trim().slice(0, 1200) : fallback;
  return {
    requirements: list(raw.requirements, 12),
    feeSuggestion: text(raw.feeSuggestion, "À confirmer sur le portail officiel."),
    delaySuggestion: text(raw.delaySuggestion, "À confirmer sur le portail officiel."),
    procedureSteps: list(raw.procedureSteps, 10),
    precautions: list(raw.precautions, 8),
    adminReviewNote: text(raw.adminReviewNote, "Relire les suggestions et confirmer chaque élément sur le portail officiel avant publication."),
    requiresOfficialVerification: true,
  };
}

export async function suggestEvisaCatalogueFields(input: {
  country: string; region: string; visaType: string; officialPortalUrl: string; officialVerifiedAt: string;
  currentRequirements: string; currentFee: string; currentDelay: string; currentNotes: string;
}): Promise<EvisaCatalogueSuggestion> {
  const { data: models } = await listLLMModels();
  const model = models.find((entry) => entry.id === "gpt-5-mini")?.id;
  const result = await invokeLLM({
    model,
    maxTokens: 1100,
    outputSchema: {
      name: "evisa_catalogue_suggestion",
      strict: true,
      schema: {
        type: "object", additionalProperties: false,
        properties: {
          requirements: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 12 },
          feeSuggestion: { type: "string" }, delaySuggestion: { type: "string" },
          procedureSteps: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 10 },
          precautions: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 8 },
          adminReviewNote: { type: "string" },
        },
        required: ["requirements", "feeSuggestion", "delaySuggestion", "procedureSteps", "precautions", "adminReviewNote"],
      },
    },
    messages: [
      { role: "system", content: "Tu aides un administrateur à préparer un brouillon de fiche e‑Visa. Tu ne produis ni décision consulaire, ni éligibilité individuelle, ni garantie de frais ou délai. Tu ne crées aucune URL et tu ne présentes jamais une hypothèse comme une règle officielle. Utilise exclusivement les informations connues fournies ; lorsque l’information est absente ou incertaine, écris clairement « À confirmer sur le portail officiel ». Tes résultats restent un brouillon interne nécessitant validation humaine." },
      { role: "user", content: `Prépare des suggestions internes pour la destination suivante :
Pays : ${input.country}
Région : ${input.region}
Type de procédure : ${input.visaType}
Portail officiel connu : ${input.officialPortalUrl}
Date de dernière vérification : ${input.officialVerifiedAt}
Exigences déjà connues : ${input.currentRequirements || "Aucune"}
Frais déjà connus : ${input.currentFee || "Aucun"}
Délai déjà connu : ${input.currentDelay || "Aucun"}
Notes déjà connues : ${input.currentNotes || "Aucune"}

Retourne uniquement le JSON demandé. Reprends les informations connues lorsqu’elles sont fiables, propose des exigences génériques prudentes si nécessaire, et ajoute des précautions de vérification. La validation par un administrateur est obligatoire avant tout enregistrement.` },
    ],
  });
  return sanitizeEvisaCatalogueSuggestion(JSON.parse(contentFrom(result)) as Record<string, unknown>);
}
