import { protectedProcedure, publicProcedure, router } from "@server/_core/trpc";
import { db } from "@server/db";
import type { evisaRequests as EvisaRequestsType } from "@drizzle/schema";
import { eq, desc, and, like } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// Générer un numéro de dossier unique
function generateDossierNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `EVISA-${year}${month}${day}-${random}`;
}

export const evisaAdminRouter = router({
  // Récupérer toutes les demandes e-visa (admin seulement)
  getAllRequests: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        countryCode: z.string().optional(),
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }: any) => {
      // Vérifier que l'utilisateur est admin
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent accéder à cette ressource",
        });
      }

      const offset = (input.page - 1) * input.limit;
      const conditions = [];

      if (input.status) {
        conditions.push(eq(evisaRequests.status, input.status as any));
      }

      if (input.countryCode) {
        conditions.push(eq(evisaRequests.countryCode, input.countryCode));
      }

      if (input.search) {
        conditions.push(
          like(evisaRequests.fullName, `%${input.search}%`)
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const requests = await db
        .select()
        .from(evisaRequests)
        .where(whereClause)
        .orderBy(desc(evisaRequests.createdAt))
        .limit(input.limit)
        .offset(offset);

      const total = await db
        .select({ count: evisaRequests.id })
        .from(evisaRequests)
        .where(whereClause);

      return {
        requests,
        total: total[0]?.count || 0,
        page: input.page,
        limit: input.limit,
      };
    }),

  // Récupérer les détails d'une demande
  getRequestDetails: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }: any) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent accéder à cette ressource",
        });
      }

      const request = await db
        .select()
        .from(evisaRequests)
        .where(eq(evisaRequests.id, input.id))
        .limit(1);

      if (!request.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Demande non trouvée",
        });
      }

      return request[0];
    }),

  // Mettre à jour le statut d'une demande
  updateRequestStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "processing", "approved", "rejected"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent effectuer cette action",
        });
      }

      // Récupérer la demande
      const request = await db
        .select()
        .from(evisaRequests)
        .where(eq(evisaRequests.id, input.id))
        .limit(1);

      if (!request.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Demande non trouvée",
        });
      }

      const evisaRequest = request[0];

      // Mettre à jour le statut
      await db
        .update(evisaRequests)
        .set({
          status: input.status,
          adminNotes: input.notes || evisaRequest.adminNotes,
          lastStatusUpdateAt: new Date(),
          lastStatusUpdatedBy: ctx.user?.email,
        })
        .where(eq(evisaRequests.id, input.id));

      // TODO: Envoyer un email de confirmation au client
      // const statusMessages: Record<string, string> = {
      //   pending: "Votre demande est en attente de traitement",
      //   processing: "Votre demande est en cours de traitement",
      //   approved: "Votre demande d'e-visa a été approuvée!",
      //   rejected: "Votre demande d'e-visa a été rejetée",
      // };
      // await sendEmail({...})

      return { success: true, message: "Statut mis à jour avec succès" };
    }),

  // Assigner une demande à un admin
  assignRequest: protectedProcedure
    .input(z.object({ id: z.number(), adminEmail: z.string().email() }))
    .mutation(async ({ ctx, input }: any) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent effectuer cette action",
        });
      }

      await db
        .update(evisaRequests)
        .set({
          adminAssignedTo: input.adminEmail,
          lastStatusUpdateAt: new Date(),
          lastStatusUpdatedBy: ctx.user?.email,
        })
        .where(eq(evisaRequests.id, input.id));

      return { success: true, message: "Demande assignée avec succès" };
    }),

  // Ajouter une note admin
  addAdminNote: protectedProcedure
    .input(z.object({ id: z.number(), note: z.string() }))
    .mutation(async ({ ctx, input }: any) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Seuls les administrateurs peuvent effectuer cette action",
        });
      }

      const request = await db
        .select()
        .from(evisaRequests)
        .where(eq(evisaRequests.id, input.id))
        .limit(1);

      if (!request.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Demande non trouvée",
        });
      }

      const existingNotes = request[0].adminNotes || "";
      const timestamp = new Date().toLocaleString("fr-FR");
      const newNotes = `${existingNotes}\n[${timestamp}] ${ctx.user?.name}: ${input.note}`;

      await db
        .update(evisaRequests)
        .set({ adminNotes: newNotes })
        .where(eq(evisaRequests.id, input.id));

      return { success: true, message: "Note ajoutée avec succès" };
    }),

  // Obtenir les statistiques des demandes
  getStatistics: protectedProcedure.query(async ({ ctx }: any) => {
    if (ctx.user?.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Seuls les administrateurs peuvent accéder à cette ressource",
      });
    }

    const allRequests = await db.select().from(evisaRequests);

    const statistics = {
      total: allRequests.length,
      pending: allRequests.filter((r: any) => r.status === "pending").length,
      processing: allRequests.filter((r: any) => r.status === "processing").length,
      approved: allRequests.filter((r: any) => r.status === "approved").length,
      rejected: allRequests.filter((r: any) => r.status === "rejected").length,
      totalRevenue: allRequests.reduce((sum: number, r: any) => sum + (r.totalCost || 0), 0),
    };

    return statistics;
  }),
});
