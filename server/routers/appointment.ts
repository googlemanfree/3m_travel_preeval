/**
 * Routeur tRPC — Prise de rendez-vous en agence.
 * Remplace l'ancienne simulation front-end par un enregistrement réel en
 * base de données + notifications par email (client + agence).
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { appointments, evaluations } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { sendEmail } from "../emailService";

const AGENCY_NOTIFICATION_EMAIL = "hello@3mtravelagency.com";

const AGENCIES: Record<string, { name: string; address: string; phone: string; email: string }> = {
  douala: {
    name: "Agence Douala",
    address: "[Adresse à confirmer]",
    phone: "+237 6XX XXX XXX",
    email: "douala@3mtravelagency.click",
  },
  yaounde: {
    name: "Agence Yaoundé",
    address: "Biyem-Assi, Montée Chapelle Obili, Yaoundé",
    phone: "+237 698 104 832",
    email: "yaounde@3mtravelagency.click",
  },
};

export const appointmentRouter = router({
  /**
   * Créer une demande de rendez-vous en agence.
   * Public : accessible sans compte candidat (depuis la page de résultat
   * d'évaluation, qui n'exige pas toujours une authentification).
   */
  create: publicProcedure
    .input(z.object({
      agency: z.enum(["douala", "yaounde"]),
      date: z.string().min(1),
      time: z.string().min(1),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(1),
      country: z.string().optional(),
      visaType: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const agency = AGENCIES[input.agency];
      const candidateName = `${input.firstName} ${input.lastName}`.trim();

      // On tente de relier le rendez-vous à une évaluation existante du
      // même email (si le candidat a déjà rempli le formulaire de
      // pré-évaluation). Sinon on utilise 0 : la colonne est requise en
      // base mais n'a pas de contrainte de clé étrangère, donc ceci reste
      // sûr — le rendez-vous garde toutes ses vraies informations de
      // contact et n'est simplement pas rattaché à un dossier existant.
      let evaluationId = 0;
      try {
        const existingEval = await db
          .select({ id: evaluations.id })
          .from(evaluations)
          .where(eq(evaluations.email, input.email))
          .orderBy(desc(evaluations.id))
          .limit(1);
        if (existingEval.length > 0) evaluationId = existingEval[0].id;
      } catch {
        // Non bloquant — le rendez-vous est créé même si cette recherche échoue.
      }

      const inserted = await db.insert(appointments).values({
        evaluationId,
        candidateEmail: input.email,
        candidateName,
        candidatePhone: input.phone,
        appointmentDate: input.date,
        appointmentTime: input.time,
        agencyLocation: agency.name,
        agencyAddress: agency.address,
        agencyPhone: agency.phone,
        appointmentReason: "initial_consultation",
        appointmentNotes: [input.country, input.visaType].filter(Boolean).join(" — ") || null,
        status: "pending",
      }).$returningId();

      const appointmentRef = `RDV-${inserted[0]?.id ?? Date.now()}`;
      const formattedDate = new Date(input.date).toLocaleDateString("fr-FR", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });

      // Email de confirmation au candidat (non bloquant : le rendez-vous
      // reste enregistré même si l'envoi échoue).
      try {
        const clientHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Rendez-vous demandé — 3M Travel & Services</h2>
          <p>Bonjour ${candidateName},</p>
          <p>Votre demande de rendez-vous a bien été enregistrée. Notre équipe la confirmera sous peu.</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Référence :</strong> ${appointmentRef}</p>
            <p style="margin: 4px 0;"><strong>Agence :</strong> ${agency.name}</p>
            <p style="margin: 4px 0;"><strong>Date :</strong> ${formattedDate}</p>
            <p style="margin: 4px 0;"><strong>Heure :</strong> ${input.time}</p>
          </div>
          <p style="color: #666;">Merci de vous munir de votre passeport et de tout document pertinent à votre dossier.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">3M Travel & Services - Pré-évaluation Visa & Immigration</p>
        </div>`;
        await sendEmail(input.email, `📅 Rendez-vous demandé — ${appointmentRef}`, clientHtml);
      } catch (err) {
        console.error("[Appointment] Client email failed:", err);
      }

      // Notification à l'agence pour qu'elle confirme le créneau.
      try {
        const agencyHtml = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Nouvelle demande de rendez-vous</h2>
          <p><strong>Référence :</strong> ${appointmentRef}</p>
          <p><strong>Client :</strong> ${candidateName} (${input.email}, ${input.phone})</p>
          <p><strong>Agence demandée :</strong> ${agency.name}</p>
          <p><strong>Date / Heure :</strong> ${formattedDate} à ${input.time}</p>
          ${input.country || input.visaType ? `<p><strong>Projet :</strong> ${[input.country, input.visaType].filter(Boolean).join(" — ")}</p>` : ""}
          <p style="color: #666;">Statut actuel : en attente de confirmation.</p>
        </div>`;
        await sendEmail(AGENCY_NOTIFICATION_EMAIL, `📅 Nouvelle demande de RDV — ${appointmentRef}`, agencyHtml);
      } catch (err) {
        console.error("[Appointment] Agency notification email failed:", err);
      }

      return {
        success: true,
        reference: appointmentRef,
        agency,
      };
    }),
});
