/**
 * Phases client — peu de libellés stables, lisibles dans l’espace candidat.
 * Les dizaines de statuts internes (online / agence / opérationnel) se rabattent ici
 * pour éviter la saturation et les contradictions.
 */

export type ClientDossierPhase =
  | "created"
  | "evaluation"
  | "opening"
  | "documents"
  | "processing"
  | "approved"
  | "refused"
  | "follow_up";

export type ClientPhaseInfo = {
  phase: ClientDossierPhase;
  /** Libellé court affiché comme « statut » côté client. */
  label: string;
  /** Une phrase de contexte, sans jargon admin. */
  detail: string;
};

const PHASE_INFO: Record<ClientDossierPhase, Omit<ClientPhaseInfo, "phase">> = {
  created: {
    label: "Dossier créé",
    detail: "Votre dossier est enregistré. L’évaluation peut commencer.",
  },
  evaluation: {
    label: "Évaluation en cours",
    detail: "Nos conseillers analysent votre profil et préparent la suite.",
  },
  opening: {
    label: "Ouverture du dossier",
    detail: "Bilan, paiement d’ouverture et protocole d’accord — étapes pour activer le suivi.",
  },
  documents: {
    label: "Documents à compléter",
    detail: "Des pièces sont attendues ou en cours de contrôle pour avancer.",
  },
  processing: {
    label: "Traitement en cours",
    detail: "Votre dossier est suivi : dépôt, partenaires, employeur ou autorités selon la procédure.",
  },
  approved: {
    label: "Décision favorable",
    detail: "Une issue positive a été enregistrée pour votre dossier.",
  },
  refused: {
    label: "Décision défavorable",
    detail: "Une décision défavorable a été enregistrée. Contactez l’agence pour la suite.",
  },
  follow_up: {
    label: "Suivi en cours",
    detail: "Votre dossier est suivi par l’agence.",
  },
};

/** Statuts internes → phase client unique. */
const STATUS_TO_PHASE: Record<string, ClientDossierPhase> = {
  // créé
  nouveau: "created",
  new: "created",
  // évaluation
  evaluation: "evaluation",
  en_evaluation: "evaluation",
  qualifying: "evaluation",
  evaluation_complete: "evaluation",
  // ouverture (bilan + paiement + protocole regroupés)
  bilan_envoye: "opening",
  en_attente_paiement: "opening",
  paye: "opening",
  payment_review: "opening",
  waiting_customer: "opening",
  // documents
  documents: "documents",
  documents_requis: "documents",
  en_attente_documents: "documents",
  documents_recus: "documents",
  documents_review: "documents",
  // traitement (soumission, employeur, ADEM, contrat, etc. — un seul libellé)
  en_cours: "processing",
  processing: "processing",
  traitement: "processing",
  en_cours_traitement: "processing",
  soumis: "processing",
  soumis_agences: "processing",
  submitted: "processing",
  en_cours_recrutement: "processing",
  recherche_employeur: "processing",
  validation_adem: "processing",
  contrat_obtenu: "processing",
  // décision
  approuve: "approved",
  visa_approuve: "approved",
  completed: "approved",
  closed: "approved",
  refuse: "refused",
  rejected: "refused",
};

export function resolveClientDossierPhase(status: string | null | undefined): ClientDossierPhase {
  const key = String(status ?? "").trim().toLowerCase();
  if (!key) return "follow_up";
  return STATUS_TO_PHASE[key] ?? "follow_up";
}

export function describeClientDossierPhase(status: string | null | undefined): ClientPhaseInfo {
  const phase = resolveClientDossierPhase(status);
  return { phase, ...PHASE_INFO[phase] };
}

/** Libellé court — source unique pour espace client, e-mails et notifications. */
export function clientPhaseLabel(status: string | null | undefined): string {
  return describeClientDossierPhase(status).label;
}

export function clientPhaseDetail(status: string | null | undefined): string {
  return describeClientDossierPhase(status).detail;
}

/** Table de compatibilité : chaque statut interne connu → libellé de phase. */
export function buildClientStatusLabelTable(): Record<string, string> {
  const table: Record<string, string> = {};
  for (const status of Object.keys(STATUS_TO_PHASE)) {
    table[status] = clientPhaseLabel(status);
  }
  return table;
}
