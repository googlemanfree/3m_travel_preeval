/**
 * Routeur tRPC — Évaluation d'éligibilité Visa Études
 * Calcule le score, sauvegarde le résultat, envoie l'email au candidat et
 * notifie l'équipe.
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { studyVisaEvaluations } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { sendEmail } from "../_core/email";
import { logger } from "../_core/logger";
// Moteur de scoring autonome (ne dépend pas de studyVisaScoringEngine.ts,
// qui sert désormais un système d'évaluation études plus riche et séparé —
// pour éviter tout conflit futur entre les deux).
function computeSimpleStudyScore(input: {
  academicLevel: string; gradeLevel: string; languageLevel: string;
  admissionStatus: string; financialCapacity: string; returnTies: string;
}) {
  const academicMap: Record<string, number> = { master_mention: 20, licence: 15, bac2: 10, bac: 5 };
  const gradeMap: Record<string, number> = { tres_bien: 15, bien: 11, assez_bien: 7, passable: 3 };
  const languageMap: Record<string, number> = { c1_c2: 20, b2: 15, b1: 8, moins_b1: 3 };
  const admissionMap: Record<string, number> = { admis: 15, en_cours: 8, pas_commence: 3 };
  const financialMap: Record<string, number> = { complete: 20, partielle: 10, incertaine: 3 };
  const tiesMap: Record<string, number> = { solide: 10, modere: 5, faible: 2 };

  const scoreAcademic = academicMap[input.academicLevel] ?? 0;
  const scoreGrades = gradeMap[input.gradeLevel] ?? 0;
  const scoreLanguage = languageMap[input.languageLevel] ?? 0;
  const scoreAdmission = admissionMap[input.admissionStatus] ?? 0;
  const scoreFinancial = financialMap[input.financialCapacity] ?? 0;
  const scoreReturnTies = tiesMap[input.returnTies] ?? 0;
  const scoreTotal = scoreAcademic + scoreGrades + scoreLanguage + scoreAdmission + scoreFinancial + scoreReturnTies;

  let eligibilityStatus: "tres_favorable" | "favorable" | "a_renforcer" | "risque_eleve";
  let statusLabel: string;
  let recommendationText: string;

  if (scoreTotal >= 80) {
    eligibilityStatus = "tres_favorable";
    statusLabel = "✅✅✅ Profil très favorable";
    recommendationText = "Votre profil réunit les éléments généralement recherchés pour une demande de visa étudiant solide. Nous pouvons démarrer la constitution de votre dossier rapidement.";
  } else if (scoreTotal >= 65) {
    eligibilityStatus = "favorable";
    statusLabel = "✅✅ Profil favorable";
    recommendationText = "Votre profil est globalement solide. Quelques points peuvent encore être renforcés (langue, preuve de financement) pour maximiser vos chances.";
  } else if (scoreTotal >= 45) {
    eligibilityStatus = "a_renforcer";
    statusLabel = "🟡 Profil à renforcer";
    recommendationText = "Certains critères clés méritent d'être consolidés avant le dépôt — notamment le niveau de langue ou la preuve de ressources financières. Nous pouvons vous accompagner pour les renforcer.";
  } else {
    eligibilityStatus = "risque_eleve";
    statusLabel = "🔴 Risque de refus élevé en l'état";
    recommendationText = "En l'état, plusieurs critères déterminants sont faibles. Un accompagnement rapproché est recommandé avant tout dépôt pour identifier une stratégie réaliste.";
  }

  return { scoreAcademic, scoreGrades, scoreLanguage, scoreAdmission, scoreFinancial, scoreReturnTies, scoreTotal, eligibilityStatus, statusLabel, recommendationText };
}
import { requireValidAdminSession } from "./adminAuth";
import { candidateProcedure } from "./candidate";

const submitInput = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  phone: z.string().optional(),
  targetCountry: z.string().optional(),
  academicLevel: z.enum(["master_mention", "licence", "bac2", "bac"]),
  gradeLevel: z.enum(["tres_bien", "bien", "assez_bien", "passable"]),
  languageLevel: z.enum(["c1_c2", "b2", "b1", "moins_b1"]),
  admissionStatus: z.enum(["admis", "en_cours", "pas_commence"]),
  financialCapacity: z.enum(["complete", "partielle", "incertaine"]),
  returnTies: z.enum(["solide", "modere", "faible"]),
});

function buildResultEmailHtml(fullName: string, result: ReturnType<typeof computeSimpleStudyScore>, targetCountry?: string) {
  const rows = [
    ["Niveau académique", result.scoreAcademic, 20],
    ["Résultats scolaires", result.scoreGrades, 15],
    ["Niveau de langue", result.scoreLanguage, 20],
    ["Statut d'admission", result.scoreAdmission, 15],
    ["Capacité financière", result.scoreFinancial, 20],
    ["Projet de retour", result.scoreReturnTies, 10],
  ].map(([label, val, max]) => `
    <tr><td style="padding:6px 0;">${label}</td><td style="padding:6px 0;text-align:right;font-weight:bold;color:#2563eb;">${val}/${max}</td></tr>`).join("");

  return `<div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color:#0a2540;">
    <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 24px; border-radius: 10px 10px 0 0; text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">🎓 Évaluation Visa Études</h1>
      <p style="color:#dbeafe;margin:6px 0 0;">3M Travel & Services SARL</p>
    </div>
    <div style="padding:24px;border:1px solid #eee;border-top:none;">
      <p>Bonjour <strong>${fullName}</strong>,</p>
      <p>Voici le résultat de votre évaluation${targetCountry ? ` pour un projet d'études en <strong>${targetCountry}</strong>` : ""} :</p>
      <div style="text-align:center;margin:24px 0;">
        <div style="font-size:42px;font-weight:bold;color:#2563eb;">${result.scoreTotal}/100</div>
        <div style="font-size:16px;font-weight:bold;margin-top:4px;">${result.statusLabel}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">${rows}</table>
      <div style="background:#f4f6f8;border-left:4px solid #2563eb;padding:14px;border-radius:6px;">
        <p style="margin:0;">${result.recommendationText}</p>
      </div>
      <p style="text-align:center;margin:28px 0;">
        <a href="https://wa.me/237698104832?text=${encodeURIComponent(`Bonjour, je viens de recevoir mon évaluation Visa Études (score ${result.scoreTotal}/100) et je souhaite en discuter.`)}"
           style="background:#28a745;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
          💬 Discuter sur WhatsApp
        </a>
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
      <p style="font-size:12px;color:#666;text-align:center;">
        3M Travel & Services SARL — +237 698 104 832 | hello@3mtravelagency.com
      </p>
    </div>
  </div>`;
}

export const studyVisaEvaluationRouter = router({
  submit: publicProcedure
    .input(submitInput)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible." });

      const result = computeSimpleStudyScore(input);

      let evaluationId: number;
      try {
        const inserted = await db.insert(studyVisaEvaluations).values({
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          targetCountry: input.targetCountry,
          academicLevel: input.academicLevel,
          gradeLevel: input.gradeLevel,
          languageLevel: input.languageLevel,
          admissionStatus: input.admissionStatus,
          financialCapacity: input.financialCapacity,
          returnTies: input.returnTies,
          scoreAcademic: result.scoreAcademic,
          scoreGrades: result.scoreGrades,
          scoreLanguage: result.scoreLanguage,
          scoreAdmission: result.scoreAdmission,
          scoreFinancial: result.scoreFinancial,
          scoreReturnTies: result.scoreReturnTies,
          scoreTotal: result.scoreTotal,
          eligibilityStatus: result.eligibilityStatus,
        }).$returningId();
        evaluationId = inserted[0]?.id ?? 0;
      } catch (err) {
        logger.error("study_visa_evaluation.save_failed", { email: input.email }, err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erreur lors de l'enregistrement de votre évaluation." });
      }

      const emailHtml = buildResultEmailHtml(input.fullName, result, input.targetCountry);

      try {
        await sendEmail({ to: input.email, subject: `🎓 Votre évaluation Visa Études — Score ${result.scoreTotal}/100`, html: emailHtml });
        await db.update(studyVisaEvaluations).set({ emailSentAt: new Date() }).where(eq(studyVisaEvaluations.id, evaluationId));
      } catch (err) {
        logger.error("study_visa_evaluation.candidate_email_failed", { email: input.email }, err);
      }

      try {
        await sendEmail({
          to: "hello@3mtravelagency.com",
          subject: `📋 Nouvelle évaluation Visa Études — ${input.fullName} (${result.scoreTotal}/100)`,
          html: `<p><strong>${input.fullName}</strong> (${input.email}, ${input.phone || "N/A"}) — Destination : ${input.targetCountry || "non précisée"}.</p>
                 <p><strong>Score :</strong> ${result.scoreTotal}/100 — ${result.statusLabel}</p>`,
        });
      } catch (err) {
        logger.error("study_visa_evaluation.team_notification_failed", {}, err);
      }

      logger.info("study_visa_evaluation.completed", { email: input.email, score: result.scoreTotal });

      const teamWhatsappUrl = `https://wa.me/237698104832?text=${encodeURIComponent(
        `📋 Nouvelle évaluation Visa Études\nCandidat : ${input.fullName}\nEmail : ${input.email}\nScore : ${result.scoreTotal}/100 — ${result.statusLabel}`
      )}`;

      return { success: true, evaluationId, result, teamWhatsappUrl };
    }),

  /** Historique du candidat connecté (pour "Mon Espace"). */
  getMyEvaluations: candidateProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.select().from(studyVisaEvaluations)
      .where(eq(studyVisaEvaluations.email, ctx.candidate.email))
      .orderBy(desc(studyVisaEvaluations.createdAt));
  }),

  /** Liste + stats pour le tableau de bord admin. */
  listEvaluations: publicProcedure
    .input(z.object({ sessionToken: z.string(), limit: z.number().min(1).max(100).default(50), offset: z.number().min(0).default(0) }))
    .query(async ({ input }) => {
      await requireValidAdminSession(input.sessionToken);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(studyVisaEvaluations).orderBy(desc(studyVisaEvaluations.createdAt));
      const total = rows.length;
      const page = rows.slice(input.offset, input.offset + input.limit);
      return { items: page, total };
    }),
});
