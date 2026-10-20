import type { ProjectKind } from "./types";

/**
 * Visas et programmes que le candidat peut choisir, par type de projet. Les libellés reprennent exactement ceux du catalogue des
 * programmes affiché sur les pages de procédure (un test le vérifie). Chaque programme appartient à une « famille » qui décide
 * des questions posées. Aucune disponibilité n'est affirmée pour un pays : elle se confirme sur la source officielle.
 */
export type ProgramFamily =
  | "work_employer" | "work_points" | "work_highly_qualified" | "work_jobseeker" | "work_transfer" | "work_seasonal"
  | "work_training" | "work_holiday" | "work_entrepreneur" | "work_remote" | "work_aupair"
  | "study_degree" | "study_language" | "study_exchange" | "study_vocational" | "study_research" | "study_internship"
  | "study_short" | "study_scholarship" | "study_post"
  | "visit_tourist" | "visit_family" | "visit_business" | "visit_transit" | "visit_medical" | "visit_event" | "visit_multi" | "visit_eta"
  | "evisa_tourist" | "evisa_business" | "evisa_transit" | "evisa_arrival" | "evisa_eta" | "evisa_multi"
  | "imm_points" | "imm_family" | "imm_employer" | "imm_regional" | "imm_investor" | "imm_retirement"
  | "generic_travail" | "generic_etudes" | "generic_tourisme" | "generic_evisa" | "generic_immigration";

export type ProgramDef = { id: string; kind: ProjectKind; family: ProgramFamily; label: string; who: string };

const p = (kind: ProjectKind, id: string, family: ProgramFamily, label: string, who: string): ProgramDef => ({ id: `${kind}-${id}`, kind, family, label, who });

const WORK: ProgramDef[] = [
  p("travail", "employeur", "work_employer", "Permis de travail lié à un employeur", "Vous avez une offre ou un contrat auprès d’une entreprise du pays."),
  p("travail", "points", "work_points", "Permis fondé sur les compétences ou un système de points", "Vous avez un profil qualifié et visez une installation durable, sans offre obligatoire."),
  p("travail", "qualifies", "work_highly_qualified", "Carte pour profils hautement qualifiés", "Vous avez un diplôme élevé et un poste qualifié bien rémunéré."),
  p("travail", "recherche-emploi", "work_jobseeker", "Permis de recherche d’emploi", "Vous venez chercher un emploi sur place pendant une période limitée."),
  p("travail", "transfert", "work_transfer", "Transfert intra-entreprise", "Votre employeur actuel vous affecte à une filiale à l’étranger."),
  p("travail", "saisonnier", "work_seasonal", "Emploi saisonnier ou agricole", "Vous travaillez quelques mois dans l’année, souvent dans l’agriculture, le tourisme ou la restauration."),
  p("travail", "formation-entreprise", "work_training", "Stage, alternance ou formation en entreprise", "Vous apprenez un métier en entreprise, en parallèle d’une formation."),
  p("travail", "vacances-travail", "work_holiday", "Programme vacances-travail", "Vous êtes jeune et votre pays a un accord avec le pays d’accueil."),
  p("travail", "entrepreneur", "work_entrepreneur", "Entrepreneur, travailleur indépendant ou investisseur", "Vous créez une activité ou investissez dans le pays."),
  p("travail", "teletravail", "work_remote", "Télétravail à distance (nomade numérique)", "Vous travaillez pour un employeur ou des clients situés hors du pays."),
  p("travail", "au-pair", "work_aupair", "Au pair", "Vous accueillez une famille en échange d’un hébergement et d’une activité encadrée."),
];

const STUDY: ProgramDef[] = [
  p("etudes", "cursus", "study_degree", "Visa étudiant long séjour (licence, master, doctorat)", "Vous êtes admis dans un établissement pour un cycle complet."),
  p("etudes", "langue", "study_language", "Formation en langue", "Vous apprenez la langue du pays avant ou à la place d’un cursus."),
  p("etudes", "echange", "study_exchange", "Programme d’échange ou de mobilité", "Votre établissement d’origine a un accord avec un établissement d’accueil."),
  p("etudes", "professionnelle", "study_vocational", "Formation professionnelle ou apprentissage", "Vous visez un métier plutôt qu’un diplôme universitaire."),
  p("etudes", "recherche", "study_research", "Recherche et doctorat financé", "Vous rejoignez un laboratoire ou un projet de recherche."),
  p("etudes", "stage", "study_internship", "Stage académique", "Vous faites un stage intégré à votre cursus."),
  p("etudes", "court", "study_short", "Cours de courte durée ou été", "Vous suivez un programme court, souvent sous un visa de court séjour."),
  p("etudes", "bourse", "study_scholarship", "Bourses d’études", "Vous financez vos études avec une bourse publique ou privée."),
  p("etudes", "apres-diplome", "study_post", "Permis après le diplôme", "Vous souhaitez rester travailler après vos études."),
];

const VISIT: ProgramDef[] = [
  p("tourisme", "tourisme", "visit_tourist", "Court séjour touristique", "Vous voyagez pour découvrir le pays."),
  p("tourisme", "famille", "visit_family", "Visite familiale ou amicale", "Vous rendez visite à un proche sur place."),
  p("tourisme", "affaires", "visit_business", "Voyage d’affaires, salon ou conférence", "Vous participez à une rencontre professionnelle."),
  p("tourisme", "transit", "visit_transit", "Transit ou escale", "Vous passez par le pays pour rejoindre une autre destination."),
  p("tourisme", "soins", "visit_medical", "Soins médicaux", "Vous venez vous faire soigner."),
  p("tourisme", "evenement", "visit_event", "Événement sportif, culturel ou religieux", "Vous participez à un événement précis."),
  p("tourisme", "entrees-multiples", "visit_multi", "Visa à entrées multiples", "Vous voyagez régulièrement dans le pays."),
  p("tourisme", "autorisation", "visit_eta", "Autorisation électronique de voyage", "Votre nationalité peut voyager avec une autorisation en ligne."),
];

const EVISA: ProgramDef[] = [
  p("evisa", "touristique", "evisa_tourist", "e-Visa touristique", "Vous voyagez pour le tourisme et le pays délivre un visa en ligne."),
  p("evisa", "affaires", "evisa_business", "e-Visa d’affaires", "Vous voyagez pour une réunion ou une mission professionnelle."),
  p("evisa", "transit", "evisa_transit", "e-Visa de transit", "Vous faites une escale dans le pays."),
  p("evisa", "arrivee", "evisa_arrival", "Visa à l’arrivée", "Le pays délivre le visa à l’aéroport ou à la frontière."),
  p("evisa", "eta", "evisa_eta", "Autorisation électronique de voyage (ETA)", "Une autorisation en ligne remplace un visa pour certaines nationalités."),
  p("evisa", "multiple", "evisa_multi", "e-Visa à entrées multiples", "Vous prévoyez plusieurs entrées dans la période de validité."),
];

const IMMIGRATION: ProgramDef[] = [
  p("immigration", "points", "imm_points", "Résidence fondée sur un système de points", "Vous visez une installation durable selon votre profil : études, langue, expérience."),
  p("immigration", "famille", "imm_family", "Regroupement familial et mariage", "Vous rejoignez un conjoint, un parent ou un enfant installé dans le pays."),
  p("immigration", "employeur", "imm_employer", "Résidence liée à un emploi ou à un employeur", "Vous avez une offre d’emploi qui ouvre la voie à une installation durable."),
  p("immigration", "regional", "imm_regional", "Programme régional ou provincial", "Une région ou une province recrute des profils précis."),
  p("immigration", "investisseur", "imm_investor", "Entrepreneur, investisseur ou travailleur indépendant", "Vous créez une activité ou investissez pour vous installer."),
  p("immigration", "retraite", "imm_retirement", "Retraite et revenus passifs", "Vous vivez de revenus réguliers sans travailler dans le pays."),
];

/** Choix « je ne sais pas encore » : le formulaire de base du type de projet, que le conseiller affinera. */
const ORIENTATION_LABEL = "Je ne sais pas encore — je souhaite être orienté";
const ORIENTATION_WHO = "Un conseiller vous aidera à choisir le visa ou le programme adapté après lecture de votre dossier.";
const orientation = (kind: ProjectKind): ProgramDef => ({ id: `${kind}-orientation`, kind, family: `generic_${kind}` as ProgramFamily, label: ORIENTATION_LABEL, who: ORIENTATION_WHO });

const PROGRAMS_BY_KIND: Record<ProjectKind, ProgramDef[]> = {
  travail: [...WORK, orientation("travail")],
  etudes: [...STUDY, orientation("etudes")],
  tourisme: [...VISIT, orientation("tourisme")],
  evisa: [...EVISA, orientation("evisa")],
  immigration: [...IMMIGRATION, orientation("immigration")],
};

export const ALL_PROGRAMS: ProgramDef[] = Object.values(PROGRAMS_BY_KIND).flat();

export const programsFor = (kind: ProjectKind): ProgramDef[] => PROGRAMS_BY_KIND[kind];
export const getProgram = (id: string | null | undefined): ProgramDef | null => ALL_PROGRAMS.find((program) => program.id === id) ?? null;
/** Programme à utiliser quand le candidat n'a rien choisi : la version générique du type de projet. */
export const orientationProgram = (kind: ProjectKind): ProgramDef => PROGRAMS_BY_KIND[kind][PROGRAMS_BY_KIND[kind].length - 1];
export const isOrientationProgram = (program: ProgramDef | null | undefined): boolean => !program || program.id.endsWith("-orientation");

export type SectionVariant = "full" | "light" | "hidden";
export type CvPolicy = "required" | "recommended" | "optional";

export type FamilyRules = {
  /** Études et diplômes. `training` ajoute les niveaux inférieurs au baccalauréat. */
  education: SectionVariant;
  experience: SectionVariant;
  languages: SectionVariant;
  /** Le domaine métier (santé, BTP, numérique…) change-t-il les questions ? */
  domain: boolean;
  cv: CvPolicy;
  /** Courte phrase qui explique au candidat ce que ce choix change dans le formulaire. */
  blurb: string;
};

const R = (education: SectionVariant, experience: SectionVariant, languages: SectionVariant, domain: boolean, cv: CvPolicy, blurb: string): FamilyRules => ({ education, experience, languages, domain, cv, blurb });

export const FAMILY_RULES: Record<ProgramFamily, FamilyRules> = {
  work_employer: R("full", "full", "full", true, "required", "Offre d’emploi, employeur et métier détaillés."),
  work_points: R("full", "full", "full", true, "required", "Profil qualifié : diplômes évalués, langue, expérience et ressources."),
  work_highly_qualified: R("full", "full", "full", true, "required", "Profil hautement qualifié : diplôme, poste proposé et rémunération."),
  work_jobseeker: R("full", "full", "full", true, "required", "Recherche d’emploi sur place : ressources, durée et reconnaissance du diplôme."),
  work_transfer: R("light", "full", "full", false, "required", "Transfert intra-entreprise : entreprise, ancienneté et rôle."),
  work_seasonal: R("light", "full", "full", true, "recommended", "Emploi saisonnier : secteur, période et expérience antérieure."),
  work_training: R("full", "light", "full", true, "recommended", "Formation en entreprise : contrat de formation, niveau d’entrée et langue de formation."),
  work_holiday: R("light", "light", "full", false, "recommended", "Vacances-travail : accord entre pays, durée et ressources."),
  work_entrepreneur: R("full", "full", "full", true, "recommended", "Activité à créer : projet, stade d’avancement, capital et emplois."),
  work_remote: R("light", "full", "light", true, "recommended", "Télétravail : employeur ou clients à l’étranger, revenu et assurance."),
  work_aupair: R("light", "light", "full", false, "optional", "Au pair : famille d’accueil, expérience avec les enfants et langue."),
  study_degree: R("full", "light", "full", true, "optional", "Études supérieures : programme, admission, langue d’enseignement et financement."),
  study_language: R("light", "hidden", "full", false, "optional", "Formation en langue : durée, objectif et établissement."),
  study_exchange: R("full", "hidden", "full", false, "optional", "Échange : établissement d’origine, convention et reconnaissance des crédits."),
  study_vocational: R("full", "light", "full", true, "recommended", "Formation professionnelle : métier visé, contrat éventuel et niveau de langue."),
  study_research: R("full", "light", "full", false, "optional", "Recherche : domaine, laboratoire d’accueil et financement."),
  study_internship: R("full", "light", "full", false, "optional", "Stage académique : convention, durée et rémunération."),
  study_short: R("light", "hidden", "light", false, "optional", "Programme court : nature, durée et preuve d’inscription."),
  study_scholarship: R("full", "light", "full", false, "optional", "Bourse : organisme, avancement de la candidature et engagements."),
  study_post: R("full", "full", "full", true, "recommended", "Après le diplôme : diplôme obtenu, délai et lien avec un emploi."),
  visit_tourist: R("hidden", "light", "hidden", false, "optional", "Court séjour : itinéraire, hébergement et attaches dans votre pays."),
  visit_family: R("hidden", "light", "hidden", false, "optional", "Visite familiale : lien avec la personne invitante et son statut."),
  visit_business: R("hidden", "light", "hidden", false, "optional", "Voyage d’affaires : événement, invitation et prise en charge des frais."),
  visit_transit: R("hidden", "light", "hidden", false, "optional", "Transit : destination finale, durée de l’escale et billet de suite."),
  visit_medical: R("hidden", "light", "hidden", false, "optional", "Soins : établissement, prise en charge des frais et accompagnant (aucun détail médical demandé)."),
  visit_event: R("hidden", "light", "hidden", false, "optional", "Événement : nature, justificatif d’invitation ou d’inscription."),
  visit_multi: R("hidden", "light", "hidden", false, "optional", "Entrées multiples : historique de voyages et motif récurrent."),
  visit_eta: R("hidden", "light", "hidden", false, "optional", "Autorisation électronique : validité du passeport et documents du portail officiel."),
  evisa_tourist: R("hidden", "hidden", "hidden", false, "optional", "e-Visa touristique : passeport, dates et documents du portail officiel."),
  evisa_business: R("hidden", "hidden", "hidden", false, "optional", "e-Visa d’affaires : passeport, invitation et dates."),
  evisa_transit: R("hidden", "hidden", "hidden", false, "optional", "e-Visa de transit : escale et billet de continuation."),
  evisa_arrival: R("hidden", "hidden", "hidden", false, "optional", "Visa à l’arrivée : nationalité concernée et pièces à présenter."),
  evisa_eta: R("hidden", "hidden", "hidden", false, "optional", "Autorisation électronique : passeport, dates et point d’arrivée."),
  evisa_multi: R("hidden", "hidden", "hidden", false, "optional", "e-Visa à entrées multiples : validité et nombre d’entrées."),
  imm_points: R("full", "full", "full", true, "recommended", "Installation par points : langue, diplômes évalués, expérience et fonds."),
  imm_family: R("light", "light", "full", false, "optional", "Regroupement familial : lien, statut de la personne qui parraine et preuves."),
  imm_employer: R("full", "full", "full", true, "recommended", "Installation liée à un emploi : offre, employeur et reconnaissance du diplôme."),
  imm_regional: R("full", "full", "full", true, "recommended", "Programme régional : région visée, métier recherché et liens locaux."),
  imm_investor: R("full", "full", "full", true, "recommended", "Entrepreneur ou investisseur : projet, capital et emplois créés."),
  imm_retirement: R("hidden", "hidden", "light", false, "optional", "Retraite : source de revenus, assurance santé et logement."),
  generic_travail: R("full", "full", "full", true, "required", "Formulaire général du projet travail."),
  generic_etudes: R("full", "light", "full", true, "optional", "Formulaire général du projet études."),
  generic_tourisme: R("hidden", "light", "hidden", false, "optional", "Formulaire général du séjour temporaire."),
  generic_evisa: R("hidden", "hidden", "hidden", false, "optional", "Formulaire général de l’e-Visa."),
  generic_immigration: R("full", "full", "full", true, "recommended", "Formulaire général de l’installation."),
};

export const rulesForProgram = (program: ProgramDef | null, kind: ProjectKind): FamilyRules =>
  FAMILY_RULES[(program?.family ?? `generic_${kind}`) as ProgramFamily];

/** Politique de CV du programme : lue aussi par le serveur pour ne pas exiger un CV là où le programme n'en demande pas. */
export const cvPolicyForProgram = (programId: string | null | undefined, kind: ProjectKind): CvPolicy => rulesForProgram(getProgram(programId), kind).cv;
