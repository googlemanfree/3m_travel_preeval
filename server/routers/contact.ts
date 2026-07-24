import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { contactMessages } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const sendMessageInput = z.object({
  visitorName: z.string().min(2, "Le nom est requis"),
  visitorEmail: z.string().email("Email invalide"),
  visitorPhone: z.string().optional(),
  sessionId: z.string().min(1, "Session ID requis"),
  content: z.string().min(1, "Le message ne peut pas être vide"),
  subject: z.string().optional(),
});

const getMessagesInput = z.object({
  sessionId: z.string().min(1, "Session ID requis"),
});

export const contactRouter = router({
  /**
   * Envoyer un message de chat depuis la page Contact
   */
  sendMessage: publicProcedure
    .input(sendMessageInput)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Base de données non disponible");
      }

      try {
        // Insérer le message du visiteur
        await db.insert(contactMessages).values({
          visitorName: input.visitorName,
          visitorEmail: input.visitorEmail,
          visitorPhone: input.visitorPhone,
          sessionId: input.sessionId,
          senderRole: "visitor",
          content: input.content,
          subject: input.subject,
          status: "active",
        });

        return {
          success: true,
          message: "Message envoyé avec succès",
        };
      } catch (error) {
        console.error("[Contact] Send message error:", error);
        throw new Error("Erreur lors de l'envoi du message");
      }
    }),

  /**
   * Récupérer les messages d'une session de chat
   */
  getMessages: publicProcedure
    .input(getMessagesInput)
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Base de données non disponible");
      }

      try {
        const messages = await db
          .select()
          .from(contactMessages)
          .where(eq(contactMessages.sessionId, input.sessionId))
          .orderBy(contactMessages.createdAt);

        return messages;
      } catch (error) {
        console.error("[Contact] Get messages error:", error);
        throw new Error("Erreur lors de la récupération des messages");
      }
    }),

  /**
   * Clôturer une session de chat
   */
  closeSession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Base de données non disponible");
      }

      try {
        await db
          .update(contactMessages)
          .set({ status: "closed" })
          .where(eq(contactMessages.sessionId, input.sessionId));

        return { success: true, message: "Session fermée" };
      } catch (error) {
        console.error("[Contact] Close session error:", error);
        throw new Error("Erreur lors de la fermeture de la session");
      }
    }),
});
