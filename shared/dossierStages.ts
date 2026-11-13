/**
 * Étapes de dossier lisibles pour l'administration.
 *
 * Trois vocabulaires de statut coexistent en base :
 *  - applications.dossierNumber…dossierStatus (dossiers en ligne, 12 valeurs) ;
 *  - agency_dossiers.status (dossiers agence, 8 valeurs) ;
 *  - candidates.dossierStatus (comptes candidats, 7 valeurs).
 * Les filtres et les compteurs de l'administration raisonnent en étapes ; le statut brut reste disponible
 * pour les actions qui en ont besoin.
 */
export const DOSSIER_STAGE_IDS = ["nouveau", "evaluation", "paiement", "documents", "traitement", "approuve", "refuse"] as const;
export type DossierStage = (typeof DOSSIER_STAGE_IDS)[number];

export const DOSSIER_STAGES: ReadonlyArray<{ id: DossierStage; label: string; tone: string }> = [
  { id: "nouveau", label: "Nouveau", tone: "bg-blue-100 text-blue-800" },
  { id: "evaluation", label: "Évaluation", tone: "bg-purple-100 text-purple-800" },
  { id: "paiement", label: "Paiement", tone: "bg-orange-100 text-orange-800" },
  { id: "documents", label: "Documents", tone: "bg-yellow-100 text-yellow-900" },
  { id: "traitement", label: "En traitement", tone: "bg-sky-100 text-sky-800" },
  { id: "approuve", label: "Approuvé", tone: "bg-green-100 text-green-800" },
  { id: "refuse", label: "Refusé", tone: "bg-red-100 text-red-800" },
];

const STAGE_BY_STATUS: Record<string, DossierStage> = {
  // Dossiers en ligne (applications.dossierStatus)
  nouveau: "nouveau",
  en_evaluation: "evaluation",
  bilan_envoye: "evaluation",
  en_attente_paiement: "paiement",
  paye: "documents",
  en_attente_documents: "documents",
  documents_recus: "traitement",
  soumis_agences: "traitement",
  en_cours_recrutement: "traitement",
  contrat_obtenu: "traitement",
  visa_approuve: "approuve",
  refuse: "refuse",
  // Dossiers agence (agency_dossiers.status)
  en_cours: "traitement",
  documents_requis: "documents",
  recherche_employeur: "traitement",
  validation_adem: "traitement",
  soumis: "traitement",
  approuve: "approuve",
  // Comptes candidats (candidates.dossierStatus)
  evaluation: "evaluation",
  documents: "documents",
  traitement: "traitement",
  // Alias historiques de l'interface
  en_attente: "paiement",
};

const LABEL_BY_STATUS: Record<string, string> = {
  nouveau: "Nouveau",
  en_evaluation: "En évaluation",
  bilan_envoye: "Bilan envoyé",
  en_attente_paiement: "Paiement en attente",
  paye: "Payé",
  en_attente_documents: "Documents attendus",
  documents_recus: "Documents reçus",
  soumis_agences: "Soumis aux agences",
  en_cours_recrutement: "Recrutement en cours",
  contrat_obtenu: "Contrat obtenu",
  visa_approuve: "Visa approuvé",
  refuse: "Refusé",
  en_cours: "En cours",
  documents_requis: "Documents requis",
  recherche_employeur: "Recherche d’employeur",
  validation_adem: "Validation ADEM",
  soumis: "Soumis",
  approuve: "Approuvé",
  evaluation: "En évaluation",
  documents: "Documents",
  traitement: "En traitement",
  en_attente: "En attente",
};

export function isDossierStage(value: string): value is DossierStage {
  return (DOSSIER_STAGE_IDS as readonly string[]).includes(value);
}

/** Étape d'un statut brut ; un statut inconnu reste « nouveau » plutôt que de disparaître des compteurs. */
export function dossierStageOf(status: string | null | undefined): DossierStage {
  return STAGE_BY_STATUS[String(status ?? "").trim()] ?? "nouveau";
}

export function dossierStageMeta(stage: DossierStage) {
  return DOSSIER_STAGES.find((item) => item.id === stage) ?? DOSSIER_STAGES[0];
}

/** Libellé français d'un statut brut (jamais de snake_case à l'écran). */
export function dossierStatusLabel(status: string | null | undefined): string {
  const key = String(status ?? "").trim();
  if (!key) return "Non renseigné";
  return LABEL_BY_STATUS[key] ?? key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

/** « canada » → « Canada », « non spécifiée » reste lisible. */
export function formatDestinationLabel(value: string | null | undefined): string {
  const text = String(value ?? "").trim();
  if (!text) return "Non spécifiée";
  return text.charAt(0).toUpperCase() + text.slice(1);
}
