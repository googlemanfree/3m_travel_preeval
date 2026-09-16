import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { applications } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

type StepStatus = "completed" | "in_progress" | "pending";

interface DossierStep {
  id: string;
  name: string;
  description: string;
  status: StepStatus;
  completedAt?: Date;
}

const STATUS_ORDER = [
  "nouveau",
  "en_evaluation",
  "bilan_envoye",
  "en_attente_paiement",
  "paye",
  "en_attente_documents",
  "documents_recus",
  "soumis_agences",
  "en_cours_recrutement",
  "contrat_obtenu",
  "visa_approuve",
] as const;

function deriveSteps(app: {
  dossierStatus: string;
  paymentStatus: string;
  agreementSigned: boolean | null;
  evaluationDeliveryStatus: string;
  paymentDate: Date | null;
  evaluationClientConfirmedAt: Date | null;
  createdAt: Date;
}): DossierStep[] {
  const statusIndex = STATUS_ORDER.indexOf(app.dossierStatus as typeof STATUS_ORDER[number]);

  const step = (
    id: string,
    threshold: number,
    name: string,
    description: string,
    completedAt?: Date | null,
  ): DossierStep => {
    const s: StepStatus =
      statusIndex > threshold ? "completed"
      : statusIndex === threshold ? "in_progress"
      : "pending";
    return { id, name, description, status: s, completedAt: s === "completed" ? (completedAt ?? undefined) : undefined };
  };

  return [
    step("reception", 0, "Réception du dossier", "Votre dossier a été reçu et enregistré.", app.createdAt),
    step("evaluation", 1, "Évaluation du profil", "Analyse de votre profil et de votre admissibilité.", app.evaluationClientConfirmedAt),
    step("bilan", 2, "Bilan d'admissibilité", "Le bilan de votre évaluation vous a été transmis."),
    step("paiement", 4, "Règlement des frais", "Frais d'ouverture de dossier réglés.", app.paymentDate),
    step("documents", 6, "Dépôt de documents", "Vos pièces ont été reçues et vérifiées."),
    step("soumission", 7, "Soumission aux partenaires", "Votre dossier a été transmis aux recruteurs ou aux autorités."),
    step("decision", 10, "Décision finale", "Visa approuvé ou contrat obtenu."),
  ];
}

export const visaStatusTrackerRouter = router({
  getDossierStatus: protectedProcedure
    .input(z.object({ dossierNumber: z.string().max(50) }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

      const [app] = await db
        .select()
        .from(applications)
        .where(and(
          eq(applications.dossierNumber, input.dossierNumber),
          eq(applications.email, ctx.user.email ?? ""),
        ))
        .limit(1);

      if (!app) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable ou accès non autorisé." });
      }

      const steps = deriveSteps(app);
      const completedCount = steps.filter((s) => s.status === "completed").length;
      const progressPercentage = Math.round((completedCount / steps.length) * 100);

      return {
        dossierNumber: app.dossierNumber,
        candidateName: app.fullName,
        destination: app.destination,
        visaType: app.destination === "canada" ? "Travail / Études" : "Mobilité internationale",
        overallStatus: app.dossierStatus === "visa_approuve" || app.dossierStatus === "contrat_obtenu" ? "completed"
          : app.dossierStatus === "refuse" ? "refused"
          : "in_progress",
        progressPercentage,
        lastUpdated: app.updatedAt ?? app.createdAt,
        notes: app.adminNote ?? null,
        steps,
      };
    }),

  getUserDossiers: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

    const rows = await db
      .select({
        dossierNumber: applications.dossierNumber,
        destination: applications.destination,
        dossierStatus: applications.dossierStatus,
        paymentStatus: applications.paymentStatus,
        agreementSigned: applications.agreementSigned,
        evaluationDeliveryStatus: applications.evaluationDeliveryStatus,
        paymentDate: applications.paymentDate,
        evaluationClientConfirmedAt: applications.evaluationClientConfirmedAt,
        createdAt: applications.createdAt,
        updatedAt: applications.updatedAt,
        adminNote: applications.adminNote,
      })
      .from(applications)
      .where(eq(applications.email, ctx.user.email ?? ""))
      .limit(50);

    return rows.map((app) => {
      const steps = deriveSteps(app);
      const completedCount = steps.filter((s) => s.status === "completed").length;
      return {
        dossierNumber: app.dossierNumber,
        destination: app.destination,
        visaType: "Mobilité internationale",
        overallStatus: app.dossierStatus === "visa_approuve" || app.dossierStatus === "contrat_obtenu" ? "completed"
          : app.dossierStatus === "refuse" ? "refused"
          : "in_progress",
        progressPercentage: Math.round((completedCount / steps.length) * 100),
        lastUpdated: app.updatedAt ?? app.createdAt,
      };
    });
  }),

  getTrackingStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB non disponible" });

    const rows = await db
      .select({
        dossierStatus: applications.dossierStatus,
        paymentStatus: applications.paymentStatus,
        agreementSigned: applications.agreementSigned,
        evaluationDeliveryStatus: applications.evaluationDeliveryStatus,
        paymentDate: applications.paymentDate,
        evaluationClientConfirmedAt: applications.evaluationClientConfirmedAt,
        createdAt: applications.createdAt,
        updatedAt: applications.updatedAt,
        adminNote: applications.adminNote,
      })
      .from(applications)
      .where(eq(applications.email, ctx.user.email ?? ""))
      .limit(50);

    const statuses = rows.map((app) => {
      const steps = deriveSteps(app);
      const completedCount = steps.filter((s) => s.status === "completed").length;
      return {
        isCompleted: app.dossierStatus === "visa_approuve" || app.dossierStatus === "contrat_obtenu",
        progress: Math.round((completedCount / steps.length) * 100),
      };
    });

    return {
      totalDossiers: rows.length,
      completedDossiers: statuses.filter((s) => s.isCompleted).length,
      inProgressDossiers: statuses.filter((s) => !s.isCompleted).length,
      averageProgress: rows.length === 0 ? 0 : Math.round(statuses.reduce((sum, s) => sum + s.progress, 0) / rows.length),
    };
  }),

  // updateStepStatus is admin-only — handled via admin.ts, not exposed to candidates.
});
