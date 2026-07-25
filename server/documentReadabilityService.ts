import { invokeLLM } from "./_core/llm";

export interface DocumentReadabilityAnalysis {
  isReadable: boolean;
  readabilityScore: number; // 0-100
  issues: string[];
  suggestions: string[];
  confidence: number; // 0-100
  analysisDetails: {
    textClarity: "excellent" | "good" | "fair" | "poor";
    imageQuality: "excellent" | "good" | "fair" | "poor";
    completeness: "complete" | "partial" | "incomplete";
    visibility: "clear" | "acceptable" | "blurry" | "illegible";
  };
}

/**
 * Analyse la lisibilité d'un document scanné en utilisant la vision par IA
 * @param imageUrl URL du document à analyser (base64 ou URL publique)
 * @param documentType Type de document (passport, cv, diploma, etc.)
 * @returns Analyse de lisibilité avec score et recommandations
 */
export async function analyzeDocumentReadability(
  imageUrl: string,
  documentType: string = "document"
): Promise<DocumentReadabilityAnalysis> {
  try {
    const systemPrompt = `You are an expert document quality analyst. Analyze the provided document image and evaluate its readability and quality for official/administrative purposes.

Evaluate the following aspects:
1. Text Clarity: Can all text be clearly read?
2. Image Quality: Is the image sharp, well-lit, and not blurry?
3. Completeness: Are all required parts of the document visible?
4. Visibility: Are there any obscured, faded, or illegible sections?

Respond with a JSON object containing:
- isReadable: boolean (true if document meets minimum standards)
- readabilityScore: number (0-100, where 100 is perfect)
- issues: array of identified problems
- suggestions: array of improvement suggestions
- confidence: number (0-100, confidence in the analysis)
- analysisDetails: object with textClarity, imageQuality, completeness, visibility (each as string)`;

    const userPrompt = `Please analyze this ${documentType} document for readability and quality. 
    
Provide your analysis in the following JSON format:
{
  "isReadable": boolean,
  "readabilityScore": number,
  "issues": ["issue1", "issue2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "confidence": number,
  "analysisDetails": {
    "textClarity": "excellent|good|fair|poor",
    "imageQuality": "excellent|good|fair|poor",
    "completeness": "complete|partial|incomplete",
    "visibility": "clear|acceptable|blurry|illegible"
  }
}`;

    const response = await invokeLLM({
      model: "gpt-5-mini", // Utiliser un modèle rapide et efficace
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ] as any,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "document_readability",
          strict: true,
          schema: {
            type: "object",
            properties: {
              isReadable: { type: "boolean" },
              readabilityScore: { type: "number", minimum: 0, maximum: 100 },
              issues: { type: "array", items: { type: "string" } },
              suggestions: { type: "array", items: { type: "string" } },
              confidence: { type: "number", minimum: 0, maximum: 100 },
              analysisDetails: {
                type: "object",
                properties: {
                  textClarity: {
                    type: "string",
                    enum: ["excellent", "good", "fair", "poor"],
                  },
                  imageQuality: {
                    type: "string",
                    enum: ["excellent", "good", "fair", "poor"],
                  },
                  completeness: {
                    type: "string",
                    enum: ["complete", "partial", "incomplete"],
                  },
                  visibility: {
                    type: "string",
                    enum: ["clear", "acceptable", "blurry", "illegible"],
                  },
                },
                required: ["textClarity", "imageQuality", "completeness", "visibility"],
              },
            },
            required: [
              "isReadable",
              "readabilityScore",
              "issues",
              "suggestions",
              "confidence",
              "analysisDetails",
            ],
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (!content || typeof content !== "string") {
      throw new Error("Invalid response from LLM");
    }

    const analysis = JSON.parse(content) as DocumentReadabilityAnalysis;
    return analysis;
  } catch (error) {
    console.error("Error analyzing document readability:", error);
    // En cas d'erreur, retourner une analyse par défaut conservatrice
    return {
      isReadable: false,
      readabilityScore: 0,
      issues: ["Impossible d'analyser le document. Veuillez réessayer."],
      suggestions: ["Assurez-vous que l'image est claire et bien lisible"],
      confidence: 0,
      analysisDetails: {
        textClarity: "poor",
        imageQuality: "poor",
        completeness: "incomplete",
        visibility: "illegible",
      },
    };
  }
}

/**
 * Analyse plusieurs documents en parallèle
 * @param imageUrls Liste des URLs des documents
 * @param documentTypes Liste des types de documents
 * @returns Liste des analyses
 */
export async function analyzeMultipleDocuments(
  imageUrls: string[],
  documentTypes: string[] = []
): Promise<DocumentReadabilityAnalysis[]> {
  const promises = imageUrls.map((url, index) => {
    const docType = documentTypes[index] || "document";
    return analyzeDocumentReadability(url, docType);
  });

  return Promise.all(promises);
}

/**
 * Génère un rapport de lisibilité global
 * @param analyses Liste des analyses individuelles
 * @returns Rapport global
 */
export function generateReadabilityReport(
  analyses: DocumentReadabilityAnalysis[]
): {
  overallScore: number;
  allReadable: boolean;
  issuesSummary: string[];
  suggestionsSummary: string[];
  detailedAnalysis: DocumentReadabilityAnalysis[];
} {
  const overallScore =
    analyses.length > 0
      ? Math.round(
          analyses.reduce((sum, a) => sum + a.readabilityScore, 0) /
            analyses.length
        )
      : 0;

  const allReadable = analyses.every((a) => a.isReadable);

  // Collecter les problèmes uniques
  const issuesSummary = Array.from(
    new Set(analyses.flatMap((a) => a.issues))
  ).slice(0, 5);

  // Collecter les suggestions uniques
  const suggestionsSummary = Array.from(
    new Set(analyses.flatMap((a) => a.suggestions))
  ).slice(0, 5);

  return {
    overallScore,
    allReadable,
    issuesSummary,
    suggestionsSummary,
    detailedAnalysis: analyses,
  };
}
