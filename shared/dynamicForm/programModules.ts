import { DURATION_BANDS, EXPERIENCE_BANDS, FUNDING_SOURCES, OFFER_STATUS, RECEIVED_STATUS, YES_NO, YES_NO_PENDING, YES_NO_UNSURE, area, day, opts, sel, txt, when } from "./fieldKit";
import type { ProgramFamily } from "./programs";
import type { DynamicField } from "./types";

/**
 * Questions propres à chaque visa ou programme. Une famille de programmes = un ensemble de questions : choisir « Formation
 * professionnelle » ne pose pas les mêmes questions que « Permis de travail lié à un employeur » ou « Visa étudiant ».
 */
export type ProgramModuleContext = {
  /** Langues du pays de destination (libellés), pour proposer la langue d'enseignement. */
  countryLanguageLabels: string[];
};

const STUDY_LEVELS = opts(["formation_courte", "Formation courte / professionnelle"], ["bts_dut", "BTS / DUT"], ["licence", "Licence / Bachelor"], ["master", "Master"], ["doctorat", "Doctorat"], ["autre", "Autre"]);
const TRIP_FUNDING = opts(["personnel", "Fonds personnels"], ["famille", "Soutien familial"], ["employeur", "Mon employeur"], ["invitant", "La personne ou l’organisation qui m’invite"], ["a_preciser", "À préciser"]);
const TRAVEL_HISTORY = opts(["aucun", "Pas encore voyagé hors de mon pays"], ["afrique", "Voyages en Afrique"], ["hors_afrique", "Voyages hors d’Afrique"], ["schengen_uk_us_ca", "Déjà séjourné en Europe, au Royaume-Uni, aux États-Unis ou au Canada"]);

// ───────────── Briques réutilisables ─────────────

const offerBlock = (required: boolean): DynamicField[] => [
  sel("offerStatus", "Offre ou contrat de travail", OFFER_STATUS, { required }),
  txt("offerDetail", "Employeur, poste et date de l’offre", { showIf: when("offerStatus", "signee", "en_discussion"), placeholder: "Nom de l’entreprise, intitulé du poste, date" }),
  sel("employerSteps", "L’employeur a-t-il déjà entamé des démarches pour vous (autorisation, parrainage) ?", YES_NO_UNSURE, { showIf: when("offerStatus", "signee") }),
];

const targetJobBlock: DynamicField[] = [
  txt("targetJob", "Métier ou poste recherché", { required: true, placeholder: "Ex. : aide-soignant, développeur, soudeur" }),
  sel("relevantExperience", "Expérience directement liée à ce métier", EXPERIENCE_BANDS.filter((band) => band.value !== "aucune"), { required: true }),
];

const settlementBlock: DynamicField[] = [
  sel("educationAssessment", "Évaluation ou reconnaissance de vos diplômes pour ce pays", opts(["oui", "Déjà obtenue"], ["non", "Non"], ["a_prevoir", "À prévoir"]), { required: true }),
  sel("languageProof", "Test de langue officiel disponible", opts(["oui", "Oui"], ["non", "Non"], ["prevu", "Prévu"]), { required: true }),
  sel("settlementFunds", "Préparation financière", opts(["disponible", "Fonds disponibles"], ["partielle", "Partiellement disponible"], ["a_preparer", "À préparer"]), { required: true }),
];

const trainingBlock: DynamicField[] = [
  sel("trainingKind", "Type de formation", opts(["apprentissage", "Apprentissage / alternance en entreprise"], ["ecole", "École professionnelle à temps plein"], ["stage", "Stage de formation"], ["reconversion", "Reconversion professionnelle"]), { required: true, help: "Dans plusieurs pays, la formation en alternance se fait auprès d’un employeur qui signe un contrat de formation : vérifiez-le sur la source officielle." }),
  txt("trainingTarget", "Métier ou formation visés", { required: true, placeholder: "Ex. : soins infirmiers, mécanique, cuisine…" }),
  sel("trainingContract", "Contrat ou promesse de formation d’un employeur ou d’une école", OFFER_STATUS, { required: true }),
  txt("trainingContractDetail", "Employeur ou établissement de formation", { showIf: when("trainingContract", "signee", "en_discussion") }),
  txt("trainingStart", "Rentrée ou date de début souhaitée", { placeholder: "Ex. : septembre 2027" }),
  sel("trainingDuration", "Durée de formation envisagée", opts(["moins_1_an", "Moins d’un an"], ["1_2_ans", "1 à 2 ans"], ["2_3_ans", "2 à 3 ans"], ["plus_3_ans", "Plus de 3 ans"], ["inconnu", "Je ne sais pas"])),
  sel("trainingFunding", "Rémunération ou financement de la formation", opts(["remuneree", "Formation rémunérée par l’employeur"], ["personnel", "Fonds personnels"], ["famille", "Soutien familial"], ["bourse", "Bourse"], ["a_clarifier", "À clarifier"])),
  sel("qualificationRecognition", "Reconnaissance de vos diplômes déjà obtenus", opts(["faite", "Déjà faite"], ["en_cours", "En cours"], ["a_faire", "À faire"], ["non_concerne", "Non concerné"])),
];

const visitBase = (options: { withStay: boolean; withAccommodation: boolean }): DynamicField[] => [
  sel("visitorStatus", "Votre statut", opts(["chef_entreprise", "Chef d’entreprise / indépendant"], ["employe", "Employé / salarié"], ["particulier", "Particulier"]), { required: true }),
  day("plannedDeparture", "Date de départ envisagée", { required: true }),
  ...(options.withStay ? [txt("stayLength", "Durée envisagée", { required: true, placeholder: "Ex. : 14 jours" })] : []),
  ...(options.withAccommodation ? [sel("accommodationPlan", "Hébergement prévu", opts(["hotel", "Hôtel"], ["invitation", "Invitation / hébergement chez un proche"], ["reservation", "Réservation en cours"], ["a_preciser", "À préciser"]), { required: true })] : []),
  sel("tripFunding", "Qui finance le voyage ?", TRIP_FUNDING),
  sel("travelHistory", "Vos voyages précédents", TRAVEL_HISTORY),
  area("returnTies", "Éléments de retour dans votre pays de résidence", { placeholder: "Emploi, activité, famille, biens…" }),
];

const evisaBase: DynamicField[] = [
  day("passportExpiry", "Date d’expiration du passeport", { required: true }),
  sel("passportType", "Type de passeport", opts(["ordinaire", "Ordinaire"], ["service", "Service / officiel"], ["diplomatique", "Diplomatique"])),
  day("plannedArrival", "Date d’arrivée prévue", { required: true }),
  txt("arrivalPoint", "Point d’arrivée envisagé", { placeholder: "Aéroport ou poste frontière" }),
  sel("entryCount", "Nombre d’entrées souhaité", opts(["simple", "Entrée simple"], ["multiple", "Entrées multiples"], ["a_confirmer", "À confirmer selon le portail"]), { required: true }),
  area("evisaDocuments", "Documents déjà disponibles", { required: true, placeholder: "Passeport, photo, réservation, billet, invitation…" }),
  sel("previousDestinationVisa", "Ancien visa ou refus pour cette destination", YES_NO_PENDING),
];

// ───────────── Modules par famille ─────────────

export function programFields(family: ProgramFamily, context: ProgramModuleContext): DynamicField[] {
  switch (family) {
    // Travail
    case "work_employer":
      return [...targetJobBlock, ...offerBlock(true), txt("availability", "Disponibilité pour le départ", { required: true, placeholder: "Ex. : sous 3 mois" }), area("professionalEvidence", "Justificatifs professionnels disponibles", { placeholder: "Contrats, attestations, références, certificats…" })];
    case "work_points":
      return [...targetJobBlock, ...settlementBlock, txt("regionTarget", "Région ou ville visée, si vous en avez une"), sel("offerStatus", "Offre ou contrat de travail (facultatif pour ce permis)", OFFER_STATUS)];
    case "work_highly_qualified":
      return [...targetJobBlock, ...offerBlock(true), txt("offeredSalary", "Rémunération annuelle brute proposée (montant et devise)", { showIf: when("offerStatus", "signee", "en_discussion") }), sel("educationAssessment", "Évaluation ou reconnaissance de votre diplôme pour ce pays", opts(["oui", "Déjà obtenue"], ["non", "Non"], ["a_prevoir", "À prévoir"]), { required: true })];
    case "work_jobseeker":
      return [
        txt("targetJob", "Métier ou poste recherché", { required: true }),
        sel("jobSearchFunds", "Ressources pour financer la recherche d’emploi sur place", opts(["suffisantes", "Suffisantes"], ["partielles", "Partielles"], ["a_preparer", "À préparer"]), { required: true }),
        sel("jobSearchDuration", "Durée de recherche envisagée", DURATION_BANDS),
        sel("employerContacts", "Avez-vous déjà des contacts avec des employeurs sur place ?", YES_NO),
        sel("educationAssessment", "Évaluation ou reconnaissance de vos diplômes pour ce pays", opts(["oui", "Déjà obtenue"], ["non", "Non"], ["a_prevoir", "À prévoir"]), { required: true }),
      ];
    case "work_transfer":
      return [
        txt("currentCompany", "Entreprise qui vous emploie actuellement", { required: true }),
        txt("hostEntity", "Entité d’accueil à l’étranger"),
        sel("seniority", "Ancienneté dans l’entreprise", opts(["moins_6_mois", "Moins de 6 mois"], ["6_12_mois", "6 à 12 mois"], ["1_3_ans", "1 à 3 ans"], ["plus_3_ans", "Plus de 3 ans"]), { required: true }),
        sel("roleLevel", "Votre niveau de responsabilité", opts(["direction", "Direction"], ["cadre", "Cadre / manager"], ["specialiste", "Spécialiste / expert"], ["autre", "Autre"]), { required: true }),
        sel("transferConfirmed", "Votre employeur a-t-il confirmé le transfert ?", YES_NO_PENDING),
      ];
    case "work_seasonal":
      return [
        txt("seasonalPeriod", "Période souhaitée", { required: true, placeholder: "Ex. : avril à octobre" }),
        sel("seasonalContract", "Contrat saisonnier", OFFER_STATUS),
        sel("previousSeasonal", "Avez-vous déjà travaillé en saison à l’étranger ?", YES_NO),
        txt("availability", "Disponibilité pour le départ"),
      ];
    case "work_training":
    case "study_vocational":
      return trainingBlock;
    case "work_holiday":
      return [
        sel("holidayAgreement", "Votre pays a-t-il un accord vacances-travail avec cette destination ?", YES_NO_UNSURE, { required: true }),
        sel("holidayDuration", "Durée du séjour envisagée", DURATION_BANDS),
        sel("holidayFunds", "Fonds pour le séjour", opts(["suffisants", "Suffisants"], ["partiels", "Partiels"], ["a_preparer", "À préparer"])),
        sel("holidayJobPlan", "Votre projet sur place", opts(["travail_sur_place", "Chercher du travail sur place"], ["employeur_contacte", "Déjà en contact avec un employeur"], ["voyage_principal", "Voyage avant tout, travail occasionnel"])),
      ];
    case "work_entrepreneur":
    case "imm_investor":
      return [
        txt("businessIdea", "Activité envisagée", { required: true }),
        sel("businessStage", "Avancement du projet", opts(["idee", "Idée"], ["plan_redige", "Plan d’affaires rédigé"], ["activite_existante", "Activité déjà existante"]), { required: true }),
        txt("businessCapital", "Capital ou investissement envisagé (montant et devise)"),
        sel("businessJobs", "Prévoyez-vous de créer des emplois ?", YES_NO_UNSURE),
        sel("businessLocalLink", "Avez-vous un partenaire ou un contact local ?", YES_NO),
      ];
    case "work_remote":
      return [
        txt("remoteEmployerCountry", "Pays de votre employeur ou de vos clients", { required: true }),
        sel("remoteContract", "Votre statut", opts(["salarie", "Salarié d’une entreprise"], ["independant", "Indépendant avec des clients"], ["entreprise_propre", "Dirigeant de ma propre entreprise"]), { required: true }),
        txt("remoteIncome", "Revenu mensuel approximatif (montant et devise)"),
        sel("remoteInsurance", "Assurance santé internationale", opts(["deja", "Déjà souscrite"], ["a_souscrire", "À souscrire"])),
        sel("remoteDuration", "Durée de séjour envisagée", DURATION_BANDS),
      ];
    case "work_aupair":
      return [
        sel("hostFamilyStatus", "Famille d’accueil", opts(["identifiee", "Déjà identifiée"], ["agence", "Via une agence"], ["non", "Pas encore"]), { required: true }),
        sel("childcareExperience", "Expérience avec les enfants", EXPERIENCE_BANDS, { required: true }),
        sel("aupairDrivingLicense", "Permis de conduire", YES_NO),
        sel("aupairDuration", "Durée souhaitée", DURATION_BANDS),
      ];

    // Études
    case "study_degree":
      return [
        sel("studyLevel", "Cycle d’études visé", STUDY_LEVELS, { required: true }),
        txt("programName", "Programme ou filière recherchée", { required: true, placeholder: "Ex. : informatique, santé, management" }),
        sel("admissionStatus", "Statut d’admission", opts(["aucune", "Aucune demande encore"], ["en_cours", "Demande en cours"], ["recue", "Admission reçue"]), { required: true }),
        txt("institutionName", "Établissement et date de la réponse", { showIf: when("admissionStatus", "en_cours", "recue") }),
        sel("programLanguage", "Langue d’enseignement du programme", opts(...languageChoices(context.countryLanguageLabels))),
        sel("languageProofStatus", "Preuve de niveau de langue", opts(["disponible", "Disponible"], ["a_passer", "À passer"], ["non_concerne", "Non concerné"])),
        sel("fundingPlan", "Plan de financement", FUNDING_SOURCES, { required: true }),
        txt("sponsorRelation", "Lien avec la personne qui finance (sans donnée bancaire)", { showIf: when("fundingPlan", "famille", "mixte") }),
        txt("lastGrade", "Moyenne ou mention du dernier diplôme"),
      ];
    case "study_language":
      return [
        sel("courseGoal", "Objectif de la formation en langue", opts(["etudes", "Préparer des études"], ["travail", "Préparer un travail"], ["personnel", "Intérêt personnel"], ["autre", "Autre"]), { required: true }),
        sel("courseDuration", "Durée envisagée", DURATION_BANDS, { required: true }),
        sel("schoolStatus", "Établissement", opts(["identifie", "Identifié"], ["inscription_en_cours", "Inscription en cours"], ["aucun", "Pas encore"])),
        sel("fundingPlan", "Plan de financement", FUNDING_SOURCES),
      ];
    case "study_exchange":
      return [
        txt("homeInstitution", "Votre établissement d’origine", { required: true }),
        txt("hostInstitution", "Établissement d’accueil"),
        sel("agreementStatus", "Convention entre les établissements", opts(["convention", "Convention existante"], ["a_confirmer", "À confirmer"], ["aucune", "Aucune"]), { required: true }),
        sel("exchangeDuration", "Durée de l’échange", opts(["semestre", "Un semestre"], ["annee", "Une année"], ["autre", "Autre"])),
        sel("creditRecognition", "Reconnaissance des crédits par votre établissement", YES_NO_UNSURE),
        sel("fundingPlan", "Plan de financement", FUNDING_SOURCES),
      ];
    case "study_research":
      return [
        txt("researchField", "Domaine de recherche", { required: true }),
        sel("hostLabStatus", "Laboratoire ou équipe d’accueil", opts(["contact_etabli", "Contact établi"], ["en_discussion", "En discussion"], ["aucun", "Aucun pour l’instant"]), { required: true }),
        sel("researchFunding", "Financement de la recherche ou du doctorat", opts(["obtenu", "Obtenu"], ["en_cours", "Demandé"], ["aucun", "Aucun pour l’instant"]), { required: true }),
        sel("publications", "Publications ou communications scientifiques", opts(["aucune", "Aucune"], ["1_2", "1 à 2"], ["3_plus", "3 ou plus"])),
      ];
    case "study_internship":
      return [
        sel("internshipHost", "Convention de stage", opts(["signee", "Signée"], ["en_cours", "En cours"], ["aucune", "Aucune"]), { required: true }),
        sel("internshipDuration", "Durée du stage", DURATION_BANDS),
        sel("internshipPaid", "Rémunération du stage", opts(["remunere", "Rémunéré"], ["non_remunere", "Non rémunéré"], ["inconnu", "Je ne sais pas"])),
        sel("schoolSupport", "Votre établissement soutient-il la démarche ?", YES_NO_UNSURE),
      ];
    case "study_short":
      return [
        txt("shortCourseNature", "Nature du programme", { required: true }),
        sel("shortCourseDuration", "Durée", DURATION_BANDS, { required: true }),
        sel("enrolmentProof", "Preuve d’inscription", RECEIVED_STATUS),
        sel("tripFunding", "Qui finance le séjour ?", TRIP_FUNDING),
      ];
    case "study_scholarship":
      return [
        txt("scholarshipName", "Bourse visée", { required: true }),
        sel("scholarshipStatus", "Avancement de la candidature", opts(["a_deposer", "À déposer"], ["deposee", "Déposée"], ["obtenue", "Obtenue"]), { required: true }),
        sel("studyLevel", "Cycle d’études visé", STUDY_LEVELS),
        txt("programName", "Programme ou filière recherchée"),
        sel("scholarshipReturn", "Savez-vous si la bourse comporte un engagement de retour ?", YES_NO_UNSURE),
      ];
    case "study_post":
      return [
        sel("degreeStatus", "Votre diplôme", opts(["en_cours", "Études en cours"], ["obtenu_recent", "Obtenu il y a moins de 6 mois"], ["obtenu_ancien", "Obtenu il y a plus de 6 mois"]), { required: true }),
        txt("degreeInstitution", "Établissement et pays du diplôme"),
        sel("postJobLink", "Offre d’emploi liée", OFFER_STATUS),
        sel("postStayGoal", "Votre projet après le diplôme", opts(["travailler", "Travailler pour un employeur"], ["chercher", "Chercher un emploi"], ["continuer", "Poursuivre des études"])),
      ];

    // Séjours temporaires
    case "visit_tourist":
      return [...visitBase({ withStay: true, withAccommodation: true }), sel("itineraryStatus", "Itinéraire", opts(["defini", "Défini"], ["a_definir", "À définir"]))];
    case "visit_family":
      return [
        ...visitBase({ withStay: true, withAccommodation: false }),
        sel("hostRelation", "Lien avec la personne que vous visitez", opts(["conjoint", "Conjoint(e)"], ["parent", "Parent"], ["enfant", "Enfant"], ["fratrie", "Frère ou sœur"], ["famille", "Autre membre de la famille"], ["ami", "Ami(e)"]), { required: true }),
        sel("hostStatus", "Statut de cette personne dans le pays", opts(["citoyen", "Citoyen(ne)"], ["residente", "Résident(e) permanent(e)"], ["temporaire", "Titre de séjour temporaire"], ["etudiant", "Étudiant(e)"], ["inconnu", "Je ne sais pas"]), { required: true }),
        sel("hostInvitation", "Invitation ou attestation d’accueil", opts(["obtenue", "Obtenue"], ["en_cours", "En cours"], ["non", "Pas encore"])),
      ];
    case "visit_business":
      return [
        ...visitBase({ withStay: true, withAccommodation: true }),
        txt("eventName", "Événement ou objet de la rencontre", { required: true }),
        txt("inviterCompany", "Entreprise ou organisation qui invite"),
        sel("invitationLetter", "Lettre d’invitation", RECEIVED_STATUS),
        sel("costsCovered", "Prise en charge des frais", opts(["moi", "Moi-même"], ["employeur", "Mon employeur"], ["invitant", "L’organisation invitante"], ["partage", "Partagée"])),
      ];
    case "visit_transit":
      return [
        day("plannedDeparture", "Date de départ envisagée", { required: true }),
        txt("finalDestination", "Destination finale", { required: true }),
        sel("layoverLength", "Durée de l’escale", opts(["moins_24h", "Moins de 24 heures"], ["plus_24h", "Plus de 24 heures"]), { required: true }),
        sel("onwardTicket", "Billet vers la destination finale", YES_NO_PENDING),
        sel("travelHistory", "Vos voyages précédents", TRAVEL_HISTORY),
      ];
    case "visit_medical":
      return [
        ...visitBase({ withStay: true, withAccommodation: false }),
        sel("medicalFacility", "Établissement de santé", opts(["identifie", "Identifié"], ["en_cours", "En cours de recherche"], ["aucun", "Pas encore"]), { required: true, help: "Ne donnez aucun détail médical dans ce formulaire : votre conseiller vous indiquera les pièces à fournir." }),
        sel("medicalCosts", "Prise en charge des frais", opts(["personnel", "Fonds personnels"], ["assurance", "Assurance"], ["famille", "Famille"], ["organisme", "Organisme ou employeur"]), { required: true }),
        sel("medicalCompanion", "Serez-vous accompagné(e) ?", YES_NO),
      ];
    case "visit_event":
      return [
        ...visitBase({ withStay: true, withAccommodation: true }),
        sel("eventNature", "Nature de l’événement", opts(["sport", "Sportif"], ["culture", "Culturel"], ["religion", "Religieux"], ["autre", "Autre"]), { required: true }),
        txt("eventName", "Nom de l’événement", { required: true }),
        sel("eventProof", "Invitation ou inscription", RECEIVED_STATUS),
      ];
    case "visit_multi":
      return [
        ...visitBase({ withStay: true, withAccommodation: false }),
        sel("previousTravelCount", "Voyages déjà effectués vers ce pays", opts(["aucun", "Aucun"], ["1_2", "1 à 2"], ["3_5", "3 à 5"], ["plus_5", "Plus de 5"]), { required: true }),
        txt("recurringReason", "Motif des voyages répétés", { required: true }),
      ];
    case "visit_eta":
      return [
        day("passportExpiry", "Date d’expiration du passeport", { required: true }),
        day("plannedArrival", "Date d’arrivée prévue", { required: true }),
        sel("eligibilityChecked", "Avez-vous vérifié que votre nationalité peut utiliser l’autorisation électronique ?", YES_NO_UNSURE),
        area("evisaDocuments", "Documents déjà disponibles", { placeholder: "Passeport, photo, réservation, billet…" }),
      ];

    // e-Visa
    case "evisa_business":
      return [...evisaBase, txt("businessPurpose", "Objet de la mission", { required: true }), sel("invitationLetter", "Lettre d’invitation", RECEIVED_STATUS)];
    case "evisa_transit":
      return [...evisaBase, sel("onwardTicket", "Billet de continuation", YES_NO_PENDING), sel("layoverLength", "Durée de l’escale", opts(["moins_24h", "Moins de 24 heures"], ["plus_24h", "Plus de 24 heures"]))];
    case "evisa_arrival":
      return [...evisaBase, sel("arrivalFeesReady", "Frais et pièces prêts pour le passage à la frontière", YES_NO_PENDING), sel("eligibilityChecked", "Avez-vous vérifié que votre nationalité est concernée ?", YES_NO_UNSURE)];
    case "evisa_eta":
      return [...evisaBase, sel("eligibilityChecked", "Avez-vous vérifié que votre nationalité peut utiliser l’autorisation électronique ?", YES_NO_UNSURE)];
    case "evisa_multi":
      return [...evisaBase, sel("entryFrequency", "Fréquence prévue des entrées", opts(["2_3", "2 à 3 par an"], ["4_plus", "4 ou plus par an"], ["a_definir", "À définir"]))];
    case "evisa_tourist":
      return evisaBase;

    // Installation
    case "imm_points":
      return [...settlementBlock, txt("regionTarget", "Région ou ville visée, si vous en avez une"), sel("offerStatus", "Offre d’emploi dans le pays", OFFER_STATUS), sel("familyInCountry", "Famille ou proche installé dans ce pays", YES_NO)];
    case "imm_family":
      return [
        sel("familyLinkType", "Votre lien avec la personne installée", opts(["conjoint", "Conjoint(e) / marié(e)"], ["partenaire", "Partenaire"], ["enfant", "Enfant"], ["parent", "Parent"], ["autre", "Autre"]), { required: true }),
        sel("sponsorStatus", "Statut de cette personne dans le pays", opts(["citoyen", "Citoyen(ne)"], ["residente", "Résident(e) permanent(e)"], ["temporaire", "Titre de séjour temporaire"], ["inconnu", "Je ne sais pas"]), { required: true }),
        sel("relationshipProof", "Preuves du lien (acte de mariage ou de naissance…)", opts(["disponibles", "Disponibles"], ["en_cours", "En cours d’obtention"], ["non", "Pas encore"]), { required: true }),
        sel("coResidence", "Avez-vous déjà vécu ensemble ?", opts(["ensemble", "Nous vivons ensemble"], ["separes_temporairement", "Séparés temporairement"], ["jamais", "Jamais vécu ensemble"])),
        txt("childrenConcerned", "Nombre d’enfants concernés par la demande"),
      ];
    case "imm_employer":
      return [...offerBlock(true), ...settlementBlock.filter((field) => field.key !== "settlementFunds")];
    case "imm_regional":
      return [
        txt("regionTarget", "Région ou province visée", { required: true }),
        txt("targetJob", "Métier recherché", { required: true }),
        sel("localLink", "Lien avec cette région", opts(["offre", "Offre d’emploi"], ["famille", "Famille sur place"], ["etudes", "Études passées"], ["aucun", "Aucun"])),
        sel("educationAssessment", "Évaluation ou reconnaissance de vos diplômes pour ce pays", opts(["oui", "Déjà obtenue"], ["non", "Non"], ["a_prevoir", "À prévoir"])),
        sel("languageProof", "Test de langue officiel disponible", opts(["oui", "Oui"], ["non", "Non"], ["prevu", "Prévu"])),
      ];
    case "imm_retirement":
      return [
        sel("pensionSource", "Source de vos revenus", opts(["pension", "Pension de retraite"], ["rente", "Rente"], ["loyers_placements", "Loyers ou placements"], ["autre", "Autre"]), { required: true }),
        txt("monthlyIncome", "Revenu mensuel approximatif (montant et devise)"),
        sel("healthInsurance", "Assurance santé", opts(["deja", "Déjà souscrite"], ["a_souscrire", "À souscrire"])),
        sel("housingPlan", "Logement envisagé", opts(["location", "Location"], ["achat", "Achat"], ["heberge", "Hébergé par un proche"])),
      ];

    // Formulaires généraux (« je ne sais pas encore ») : les questions historiques du type de projet.
    case "generic_travail":
      return [
        txt("targetJob", "Métier ou poste recherché", { required: true, placeholder: "Ex. aide-soignant, développeur, soudeur" }),
        sel("relevantExperience", "Expérience directement liée", opts(["0_1", "Moins d’un an"], ["1_3", "1 à 3 ans"], ["3_5", "3 à 5 ans"], ["5_plus", "Plus de 5 ans"]), { required: true }),
        sel("employmentLead", "Offre ou contact employeur", YES_NO_PENDING, { required: true }),
        txt("availability", "Disponibilité pour le départ", { required: true, placeholder: "Ex. sous 3 mois" }),
        area("professionalEvidence", "Justificatifs professionnels disponibles", { placeholder: "Contrats, attestations, références, certificats…" }),
      ];
    case "generic_etudes":
      return [
        sel("studyLevel", "Cycle d’études visé", STUDY_LEVELS, { required: true }),
        txt("programName", "Programme ou filière recherchée", { required: true, placeholder: "Ex. Informatique, Santé, Management" }),
        sel("admissionStatus", "Statut d’admission", opts(["aucune", "Aucune demande encore"], ["en_cours", "Demande en cours"], ["recue", "Admission reçue"]), { required: true }),
        sel("fundingPlan", "Plan de financement", FUNDING_SOURCES, { required: true }),
        area("academicRecords", "Diplômes et relevés disponibles", { required: true, placeholder: "Listez les diplômes et relevés de notes que vous pouvez fournir…" }),
      ];
    case "generic_tourisme":
      return [
        ...visitBase({ withStay: true, withAccommodation: true }),
        sel("stayPurpose", "Motif précis du séjour", opts(["tourisme", "Tourisme"], ["visite_famille", "Visite familiale"], ["affaires", "Affaires"], ["evenement", "Évènement"], ["autre", "Autre"]), { required: true }),
      ];
    case "generic_evisa":
      return evisaBase;
    case "generic_immigration":
      return [
        sel("immigrationGoal", "Objectif d’installation", opts(["residence_permanente", "Résidence permanente"], ["programme_provincial", "Programme provincial / régional"], ["mobilite_professionnelle", "Mobilité professionnelle"], ["regroupement", "Regroupement familial"]), { required: true }),
        ...settlementBlock,
        area("familyOrOffer", "Offre, famille ou lien local", { placeholder: "Le cas échéant, précisez les éléments disponibles." }),
      ];
  }
}

/** Options de langue d'enseignement : les langues du pays, l'anglais (programmes en anglais) et « autre ». */
function languageChoices(countryLanguageLabels: string[]): Array<[string, string]> {
  const capital = (label: string) => label.charAt(0).toUpperCase() + label.slice(1);
  const choices: Array<[string, string]> = countryLanguageLabels.map((label) => [label, capital(label)]);
  if (!countryLanguageLabels.includes("anglais")) choices.push(["anglais", "Anglais"]);
  choices.push(["autre", "Autre"]);
  return choices;
}
