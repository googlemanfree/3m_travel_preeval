/**
 * Brouillons de la vague 6 : Suède, études supérieures et travail salarié — pages de l'Agence suédoise des migrations ouvertes, sections dépliées et
 * LUES EN ENTIER le 2026-11-23. Chaque fait écrit est dans l'une de ces pages. Les montants (frais de dossier, seuil de salaire en couronnes) ne sont
 * pas écrits : ils sont révisés chaque année (le seuil de salaire l'est chaque mois de juin) et renvoyés au conseiller. Les délais de décision sont des
 * statistiques publiées par l'Agence (75 % des dossiers récemment décidés) : ils sont donnés comme tels, sans promesse.
 *
 * Les brouillons s'importent en « À confirmer » avec une source « à confirmer » : rien n'est publié par ce fichier. Voir docs/GUIDES_VAGUE_6.md.
 */
import type { DraftPathway } from "./countryCatalogDrafts";

const CONFIRM_AMOUNTS = "Les montants changent : votre conseiller confirme les valeurs à jour avant tout dépôt.";

export const COUNTRY_CATALOG_DRAFTS_WAVE_6: readonly DraftPathway[] = [
  // ─── Suède : études supérieures ───────────────────────────────────────────────────────────────────────────────────────────────────────────
  {
    countryCode: "SE", pathway: "study",
    summary: "Pour étudier en Suède dans une université ou un établissement d'enseignement supérieur, un titre de séjour est exigé en règle générale des ressortissants de pays hors UE/EEE, et il doit être délivré avant le voyage. Il faut être définitivement admis à des études à temps plein sur place, avoir payé les droits de scolarité, avoir une assurance maladie complète si les études durent moins d'un an, et pouvoir subvenir à ses besoins.",
    programs: [{
      officialName: "Residence permit for studies in higher education", nameFr: "Titre de séjour pour études supérieures",
      durationNote: "Un ou deux ans selon l'établissement, sans dépasser la durée des études ni la validité du passeport ; si le titre couvre toute la durée des études, l'Agence ajoute deux semaines. Prolongeable.",
      feesNote: `Frais de dossier non remboursables en cas de refus, avec un tarif réduit pour les enfants de moins de 18 ans ; certains étudiants en sont dispensés (par exemple titulaires de certaines bourses). ${CONFIRM_AMOUNTS}`,
      processingNote: "L'Agence ne peut pas annoncer un délai exact. Elle publie une statistique : 75 % des dossiers décidés au cours des 12 derniers mois l'ont été dans un délai de 3 mois (cette valeur change). Un dossier incomplet allonge l'attente.",
      steps: [
        { actor: "institution", title: "Être définitivement admis à des études à temps plein", description: "Le cursus doit être suivi sur place : l'enseignement à distance ne donne pas droit au titre. À l'université, 30 crédits par semestre comptent comme un temps plein. Vous n'êtes considéré comme définitivement admis qu'une fois les droits de scolarité payés ; l'établissement prévient l'Agence du paiement." },
        { actor: "candidate", title: "Prévoir l'assurance maladie et les moyens de subsistance", description: "Si vos études durent moins d'un an, vous devez avoir (ou avoir demandé) une assurance maladie complète valable pendant tout le séjour : soins urgents et autres, hospitalisation, soins dentaires d'urgence et rapatriement médical. Vos moyens financiers doivent couvrir toute la période demandée, ainsi que celle de votre famille si elle vous accompagne sans moyens propres. Pour des études d'un an ou plus, vous vous inscrivez au registre de la population suédois." },
        { actor: "candidate", title: "Préparer les documents et choisir l'ambassade", description: "Tous les documents sont en suédois ou en anglais ; une traduction doit être certifiée, avec une copie du document dans sa langue d'origine. Vous pouvez devoir présenter votre passeport ou passer un entretien à l'ambassade ou au consulat : indiquez dans la demande celle que vous choisissez (toutes ne traitent pas les dossiers de migration ; certains entretiens se font par visioconférence).",
          documents: ["Copies du passeport conformes aux consignes de l'Agence (le titre ne peut pas dépasser la validité du passeport)", "Décision d'admission de l'établissement, indiquant une admission définitive à des études à temps plein sur place", "Justificatifs d'assurance maladie complète (études de moins d'un an, si vous n'êtes pas inscrit au registre de la population)", "Justificatif de moyens de subsistance : relevé bancaire émis au plus 4 mois avant la date de début du titre (titulaire, banque, date, solde, devise), OU attestation de bourse, OU lettre de garant, OU attestation d'emploi, OU attestation de bourse ou de prêt étudiant du pays d'origine", "Pour la famille : passeports, justificatifs de ressources, preuve du lien (acte de mariage ou preuve de vie commune) et d'assurance maladie"] },
        { actor: "candidate", title: "Déposer la demande et payer les frais", description: "Vous devez en règle générale être hors de Suède au moment de la demande, et le titre doit être délivré avant le voyage. Votre famille peut demander son titre en même temps.", fee: "Montant à confirmer par votre conseiller" },
        { actor: "authority", title: "Décision de l'Agence suédoise des migrations", description: "Un dossier complet ne garantit pas la délivrance du titre. En cas de refus, une personne déjà en Suède doit se préparer à quitter le pays." },
        { actor: "candidate", title: "Respecter les règles de travail et de suivi des études", description: "Pour un titre de licence ou de master accordé à partir du 11 juin 2026, le travail est limité à 15 heures par semaine en Suède. De nouvelles règles pour les membres de la famille accompagnant un étudiant s'appliquent à partir du 1er octobre 2026." },
      ],
    }],
    sources: [{ label: "Agence suédoise des migrations : titre de séjour pour études supérieures", url: "https://www.migrationsverket.se/en/you-want-to-apply/study/higher-education.html", authority: "immigration" }],
  },
  // ─── Suède : travail salarié ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  {
    countryCode: "SE", pathway: "work",
    summary: "Pour travailler en Suède, un permis de travail est exigé en règle générale des ressortissants de pays hors UE/EEE, que l'emploi soit en Suède ou à l'étranger, y compris par une agence d'intérim ou un transfert au sein d'un groupe. Il faut un contrat de travail signé par les deux parties, des conditions au moins équivalentes aux conventions collectives ou aux usages du métier, des assurances prises par l'employeur et un salaire d'au moins 90 % du salaire médian publié par Statistics Sweden (avec des exceptions).",
    programs: [{
      officialName: "Work permit for employees", nameFr: "Permis de travail pour salarié",
      routeType: "employer", offerRequired: "yes",
      durationNote: "Jusqu'à deux ans, sans dépasser la durée du contrat de travail ni la validité du passeport ; la famille obtient un titre pour la même période. Prolongeable.",
      feesNote: `Frais de dossier pour le salarié, tarifs distincts pour les membres de la famille adultes et les enfants, non remboursables en cas de refus. ${CONFIRM_AMOUNTS}`,
      processingNote: "L'Agence ne peut pas annoncer un délai exact ; elle publie des statistiques (75 % des dossiers décidés au cours des 12 derniers mois) : travailleurs hautement qualifiés, dossier complet, 1 mois, incomplet, 2 mois ; autres emplois, dossier complet, 4 mois, incomplet, 9 mois. Ces valeurs changent.",
      steps: [
        { actor: "candidate", title: "Vérifier que votre emploi remplit toutes les conditions", description: "Les conditions s'appliquent à un seul emploi : on ne peut pas combiner plusieurs emplois pour les atteindre. Certains métiers ne donnent plus droit à un permis de travail (depuis le 1er juin 2026 : cueilleur de baies en forêt, assistant personnel). Il faut un passeport valide et un contrat de travail signé par vous et votre employeur." },
        { actor: "employer", title: "Vérifier les conditions d'emploi et les assurances", description: "Votre salaire et vos conditions de travail doivent être au moins équivalents à ceux des conventions collectives suédoises ou des usages de votre métier ou secteur. À votre prise de poste, l'employeur doit avoir souscrit pour vous des assurances maladie, vie, accidents du travail et retraite professionnelle. Si l'emploi dure un an au plus, vous devez avoir (ou avoir demandé) une assurance maladie complète valable pendant tout le séjour." },
        { actor: "candidate", title: "Atteindre le seuil de salaire", description: "Il faut un salaire mensuel d'au moins 90 % du salaire médian publié chaque année en juin par Statistics Sweden, celui en vigueur à la date de votre demande ; il peut devoir être plus élevé pour respecter les conventions collectives ou les usages. Des métiers de la liste du gouvernement et de l'ordonnance sur les étrangers, ainsi que certains groupes (anciens étudiants et chercheurs, certains professionnels de santé en cours de reconnaissance, salariés de certaines jeunes entreprises technologiques ou de sciences de la vie), sont soumis à un seuil de 75 % du salaire médian. En cas de prolongation, vérifiez que votre métier figure toujours sur la liste.", fee: "Montant du salaire minimal à confirmer par votre conseiller" },
        { actor: "candidate", title: "Donner à l'employeur vos informations pour démarrer la demande", description: "Il lui faut votre nom, votre date de naissance, votre nationalité et une adresse électronique à laquelle vous aurez accès jusqu'à la décision : l'Agence l'utilisera pour vous contacter." },
        { actor: "candidate", title: "Préparer les documents et choisir l'ambassade", description: "Tous les documents sont en suédois ou en anglais ; une traduction doit être certifiée, avec une copie du document dans sa langue d'origine. Vous pouvez devoir présenter votre passeport ou passer un entretien à l'ambassade ou au consulat : indiquez celle que vous choisissez.",
          documents: ["Copies du passeport conformes aux consignes de l'Agence", "Contrat de travail signé par vous et par l'employeur", "Justificatifs d'assurance maladie complète (emploi d'un an au plus)", "Procuration, si une autre personne dépose la demande pour vous", "Pour la famille : passeports, preuve du lien et justificatifs demandés"] },
        { actor: "authority", title: "Décision de l'Agence suédoise des migrations", description: "Un dossier complet ne garantit pas la délivrance du permis. Si vous changez d'employeur ou de profession pendant le permis, une nouvelle demande est nécessaire." },
      ],
    }],
    sources: [{ label: "Agence suédoise des migrations : permis de travail pour salarié", url: "https://www.migrationsverket.se/en/you-want-to-apply/work/employee-or-self-employed/employees.html", authority: "immigration" }],
  },
];
