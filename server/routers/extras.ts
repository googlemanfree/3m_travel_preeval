import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  dossierProgress,
  callbackRequests,
  approvedVisas,
  countryCosts,
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const extrasRouter = router({
  // ============================================================
  // DOSSIER PROGRESS
  // ============================================================
  getDossierProgress: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [progress] = await db
        .select()
        .from(dossierProgress)
        .where(eq(dossierProgress.applicationId, input.applicationId))
        .limit(1);
      return progress ?? null;
    }),

  updateDossierProgress: protectedProcedure
    .input(
      z.object({
        applicationId: z.number(),
        dossierNumber: z.string(),
        currentStep: z.number().min(1).max(5),
        stepsStatus: z.string().optional(),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const existing = await db
        .select()
        .from(dossierProgress)
        .where(eq(dossierProgress.applicationId, input.applicationId))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(dossierProgress)
          .set({
            currentStep: input.currentStep,
            stepsStatus: input.stepsStatus ?? existing[0].stepsStatus,
            adminNotes: input.adminNotes,
          })
          .where(eq(dossierProgress.applicationId, input.applicationId));
      } else {
        await db.insert(dossierProgress).values({
          applicationId: input.applicationId,
          dossierNumber: input.dossierNumber,
          currentStep: input.currentStep,
          stepsStatus:
            input.stepsStatus ??
            '{"step1":"completed","step2":"pending","step3":"pending","step4":"pending","step5":"pending"}',
          adminNotes: input.adminNotes,
        });
      }
      return { success: true };
    }),

  // ============================================================
  // CALLBACK REQUESTS
  // ============================================================
  requestCallback: publicProcedure
    .input(
      z.object({
        name: z.string().min(2),
        phone: z.string().min(8),
        email: z.string().email().optional(),
        preferredTime: z.string().optional(),
        preferredDate: z.string().optional(),
        subject: z.string().optional(),
        message: z.string().optional(),
        applicationId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [result] = await db.insert(callbackRequests).values({
        name: input.name,
        phone: input.phone,
        email: input.email,
        preferredTime: input.preferredTime,
        preferredDate: input.preferredDate,
        subject: input.subject,
        message: input.message,
        applicationId: input.applicationId,
        status: "pending",
      });
      return { success: true, id: (result as { insertId: number }).insertId };
    }),

  getCallbackRequests: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(["pending", "scheduled", "completed", "cancelled"])
          .optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      if (input.status) {
        return await db
          .select()
          .from(callbackRequests)
          .where(eq(callbackRequests.status, input.status))
          .orderBy(desc(callbackRequests.createdAt));
      }
      return await db
        .select()
        .from(callbackRequests)
        .orderBy(desc(callbackRequests.createdAt));
    }),

  updateCallbackStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "scheduled", "completed", "cancelled"]),
        adminNotes: z.string().optional(),
        scheduledAt: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(callbackRequests)
        .set({
          status: input.status,
          adminNotes: input.adminNotes,
          scheduledAt: input.scheduledAt,
          completedAt: input.status === "completed" ? new Date() : undefined,
        })
        .where(eq(callbackRequests.id, input.id));
      return { success: true };
    }),

  // ============================================================
  // APPROVED VISAS (Galerie)
  // ============================================================
  getApprovedVisas: publicProcedure
    .input(
      z.object({
        country: z.string().optional(),
        visaType: z.string().optional(),
        limit: z.number().default(12),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      let results = await db
        .select()
        .from(approvedVisas)
        .where(eq(approvedVisas.isPublic, true))
        .orderBy(desc(approvedVisas.createdAt))
        .limit(input.limit);

      if (input.country) {
        results = results.filter((v) => v.country === input.country);
      }
      if (input.visaType) {
        results = results.filter((v) => v.visaType === input.visaType);
      }
      return results;
    }),

  addApprovedVisa: protectedProcedure
    .input(
      z.object({
        firstName: z.string(),
        country: z.string(),
        visaType: z.string(),
        destination: z.string(),
        approvedDate: z.string(),
        testimonial: z.string().optional(),
        isPublic: z.boolean().default(true),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.insert(approvedVisas).values(input);
      return { success: true };
    }),

  // ============================================================
  // BUDGET CALCULATOR
  // ============================================================
  getCountryCosts: publicProcedure
    .input(
      z.object({
        country: z.string().optional(),
        visaType: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      let results = await db
        .select()
        .from(countryCosts)
        .where(eq(countryCosts.isActive, true))
        .orderBy(countryCosts.country);

      if (input.country) {
        results = results.filter((c) => c.country === input.country);
      }
      if (input.visaType) {
        results = results.filter((c) => c.visaType === input.visaType);
      }
      return results;
    }),

  calculateBudget: publicProcedure
    .input(
      z.object({
        country: z.string(),
        visaType: z.string(),
        includeTranslation: z.boolean().default(false),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [cost] = await db
        .select()
        .from(countryCosts)
        .where(
          and(
            eq(countryCosts.country, input.country),
            eq(countryCosts.visaType, input.visaType),
            eq(countryCosts.isActive, true)
          )
        )
        .limit(1);

      if (!cost) return null;

      const total =
        cost.visaFee +
        cost.serviceFee +
        (cost.guaranteeFee ?? 0) +
        (input.includeTranslation ? (cost.translationFee ?? 0) : 0) +
        (cost.otherFees ?? 0);

      return {
        ...cost,
        total,
        breakdown: {
          visaFee: cost.visaFee,
          serviceFee: cost.serviceFee,
          guaranteeFee: cost.guaranteeFee ?? 0,
          translationFee: input.includeTranslation
            ? (cost.translationFee ?? 0)
            : 0,
          otherFees: cost.otherFees ?? 0,
        },
      };
    }),

  seedCountryCosts: protectedProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const defaultCosts = [
      { country: "France", visaType: "Étudiant", visaFee: 99000, serviceFee: 150000, guaranteeFee: 0, translationFee: 50000, otherFees: 20000, processingDays: 30, successRate: 85 },
      { country: "France", visaType: "Travail", visaFee: 99000, serviceFee: 200000, guaranteeFee: 0, translationFee: 75000, otherFees: 30000, processingDays: 45, successRate: 70 },
      { country: "Canada", visaType: "Étudiant", visaFee: 150000, serviceFee: 200000, guaranteeFee: 0, translationFee: 60000, otherFees: 25000, processingDays: 60, successRate: 80 },
      { country: "Canada", visaType: "Travail", visaFee: 150000, serviceFee: 250000, guaranteeFee: 0, translationFee: 80000, otherFees: 35000, processingDays: 90, successRate: 65 },
      { country: "Allemagne", visaType: "Étudiant", visaFee: 75000, serviceFee: 150000, guaranteeFee: 0, translationFee: 50000, otherFees: 20000, processingDays: 30, successRate: 88 },
      { country: "Belgique", visaType: "Étudiant", visaFee: 75000, serviceFee: 130000, guaranteeFee: 0, translationFee: 40000, otherFees: 15000, processingDays: 25, successRate: 90 },
      { country: "USA", visaType: "Tourisme", visaFee: 160000, serviceFee: 100000, guaranteeFee: 0, translationFee: 30000, otherFees: 10000, processingDays: 15, successRate: 75 },
      { country: "Maroc", visaType: "Tourisme", visaFee: 0, serviceFee: 50000, guaranteeFee: 0, translationFee: 0, otherFees: 5000, processingDays: 7, successRate: 95 },
    ];

    for (const cost of defaultCosts) {
      await db.insert(countryCosts).values({ ...cost, isActive: true }).catch(() => {});
    }
    return { success: true, count: defaultCosts.length };
  }),
});
