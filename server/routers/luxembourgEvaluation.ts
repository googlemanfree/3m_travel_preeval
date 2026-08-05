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

      // Email au candidat
      try {
        await sendEmail({ to: input.email, subject: `🌍 Votre évaluation Luxembourg — Score ${result.scoreTotal}/100`, html: emailHtml });
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
});
