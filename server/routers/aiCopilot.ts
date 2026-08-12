/**
 * Routeur tRPC — Copilote IA 3M Travel (chatbot flottant)
 *
 * Assistant conversationnel présent sur toutes les pages, pour répondre aux
 * questions générales sur les démarches d'évaluation, les visas, et les destinations.
 * Oriente vers l'évaluation primaire ou WhatsApp pour les cas précis.
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { aureolQuestions, faqFeedback } from "../../drizzle/schema";
import { desc, sql, count } from "drizzle-orm";
import { requireValidAdminSession } from "./adminAuth";
import { searchDestinationKnowledge } from "../destinationDocumentService";

const SYSTEM_PROMPT = `Tu es le "Copilote IA 3M Travel", l'assistant virtuel de 3M Travel & Services, agence d'accompagnement en mobilité internationale basée à Yaoundé, Cameroun.

Ton rôle : répondre brièvement et clairement aux questions générales des visiteurs sur :
- Les évaluations d'éligibilité pour les visas
- Les démarches d'immigration
- Les destinations disponibles (107 pays)
- Les frais et documents requis
- Le processus d'évaluation primaire

Informations factuelles à utiliser si pertinentes :
- Frais d'ouverture de dossier : 65 000 FCFA, dus après validation de l'évaluation IA
- Destinations : 107 pays disponibles (Travail, Études, Visiteur)
- Processus : Évaluation primaire (CV + infos) → Analyse IA → Validation admin → Paiement → Documents → Traitement
- Documents généralement demandés : CV, diplômes, casier judiciaire, passeport valide, preuve de ressources
- Contact : WhatsApp +237 698 104 832, email hello@3mtravelagency.com
- Adresse : Biyem-Assi, Montée Chapelle Obili, Yaoundé

Règles strictes :
- Ne donne JAMAIS de garantie d'obtention de visa — la décision finale appartient aux autorités
- Pour une évaluation personnalisée, oriente vers l'évaluation primaire gratuite
- Réponses courtes (3-5 phrases maximum)
- Si la question sort du cadre (immigration/visa/études), dis poliment que ce n'est pas ton domaine
- Ne prétends jamais être un humain
- Sois toujours professionnel, chaleureux et encourageant`;

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export const aiCopilotRouter = router({
  /**
   * Chat conversationnel avec le copilote IA
   */
  chat: publicProcedure
    .input(
      z.object({
        messages: z.array(messageSchema).min(1).max(20),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Récupérer la dernière question utilisateur pour enrichir le contexte via le RAG dynamique des destinations
        const lastUserMsg = [...input.messages].reverse().find(m => m.role === "user")?.content || "";
        const sources = await searchDestinationKnowledge(lastUserMsg);

        const destinationContext = sources.map(s => `[Source: ${s.sourceTitle} - ${s.country}]\n${s.text}`).join("\n\n");

        const dynamicSystemPrompt = `${SYSTEM_PROMPT}

=== EXTRAITS OFFICIELS DES GUIDES DE DESTINATION (RAG 107 PAYS) ===
${destinationContext}
==================================================================`;

        // Utiliser l'API LLM Manus
        const response = await invokeLLM({
          messages: [
            { role: "system", content: dynamicSystemPrompt },
            ...input.messages.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
          ],
          max_tokens: 300,
        });

        const responseContent = response.choices[0]?.message?.content || "";
        const reply =
          typeof responseContent === "string"
            ? responseContent.trim()
            : JSON.stringify(responseContent);

        if (!reply) {
          throw new Error("Réponse vide de l'IA");
        }

        // Enregistrer la dernière question de l'utilisateur et la réponse d'Aureol
        try {
          const db = await getDb();
          const lastUserMessage = [...input.messages].reverse().find(m => m.role === "user")?.content || "";
          if (db && lastUserMessage) {
            await db.insert(aureolQuestions).values({
              question: lastUserMessage,
              answer: reply,
              sourceWidget: "copilot_chat",
            });
          }
        } catch (logErr) {
          console.error("Failed to log aureol question:", logErr);
        }

        return {
          reply,
          sources: sources.map(s => ({
            title: s.sourceTitle,
            url: s.sourceUrl,
            country: s.country,
          })),
        };
      } catch (err) {
        console.error("ai_copilot.chat_failed", err);
        return {
          reply: "Désolé, je rencontre un souci technique. Contactez directement notre équipe sur WhatsApp au +237 698 104 832, elle vous répondra rapidement.",
        };
      }
    }),

  /**
   * Obtenir une réponse rapide à une question spécifique
   */
  quickAnswer: publicProcedure
    .input(
      z.object({
        question: z.string().min(5).max(500),
      })
    )
    .query(async ({ input }) => {
      try {
        const sources = await searchDestinationKnowledge(input.question);
        const destinationContext = sources.map(s => `[Source: ${s.sourceTitle} - ${s.country}]\n${s.text}`).join("\n\n");
        const dynamicSystemPrompt = `${SYSTEM_PROMPT}

=== EXTRAITS OFFICIELS DES GUIDES DE DESTINATION (RAG 107 PAYS) ===
${destinationContext}
==================================================================`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: dynamicSystemPrompt },
            {
              role: "user",
              content: input.question,
            },
          ],
          max_tokens: 200,
        });

        const responseContent = response.choices[0]?.message?.content || "";
        const answer =
          typeof responseContent === "string"
            ? responseContent.trim()
            : JSON.stringify(responseContent);

        return { answer };
      } catch (err) {
        console.error("ai_copilot.quick_answer_failed", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la génération de la réponse",
        });
      }
    }),

  /**
   * Enregistrer le vote de pertinence d'une réponse FAQ publique.
   * Le vote est volontairement anonyme : aucune adresse IP ni donnée personnelle
   * n'est persistée, et le client limite les votes répétés par question.
   */
  submitFaqFeedback: publicProcedure
    .input(
      z.object({
        questionKey: z.string().min(1).max(191),
        helpful: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Base de données indisponible",
        });
      }

      await db.insert(faqFeedback).values({
        questionKey: input.questionKey,
        helpful: input.helpful,
      });

      return {
        success: true,
        message: input.helpful ? "Merci pour votre retour utile." : "Merci pour votre retour.",
      };
    }),

  /**
   * Obtenir la liste des questions fréquentes et les statistiques d'utilisation (Admin)
   */
  getFrequentQuestions: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });

      const rows = await db
        .select({
          question: aureolQuestions.question,
          count: count(),
          lastAsked: sql<Date>`max(${aureolQuestions.createdAt})`,
        })
        .from(aureolQuestions)
        .groupBy(aureolQuestions.question)
        .orderBy(desc(count()))
        .limit(input.limit);

      const recentLogs = await db
        .select()
        .from(aureolQuestions)
        .orderBy(desc(aureolQuestions.createdAt))
        .limit(20);

      return {
        frequentQuestions: rows,
        recentLogs,
      };
    }),

  /**
   * Générer automatiquement par IA des suggestions de réponses pour les questions fréquentes (Admin)
   */
  generateAiFrequentAnswers: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });

      const topQuestions = await db
        .select({
          question: aureolQuestions.question,
          count: count(),
        })
        .from(aureolQuestions)
        .groupBy(aureolQuestions.question)
        .orderBy(desc(count()))
        .limit(6);

      if (topQuestions.length === 0) {
        return {
          success: true,
          suggestions: [],
          message: "Aucune question enregistrée pour le moment.",
        };
      }

      const questionsListText = topQuestions.map((q, i) => `${i + 1}. "${q.question}" (posée ${q.count} fois)`).join("\n");

      const prompt = `Tu es l'expert en mobilité internationale de 3M Travel & Services à Yaoundé, Cameroun.
Voici les questions les plus fréquentes posées par nos candidats au chatbot Aureol :
${questionsListText}

Pour chacune de ces questions, rédige une suggestion de réponse officielle, claire, professionnelle, chaleureuse et factuelle (3 à 4 phrases max), incluant si pertinent les contacts officiels (WhatsApp +237 698 104 832, email hello@3mtravelagency.com) et les frais (65 000 FCFA pour l'ouverture de dossier).

Format de sortie attendu en JSON strict (sans markdown autour si possible, ou dans un bloc json) :
[
  {
    "question": "Texte exact de la question",
    "frequency": nombre_de_fois,
    "suggestedAnswer": "Réponse officielle suggérée..."
  }
]`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Tu es un assistant expert qui génère des suggestions de réponses structurées en JSON strict." },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "ai_suggestions_schema",
              strict: false,
              schema: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    frequency: { type: "integer" },
                    suggestedAnswer: { type: "string" },
                  },
                  required: ["question", "frequency", "suggestedAnswer"],
                },
              },
            },
          },
          max_tokens: 1500,
        });

        const content = response.choices[0]?.message?.content || "[]";
        let parsed = [];
        try {
          const cleanJson = typeof content === "string" ? content.replace(/```json/g, "").replace(/```/g, "").trim() : JSON.stringify(content);
          parsed = JSON.parse(cleanJson);
        } catch (parseErr) {
          console.error("Failed to parse AI suggestions JSON:", parseErr, content);
          parsed = topQuestions.map(q => ({
            question: q.question,
            frequency: q.count,
            suggestedAnswer: "Contactez notre agence au +237 698 104 832 ou par email à hello@3mtravelagency.com pour un accompagnement personnalisé sur cette démarche.",
          }));
        }

        return {
          success: true,
          suggestions: parsed,
        };
      } catch (err) {
        console.error("generateAiFrequentAnswers error:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors de la génération IA des suggestions de réponses.",
        });
      }
    }),
});
