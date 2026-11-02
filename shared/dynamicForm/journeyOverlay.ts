import { getDomain } from "./domains";
import { getProgram, type ProgramDef, type ProgramFamily } from "./programs";

/**
 * Étapes du parcours selon le visa ou programme réellement choisi. Le parcours de base compte 13 étapes internes (mêmes
 * identifiants partout : espace client, administration, e-mails, relances). Ici, chaque famille de programme peut :
 *  - reformuler une étape (un e-Visa se prépare sur un portail, il n'attend pas de réponse d'employeur) ;
 *  - retirer une étape qui n'existe pas pour ce programme ;
 *  - ajouter les pièces propres au domaine choisi.
 * Les libellés restent des repères de procédure : jamais de promesse de résultat.
 */
export type StageText = { label?: string; description?: string; requiredInputs?: string[] };
type StageId = "cv_submission" | "cv_review" | "profile_treatment" | "evaluation_delivery" | "candidate_confirmation" | "opening_payment" | "supporting_documents" | "profile_processing" | "partner_submission" | "contract_wait" | "admin_processing" | "consular_submission" | "decision";
type Overlay = { texts?: Partial<Record<StageId, StageText>>; drop?: StageId[] };

/** Ordre des 13 étapes internes : l'index d'origine sert à convertir l'avancement d'un dossier en position dans le parcours adapté. */
export const CORE_STAGE_IDS: StageId[] = ["cv_submission", "cv_review", "profile_treatment", "evaluation_delivery", "candidate_confirmation", "opening_payment", "supporting_documents", "profile_processing", "partner_submission", "contract_wait", "admin_processing", "consular_submission", "decision"];

const EVISA: Overlay = {
  drop: ["profile_processing", "partner_submission", "contract_wait"],
  texts: {
    cv_submission: { label: "Passeport, dates et point d’entrée", description: "Vous indiquez la nationalité, la validité du passeport, les dates du séjour et le point d’entrée pour ouvrir le dossier.", requiredInputs: ["Passeport valide", "Dates du séjour", "Point d’entrée"] },
    cv_review: { label: "Vérification des informations", description: "Un conseiller vérifie que la demande correspond au type d’autorisation proposé par le portail officiel.", requiredInputs: ["Informations contrôlées"] },
    supporting_documents: { label: "Pièces à joindre à la demande en ligne", description: "Vous déposez uniquement les pièces que le portail officiel demande pour cette autorisation (passeport, photo, itinéraire, réservation…).", requiredInputs: ["Pièces du portail officiel"] },
    admin_processing: { label: "Préparation de la demande en ligne", description: "Les pièces reçues sont contrôlées et la demande est préparée telle qu’elle sera saisie sur le portail officiel.", requiredInputs: ["Pièces contrôlées"] },
    consular_submission: { label: "Dépôt sur le portail officiel", description: "La demande est déposée sur le portail officiel du pays ; le paiement des frais officiels se fait sur ce portail.", requiredInputs: ["Référence de la demande en ligne", "Reçu des frais officiels"] },
    decision: { label: "Réception de la décision", description: "L’e-Visa ou l’autorisation électronique est envoyé par l’autorité ; vérifiez qu’il correspond à votre passeport avant de voyager.", requiredInputs: ["E-Visa ou autorisation reçu"] },
  },
};

const OVERLAYS: Partial<Record<ProgramFamily, Overlay>> = {
  evisa_tourist: EVISA, evisa_business: EVISA, evisa_transit: EVISA, evisa_arrival: EVISA, evisa_eta: EVISA, evisa_multi: EVISA, generic_evisa: EVISA, visit_eta: EVISA,
  visit_transit: { drop: ["partner_submission", "contract_wait"], texts: { cv_submission: { label: "Itinéraire et escale", description: "Vous indiquez la destination finale, la durée de l’escale et le billet de suite.", requiredInputs: ["Destination finale", "Durée de l’escale", "Billet de suite"] } } },
  imm_retirement: { drop: ["partner_submission", "contract_wait"], texts: { cv_submission: { label: "Revenus, assurance et logement", description: "Vous documentez vos sources de revenus, votre assurance santé et votre logement prévu.", requiredInputs: ["Revenus", "Assurance santé", "Logement"] } } },
  work_holiday: { drop: ["partner_submission", "contract_wait"], texts: { cv_submission: { label: "Éligibilité à l’accord vacances-travail", description: "Vous vérifiez l’âge, la nationalité et les ressources exigés par l’accord entre les deux pays.", requiredInputs: ["Âge et nationalité", "Ressources", "Assurance"] } } },
  imm_family: { texts: {
    cv_submission: { label: "Preuve du lien familial", description: "Vous déposez les pièces qui établissent le lien avec la personne qui parraine et son statut dans le pays.", requiredInputs: ["Acte de mariage ou de naissance", "Statut de la personne qui parraine"] },
    cv_review: { label: "Contrôle du lien et du statut du parrain", description: "Un conseiller vérifie la cohérence des preuves du lien et des informations du parrain.", requiredInputs: ["Preuves contrôlées"] },
    partner_submission: { label: "Démarche de la personne qui parraine", description: "Dans la plupart des pays, la personne qui parraine doit elle-même déposer ou soutenir la demande auprès de l’autorité.", requiredInputs: ["Dossier du parrain"] },
    contract_wait: { label: "Instruction officielle du parrainage", description: "L’autorité instruit le parrainage ; aucun délai ni résultat n’est garanti.", requiredInputs: ["Accusé de réception officiel"] },
  } },
  work_points: { texts: {
    partner_submission: { label: "Création du profil en ligne", description: "Le profil est saisi sur le portail officiel du programme (points, classement ou déclaration d’intérêt), selon les règles du pays.", requiredInputs: ["Profil en ligne", "Résultats de langue", "Évaluation des diplômes"] },
    contract_wait: { label: "Attente d’une invitation ou d’un résultat", description: "Si le programme fonctionne par invitation, elle n’est ni garantie ni prévisible ; le dossier reste prêt en attendant.", requiredInputs: ["Invitation si le programme en prévoit une"] },
  } },
  imm_points: { texts: {
    partner_submission: { label: "Création du profil en ligne", description: "Le profil est saisi sur le portail officiel du programme (points, classement ou déclaration d’intérêt), selon les règles du pays.", requiredInputs: ["Profil en ligne", "Résultats de langue", "Évaluation des diplômes"] },
    contract_wait: { label: "Attente d’une invitation ou d’un résultat", description: "Si le programme fonctionne par invitation, elle n’est ni garantie ni prévisible ; le dossier reste prêt en attendant.", requiredInputs: ["Invitation si le programme en prévoit une"] },
  } },
  work_jobseeker: { texts: {
    partner_submission: { label: "Recherche d’emploi sur place", description: "Le permis autorise une période de recherche ; le profil est préparé pour les employeurs du pays.", requiredInputs: ["Profil prêt à être présenté"] },
    contract_wait: { label: "Attente d’une offre d’emploi", description: "Une offre n’est jamais garantie ; elle est enregistrée dès qu’elle existe.", requiredInputs: ["Offre ou contrat si disponible"] },
  } },
  work_entrepreneur: { texts: {
    partner_submission: { label: "Dépôt du projet d’activité", description: "Le projet (plan d’affaires, capital, emplois) est déposé auprès de l’autorité ou de l’organisme désigné.", requiredInputs: ["Plan d’affaires", "Preuve de capital"] },
    contract_wait: { label: "Évaluation du projet par l’autorité", description: "L’autorité évalue le projet ; aucune décision favorable n’est garantie.", requiredInputs: ["Accusé de réception"] },
  } },
  imm_investor: { texts: {
    partner_submission: { label: "Dépôt du projet d’investissement", description: "Le projet et l’origine des fonds sont déposés auprès de l’autorité ou de l’organisme désigné.", requiredInputs: ["Plan d’affaires", "Origine des fonds"] },
    contract_wait: { label: "Évaluation du projet par l’autorité", description: "L’autorité évalue le projet ; aucune décision favorable n’est garantie.", requiredInputs: ["Accusé de réception"] },
  } },
  work_aupair: { texts: {
    partner_submission: { label: "Mise en relation avec la famille d’accueil", description: "Le dossier est présenté à une famille d’accueil ; le contrat au pair est signé avant la demande de visa.", requiredInputs: ["Profil au pair", "Famille d’accueil"] },
    contract_wait: { label: "Attente de l’accord de la famille", description: "L’accord de la famille et la convention au pair ne sont jamais garantis.", requiredInputs: ["Convention au pair si disponible"] },
  } },
  work_training: { texts: {
    partner_submission: { label: "Recherche du contrat de formation", description: "Le dossier est présenté aux entreprises ou établissements de formation ; le contrat est exigé avant la demande de visa.", requiredInputs: ["Dossier de candidature"] },
    contract_wait: { label: "Attente de la confirmation de formation", description: "La confirmation écrite de l’entreprise ou de l’établissement n’est jamais garantie.", requiredInputs: ["Contrat ou confirmation de formation"] },
  } },
  study_vocational: { texts: {
    partner_submission: { label: "Recherche de la place de formation", description: "Le dossier est présenté aux établissements ou entreprises de formation du métier visé.", requiredInputs: ["Dossier de candidature"] },
    contract_wait: { label: "Attente de la confirmation de formation", description: "La confirmation écrite n’est jamais garantie ; elle est enregistrée dès qu’elle existe.", requiredInputs: ["Confirmation ou contrat de formation"] },
  } },
  study_scholarship: { texts: {
    partner_submission: { label: "Candidature à la bourse", description: "Le dossier de bourse est déposé auprès de l’organisme financeur dans ses délais.", requiredInputs: ["Dossier de bourse"] },
    contract_wait: { label: "Attente de la décision de l’organisme", description: "L’attribution d’une bourse n’est jamais garantie.", requiredInputs: ["Notification de l’organisme"] },
  } },
  study_language: { texts: { contract_wait: { label: "Attente de l’inscription confirmée", description: "L’inscription est confirmée par l’établissement ; elle est enregistrée dès réception.", requiredInputs: ["Inscription confirmée"] } } },
  study_short: { texts: { contract_wait: { label: "Attente de l’inscription confirmée", description: "L’inscription est confirmée par l’établissement ; elle est enregistrée dès réception.", requiredInputs: ["Inscription confirmée"] } } },
  study_exchange: { texts: { contract_wait: { label: "Attente de la convention d’échange", description: "La convention entre l’établissement d’origine et l’établissement d’accueil est enregistrée dès réception.", requiredInputs: ["Convention d’échange"] } } },
  work_remote: { drop: ["partner_submission"], texts: { contract_wait: { label: "Justificatifs du revenu à distance", description: "Le contrat ou les preuves de revenus d’un employeur ou de clients à l’étranger sont enregistrés dès réception.", requiredInputs: ["Contrat ou preuves de revenus"] } } },
};

const STAGE_COUNT = CORE_STAGE_IDS.length;

export type AdaptedStages<T extends { id: string; label: string; description: string; requiredInputs: string[] }> = {
  steps: T[];
  /** Index d'origine (0..12) de chaque étape conservée. */
  origins: number[];
  dropped: string[];
  program: ProgramDef;
};

/**
 * Adapte les 13 étapes internes au programme. `rebuild` reconstruit une étape avec ses nouveaux textes (les documents suivent les pièces demandées).
 * Sans programme reconnu (ou programme « d'orientation »), les étapes sont renvoyées telles quelles.
 */
export function adaptCoreStages<T extends { id: string; label: string; description: string; requiredInputs: string[] }>(
  coreSteps: T[],
  programId: string | null | undefined,
  domainId: string | null | undefined,
  rebuild: (step: T, texts: StageText) => T,
): AdaptedStages<T> | null {
  const program = getProgram(programId);
  if (!program || coreSteps.length !== STAGE_COUNT) return null;
  const overlay = OVERLAYS[program.family];
  const domain = getDomain(domainId);
  const dropped = new Set<string>(overlay?.drop ?? []);
  const kept: T[] = [];
  const origins: number[] = [];
  coreSteps.forEach((step, index) => {
    if (dropped.has(step.id)) return;
    let texts: StageText | undefined = overlay?.texts?.[step.id as StageId];
    if (step.id === "supporting_documents" && domain && domain.documents.length > 0) {
      const base = texts?.requiredInputs ?? step.requiredInputs;
      texts = { ...texts, requiredInputs: Array.from(new Set([...base, ...domain.documents])) };
    }
    kept.push(texts ? rebuild(step, texts) : step);
    origins.push(index);
  });
  return { steps: kept, origins, dropped: Array.from(dropped), program };
}

/** Position, dans le parcours adapté, d'une étape de l'ancien parcours : une étape retirée renvoie à la suivante qui existe encore. */
export function adaptedStepIndex(origins: number[] | undefined, originalIndex: number): number {
  if (!origins || origins.length === 0) return originalIndex;
  const found = origins.findIndex((origin) => origin >= originalIndex);
  return found === -1 ? origins.length - 1 : found;
}
