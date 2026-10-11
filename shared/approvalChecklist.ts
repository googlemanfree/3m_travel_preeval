/**
 * Checklist visible avant « Décision favorable » — pure lecture, zéro écriture dossier.
 */

import type { AdminProcedureKind } from "./adminDynamicPilotage";

export type ApprovalCheckItem = {
  key: string;
  label: string;
  ok: boolean;
  required: boolean;
  detail: string;
};

export type ApprovalChecklist = {
  ready: boolean;
  items: ApprovalCheckItem[];
  missingRequired: string[];
};

export function buildApprovalPrerequisitesChecklist(input: {
  paymentConfirmed?: boolean;
  protocolSigned?: boolean;
  evaluationDelivered?: boolean;
  documentsReady?: boolean;
  checklistPercent?: number | null;
  procedureKind?: AdminProcedureKind | null;
  employerSelected?: boolean;
  secondProtocolReady?: boolean;
  secondProtocolSigned?: boolean;
}): ApprovalChecklist {
  const kind = input.procedureKind ?? "other";
  const work = kind === "work";
  const docsOk = input.documentsReady !== false
    && (typeof input.checklistPercent !== "number" || input.checklistPercent >= 80);

  const items: ApprovalCheckItem[] = [
    {
      key: "payment",
      label: "Paiement d’ouverture",
      ok: Boolean(input.paymentConfirmed),
      required: true,
      detail: input.paymentConfirmed ? "Confirmé" : "Encore requis",
    },
    {
      key: "protocol_one",
      label: "Protocole N°01 signé",
      ok: input.protocolSigned !== false,
      required: true,
      detail: input.protocolSigned === false ? "Signature client manquante" : "OK ou non bloquant sur ce canal",
    },
    {
      key: "documents",
      label: "Pièces / checklist procédure",
      ok: docsOk,
      required: true,
      detail: typeof input.checklistPercent === "number"
        ? `Checklist à ${input.checklistPercent} %`
        : (docsOk ? "Prêt" : "Pièces incomplètes"),
    },
    {
      key: "employer",
      label: "Employeur / partenaire sélectionné",
      ok: !work || Boolean(input.employerSelected),
      required: work,
      detail: work
        ? (input.employerSelected ? "Sélection enregistrée" : "Obligatoire pour visa travail")
        : "Non requis pour cette procédure",
    },
    {
      key: "protocol_two",
      label: "Protocole N°02 (si proposé)",
      ok: !input.secondProtocolReady || Boolean(input.secondProtocolSigned),
      required: Boolean(input.secondProtocolReady),
      detail: !input.secondProtocolReady
        ? "Non proposé — ignoré"
        : (input.secondProtocolSigned ? "Signé par le candidat" : "En attente de signature"),
    },
  ];

  const missingRequired = items.filter((item) => item.required && !item.ok).map((item) => item.label);
  return { ready: missingRequired.length === 0, items, missingRequired };
}
