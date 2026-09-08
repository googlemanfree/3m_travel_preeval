export type JourneyDocument = {
  id: string;
  label: string;
  kind: "to_prepare" | "generated_by_agency";
  sourceUrl?: string;
};

export type JourneyStep = {
  id: string;
  label: string;
  description: string;
  requiredInputs: string[];
  documents: JourneyDocument[];
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
const CANADA_WORK = "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada.html";
const ADEM = "https://adem.public.lu/en/employeurs/recruter/recruter-international/Embauche-ressortissant-pays-tiers.html";
const QUEBEC = "https://www.quebec.ca/immigration";
const LUXEMBOURG = "https://guichet.public.lu/fr/citoyens/immigration.html";
const FRANCE = "https://france-visas.gouv.fr/";
const BELGIUM = "https://dofi.ibz.be/";
const GERMANY = "https://www.make-it-in-germany.com/";
const UK = "https://www.gov.uk/browse/visas-immigration";
const USA = "https://travel.state.gov/content/travel/en/us-visas.html";

const step = (id: string, label: string, description: string, requiredInputs: string[], sourceUrl: string): JourneyStep => ({ id, label, description, requiredInputs, documents: requiredInputs.map((input, index) => ({ id: `${id}-document-${index + 1}`, label: input, kind: "to_prepare", sourceUrl })), sourceUrl });

const coreStages = (sourceUrl: string): JourneyStep[] => [
  step("cv_submission", "Soumission du CV", "Le candidat dépose un CV exploitable et lisible pour ouvrir l’analyse du projet.", ["CV exploitable"], ""),
  step("cv_review", "Traitement du CV", "Un conseiller vérifie la lisibilité, la cohérence et les éléments utiles du CV.", ["CV contrôlé"], ""),
  step("profile_treatment", "Traitement du profil", "Le profil est rapproché du projet, du pays et du type de procédure choisi.", ["Profil candidat", "Projet et destination"], ""),
  step("evaluation_delivery", "Bilan d’évaluation", "Le bilan est préparé, relu et envoyé par l’administration dans l’espace candidat et par e-mail.", ["Bilan d’évaluation"], ""),
  step("candidate_confirmation", "Confirmation du bilan par le candidat", "Le candidat confirme qu’il a reçu et compris le bilan avant toute demande d’activation.", ["Confirmation du bilan"], ""),
  step("opening_payment", "Paiement des frais d’ouverture", "Après confirmation du bilan, les frais d’ouverture et de traitement sont demandés et validés par l’administration.", ["Preuve ou référence de paiement"], ""),
  step("supporting_documents", "Pièces justificatives de la procédure", "Le candidat dépose uniquement les documents listés pour le pays et la procédure sélectionnés.", ["Pièces justificatives listées"], sourceUrl),
  step("profile_processing", "Traitement du profil après pièces", "Le conseiller contrôle la complétude et prépare le profil selon les exigences documentées.", ["Profil complété", "Documents contrôlés"], ""),
  step("partner_submission", "Soumission aux partenaires ou agences", "Lorsque le mandat le prévoit, le profil est soumis aux partenaires autorisés avec traçabilité de l’action.", ["Dossier de soumission"], ""),
  step("contract_wait", "Attente d’une réponse employeur ou partenaire", "Une offre, une lettre de travail ou une décision partenaire n’est jamais garantie et doit être enregistrée lorsqu’elle existe.", ["Contrat ou lettre de travail si disponible"], ""),
  step("admin_processing", "Traitement administratif", "Les documents reçus sont contrôlés avant toute démarche auprès de l’autorité compétente.", ["Documents contractuels", "Pièces administratives"], ""),
  step("consular_submission", "Soumission consulaire", "La demande est préparée et soumise selon le portail et les instructions officielles de la destination.", ["Formulaires consulaires", "Rendez-vous ou preuve de soumission"], sourceUrl),
  step("decision", "Suivi de la décision", "Le candidat suit les notifications officielles et transmet toute demande complémentaire à l’administration.", ["Référence de demande", "Notification officielle"], sourceUrl),
];

const common = (country: string, visaType: string, sourceUrl: string, steps: JourneyStep[]): CandidateJourney => ({ country, visaType, title: `${country} · ${visaType}`, disclaimer: sourceUrl ? "Les étapes sont un guide de préparation fondé sur une source institutionnelle à vérifier avant dépôt. L’autorité compétente, l’employeur ou l’établissement décide de l’issue ; aucune obtention n’est garantie par 3M Travel & Services." : "Aucune source institutionnelle fiable n’est encore enregistrée pour cette destination et cette procédure. Vérifiez le portail officiel avant toute démarche ; 3M Travel & Services ne présente pas ces étapes comme une règle consulaire établie.", steps: [...coreStages(sourceUrl), ...steps], officialSources: sourceUrl ? [sourceUrl] : [] });

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
  common("Canada", "Travailleur", CANADA_WORK, [
    step("evaluation", "Évaluation professionnelle", "Vérifier le métier, l’expérience, la langue et la cohérence du projet.", ["CV", "Diplômes", "Expérience"], CANADA),
    step("employer", "Employeur et offre d’emploi", "Documenter l’employeur, le poste, le lieu et les conditions de l’offre.", ["Offre d’emploi", "Contrat ou lettre employeur"], CANADA),
    step("authorization", "Autorisation de travail", "Identifier avec l’employeur le volet applicable : EIMT ou exemption, selon les règles officielles.", ["Référence EIMT ou exemption", "Détails du poste"], CANADA),
    step("permit", "Demande de permis de travail", "Préparer la demande IRCC, la biométrie et les examens éventuellement requis.", ["Passeport", "Formulaires", "Preuves d’expérience"], CANADA),
    step("decision", "Décision officielle", "Attendre la décision de l’autorité et respecter les conditions indiquées.", ["Numéro de demande", "Lettre de décision"], CANADA),
  ]),
  common("Canada", "Entrée Express / PNP", CANADA, [
    step("evaluation", "Évaluation du profil", "Vérifier l’âge, les études, l’expérience, les langues et les facteurs de sélection.", ["CV", "Diplômes", "Historique professionnel"], CANADA),
    step("language", "Langue et équivalence", "Obtenir les résultats d’un test reconnu et, si nécessaire, une évaluation des diplômes.", ["TEF/TCF ou IELTS/CELPIP", "Évaluation des diplômes (EDE, par exemple WES)"], CANADA),
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
  common("Luxembourg", "Travailleur", ADEM, [
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

const regional = (country: string, visaType: string, sourceUrl: string, steps: JourneyStep[]): CandidateJourney => common(country, visaType, sourceUrl, steps);

const VERIFIED_EUROPEAN_JOURNEYS: CandidateJourney[] = [
  regional("Italie", "Visiteur", "https://consnewyork.esteri.it/en/servizi-consolari-e-visti/servizi-per-il-cittadino-straniero/visti/visas-to-enter-italy/", [
    step("visa_check", "Vérifier le besoin de visa", "Utiliser Visa for Italy selon la nationalité, la durée et le motif du séjour.", ["Nationalité", "Dates", "Motif"], "http://vistoperitalia.esteri.it/home/en"),
    step("documents", "Préparer les pièces", "Réunir les documents indiqués pour tourisme, visite ou autre motif auprès du poste compétent.", ["Passeport", "Réservation", "Hébergement ou invitation si requis"], "https://consnewyork.esteri.it/en/servizi-consolari-e-visti/servizi-per-il-cittadino-straniero/visti/visas-to-enter-italy/"),
    step("appointment", "Rendez-vous et dépôt", "Réserver auprès du canal officiel du poste compétent et déposer le dossier complet.", ["Rendez-vous", "Formulaire", "Pièces"], "https://conssanfrancisco.esteri.it/en/servizi-consolari-e-visti/servizi-per-il-cittadino-straniero/visti/instructions-for-visas/"),
    step("decision", "Suivi et retour", "Conserver la preuve de dépôt et suivre la demande selon les instructions officielles.", ["Référence", "Notifications"], "https://conssanfrancisco.esteri.it/en/servizi-consolari-e-visti/servizi-per-il-cittadino-straniero/visti/instructions-for-visas/"),
  ]),
  regional("Italie", "Études", "https://consnewyork.esteri.it/en/servizi-consolari-e-visti/servizi-per-il-cittadino-straniero/visti/visas-to-enter-italy/", [
    step("admission", "Admission ou inscription", "Obtenir la lettre d’inscription et vérifier la durée du programme avant de choisir le type de visa.", ["Inscription", "Établissement", "Durée"], "https://consnewyork.esteri.it/en/servizi-consolari-e-visti/servizi-per-il-cittadino-straniero/visti/visas-to-enter-italy/"),
    step("visa_check", "Vérifier le type de visa", "Utiliser Visa for Italy et les instructions du poste pour distinguer études jusqu’à 90 jours et séjour plus long.", ["Nationalité", "Programme", "Durée"], "http://vistoperitalia.esteri.it/home/en"),
    step("appointment", "Dépôt de la demande", "Prendre le rendez-vous officiel et présenter toutes les pièces exigées par le consulat.", ["Formulaire", "Passeport", "Admission", "Rendez-vous"], "https://conssanfrancisco.esteri.it/en/servizi-consolari-e-visti/servizi-per-il-cittadino-straniero/visti/instructions-for-visas/"),
    step("residence", "Formalités après arrivée", "Pour un séjour de plus de 90 jours, vérifier la demande de permis de séjour auprès de l’autorité compétente après l’arrivée.", ["Preuve d’entrée", "Adresse", "Permis de séjour"], "https://conssanfrancisco.esteri.it/en/servizi-consolari-e-visti/servizi-per-il-cittadino-straniero/visti/instructions-for-visas/"),
  ]),
  regional("Italie", "Travail", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-italy_en", [
    step("employer_authorisation", "Autorisation de travail", "L’employeur doit vérifier la procédure d’autorisation auprès du guichet compétent et le régime de quotas applicable.", ["Employeur", "Offre ou contrat", "Quota si applicable"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-italy_en"),
    step("visa", "Visa avant entrée", "Après l’autorisation requise, déposer la demande auprès du consulat ou de l’ambassade compétente.", ["Autorisation", "Passeport", "Formulaire"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-italy_en"),
    step("residence", "Permis de séjour", "Vérifier la demande de permis de séjour dans les huit jours suivant l’arrivée, selon l’autorité compétente.", ["Entrée", "Adresse", "Permis"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-italy_en"),
    step("employment", "Début d’activité", "Ne présenter le début du travail qu’après confirmation des autorisations et formalités applicables au contrat.", ["Contrat", "Autorisation", "Permis"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-italy_en"),
  ]),
  regional("Espagne", "Visiteur", "https://www.exteriores.gob.es/Embajadas/seul/en/ServiciosConsulares/Paginas/Consular/Visados-nacionales-Informacion-general.aspx", [
    step("visa_type", "Vérifier le type de séjour", "Déterminer si le séjour relève d’un court séjour Schengen ou d’un visa national selon la durée, la nationalité et le motif.", ["Nationalité", "Motif", "Dates"], "https://www.exteriores.gob.es/Embajadas/seul/en/ServiciosConsulares/Paginas/Consular/Visados-nacionales-Informacion-general.aspx"),
    step("documents", "Préparer les justificatifs", "Utiliser la catégorie officielle et la circonscription consulaire pour réunir les pièces exactes.", ["Formulaire", "Passeport", "Justificatifs"], "https://www.exteriores.gob.es/Embajadas/seul/en/ServiciosConsulares/Paginas/Consular/Visados-nacionales-Informacion-general.aspx"),
    step("appointment", "Rendez-vous et dépôt", "Prendre rendez-vous, déposer personnellement le dossier et fournir la biométrie si demandée.", ["Rendez-vous", "Dossier complet", "Preuve de dépôt"], "https://www.exteriores.gob.es/Embajadas/seul/en/ServiciosConsulares/Paginas/Consular/Visados-nacionales-Informacion-general.aspx"),
    step("decision", "Suivi de la décision", "Conserver la preuve de réception et suivre la demande dans le canal consulaire officiel.", ["Référence", "Notifications"], "https://www.exteriores.gob.es/Embajadas/seul/en/ServiciosConsulares/Paginas/Consular/Visados-nacionales-Informacion-general.aspx"),
  ]),
  regional("Espagne", "Études", "https://www.exteriores.gob.es/Consulados/losangeles/en/ServiciosConsulares/Paginas/Consular/Visado-de-estudios.aspx", [
    step("admission", "Admission ou programme autorisé", "Obtenir l’admission et vérifier la durée, le type de formation et les conditions propres au programme.", ["Admission", "Programme", "Durée"], "https://www.exteriores.gob.es/Consulados/losangeles/en/ServiciosConsulares/Paginas/Consular/Visado-de-estudios.aspx"),
    step("student_documents", "Pièces étudiantes", "Réunir les pièces listées par le consulat : ressources, assurance et documents complémentaires selon la durée.", ["Ressources", "Assurance", "Certificat médical si requis", "Casier si requis"], "https://www.exteriores.gob.es/Consulados/losangeles/en/ServiciosConsulares/Paginas/Consular/Visado-de-estudios.aspx"),
    step("application", "Demande et dépôt", "Déposer la demande dans la circonscription compétente, selon les modalités publiées par le poste.", ["Formulaire", "Passeport", "Rendez-vous"], "https://www.exteriores.gob.es/Consulados/losangeles/en/ServiciosConsulares/Paginas/Consular/Visado-de-estudios.aspx"),
    step("decision", "Décision et arrivée", "Suivre la décision, ne pas acheter les billets avant l’octroi et accomplir les formalités du titre délivré.", ["Preuve de dépôt", "Décision", "Adresse"], "https://www.exteriores.gob.es/Consulados/losangeles/en/ServiciosConsulares/Paginas/Consular/Visado-de-estudios.aspx"),
  ]),
  regional("Espagne", "Travail", "https://www.exteriores.gob.es/Consulados/miami/en/ServiciosConsulares/Paginas/Consular/Visado-de-trabajo-por-cuenta-ajena.aspx", [
    step("work_permit", "Permis initial et contrat", "Vérifier la décision favorable relative au permis initial de résidence et de travail et le contrat visé.", ["Permis initial", "Contrat", "Employeur"], "https://www.exteriores.gob.es/Consulados/miami/en/ServiciosConsulares/Paginas/Consular/Visado-de-trabajo-por-cuenta-ajena.aspx"),
    step("documents", "Pièces personnelles", "Préparer passeport, casier judiciaire, certificat médical et traductions/légalisations lorsque requises.", ["Passeport", "Casier judiciaire si requis", "Certificat médical", "Traductions"], "https://www.exteriores.gob.es/Consulados/miami/en/ServiciosConsulares/Paginas/Consular/Visado-de-trabajo-por-cuenta-ajena.aspx"),
    step("application", "Dépôt dans le délai consulaire", "Déposer la demande auprès du poste compétent dans le délai lié à la décision favorable.", ["Formulaire", "Rendez-vous", "Preuve de dépôt"], "https://www.exteriores.gob.es/Consulados/miami/en/ServiciosConsulares/Paginas/Consular/Visado-de-trabajo-por-cuenta-ajena.aspx"),
    step("arrival", "Formalités après arrivée", "Respecter les formalités de sécurité sociale et de titre de séjour indiquées pour le contrat et la décision.", ["Décision", "Adresse", "Titre ou carte"], "https://www.exteriores.gob.es/Consulados/miami/en/ServiciosConsulares/Paginas/Consular/Visado-de-trabajo-por-cuenta-ajena.aspx"),
  ]),
  regional("Allemagne", "Visiteur", "https://www.auswaertiges-amt.de/en/visa-service/215870-215870", [
    step("visa_type", "Vérifier le type de visa", "Déterminer si le séjour relève d’un court séjour Schengen ou d’un visa national selon la durée et le motif.", ["Nationalité", "Motif", "Durée"], "https://www.auswaertiges-amt.de/en/visa-service/215870-215870"),
    step("application", "Préparer la demande", "Utiliser les instructions du poste allemand compétent et réunir les justificatifs propres au motif.", ["Formulaire", "Passeport", "Justificatifs"], "https://www.germany.info/us-en/service/visa"),
    step("appointment", "Dépôt et biométrie", "Déposer la demande auprès de la représentation ou du prestataire indiqué.", ["Rendez-vous", "Biométrie si demandée", "Preuve de dépôt"], "https://www.auswaertiges-amt.de/en/visa-service/215870-215870"),
    step("decision", "Suivi de la décision", "Suivre uniquement les notifications de la représentation compétente.", ["Référence", "Notifications"], "https://www.auswaertiges-amt.de/en/visa-service/215870-215870"),
  ]),
  regional("Allemagne", "Études", "https://www.germany.info/us-en/service/visa", [
    step("admission", "Admission ou inscription", "Obtenir l’admission et vérifier le type de séjour correspondant à la formation.", ["Admission", "Inscription", "Parcours académique"], "https://www.germany.info/us-en/service/visa"),
    step("funds", "Ressources et assurance", "Préparer les justificatifs financiers, d’assurance et de logement exigés pour le séjour.", ["Ressources", "Assurance", "Logement"], "https://www.germany.info/us-en/service/visa"),
    step("national_visa", "Visa national étudiant", "Déposer la demande selon les instructions de la mission allemande compétente.", ["Formulaire", "Passeport", "Admission", "Rendez-vous"], "https://www.auswaertiges-amt.de/en/visa-service/215870-215870"),
    step("arrival", "Formalités après arrivée", "Respecter les formalités de séjour indiquées après la décision et l’entrée.", ["Adresse", "Titre", "Enregistrement"], "https://www.germany.info/us-en/service/visa"),
  ]),
  regional("Allemagne", "Travail", "https://www.germany.info/us-en/service/visa/employment-visa-922292", [
    step("employment", "Employeur et emploi", "Documenter l’employeur, le poste, la qualification et la durée de l’activité.", ["Contrat", "Employeur", "Diplômes", "Expérience"], "https://www.germany.info/us-en/service/visa/employment-visa-922292"),
    step("qualification", "Qualification et autorisation", "Vérifier si une reconnaissance ou une autorisation professionnelle est requise avant la demande.", ["Reconnaissance si requise", "Autorisation", "Contrat"], "https://www.germany.info/us-en/service/visa/employment-visa-922292"),
    step("national_visa", "Visa national de travail", "Déposer la demande auprès de la représentation allemande compétente avec les pièces indiquées.", ["Formulaire", "Passeport", "Contrat", "Rendez-vous"], "https://www.auswaertiges-amt.de/en/visa-service/215870-215870"),
    step("residence", "Séjour et installation", "Suivre les formalités de séjour et les conditions fixées par la décision.", ["Adresse", "Titre", "Assurance"], "https://www.germany.info/us-en/service/visa/employment-visa-922292"),
  ]),
  regional("France", "Visiteur", "https://france-visas.gouv.fr/en/", [
    step("visa_wizard", "Vérification France-Visas", "Utiliser le visa wizard pour vérifier le besoin de visa, le type de séjour et le poste compétent.", ["Situation", "Nationalité", "Motif et dates"], "https://france-visas.gouv.fr/en/"),
    step("online_application", "Demande en ligne", "Compléter la demande officielle et rassembler les justificatifs indiqués par le visa wizard.", ["Formulaire", "Justificatifs du séjour"], "https://france-visas.gouv.fr/en/"),
    step("appointment", "Rendez-vous et dépôt", "Prendre rendez-vous puis déposer le dossier complet avec les documents exigés.", ["Rendez-vous", "Passeport", "Récépissé/CERFA"], "https://us.diplomatie.gouv.fr/en/applying-for-a-visa"),
    step("tracking", "Suivi de la demande", "Suivre la demande dans le canal officiel et récupérer le passeport selon les instructions du poste.", ["Référence de demande", "Notifications"], "https://us.diplomatie.gouv.fr/en/applying-for-a-visa"),
  ]),
  regional("France", "Études", "https://france-visas.gouv.fr/en/etudiant", [
    step("admission", "Admission ou inscription", "Obtenir l’admission dans l’établissement et vérifier si la procédure Études en France s’applique à la nationalité.", ["Lettre d’admission", "Inscription", "Parcours académique"], "https://france-visas.gouv.fr/en/etudiant"),
    step("visa_wizard", "Visa étudiant adapté", "Utiliser le visa wizard pour distinguer le séjour court ou long et la liste exacte des pièces.", ["Type de formation", "Durée", "Ressources"], "https://france-visas.gouv.fr/en/etudiant"),
    step("application", "Demande et dépôt", "Compléter la demande, prendre rendez-vous et déposer le dossier auprès du poste ou centre compétent.", ["Formulaire", "Justificatifs", "Rendez-vous"], "https://france-visas.gouv.fr/en/"),
    step("arrival", "Suivi et formalités après arrivée", "Suivre la décision et accomplir les formalités de validation ou de séjour indiquées pour le visa délivré.", ["Décision", "Adresse", "Formalités d’arrivée"], "https://france-visas.gouv.fr/en/etudiant"),
  ]),
  regional("France", "Travail", "https://france-visas.gouv.fr/en/motif-professionnel", [
    step("category", "Qualification du motif professionnel", "Identifier la situation : salarié, détachement, mobilité intra-groupe, indépendant ou autre catégorie.", ["Contrat ou mission", "Employeur", "Durée"], "https://france-visas.gouv.fr/en/motif-professionnel"),
    step("authorization", "Autorisation applicable", "Vérifier les formalités préalables propres à l’activité et au séjour auprès du portail officiel.", ["Autorisation si requise", "Documents employeur"], "https://france-visas.gouv.fr/en/motif-professionnel"),
    step("application", "Demande et dépôt", "Compléter la demande officielle, prendre rendez-vous et déposer les pièces auprès du poste compétent.", ["Formulaire", "Passeport", "Justificatifs professionnels"], "https://us.diplomatie.gouv.fr/en/applying-for-a-visa"),
    step("tracking", "Suivi de la décision", "Suivre la demande officielle et respecter les conditions du titre délivré.", ["Référence", "Décision"], "https://france-visas.gouv.fr/en/"),
  ]),
  regional("Belgique", "Visiteur", "https://dofi.ibz.be/en/themes/third-country-nationals/short-stay", [
    step("purpose", "Motif et destination principale", "Vérifier que la Belgique est l’État de destination principale et préparer les justificatifs du séjour.", ["Motif", "Itinéraire", "Hébergement", "Moyens financiers"], "https://dofi.ibz.be/en/themes/third-country-nationals/short-stay"),
    step("short_stay", "Court séjour Schengen", "Respecter la limite de 90 jours sur toute période de 180 jours et les conditions d’entrée applicables.", ["Passeport", "Assurance médicale", "Justificatifs de retour"], "https://dofi.ibz.be/en/themes/third-country-nationals/short-stay"),
    step("submission", "Demande et dépôt", "Déposer la demande auprès du poste ou centre compétent selon la résidence et la destination principale.", ["Formulaire", "Rendez-vous", "Biométrie si demandée"], "https://dofi.ibz.be/en/themes/third-country-nationals/short-stay"),
    step("decision", "Suivi de la décision", "Suivre la décision officielle et respecter la durée autorisée.", ["Récépissé", "Notifications"], "https://dofi.ibz.be/en/themes/third-country-nationals/short-stay"),
  ]),
  regional("Belgique", "Études", "https://dofi.ibz.be/en/themes/third-country-nationals/study", [
    step("admission", "Admission dans un établissement reconnu", "Obtenir l’admission et vérifier la catégorie d’études et la durée du séjour.", ["Admission", "Inscription", "Établissement reconnu"], "https://dofi.ibz.be/en/themes/third-country-nationals/study"),
    step("residence", "Séjour de plus de 90 jours", "Préparer la demande de séjour et les pièces déterminées par la catégorie et l’autorité compétente.", ["Passeport", "Ressources", "Assurance", "Logement"], "https://dofi.ibz.be/en/themes/third-country-nationals/study"),
    step("visa", "Visa D si requis", "Suivre les instructions du poste diplomatique et les formalités avant l’entrée.", ["Formulaire", "Décision", "Rendez-vous ou dépôt"], "https://canada.diplomatie.belgium.be/en/visa/visa-belgium/long-stay-visa-d-visa"),
    step("arrival", "Formalités communales", "Effectuer les démarches locales requises après l’arrivée selon le titre délivré.", ["Adresse", "Titre ou annexe", "Enregistrement"], "https://dofi.ibz.be/en/themes/third-country-nationals/study"),
  ]),
  regional("Belgique", "Travail", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-belgium_en", [
    step("employer", "Employeur et poste", "L’employeur introduit la demande selon la région où il est établi.", ["Contrat", "Employeur", "Région compétente"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-belgium_en"),
    step("single_permit", "Permis unique", "La région et l’Office des étrangers examinent respectivement le travail et le séjour.", ["Formulaire", "Contrat", "Certificat médical", "Casier judiciaire"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-belgium_en"),
    step("visa_d", "Visa D après autorisation", "Après la décision de permis unique, demander le visa D auprès du poste compétent.", ["Annexe 46/47", "Passeport", "Biométrie"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-belgium_en"),
    step("municipality", "Enregistrement après arrivée", "S’enregistrer auprès de la commune et suivre la délivrance du titre.", ["Adresse", "Enregistrement communal", "Titre"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-belgium_en"),
  ]),
  regional("Suisse", "Visiteur", "https://www.schweiz-vereinigteskoenigreich.eda.admin.ch/en/visa-entry-to-and-residence-in-switzerland", [
    step("visa_type", "Type de séjour", "Distinguer le court séjour Schengen jusqu’à 90 jours du séjour national au-delà de 90 jours.", ["Motif", "Durée", "Nationalité"], "https://www.schweiz-vereinigteskoenigreich.eda.admin.ch/en/visa-entry-to-and-residence-in-switzerland"),
    step("schengen_application", "Demande Schengen", "Préparer et déposer la demande selon le poste ou centre compétent.", ["Formulaire", "Passeport", "Justificatifs"], "https://www.schweiz-vereinigteskoenigreich.eda.admin.ch/en/visa-entry-to-and-residence-in-switzerland"),
    step("decision", "Suivi officiel", "Suivre la décision et respecter les conditions d’entrée et de séjour.", ["Référence", "Notifications"], "https://www.schweiz-vereinigteskoenigreich.eda.admin.ch/en/visa-entry-to-and-residence-in-switzerland"),
  ]),
  regional("Suisse", "Études", "https://www.schweiz-vereinigteskoenigreich.eda.admin.ch/en/visa-entry-to-and-residence-in-switzerland", [
    step("national_visa", "Visa national si séjour supérieur à 90 jours", "Vérifier l’autorisation de l’autorité cantonale pour le lieu de résidence prévu.", ["Admission", "Durée", "Autorité cantonale"], "https://www.schweiz-vereinigteskoenigreich.eda.admin.ch/en/visa-entry-to-and-residence-in-switzerland"),
    step("application", "Demande et documents", "Préparer la demande avec l’établissement et la représentation compétente.", ["Admission", "Passeport", "Ressources", "Logement"], "https://www.sem.admin.ch/sem/en/home/overview-arbeit.html"),
    step("arrival", "Enregistrement local", "Suivre les formalités cantonales après l’entrée selon le titre délivré.", ["Adresse", "Titre", "Enregistrement"], "https://www.schweiz-vereinigteskoenigreich.eda.admin.ch/en/visa-entry-to-and-residence-in-switzerland"),
  ]),
  regional("Suisse", "Travail", "https://www.sem.admin.ch/sem/en/home/overview-arbeit.html", [
    step("employer", "Employeur et contrat", "L’employeur et l’autorité compétente doivent confirmer l’autorisation avant le départ.", ["Contrat", "Qualification", "Employeur"], "https://www.sem.admin.ch/sem/en/home/overview-arbeit.html"),
    step("cantonal_authorization", "Autorisation cantonale", "Pour un ressortissant de pays tiers, l’autorisation relève de l’autorité cantonale et les permis sont limités.", ["Demande employeur", "Qualification", "Autorisation"], "https://www.sem.admin.ch/sem/en/home/overview-arbeit.html"),
    step("visa", "Visa si requis", "Déposer le visa après délivrance des autorisations nécessaires, lorsque la nationalité l’exige.", ["Autorisation", "Passeport", "Formulaire"], "https://www.schweiz-vereinigteskoenigreich.eda.admin.ch/en/visa-entry-to-and-residence-in-switzerland"),
    step("registration", "Enregistrement avant emploi", "S’enregistrer auprès de la commune dans le délai applicable avant de commencer l’activité.", ["Adresse", "Permis", "Déclaration employeur"], "https://www.sem.admin.ch/sem/en/home/overview-arbeit.html"),
  ]),
  regional("Pays-Bas", "Visiteur", "https://www.netherlandsworldwide.nl/visa-the-netherlands", [
    step("visa_check", "Vérifier le besoin de visa", "Utiliser le portail officiel pour déterminer le type de visa et le lieu de demande.", ["Nationalité", "Motif", "Dates"], "https://www.netherlandsworldwide.nl/visa-the-netherlands"),
    step("application", "Demande de court séjour", "Préparer les justificatifs et déposer la demande selon le poste compétent.", ["Formulaire", "Passeport", "Hébergement", "Assurance"], "https://ind.nl/en/short-stay/short-stay-holiday-or-business-visa"),
    step("tracking", "Suivi de la demande", "Suivre le statut et récupérer le passeport selon les instructions officielles.", ["Référence", "Notifications"], "https://www.netherlandsworldwide.nl/visa-the-netherlands"),
  ]),
  regional("Pays-Bas", "Études", "https://ind.nl/en/residence-permits/study", [
    step("programme", "Programme d’études", "Vérifier le programme et les conditions de l’établissement avant la demande de séjour.", ["Admission", "Programme", "Passeport"], "https://ind.nl/en/residence-permits/study"),
    step("residence", "Titre de séjour étudiant", "Lire les exigences propres au programme et au titre de séjour applicable.", ["Admission", "Ressources", "Assurance", "Logement"], "https://ind.nl/en/residence-permits/study"),
    step("decision", "Décision et installation", "Suivre la décision IND et respecter les formalités d’arrivée et de séjour.", ["Décision", "Adresse", "Titre"], "https://ind.nl/en/residence-permits/study"),
  ]),
  regional("Pays-Bas", "Travail", "https://www.government.nl/faq/checklist-coming-to-the-nederlands-for-work", [
    step("permit_check", "Vérifier visa, séjour et permis de travail", "Le questionnaire gouvernemental détermine les autorisations à vérifier selon le profil et l’emploi.", ["Contrat", "Employeur", "Nationalité", "Durée"], "https://www.government.nl/faq/checklist-coming-to-the-nederlands-for-work"),
    step("employer_route", "Parcours employeur", "Rassembler les pièces et suivre la voie de permis indiquée par l’autorité compétente.", ["Contrat", "Employeur", "Formulaires"], "https://www.government.nl/faq/checklist-coming-to-the-nederlands-for-work"),
    step("decision", "Décision et arrivée", "Suivre la décision, le visa éventuel et les formalités de séjour.", ["Décision", "Passeport", "Adresse"], "https://www.netherlandsworldwide.nl/visa-the-netherlands"),
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
  const countryKey = country.replace(/[^a-z0-9]+/g, " ").trim();
  const detailedCountry = ["france", "belgique", "suisse", "pays bas", "allemagne", "espagne"].find((candidate) => countryKey.includes(candidate));
  if (detailedCountry) {
    const kind = is(visa, "etude", "etudes", "study") ? "Études" : is(visa, "travail", "worker", "emploi", "professional") ? "Travail" : "Visiteur";
    const verifiedJourney = VERIFIED_EUROPEAN_JOURNEYS.find((candidate) => normalize(candidate.country).replace(/[^a-z0-9]+/g, " ").trim() === detailedCountry && candidate.visaType === kind);
    if (verifiedJourney) return verifiedJourney;
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

export type JourneyMilestones = {
  evaluationClientConfirmed?: boolean;
  activationRequested?: boolean;
  paymentConfirmed?: boolean;
};

export function journeyStepIndex(journey: CandidateJourney, dossierStatus?: string | null, evaluationStatus?: string | null, milestones?: JourneyMilestones) {
  const status = normalize(dossierStatus);
  if (evaluationStatus !== "validated" && journey.steps[0]) return 0;
  if (is(status, "nouveau", "evaluation", "en evaluation")) return 1;
  if (is(status, "bilan")) return milestones?.evaluationClientConfirmed ? 5 : 4;
  if (milestones?.activationRequested && !milestones.paymentConfirmed) return 5;
  if (milestones?.paymentConfirmed || is(status, "paye", "payment")) return 6;
  if (is(status, "attente paiement", "en attente paiement", "paiement")) return 5;
  if (is(status, "document", "documents")) return 7;
  if (is(status, "soumis", "en cours", "recrutement", "adem")) return 9;
  if (is(status, "contrat")) return 10;
  if (is(status, "visa", "consulaire")) return 12;
  if (is(status, "approuve")) return journey.steps.length - 1;
  return Math.min(1, journey.steps.length - 1);
}
