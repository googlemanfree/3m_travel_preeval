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
};

export function assertApplicationCanEnterStatus(application: ApplicationGateRecord, nextStatus: string): void {
  if (!APPLICATION_PROCESSING_STATUSES.has(nextStatus)) return;
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
