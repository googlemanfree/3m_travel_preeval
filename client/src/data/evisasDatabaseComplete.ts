export interface EvisaDestination {
  id: string;
  country: string;
  flag: string;
  region: string;
  type: string;
  duration: string;
  delay: string;
  docs: string;
  fee: string;
  note: string;
  culture: string;
  workInfo: string;
  highlights: string[];
  emblems: string[];
  steps: string[];
  image: string;
}

export const evisasDatabaseComplete: EvisaDestination[] = [
  {
    id: "egypte",
    country: "Égypte",
    flag: "🇪🇬",
    region: "Afrique",
    type: "e-Visa Touristique",
    duration: "30 jours",
    delay: "2-5 jours",
    docs: "Passeport (+6 mois), Photo d'identité, Réservation hôtel",
    fee: "25 USD",
    note: "Entrée simple ou multiple disponible.",
    culture: "Berceau de l'une des plus anciennes civilisations du monde, l'Égypte fascine par son histoire pharaonique, ses pyramides de Gizeh, la vallée des Rois et le fleuve Nil.",
    workInfo: "Opportunités dans le tourisme international, l'enseignement des langues et l'énergie. Secteur tertiaire dynamique au Caire.",
    highlights: ["Pyramides de Gizeh", "Croisière sur le Nil", "Mer Rouge (Dahab/Sharm)"],
    emblems: ["Aigle de Saladin", "Lotus sacré", "Le Nil"],
    steps: [
      "Soumission en ligne du formulaire e-Visa avec scan du passeport",
      "Paiement sécurisé des frais consulaires (25 USD)",
      "Réception de l'e-Visa validé par e-mail en 2 à 5 jours",
      "Impression de l'e-Visa pour présentation à l'arrivée à l'aéroport"
    ],
    image: "https://images.unsplash.com/photo-1568322445389-f64ac25256f0?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "kenya",
    country: "Kenya",
    flag: "🇰🇪",
    region: "Afrique",
    type: "eTA Électronique",
    duration: "90 jours",
    delay: "24h-72h",
    docs: "Passeport, Billet d'avion A/R, Justificatif d'hébergement",
    fee: "34 USD",
    note: "Obligatoire pour tous les voyageurs avant l'embarquement.",
    culture: "Terre de safaris légendaires, le Kenya offre une diversité culturelle riche (maasaï, swahili) et des paysages époustouflants de la Vallée du Grand Rift.",
    workInfo: "Hub économique d'Afrique de l'Est ('Silicon Savannah'), opportunités en technologies, logistique et écotourisme.",
    highlights: ["Réserve nationale du Maasai Mara", "Mont Kenya", "Côte de Mombasa"],
    emblems: ["Lion du Kenya", "Armoiries nationales"],
    steps: [
      "Création d'un compte sur la plateforme officielle eTA Kenya",
      "Téléversement du passeport valide et des justificatifs de voyage",
      "Paiement en ligne (34 USD)",
      "Validation de l'eTA sous 24h à 72h avant le départ"
    ],
    image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "tanzanie",
    country: "Tanzanie & Zanzibar",
    flag: "🇹🇿",
    region: "Afrique",
    type: "e-Visa Touristique",
    duration: "30-90 jours",
    delay: "3-5 jours",
    docs: "Passeport, Photo, Billet d'avion retour",
    fee: "50 USD",
    note: "Valable pour le continent et l'île de Zanzibar.",
    culture: "Célèbre pour le Kilimandjaro et le parc du Serengeti, la Tanzanie allie traditions swahilies et splendeurs naturelles de l'océan Indien.",
    workInfo: "Secteurs en forte croissance : tourisme durable, agriculture, services maritimes à Zanzibar.",
    highlights: ["Mont Kilimandjaro", "Parc du Serengeti", "Île de Zanzibar"],
    emblems: ["Uhuru Torch", "Giraffe"],
    steps: [
      "Remplissage du formulaire e-Visa sur le portail d'immigration",
      "Fourniture des pièces justificatives et scan passeport",
      "Paiement des frais (50 USD)",
      "Réception de l'autorisation électronique par e-mail"
    ],
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "maroc",
    country: "Maroc",
    flag: "🇲🇦",
    region: "Afrique",
    type: "e-Visa (AEVM)",
    duration: "30 jours",
    delay: "24h-72h",
    docs: "Passeport, Copie Titre de séjour / Visa valide, Photo",
    fee: "770 MAD",
    note: "Accessible selon statut consulaire / titre résident.",
    culture: "Carrefour entre l'Afrique, l'Europe et le Moyen-Orient, le Maroc séduit par ses médinas historiques, son artisanat et son art de vivre.",
    workInfo: "Économie dynamique avec de grands pôles industriels (Casablanca Finance City, Tanger Med, automobile et offshoring).",
    highlights: ["Marrakech", "Chefchaouen", "Désert du Sahara"],
    emblems: ["Étoile chérifienne", "Lion de l'Atlas"],
    steps: [
      "Vérification de l'éligibilité (titre de séjour ou visa éligible)",
      "Soumission en ligne sur le portail e-Maroc",
      "Paiement des frais en ligne",
      "Téléchargement de l'AEVM validée"
    ],
    image: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "dubai",
    country: "Émirats Arabes Unis (Dubaï)",
    flag: "🇦🇪",
    region: "Asie",
    type: "e-Visa Tourisme",
    duration: "30 / 60 jours",
    delay: "24h-48h",
    docs: "Scan Passeport haute définition, Photo d'identité couleur",
    fee: "130 USD",
    note: "Délivrance garantie via sponsor agréé.",
    culture: "Symbole de modernité fulgurante, Dubaï combine gratte-ciels futuristes, luxe et traditions arabes hospitalières.",
    workInfo: "Métropole mondiale attractive pour la finance, l'immobilier, le commerce international et les technologies.",
    highlights: ["Burj Khalifa", "The Palm Jumeirah", "Dubaï Marina"],
    emblems: ["Faucon pèlerin", "Drapeau national"],
    steps: [
      "Transmission des documents au partenaire agence agréé",
      "Traitement et soumission de l'e-Visa auprès des services d'émigration",
      "Délivrance de l'e-Visa sous 24h à 48h",
      "Envoi du document numérique pour l'embarquement"
    ],
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "turquie",
    country: "Turquie",
    flag: "🇹🇷",
    region: "Asie",
    type: "e-Visa Consulaire",
    duration: "30 jours",
    delay: "24h",
    docs: "Passeport, Visa/Titre de séjour Schengen, US ou UK valide",
    fee: "60 USD",
    note: "Sous réserve d'un visa support éligible.",
    culture: "Pont entre l'Orient et l'Occident, la Turquie offre un patrimoine historique exceptionnel d'Istanbul à la Cappadoce.",
    workInfo: "Carrefour commercial et industriel majeur entre l'Europe et l'Asie.",
    highlights: ["Sainte-Sophie Istanbul", "Cappadoce", "Pamukkale"],
    emblems: ["Croissant et étoile", "Tulipe turque"],
    steps: [
      "Connexion au portail officiel e-Visa turc",
      "Saisie des informations de voyage et du visa support",
      "Paiement en ligne instantané",
      "Téléchargement direct de l'e-Visa"
    ],
    image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "inde",
    country: "Inde",
    flag: "🇮🇳",
    region: "Asie",
    type: "e-Visa Tourisme / Business",
    duration: "30j à 1 an",
    delay: "3-5 jours",
    docs: "Passeport, Photo, Carte de visite (Business)",
    fee: "25 à 80 USD",
    note: "Formulaire détaillé de renseignements personnels.",
    culture: "Immense mosaïque culturelle, spirituelle et artistique, l'Inde séduit par son Taj Mahal, ses traditions millénaires et sa vitalité technologique.",
    workInfo: "Superpuissance technologique (Bangalore) et centre mondial des services informatiques et pharmaceutiques.",
    highlights: ["Taj Mahal Agra", "Palais du Rajasthan", "Goa"],
    emblems: ["Chapiteau aux lions d'Ashoka", "Lotus"],
    steps: [
      "Remplissage minutieux du formulaire e-Visa officiel indien",
      "Téléversement du passeport et de la photo aux normes",
      "Paiement électronique des frais",
      "Réception de l'ETA (Electronic Travel Authorization) par e-mail"
    ],
    image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "vietnam",
    country: "Viêt Nam",
    flag: "🇻🇳",
    region: "Asie",
    type: "e-Visa Électronique",
    duration: "90 jours",
    delay: "3-5 jours",
    docs: "Passeport, Photo 4x6, Adresses d'hébergement",
    fee: "25 USD",
    note: "Entrées simples ou multiples sur le territoire.",
    culture: "Pays au dynamisme légendaire, le Viêt Nam offre des paysages karstiques spectaculaires (Baie d'Ha Long), une gastronomie raffinée et une histoire riche.",
    workInfo: "Économie industrielle en plein essor (électronique, textile, agroalimentaire) et forte croissance des startups.",
    highlights: ["Baie d'Ha Long", "Hoi An", "Hô-Chi-Minh-Ville"],
    emblems: ["Étoile d'or sur fond rouge", "Fleur de lotus"],
    steps: [
      "Soumission des documents et photo sur le portail e-Visa vietnamien",
      "Obtention d'un code de suivi de dossier",
      "Validation de l'e-Visa sous 3 à 5 jours",
      "Impression de l'e-Visa pour l'arrivée"
    ],
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "australie",
    country: "Australie",
    flag: "🇦🇺",
    region: "Océanie",
    type: "eVisitor / ETA (600)",
    duration: "3 à 12 mois",
    delay: "24h-48h",
    docs: "Passeport, Justificatifs d'attachement financier et professionnel",
    fee: "20 à 190 AUD",
    note: "Selon la classe du visa et la nationalité.",
    culture: "Terre de grands espaces, de biodiversité unique et de métropoles cosmopolites dynamiques (Sydney, Melbourne).",
    workInfo: "Marché du travail très attractif, salaires élevés, opportunités dans l'ingénierie, la santé, l'agriculture et les services.",
    highlights: ["Opéra de Sydney", "Grande Barrière de Corail", "Uluru"],
    emblems: ["Kangourou", "Émeu"],
    steps: [
      "Création d'un compte ImmiAccount officiel",
      "Remplissage de la demande ETA / eVisitor en ligne",
      "Téléversement des justificatifs requis",
      "Confirmation d'attribution par voie électronique"
    ],
    image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80"
  }
];
