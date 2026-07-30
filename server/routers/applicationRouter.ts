import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { applications, candidateFiles, candidateMessages, dossierProgress, callbackRequests } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { db } from "../db";

export const applicationRouter = router({
  /**
   * Récupérer tous les dossiers du candidat connecté
   */
  getMyApplications: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) throw new Error("Non authentifié");

    const myApplications = await db
      .select()
      .from(applications)
      .where(eq(applications.candidateId, ctx.user.id));

    return myApplications;
  }),

  /**
   * Récupérer un dossier spécifique
   */
  getApplication: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) throw new Error("Non authentifié");

      const app = await db
        .select()
        .from(applications)
        .where(
          and(
            eq(applications.id, input.applicationId),
            eq(applications.candidateId, ctx.user.id)
          )
        )
        .then((rows) => rows[0]);

      if (!app) throw new Error("Dossier non trouvé");
      return app;
    }),

  /**
   * Créer un nouveau dossier
   */
  createApplication: protectedProcedure
    .input(
      z.object({
        fullName: z.string(),
        email: z.string().email(),
        whatsappNumber: z.string(),
        destination: z.enum(["canada", "luxembourg", "pologne", "europe", "golfe", "oceanie", "caucase", "autre"]),
        visaType: z.string().optional(),
        formulaChosen: z.enum(["integral", "echelonne", "garanti"]).default("integral"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) throw new Error("Non authentifié");

      // Générer le numéro de dossier : 3M-YYYY-NNNN
      const year = new Date().getFullYear();
      const count = await db
        .select()
        .from(applications)
        .where(eq(applications.candidateId, ctx.user.id))
        .then((rows) => rows.length + 1);

      const dossierNumber = `3M-${year}-${String(count).padStart(4, "0")}`;

      const newApp = await db
        .insert(applications)
        .values({
          dossierNumber,
          candidateId: ctx.user.id,
          fullName: input.fullName,
          email: input.email,
          whatsappNumber: input.whatsappNumber,
          destination: input.destination,
          visaType: input.visaType,
          formulaChosen: input.formulaChosen,
          dossierStatus: "nouveau",
          paymentStatus: "PENDING",
        })
        .returning();

      return newApp[0];
    }),

  /**
   * Mettre à jour un dossier
   */
  updateApplication: protectedProcedure
    .input(
      z.object({
        applicationId: z.number(),
        data: z.object({
          fullName: z.string().optional(),
          email: z.string().email().optional(),
          whatsappNumber: z.string().optional(),
          visaType: z.string().optional(),
          destination: z.enum(["canada", "luxembourg", "pologne", "europe", "golfe", "oceanie", "caucase", "autre"]).optional(),
          formulaChosen: z.enum(["integral", "echelonne", "garanti"]).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) throw new Error("Non authentifié");

      const app = await db
        .select()
        .from(applications)
        .where(
          and(
            eq(applications.id, input.applicationId),
            eq(applications.candidateId, ctx.user.id)
          )
        )
        .then((rows) => rows[0]);

      if (!app) throw new Error("Dossier non trouvé");

      const updated = await db
        .update(applications)
        .set(input.data)
        .where(eq(applications.id, input.applicationId))
        .returning();

      return updated[0];
    }),

  /**
   * Récupérer la progression du dossier
   */
  getApplicationProgress: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) throw new Error("Non authentifié");

      // Vérifier que l'application appartient au candidat
      const app = await db
        .select()
        .from(applications)
        .where(
          and(
            eq(applications.id, input.applicationId),
            eq(applications.candidateId, ctx.user.id)
          )
        )
        .then((rows) => rows[0]);

      if (!app) throw new Error("Dossier non trouvé");

      // Récupérer la progression
      const progress = await db
        .select()
        .from(dossierProgress)
        .where(eq(dossierProgress.applicationId, input.applicationId))
        .orderBy(dossierProgress.createdAt);

      return progress;
    }),

  /**
   * Récupérer les documents du dossier
   */
  getApplicationDocuments: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) throw new Error("Non authentifié");

      // Vérifier que l'application appartient au candidat
      const app = await db
        .select()
        .from(applications)
        .where(
          and(
            eq(applications.id, input.applicationId),
            eq(applications.candidateId, ctx.user.id)
          )
        )
        .then((rows) => rows[0]);

      if (!app) throw new Error("Dossier non trouvé");

      // Récupérer les documents
      const docs = await db
        .select()
        .from(candidateFiles)
        .where(eq(candidateFiles.candidateId, ctx.user.id));

      return docs;
    }),

  /**
   * Uploader un document
   */
  uploadDocument: protectedProcedure
    .input(
      z.object({
        applicationId: z.number(),
        fileType: z.enum(["cv", "passeport", "diplome", "releve_notes", "photo", "justificatif_domicile", "extrait_naissance", "casier_judiciaire", "autre"]),
        fileName: z.string(),
        fileUrl: z.string(),
        fileKey: z.string(),
        fileSizeBytes: z.number().optional(),
        mimeType: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) throw new Error("Non authentifié");

      // Vérifier que l'application appartient au candidat
      const app = await db
        .select()
        .from(applications)
        .where(
          and(
            eq(applications.id, input.applicationId),
            eq(applications.candidateId, ctx.user.id)
          )
        )
        .then((rows) => rows[0]);

      if (!app) throw new Error("Dossier non trouvé");

      const newFile = await db
        .insert(candidateFiles)
        .values({
          candidateId: ctx.user.id,
          fileType: input.fileType,
          fileName: input.fileName,
          fileUrl: input.fileUrl,
          fileKey: input.fileKey,
          fileSizeBytes: input.fileSizeBytes,
          mimeType: input.mimeType,
          status: "uploaded",
        })
        .returning();

      return newFile[0];
    }),

  /**
   * Récupérer les messages du dossier
   */
  getApplicationMessages: protectedProcedure
    .input(z.object({ applicationId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) throw new Error("Non authentifié");

      // Vérifier que l'application appartient au candidat
      const app = await db
        .select()
        .from(applications)
        .where(
          and(
            eq(applications.id, input.applicationId),
            eq(applications.candidateId, ctx.user.id)
          )
        )
        .then((rows) => rows[0]);

      if (!app) throw new Error("Dossier non trouvé");

      // Récupérer les messages
      const messages = await db
        .select()
        .from(candidateMessages)
        .where(eq(candidateMessages.candidateId, ctx.user.id));

      return messages;
    }),

  /**
   * Envoyer un message
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        applicationId: z.number(),
        content: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) throw new Error("Non authentifié");

      // Vérifier que l'application appartient au candidat
      const app = await db
        .select()
        .from(applications)
        .where(
          and(
            eq(applications.id, input.applicationId),
            eq(applications.candidateId, ctx.user.id)
          )
        )
        .then((rows) => rows[0]);

      if (!app) throw new Error("Dossier non trouvé");

      const newMessage = await db
        .insert(candidateMessages)
        .values({
          candidateId: ctx.user.id,
          senderRole: "candidate",
          content: input.content,
          isRead: false,
        })
        .returning();

      return newMessage[0];
    }),

  /**
   * Créer une demande de rappel
   */
  createCallbackRequest: protectedProcedure
    .input(
      z.object({
        applicationId: z.number(),
        preferredDate: z.string().optional(),
        preferredTime: z.string().optional(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) throw new Error("Non authentifié");

      // Vérifier que l'application appartient au candidat
      const app = await db
        .select()
        .from(applications)
        .where(
          and(
            eq(applications.id, input.applicationId),
            eq(applications.candidateId, ctx.user.id)
          )
        )
        .then((rows) => rows[0]);

      if (!app) throw new Error("Dossier non trouvé");

      const newRequest = await db
        .insert(callbackRequests)
        .values({
          applicationId: input.applicationId,
          fullName: app.fullName,
          phone: app.whatsappNumber,
          preferredDate: input.preferredDate,
          preferredTime: input.preferredTime,
          reason: input.reason,
          status: "pending",
        })
        .returning();

      return newRequest[0];
    }),
});
