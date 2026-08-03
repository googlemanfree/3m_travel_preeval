import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
// import { contactMessages } from "../../drizzle/schema"; // Table supprimée
import { eq, and } from "drizzle-orm";
import { sendEmail } from "../_core/email";

const sendContactEmailInput = z.object({
  name: z.string().min(2, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  subject: z.string().min(3, "Le sujet est requis"),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
});

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

  sendContactEmail: publicProcedure
    .input(sendContactEmailInput)
    .mutation(async ({ input }) => {
      try {
        await sendEmail({
          to: "hello@3mtravelagency.com",
          subject: `[Contact] ${input.subject}`,
          html: `<h2>Nouvelle demande de contact</h2><p><strong>Nom:</strong> ${input.name}</p><p><strong>Email:</strong> ${input.email}</p>${input.phone ? `<p><strong>Telephone:</strong> ${input.phone}</p>` : ""}<p><strong>Sujet:</strong> ${input.subject}</p><hr /><p><strong>Message:</strong></p><p>${input.message.replace(/\n/g, "<br />")}</p>`,
          replyTo: input.email,
        });

        await sendEmail({
          to: input.email,
          subject: "Confirmation de votre demande - 3M Travel & Services",
          html: `<h2>Merci pour votre demande</h2><p>Bonjour ${input.name},</p><p>Nous avons bien recu votre demande. Notre equipe vous repondra dans les 24 heures ouvrables.</p><p>Cordialement,<br />L'equipe 3M Travel & Services</p>`,
        });

        return {
          success: true,
          message: "Votre demande a ete envoyee avec succes. Vous recevrez une reponse dans les 24 heures.",
        };
      } catch (error) {
        console.error("[Contact] Send email error:", error);
        throw new Error("Erreur lors de l'envoi de votre demande. Veuillez reessayer.");
      }
    }),
});
