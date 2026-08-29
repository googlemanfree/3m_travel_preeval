export type JourneyStep = {
  id: string;
  label: string;
  description: string;
  requiredInputs: string[];
  sourceUrl: string;
};

export type CandidateJourney = {
  country: string;
  visaType: string;
  title: string;
  disclaimer: string;
  steps: JourneyStep[];
  officialSources: string[];
};

const CANADA = "https://www.canada.ca/fr/services/immigration-citoyennete.html";
const QUEBEC = "https://www.quebec.ca/immigration";
const LUXEMBOURG = "https://guichet.public.lu/fr/citoyens/immigration.html";
const FRANCE = "https://france-visas.gouv.fr/";
const BELGIUM = "https://dofi.ibz.be/";
const GERMANY = "https://www.make-it-in-germany.com/";
const UK = "https://www.gov.uk/browse/visas-immigration";
const USA = "https://travel.state.gov/content/travel/en/us-visas.html";

const step = (id: string, label: string, description: string, requiredInputs: string[], sourceUrl: string): JourneyStep => ({ id, label, description, requiredInputs, sourceUrl });
const common = (country: string, visaType: string, sourceUrl: string, steps: JourneyStep[]): CandidateJourney => ({ country, visaType, title: `${country} · ${visaType}`, disclaimer: "Les étapes sont un guide de préparation. L’autorité compétente, l’employeur ou l’établissement décide de l’issue de la demande ; aucune obtention n’est garantie par 3M Travel & Services.", steps, officialSources: [sourceUrl] });

export const CANDIDATE_JOURNEYS: CandidateJourney[] = [
  common("Canada", "Visiteur", CANADA, [
    step("evaluation", "Évaluation du projet", "Confirmer l’objet, les dates, les attaches et la cohérence du séjour.", ["Objet du voyage", "Dates prévues", "Historique des voyages"], CANADA),
    step("identity", "Identité et passeport", "Préparer un passeport valide et les informations personnelles exactes.", ["Passeport", "Adresse", "Situation familiale"], CANADA),
    step("funds", "Motif, hébergement et ressources", "Documenter le motif du séjour, l’hébergement et les moyens financiers disponibles.", ["Itinéraire", "Hébergement", "Relevés ou preuve de fonds"], CANADA),
    step("biometrics", "Biométrie et examen", "Suivre les instructions IRCC pour la biométrie et tout examen éventuellement demandé.", ["Convocation biométrique", "Certificat médical si demandé"], CANADA),
    step("decision", "Décision officielle", "Suivre la demande dans le portail officiel et répondre à toute demande de complément.", ["Numéro de demande", "Notifications officielles"], CANADA),
  ]),
  common("Canada", "Études", CANADA, [
    step("evaluation", "Évaluation du projet d’études", "Vérifier le programme, le niveau, le budget et la cohérence du projet.", ["Projet d’études", "Parcours académique", "Budget"], CANADA),
    step("admission", "Admission dans un établissement désigné", "Obtenir une lettre d’acceptation d’un établissement désigné.", ["Lettre d’acceptation", "Détails du programme"], CANADA),
    step("quebec", "CAQ si le Québec est choisi", "Vérifier si un Certificat d’acceptation du Québec est requis avant le permis fédéral.", ["CAQ si applicable", "Preuve de ressources"], QUEBEC),
    step("permit", "Permis d’études", "Préparer la demande IRCC, la biométrie et les justificatifs demandés.", ["Passeport", "Lettre d’acceptation", "Preuve de fonds"], CANADA),
    step("decision", "Décision et arrivée", "Respecter les instructions de décision et les conditions du permis délivré.", ["Lettre de décision", "Documents d’arrivée"], CANADA),
  ]),
  common("Canada", "Travailleur", CANADA, [
    step("evaluation", "Évaluation professionnelle", "Vérifier le métier, l’expérience, la langue et la cohérence du projet.", ["CV", "Diplômes", "Expérience"], CANADA),
    step("employer", "Employeur et offre d’emploi", "Documenter l’employeur, le poste, le lieu et les conditions de l’offre.", ["Offre d’emploi", "Contrat ou lettre employeur"], CANADA),
    step("authorization", "Autorisation de travail", "Identifier avec l’employeur le volet applicable : EIMT ou exemption, selon les règles officielles.", ["Référence EIMT ou exemption", "Détails du poste"], CANADA),
    step("permit", "Demande de permis de travail", "Préparer la demande IRCC, la biométrie et les examens éventuellement requis.", ["Passeport", "Formulaires", "Preuves d’expérience"], CANADA),
    step("decision", "Décision officielle", "Attendre la décision de l’autorité et respecter les conditions indiquées.", ["Numéro de demande", "Lettre de décision"], CANADA),
  ]),
  common("Canada", "Entrée Express / PNP", CANADA, [
    step("evaluation", "Évaluation du profil", "Vérifier l’âge, les études, l’expérience, les langues et les facteurs de sélection.", ["CV", "Diplômes", "Historique professionnel"], CANADA),
    step("language", "Langue et équivalence", "Obtenir les résultats d’un test reconnu et, si nécessaire, une évaluation des diplômes.", ["TEF/TCF ou IELTS/CELPIP", "EDE"], CANADA),
    step("profile", "Profil fédéral ou provincial", "Créer et maintenir le profil dans le système officiel approprié ; le Québec suit son propre parcours.", ["Profil en ligne", "Province ciblée"], CANADA),
    step("invitation", "Invitation et dossier complet", "Après invitation, fournir dans le délai officiel les pièces et déclarations demandées.", ["Invitation", "Certificats de police", "Preuves de fonds"], CANADA),
    step("decision", "Examen et décision", "L’autorité vérifie admissibilité, sécurité et médical avant sa décision.", ["Biométrie", "Examen médical", "Documents originaux"], CANADA),
  ]),
  common("Canada", "Québec · Arrima / sélection provinciale", QUEBEC, [
    step("evaluation", "Évaluation du profil Québec", "Vérifier la profession, la langue, les études et le projet d’établissement.", ["CV", "Diplômes", "Langues"], QUEBEC),
    step("arrima", "Profil Arrima", "Utiliser le portail officiel du Québec lorsque le programme sélectionné l’exige.", ["Profil Arrima", "Déclarations exactes"], QUEBEC),
    step("selection", "Sélection du Québec", "Répondre aux invitations et demandes de documents du Québec, le cas échéant.", ["Invitation", "Justificatifs"], QUEBEC),
    step("federal", "Demande fédérale", "Après le document provincial requis, préparer la demande auprès du gouvernement du Canada.", ["Certificat provincial", "Formulaires fédéraux"], CANADA),
    step("decision", "Décision officielle", "Suivre les instructions des deux autorités et respecter les conditions délivrées.", ["Numéro de dossier", "Lettre de décision"], CANADA),
  ]),
  common("Luxembourg", "Visiteur", LUXEMBOURG, [
    step("evaluation", "Évaluation du séjour", "Définir le motif, les dates, les attaches et les ressources.", ["Motif", "Dates", "Attaches"], LUXEMBOURG),
    step("documents", "Dossier Schengen", "Préparer formulaire, assurance, hébergement, transport et justificatifs financiers selon le poste compétent.", ["Formulaire", "Assurance", "Hébergement", "Ressources"], LUXEMBOURG),
    step("appointment", "Dépôt et biométrie", "Suivre les instructions du centre ou poste compétent pour le dépôt et la biométrie.", ["Rendez-vous", "Passeport"], LUXEMBOURG),
    step("decision", "Décision officielle", "Répondre aux demandes du poste et attendre la décision compétente.", ["Récépissé", "Notifications"], LUXEMBOURG),
  ]),
  common("Luxembourg", "Travailleur", LUXEMBOURG, [
    step("evaluation", "Évaluation professionnelle", "Vérifier diplôme, expérience et adéquation au métier visé.", ["CV", "Diplômes", "Expérience"], LUXEMBOURG),
    step("employer", "Employeur et contrat", "Le contrat et les démarches employeur doivent être confirmés avant la suite.", ["Contrat", "Identité employeur", "Poste"], LUXEMBOURG),
    step("adem", "Validation administrative", "Suivre l’autorisation ou la validation compétente avant l’arrivée, selon la procédure.", ["Autorisation", "Documents employeur"], LUXEMBOURG),
    step("residence", "Autorisation de séjour", "Préparer la demande selon les instructions officielles et les délais applicables.", ["Passeport", "Casier judiciaire", "Assurance"], LUXEMBOURG),
    step("decision", "Décision et installation", "Respecter les conditions et formalités suivant la décision officielle.", ["Décision", "Formalités d’arrivée"], LUXEMBOURG),
  ]),
  common("Luxembourg", "Études", LUXEMBOURG, [
    step("evaluation", "Évaluation du projet d’études", "Vérifier admission, budget, logement et cohérence académique.", ["Parcours", "Budget", "Projet"], LUXEMBOURG),
    step("admission", "Admission et inscription", "Obtenir l’admission et les justificatifs de l’établissement.", ["Admission", "Inscription"], LUXEMBOURG),
    step("residence", "Autorisation de séjour étudiant", "Déposer la demande selon les exigences officielles avant l’arrivée si applicable.", ["Passeport", "Ressources", "Logement"], LUXEMBOURG),
    step("arrival", "Arrivée et formalités", "Effectuer les démarches locales exigées après l’arrivée.", ["Adresse", "Assurance", "Formalités locales"], LUXEMBOURG),
  ]),
];

const normalize = (value: string | null | undefined) => (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const is = (value: string, ...terms: string[]) => terms.some((term) => value.includes(normalize(term)));

export function getCandidateJourney(destination?: string | null, visaType?: string | null, procedureLabel?: string | null): CandidateJourney {
  const country = normalize(destination);
  const visa = normalize([visaType, procedureLabel].filter(Boolean).join(" "));
  if (is(country, "canada")) {
    if (is(visa, "arrima", "quebec", "selection provinciale", "peq")) return CANDIDATE_JOURNEYS[4];
    if (is(visa, "etude", "etudes", "study")) return CANDIDATE_JOURNEYS[1];
    if (is(visa, "visiteur", "visitor", "tourisme")) return CANDIDATE_JOURNEYS[0];
    if (is(visa, "travail", "worker", "travailleur", "emploi", "permis de travail")) return CANDIDATE_JOURNEYS[2];
    return CANDIDATE_JOURNEYS[3];
  }
  if (is(country, "luxembourg")) {
    if (is(visa, "etude", "etudes", "study")) return CANDIDATE_JOURNEYS[6];
    if (is(visa, "visiteur", "visitor", "tourisme")) return CANDIDATE_JOURNEYS[5];
    return CANDIDATE_JOURNEYS[7];
  }
  const source = is(country, "france") ? FRANCE : is(country, "belgique", "belgium") ? BELGIUM : is(country, "allemagne", "germany") ? GERMANY : is(country, "royaume", "uk", "angleterre") ? UK : is(country, "etats-unis", "usa", "united states") ? USA : null;
  const displayCountry = destination?.trim() || "Destination à confirmer";
  const displayVisa = visaType?.trim() || procedureLabel?.trim() || "Procédure à qualifier";
  const officialSource = source || "";
  return { ...common(displayCountry, displayVisa, officialSource, [
    step("evaluation", "Évaluation du projet", "Clarifier le motif, le profil et la procédure choisie.", ["Identité", "Motif", "Parcours"], officialSource),
    step("documents", "Documents selon la procédure", "Réunir les documents affichés par le portail officiel de la destination.", ["Passeport", "Formulaires", "Justificatifs spécifiques"], officialSource),
    step("appointment", "Dépôt ou soumission officielle", "Suivre le portail et le poste compétent pour le rendez-vous, le dépôt et la biométrie.", ["Rendez-vous", "Biométrie si demandée"], officialSource),
    step("decision", "Décision de l’autorité", "Consulter uniquement les notifications du portail ou du poste compétent.", ["Référence de demande", "Notifications"], officialSource),
  ]), officialSources: officialSource ? [officialSource] : [] };
}

export function journeyStepIndex(journey: CandidateJourney, dossierStatus?: string | null, evaluationStatus?: string | null) {
  const status = normalize(dossierStatus);
  if (evaluationStatus !== "validated" && journey.steps[0]) return 0;
  if (is(status, "nouveau", "evaluation", "en evaluation")) return 0;
  if (is(status, "bilan", "paye", "paiement")) return Math.min(1, journey.steps.length - 1);
  if (is(status, "document", "documents")) return Math.min(2, journey.steps.length - 1);
  if (is(status, "soumis", "en cours", "recrutement", "adem")) return Math.min(3, journey.steps.length - 1);
  if (is(status, "approuve", "visa")) return journey.steps.length - 1;
  return Math.min(1, journey.steps.length - 1);
}
