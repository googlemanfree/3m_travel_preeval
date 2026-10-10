/**
 * Plateformes d’emploi Luxembourg utiles aux candidats non-UE.
 * Source métier : curation interne 3M (Work in Luxembourg, ADEM, Moovijob, Jobs.lu).
 * Pas de scraping — liens publics + actions de suivi admin uniquement.
 */

export type LuxembourgJobPlatformPriority = "high" | "medium" | "general";

export type LuxembourgJobPlatform = {
  id: string;
  name: string;
  url: string;
  /** Utilité concrète pour un candidat hors UE */
  nonEuUtility: string;
  priorityForNonEu: LuxembourgJobPlatformPriority;
  /** true = canal officiel / recrutement international encadré */
  officialChannel: boolean;
};

export const LUXEMBOURG_JOB_PLATFORMS: readonly LuxembourgJobPlatform[] = [
  {
    id: "work-in-luxembourg",
    name: "Work in Luxembourg",
    url: "https://work-in-luxembourg.lu/",
    nonEuUtility:
      "Recrutement international orienté métiers en pénurie. Le candidat crée un profil et dépose son CV ; l’accès aux offres est examiné avant validation.",
    priorityForNonEu: "high",
    officialChannel: true,
  },
  {
    id: "adem-offres-publiques",
    name: "ADEM — offres publiques",
    url: "https://adem.public.lu/fr/support/non-inscrits-eures.html",
    nonEuUtility:
      "Consultation des offres publiques sans inscription ADEM. Lorsque les coordonnées sont affichées, candidature directe auprès de l’employeur.",
    priorityForNonEu: "high",
    officialChannel: true,
  },
  {
    id: "moovijob",
    name: "Moovijob",
    url: "https://www.moovijob.com/offres-emploi/jobs-luxembourg",
    nonEuUtility:
      "Offres tous secteurs. Plateforme non réservée aux non-UE : vérifier avec chaque employeur s’il envisage un recrutement international.",
    priorityForNonEu: "general",
    officialChannel: false,
  },
  {
    id: "jobs-lu",
    name: "Jobs.lu",
    url: "https://fr.jobs.lu/",
    nonEuUtility:
      "Portail d’emploi luxembourgeois. Comme Moovijob, confirmer que l’employeur recrute hors UE avant d’engager le candidat.",
    priorityForNonEu: "general",
    officialChannel: false,
  },
] as const;

export function getLuxembourgJobPlatform(id: string): LuxembourgJobPlatform | undefined {
  return LUXEMBOURG_JOB_PLATFORMS.find((platform) => platform.id === id);
}

export function isLuxembourgDestination(destination?: string | null): boolean {
  return (destination ?? "").trim().toLocaleLowerCase("fr-FR").includes("luxembourg");
}

export function luxembourgApplicationTaskTitle(platformName: string, candidateLabel?: string): string {
  const suffix = candidateLabel?.trim() ? ` — ${candidateLabel.trim()}` : "";
  return `Postuler sur ${platformName}${suffix}`.slice(0, 255);
}

export function luxembourgApplicationTaskDescription(platform: LuxembourgJobPlatform): string {
  return [
    `Plateforme : ${platform.name}`,
    `Lien : ${platform.url}`,
    `Utilité non-UE : ${platform.nonEuUtility}`,
    platform.officialChannel
      ? "Canal prioritaire / encadré pour le recrutement international."
      : "Vérifier auprès de l’employeur l’ouverture au recrutement hors UE.",
  ].join("\n");
}

export function luxembourgProgressTaskPresets(candidateLabel?: string): Array<{
  id: string;
  title: string;
  description: string;
}> {
  const label = candidateLabel?.trim() || "candidat";
  return [
    {
      id: "recherche-employeur",
      title: `Recherche employeur Luxembourg — ${label}`.slice(0, 255),
      description:
        "Candidatures actives sur les plateformes LU (Work in Luxembourg, ADEM, Moovijob, Jobs.lu). Suivre les retours employeurs et documenter les offres pertinentes.",
    },
    {
      id: "candidature-deposee",
      title: `Candidature déposée — suivi employeur LU — ${label}`.slice(0, 255),
      description:
        "Au moins une candidature a été déposée. Relancer l’employeur, préparer le contrat et anticiper le test ADEM si le poste est confirmé.",
    },
    {
      id: "validation-adem",
      title: `Suivi validation ADEM — ${label}`.slice(0, 255),
      description:
        "Employeur engagé : suivre la déclaration de poste / avis ADEM et les pièces côté candidat (CV, diplômes, casier) pour avancer vers l’autorisation de séjour.",
    },
  ];
}
