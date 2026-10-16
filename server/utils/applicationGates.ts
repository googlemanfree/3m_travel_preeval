import { TRPCError } from "@trpc/server";
import { evaluationRequiresCv } from "../../shared/evaluationVisaCv";

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
  paymentValidatedAt?: Date | string | null;
  paymentValidatedBy?: string | null;
  cvUrl?: string | null;
  hasCv?: boolean;
  visaType?: string | null;
  projectType?: string | null;
  evaluationDeliveryStatus?: string | null;
  evaluationClientConfirmed?: boolean;
  /** Horodatage DB — accepté comme confirmation (candidat ou admin à sa place). */
  evaluationClientConfirmedAt?: Date | string | null;
};

function isBilanConfirmed(application: ApplicationGateRecord): boolean {
  return Boolean(application.evaluationClientConfirmed) || Boolean(application.evaluationClientConfirmedAt);
}

export function assertApplicationCanEnterStatus(application: ApplicationGateRecord, nextStatus: string): void {
  const cvDetected = application.hasCv ?? Boolean(application.cvUrl?.trim());
  const cvMandatory = evaluationRequiresCv(application.visaType, application.projectType);
  const bilanConfirmed = isBilanConfirmed(application);
  if (nextStatus === "en_evaluation" && cvMandatory && !cvDetected) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Un CV exploitable doit être détecté avant de démarrer l’évaluation pour un visa travail. Relancez le candidat pour le déposer.",
    });
  }
  if (nextStatus === "bilan_envoye" && application.evaluationDeliveryStatus !== "sent") {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "L’évaluation doit être validée et remise au candidat avant de passer à l’étape suivante.",
    });
  }
  if (nextStatus === "en_attente_paiement" && !bilanConfirmed) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Le candidat doit confirmer la réception du bilan, ou un administrateur doit la valider à sa place, avant le paiement d’ouverture.",
    });
  }
  if (!APPLICATION_PROCESSING_STATUSES.has(nextStatus)) return;
  if (application.evaluationDeliveryStatus !== "sent") {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Aucun dossier ne peut être traité avant l’évaluation validée et remise au candidat.",
    });
  }
  if (!bilanConfirmed) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "La confirmation du bilan (candidat ou validation admin à sa place) est obligatoire avant le traitement du dossier.",
    });
  }
  if (!application.agreementSigned) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Le protocole d’accord doit être signé avant le passage du dossier en traitement.",
    });
  }
  if (application.paymentStatus !== "SUCCESS" || !application.paymentValidatedAt || !application.paymentValidatedBy?.trim()) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Le paiement doit être validé par un administrateur avant le passage du dossier en traitement.",
    });
  }
}
