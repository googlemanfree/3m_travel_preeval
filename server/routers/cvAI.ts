/**
 * Routeur tRPC — Suggestions IA pour CV
 * Assistant IA pour améliorer les formulations des expériences professionnelles
 */

import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";

export const cvAIRouter = router({
  /**
   * Suggérer des améliorations pour une expérience professionnelle
   */
  suggestExperienceImprovement: publicProcedure
    .input(
      z.object({
        jobTitle: z.string(),
        company: z.string(),
        description: z.string(),
        language: z.enum(["fr", "en"]).default("fr"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const systemPrompt =
          input.language === "fr"
            ? `Tu es un expert en rédaction de CV et en formulation d'expériences professionnelles. 
Tu dois analyser la description d'une expérience professionnelle et suggérer des améliorations pour la rendre plus impactante, 
plus claire et plus professionnelle. Les suggestions doivent être concises et actionables.`
            : `You are an expert in CV writing and professional experience formulation. 
Analyze the description of a professional experience and suggest improvements to make it more impactful, 
clearer, and more professional. Suggestions should be concise and actionable.`;

        const userPrompt =
          input.language === "fr"
            ? `Poste: ${input.jobTitle}
Entreprise: ${input.company}
Description actuelle: ${input.description}

Veuillez fournir:
1. Une version améliorée de la description (max 2-3 lignes)
2. 2-3 points clés à mettre en avant
3. Les erreurs ou améliorations à faire

Répondez en JSON avec les clés: improvedDescription, keyPoints (array), improvements (array)`
            : `Position: ${input.jobTitle}
Company: ${input.company}
Current description: ${input.description}

Please provide:
1. An improved version of the description (max 2-3 lines)
2. 2-3 key points to highlight
3. Errors or improvements to make

Respond in JSON with keys: improvedDescription, keyPoints (array), improvements (array)`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
          model: "gpt-4o-mini",
        });

        // Extraire le JSON de la réponse
        const message = response.choices[0]?.message;
        const content =
          typeof message?.content === "string"
            ? message.content
            : Array.isArray(message?.content) && message.content[0]?.type === "text"
              ? message.content[0].text
              : "";

        // Parser le JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("Could not parse AI response");
        }

        const suggestions = JSON.parse(jsonMatch[0]);

        return {
          success: true,
          suggestions: {
            improvedDescription: suggestions.improvedDescription || "",
            keyPoints: suggestions.keyPoints || [],
            improvements: suggestions.improvements || [],
          },
        };
      } catch (error) {
        console.error("[CV AI] Error suggesting improvements:", error);
        return {
          success: false,
          error: "Failed to generate suggestions",
        };
      }
    }),

  /**
   * Suggérer des améliorations pour le résumé professionnel
   */
  suggestProfessionalSummary: publicProcedure
    .input(
      z.object({
        currentSummary: z.string(),
        jobTitle: z.string(),
        skills: z.array(z.string()),
        language: z.enum(["fr", "en"]).default("fr"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const systemPrompt =
          input.language === "fr"
            ? `Tu es un expert en rédaction de CV. Tu dois créer un résumé professionnel percutant et concis 
qui met en avant les forces principales et crée une première impression positive.`
            : `You are an expert in CV writing. Create a compelling and concise professional summary 
that highlights key strengths and creates a positive first impression.`;

        const userPrompt =
          input.language === "fr"
            ? `Poste: ${input.jobTitle}
Compétences: ${input.skills.join(", ")}
Résumé actuel: ${input.currentSummary}

Créez un résumé professionnel amélioré (2-3 lignes maximum) qui soit impactant et professionnel.
Répondez en JSON avec la clé: summary`
            : `Position: ${input.jobTitle}
Skills: ${input.skills.join(", ")}
Current summary: ${input.currentSummary}

Create an improved professional summary (max 2-3 lines) that is impactful and professional.
Respond in JSON with key: summary`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
          model: "gpt-4o-mini",
        });

        const message = response.choices[0]?.message;
        const content =
          typeof message?.content === "string"
            ? message.content
            : Array.isArray(message?.content) && message.content[0]?.type === "text"
              ? message.content[0].text
              : "";

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("Could not parse AI response");
        }

        const result = JSON.parse(jsonMatch[0]);

        return {
          success: true,
          summary: result.summary || "",
        };
      } catch (error) {
        console.error("[CV AI] Error suggesting summary:", error);
        return {
          success: false,
          error: "Failed to generate summary",
        };
      }
    }),
});
