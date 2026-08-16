import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { evisaRequests } from "../../drizzle/evisaSchema";
import { adminNotifications } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import { sendEmail } from "../_core/email";
import { requireValidAdminSession } from "./adminAuth";
import { eq, desc } from "drizzle-orm";

export const evisaRouter = router({
  analyzeWithAI: publicProcedure
    .input(z.object({ countryCode: z.string(), countryName: z.string(), candidateInfo: z.record(z.any()) }))
    .mutation(async ({ input }) => {
      let advice = `Vérification préliminaire pour ${input.countryName} en cours. Votre dossier sera traité avec soin par nos experts.`;
      try {
        const res = await invokeLLM({
          messages: [
            { role: "system", content: "Tu es un assistant consulaire et expert en e-Visa. Réponds en français de façon concise." },
            { role: "user", content: `Analyse la demande d'e-Visa pour ${input.countryName} (${input.countryCode}) avec ces données : ${JSON.stringify(input.candidateInfo)}.` }
          ]
        });
        const content = res.choices[0]?.message?.content;
        if (typeof content === "string") advice = content;
        else if (Array.isArray(content)) advice = content.map(p => ('text' in p ? p.text : '')).join(' ');
      } catch {
        // repli transparent
      }
      return { success: true, advice };
    }),

  submitRequest: publicProcedure
    .input(z.object({
      candidateId: z.number().int().positive().optional(),
      candidateEmail: z.string().email(),
      fullName: z.string().min(2),
      phone: z.string().min(6),
      countryCode: z.string(),
      countryName: z.string(),
      formData: z.record(z.any()),
      documents: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const reference = `EVS-${input.countryCode.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

      await db.insert(evisaRequests).values({
        reference,
        candidateId: input.candidateId || null,
        candidateEmail: input.candidateEmail,
        fullName: input.fullName,
        phone: input.phone,
        countryCode: input.countryCode,
        countryName: input.countryName,
        formDataJson: JSON.stringify(input.formData),
        documentsJson: input.documents ? JSON.stringify(input.documents) : null,
        status: "new",
      });

      // Notification admin
      await db.insert(adminNotifications).values({
        type: "new_contact_message",
        title: `Nouvelle demande e-Visa (${input.countryName})`,
        message: `${input.fullName} (${input.candidateEmail}) — Réf: ${reference}`,
        relatedId: reference,
        targetAdminType: "accompagnement",
      });

      // E-mail de confirmation au client
      try {
        await sendEmail({
          to: input.candidateEmail,
          subject: `[3M Travel] Confirmation de votre demande e-Visa pour ${input.countryName} (${reference})`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 8px;">
              <h2 style="color: #1e3a8a; margin-top: 0;">Demande e-Visa enregistrée</h2>
              <p>Bonjour <strong>${input.fullName}</strong>,</p>
              <p>Votre demande d'e-Visa pour <strong>${input.countryName}</strong> a bien été transmise à notre back-office.</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <p style="margin: 0 0 8px 0;"><strong>Référence de dossier :</strong> <span style="font-family: monospace; font-weight: bold; color: #2563eb;">${reference}</span></p>
                <p style="margin: 0;">Nos agents traitent votre dossier et vous contacteront sous 24h à 48h.</p>
              </div>
              <p>Cordialement,<br/><strong>L'équipe 3M Travel & Services</strong></p>
            </div>
          `,
        });
      } catch (err) {
        console.error("[Email Error] Impossible d'envoyer l'e-mail de confirmation e-Visa:", err);
      }

      return { success: true, reference };
    }),

  adminList: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });
      const requests = await db.select().from(evisaRequests).orderBy(desc(evisaRequests.createdAt));
      return requests;
    }),
});
