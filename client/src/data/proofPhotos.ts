export type ProofCategory = "canada" | "chine" | "schengen";

export type ProofPhoto = {
  src: string;
  alt: string;
  caption: string;
  category: ProofCategory;
};

export const PROOF_CATEGORY_LABELS: Record<ProofCategory, string> = {
  canada: "Canada",
  chine: "Chine",
  schengen: "Schengen",
};

/** Toutes les informations personnelles de ces images (noms, numéros, MRZ, dates, codes-barres, signataire) sont masquées avant publication. */
export const PROOF_PHOTOS: ProofPhoto[] = [
  {
    src: "/proof-photos/proof-letter-1.jpg",
    alt: "Lettre de confirmation IRCC — résidence permanente Canada, informations personnelles masquées",
    caption: "Confirmation officielle IRCC — traitement de résidence permanente",
    category: "canada",
  },
  {
    src: "/proof-photos/proof-passports-letters-1.jpg",
    alt: "Confirmations de résidence permanente et passeports de clients, informations personnelles masquées",
    caption: "Dossiers de résidence permanente Canada traités par 3M Travel & Services",
    category: "canada",
  },
  {
    src: "/proof-photos/proof-visas-2x2-1.jpg",
    alt: "Visas Canada approuvés dans des passeports de clients, informations personnelles masquées",
    caption: "Visas Canada obtenus par des candidats accompagnés depuis Yaoundé",
    category: "canada",
  },
  {
    src: "/proof-photos/proof-china-visa-1.jpg",
    alt: "Visa Chine approuvé dans un passeport de client, informations personnelles masquées",
    caption: "Visa de travail Chine obtenu grâce à l'accompagnement 3M Travel & Services",
    category: "chine",
  },
  {
    src: "/proof-photos/proof-china-visa-2.jpg",
    alt: "Visa Chine approuvé dans un passeport de client, informations personnelles masquées",
    caption: "Dossier de visa Chine traité et validé pour un candidat camerounais",
    category: "chine",
  },
  {
    src: "/proof-photos/proof-pr-letters-passports-1.jpg",
    alt: "Confirmations de résidence permanente Canada et passeports de clients, informations personnelles masquées",
    caption: "Quatre dossiers de résidence permanente Canada traités simultanément",
    category: "canada",
  },
  {
    src: "/proof-photos/proof-express-entry-letter-1.jpg",
    alt: "Lettre IRCC de suivi de dossier Entrée express, informations personnelles masquées",
    caption: "Suivi officiel IRCC — dossier Entrée express en voie de finalisation",
    category: "canada",
  },
  {
    src: "/proof-photos/proof-canada-visa-1.jpg",
    alt: "Visa Canada approuvé dans un passeport de client, informations personnelles masquées",
    caption: "Visa de résident permanent Canada obtenu par un candidat accompagné",
    category: "canada",
  },
  {
    src: "/proof-photos/proof-china-visa-3.jpg",
    alt: "Visa Chine approuvé dans un passeport de client, informations personnelles masquées",
    caption: "Visa Chine délivré à Yaoundé pour un candidat suivi par 3M Travel & Services",
    category: "chine",
  },
  {
    src: "/proof-photos/proof-china-visa-4.jpg",
    alt: "Visa Chine approuvé dans un passeport de client, informations personnelles masquées",
    caption: "Nouveau dossier de visa Chine mené à terme depuis Yaoundé",
    category: "chine",
  },
  {
    src: "/proof-photos/proof-schengen-visa-1.jpg",
    alt: "Visa Schengen (Lituanie) approuvé dans un passeport de client, informations personnelles masquées",
    caption: "Visa Schengen obtenu pour un candidat accompagné par 3M Travel & Services",
    category: "schengen",
  },
  {
    src: "/proof-photos/proof-schengen-visa-2.jpg",
    alt: "Visa Schengen (Lituanie) approuvé dans un passeport de client, informations personnelles masquées",
    caption: "Dossier de visa Schengen traité et validé depuis Yaoundé",
    category: "schengen",
  },
  {
    src: "/proof-photos/proof-schengen-visa-3.jpg",
    alt: "Visa Schengen (Lituanie) approuvé dans un passeport de client, informations personnelles masquées",
    caption: "Visa Schengen pour travail saisonnier obtenu par un candidat suivi par 3M Travel",
    category: "schengen",
  },
  {
    src: "/proof-photos/proof-schengen-visa-4.jpg",
    alt: "Visa Schengen (Lituanie) approuvé dans un passeport de client, informations personnelles masquées",
    caption: "Nouveau dossier de visa Schengen mené à terme depuis Yaoundé",
    category: "schengen",
  },
  {
    src: "/proof-photos/proof-schengen-visa-5.jpg",
    alt: "Visa Schengen (Lituanie) approuvé dans un passeport de client, informations personnelles masquées",
    caption: "Visa Schengen délivré à un candidat accompagné de bout en bout par 3M Travel",
    category: "schengen",
  },
  {
    src: "/proof-photos/proof-visa-espagne-1.jpg",
    alt: "Visa Schengen Espagne approuvé, informations personnelles masquées",
    caption: "Visa Schengen Espagne obtenu pour un candidat accompagné par 3M Travel & Services",
    category: "schengen",
  },
  {
    src: "/proof-photos/proof-visa-france-1.jpg",
    alt: "Visa Schengen France (tourisme) approuvé, informations personnelles masquées",
    caption: "Visa Schengen France — tourisme — obtenu pour un candidat accompagné par 3M Travel",
    category: "schengen",
  },
  {
    src: "/proof-photos/proof-visa-france-2.jpg",
    alt: "Visa Schengen France (visite familiale) approuvé, informations personnelles masquées",
    caption: "Visa Schengen France — visite familiale — dossier traité par 3M Travel & Services",
    category: "schengen",
  },
  {
    src: "/proof-photos/proof-visa-france-3.jpg",
    alt: "Visa Schengen France (tourisme) approuvé, informations personnelles masquées",
    caption: "Nouveau visa Schengen France mené à terme depuis Yaoundé",
    category: "schengen",
  },
];

export type ProofFilter = "all" | ProofCategory;

export const PROOF_COLLAPSED_COUNT = 6;

export function filterProofPhotos(photos: readonly ProofPhoto[], filter: ProofFilter): ProofPhoto[] {
  return filter === "all" ? [...photos] : photos.filter((photo) => photo.category === filter);
}

/** Effectifs par filtre, dans l'ordre d'affichage ; les catégories vides ne sont pas proposées. */
export function proofFilterCounts(photos: readonly ProofPhoto[]): Array<{ filter: ProofFilter; label: string; count: number }> {
  const categories = (Object.keys(PROOF_CATEGORY_LABELS) as ProofCategory[])
    .map((category) => ({ filter: category as ProofFilter, label: PROOF_CATEGORY_LABELS[category], count: photos.filter((photo) => photo.category === category).length }))
    .filter((entry) => entry.count > 0);
  return [{ filter: "all", label: "Tous", count: photos.length }, ...categories];
}

/** Photo voisine dans la liste affichée, en boucle (navigation du diaporama plein écran). */
export function neighbourIndex(current: number, total: number, direction: 1 | -1): number {
  if (total <= 0) return 0;
  return (current + direction + total) % total;
}
