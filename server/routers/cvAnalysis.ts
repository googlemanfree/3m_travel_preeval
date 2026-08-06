import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

export const cvAnalysisRouter = router({
  /**
   * Analyser un CV avec OpenAI pour générer une évaluation IA
   */
  analyzeCVForEvaluation: protectedProcedure
    .input(
      z.object({
        candidateName: z.string(),
        email: z.string().email(),
        destination: z.string(),
        visaType: z.string(),
        education: z.string(),
        experience: z.number(),
        englishLevel: z.string(),
        currentJob: z.string(),
        sector: z.string(),
        cvContent: z.string(), // Contenu du CV en texte
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Construire le prompt pour OpenAI
        const systemPrompt = `Tu es un expert en immigration et en évaluation de candidats pour les visas de travail, d'études et de résidence permanente. 
Ton rôle est d'analyser les profils des candidats et de générer des rapports d'évaluation détaillés et professionnels.
Fournis une évaluation honnête et constructive basée sur les informations fournies.`;

        const userPrompt = `Analyse le profil suivant du candidat et génère une évaluation d'éligibilité pour ${input.destination} (Visa ${input.visaType}):

**Informations du candidat:**
- Nom: ${input.candidateName}
- Email: ${input.email}
- Destination: ${input.destination}
- Type de visa: ${input.visaType}
- Niveau d'études: ${input.education}
- Années d'expérience: ${input.experience}
- Niveau d'anglais: ${input.englishLevel}
- Emploi actuel: ${input.currentJob}
- Secteur: ${input.sector}

**Contenu du CV:**
${input.cvContent}

Basé sur ces informations, fournis:
1. Un score d'éligibilité de 0 à 100
2. Une analyse détaillée des forces du candidat
3. Une analyse des domaines à améliorer
4. Des recommandations spécifiques pour améliorer les chances
5. Un résumé final avec la probabilité d'approbation

Format ta réponse en JSON avec les champs: score, strengths, improvements, recommendations, summary`;

        // Appeler OpenAI via l'API Manus
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 2000,
        });

        // Parser la réponse
        let evaluationData;
        const responseContent = response.choices[0]?.message?.content || "";
        const responseText = typeof responseContent === "string" ? responseContent : JSON.stringify(responseContent);
        
        try {
          // Extraire le JSON de la réponse
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            evaluationData = JSON.parse(jsonMatch[0]);
          } else {
            // Si pas de JSON trouvé, créer une structure par défaut
            evaluationData = {
              score: 75,
              strengths: responseText,
              improvements: "À déterminer après révision complète",
              recommendations: "Consulter avec un expert en immigration",
              summary: responseText,
            };
          }
        } catch (parseError) {
          evaluationData = {
            score: 75,
            strengths: responseText,
            improvements: "À déterminer après révision complète",
            recommendations: "Consulter avec un expert en immigration",
            summary: responseText,
          };
        }

        // Générer un rapport complet
        const aiReport = `
**Évaluation d'éligibilité pour ${input.destination} - Visa ${input.visaType}**

**Score d'éligibilité: ${evaluationData.score}/100**

**Forces du candidat:**
${evaluationData.strengths}

**Domaines à améliorer:**
${evaluationData.improvements}

**Recommandations:**
${evaluationData.recommendations}

**Résumé:**
${evaluationData.summary}

---
*Rapport généré par l'IA le ${new Date().toLocaleDateString("fr-FR")}*
`;

        return {
          success: true,
          aiScore: Math.min(100, Math.max(0, evaluationData.score || 75)),
          aiReport,
          strengths: evaluationData.strengths,
          improvements: evaluationData.improvements,
          recommendations: evaluationData.recommendations,
          summary: evaluationData.summary,
          generatedAt: new Date(),
        };
      } catch (error) {
        console.error("Erreur lors de l'analyse du CV:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'analyse du CV par l'IA",
        });
      }
    }),

  /**
   * Analyser un CV pour la consultation gratuite
   */
  analyzeCVForConsultation: protectedProcedure
    .input(
      z.object({
        candidateName: z.string(),
        email: z.string().email(),
        targetCountry: z.string(),
        cvContent: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const systemPrompt = `Tu es un consultant en immigration expérimenté. 
Analyse les CVs des candidats et fournis des conseils professionnels et constructifs.`;

        const userPrompt = `Analyse ce CV pour un candidat intéressé par ${input.targetCountry}:

**Candidat:** ${input.candidateName}
**Email:** ${input.email}

**Contenu du CV:**
${input.cvContent}

Fournis une analyse professionnelle incluant:
1. Points forts du profil
2. Domaines à renforcer
3. Opportunités d'immigration pertinentes
4. Étapes recommandées

Sois constructif et encourageant.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 1500,
        });

        const responseContent = response.choices[0]?.message?.content || "";
        const responseText = typeof responseContent === "string" ? responseContent : JSON.stringify(responseContent);

        return {
          success: true,
          consultationReport: responseText,
          generatedAt: new Date(),
        };
      } catch (error) {
        console.error("Erreur lors de l'analyse de consultation:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de l'analyse du CV",
        });
      }
    }),

  /**
   * Générer un rapport d'éligibilité détaillé
   */
  generateEligibilityReport: protectedProcedure
    .input(
      z.object({
        destination: z.string(),
        visaType: z.string(),
        aiScore: z.number(),
        candidateProfile: z.record(z.string(), z.any()),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const systemPrompt = `Tu es un expert en politique d'immigration pour les pays développés.
Génère des rapports d'éligibilité détaillés et précis.`;

        const userPrompt = `Génère un rapport d'éligibilité pour:
- Destination: ${input.destination}
- Type de visa: ${input.visaType}
- Score d'éligibilité actuel: ${input.aiScore}/100
- Profil: ${JSON.stringify(input.candidateProfile)}

Inclus:
1. Analyse des critères d'éligibilité
2. Probabilité d'approbation
3. Documents requis
4. Délais estimés
5. Prochaines étapes`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 2000,
        });

        const responseContent = response.choices[0]?.message?.content || "";
        const responseText = typeof responseContent === "string" ? responseContent : JSON.stringify(responseContent);

        return {
          success: true,
          report: responseText,
          generatedAt: new Date(),
        };
      } catch (error) {
        console.error("Erreur lors de la génération du rapport:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la génération du rapport",
        });
      }
    }),
});
