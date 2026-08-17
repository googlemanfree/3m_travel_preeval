export interface EvisaDestination {
  id: string;
  country: string;
  capital: string;
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
  officialPortalUrl?: string;
  officialPortalLabel?: string;
  officialVerifiedAt?: string;
}

const createVerificationFirstEvisa = (id: string, country: string, capital: string, flag: string, region: string): EvisaDestination => ({
  id,
  country,
  capital,
  flag,
  region,
  type: "e‑Visa — éligibilité à confirmer",
  duration: "À confirmer",
  delay: "À confirmer par le portail officiel",
  docs: "Passeport valide, photographie et justificatifs de voyage : exigences à confirmer selon la nationalité, le motif et la date de départ.",
  fee: "À confirmer par le portail officiel",
  note: "Fiche de repérage : la disponibilité de l’e‑Visa et les conditions d’entrée varient selon la nationalité, le type de passeport, le motif du voyage et les règles en vigueur. Vérification obligatoire sur le portail officiel avant paiement ou réservation.",
  culture: "Destination disponible pour une pré‑évaluation d’e‑Visa par 3M Travel & Services.",
  workInfo: "Toute mobilité professionnelle dépend d’une offre, d’une autorisation et des règles applicables ; elle n’est pas garantie par cette pré‑évaluation.",
  highlights: ["Éligibilité à vérifier", "Portail officiel à consulter"],
  emblems: ["Vérification consulaire requise"],
  steps: [
    "Vérifier l’éligibilité individuelle sur le portail gouvernemental officiel",
    "Préparer le passeport et les justificatifs demandés pour le motif de voyage",
    "Soumettre uniquement après confirmation des frais et délais officiels",
    "Conserver la décision électronique et les conditions de voyage mises à jour",
  ],
  image: "",
});

const verificationFirstDestinations: EvisaDestination[] = [
  createVerificationFirstEvisa("togo", "Togo", "Lomé", "🇹🇬", "Afrique"),
  createVerificationFirstEvisa("cote-divoire", "Côte d’Ivoire", "Yamoussoukro", "🇨🇮", "Afrique"),
  createVerificationFirstEvisa("rdc", "République démocratique du Congo", "Kinshasa", "🇨🇩", "Afrique"),
  createVerificationFirstEvisa("guinee", "Guinée", "Conakry", "🇬🇳", "Afrique"),
  createVerificationFirstEvisa("malawi", "Malawi", "Lilongwe", "🇲🇼", "Afrique"),
  createVerificationFirstEvisa("zambie", "Zambie", "Lusaka", "🇿🇲", "Afrique"),
  createVerificationFirstEvisa("zimbabwe", "Zimbabwe", "Harare", "🇿🇼", "Afrique"),
  createVerificationFirstEvisa("mozambique", "Mozambique", "Maputo", "🇲🇿", "Afrique"),
  createVerificationFirstEvisa("madagascar", "Madagascar", "Antananarivo", "🇲🇬", "Afrique"),
  createVerificationFirstEvisa("seychelles", "Seychelles", "Victoria", "🇸🇨", "Afrique"),
  createVerificationFirstEvisa("laos", "Laos", "Vientiane", "🇱🇦", "Asie / Moyen-Orient"),
  createVerificationFirstEvisa("qatar", "Qatar", "Doha", "🇶🇦", "Asie / Moyen-Orient"),
  createVerificationFirstEvisa("ouzbekistan", "Ouzbékistan", "Tachkent", "🇺🇿", "Asie / Moyen-Orient"),
  createVerificationFirstEvisa("indonesie", "Indonésie", "Jakarta", "🇮🇩", "Autres destinations"),
  createVerificationFirstEvisa("bolivie", "Bolivie", "Sucre", "🇧🇴", "Autres destinations"),
  createVerificationFirstEvisa("suriname", "Suriname", "Paramaribo", "🇸🇷", "Autres destinations"),
  createVerificationFirstEvisa("papouasie-nouvelle-guinee", "Papouasie‑Nouvelle‑Guinée", "Port Moresby", "🇵🇬", "Autres destinations"),
  createVerificationFirstEvisa("somalie", "Somalie", "Mogadiscio", "🇸🇴", "Afrique"),
];

export const evisasDatabaseComplete: EvisaDestination[] = [
  {
    id: "kenya",
    country: "Kenya",
    capital: "Nairobi",
    flag: "🇰🇪",
    region: "Afrique",
    type: "eTA Électronique",
    duration: "90 jours",
    delay: "24h-72h",
    docs: "Passeport biométrique (+6 mois), Billet d'avion A/R, Justificatif d'hébergement ou invitation",
    fee: "34 USD",
    note: "Obligatoire pour tous les voyageurs avant l'embarquement (eTA Kenya).",
    culture: "Terre de safaris légendaires, le Kenya offre une diversité culturelle riche (communautés swahili, maasaï) et des paysages spectaculaires de la Vallée du Grand Rift.",
    workInfo: "Hub économique d'Afrique de l'Est ('Silicon Savannah'), opportunités en technologies, logistique et écotourisme.",
    highlights: ["Réserve nationale du Maasai Mara", "Mont Kenya", "Parc national de Nairobi", "Côte de Mombasa"],
    emblems: ["Lion du Kenya", "Armoiries nationales", "Savane africaine"],
    steps: [
      "Création d'un compte sur la plateforme officielle eTA Kenya",
      "Téléversement du passeport valide et des justificatifs de voyage",
      "Paiement sécurisé en ligne (34 USD)",
      "Validation de l'eTA sous 24h à 72h avant le départ avec notification par e-mail"
    ],
    image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "egypte",
    country: "Égypte",
    capital: "Le Caire",
    flag: "🇪🇬",
    region: "Afrique",
    type: "e-Visa Touristique",
    duration: "30 jours",
    delay: "2-5 jours",
    docs: "Passeport (+6 mois), Photo d'identité couleur, Réservation d'hôtel confirmée",
    fee: "25 USD",
    note: "Entrée simple ou multiple disponible sur le portail officiel e-Visa Égypte.",
    culture: "Berceau de l'une des plus anciennes civilisations du monde, l'Égypte fascine par son histoire pharaonique, ses pyramides de Gizeh, la vallée des Rois et le fleuve Nil.",
    workInfo: "Opportunités dans le tourisme international, l'enseignement des langues et l'énergie. Secteur tertiaire dynamique au Caire.",
    highlights: ["Pyramides de Gizeh et Sphinx", "Croisière sur le Nil", "Louxor et Vallée des Rois", "Mer Rouge (Dahab/Sharm)"],
    emblems: ["Aigle de Saladin", "Lotus sacré", "Le Nil"],
    steps: [
      "Soumission en ligne du formulaire e-Visa avec scan du passeport",
      "Paiement sécurisé des frais consulaires (25 USD)",
      "Réception de l'e-Visa validé par e-mail en 2 à 5 jours",
      "Impression de l'e-Visa pour présentation à l'arrivée à l'aéroport du Caire ou Hurghada"
    ],
    image: "https://images.unsplash.com/photo-1568322445389-f64ac25256f0?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "tanzanie",
    country: "Tanzanie & Zanzibar",
    capital: "Dodoma (Zanzibar City)",
    flag: "🇹🇿",
    region: "Afrique",
    type: "e-Visa Touristique",
    duration: "30-90 jours",
    delay: "3-5 jours",
    docs: "Passeport (+6 mois), Photo d'identité, Billet d'avion retour",
    fee: "50 USD",
    note: "Valable pour le territoire continental et l'archipel autonome de Zanzibar.",
    culture: "Célèbre pour le Kilimandjaro et le parc du Serengeti, la Tanzanie allie traditions swahilies et splendeurs naturelles de l'océan Indien.",
    workInfo: "Secteurs en forte croissance : tourisme durable, agriculture, services maritimes à Zanzibar.",
    highlights: ["Mont Kilimandjaro", "Parc national du Serengeti", "Cratère du Ngorongoro", "Stone Town (Zanzibar)"],
    emblems: ["Uhuru Torch", "Girafe de Tanzanie"],
    steps: [
      "Remplissage du formulaire e-Visa sur le portail d'immigration tanzanien",
      "Fourniture des pièces justificatives et scan du passeport",
      "Paiement en ligne des frais officiels (50 USD)",
      "Réception de l'autorisation électronique par e-mail"
    ],
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "maroc",
    country: "Maroc",
    capital: "Rabat",
    flag: "🇲🇦",
    region: "Afrique",
    type: "e-Visa (AEVM)",
    duration: "30 jours",
    delay: "24h-72h",
    docs: "Passeport, Copie Titre de séjour / Visa valide (Schengen, US, UK, Canada, Japon), Photo",
    fee: "770 MAD",
    note: "Accessible aux titulaires d'un visa ou titre de séjour éligible (pays occidentaux).",
    culture: "Carrefour entre l'Afrique, l'Europe et le Moyen-Orient, le Maroc séduit par ses médinas historiques, son artisanat d'art et son hospitalité légendaire.",
    workInfo: "Économie dynamique avec de grands pôles industriels (Casablanca Finance City, Tanger Med, automobile et offshoring).",
    highlights: ["Médina de Marrakech", "Chefchaouen (la ville bleue)", "Désert du Sahara (Merzouga)", "Jardin Majorelle"],
    emblems: ["Étoile chérifienne", "Lion de l'Atlas"],
    steps: [
      "Vérification de l'éligibilité sur le portail officiel e-Maroc",
      "Téléversement du passeport et du justificatif de séjour/visa support",
      "Paiement des frais en ligne de manière sécurisée",
      "Téléchargement de l'AEVM validée par e-mail"
    ],
    image: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "ethiopie",
    country: "Éthiopie",
    capital: "Add-Abeba",
    flag: "🇪🇹",
    region: "Afrique",
    type: "e-Visa Touristique",
    duration: "30-90 jours",
    delay: "24h-48h",
    docs: "Passeport (+6 mois), Photo d'identité récente, Billet d'avion Ethiopian Airlines ou autre",
    fee: "82 USD",
    note: "Délivrance à l'arrivée possible à l'aéroport Bole d'Add-Abeba, mais l'e-Visa en amont est fortement recommandé.",
    culture: "Pays au patrimoine historique chrétien et africain unique, l'Éthiopie n'a jamais été colonisée et abrite les monastères rupestres de Lalibela.",
    workInfo: "Siège de l'Union Africaine, carrefour diplomatique et aéronautique majeur en Afrique.",
    highlights: ["Églises monolithiques de Lalibela", "Monts Simien", "Lac Tana (source du Nil Bleu)"],
    emblems: ["Lion conquérant de la tribu de Juda", "Pentagramme éthiopien"],
    steps: [
      "Accès au portail officiel e-Visa d'Add-Abeba",
      "Remplissage des informations de voyage et scan du passeport",
      "Paiement par carte bancaire internationale",
      "Réception de l'approbation e-Visa par e-mail"
    ],
    image: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "ouganda",
    country: "Ouganda",
    capital: "Kampala",
    flag: "🇺🇬",
    region: "Afrique",
    type: "e-Visa Est-Africain",
    duration: "90 jours",
    delay: "3-5 jours",
    docs: "Passeport (+6 mois), Photo, Certificat de vaccination Fièvre jaune",
    fee: "50 USD",
    note: "Possibilité de demander l'East Africa Tourist Visa combinant Kenya, Ouganda et Rwanda (100 USD).",
    culture: "Surnommé la 'Perle de l'Afrique' par Winston Churchill, l'Ouganda offre une nature luxuriante, les sources du Nil et les derniers gorilles de montagne.",
    workInfo: "Secteurs porteurs : agro-industrie, énergies renouvelables, écotourisme et services financiers.",
    highlights: ["Parc national de Bwindi (Gorilles)", "Murchison Falls", "Source du Nil à Jinja"],
    emblems: ["Grue cendrée couronnée", "Tambour traditionnel"],
    steps: [
      "Soumission de la demande sur le portail d'immigration ougandais",
      "Téléversement des pièces justificatives (passeport et carnet de vaccination)",
      "Paiement en ligne des frais (50 USD)",
      "Réception de l'e-Visa et présentation à l'arrivée à Entebbe"
    ],
    image: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "rwanda",
    country: "Rwanda",
    capital: "Kigali",
    flag: "🇷🇼",
    region: "Afrique",
    type: "e-Visa / Visa à l'arrivée",
    duration: "30 jours",
    delay: "24h-48h",
    docs: "Passeport (+6 mois), Photo d'identité",
    fee: "50 USD",
    note: "Kigali est l'une des capitales les plus propres, sûres et dynamiques d'Afrique.",
    culture: "Le pays des mille collines séduit par son dynamisme technologique, son organisation exemplaire et ses parcs nationaux préservés.",
    workInfo: "Hub technologique et financier en plein essor (Kigali Innovation City), idéal pour les affaires et les startups.",
    highlights: ["Parc des Volcans", "Parc national de l'Akagera", "Mémorial du génocide de Kigali"],
    emblems: ["Soleil radieux", "Corbeille rwandaise (Imigongo)"],
    steps: [
      "Demande en ligne sur le portail IremboGOv ou à l'arrivée",
      "Fourniture des informations de passeport",
      "Paiement des frais (50 USD)",
      "Validation électronique rapide"
    ],
    image: "https://images.unsplash.com/photo-1578593147216-e9173c161be2?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "djibouti",
    country: "Djibouti",
    capital: "Djibouti",
    flag: "🇩🇯",
    region: "Afrique",
    type: "e-Visa Électronique",
    duration: "31 jours",
    delay: "24h-72h",
    docs: "Passeport (+6 mois), Billet d'avion retour, Réservation hôtel",
    fee: "23 USD",
    note: "Carrefour géostratégique entre la mer Rouge et l'océan Indien.",
    culture: "Pays aux paysages géologiques lunaires extraordinaires (Lac Assal, Lac Abbé) et carrefour maritime mondial.",
    workInfo: "Grands projets portuaires, logistique internationale, services maritimes et bases internationales.",
    highlights: ["Lac Assal (point le plus bas d'Afrique)", "Lac Abbé et ses cheminées de fée", "Requin-baleine au Gubbet"],
    emblems: ["Étoile rouge sur fond vert et bleu", "Laurier maritime"],
    steps: [
      "Accès au site officiel e-Visa Djibouti",
      "Saisie des données du passeport",
      "Paiement en ligne (23 USD)",
      "Réception de l'e-Visa par e-mail"
    ],
    image: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "dubai",
    country: "Émirats Arabes Unis (Dubaï)",
    capital: "Abou Dabi (Dubaï)",
    flag: "🇦🇪",
    region: "Asie",
    type: "e-Visa Tourisme",
    duration: "30 / 60 jours",
    delay: "24h-48h",
    docs: "Scan Passeport haute définition (+6 mois), Photo d'identité couleur sur fond blanc",
    fee: "130 USD",
    note: "Délivrance rapide via notre agence partenaire agréée EAU.",
    culture: "Symbole de modernité fulgurante, Dubaï combine gratte-ciels futuristes, luxe international et traditions arabes hospitalières.",
    workInfo: "Métropole mondiale très attractive pour la finance, l'immobilier, le commerce international, l'aviation et le tourisme.",
    highlights: ["Burj Khalifa", "The Palm Jumeirah", "Dubaï Marina et JBR", "Desert Safari"],
    emblems: ["Faucon pèlerin", "Drapeau national"],
    steps: [
      "Transmission de vos documents au partenaire agence agréé EAU",
      "Traitement et soumission de l'e-Visa auprès des services d'émigration fédéraux",
      "Délivrance de l'e-Visa sous 24h à 48h",
      "Envoi du document numérique pour embarquement direct"
    ],
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "turquie",
    country: "Turquie",
    capital: "Ankara (Istanbul)",
    flag: "🇹🇷",
    region: "Asie",
    type: "e-Visa Consulaire",
    duration: "30 jours",
    delay: "24h",
    docs: "Passeport, Visa ou Titre de séjour valide d'un pays de l'Espace Schengen, US, UK ou Irlande",
    fee: "60 USD",
    note: "Conditionné à la détention d'un visa ou titre de séjour d'un pays occidental éligible.",
    culture: "Pont entre l'Orient et l'Occident, la Turquie offre un patrimoine historique exceptionnel d'Istanbul à la Cappadoce.",
    workInfo: "Carrefour commercial et industriel majeur entre l'Europe et l'Asie.",
    highlights: ["Sainte-Sophie à Istanbul", "Cappadoce en montgolfière", "Pamukkale et Éphèse"],
    emblems: ["Croissant et étoile", "Tulipe turque"],
    steps: [
      "Connexion au portail officiel e-Visa turc",
      "Saisie des informations de voyage et du visa support",
      "Paiement en ligne instantané",
      "Téléchargement direct de l'e-Visa validé"
    ],
    image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "inde",
    country: "Inde",
    capital: "New Delhi",
    flag: "🇮🇳",
    region: "Asie",
    type: "e-Visa Tourisme / Business",
    duration: "30j à 1 an",
    delay: "3-5 jours",
    docs: "Passeport, Photo aux normes, Lettre d'invitation (Business) ou Réservation hôtel",
    fee: "25 à 80 USD",
    note: "Formulaire détaillé de renseignements biographiques et professionnels.",
    culture: "Immense mosaïque culturelle, spirituelle et artistique, l'Inde séduit par son Taj Mahal, ses traditions millénaires et sa vitalité technologique.",
    workInfo: "Superpuissance technologique (Bangalore) et centre mondial des services informatiques et pharmaceutiques.",
    highlights: ["Taj Mahal à Agra", "Palais du Rajasthan", "Goa et plages du Sud", "Bollywood à Mumbai"],
    emblems: ["Chapiteau aux lions d'Ashoka", "Fleur de lotus"],
    steps: [
      "Remplissage minutieux du formulaire e-Visa officiel indien",
      "Téléversement du passeport et de la photo aux normes",
      "Paiement électronique des frais consulaires",
      "Réception de l'ETA (Electronic Travel Authorization) par e-mail"
    ],
    image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "vietnam",
    country: "Viêt Nam",
    capital: "Hanoï",
    flag: "🇻🇳",
    region: "Asie",
    type: "e-Visa Électronique",
    duration: "90 jours",
    delay: "3-5 jours",
    docs: "Passeport (+6 mois), Photo d'identité 4x6, Adresses d'hébergement prévues",
    fee: "25 USD",
    note: "Valable pour des entrées simples ou multiples sur tout le territoire vietnamien.",
    culture: "Pays au dynamisme légendaire, le Viêt Nam offre des paysages karstiques spectaculaires (Baie d'Ha Long), une gastronomie raffinée et une histoire riche.",
    workInfo: "Économie industrielle en plein essor (électronique, textile, agroalimentaire) et forte croissance des startups.",
    highlights: ["Baie d'Ha Long", "Hoi An (cité historique)", "Hô-Chi-Minh-Ville (Saïgon)", "Rizières de Sapa"],
    emblems: ["Étoile d'or sur fond rouge", "Fleur de lotus"],
    steps: [
      "Soumission des documents et photo sur le portail e-Visa vietnamien",
      "Obtention d'un code de suivi de dossier unique",
      "Validation de l'e-Visa sous 3 à 5 jours ouvrés",
      "Impression de l'e-Visa pour contrôle aux frontières"
    ],
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "cambodge",
    country: "Cambodge",
    capital: "Phnom Penh",
    flag: "🇰🇭",
    region: "Asie",
    type: "e-Visa Touristique",
    duration: "30 jours",
    delay: "3 jours",
    docs: "Passeport (+6 mois), Photo d'identité récente, Billet d'avion",
    fee: "36 USD",
    note: "Entrée possible par les principaux aéroports internationaux et frontières terrestres.",
    culture: "Terre du majestueux temple d'Angkor Wat, le Cambodge séduit par son peuple chaleureux, son fleuve Mékong et son histoire khmère.",
    workInfo: "Secteurs en développement : tourisme, textile, agro-industrie et construction.",
    highlights: ["Temples d'Angkor Wat (Siem Reap)", "Palais Royal de Phnom Penh", "Îles tropicales de Koh Rong"],
    emblems: ["Angkor Wat", "Krona royal"],
    steps: [
      "Accès au site officiel e-Visa du Royaume du Cambodge",
      "Saisie des données et téléversement du passeport",
      "Paiement par carte bancaire (36 USD)",
      "Réception de l'e-Visa par e-mail en format PDF"
    ],
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "srilanka",
    country: "Sri Lanka",
    capital: "Colombo (Sri Jayawardenepura Kotte)",
    flag: "🇱🇰",
    region: "Asie",
    type: "ETA / e-Visa",
    duration: "30-60 jours",
    delay: "24h-48h",
    docs: "Passeport (+6 mois), Billet d'avion retour",
    fee: "50 USD",
    note: "Autorisation Électronique de Voyage (ETA) obligatoire.",
    culture: "L'ancienne Ceylan offre une nature luxuriante, des plantations de thé à perte de vue, des temples bouddhistes millénaires et des plages idylliques.",
    workInfo: "Opportunités dans le tourisme, l'hôtellerie de luxe, le commerce et l'agro-export.",
    highlights: ["Sigiriya (Forteresse du Rocher)", "Kandy (Temple de la Dent)", "Trains panoramiques à travers le thé"],
    emblems: ["Lion srilankais", "Fleur de lotus bleu"],
    steps: [
      "Demande en ligne sur le portail officiel ETA Sri Lanka",
      "Saisie des informations de vol et de passeport",
      "Paiement électronique (50 USD)",
      "Réception de l'approbation ETA par e-mail"
    ],
    image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "azerbaidjan",
    country: "Azerbaïdjan",
    capital: "Bakou",
    flag: "🇦🇿",
    region: "Europe",
    type: "ASAN e-Visa",
    duration: "30 jours",
    delay: "3 jours ouvrés",
    docs: "Passeport (+6 mois), Réservation d'hôtel",
    fee: "26 USD",
    note: "Système ASAN Visa rapide et 100% en ligne.",
    culture: "Au carrefour de l'Europe de l'Est et de l'Asie occidentale, Bakou marie architecture futuriste (Flame Towers) et vieille ville médiévale.",
    workInfo: "Pôle énergétique majeur, développement des technologies et du tourisme d'affaires.",
    highlights: ["Flame Towers à Bakou", "Parc national de Gobustan (pétroglyphes)", "Feux éternels de Yanar Dag"],
    emblems: ["Feu éternel", "Bouton d'or azéri"],
    steps: [
      "Remplissage de la demande sur le portail ASAN e-Visa",
      "Téléversement de la copie du passeport",
      "Paiement des frais de visa (26 USD)",
      "Réception de l'e-Visa validé sous 3 jours"
    ],
    image: "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "albanie",
    country: "Albanie",
    capital: "Tirana",
    flag: "🇦🇱",
    region: "Europe",
    type: "e-Visa / Visa Électronique",
    duration: "90 jours",
    delay: "5-10 jours",
    docs: "Passeport (+6 mois), Justificatif de ressources, Hébergement, Billet A/R",
    fee: "50 EUR",
    note: "Pour les ressortissants soumis à visa nécessitant l'e-Visa albanais.",
    culture: "Joyau méconnu des Balkans, l'Albanie offre des plages sauvages (Riviera albanaise), des montagnes majestueuses et une histoire fascinante.",
    workInfo: "Secteurs en croissance : tourisme, infrastructures, externalisation et technologies.",
    highlights: ["Riviera albanaise (Saranda/Ksamil)", "Vielle ville de Berat et Gjirokastër", "Tirana et Skanderbeg Square"],
    emblems: ["Aigle bicéphale", "Drapeau national rouge et noir"],
    steps: [
      "Soumission du dossier sur le portail consulaire albanais",
      "Fourniture des pièces justificatives financières et de voyage",
      "Paiement des frais de dossier",
      "Réception de l'approbation e-Visa par e-mail"
    ],
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "bahrein",
    country: "Bahreïn",
    capital: "Manama",
    flag: "🇧🇭",
    region: "Asie",
    type: "e-Visa Électronique",
    duration: "14-30 jours",
    delay: "3-5 jours",
    docs: "Passeport (+6 mois), Relevés bancaires récents, Billet d'avion",
    fee: "29 BHD (~77 USD)",
    note: "Royaume insulaire dynamique du Golfe persique.",
    culture: "Mélange unique d'histoire perlière ancienne, de modernité financière et de sites archéologiques classés à l'UNESCO.",
    workInfo: "Centre bancaire et financier historique du Moyen-Orient, opportunités en finance, consulting et logistique.",
    highlights: ["Qal'at al-Bahrain (Fort)", "Arbre de la vie", "Souq de Manama"],
    emblems: ["Feuille de palmier dattier", "Armoiries royales"],
    steps: [
      "Connexion au portail officiel e-Visa de Bahreïn",
      "Saisie des données personnelles et justificatifs financiers",
      "Paiement en ligne sécurisé",
      "Réception de l'e-Visa validé par e-mail"
    ],
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "oman",
    country: "Oman",
    capital: "Mascate",
    flag: "🇴🇲",
    region: "Asie",
    type: "e-Visa Sultanat d'Oman",
    duration: "10-30 jours",
    delay: "24h-72h",
    docs: "Passeport (+6 mois), Photo d'identité, Réservation hôtel",
    fee: "20-50 OMR",
    note: "Hospitalité légendaire et paysages spectaculaires entre mer et montagnes.",
    culture: "Oman préserve jalousement son patrimoine authentique avec ses forts de pisé, ses oasis luxuriantes et ses traditions maritimes.",
    workInfo: "Économie en diversification (Vision 2040) axée sur le tourisme de luxe, les énergies et la logistique.",
    highlights: ["Mascate (Grand Mosque et Mutrah)", "Désert de Wahiba Sands", "Djebel Akhdar"],
    emblems: ["Le Khanjar omani", "Croisements croisés"],
    steps: [
      "Demande sur le portail Royal Oman Police e-Visa",
      "Téléversement du passeport et de la photo",
      "Paiement des frais par carte bancaire",
      "Obtention de l'e-Visa par e-mail"
    ],
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "pakistan",
    country: "Pakistan",
    capital: "Islamabad",
    flag: "🇵🇰",
    region: "Asie",
    type: "e-Visa Touristique",
    duration: "90 jours",
    delay: "7-10 jours",
    docs: "Passeport (+6 mois), Photo, Lettre d'invitation ou Réservation hôtel",
    fee: "35 USD",
    note: "Paysages himalayens grandioses et hospitalité chaleureuse.",
    culture: "Terre de civilisations anciennes (vallée de l'Indus) et de sommets mythiques (K2, Nanga Parbat), le Pakistan offre une richesse culturelle intense.",
    workInfo: "Secteurs en développement : technologies de l'information, textile, agriculture et énergie.",
    highlights: ["Autoroute du Karakoram", "Lahore (Fort et mosquée Badshahi)", "Vallée de Hunza"],
    emblems: ["Croissant et étoile", "Jasmine (fleur nationale)"],
    steps: [
      "Inscription sur le portail officiel Pakistan Online Visa",
      "Remplissage du formulaire et téléversement des pièces",
      "Paiement en ligne des frais de visa",
      "Réception de l'e-Visa par e-mail"
    ],
    image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "australie",
    country: "Australie (Subclass 600)",
    capital: "Canberra",
    flag: "🇦🇺",
    region: "Océanie",
    type: "e-Visitor / Tourist Visa",
    duration: "3, 6 ou 12 mois",
    delay: "10-20 jours",
    docs: "Passeport biométrique, Relevés bancaires, Justificatif d'emploi, Lettre de motivation",
    fee: "190 AUD",
    note: "Demande en ligne via le portail officiel ImmiAccount.",
    culture: "Continent-île aux espaces naturels sauvages uniques, l'Australie allie métropoles multiculturelles dynamiques et nature préservée.",
    workInfo: "Économie hautement développée, grande attractivité pour les professionnels qualifiés et les programmes d'études.",
    highlights: ["Opéra de Sydney", "Grande Barrière de Corail", "Uluru (Ayers Rock)"],
    emblems: ["Kangaroo et Émeu", "Wattle doré"],
    steps: [
      "Création d'un compte ImmiAccount sur le site du gouvernement australien",
      "Remplissage du formulaire de visa Visitor (Subclass 600)",
      "Téléversement des justificatifs financiers et professionnels traduits",
      "Paiement des frais et suivi de l'instruction consulaire"
    ],
    image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "nouvelle-zelande",
    country: "Nouvelle-Zélande",
    capital: "Wellington",
    flag: "🇳🇿",
    region: "Océanie",
    type: "NZeTA / e-Visa",
    duration: "3 mois",
    delay: "3-5 jours",
    docs: "Passeport (+3 mois), Billet retour, Taxe IVL incluse",
    fee: "57 NZD",
    note: "Autorisation NZeTA requise avant l'embarquement pour les voyageurs éligibles.",
    culture: "Terre de paysages féeriques et de culture māori vibrante, la Nouvelle-Zélande est réputée pour sa qualité de vie.",
    workInfo: "Opportunités en agriculture de pointe, technologies vertes, tourisme et éducation.",
    highlights: ["Milford Sound", "Rotorua (sources thermales)", "Queenstown (capitale de l'aventure)"],
    emblems: ["Fougère argentée", "Kiwi (oiseau national)"],
    steps: [
      "Demande en ligne via l'application mobile NZeTA ou le site web officiel",
      "Saisie des informations de passeport",
      "Paiement de la NZeTA et de la taxe de conservation (IVL)",
      "Réception de l'approbation électronique sous 72h"
    ],
    image: "https://images.unsplash.com/photo-1507699622108-4be3957004f1?auto=format&fit=crop&w=800&q=80"
  },
  ...verificationFirstDestinations,
];

const officialEvisaReferences: Record<string, { url: string; label: string }> = {
  kenya: { url: "https://www.etakenya.go.ke/", label: "Kenya Electronic Travel Authorisation" },
  egypte: { url: "https://visa2egypt.gov.eg/", label: "Egypt e‑Visa Portal" },
  tanzanie: { url: "https://visa.immigration.go.tz/", label: "Tanzania Immigration e‑Services" },
  maroc: { url: "https://www.acces-maroc.ma/", label: "Portail officiel Accès Maroc" },
  ethiopie: { url: "https://www.evisa.gov.et/", label: "Ethiopia e‑Visa" },
  ouganda: { url: "https://visas.immigration.go.ug/", label: "Uganda Electronic Visa/Permit" },
  rwanda: { url: "https://www.migration.gov.rw/visa", label: "Rwanda Directorate General of Immigration" },
  djibouti: { url: "https://www.evisa.gouv.dj/", label: "Djibouti e‑Visa" },
  dubai: { url: "https://smartservices.icp.gov.ae/echannels/web/client/guest/index.html", label: "UAE ICP Smart Services" },
  turquie: { url: "https://www.evisa.gov.tr/", label: "Republic of Türkiye e‑Visa" },
  inde: { url: "https://indianvisaonline.gov.in/evisa/tvoa.html", label: "Government of India e‑Visa" },
  vietnam: { url: "https://evisa.gov.vn/", label: "Viet Nam National e‑Visa System" },
  cambodge: { url: "https://www.evisa.gov.kh/", label: "Cambodia e‑Visa" },
  srilanka: { url: "https://eta.gov.lk/", label: "Sri Lanka Electronic Travel Authorization" },
  azerbaidjan: { url: "https://evisa.gov.az/", label: "Azerbaijan ASAN Visa" },
  albanie: { url: "https://e-visa.al/", label: "Albania e‑Visa" },
  bahrein: { url: "https://www.evisa.gov.bh/", label: "Bahrain e‑Visa" },
  oman: { url: "https://evisa.rop.gov.om/", label: "Royal Oman Police e‑Visa" },
  pakistan: { url: "https://visa.nadra.gov.pk/", label: "Pakistan Online Visa System" },
  australie: { url: "https://online.immi.gov.au/", label: "Australian ImmiAccount" },
  "nouvelle-zelande": { url: "https://www.immigration.govt.nz/new-zealand-visas/visas/visa/nzeta", label: "Immigration New Zealand NZeTA" },
  togo: { url: "https://voyage.gouv.tg/", label: "Togo Voyage — portail gouvernemental" },
  "cote-divoire": { url: "https://www.snedai.com/e-visa/", label: "Côte d’Ivoire e‑Visa (SNEDAI)" },
  rdc: { url: "https://evisa.gouv.cd/", label: "RDC DGM e‑Visa" },
  guinee: { url: "https://www.paf.gov.gn/visa", label: "Guinée — Police de l’Air et des Frontières e‑Visa" },
  malawi: { url: "https://evisa.gov.mw/", label: "Malawi e‑Visa" },
  zambie: { url: "https://evisa.zambiaimmigration.gov.zm/", label: "Zambia Immigration e‑Visa" },
  zimbabwe: { url: "https://www.evisa.gov.zw/", label: "Zimbabwe e‑Visa" },
  mozambique: { url: "https://evisa.gov.mz/", label: "Mozambique e‑Visa" },
  madagascar: { url: "https://evisamada-mg.com/", label: "Madagascar e‑Visa" },
  seychelles: { url: "https://seychelles.govtas.com/", label: "Seychelles Travel Authorisation" },
  laos: { url: "https://laoevisa.gov.la/", label: "Lao Official Online Visa" },
  qatar: { url: "https://www.hayya.qa/", label: "State of Qatar Hayya Platform" },
  ouzbekistan: { url: "https://e-visa.gov.uz/", label: "Uzbekistan Electronic Visa" },
  indonesie: { url: "https://evisa.imigrasi.go.id/", label: "Indonesia Immigration e‑Visa" },
  bolivie: { url: "https://portalmre.rree.gob.bo/formvisas/", label: "Bolivia Foreign Affairs Visa Portal" },
  suriname: { url: "https://suriname.vfsevisa.com/", label: "Suriname Official e‑Visa / eTourist Card" },
  "papouasie-nouvelle-guinee": { url: "https://evisa.ica.gov.pg/", label: "Papua New Guinea e‑Visa" },
  somalie: { url: "https://etas.gov.so/", label: "Somalia Immigration eTAS" },
};

for (const destination of evisasDatabaseComplete) {
  const reference = officialEvisaReferences[destination.id];
  if (!reference) continue;
  destination.officialPortalUrl = reference.url;
  destination.officialPortalLabel = reference.label;
  destination.officialVerifiedAt = "17 août 2026";
}
