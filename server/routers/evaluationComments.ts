import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";

// Note: Ce routeur est un placeholder
// Les tables contactMessages n'existent pas dans le schéma

export const contactRouter = router({
  /**
   * Placeholder - contactMessages table n'existe pas
   */
  sendMessage: publicProcedure
    .input(z.object({
      visitorName: z.string(),
      visitorEmail: z.string().email(),
      content: z.string(),
    }))
    .mutation(async () => {
      return {
        success: true,
        message: "Feature non disponible",
      };
    }),

  /**
   * Placeholder
   */
  getMessages: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async () => {
      return [];
    }),

  /**
   * Placeholder
   */
  closeSession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async () => {
      return { success: true, message: "Session fermée" };
    }),

  /**
   * Placeholder
   */
  sendContactEmail: publicProcedure
    .input(z.object({
      name: z.string(),
      email: z.string().email(),
      subject: z.string(),
      message: z.string(),
    }))
    .mutation(async () => {
      return {
        success: true,
        message: "Feature non disponible",
      };
    }),
});
