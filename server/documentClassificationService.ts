import { invokeLLM } from "./_core/llm";

export type DocumentType =
  | "passport"
  | "national_id"
  | "driver_license"
  | "diploma"
  | "certificate"
  | "cv"
  | "cover_letter"
  | "employment_contract"
  | "bank_statement"
  | "proof_of_residence"
  | "marriage_certificate"
  | "birth_certificate"
  | "visa"
  | "travel_document"
  | "insurance_document"
  | "medical_document"
  | "educational_transcript"
  | "language_test"
  | "other";

export interface DocumentClassification {
  documentType: DocumentType;
  confidence: number; // 0-100
  description: string;
  suggestedFolder: string;
  extractedInfo?: {
    documentNumber?: string;
    issueDate?: string;
    expiryDate?: string;
    issuingCountry?: string;
    holderName?: string;
  };
  warnings?: string[];
}

/**
 * Identifie automatiquement le type de document à partir d'une image
 * @param imageUrl URL du document (base64 ou URL publique)
 * @returns Classification du document avec type, confiance et informations extraites
 */
export async function classifyDocument(
  imageUrl: string
): Promise<DocumentClassification> {
  try {
    const systemPrompt = `You are an expert document classifier. Analyze the provided document image and identify its type with high accuracy.

Classify the document into one of these categories:
- passport: International travel document
- national_id: National identity card
- driver_license: Driver's license
- diploma: Educational diploma or degree
- certificate: Professional or educational certificate
- cv: Curriculum Vitae or resume
- cover_letter: Cover letter or motivation letter
- employment_contract: Employment contract or job offer
- bank_statement: Bank statement or financial document
- proof_of_residence: Proof of residence (utility bill, lease, etc.)
- marriage_certificate: Marriage certificate
- birth_certificate: Birth certificate
- visa: Visa or visa sticker
- travel_document: Travel document or travel permit
- insurance_document: Insurance document
- medical_document: Medical document or health certificate
- educational_transcript: Educational transcript or school records
- language_test: Language test result (TOEFL, IELTS, etc.)
- other: Other document type

Respond with a JSON object containing:
- documentType: string (one of the categories above)
- confidence: number (0-100, how confident you are in the classification)
- description: string (brief description of what the document is)
- suggestedFolder: string (suggested folder name for organization)
- extractedInfo: object with optional fields (documentNumber, issueDate, expiryDate, issuingCountry, holderName)
- warnings: array of strings (any issues or concerns about the document)`;

    const userPrompt = `Please analyze this document and classify it. Provide your analysis in the following JSON format:
{
  "documentType": "string",
  "confidence": number,
  "description": "string",
  "suggestedFolder": "string",
  "extractedInfo": {
    "documentNumber": "string or null",
    "issueDate": "string or null",
    "expiryDate": "string or null",
    "issuingCountry": "string or null",
    "holderName": "string or null"
  },
  "warnings": ["warning1", "warning2"]
}`;

    const response = await invokeLLM({
      model: "gpt-5-mini",
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
          name: "document_classification",
          strict: true,
          schema: {
            type: "object",
            properties: {
              documentType: {
                type: "string",
                enum: [
                  "passport",
                  "national_id",
                  "driver_license",
                  "diploma",
                  "certificate",
                  "cv",
                  "cover_letter",
                  "employment_contract",
                  "bank_statement",
                  "proof_of_residence",
                  "marriage_certificate",
                  "birth_certificate",
                  "visa",
                  "travel_document",
                  "insurance_document",
                  "medical_document",
                  "educational_transcript",
                  "language_test",
                  "other",
                ],
              },
              confidence: { type: "number", minimum: 0, maximum: 100 },
              description: { type: "string" },
              suggestedFolder: { type: "string" },
              extractedInfo: {
                type: "object",
                properties: {
                  documentNumber: { type: ["string", "null"] },
                  issueDate: { type: ["string", "null"] },
                  expiryDate: { type: ["string", "null"] },
                  issuingCountry: { type: ["string", "null"] },
                  holderName: { type: ["string", "null"] },
                },
              },
              warnings: { type: "array", items: { type: "string" } },
            },
            required: [
              "documentType",
              "confidence",
              "description",
              "suggestedFolder",
              "warnings",
            ],
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (!content || typeof content !== "string") {
      throw new Error("Invalid response from LLM");
    }

    const classification = JSON.parse(content) as DocumentClassification;
    return classification;
  } catch (error) {
    console.error("Error classifying document:", error);
    // En cas d'erreur, retourner une classification par défaut
    return {
      documentType: "other",
      confidence: 0,
      description: "Impossible de classifier le document",
      suggestedFolder: "autres",
      warnings: ["Classification échouée. Veuillez vérifier manuellement."],
    };
  }
}

/**
 * Classifie plusieurs documents en parallèle
 * @param imageUrls Liste des URLs des documents
 * @returns Liste des classifications
 */
export async function classifyMultipleDocuments(
  imageUrls: string[]
): Promise<DocumentClassification[]> {
  const promises = imageUrls.map((url) => classifyDocument(url));
  return Promise.all(promises);
}

/**
 * Organise les documents classifiés par type
 * @param classifications Liste des classifications
 * @returns Objet groupé par type de document
 */
export function organizeDocumentsByType(
  classifications: DocumentClassification[]
): Record<string, DocumentClassification[]> {
  const organized: Record<string, DocumentClassification[]> = {};

  classifications.forEach((classification) => {
    const type = classification.documentType;
    if (!organized[type]) {
      organized[type] = [];
    }
    organized[type].push(classification);
  });

  return organized;
}

/**
 * Génère un rapport de classification
 * @param classifications Liste des classifications
 * @returns Rapport avec statistiques
 */
export function generateClassificationReport(
  classifications: DocumentClassification[]
): {
  totalDocuments: number;
  byType: Record<string, number>;
  highConfidence: number; // >= 80%
  mediumConfidence: number; // 50-79%
  lowConfidence: number; // < 50%
  documentsWithWarnings: number;
  extractedData: {
    passports: string[];
    ids: string[];
    diplomas: string[];
    other: string[];
  };
} {
  const byType: Record<string, number> = {};
  let highConfidence = 0;
  let mediumConfidence = 0;
  let lowConfidence = 0;
  let documentsWithWarnings = 0;

  const extractedData = {
    passports: [] as string[],
    ids: [] as string[],
    diplomas: [] as string[],
    other: [] as string[],
  };

  classifications.forEach((classification) => {
    // Compter par type
    byType[classification.documentType] =
      (byType[classification.documentType] || 0) + 1;

    // Compter par confiance
    if (classification.confidence >= 80) {
      highConfidence++;
    } else if (classification.confidence >= 50) {
      mediumConfidence++;
    } else {
      lowConfidence++;
    }

    // Compter les avertissements
    if (classification.warnings && classification.warnings.length > 0) {
      documentsWithWarnings++;
    }

    // Extraire les données
    const info = classification.extractedInfo;
    if (info?.holderName) {
      if (classification.documentType === "passport") {
        extractedData.passports.push(info.holderName);
      } else if (
        classification.documentType === "national_id" ||
        classification.documentType === "driver_license"
      ) {
        extractedData.ids.push(info.holderName);
      } else if (classification.documentType === "diploma") {
        extractedData.diplomas.push(info.holderName);
      } else {
        extractedData.other.push(info.holderName);
      }
    }
  });

  return {
    totalDocuments: classifications.length,
    byType,
    highConfidence,
    mediumConfidence,
    lowConfidence,
    documentsWithWarnings,
    extractedData,
  };
}

/**
 * Mappe les types de documents aux dossiers d'organisation
 */
export const documentTypeToFolder: Record<DocumentType, string> = {
  passport: "Identité/Passeport",
  national_id: "Identité/Carte d'Identité",
  driver_license: "Identité/Permis de Conduire",
  diploma: "Éducation/Diplômes",
  certificate: "Éducation/Certificats",
  cv: "Professionnel/CV",
  cover_letter: "Professionnel/Lettres",
  employment_contract: "Professionnel/Contrats",
  bank_statement: "Financier/Relevés Bancaires",
  proof_of_residence: "Résidence/Preuves",
  marriage_certificate: "État Civil/Mariage",
  birth_certificate: "État Civil/Naissance",
  visa: "Visas/Visas Obtenus",
  travel_document: "Voyage/Documents",
  insurance_document: "Assurance/Documents",
  medical_document: "Médical/Documents",
  educational_transcript: "Éducation/Relevés",
  language_test: "Langues/Tests",
  other: "Autres/Divers",
};
