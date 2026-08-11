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
import { aureolQuestions } from "../../drizzle/schema";
import { desc, sql, count } from "drizzle-orm";

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
        // Utiliser l'API LLM Manus
        const response = await invokeLLM({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
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
          const lastUserMsg = [...input.messages].reverse().find(m => m.role === "user")?.content || "";
          if (db && lastUserMsg) {
            await db.insert(aureolQuestions).values({
              question: lastUserMsg,
              answer: reply,
              sourceWidget: "copilot_chat",
            });
          }
        } catch (logErr) {
          console.error("Failed to log aureol question:", logErr);
        }

        return { reply };
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
        const response = await invokeLLM({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
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
   * Obtenir la liste des questions fréquentes et les statistiques d'utilisation (Admin)
   */
  getFrequentQuestions: publicProcedure
    .input(z.object({ sessionToken: z.string().min(1), limit: z.number().default(50) }))
    .query(async ({ input }) => {
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
});
