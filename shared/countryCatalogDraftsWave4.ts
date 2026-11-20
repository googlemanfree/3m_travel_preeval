/**
 * Brouillons de la vague 4 : travail et études dans deux pays de l'espace Schengen dont les pages officielles ont pu être LUES EN ENTIER le
 * 2026-11-20 — Pays-Bas (études supérieures, travailleur hautement qualifié) et Autriche (carte Rouge-Blanc-Rouge, métiers en pénurie).
 * Chaque fait écrit ici est dans la page citée en source. Les montants (seuils de revenu, salaires exigés, frais) ne sont pas écrits : ils changent
 * chaque année et sont renvoyés au conseiller. Les listes de métiers en pénurie (règlement annuel) sont à vérifier pour l'année en cours.
 *
 * Les brouillons s'importent en « À confirmer » avec une source « à confirmer » : rien n'est publié par ce fichier. Voir docs/GUIDES_VAGUE_4.md.
 */
import type { DraftPathway } from "./countryCatalogDrafts";

const CONFIRM_AMOUNTS = "Les montants changent chaque année : votre conseiller confirme les valeurs à jour avant tout dépôt.";

export const COUNTRY_CATALOG_DRAFTS_WAVE_4: readonly DraftPathway[] = [
  // ─── Pays-Bas : études supérieures ────────────────────────────────────────────────────────────────────────────────────────────────────────
  {
    countryCode: "NL", pathway: "study",
    summary: "Pour étudier dans une université ou un établissement d'enseignement supérieur professionnel (HBO) aux Pays-Bas, seul l'établissement peut demander le titre de séjour étudiant : il doit être un sponsor reconnu par l'IND, le programme doit être accrédité et à temps plein. Pour la plupart des nationalités, le visa d'entrée MVV est demandé en même temps que le titre.",
    programs: [{
      officialName: "Student residence permit (university or higher professional education)", nameFr: "Titre de séjour étudiant (université ou enseignement supérieur professionnel)",
      feesNote: `Les frais de dossier et le seuil de ressources exigé sont fixés par l'IND. ${CONFIRM_AMOUNTS}`,
      steps: [
        { actor: "institution", title: "Être inscrit dans un programme accrédité, à temps plein", description: "Il faut une preuve d'inscription (ou une preuve d'inscription temporaire) dans une université ou un établissement HBO. Le programme doit être accrédité (NVAO aux Pays-Bas ou registre européen EQAR) et l'établissement doit être un sponsor reconnu par l'IND." },
        { actor: "institution", title: "L'établissement dépose la demande de titre de séjour (avec le MVV)", description: "Vous ne pouvez pas la déposer vous-même : seul l'établissement le fait, avec le formulaire « study – higher education ». Pour la plupart des nationalités, le titre de séjour et le visa MVV sont demandés en même temps." },
        { actor: "candidate", title: "Réunir les pièces et payer la demande", description: "La liste exacte des pièces et le paiement sont indiqués par l'établissement et par l'IND au moment de la demande.", fee: "Montant à confirmer par votre conseiller" },
        { actor: "authority", title: "Décision de l'IND", description: "L'IND décide. Un dossier complet ne garantit pas la délivrance du titre." },
        { actor: "candidate", title: "Prendre rendez-vous pour le visa MVV et voyager aux Pays-Bas", description: "Le MVV est un visa de type D collé dans le passeport, à votre nom, valable aussi dans les autres pays de l'espace Schengen. L'IND déconseille de séjourner aux Pays-Bas pendant la procédure." },
        { actor: "candidate", title: "Retirer le titre de séjour", description: "Si l'établissement a indiqué lors de la demande qu'un test de tuberculose est exigé, prenez rendez-vous auprès du service de santé (GGD) dans les 3 mois suivant la réception du titre." },
      ],
    }],
    sources: [
      { label: "IND : titre de séjour étudiant (université ou HBO)", url: "https://ind.nl/en/residence-permits/study/student-residence-permit-for-university-or-higher-professional-education", authority: "immigration" },
      { label: "IND : visa d'entrée MVV", url: "https://ind.nl/en/provisional-residence-permit-mvv", authority: "immigration" },
    ],
  },
  // ─── Pays-Bas : travailleur hautement qualifié ───────────────────────────────────────────────────────────────────────────────────────────
  {
    countryCode: "NL", pathway: "work",
    summary: "Pour travailler aux Pays-Bas comme travailleur hautement qualifié (kennismigrant), il faut un contrat de travail avec un employeur ou un institut de recherche reconnu comme sponsor par l'IND, un salaire conforme au marché et aux seuils de revenus. Seul l'employeur reconnu peut demander le titre de séjour.",
    programs: [{
      officialName: "Highly skilled migrant residence permit", nameFr: "Titre de séjour de travailleur hautement qualifié (kennismigrant)",
      steps: [
        { actor: "employer", title: "Vérifier que l'employeur est un sponsor reconnu", description: "L'employeur ou l'institut de recherche doit figurer au registre public des sponsors reconnus de l'IND ; lui seul peut déposer la demande." },
        { actor: "candidate", title: "Vérifier les conditions", description: "Contrat de travail aux Pays-Bas avec ce sponsor ; respect des seuils de revenus ; salaire en ligne avec le marché (ce que gagnent en moyenne les personnes du même emploi). Pour un métier de santé individuel inscrit à la loi BIG, une inscription au registre BIG est exigée.", fee: CONFIRM_AMOUNTS },
        { actor: "employer", title: "Rassembler les pièces et déposer la demande", description: "L'employeur dépose en ligne dans le portail entreprises de l'IND (il faut un DigiD avec vérification par SMS et un paiement bancaire en ligne iDEAL) ou par courrier avec le formulaire papier. Les membres de la famille ont leur propre formulaire, déposé par l'employeur." },
        { actor: "employer", title: "Payer la demande", description: "Le paiement fait partie de la procédure en ligne.", fee: "Montant à confirmer par votre conseiller" },
        { actor: "authority", title: "Décision de l'IND", description: "L'IND décide. Un dossier complet ne garantit pas la délivrance du titre. Si la décision positive le mentionne, vous pouvez commencer à travailler avant d'avoir reçu la carte." },
        { actor: "candidate", title: "Prendre rendez-vous pour le visa MVV et voyager aux Pays-Bas", description: "Le MVV est le visa d'entrée collé dans le passeport ; il permet de venir retirer le titre de séjour." },
        { actor: "candidate", title: "Fournir vos données biométriques et retirer le titre", description: "Prenez rendez-vous le plus tôt possible, et au plus tard dans les 2 semaines suivant la décision positive reçue par l'employeur. Si un test de tuberculose a été demandé, rendez-vous au service de santé (GGD) dans les 3 mois suivant l'obtention du titre. Le titre autorise le travail de travailleur hautement qualifié et le travail indépendant ; tout autre travail exige un permis de travail de l'employeur." },
      ],
    }],
    sources: [{ label: "IND : travailleur hautement qualifié", url: "https://ind.nl/en/residence-permits/work/highly-skilled-migrant", authority: "immigration" }],
  },
  // ─── Autriche : carte Rouge-Blanc-Rouge, métiers en pénurie ───────────────────────────────────────────────────────────────────────────────
  {
    countryCode: "AT", pathway: "work",
    summary: "La carte Rouge-Blanc-Rouge « travailleur qualifié dans un métier en pénurie » est valable 24 mois. Elle exige la preuve d'une formation achevée dans un métier en pénurie, une offre d'emploi autrichienne ferme au salaire minimal légal ou conventionnel, et au moins 55 points sur 90 à la grille officielle.",
    programs: [{
      officialName: "Red-White-Red Card: skilled worker in a shortage occupation", nameFr: "Carte Rouge-Blanc-Rouge : travailleur qualifié dans un métier en pénurie",
      routeType: "points", offerRequired: "yes",
      durationNote: "Carte valable 24 mois.",
      processingNote: "Les métiers en pénurie sont fixés chaque année par un règlement (Fachkräfteverordnung) : vérifiez la liste de l'année en cours.",
      steps: [
        { actor: "candidate", title: "Vérifier que votre métier est en pénurie et que votre formation suffit", description: "La liste nationale et les listes régionales sont publiées chaque année. Il faut au minimum une formation professionnelle comparable à un apprentissage de plusieurs années en Autriche ; pour certains métiers, des études supérieures. Une reconnaissance formelle n'est exigée que pour les professions réglementées (santé, enseignement public…) ; pour la plupart des métiers, vos documents suffisent." },
        { actor: "employer", title: "Obtenir une offre d'emploi autrichienne ferme", description: "L'employeur doit être prêt à vous payer au moins le salaire minimal fixé par la loi, un règlement ou une convention collective ; si un salaire supérieur est d'usage dans l'entreprise, il doit aussi vous être accordé. Il établit la déclaration de l'employeur (Arbeitgebererklärung) précisant votre futur lieu de travail." },
        { actor: "candidate", title: "Atteindre au moins 55 points sur 90", description: "Qualification : 30 points (formation professionnelle achevée dans le métier en pénurie). Expérience professionnelle correspondante : jusqu'à 20 points (1 point par semestre, 2 points par semestre en Autriche). Langues : jusqu'à 25 points (allemand A1 5, A2 10, B1 15 ; anglais A2 5, B1 10 ; français, espagnol ou bosnien/croate/serbe B1 5). Âge : moins de 30 ans 15, moins de 40 ans 10, moins de 50 ans 5. Cinq points de plus si l'anglais est la langue de travail dominante de l'entreprise." },
        { actor: "candidate", title: "Réunir les pièces", documents: ["Passeport en cours de validité", "Photo de 45 x 35 mm de moins de six mois", "Preuve d'une assurance maladie couvrant tous les risques", "Déclaration de l'employeur", "Diplôme ou certificat de formation professionnelle (ou preuve d'accès à l'université, ou diplôme d'études supérieures de trois ans)", "Certificats et attestations de travail", "Diplôme ou attestation de langue (allemand au moins A1, anglais au moins A2, de moins de cinq ans)", "Extrait de casier judiciaire récent si l'autorité l'exige (de préférence de moins de trois mois)"] },
        { actor: "candidate", title: "Déposer la demande", description: "Soit en personne auprès de la représentation autrichienne (ambassade ou consulat) de votre pays d'origine ou de résidence, soit par l'employeur auprès de l'autorité de séjour compétente en Autriche. Il faut remettre originaux et copies." },
        { actor: "authority", title: "Décision", description: "L'autorité examine les points, la formation et le salaire. Un dossier complet ne garantit pas la délivrance de la carte." },
      ],
    }],
    sources: [{ label: "Migration.gv.at : travailleurs qualifiés dans les métiers en pénurie", url: "https://www.migration.gv.at/en/types-of-immigration/permanent-immigration/skilled-workers-in-shortage-occupations/", authority: "immigration" }],
  },
];
