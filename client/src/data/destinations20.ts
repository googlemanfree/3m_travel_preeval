export type DestinationRegion = "Europe" | "Amérique du Nord" | "Océanie" | "Golfe et Moyen-Orient" | "Asie";

export interface Destination20 {
  slug: string;
  name: string;
  flag: string;
  region: DestinationRegion;
  dispositif: string;
  secteurs: string[];
  visa: string;
  langue?: string;
  etapesCles?: string;
  pointFort?: string;
  pointVigilance?: string;
  /** Set when this country already has a dedicated, more detailed page elsewhere on the site. */
  existingPageUrl?: string;
}

export const DESTINATIONS_20: Destination20[] = [
  {
    slug: "pays-bas",
    name: "Pays-Bas",
    flag: "🇳🇱",
    region: "Europe",
    dispositif: "MBO (formation professionnelle) en alternance (BBL) ou Highly Skilled Migrant Visa pour profils qualifiés.",
    secteurs: ["Technologie", "Logistique", "Agroalimentaire", "Santé"],
    visa: "Autorisation de séjour pour formation MBO, ou permis \"Highly Skilled Migrant\" avec seuil de salaire pour les diplômés.",
    langue: "Anglais souvent suffisant dans la tech ; néerlandais recommandé pour l'alternance.",
    etapesCles: "Obtention d'une place de formation ou d'une offre d'emploi → sponsor employeur/école → dépôt MVV (visa d'entrée) → permis de séjour à l'arrivée.",
  },
  {
    slug: "luxembourg",
    name: "Luxembourg",
    flag: "🇱🇺",
    region: "Europe",
    dispositif: "Contrat d'apprentissage transfrontalier ou emploi qualifié (finance, IT, logistique).",
    secteurs: ["Finance", "IT", "Logistique"],
    visa: "Autorisation de séjour pour salarié, procédure rapide pour les métiers en pénurie.",
    pointFort: "Forte demande en langues (français/allemand/anglais), salaires parmi les plus élevés d'Europe.",
    existingPageUrl: "/procedures/luxembourg",
  },
  {
    slug: "belgique",
    name: "Belgique",
    flag: "🇧🇪",
    region: "Europe",
    dispositif: "Contrat d'apprentissage ou permis de travail pour métiers en pénurie (liste régionale : Flandre, Wallonie, Bruxelles).",
    secteurs: ["Construction", "Santé", "IT", "Logistique"],
    visa: "Permis unique (combiné travail + séjour).",
  },
  {
    slug: "france",
    name: "France",
    flag: "🇫🇷",
    region: "Europe",
    dispositif: "Contrat d'apprentissage ou de professionnalisation, carte de séjour \"salarié\" ou \"passeport talent\".",
    secteurs: ["Multi-secteurs"],
    visa: "VLS-TS (visa long séjour valant titre de séjour) pour contrat d'apprentissage signé.",
    pointVigilance: "Accès plus encadré depuis 2024-2025, l'employeur doit démontrer l'absence de candidat prioritaire sur le marché local dans certains cas.",
  },
  {
    slug: "royaume-uni",
    name: "Royaume-Uni",
    flag: "🇬🇧",
    region: "Europe",
    dispositif: "Skilled Worker Visa (emploi qualifié sponsorisé) ou Health & Care Worker Visa (secteur santé).",
    secteurs: ["Santé", "IT", "Ingénierie"],
    visa: "Offre d'emploi d'un employeur titulaire d'une licence de sponsor (Certificate of Sponsorship) et seuil de salaire minimum.",
    pointVigilance: "Accès plus sélectif pour les candidats africains ces dernières années, dossier à bâtir avec un employeur sérieux.",
  },
  {
    slug: "irlande",
    name: "Irlande",
    flag: "🇮🇪",
    region: "Europe",
    dispositif: "Critical Skills Employment Permit, destiné aux métiers en pénurie.",
    secteurs: ["Technologie", "Santé", "Ingénierie", "Finance"],
    visa: "Critical Skills Employment Permit.",
    pointFort: "Anglophone, voie vers la résidence permanente après 2 ans pour certains permis.",
  },
  {
    slug: "portugal",
    name: "Portugal",
    flag: "🇵🇹",
    region: "Europe",
    dispositif: "Job Seeker Visa (visa de recherche d'emploi, 120 jours) ou visa de travail avec contrat.",
    secteurs: ["Tourisme", "Technologie", "Agriculture"],
    visa: "Job Seeker Visa ou visa de travail avec contrat.",
    pointFort: "Accès facilité à un titre de séjour pour les ressortissants de pays lusophones et voie vers la citoyenneté après 5 ans.",
  },
  {
    slug: "espagne",
    name: "Espagne",
    flag: "🇪🇸",
    region: "Europe",
    dispositif: "Visa de travail salarié ou \"arraigo\" pour régularisation après séjour préalable.",
    secteurs: ["Hôtellerie-restauration", "Agriculture", "Construction"],
    visa: "Visa de travail salarié.",
  },
  {
    slug: "italie",
    name: "Italie",
    flag: "🇮🇹",
    region: "Europe",
    dispositif: "Decreto Flussi (quotas annuels de travailleurs étrangers par secteur).",
    secteurs: ["Multi-secteurs"],
    visa: "Decreto Flussi.",
    pointVigilance: "Dépôt de dossier uniquement pendant les fenêtres d'ouverture du décret, forte concurrence sur les quotas.",
  },
  {
    slug: "pologne",
    name: "Pologne",
    flag: "🇵🇱",
    region: "Europe",
    dispositif: "Permis de travail type A, forte demande de main-d'œuvre étrangère.",
    secteurs: ["Industrie", "Logistique", "Construction"],
    visa: "Permis de travail type A.",
    pointFort: "Procédure généralement plus rapide et moins coûteuse que l'Europe de l'Ouest.",
  },
  {
    slug: "malte",
    name: "Malte",
    flag: "🇲🇹",
    region: "Europe",
    dispositif: "Single Permit (travail + séjour), forte demande dans les services et le numérique (iGaming, IT).",
    secteurs: ["Services", "iGaming", "IT"],
    visa: "Single Permit.",
    pointFort: "Anglophone, économie dynamique, démarches administratives allégées.",
  },
  {
    slug: "norvege",
    name: "Norvège",
    flag: "🇳🇴",
    region: "Europe",
    dispositif: "Permis de travail qualifié pour métiers en tension (santé, ingénierie, artisanat technique).",
    secteurs: ["Santé", "Ingénierie", "Artisanat technique"],
    visa: "Permis de travail qualifié.",
    pointVigilance: "Coût de la vie élevé à intégrer dans l'évaluation budgétaire du candidat.",
  },
  {
    slug: "canada",
    name: "Canada",
    flag: "🇨🇦",
    region: "Amérique du Nord",
    dispositif: "Entrée express (résidence permanente), Permis de travail via étude (PGWP après diplôme canadien), Programme des travailleurs étrangers temporaires (EIMT/LMIA).",
    secteurs: ["Santé", "Technologie", "Métiers spécialisés", "Construction"],
    visa: "Entrée express, PGWP ou EIMT/LMIA selon le profil.",
    pointFort: "Voie claire vers la résidence permanente, plusieurs programmes provinciaux (PEQ Québec notamment).",
    existingPageUrl: "/canada",
  },
  {
    slug: "australie",
    name: "Australie",
    flag: "🇦🇺",
    region: "Océanie",
    dispositif: "Skilled Independent Visa (189), Skilled Nominated Visa (190), ou visa employeur pour métiers en pénurie.",
    secteurs: ["Santé", "Construction", "Ingénierie", "Métiers manuels qualifiés"],
    visa: "Évaluation des compétences (skills assessment) par l'organisme australien compétent avant dépôt.",
  },
  {
    slug: "nouvelle-zelande",
    name: "Nouvelle-Zélande",
    flag: "🇳🇿",
    region: "Océanie",
    dispositif: "Accredited Employer Work Visa (AEWV), système à points pour les résidents qualifiés.",
    secteurs: ["Santé", "Artisanat technique", "Agriculture"],
    visa: "Accredited Employer Work Visa (AEWV).",
  },
  {
    slug: "emirats",
    name: "Émirats Arabes Unis",
    flag: "🇦🇪",
    region: "Golfe et Moyen-Orient",
    dispositif: "Employment Visa (standard, avec offre d'emploi) ou Golden Visa (10 ans renouvelable, sans sponsor si seuils atteints).",
    secteurs: ["Hôtellerie", "Construction", "Logistique", "Santé", "Commerce"],
    visa: "Employment Visa ou Golden Visa (environ 30 000 AED/mois de salaire dans une profession qualifiée reconnue par le MOHRE).",
    pointFort: "Traitement très rapide (2 à 5 jours pour le visa standard).",
  },
  {
    slug: "qatar",
    name: "Qatar",
    flag: "🇶🇦",
    region: "Golfe et Moyen-Orient",
    dispositif: "Visa de travail sponsorisé par l'employeur (kafala assouplie ces dernières années).",
    secteurs: ["Construction", "Hôtellerie", "Sécurité", "Services"],
    visa: "Visa de travail sponsorisé par l'employeur.",
  },
  {
    slug: "arabie-saoudite",
    name: "Arabie Saoudite",
    flag: "🇸🇦",
    region: "Golfe et Moyen-Orient",
    dispositif: "Visa de travail dans le cadre de la stratégie Vision 2030, forte demande dans la construction et les services liés aux grands projets.",
    secteurs: ["Construction", "Services"],
    visa: "Visa de travail sponsorisé par l'employeur.",
    pointVigilance: "Conditions contractuelles à vérifier attentivement avant signature, notamment sur le rapatriement et les congés.",
  },
  {
    slug: "coree-du-sud",
    name: "Corée du Sud",
    flag: "🇰🇷",
    region: "Asie",
    dispositif: "Employment Permit System (EPS), visa E-9 pour travailleurs non qualifiés/semi-qualifiés dans l'industrie, l'agriculture, la pêche.",
    secteurs: ["Industrie", "Agriculture", "Pêche"],
    visa: "Visa E-9 (Employment Permit System).",
    pointVigilance: "Nécessite généralement de réussir un test de coréen (EPS-TOPIK) et de passer par un accord bilatéral gouvernemental — l'éligibilité du Cameroun à cet accord doit être vérifiée au cas par cas avant tout engagement.",
  },
  {
    slug: "japon",
    name: "Japon",
    flag: "🇯🇵",
    region: "Asie",
    dispositif: "Technical Intern Training Program (TITP) ou visa \"Ingénieur/Spécialiste en sciences humaines\".",
    secteurs: ["Industrie manufacturière", "Construction", "Agriculture", "Soins aux personnes âgées"],
    visa: "TITP ou visa Ingénieur/Spécialiste en sciences humaines.",
    pointVigilance: "Programme encadré par des organismes de supervision agréés, à ne traiter qu'avec des partenaires japonais reconnus pour éviter les abus documentés par le passé sur ce programme.",
  },
];

export const getDestination20 = (slug: string): Destination20 | undefined =>
  DESTINATIONS_20.find((destination) => destination.slug === slug);

export const REGION_ORDER: DestinationRegion[] = ["Europe", "Amérique du Nord", "Océanie", "Golfe et Moyen-Orient", "Asie"];
