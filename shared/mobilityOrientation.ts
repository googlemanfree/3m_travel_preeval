/**
 * Orientation mobilité : à partir de cinq réponses, quelle famille de parcours correspond au projet, quels points demandent de l'attention
 * et quelles sont les premières étapes. Aucun pays ni aucun résultat de visa n'est annoncé : c'est une orientation générale, jamais une promesse.
 */
export const GOALS = ["work", "study", "visit", "family", "settle"] as const;
export type Goal = (typeof GOALS)[number];
export const GOAL_LABELS: Record<Goal, string> = {
  work: "Travailler à l'étranger",
  study: "Étudier à l'étranger",
  visit: "Voyager ou rendre visite (court séjour)",
  family: "Rejoindre un proche (regroupement familial)",
  settle: "M'installer durablement",
};

export const STATUSES = ["ready", "searching", "none"] as const;
export type Status = (typeof STATUSES)[number];
/** La question « où en êtes-vous ? » change de sens selon l'objectif. */
export const STATUS_LABELS: Record<Goal, Record<Status, string>> = {
  work: { ready: "J'ai une offre ou un contrat", searching: "Je cherche, j'ai des pistes", none: "Je n'ai encore rien" },
  study: { ready: "J'ai une admission ou une lettre d'acceptation", searching: "J'ai choisi des écoles, rien d'accepté", none: "Je n'ai pas encore choisi" },
  visit: { ready: "J'ai une invitation ou un programme précis", searching: "J'ai une idée de destination", none: "Je ne sais pas encore où" },
  family: { ready: "Mon proche réside légalement et connaît la démarche", searching: "Nous nous renseignons", none: "Nous n'avons encore rien préparé" },
  settle: { ready: "J'ai déjà un titre ou une voie identifiée", searching: "J'étudie plusieurs voies", none: "Je ne sais pas par où commencer" },
};

export const LANGUAGES = ["good", "basic", "none"] as const;
export type LanguageLevel = (typeof LANGUAGES)[number];
export const LANGUAGE_LABELS: Record<LanguageLevel, string> = {
  good: "Je maîtrise la langue du pays (ou j'ai un test récent)",
  basic: "Je me débrouille, sans diplôme de langue",
  none: "Je ne parle pas la langue du pays",
};

export const TIMELINES = ["soon", "months", "later"] as const;
export type Timeline = (typeof TIMELINES)[number];
export const TIMELINE_LABELS: Record<Timeline, string> = { soon: "Dans moins de 3 mois", months: "Dans 3 à 9 mois", later: "Plus tard ou flexible" };

export const FUNDS = ["ready", "partly", "none"] as const;
export type Funds = (typeof FUNDS)[number];
export const FUNDS_LABELS: Record<Funds, string> = { ready: "Mes fonds sont prêts et justifiables", partly: "J'en ai une partie", none: "Pas encore" };

/** Questions facultatives pour affiner l'orientation : l'outil fonctionne sans elles. */
export const AGES = ["young", "adult", "mature", "senior"] as const;
export type AgeBand = (typeof AGES)[number];
export const AGE_LABELS: Record<AgeBand, string> = { young: "18 à 24 ans", adult: "25 à 34 ans", mature: "35 à 44 ans", senior: "45 ans et plus" };
export const DIPLOMAS = ["secondary", "short", "long"] as const;
export type DiplomaLevel = (typeof DIPLOMAS)[number];
export const DIPLOMA_LABELS: Record<DiplomaLevel, string> = { secondary: "Secondaire ou formation courte", short: "Bac +2 ou +3", long: "Bac +4 et plus" };
export const FAMILIES = ["alone", "with"] as const;
export type FamilyMode = (typeof FAMILIES)[number];
export const FAMILY_LABELS: Record<FamilyMode, string> = { alone: "Je pars seul(e)", with: "Je pars avec un conjoint ou des enfants" };

export type Answers = { goal: Goal; status: Status; language: LanguageLevel; timeline: Timeline; funds: Funds; age?: AgeBand; diploma?: DiplomaLevel; family?: FamilyMode };
export type Orientation = {
  route: { title: string; summary: string };
  attention: string[];
  steps: string[];
  readiness: "ready" | "prepare" | "early";
};

const ROUTES: Record<Goal, Record<Status, { title: string; summary: string }>> = {
  work: {
    ready: { title: "Permis de travail lié à un employeur", summary: "Dans la plupart des pays, l'employeur lance d'abord l'autorisation de travail, puis vous déposez votre demande de visa avec son accord. Le détail dépend du pays et du poste." },
    searching: { title: "Recherche d'emploi accompagnée, puis permis lié à l'employeur", summary: "Une piste n'est pas une offre : tant qu'aucun contrat n'est signé, aucun permis lié à un employeur ne peut être demandé. L'enjeu est de transformer vos pistes en offres sérieuses." },
    none: { title: "Choisir une voie avec ou sans offre", summary: "Certains pays proposent une voie sans offre (carte de recherche d'emploi, système à points), d'autres exigent un contrat avant tout. Le choix du pays détermine donc la voie." },
  },
  study: {
    ready: { title: "Visa d'études", summary: "Avec une admission, la démarche porte sur le visa : preuve de fonds, logement, assurance et, selon le pays, une attestation de l'État ou de la région." },
    searching: { title: "Candidatures d'études, puis visa d'études", summary: "Une admission est nécessaire avant le visa. Postuler à plusieurs vœux réalistes, avec des dates limites respectées, augmente les chances d'en obtenir une." },
    none: { title: "Choix du pays et du programme, puis candidatures", summary: "Le niveau, la langue d'enseignement et le budget orientent le pays. Le visa ne vient qu'après l'admission." },
  },
  visit: {
    ready: { title: "Visa visiteur, autorisation électronique ou exemption", summary: "Selon votre nationalité et le pays, un visa, une autorisation de voyage électronique ou rien du tout est exigé. L'invitation ou le programme précis renforce le dossier sans garantir la décision." },
    searching: { title: "Court séjour : vérifier le document d'entrée exigé", summary: "La première question est ce que votre nationalité exige pour cette destination : visa, e-Visa, autorisation électronique ou exemption." },
    none: { title: "Court séjour : choisir une destination d'abord", summary: "Comparez les exigences d'entrée de quelques destinations avant de réserver quoi que ce soit." },
  },
  family: {
    ready: { title: "Demande de regroupement ou de visite familiale", summary: "Le proche qui réside dans le pays doit en général remplir des conditions (statut, logement, ressources) avant que vous puissiez déposer votre demande." },
    searching: { title: "Vérifier d'abord les conditions du proche résident", summary: "Les conditions pèsent surtout sur la personne qui réside déjà dans le pays. Mieux vaut les vérifier avant de monter le dossier." },
    none: { title: "Cartographier les liens de parenté acceptés", summary: "Tous les pays n'acceptent pas les mêmes liens (conjoint, enfants, parents). Il faut commencer par là." },
  },
  settle: {
    ready: { title: "Poursuivre la voie déjà identifiée", summary: "Une voie identifiée reste à vérifier : conditions, durée de séjour préalable et pièces. Un conseiller peut confirmer qu'elle mène bien à une installation durable." },
    searching: { title: "Comparer plusieurs voies d'installation", summary: "L'installation durable passe souvent par une première étape (travail, études ou famille) avant un titre long. Comparer ces chemins évite les impasses." },
    none: { title: "Commencer par une première voie d'entrée", summary: "On s'installe rarement d'un seul coup : on commence par une voie d'entrée (travail, études, famille) qui peut ensuite ouvrir un séjour durable selon le pays." },
  },
};

export function orient(answers: Answers): Orientation {
  const route = ROUTES[answers.goal][answers.status];
  const attention: string[] = [];
  if (answers.language === "none" && answers.goal !== "visit") attention.push("La langue du pays est un point clé : un niveau reconnu (test officiel) est souvent exigé, ou fortement valorisé. Prévoyez du temps pour l'atteindre.");
  if (answers.language === "basic" && (answers.goal === "work" || answers.goal === "study" || answers.goal === "settle")) attention.push("Sans diplôme de langue, certains dossiers sont refusés ou perdent des points. Un test reconnu peut changer le résultat.");
  if (answers.funds === "none" && answers.goal !== "family") attention.push("Presque tous les parcours demandent une preuve de fonds. Sans fonds justifiables, mieux vaut d'abord préparer ce point avant de déposer.");
  if (answers.funds === "partly") attention.push("Les fonds doivent souvent rester sur un compte pendant une durée précise et être justifiés : vérifiez le montant et la durée exigés.");
  if (answers.timeline === "soon" && answers.goal !== "visit") attention.push("Les délais d'examen varient selon le pays et la période, et ils ne sont jamais garantis. Dans moins de 3 mois, il faut démarrer immédiatement et rester prêt à décaler.");
  if (answers.status === "none" && answers.goal === "work") attention.push("Méfiez-vous des offres qui demandent de l'argent pour « garantir » un contrat ou un visa : un employeur sérieux ne facture pas le candidat.");

  if (answers.age && (answers.age === "mature" || answers.age === "senior") && (answers.goal === "work" || answers.goal === "settle")) attention.push("Dans les systèmes à points, l'âge fait partie du barème et les points baissent avec l'âge. Les voies liées à un employeur n'en dépendent pas : un contrat solide pèse alors davantage.");
  if (answers.age === "young" && answers.goal === "work") attention.push("À votre âge, certains pays proposent des programmes jeunes professionnels ou vacances-travail : à vérifier selon votre nationalité, car ils reposent souvent sur des accords entre pays.");
  if (answers.diploma && (answers.goal === "work" || answers.goal === "settle" || answers.goal === "study") && answers.diploma !== "secondary") attention.push("Un diplôme étranger doit souvent être reconnu ou évalué avant le dépôt. Cette étape prend du temps : lancez-la tôt.");
  if (answers.diploma === "secondary" && answers.goal === "work") attention.push("Avec un diplôme court, les métiers en pénurie, la formation technique et l'expérience pèsent davantage. Les listes de métiers du pays visé sont à regarder en premier.");
  if (answers.family === "with" && answers.goal !== "family") attention.push("Un conjoint ou des enfants changent les pièces demandées (actes de mariage et de naissance), les fonds exigés et parfois la voie : tous les permis n'autorisent pas la famille à vous suivre. Cela doit être vérifié avant de choisir le pays.");

  const steps = [
    "Faire l'évaluation de votre profil pour que votre conseiller connaisse votre situation.",
    answers.goal === "visit" ? "Vérifier ce que votre nationalité exige pour la destination (visa, e-Visa, autorisation ou exemption)." : "Choisir le pays en fonction de la voie, pas l'inverse.",
    "Préparer la liste des pièces correspondant au projet : passeport valide, diplômes, justificatifs financiers.",
    answers.goal === "work" && answers.status !== "ready" ? "Travailler les offres avec votre conseiller avant tout dépôt de visa." : answers.goal === "study" && answers.status !== "ready" ? "Candidater à plusieurs vœux avant les dates limites." : "Déposer le dossier complet auprès de l'autorité avec l'accompagnement de l'agence.",
  ];

  const score = (answers.status === "ready" ? 2 : answers.status === "searching" ? 1 : 0) + (answers.funds === "ready" ? 2 : answers.funds === "partly" ? 1 : 0) + (answers.language === "good" ? 2 : answers.language === "basic" ? 1 : 0);
  const readiness: Orientation["readiness"] = score >= 5 ? "ready" : score >= 3 ? "prepare" : "early";
  return { route, attention, steps, readiness };
}

export const READINESS_COPY: Record<Orientation["readiness"], string> = {
  ready: "Votre projet est bien avancé : l'étape suivante est de confirmer le pays et la voie avec un conseiller.",
  prepare: "Votre projet est en bonne voie, avec quelques points à préparer avant de déposer.",
  early: "Votre projet est à ses débuts : bien le cadrer maintenant évite des frais et des refus plus tard.",
};
