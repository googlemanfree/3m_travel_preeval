import { invokeLLM, listLLMModels } from "../_core/llm";

export const ADMIN_DOCUMENT_TYPES = ["cv", "passeport", "diplome", "releve_notes", "photo", "justificatif_domicile", "extrait_naissance", "casier_judiciaire", "justificatif_paiement", "autre"] as const;
export type AdminDocumentType = (typeof ADMIN_DOCUMENT_TYPES)[number];

export type AdminDocumentRecognition = {
  documentType: AdminDocumentType;
  confidence: number;
  suggestedFolder: string;
  summary: string;
  reviewRequired: true;
};

const fallback = (fileName: string): AdminDocumentRecognition => ({
  documentType: "autre",
  confidence: 0,
  suggestedFolder: "À classer",
  summary: `Suggestion indisponible pour ${fileName}. Sélectionnez manuellement le type de pièce.`,
  reviewRequired: true,
});

export async function suggestAdminDocumentMetadata(input: { fileName: string; mimeType: string; dataUrl: string }): Promise<AdminDocumentRecognition> {
  try {
    const { data: models } = await listLLMModels();
    const model = models.find((entry) => entry.id === "gemini-3-flash-preview")?.id ?? models.find((entry) => entry.id.startsWith("gpt-5-mini"))?.id;
    const visual = input.mimeType.startsWith("image/");
    const result = await invokeLLM({
      model,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: `Analyse ce document administratif pour une agence de mobilité. Nom du fichier : ${input.fileName}. Type MIME : ${input.mimeType}. Propose seulement une classification prudente. Ne déduis jamais de données personnelles, d’éligibilité ou de validité administrative.` },
          ...(visual ? [{ type: "image_url" as const, image_url: { url: input.dataUrl, detail: "low" as const } }] : []),
        ],
      }],
      outputSchema: {
        name: "admin_document_recognition",
        strict: true,
        schema: {
          type: "object",
          properties: {
            documentType: { type: "string", enum: [...ADMIN_DOCUMENT_TYPES] },
            confidence: { type: "number", minimum: 0, maximum: 100 },
            suggestedFolder: { type: "string" },
            summary: { type: "string" },
          },
          required: ["documentType", "confidence", "suggestedFolder", "summary"],
          additionalProperties: false,
        },
      },
    });
    const content = result.choices?.[0]?.message?.content;
    const parsed = JSON.parse(typeof content === "string" ? content : "{}") as Partial<AdminDocumentRecognition>;
    const documentType = ADMIN_DOCUMENT_TYPES.includes(parsed.documentType as AdminDocumentType) ? parsed.documentType as AdminDocumentType : "autre";
    return {
      documentType,
      confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 0)),
      suggestedFolder: String(parsed.suggestedFolder || "À vérifier").slice(0, 120),
      summary: String(parsed.summary || "Classification proposée : vérifiez avant enregistrement.").slice(0, 500),
      reviewRequired: true,
    };
  } catch (error) {
    console.warn("[Admin document recognition] suggestion unavailable", error);
    return fallback(input.fileName);
  }
}
