import { invokeLLM } from "../_core/llm";

/**
 * Génère un Bilan d'Admissibilité structuré avec IA Manus (OpenAI)
 */
export async function generateBilan(candidateData: {
  fullName: string;
  projectType: "travail" | "etudes" | "tourisme";
  destinationCountry: string;
  sector?: string;
  yearsOfExperience?: number;
  educationLevel?: string;
  languages?: string;
  diplomaLevel?: string;
  averageGrade?: string;
  admissionLetter?: boolean;
  visitReason?: string;
  travelHistory?: string;
  previousRefusal?: boolean;
  socialTies?: string;
}) {
  const prompt = `Tu es l'expert consulaire en chef de 3M Travel Agency à Yaoundé.
Analyse le profil suivant pour un projet de type : ${candidateData.projectType} vers ${candidateData.destinationCountry}.

INFORMATIONS DU CANDIDAT :
- Nom : ${candidateData.fullName}
- Type de projet : ${candidateData.projectType}
- Destination : ${candidateData.destinationCountry}
${candidateData.projectType === "travail" ? `- Secteur : ${candidateData.sector || "Non précisé"}
- Expérience : ${candidateData.yearsOfExperience || "N/A"} ans
- Niveau d'études : ${candidateData.educationLevel || "N/A"}
- Langues : ${candidateData.languages || "N/A"}` : ""}
${candidateData.projectType === "etudes" ? `- Diplôme : ${candidateData.diplomaLevel || "N/A"}
- Moyenne : ${candidateData.averageGrade || "N/A"}
- Lettre d'admission : ${candidateData.admissionLetter ? "Oui" : "Non"}` : ""}
${candidateData.projectType === "tourisme" ? `- Motif : ${candidateData.visitReason || "N/A"}
- Historique voyage : ${candidateData.travelHistory || "N/A"}
- Refus antérieur : ${candidateData.previousRefusal ? "Oui" : "Non"}
- Attaches socio-économiques : ${candidateData.socialTies || "N/A"}` : ""}

CONSIGNES DE RÉPONSE :
Génère une réponse au format JSON STRICT avec les clés suivantes :
{
  "score": <nombre 0-100>,
  "verdict": "<Très Favorable|Favorable sous réserve|Risqué / Non Admissible>",
  "strengths": [<2-3 points forts>],
  "weaknesses": [<1-2 points d'attention>],
  "recommendations": [<2 conseils stratégiques>]
}

Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`;

  try {
    const response = await invokeLLM({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 500,
    });

    const messageContent = response.choices[0]?.message?.content;
    let content = "{}";
    if (typeof messageContent === "string") {
      content = messageContent;
    } else if (Array.isArray(messageContent)) {
      const textPart = messageContent.find((p) => "type" in p && p.type === "text");
      if (textPart && "text" in textPart) {
        content = textPart.text;
      }
    }
    const bilan = JSON.parse(content);

    return {
      score: Math.min(100, Math.max(0, bilan.score || 70)),
      verdict: bilan.verdict || "Favorable sous réserve",
      strengths: Array.isArray(bilan.strengths) ? bilan.strengths : ["Profil enregistré"],
      weaknesses: Array.isArray(bilan.weaknesses) ? bilan.weaknesses : ["Analyse complémentaire requise"],
      recommendations: Array.isArray(bilan.recommendations) ? bilan.recommendations : ["Prendre RDV en agence"],
    };
  } catch (error) {
    console.error("Erreur lors de la génération du bilan IA :", error);
    // Fallback si l'IA échoue
    return {
      score: 70,
      verdict: "Favorable sous réserve",
      strengths: ["Profil enregistré avec succès"],
      weaknesses: ["Analyse complémentaire requise par l'agent"],
      recommendations: ["Prendre rendez-vous en agence pour finaliser l'étude de dossier."],
    };
  }
}
