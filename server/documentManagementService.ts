import { getDb } from "./db";
import { clientDocuments } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { DocumentClassification } from "./documentClassificationService";

export interface DocumentFolder {
  name: string;
  description: string;
  icon: string;
  requiredDocuments: string[];
  optionalDocuments: string[];
}

export const documentFolderStructure: Record<string, DocumentFolder> = {
  "Identité/Passeport": {
    name: "Identité/Passeport",
    description: "Documents d'identité - Passeport",
    icon: "🛂",
    requiredDocuments: ["passport"],
    optionalDocuments: ["national_id", "driver_license"],
  },
  "Identité/Carte d'Identité": {
    name: "Identité/Carte d'Identité",
    description: "Documents d'identité - Carte d'identité",
    icon: "🆔",
    requiredDocuments: ["national_id"],
    optionalDocuments: ["driver_license", "passport"],
  },
  "Identité/Permis de Conduire": {
    name: "Identité/Permis de Conduire",
    description: "Documents d'identité - Permis de conduire",
    icon: "🚗",
    requiredDocuments: ["driver_license"],
    optionalDocuments: ["national_id"],
  },
  "Éducation/Diplômes": {
    name: "Éducation/Diplômes",
    description: "Diplômes et certificats éducatifs",
    icon: "🎓",
    requiredDocuments: ["diploma", "certificate"],
    optionalDocuments: ["educational_transcript"],
  },
  "Éducation/Certificats": {
    name: "Éducation/Certificats",
    description: "Certificats professionnels et éducatifs",
    icon: "📜",
    requiredDocuments: ["certificate"],
    optionalDocuments: ["diploma"],
  },
  "Professionnel/CV": {
    name: "Professionnel/CV",
    description: "Curriculum Vitae et résumés",
    icon: "📄",
    requiredDocuments: ["cv"],
    optionalDocuments: ["cover_letter"],
  },
  "Professionnel/Lettres": {
    name: "Professionnel/Lettres",
    description: "Lettres de motivation et de recommandation",
    icon: "💌",
    requiredDocuments: ["cover_letter"],
    optionalDocuments: ["cv"],
  },
  "Professionnel/Contrats": {
    name: "Professionnel/Contrats",
    description: "Contrats d'emploi et offres d'emploi",
    icon: "📋",
    requiredDocuments: ["employment_contract"],
    optionalDocuments: ["employment_letter"],
  },
  "Financier/Relevés Bancaires": {
    name: "Financier/Relevés Bancaires",
    description: "Relevés bancaires et preuves financières",
    icon: "🏦",
    requiredDocuments: ["bank_statement"],
    optionalDocuments: [],
  },
  "Résidence/Preuves": {
    name: "Résidence/Preuves",
    description: "Preuves de résidence",
    icon: "🏠",
    requiredDocuments: ["proof_of_residence"],
    optionalDocuments: [],
  },
  "État Civil/Mariage": {
    name: "État Civil/Mariage",
    description: "Certificats de mariage",
    icon: "💍",
    requiredDocuments: ["marriage_certificate"],
    optionalDocuments: [],
  },
  "État Civil/Naissance": {
    name: "État Civil/Naissance",
    description: "Certificats de naissance",
    icon: "👶",
    requiredDocuments: ["birth_certificate"],
    optionalDocuments: [],
  },
  "Visas/Visas Obtenus": {
    name: "Visas/Visas Obtenus",
    description: "Visas et timbres de visa",
    icon: "✅",
    requiredDocuments: ["visa"],
    optionalDocuments: ["travel_document"],
  },
  "Voyage/Documents": {
    name: "Voyage/Documents",
    description: "Documents de voyage",
    icon: "✈️",
    requiredDocuments: ["travel_document"],
    optionalDocuments: ["visa"],
  },
  "Assurance/Documents": {
    name: "Assurance/Documents",
    description: "Documents d'assurance",
    icon: "🛡️",
    requiredDocuments: ["insurance_document"],
    optionalDocuments: [],
  },
  "Médical/Documents": {
    name: "Médical/Documents",
    description: "Documents médicaux et certificats de santé",
    icon: "🏥",
    requiredDocuments: ["medical_document", "medical_exam"],
    optionalDocuments: [],
  },
  "Langues/Tests": {
    name: "Langues/Tests",
    description: "Résultats de tests de langue",
    icon: "🗣️",
    requiredDocuments: ["language_test"],
    optionalDocuments: [],
  },
  "Autres/Divers": {
    name: "Autres/Divers",
    description: "Autres documents",
    icon: "📁",
    requiredDocuments: ["other"],
    optionalDocuments: [],
  },
};

/**
 * Sauvegarde la classification d'un document dans la base de données
 */
export async function saveDocumentClassification(
  evaluationId: number,
  candidateEmail: string,
  documentName: string,
  documentUrl: string,
  fileSize: number,
  classification: DocumentClassification,
  source: "online" | "scanned_agency" | "manual_admin" = "online"
): Promise<any> {
  const db = await getDb();

  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(clientDocuments).values({
      evaluationId,
      candidateEmail,
      documentType: classification.documentType as any,
      documentName,
      documentUrl,
      fileSize,
      source,
      uploadedAt: new Date(),
      aiClassification: JSON.stringify(classification),
      aiClassificationConfidence: classification.confidence,
      aiClassifiedAt: new Date(),
      suggestedFolder: classification.suggestedFolder,
      extractedData: JSON.stringify(classification.extractedInfo || {}),
      status: "pending",
    });

    return result;
  } catch (error) {
    console.error("Error saving document classification:", error);
    throw error;
  }
}

/**
 * Récupère tous les documents d'un candidat groupés par dossier
 */
export async function getDocumentsByFolder(
  candidateEmail: string
): Promise<Record<string, any[]>> {
  const db = await getDb();

  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const documents = await db
      .select()
      .from(clientDocuments)
      .where(eq(clientDocuments.candidateEmail, candidateEmail));

    const grouped: Record<string, any[]> = {};

    documents.forEach((doc: any) => {
      const folder = doc.suggestedFolder || "Autres/Divers";
      if (!grouped[folder]) {
        grouped[folder] = [];
      }
      grouped[folder].push(doc);
    });

    return grouped;
  } catch (error) {
    console.error("Error getting documents by folder:", error);
    throw error;
  }
}

/**
 * Récupère les statistiques des documents d'un candidat
 */
export async function getDocumentStatistics(
  candidateEmail: string
): Promise<{
  totalDocuments: number;
  byType: Record<string, number>;
  byFolder: Record<string, number>;
  byStatus: Record<string, number>;
  totalSize: number;
  averageConfidence: number;
}> {
  const db = await getDb();

  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const documents = await db
      .select()
      .from(clientDocuments)
      .where(eq(clientDocuments.candidateEmail, candidateEmail));

    const byType: Record<string, number> = {};
    const byFolder: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalSize = 0;
    let totalConfidence = 0;
    let documentsWithConfidence = 0;

    documents.forEach((doc: any) => {
      // Par type
      byType[doc.documentType] = (byType[doc.documentType] || 0) + 1;

      // Par dossier
      const folder = doc.suggestedFolder || "Autres/Divers";
      byFolder[folder] = (byFolder[folder] || 0) + 1;

      // Par statut
      byStatus[doc.status] = (byStatus[doc.status] || 0) + 1;

      // Taille totale
      if (doc.fileSize) {
        totalSize += doc.fileSize;
      }

      // Confiance moyenne
      if (doc.aiClassificationConfidence) {
        totalConfidence += doc.aiClassificationConfidence;
        documentsWithConfidence++;
      }
    });

    const averageConfidence =
      documentsWithConfidence > 0
        ? Math.round(totalConfidence / documentsWithConfidence)
        : 0;

    return {
      totalDocuments: documents.length,
      byType,
      byFolder,
      byStatus,
      totalSize,
      averageConfidence,
    };
  } catch (error) {
    console.error("Error getting document statistics:", error);
    throw error;
  }
}

/**
 * Récupère les documents manquants pour une procédure spécifique
 */
export async function getMissingDocuments(
  candidateEmail: string,
  requiredDocumentTypes: string[]
): Promise<string[]> {
  const db = await getDb();

  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const documents = await db
      .select()
      .from(clientDocuments)
      .where(
        and(
          eq(clientDocuments.candidateEmail, candidateEmail),
          eq(clientDocuments.status, "verified")
        )
      );

    const submittedTypes = new Set(documents.map((d: any) => d.documentType));
    const missing = requiredDocumentTypes.filter((type) => !submittedTypes.has(type));

    return missing;
  } catch (error) {
    console.error("Error getting missing documents:", error);
    throw error;
  }
}

/**
 * Génère un rapport de classification pour tous les documents
 */
export async function generateClassificationReport(
  candidateEmail: string
): Promise<{
  totalDocuments: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  documentsWithWarnings: number;
  extractedData: {
    passports: string[];
    ids: string[];
    diplomas: string[];
    other: string[];
  };
  recommendations: string[];
}> {
  const db = await getDb();

  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const documents = await db
      .select()
      .from(clientDocuments)
      .where(eq(clientDocuments.candidateEmail, candidateEmail));

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

    const recommendations: string[] = [];

    documents.forEach((doc: any) => {
      // Compter par confiance
      if (doc.aiClassificationConfidence) {
        if (doc.aiClassificationConfidence >= 80) {
          highConfidence++;
        } else if (doc.aiClassificationConfidence >= 50) {
          mediumConfidence++;
        } else {
          lowConfidence++;
        }
      }

      // Compter les avertissements
      if (doc.aiClassification) {
        const classification = JSON.parse(doc.aiClassification as string);
        if (classification.warnings && classification.warnings.length > 0) {
          documentsWithWarnings++;
        }
      }

      // Extraire les données
      if (doc.extractedData) {
        const extracted = JSON.parse(doc.extractedData as string);
        if (extracted.holderName) {
          if (doc.documentType === "passport") {
            extractedData.passports.push(extracted.holderName);
          } else if (
            doc.documentType === "national_id" ||
            doc.documentType === "driver_license"
          ) {
            extractedData.ids.push(extracted.holderName);
          } else if (doc.documentType === "diploma") {
            extractedData.diplomas.push(extracted.holderName);
          } else {
            extractedData.other.push(extracted.holderName);
          }
        }
      }
    });

    // Générer des recommandations
    if (lowConfidence > 0) {
      recommendations.push(
        `${lowConfidence} document(s) avec faible confiance - Vérification manuelle recommandée`
      );
    }
    if (documentsWithWarnings > 0) {
      recommendations.push(
        `${documentsWithWarnings} document(s) avec avertissements - Vérification requise`
      );
    }
    if (documents.length < 5) {
      recommendations.push("Veuillez soumettre plus de documents pour une évaluation complète");
    }

    return {
      totalDocuments: documents.length,
      highConfidence,
      mediumConfidence,
      lowConfidence,
      documentsWithWarnings,
      extractedData,
      recommendations,
    };
  } catch (error) {
    console.error("Error generating classification report:", error);
    throw error;
  }
}
