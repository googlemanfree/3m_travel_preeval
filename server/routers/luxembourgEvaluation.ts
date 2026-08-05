/**
 * Routeur tRPC — Évaluation d'éligibilité Luxembourg
 * Calcule le score, sauvegarde le résultat, envoie l'email au candidat et
 * notifie l'équipe (WhatsApp lien + email interne).
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { luxembourgEvaluations } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { sendEmail } from "../_core/email";
import { logger } from "../_core/logger";
import { computeLuxembourgScore, getAlternativeDestinations } from "../luxembourgScoringEngine";
import { generateLuxembourgPDF } from "../luxembourgPdfGenerator";
import { requireValidAdminSession } from "./adminAuth";
import { candidateProcedure } from "./candidate";
import { applications } from "../../drizzle/schema";

const submitInput = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  phone: z.string().optional(),
  jobTitle: z.string().min(3),
  yearsExperience: z.number().min(0).max(50),
  sector: z.enum(["sante", "documentation", "education", "finance", "technologie", "administration", "rh", "metiers_mecanique", "autre"]),
  educationLevel: z.enum(["master_dual", "licence_cert", "bac_cqp"]),
  frenchLevel: z.enum(["natif_c2", "b2", "b1"]),
  englishLevel: z.enum(["b2_plus", "b1_b2", "moins_b1", "absent"]),
  skillsLevel: z.enum(["excellentes", "bonnes", "basiques"]),
  softSkills: z.array(z.enum(["leadership", "gestion_stress", "adaptabilite", "communication"])).default([]),
});

function buildResultEmailHtml(fullName: string, result: ReturnType<typeof computeLuxembourgScore>, alternatives: ReturnType<typeof getAlternativeDestinations>) {
  const barsHtml = [
    ["Formation", result.scoreFormation, 15],
    ["Expérience", result.scoreExperience, 15],
    ["Français", result.scoreFrancais, 15],
    ["Anglais", result.scoreAnglais, 15],
    ["Secteur (Luxembourg)", result.scoreSecteur, 15],
    ["Compétences", result.scoreCompetences, 15],
    ["Bonus soft skills", result.scoreBonus, 10],
  ].map(([label, val, max]) => `
    <tr>
      <td style="padding:6px 0;color:#0a2540;">${label}</td>
      <td style="padding:6px 0;text-align:right;font-weight:bold;color:#667eea;">${val}/${max}</td>
    </tr>`).join("");

  const altHtml = result.eligibilityStatus === "non_eligible"
    ? `<h3 style="color:#764ba2;margin-top:24px;">🌍 Destinations alternatives recommandées</h3>
       <table style="width:100%;border-collapse:collapse;">
         ${alternatives.map(a => `
           <tr style="border-bottom:1px solid #eee;">
             <td style="padding:8px 4px;"><strong>${a.name}</strong><br/><span style="font-size:12px;color:#666;">${a.advantage}</span></td>
             <td style="padding:8px 4px;text-align:right;">${a.salaryRange}<br/><span style="font-size:12px;color:#666;">${a.timeline}</span></td>
           </tr>`).join("")}
       </table>`
    : "";

  return `<div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color:#0a2540;">
    <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 24px; border-radius: 10px 10px 0 0; text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">🌍 Système d'Évaluation Candidats</h1>
      <p style="color:#e5e7ff;margin:6px 0 0;">3M Travel & Services SARL</p>
    </div>
    <div style="padding:24px;border:1px solid #eee;border-top:none;">
      <p>Bonjour <strong>${fullName}</strong>,</p>
      <p>Voici le résultat de votre évaluation d'éligibilité pour le Luxembourg :</p>

      <div style="text-align:center;margin:24px 0;">
        <div style="font-size:42px;font-weight:bold;color:#667eea;">${result.scoreTotal}/100</div>
        <div style="font-size:16px;font-weight:bold;margin-top:4px;">${result.statusLabel}</div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">${barsHtml}</table>

      <div style="background:#f4f6f8;border-left:4px solid #667eea;padding:14px;border-radius:6px;">
        <p style="margin:0;">${result.recommendationText}</p>
      </div>

      ${altHtml}

      <p style="margin-top:24px;">Frais d'ouverture de dossier : <strong>65 000 FCFA</strong> (non remboursables).</p>

      <p style="text-align:center;margin:28px 0;">
        <a href="https://wa.me/237698104832?text=${encodeURIComponent(`Bonjour, je viens de recevoir mon évaluation Luxembourg (score ${result.scoreTotal}/100) et je souhaite en discuter.`)}"
           style="background:#28a745;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
          💬 Discuter sur WhatsApp
        </a>
      </p>

      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
      <p style="font-size:12px;color:#666;text-align:center;">
        3M Travel & Services SARL — "Votre mobilité, notre expertise. Votre réussite, notre mission."<br/>
        +237 698 104 832 | hello@3mtravelagency.com | www.3mtravelagency.click<br/>
        RC/YAO/2019/A/2567
      </p>
    </div>
  </div>`;
}

export const luxembourgEvaluationRouter = router({
  submit: publicProcedure
    .input(submitInput)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const result = computeLuxembourgScore(input);
      const alternatives = getAlternativeDestinations(result.scoreTotal);

      let evaluationId: number;
      try {
        const inserted = await db.insert(luxembourgEvaluations).values({
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          jobTitle: input.jobTitle,
          yearsExperience: input.yearsExperience,
          sector: input.sector,
          educationLevel: input.educationLevel,
          frenchLevel: input.frenchLevel,
          englishLevel: input.englishLevel,
          skillsLevel: input.skillsLevel,
          softSkills: input.softSkills,
          scoreFormation: result.scoreFormation,
          scoreExperience: result.scoreExperience,
          scoreFrancais: result.scoreFrancais,
          scoreAnglais: result.scoreAnglais,
          scoreSecteur: result.scoreSecteur,
          scoreCompetences: result.scoreCompetences,
          scoreBonus: result.scoreBonus,
          scoreTotal: result.scoreTotal,
          eligibilityStatus: result.eligibilityStatus,
        }).$returningId();

        evaluationId = inserted[0]?.id ?? 0;
      } catch (err) {
        logger.error("luxembourg_evaluation.save_failed", { email: input.email }, err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors de l'enregistrement de votre évaluation." });
      }

      const emailHtml = buildResultEmailHtml(input.fullName, result, alternatives);

      // Email au candidat avec PDF
      try {
        const pdfBuffer = generateLuxembourgPDF({
          fullName: input.fullName,
          email: input.email,
          jobTitle: input.jobTitle,
          yearsExperience: input.yearsExperience,
          scoreFormation: result.scoreFormation,
          scoreExperience: result.scoreExperience,
          scoreFrancais: result.scoreFrancais,
          scoreAnglais: result.scoreAnglais,
          scoreSecteur: result.scoreSecteur,
          scoreCompetences: result.scoreCompetences,
          scoreBonus: result.scoreBonus,
          scoreTotal: result.scoreTotal,
          statusLabel: result.statusLabel,
          recommendationText: result.recommendationText,
        });

        const emailWithPdf = emailHtml + `
          <p style="margin-top:24px;font-size:12px;color:#666;">
            <strong>📎 Pièce jointe :</strong> Votre rapport d'évaluation (PDF) est joint à cet email.
          </p>`;

        await sendEmail({ to: input.email, subject: `🌍 Votre évaluation Luxembourg — Score ${result.scoreTotal}/100`, html: emailWithPdf });
        await db.update(luxembourgEvaluations).set({ emailSentAt: new Date() }).where(eq(luxembourgEvaluations.id, evaluationId));
      } catch (err) {
        logger.error("luxembourg_evaluation.candidate_email_failed", { email: input.email }, err);
      }

      // Notification interne à l'équipe
      try {
        await sendEmail({
          to: "hello@3mtravelagency.com",
          subject: `📋 Nouvelle évaluation Luxembourg — ${input.fullName} (${result.scoreTotal}/100)`,
          html: `<p><strong>${input.fullName}</strong> (${input.email}, ${input.phone || "N/A"}) vient de compléter l'évaluation Luxembourg.</p>
                 <p><strong>Score :</strong> ${result.scoreTotal}/100 — ${result.statusLabel}</p>
                 <p><strong>Poste :</strong> ${input.jobTitle} — ${input.yearsExperience} ans d'expérience — Secteur : ${input.sector}</p>`,
        });
      } catch (err) {
        logger.error("luxembourg_evaluation.team_notification_failed", {}, err);
      }

      logger.info("luxembourg_evaluation.completed", { email: input.email, score: result.scoreTotal, status: result.eligibilityStatus });

      // Lien WhatsApp prêt pour notifier l'équipe immédiatement depuis le front (bouton "Envoyer")
      const teamWhatsappUrl = `https://wa.me/237698104832?text=${encodeURIComponent(
        `📋 Nouvelle évaluation Luxembourg\nCandidat : ${input.fullName}\nEmail : ${input.email}\nScore : ${result.scoreTotal}/100 — ${result.statusLabel}`
      )}`;

      return {
        success: true,
        evaluationId,
        result,
        alternatives: result.eligibilityStatus === "non_eligible" ? alternatives : [],
        teamWhatsappUrl,
      };
    }),

  /**
   * Historique des évaluations du candidat connecté (pour "Mon Espace"),
   * résolu depuis son JWT — jamais depuis un paramètre client.
   */
  getMyEvaluations: candidateProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

    const rows = await db.select().from(luxembourgEvaluations)
      .where(eq(luxembourgEvaluations.email, ctx.candidate.email))
      .orderBy(desc(luxembourgEvaluations.createdAt));

    return rows;
  }),

  /**
   * Historique des évaluations (réservé aux admins), avec recherche et
   * filtre par statut d'éligibilité.
   */
  listEvaluations: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      search: z.string().optional(),
      status: z.enum(["tres_eligible", "eligible", "moderement_eligible", "non_eligible"]).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const rows = await db.select().from(luxembourgEvaluations).orderBy(desc(luxembourgEvaluations.createdAt));

      let filtered = rows;
      if (input.status) filtered = filtered.filter((r) => r.eligibilityStatus === input.status);
      if (input.search) {
        const q = input.search.toLowerCase();
        filtered = filtered.filter((r) => r.fullName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
      }

      const total = filtered.length;
      const page = filtered.slice(input.offset, input.offset + input.limit);

      const applicationRows = await db.select({ email: applications.email }).from(applications);
      const convertedEmails = new Set(applicationRows.map((a) => a.email.toLowerCase()));

      const items = page.map((r) => ({
        ...r,
        convertedToDossier: convertedEmails.has(r.email.toLowerCase()),
      }));

      return { items, total };
    }),

  /**
   * Statistiques agrégées pour le tableau de bord admin.
   */
  getStats: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const rows = await db.select().from(luxembourgEvaluations);
      const applicationRows = await db.select({ email: applications.email }).from(applications);
      const convertedEmails = new Set(applicationRows.map((a) => a.email.toLowerCase()));

      const total = rows.length;
      const byStatus = {
        tres_eligible: rows.filter((r) => r.eligibilityStatus === "tres_eligible").length,
        eligible: rows.filter((r) => r.eligibilityStatus === "eligible").length,
        moderement_eligible: rows.filter((r) => r.eligibilityStatus === "moderement_eligible").length,
        non_eligible: rows.filter((r) => r.eligibilityStatus === "non_eligible").length,
      };
      const avgScore = total > 0 ? Math.round(rows.reduce((sum, r) => sum + r.scoreTotal, 0) / total) : 0;
      const convertedCount = rows.filter((r) => convertedEmails.has(r.email.toLowerCase())).length;
      const conversionRate = total > 0 ? Math.round((convertedCount / total) * 1000) / 10 : 0;
      const emailSuccessCount = rows.filter((r) => r.emailSentAt !== null).length;

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentByDay: Record<string, number> = {};
      for (const r of rows) {
        if (new Date(r.createdAt) < thirtyDaysAgo) continue;
        const day = new Date(r.createdAt).toISOString().slice(0, 10);
        recentByDay[day] = (recentByDay[day] || 0) + 1;
      }

      return { total, byStatus, avgScore, convertedCount, conversionRate, emailSuccessCount, recentByDay };
    }),
});
