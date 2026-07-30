import { GoogleGenerativeAI } from '@google/generative-ai';

interface CVAnalysisResult {
  score: number;
  verdict: 'Très Favorable' | 'Favorable sous réserve' | 'Risqué / À renforcer';
  cvAnalysis: {
    detectedDegree: string;
    totalExperienceYears: string;
    keySkills: string[];
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export async function analyzeCandidateCV(
  cvText: string,
  formData: {
    fullName: string;
    email: string;
    whatsapp: string;
    city: string;
    projectType: string;
    destinationCountry: string;
    sector?: string;
    experience?: string;
    diploma?: string;
    languageTest?: string;
  }
): Promise<CVAnalysisResult> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.OPENAI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Tu es l'Expert Consulaire en Chef de 3M Travel Agency à Yaoundé.
Analyse le profil et le CV du candidat pour un projet de : ${formData.projectType} vers : ${formData.destinationCountry}.

--- FORMULAIRE ---
Nom : ${formData.fullName}
E-mail : ${formData.email}
Téléphone : ${formData.whatsapp}
Ville : ${formData.city}
Secteur : ${formData.sector || 'N/A'}
Expérience : ${formData.experience || 'N/A'}
Diplôme : ${formData.diploma || 'N/A'}
Test de langue : ${formData.languageTest || 'N/A'}

--- TEXTE DU CV ---
${cvText.slice(0, 3500)}

--- FORMAT JSON STRICT OBLIGATOIRE ---
{
  "score": number (0 à 100),
  "verdict": "Très Favorable" | "Favorable sous réserve" | "Risqué / À renforcer",
  "cvAnalysis": {
    "detectedDegree": "Diplôme principal identifié",
    "totalExperienceYears": "Années d'expérience estimées",
    "keySkills": ["Compétence 1", "Compétence 2", "Compétence 3"]
  },
  "strengths": ["Point fort 1 du dossier", "Point fort 2", "Point fort 3"],
  "weaknesses": ["Point à améliorer ou pièce manquante", "Point 2"],
  "recommendations": ["Conseil 1 pour optimiser le visa", "Conseil 2", "Conseil 3"]
}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    return JSON.parse(jsonMatch[0]) as CVAnalysisResult;
  } catch (error) {
    console.error('CV Analysis Error:', error);
    // Return default analysis on error
    return {
      score: 75,
      verdict: 'Favorable sous réserve',
      cvAnalysis: {
        detectedDegree: 'En cours de vérification',
        totalExperienceYears: 'À déterminer',
        keySkills: [],
      },
      strengths: ['Dossier et CV enregistrés avec succès'],
      weaknesses: ['Vérification manuelle requise par un conseiller'],
      recommendations: [
        'Prendre rendez-vous à l\'agence de Yaoundé Biyem-Assi pour affiner le projet.',
        'Préparer les documents originaux pour la soumission.',
        'Contacter notre équipe pour plus de détails.',
      ],
    };
  }
}
