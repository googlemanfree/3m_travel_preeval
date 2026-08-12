/**
 * Routeur tRPC — Demandes de consultation avec CV
 *
 * Flux : candidat soumet (infos + CV déjà uploadé) → analyse IA automatique
 * en arrière-plan → un admin relit/valide (et peut ajuster le texte) →
 * envoi de l'email final au candidat → visible dans son espace.
 * Le rapport IA n'est JAMAIS envoyé directement sans validation humaine.
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { consultationRequests } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { sendEmail } from "../_core/email";
import { logger } from "../_core/logger";
import { extractTextFromPDF, generateAIEvaluationReport } from "../aiEvaluationService";
import { requireValidAdminSession } from "./adminAuth";
import { candidateProcedure } from "./candidate";

export const consultationRequestRouter = router({
  /**
   * Soumission du formulaire (le CV est déjà uploadé côté client via
   * /api/candidate/upload-public, on ne reçoit ici que son URL).
   */
  submit: publicProcedure
    .input(z.object({
      fullName: z.string().min(3),
      email: z.string().email(),
      phone: z.string().optional(),
      targetCountry: z.string().optional(),
      message: z.string().optional(),
      cvFileUrl: z.string().url().optional(),
      cvFileName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const inserted = await db.insert(consultationRequests).values({
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        targetCountry: input.targetCountry,
        message: input.message,
        cvFileUrl: input.cvFileUrl,
        cvFileName: input.cvFileName,
        status: input.cvFileUrl ? "pending_ai" : "pending_review",
      }).$returningId();

      const requestId = inserted[0]?.id;

      // Notifier l'équipe qu'une nouvelle demande est arrivée
      try {
        await sendEmail({
          to: "hello@3mtravelagency.com",
          subject: `📋 Nouvelle demande de consultation — ${input.fullName}`,
          html: `<p><strong>${input.fullName}</strong> (${input.email}, ${input.phone || "N/A"}) — Destination : ${input.targetCountry || "non précisée"}.</p>
                 <p>${input.cvFileUrl ? "CV joint — analyse IA en cours, à valider dans le tableau de bord admin." : "Pas de CV joint — à examiner manuellement."}</p>`,
        });
      } catch (err) {
        logger.error("consultation_request.team_notification_failed", { requestId }, err);
      }

      let emailSent = false;
      try {
        await sendEmail({
          to: input.email,
          subject: "Confirmation de votre demande — 3M Travel & Services",
          html: `<p>Bonjour <strong>${input.fullName}</strong>,</p><p>Nous avons bien reçu votre demande de consultation${input.targetCountry ? ` pour ${input.targetCountry}` : ""}.</p><p>Notre équipe va l’examiner et vous recontactera à l’adresse <strong>${input.email}</strong>. Vous pouvez conserver cet e-mail comme confirmation de réception.</p><p>Cordialement,<br>L’équipe 3M Travel & Services</p>`,
        });
        emailSent = true;
      } catch (err) {
        logger.error("consultation_request.candidate_confirmation_failed", { requestId }, err);
      }

      // Analyse automatique par IA en arrière-plan, si un CV a été fourni
      if (requestId && input.cvFileUrl) {
        (async () => {
          try {
            const pdfResponse = await fetch(input.cvFileUrl!);
            const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
            const cvText = await extractTextFromPDF(pdfBuffer);
            const openaiKey = process.env.OPENAI_API_KEY;
            const report = await generateAIEvaluationReport(
              cvText,
              input.fullName,
              input.targetCountry || "non précisée",
              openaiKey
            );
            await db.update(consultationRequests)
              .set({ aiReportContent: report, aiProcessedAt: new Date(), status: "pending_review" })
              .where(eq(consultationRequests.id, requestId));
            logger.info("consultation_request.ai_analysis.completed", { requestId });
          } catch (err) {
            logger.error("consultation_request.ai_analysis.failed", { requestId }, err);
            try {
              await db.update(consultationRequests)
                .set({ aiProcessingError: err instanceof Error ? err.message : String(err), status: "pending_review" })
                .where(eq(consultationRequests.id, requestId));
            } catch {}
          }
        })();
      }

      return { success: true, requestId, emailSent };
    }),

  /**
   * Historique du candidat connecté (pour "Mon Espace") — ne montre que les
   * demandes déjà validées et envoyées par un admin, jamais le rapport IA
   * brut non relu.
   */
  getMyConsultations: candidateProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const rows = await db.select().from(consultationRequests)
      .where(eq(consultationRequests.email, ctx.candidate.email))
      .orderBy(desc(consultationRequests.createdAt));

    // On ne renvoie le contenu du rapport que pour les demandes déjà validées et envoyées.
    return rows.map((r) => ({
      id: r.id,
      targetCountry: r.targetCountry,
      status: r.status,
      createdAt: r.createdAt,
      sentToClientAt: r.sentToClientAt,
      finalReportContent: r.status === "validated_sent" ? r.finalReportContent : null,
    }));
  }),

  /**
   * Liste des demandes pour le tableau de bord admin (avec filtre par statut).
   */
  listForAdmin: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      status: z.enum(["pending_ai", "pending_review", "validated_sent", "rejected"]).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const rows = await db.select().from(consultationRequests).orderBy(desc(consultationRequests.createdAt));
      const filtered = input.status ? rows.filter((r) => r.status === input.status) : rows;
      const total = filtered.length;
      const page = filtered.slice(input.offset, input.offset + input.limit);

      return { items: page, total };
    }),

  /**
   * Un admin valide (avec un texte final, potentiellement ajusté par rapport
   * au rapport IA brut) et l'email part immédiatement au candidat.
   */
  validateAndSend: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      requestId: z.number(),
      finalReportContent: z.string().min(10),
      adminNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const admin = await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const rows = await db.select().from(consultationRequests).where(eq(consultationRequests.id, input.requestId)).limit(1);
      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Demande introuvable." });
      const request = rows[0];

      const emailHtml = `<div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color:#0a2540;">
        <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 24px; border-radius: 10px 10px 0 0; text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">📋 Votre consultation ${request.targetCountry || ""}</h1>
          <p style="color:#dbeafe;margin:6px 0 0;">3M Travel & Services SARL</p>
        </div>
        <div style="padding:24px;border:1px solid #eee;border-top:none;">
          <p>Bonjour ${request.fullName},</p>
          <p>Voici le retour de notre équipe suite à votre demande de consultation :</p>
          <div style="background:#f4f6f8;border-left:4px solid #2563eb;padding:16px;border-radius:6px;white-space:pre-line;">${input.finalReportContent}</div>
          <p style="text-align:center;margin:28px 0;">
            <a href="https://wa.me/237698104832?text=${encodeURIComponent(`Bonjour, je viens de recevoir mon retour de consultation pour ${request.targetCountry || ""} et je souhaite en discuter.`)}"
               style="background:#28a745;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
              💬 Discuter sur WhatsApp
            </a>
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
          <p style="font-size:12px;color:#666;text-align:center;">3M Travel & Services SARL — +237 698 104 832 | hello@3mtravelagency.com</p>
        </div>
      </div>`;

      try {
        await sendEmail({ to: request.email, subject: `📋 Votre consultation ${request.targetCountry || ""} — 3M Travel`, html: emailHtml });
      } catch (err) {
        logger.error("consultation_request.send_to_client_failed", { requestId: input.requestId }, err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Échec de l'envoi de l'email au candidat." });
      }

      await db.update(consultationRequests).set({
        finalReportContent: input.finalReportContent,
        adminNotes: input.adminNotes,
        status: "validated_sent",
        validatedByAdminEmail: admin.email,
        validatedAt: new Date(),
        sentToClientAt: new Date(),
      }).where(eq(consultationRequests.id, input.requestId));

      logger.info("consultation_request.validated_and_sent", { requestId: input.requestId, adminEmail: admin.email });

      return { success: true };
    }),

  /** Rejeter une demande (pas d'envoi au candidat). */
  reject: publicProcedure
    .input(z.object({ sessionToken: z.string(), requestId: z.number(), adminNotes: z.string().optional() }))
    .mutation(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(consultationRequests).set({ status: "rejected", adminNotes: input.adminNotes }).where(eq(consultationRequests.id, input.requestId));
      return { success: true };
    }),
});
