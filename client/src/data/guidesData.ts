/**
 * Guides pratiques (campagne d'enrichissement, lot 6) : /guides et /guides/:slug.
 * Contenu volontairement général et durable : aucun chiffre assorti d'une unité, aucune promesse de résultat,
 * aucun montant ni date de rentrée propre à un pays (ils varient et sont à vérifier auprès de l'établissement ou de l'autorité).
 * Contrôlé par server/contentCampaign.regression.test.ts. Lu aussi par server/publicPrerender.ts.
 */
import type { FaqItem } from "@/data/pageEnrichment";

export type GuideSection = { id: string; title: string; paragraphs?: string[]; bullets?: string[] };
export type GuideSource = { label: string; url: string; consultedAt: string };
export type GuideLink = { href: string; label: string };
export type Guide = {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  lead: string;
  sections: GuideSection[];
  faq: FaqItem[];
  related: GuideLink[];
  sources?: GuideSource[];
};

export const GUIDES: Guide[] = [
  {
    slug: "legalisation-apostille-traduction",
    title: "Légalisation, apostille et traduction : que faire de vos documents ?",
    seoTitle: "Légalisation, apostille et traduction",
    description: "Légalisation, apostille et traduction : à quoi elles servent, dans quel ordre les faire et comment éviter un refus de dossier.",
    lead: "Un document délivré dans un pays n’est pas toujours accepté tel quel dans un autre. Trois formalités peuvent s’ajouter : la traduction, la légalisation et l’apostille. Elles ne se remplacent pas.",
    sections: [
      {
        id: "trois-notions",
        title: "Trois notions à ne pas confondre",
        bullets: [
          "La traduction rend le contenu lisible dans la langue de l’autorité qui le reçoit. Selon l’autorité, une traduction simple suffit ou une traduction assermentée est exigée.",
          "La légalisation confirme, par une chaîne d’autorités, que la signature et la qualité de l’agent qui a signé le document sont authentiques.",
          "L’apostille remplace cette chaîne par un cachet unique, mais uniquement entre pays parties à la Convention de La Haye sur l’apostille.",
        ],
      },
      {
        id: "quel-ordre",
        title: "Dans quel ordre procéder ?",
        paragraphs: [
          "Le principe général : on fait d’abord authentifier le document d’origine (légalisation ou apostille), puis on le fait traduire, afin que la traduction couvre aussi les cachets et mentions ajoutés. Certaines autorités acceptent un autre ordre : demandez-leur ce qu’elles exigent avant d’engager des frais.",
          "Ne traduisez jamais un document dont l’original est susceptible d’être refusé : une traduction ne corrige pas un original non conforme.",
        ],
      },
      {
        id: "apostille-ou-legalisation",
        title: "Apostille ou légalisation : comment savoir ?",
        paragraphs: [
          "Tout dépend du pays qui a délivré le document et du pays qui le recevra. Si les deux sont parties à la Convention de La Haye, l’apostille suffit. Sinon, il faut en général passer par la légalisation, souvent auprès du ministère des Affaires étrangères du pays d’origine puis de l’ambassade ou du consulat du pays de destination.",
          "La liste des États parties est tenue à jour par la Conférence de La Haye de droit international privé : consultez-la plutôt qu’une liste recopiée sur un forum.",
        ],
      },
      {
        id: "erreurs",
        title: "Les erreurs qui coûtent le plus cher",
        bullets: [
          "Faire traduire avant d’avoir authentifié le document, puis devoir recommencer la traduction.",
          "Envoyer une copie simple alors que l’autorité demande une copie certifiée conforme.",
          "Ne pas vérifier l’orthographe des noms : elle doit correspondre exactement à celle du passeport.",
          "Confier ses originaux à une personne rencontrée en ligne qui promet de « tout arranger ».",
        ],
      },
    ],
    faq: [
      { question: "L’apostille est-elle valable dans tous les pays ?", answer: "Non. Elle n’est reconnue qu’entre pays parties à la Convention de La Haye. Pour les autres, c’est la légalisation qui s’applique. Vérifiez la liste officielle des États parties avant d’engager la démarche." },
      { question: "Faut-il toujours une traduction assermentée ?", answer: "Non. C’est l’autorité qui reçoit le document qui décide si une traduction simple suffit. Demandez-lui par écrit ce qu’elle accepte : c’est la seule information qui fait foi." },
      { question: "3M TRAVEL AGENCY peut-elle légaliser ou apostiller mes documents ?", answer: "Nous vous aidons à identifier la formalité qui s’applique et à préparer vos pièces. La légalisation et l’apostille sont délivrées par des autorités ; nous ne les remplaçons pas. Ce que nous faisons et les éventuels frais sont confirmés par écrit avant tout paiement." },
      { question: "Combien de temps faut-il prévoir ?", answer: "Le délai dépend des autorités concernées et de la période. Commencez ces démarches très tôt, avant de fixer une date de dépôt ou de départ, car elles ne peuvent pas être accélérées de façon fiable." },
    ],
    related: [
      { href: "/conformite-documents", label: "Conformité des documents" },
      { href: "/traduction/order", label: "Demander une traduction" },
      { href: "/faq", label: "Questions fréquentes" },
    ],
    sources: [
      { label: "Conférence de La Haye de droit international privé — Section Apostille", url: "https://www.hcch.net/fr/instruments/conventions/specialised-sections/apostille", consultedAt: "2026-10-17" },
    ],
  },
  {
    slug: "calendrier-rentrees-et-retroplanning",
    title: "Calendrier : quand préparer un projet d’études ou de travail ?",
    seoTitle: "Calendrier et rétroplanning du projet",
    description: "Comment construire un rétroplanning réaliste à partir de la date de rentrée ou de prise de poste, et quelles étapes commencer en premier.",
    lead: "Un projet se prépare à rebours : on part de la date où l’on doit être sur place et on remonte les étapes. Les dates précises changent d’un établissement et d’un pays à l’autre ; la méthode, elle, reste la même.",
    sections: [
      {
        id: "partir-de-la-date",
        title: "Partir de la date d’arrivée",
        paragraphs: [
          "Dans beaucoup de pays de l’hémisphère nord, la rentrée principale a lieu à l’automne et certaines formations ouvrent une seconde session en hiver ou au printemps. Dans l’hémisphère sud, le calendrier académique est différent. Les emplois suivent des cycles propres à chaque secteur.",
          "Ne vous fiez jamais à une date recopiée : prenez la date inscrite sur la page officielle de l’établissement ou dans l’offre de l’employeur, puis remontez à partir d’elle.",
        ],
      },
      {
        id: "etapes-a-rebours",
        title: "Les étapes, de la dernière à la première",
        bullets: [
          "Arrivée sur place et premières démarches : logement, assurance, inscription administrative.",
          "Obtention du visa ou de l’autorisation : à anticiper en tenant compte du fait que les délais varient selon la période.",
          "Dépôt du dossier de visa : toutes les pièces authentifiées et traduites, la preuve de ressources, l’assurance si elle est exigée.",
          "Admission ou offre d’emploi : lettre d’admission, contrat ou promesse d’embauche.",
          "Tests de langue éventuels : prévoir une marge pour repasser le test si le résultat est insuffisant.",
          "Constitution des documents : actes d’état civil, diplômes, relevés, casier judiciaire, photos conformes.",
          "Évaluation du profil : savoir quelle destination et quelle voie sont réalistes avant d’engager des frais.",
        ],
      },
      {
        id: "marges",
        title: "Prévoir des marges",
        paragraphs: [
          "Chaque étape dépend d’un tiers : établissement, ambassade, centre de test, administration d’origine. Une pièce manquante ou un rendez-vous complet décale tout ce qui suit. Gardez une marge entre chaque étape plutôt qu’à la fin.",
          "Si votre date de départ est proche, dites-le dès la première discussion : un conseiller peut vous dire honnêtement si le calendrier est tenable ou s’il vaut mieux viser la session suivante.",
        ],
      },
    ],
    faq: [
      { question: "À quel moment faut-il commencer ?", answer: "Dès que le projet est envisagé : l’évaluation du profil et la constitution des documents sont les étapes les plus longues et celles qui conditionnent toutes les autres. Il vaut mieux commencer trop tôt que courir après une date." },
      { question: "Que faire si je rate la date de dépôt ?", answer: "Visez la session suivante plutôt que de déposer un dossier incomplet. Un dossier refusé laisse une trace, alors qu’un report ne coûte que du temps." },
      { question: "Les délais d’ambassade sont-ils les mêmes toute l’année ?", answer: "Non. Ils varient avec la période et l’affluence. Aucun délai affiché ne vaut engagement : consultez la page officielle de l’ambassade ou du centre de dépôt au moment de planifier." },
    ],
    related: [
      { href: "/?project=travail#evaluation-multi", label: "Commencer l’évaluation gratuite" },
      { href: "/guides/financer-ses-etudes", label: "Financer ses études" },
      { href: "/procedures", label: "Toutes les procédures" },
    ],
  },
  {
    slug: "financer-ses-etudes",
    title: "Financer ses études à l’étranger : sources et preuves de ressources",
    seoTitle: "Financer ses études à l’étranger",
    description: "Les grandes sources de financement d’études à l’étranger, comment prouver ses ressources devant une ambassade et les pièges à éviter.",
    lead: "Presque toutes les procédures d’études demandent de prouver que vous pouvez financer le séjour. Le montant exact dépend du pays et de la période : cette page explique les sources possibles et la façon de les justifier.",
    sections: [
      {
        id: "sources",
        title: "Les sources de financement possibles",
        bullets: [
          "Les ressources de la famille, justifiées par des relevés bancaires et une attestation de prise en charge.",
          "Les bourses : gouvernementales, d’établissements, de fondations ou d’organisations internationales, avec leurs critères et leurs dates limites.",
          "Un prêt étudiant, lorsqu’il existe dans le pays d’origine ou d’accueil, avec des conditions de remboursement à lire en détail.",
          "Un emploi étudiant autorisé, qui complète un budget mais ne le remplace presque jamais pour la preuve de ressources.",
          "Un garant dans le pays d’accueil, lorsque la réglementation le prévoit.",
        ],
      },
      {
        id: "prouver",
        title: "Prouver ses ressources",
        paragraphs: [
          "Les autorités regardent la cohérence : l’origine des fonds, leur ancienneté sur le compte, le lien entre le titulaire du compte et le candidat. Un versement massif la veille du dépôt attire l’attention et peut être refusé.",
          "Les montants minimaux, les types de comptes acceptés et les documents exigés sont fixés par chaque pays. Prenez-les sur la page officielle de l’autorité compétente, à la date de votre dépôt.",
        ],
      },
      {
        id: "pieges",
        title: "Les pièges à éviter",
        bullets: [
          "Les relevés « arrangés » ou prêtés : c’est un motif de refus et d’interdiction de redéposer.",
          "Les offres de « bourse assurée » contre paiement : une vraie bourse ne se paie pas pour être attribuée.",
          "Les prêts auprès de particuliers aux conditions floues.",
          "Partir en comptant sur un emploi sur place qui n’est pas autorisé par le visa.",
        ],
      },
    ],
    faq: [
      { question: "Combien faut-il prouver sur son compte ?", answer: "Le montant est fixé par chaque pays et change avec la durée du séjour et les années. Il n’existe pas de chiffre valable partout : relevez-le sur la page officielle de l’autorité compétente le jour où vous préparez votre dossier." },
      { question: "Peut-on payer l’agence avec l’argent qui sert de preuve de ressources ?", answer: "Non, c’est une erreur fréquente. Les frais de préparation sont à prévoir à part, et ils sont confirmés par écrit avant tout paiement. La preuve de ressources doit rester intacte." },
      { question: "Les bourses sont-elles réservées aux meilleurs dossiers ?", answer: "Elles reposent sur des critères propres à chaque programme : résultats, domaine, situation, pays d’origine. Lisez les critères et les dates limites ; personne ne peut vous promettre une bourse." },
    ],
    related: [
      { href: "/guides/budget-vie-a-letranger", label: "Construire son budget" },
      { href: "/etudes", label: "Parcours études" },
      { href: "/verifier-une-agence", label: "Vérifier une agence avant de payer" },
    ],
  },
  {
    slug: "budget-vie-a-letranger",
    title: "Construire son budget de vie à l’étranger",
    seoTitle: "Budget de vie à l’étranger : la méthode",
    description: "Une méthode pour estimer son budget avant un départ : postes de dépenses, sources officielles à consulter et marges à prévoir, sans chiffres recopiés.",
    lead: "Le coût de la vie change d’une ville à l’autre et d’une année à l’autre. Plutôt qu’un chiffre moyen, voici les postes à chiffrer soi-même, avec des données à jour.",
    sections: [
      {
        id: "postes",
        title: "Les postes à chiffrer",
        bullets: [
          "Le logement : loyer, charges, caution, ameublement et frais d’agence éventuels.",
          "L’assurance : santé, responsabilité, et celle exigée par le visa le cas échéant.",
          "Les frais d’études ou de formation, et le matériel qui va avec.",
          "L’alimentation, les transports locaux et la téléphonie.",
          "Les frais administratifs de l’année : titre de séjour, renouvellements, traductions.",
          "Le voyage aller et les retours prévus, qui pèsent plus qu’on ne l’imagine.",
        ],
      },
      {
        id: "sources",
        title: "Où trouver des chiffres à jour",
        paragraphs: [
          "Préférez les pages officielles de l’établissement (frais, logements universitaires), des services de l’immigration (montants de référence) et des collectivités locales (transport, aides). Les comparateurs en ligne donnent un ordre de grandeur mais se périment vite.",
          "Notez la date à laquelle vous avez relevé chaque chiffre : c’est ce qui permet de savoir, trois mois plus tard, s’il faut le revérifier.",
        ],
      },
      {
        id: "marges",
        title: "Les marges et les imprévus",
        paragraphs: [
          "Prévoyez les premiers mois séparément : caution, achats d’installation, premières factures arrivent avant les premières ressources locales. Gardez aussi une réserve pour un imprévu médical ou un retour anticipé.",
          "Si le budget ne tient pas avec une marge raisonnable, mieux vaut le savoir avant le dépôt du dossier qu’après l’arrivée.",
        ],
      },
    ],
    faq: [
      { question: "Existe-t-il un budget moyen par pays ?", answer: "Les moyennes cachent de grandes différences entre villes et modes de vie. Nous ne publions pas de moyenne : construisez votre budget poste par poste, avec des sources officielles datées." },
      { question: "Le budget fait-il partie de l’évaluation de profil ?", answer: "Oui, c’est un point de la discussion avec le conseiller : il aide à voir si la destination et la voie envisagées sont réalistes pour votre situation." },
      { question: "Peut-on travailler pour financer son séjour ?", answer: "Cela dépend du visa et du pays : certaines autorisations encadrent le travail étudiant, d’autres l’interdisent. Vérifiez les conditions de votre titre précis avant de compter sur un revenu." },
    ],
    related: [
      { href: "/guides/financer-ses-etudes", label: "Financer ses études" },
      { href: "/assurance", label: "Assurance voyage et santé" },
      { href: "/tarifs", label: "Comprendre les tarifs" },
    ],
  },
  {
    slug: "apres-l-arrivee",
    title: "Après l’arrivée : les premières démarches à faire",
    seoTitle: "Après l’arrivée : premières démarches",
    description: "Ce qu’il faut faire pendant les premiers jours et les premières semaines dans un nouveau pays : papiers, logement, banque, santé, vie quotidienne.",
    lead: "L’arrivée n’est pas la fin du dossier : plusieurs démarches doivent être faites rapidement, parfois dans un délai imposé. Les règles diffèrent selon le pays ; voici l’ordre logique et les réflexes à avoir.",
    sections: [
      {
        id: "premiers-jours",
        title: "Les premiers jours",
        bullets: [
          "Garder sur soi, dans une pochette, les originaux utiles : passeport, visa ou décision électronique, assurance, lettre d’admission ou contrat, justificatif de logement.",
          "Faire des copies numériques de chaque document et se les envoyer par un moyen sûr.",
          "Prévenir un proche de l’adresse exacte et de la manière de vous joindre.",
          "Se procurer un moyen de communication local et un moyen de paiement utilisable.",
        ],
      },
      {
        id: "administratif",
        title: "Les démarches administratives",
        paragraphs: [
          "Selon le pays, il peut falloir se déclarer auprès de la commune, valider le visa en ligne, demander un titre de séjour ou s’inscrire à l’assurance maladie locale, parfois dans un délai court après l’arrivée. Le délai et la procédure se trouvent sur la décision de visa et sur la page officielle des services d’immigration.",
          "Notez ces échéances dès le départ : manquer un délai peut compliquer la suite, y compris un futur renouvellement.",
        ],
      },
      {
        id: "vie-quotidienne",
        title: "La vie quotidienne",
        bullets: [
          "Ouvrir un compte bancaire local lorsque c’est possible, avec les justificatifs demandés.",
          "S’informer sur le système de santé : qui est couvert, quelle carte présenter, où consulter.",
          "Repérer l’établissement, le lieu de travail et les transports, avant le premier jour.",
          "Connaître les numéros d’urgence et l’adresse de l’ambassade ou du consulat de son pays.",
        ],
      },
      {
        id: "alertes",
        title: "Les réflexes de prudence",
        bullets: [
          "Ne jamais confier son passeport en gage à un logeur ou à un employeur.",
          "Ne pas payer un loyer ou une caution avant d’avoir visité ou signé un contrat écrit.",
          "Se méfier de toute offre trop belle reçue par messagerie, y compris d’un « compatriote ».",
        ],
      },
    ],
    faq: [
      { question: "Dois-je déclarer mon arrivée ?", answer: "Cela dépend du pays et de votre titre. Certaines destinations exigent une déclaration ou une validation dans un délai court. Cette obligation figure en général sur la décision de visa : relisez-la le jour de l’arrivée." },
      { question: "3M TRAVEL AGENCY m’aide-t-elle après mon départ ?", answer: "Le suivi après l’arrivée dépend de l’accompagnement convenu par écrit. Dans tous les cas, nous pouvons vous orienter vers les sources officielles du pays. Écrivez-nous avec votre référence de dossier." },
      { question: "Que faire en cas de perte du passeport sur place ?", answer: "Faites une déclaration auprès des autorités locales, puis contactez l’ambassade ou le consulat de votre pays pour la marche à suivre. Conserver une copie numérique du passeport accélère ces démarches." },
    ],
    related: [
      { href: "/assurance", label: "Assurance voyage et santé" },
      { href: "/cni-passeport", label: "CNI et passeport" },
      { href: "/contact", label: "Écrire à l’agence" },
    ],
  },
  {
    slug: "glossaire-mobilite-internationale",
    title: "Glossaire de la mobilité internationale",
    seoTitle: "Glossaire de la mobilité internationale",
    description: "Les mots courants d’un dossier de visa, d’études ou de travail, expliqués simplement : apostille, e-Visa, lettre d’admission, CRS et plus.",
    lead: "Un dossier de mobilité emploie des mots qui prêtent à confusion. Voici les plus fréquents, définis simplement. Les conditions précises dépendent toujours du pays et de l’autorité concernée.",
    sections: [
      {
        id: "documents",
        title: "Documents et formalités",
        bullets: [
          "Apostille : cachet unique qui authentifie un document entre pays parties à la Convention de La Haye.",
          "Légalisation : chaîne de vérifications qui confirme l’authenticité d’une signature officielle.",
          "Traduction assermentée : traduction signée par un traducteur habilité par une juridiction.",
          "Copie certifiée conforme : copie attestée identique à l’original par une autorité habilitée.",
          "Extrait de casier judiciaire : document officiel qui atteste l’absence ou la présence de condamnations, parfois exigé pour un visa.",
          "Attestation de prise en charge : engagement d’une personne à couvrir les frais d’un séjour.",
        ],
      },
      {
        id: "visas",
        title: "Visas et autorisations",
        bullets: [
          "Visa : autorisation délivrée par un pays pour entrer sur son territoire pour un motif donné.",
          "e-Visa : visa demandé et délivré en ligne, dont l’éligibilité dépend de la nationalité et du motif.",
          "Autorisation de voyage électronique : autorisation préalable dispensant de visa pour certains voyageurs ; ce n’est pas un visa.",
          "Titre de séjour : document délivré sur place, qui autorise à rester au-delà de l’entrée.",
          "Permis d’études, permis de travail : autorisations spécifiques liées à un établissement ou à un employeur.",
          "Visa de transit : autorisation pour traverser un pays lors d’une correspondance ou d’un trajet.",
        ],
      },
      {
        id: "etudes-travail",
        title: "Études et travail",
        bullets: [
          "Lettre d’admission : document de l’établissement qui confirme l’acceptation du candidat.",
          "Offre d’emploi ferme : proposition de contrat précise, souvent exigée pour une demande d’autorisation de travail.",
          "Sponsor ou garant : personne ou organisation qui s’engage sur certains aspects de la demande.",
          "CRS : score du Système de classement global utilisé par le Canada pour classer les profils d’Entrée express. Il ne vaut pas invitation.",
          "Équivalence de diplôme : reconnaissance d’un diplôme étranger par une autorité du pays d’accueil.",
          "Test de langue : examen qui mesure le niveau dans une langue exigée par le dossier.",
        ],
      },
      {
        id: "procedure",
        title: "Procédure et décision",
        bullets: [
          "Biométrie : relevé d’empreintes et de photo, parfois exigé lors du dépôt.",
          "Lettre de motivation ou d’explication : texte qui présente le projet et répond aux points sensibles du dossier.",
          "Notification de décision : message officiel qui informe de l’acceptation, du refus ou d’une demande de pièces.",
          "Recours : démarche pour contester une décision, dans un délai et selon une forme fixés par l’autorité.",
        ],
      },
    ],
    faq: [
      { question: "Un e-Visa et une autorisation de voyage électronique, est-ce pareil ?", answer: "Non. Un e-Visa est un visa délivré en ligne. Une autorisation de voyage électronique est une autorisation préalable pour des voyageurs dispensés de visa. Les deux ne s’obtiennent pas de la même façon et ne donnent pas les mêmes droits." },
      { question: "Un bon score CRS assure-t-il une invitation ?", answer: "Non. Le score classe les profils ; c’est l’autorité qui décide des invitations lors de chaque ronde. Un score ne se promet pas." },
      { question: "Où trouver la définition officielle d’un terme ?", answer: "Sur la page de l’autorité qui délivre le document ou le visa concerné. Ce glossaire est une aide à la lecture, pas une source juridique." },
    ],
    related: [
      { href: "/faq", label: "Questions fréquentes" },
      { href: "/guides/legalisation-apostille-traduction", label: "Légalisation, apostille, traduction" },
      { href: "/canada/crs", label: "Simulateur CRS Canada" },
    ],
  },
];

export const GUIDE_SLUGS = GUIDES.map((guide) => guide.slug);

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}
