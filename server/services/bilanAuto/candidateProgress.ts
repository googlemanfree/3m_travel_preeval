import type { RunRecord } from "./types";

/**
 * Frise de suivi côté candidat. Elle ne montre que des étapes : jamais l'état interne d'erreur, la note, ni le motif d'un incident
 * (un incident s'affiche comme « analyse en cours » avec un délai plus long, sans refus ni mot alarmant).
 */
export const PROGRESS_STEPS = [
  { id: "recu", label: "Dossier reçu" },
  { id: "analyse", label: "Analyse en cours" },
  { id: "relecture", label: "Relecture par l'agence" },
  { id: "publie", label: "Bilan disponible" },
] as const;
export type ProgressStepId = (typeof PROGRESS_STEPS)[number]["id"];

export type CandidateProgress = {
  current: ProgressStepId;
  steps: Array<{ id: ProgressStepId; label: string; status: "fait" | "en_cours" | "a_venir" }>;
  /** Message complémentaire (complément à fournir, délai plus long). */
  note: string | null;
  action: "completer" | null;
  updatedAt: string;
};

export function progressForCandidate(run: Pick<RunRecord, "state" | "mode" | "updatedAt">): CandidateProgress | null {
  if (run.state === "superseded") return null;
  let current: ProgressStepId;
  let note: string | null = null;
  let action: CandidateProgress["action"] = null;
  switch (run.state) {
    case "received":
    case "queued": current = "recu"; break;
    case "needs_information": current = "analyse"; note = "Un complément est nécessaire pour poursuivre votre évaluation. Consultez la demande dans votre espace."; action = "completer"; break;
    case "ready_for_review": current = run.mode === "automatique" ? "publie" : "relecture"; break;
    case "published": current = "publie"; break;
    case "retry_pending":
    case "failed": current = "analyse"; note = "Le traitement prend plus de temps que prévu. Aucune action n'est nécessaire de votre part pour le moment."; break;
    default: current = "analyse";
  }
  const order = PROGRESS_STEPS.map((step) => step.id);
  const currentIndex = order.indexOf(current);
  return {
    current,
    steps: PROGRESS_STEPS.map((step, index) => ({ id: step.id, label: step.label, status: current === "publie" || index < currentIndex ? "fait" : index === currentIndex ? "en_cours" : "a_venir" })),
    note,
    action,
    updatedAt: run.updatedAt.toISOString(),
  };
}
