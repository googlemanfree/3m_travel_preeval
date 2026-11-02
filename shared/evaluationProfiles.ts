import { getProgram } from "./dynamicForm/programs";

/**
 * Profils d'évaluation : le bilan suit le projet du candidat. Une demande d'études donne un bilan d'études (parcours académique, admission,
 * financement), une demande de travail un bilan de travail, un e-Visa un bilan e-Visa (passeport, pièces du portail, cohérence des dates)…
 *
 * Les huit clés de notation restent les mêmes pour tous les profils (stockage inchangé, aucune migration) ; ce qui change, c'est leur
 * libellé, leur barème (toujours 100 points au total), les voies recommandées, le vocabulaire et les consignes de l'analyse assistée.
 * Tout reste soumis à la validation de l'administrateur, qui peut modifier la note, les textes et même le profil du bilan.
 */
export const EVALUATION_PROFILES = ["travail", "etudes", "tourisme", "evisa", "immigration"] as const;
export type EvaluationProfile = (typeof EVALUATION_PROFILES)[number];

export const SCORE_KEYS = ["identity", "qualification", "languages", "experience", "employability", "finances", "documents", "coherence"] as const;
export type ScoreKey = (typeof SCORE_KEYS)[number];
export const ROUTE_KEY_LIST = ["A", "B", "C", "D", "E", "F"] as const;
export type RouteKeyName = (typeof ROUTE_KEY_LIST)[number];

type Criterion = { label: string; max: number; hint: string };

export type EvaluationProfileDef = {
  label: string;
  /** Titre du bilan remis au candidat une fois validé. */
  reportTitle: string;
  /** Une phrase qui cadre l'analyse pour l'administrateur et pour l'IA. */
  focus: string;
  criteria: Record<ScoreKey, Criterion>;
  routes: Record<RouteKeyName, string>;
  /** Libellés des listes « métiers » et « secteurs » du brouillon ; null = sans objet pour ce profil (champs masqués). */
  targets: { jobs: string | null; sectors: string | null };
  /** Consigne ajoutée à l'analyse assistée pour qu'elle raisonne dans le bon cadre. */
  aiFocus: string;
  /** Pièces à proposer quand rien d'autre n'est connu (modifiables par l'administrateur). */
  defaultDocuments: string[];
};

export const PROFILE_DEFS: Record<EvaluationProfile, EvaluationProfileDef> = {
  travail: {
    label: "Travail",
    reportTitle: "Bilan d’évaluation — projet de travail",
    focus: "Projet de travail à l’étranger : qualification, expérience, langue et employabilité dans le pays choisi.",
    criteria: {
      identity: { label: "Identité et conformité", max: 10, hint: "Identité cohérente, passeport, absence d’incohérence." },
      qualification: { label: "Formation et qualification", max: 15, hint: "Diplômes et reconnaissance éventuelle." },
      languages: { label: "Langues vérifiables", max: 15, hint: "Niveau et preuves (tests) dans la langue de travail." },
      experience: { label: "Expérience et compétences", max: 20, hint: "Expérience pertinente, durée et métier visé." },
      employability: { label: "Employabilité dans le pays choisi", max: 15, hint: "Demande du métier, offres, réseau, reconnaissance." },
      finances: { label: "Capacité financière", max: 10, hint: "Fonds pour l’installation et la recherche d’emploi." },
      documents: { label: "Dossier documentaire", max: 10, hint: "Pièces disponibles et à jour." },
      coherence: { label: "Cohérence du projet", max: 5, hint: "Parcours, métier et pays choisis vont ensemble." },
    },
    routes: {
      A: "Visa travail avec employeur",
      B: "Résidence permanente / immigration qualifiée",
      C: "Études ou formation internationale",
      D: "Reconnaissance professionnelle / équivalence",
      E: "Plan de préparation de 6 à 24 mois",
      F: "Réorientation vers un pays plus réaliste",
    },
    targets: { jobs: "Métiers visés", sectors: "Secteurs visés" },
    aiFocus: "Évalue un PROJET DE TRAVAIL : qualification, expérience, langue et employabilité dans le pays choisi.",
    defaultDocuments: ["Passeport valide", "CV à jour", "Diplômes et attestations", "Justificatifs d’expérience", "Résultats de tests de langue"],
  },
  etudes: {
    label: "Études",
    reportTitle: "Bilan d’évaluation — projet d’études",
    focus: "Projet d’études à l’étranger : parcours académique, admission, langue d’enseignement, financement et cohérence du cursus.",
    criteria: {
      identity: { label: "Identité et conformité", max: 10, hint: "Identité cohérente, passeport, absence d’incohérence." },
      qualification: { label: "Parcours académique et niveau visé", max: 20, hint: "Diplômes, relevés de notes, niveau demandé par la formation." },
      languages: { label: "Langue d’enseignement", max: 15, hint: "Niveau et preuves (tests) exigés par l’établissement." },
      experience: { label: "Expériences utiles au projet d’études", max: 5, hint: "Stages, activités ou expérience liés à la filière." },
      employability: { label: "Admission et adéquation du programme", max: 15, hint: "Lettre d’acceptation, choix de l’établissement, adéquation au profil." },
      finances: { label: "Financement des études et garant", max: 20, hint: "Frais, hébergement, preuves de fonds, bourse ou garant." },
      documents: { label: "Dossier documentaire", max: 10, hint: "Pièces académiques et administratives disponibles." },
      coherence: { label: "Cohérence du projet d’études", max: 5, hint: "Filière, niveau, pays et projet après diplôme vont ensemble." },
    },
    routes: {
      A: "Admission directe dans un établissement",
      B: "Études puis installation (permis après diplôme)",
      C: "Formation professionnelle ou apprentissage",
      D: "Reconnaissance des acquis et passerelles",
      E: "Plan de préparation de 6 à 24 mois (langue, financement, dossier académique)",
      F: "Réorientation vers un autre pays ou un programme plus accessible",
    },
    targets: { jobs: "Filières et programmes visés", sectors: "Domaines d’études" },
    aiFocus: "Évalue un PROJET D’ÉTUDES : parcours académique, admission, langue d’enseignement, financement et garant, cohérence du cursus. Ne raisonne pas en termes d’emploi ni d’employabilité : la rubrique « admission et adéquation du programme » remplace l’employabilité.",
    defaultDocuments: ["Passeport valide", "Diplômes et relevés de notes", "Lettre d’admission ou d’acceptation", "Preuve de financement ou de prise en charge", "Résultats de tests de langue"],
  },
  tourisme: {
    label: "Séjour (visiteur)",
    reportTitle: "Bilan d’évaluation — séjour temporaire",
    focus: "Séjour temporaire (tourisme, visite, affaires) : moyens du séjour, attaches dans le pays de résidence, cohérence du motif et de l’itinéraire.",
    criteria: {
      identity: { label: "Identité et conformité", max: 15, hint: "Identité cohérente, passeport valide." },
      qualification: { label: "Situation et statut du voyageur", max: 5, hint: "Emploi, études ou activité qui justifie le retour." },
      languages: { label: "Communication", max: 5, hint: "Capacité à remplir les formulaires et se faire comprendre." },
      experience: { label: "Historique de voyages", max: 10, hint: "Voyages passés, respect des durées, refus éventuels." },
      employability: { label: "Attaches avec le pays de résidence", max: 15, hint: "Famille, emploi, biens : raisons de revenir à la fin du séjour." },
      finances: { label: "Moyens financiers du séjour", max: 25, hint: "Budget, relevés, prise en charge par un invitant." },
      documents: { label: "Dossier documentaire", max: 15, hint: "Itinéraire, hébergement, assurance, invitation." },
      coherence: { label: "Cohérence du motif et de l’itinéraire", max: 10, hint: "Dates, durée, motif et budget vont ensemble." },
    },
    routes: {
      A: "Court séjour touristique",
      B: "Visite familiale ou amicale (avec invitation)",
      C: "Voyage d’affaires ou événement",
      D: "Transit ou escale",
      E: "Plan de préparation (attaches, ressources, itinéraire)",
      F: "Autre destination ou autre période plus adaptée",
    },
    targets: { jobs: null, sectors: null },
    aiFocus: "Évalue un SÉJOUR TEMPORAIRE : moyens du séjour, attaches dans le pays de résidence, historique de voyages, cohérence du motif, des dates et de l’itinéraire. Aucune notion d’emploi, de métier ni de secteur n’est pertinente ici.",
    defaultDocuments: ["Passeport valide", "Itinéraire et réservation d’hébergement", "Relevés bancaires récents", "Justificatifs d’attaches (emploi, famille)", "Assurance voyage"],
  },
  evisa: {
    label: "e-Visa",
    reportTitle: "Bilan d’évaluation — demande d’e-Visa",
    focus: "Demande d’e-Visa ou d’autorisation électronique : éligibilité selon la nationalité, passeport, pièces du portail officiel et cohérence des dates.",
    criteria: {
      identity: { label: "Passeport et identité", max: 25, hint: "Validité (souvent 6 mois après le retour), pages libres, nom identique partout." },
      qualification: { label: "Profil du demandeur", max: 5, hint: "Statut (employé, étudiant, indépendant) déclaré." },
      languages: { label: "Langue du portail et des formulaires", max: 5, hint: "Capacité à compléter la demande en ligne." },
      experience: { label: "Antécédents de voyage", max: 5, hint: "Voyages précédents, refus ou dépassements éventuels." },
      employability: { label: "Éligibilité à l’e-Visa", max: 10, hint: "Nationalité et motif admis par le portail officiel." },
      finances: { label: "Moyens du séjour", max: 10, hint: "Budget et justificatifs si le portail les demande." },
      documents: { label: "Pièces du portail officiel", max: 25, hint: "Photo, passeport numérisé, réservation, itinéraire, lettre d’invitation." },
      coherence: { label: "Cohérence des dates et du motif", max: 15, hint: "Dates d’entrée et de sortie, motif et durée du visa demandé." },
    },
    routes: {
      A: "e-Visa standard (une entrée)",
      B: "e-Visa à entrées multiples",
      C: "Autorisation électronique de voyage (ETA / eTA)",
      D: "Visa à l’arrivée",
      E: "Préparation des pièces avant le dépôt en ligne",
      F: "Visa classique via une ambassade ou un consulat",
    },
    targets: { jobs: null, sectors: null },
    aiFocus: "Évalue une DEMANDE D’E-VISA ou d’autorisation électronique : éligibilité selon la nationalité, validité du passeport, pièces demandées par le portail officiel, cohérence des dates. Le portail officiel décide : ne cite aucun frais ni délai officiel. Aucune notion d’emploi, de métier ni de secteur n’est pertinente ici.",
    defaultDocuments: ["Passeport valide (6 mois après le retour)", "Photo d’identité aux normes", "Itinéraire et dates de séjour", "Réservation d’hébergement ou invitation", "Moyen de paiement des frais officiels"],
  },
  immigration: {
    label: "Immigration (installation)",
    reportTitle: "Bilan d’évaluation — projet d’installation",
    focus: "Projet d’installation durable : langue, diplômes évalués, expérience, fonds d’installation et adéquation avec un programme.",
    criteria: {
      identity: { label: "Identité et conformité", max: 10, hint: "Identité cohérente, passeport, état civil." },
      qualification: { label: "Diplômes et reconnaissance", max: 20, hint: "Niveau d’études et évaluation des diplômes." },
      languages: { label: "Langues vérifiables", max: 20, hint: "Tests officiels et niveaux exigés par le programme." },
      experience: { label: "Expérience professionnelle", max: 20, hint: "Durée, pertinence, preuves." },
      employability: { label: "Adéquation avec le programme d’installation", max: 10, hint: "Besoins locaux, liens avec la région, sélection." },
      finances: { label: "Fonds d’installation", max: 10, hint: "Preuves de fonds pour le premier établissement." },
      documents: { label: "Dossier documentaire", max: 5, hint: "Pièces d’état civil, attestations, évaluations." },
      coherence: { label: "Cohérence du projet", max: 5, hint: "Programme visé, profil et calendrier vont ensemble." },
    },
    routes: {
      A: "Immigration par points / qualifiée",
      B: "Regroupement familial ou mariage",
      C: "Installation liée à un emploi",
      D: "Programme régional ou provincial",
      E: "Plan de préparation de 6 à 24 mois",
      F: "Réorientation vers un pays ou un programme plus réaliste",
    },
    targets: { jobs: "Métiers et profils visés", sectors: "Secteurs visés" },
    aiFocus: "Évalue un PROJET D’INSTALLATION DURABLE : langue (tests officiels), diplômes évalués, expérience, fonds d’installation et adéquation avec un programme. Ne présente aucun seuil de points comme officiel.",
    defaultDocuments: ["Passeport valide", "Diplômes et évaluation des diplômes", "Résultats de tests de langue", "Attestations d’expérience", "Preuves de fonds", "Pièces d’état civil"],
  },
};

const fold = (value: string | null | undefined) => (value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function fromText(value: string | null | undefined): EvaluationProfile | null {
  const text = fold(value);
  if (!text) return null;
  if (/e-?visa|evisa|autorisation electronique|\beta\b/.test(text)) return "evisa";
  if (/etud|student|scolar|universit|formation|apprentissage/.test(text)) return "etudes";
  if (/immigr|residence|permanent|regroupement|famil|installation/.test(text)) return "immigration";
  if (/touris|visit|sejour|voyage/.test(text)) return "tourisme";
  if (/travail|worker|work|emploi|salari/.test(text)) return "travail";
  return null;
}

/**
 * Profil du bilan : le programme choisi dans l'évaluation fait foi, puis le type de projet, puis le type de visa.
 * Sans indice, le bilan reste celui du travail (comportement historique).
 */
export function resolveEvaluationProfile(input: { projectType?: string | null; visaType?: string | null; programId?: string | null }): EvaluationProfile {
  const family = getProgram(input.programId)?.family;
  if (family) {
    if (family === "visit_eta" || family.startsWith("evisa_")) return "evisa";
    if (family.startsWith("study_")) return "etudes";
    if (family.startsWith("visit_")) return "tourisme";
    if (family.startsWith("imm_")) return "immigration";
    if (family.startsWith("work_")) return "travail";
  }
  return fromText(input.projectType) ?? fromText(input.visaType) ?? "travail";
}

export function isEvaluationProfile(value: unknown): value is EvaluationProfile {
  return typeof value === "string" && (EVALUATION_PROFILES as readonly string[]).includes(value);
}

export function criteriaFor(profile: EvaluationProfile): Array<{ key: ScoreKey; label: string; max: number; hint: string }> {
  return SCORE_KEYS.map((key) => ({ key, ...PROFILE_DEFS[profile].criteria[key] }));
}

export function maxForCriterion(profile: EvaluationProfile, key: ScoreKey): number {
  return PROFILE_DEFS[profile].criteria[key].max;
}

/** Plafond d'un critère toutes grilles confondues : borne de validation générique, la grille du profil affine ensuite. */
export const GLOBAL_CRITERION_MAX: Record<ScoreKey, number> = Object.fromEntries(
  SCORE_KEYS.map((key) => [key, Math.max(...EVALUATION_PROFILES.map((profile) => PROFILE_DEFS[profile].criteria[key].max))]),
) as Record<ScoreKey, number>;

export function routeLabelsFor(profile: EvaluationProfile): Record<RouteKeyName, string> {
  return PROFILE_DEFS[profile].routes;
}
