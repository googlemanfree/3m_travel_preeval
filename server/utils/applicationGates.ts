import { TRPCError } from "@trpc/server";

export const APPLICATION_PROCESSING_STATUSES = new Set([
  "paye",
  "en_attente_documents",
  "documents_recus",
  "soumis_agences",
  "en_cours_recrutement",
  "contrat_obtenu",
  "visa_approuve",
]);

type ApplicationGateRecord = {
  agreementSigned: boolean;
  paymentStatus: string;
  cvUrl?: string | null;
  hasCv?: boolean;
  evaluationDeliveryStatus?: string | null;
};

export function assertApplicationCanEnterStatus(application: ApplicationGateRecord, nextStatus: string): void {
  const cvDetected = application.hasCv ?? Boolean(application.cvUrl?.trim());
  if (nextStatus === "en_evaluation" && !cvDetected) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Un CV exploitable doit être détecté avant de démarrer l’évaluation.",
    });
  }
  if (nextStatus === "bilan_envoye" && application.evaluationDeliveryStatus !== "sent") {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "L’évaluation doit être validée et remise au candidat avant de passer à l’étape suivante.",
    });
  }
  if (!APPLICATION_PROCESSING_STATUSES.has(nextStatus)) return;
  if (application.evaluationDeliveryStatus !== "sent") {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Aucun dossier ne peut être traité avant l’évaluation validée et remise au candidat.",
    });
  }
  if (!application.agreementSigned) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Le protocole d’accord doit être signé avant le passage du dossier en traitement.",
    });
  }
  if (application.paymentStatus !== "SUCCESS") {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Le paiement doit être confirmé avant le passage du dossier en traitement.",
    });
  }
}
