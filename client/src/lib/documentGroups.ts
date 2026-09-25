/**
 * Regroupement des pièces par candidat pour l'onglet Documents de l'administration : une fiche par candidat, ses pièces
 * affichées individuellement (déposées en ligne ou remises en agence). Fonction pure, sans accès réseau.
 */
export type GroupableDocument = {
  id: number;
  source: "client" | "candidate" | "agency";
  candidateId?: number | null;
  candidateEmail?: string | null;
  dossierNumber: string;
  candidateName: string;
  documentType: string;
  verificationStatus: "pending" | "approved" | "rejected";
  submittedAt: Date;
};

export type CandidateDocumentGroup<T extends GroupableDocument> = {
  key: string;
  dossierNumber: string;
  candidateName: string;
  candidateEmail: string | null;
  documents: T[];
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  /** Pièces remises en agence (dépôt manuel de l'administrateur ou décharge de remise en main propre). */
  agencyCount: number;
  latestAt: Date;
};

const UNKNOWN = "N/A";

/** Une pièce est « remise en agence » quand l'administrateur l'a déposée pour le candidat. */
export const isAgencyHandedDocument = (document: Pick<GroupableDocument, "source" | "documentType">): boolean =>
  document.source === "agency" || document.documentType === "document_remis_main_propre";

/**
 * Clé de regroupement : le numéro de dossier identifie un candidat de façon unique ; à défaut, l'adresse e-mail, puis le nom.
 * Deux candidats homonymes sans numéro de dossier ne sont donc jamais fusionnés sur le seul nom si l'e-mail les distingue.
 */
export function groupKeyOf(document: GroupableDocument): string {
  const dossier = (document.dossierNumber || "").trim();
  if (dossier && dossier !== UNKNOWN) return `dossier:${dossier.toLowerCase()}`;
  const email = (document.candidateEmail || "").trim().toLowerCase();
  if (email) return `email:${email}`;
  return `nom:${(document.candidateName || UNKNOWN).trim().toLowerCase()}`;
}

export function groupDocumentsByCandidate<T extends GroupableDocument>(documents: T[]): CandidateDocumentGroup<T>[] {
  const groups = new Map<string, CandidateDocumentGroup<T>>();
  for (const document of documents) {
    const key = groupKeyOf(document);
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        dossierNumber: document.dossierNumber || UNKNOWN,
        candidateName: document.candidateName || UNKNOWN,
        candidateEmail: document.candidateEmail ?? null,
        documents: [],
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        agencyCount: 0,
        latestAt: document.submittedAt,
      };
      groups.set(key, group);
    }
    group.documents.push(document);
    group.total += 1;
    if (document.verificationStatus === "approved") group.approved += 1;
    else if (document.verificationStatus === "rejected") group.rejected += 1;
    else group.pending += 1;
    if (isAgencyHandedDocument(document)) group.agencyCount += 1;
    if (document.submittedAt > group.latestAt) group.latestAt = document.submittedAt;
    if (!group.candidateEmail && document.candidateEmail) group.candidateEmail = document.candidateEmail;
  }
  for (const group of Array.from(groups.values())) {
    // Type puis date décroissante : les versions d'une même pièce restent côte à côte, la plus récente en premier.
    group.documents.sort((left, right) => left.documentType.localeCompare(right.documentType, "fr") || right.submittedAt.getTime() - left.submittedAt.getTime());
  }
  // Les candidats avec des pièces à contrôler d'abord, puis les plus récemment actifs.
  return Array.from(groups.values()).sort((left, right) => right.pending - left.pending || right.latestAt.getTime() - left.latestAt.getTime() || left.candidateName.localeCompare(right.candidateName, "fr"));
}

/** Part des pièces approuvées (0 à 100) ; 0 sans pièce. */
export const approvalRate = (group: Pick<CandidateDocumentGroup<GroupableDocument>, "total" | "approved">): number => (group.total > 0 ? Math.round((group.approved / group.total) * 100) : 0);
