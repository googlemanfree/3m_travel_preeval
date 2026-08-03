/**
 * Routeur pour les paiements CinetPay
 * Gère les transactions et les webhooks de paiement
 */

import { protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { applications, candidates } from "../../drizzle/schema";
import { desc, eq } from "drizzle-orm";

export const paymentRouter = {
  /**
   * Récupérer l'historique des paiements
   */
  getPaymentHistory: protectedProcedure.query(async ({ ctx }: any) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

    try {
      const apps = await db
        .select()
        .from(applications)
        .where(eq(applications.paymentStatus, "SUCCESS"))
        .orderBy(desc(applications.paymentDate));

      return {
        success: true,
        payments: apps.map((app: any) => ({
          id: app.id,
          dossierNumber: app.dossierNumber,
          amount: app.paymentAmount,
          currency: app.paymentCurrency,
          status: app.paymentStatus,
          date: app.paymentDate,
          method: app.paymentMethod,
        })),
      };
    } catch (error) {
      console.error("[Payment] Get history error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erreur lors de la récupération de l'historique",
      });
    }
  }),

  /**
   * Webhook CinetPay pour les notifications de paiement
   */
  cinetPayNotify: publicProcedure
    .input(z.object({
      transactionId: z.string(),
      status: z.string(),
      amount: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      try {
        // Mettre à jour le statut du paiement
        await db
          .update(applications)
          .set({
            paymentStatus: input.status === "success" ? "SUCCESS" : "FAILED",
            paymentTransactionId: input.transactionId,
          })
          .where(eq(applications.paymentAmount, input.amount));

        return { success: true, message: "Paiement traité" };
      } catch (error) {
        console.error("[Payment] Webhook error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erreur lors du traitement du paiement",
        });
      }
    }),
};
