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
  regional("Estonie", "Visiteur", "https://vm.ee/en/consular-visa-and-travel-information/visa-information/application-schengen-visa", [
    step("visa_c", "Vérifier le visa Schengen C", "Déterminer si l’Estonie est la destination principale et si un visa C est requis pour un séjour de 90 jours maximum sur 180.", ["Nationalité", "Destination principale", "Durée"], "https://vm.ee/en/consular-visa-and-travel-information/visa-information/application-schengen-visa"),
    step("application", "Dépôt auprès de la représentation compétente", "Remplir, imprimer et déposer la demande en personne auprès de la représentation estonienne ou de l’État représentant l’Estonie.", ["Formulaire", "Passeport", "Rendez-vous", "Biométrie"], "https://vm.ee/en/consular-visa-and-travel-information/visa-information/application-schengen-visa"),
    step("documents", "Pièces du court séjour", "Réunir motif, hébergement, moyens, assurance médicale Schengen et justificatifs complémentaires demandés.", ["Motif", "Hébergement", "Ressources", "Assurance"], "https://vm.ee/en/consular-visa-and-travel-information/visa-information/application-schengen-visa"),
    step("decision", "Décision et entrée", "Suivre la décision ; le visa C ne constitue pas un permis général d’études, de travail ou d’installation.", ["Référence", "Notifications", "Documents"], "https://vm.ee/en/consular-visa-and-travel-information/visa-information/application-schengen-visa"),
  ]),
  regional("Estonie", "Études", "https://www.politsei.ee/en/instructions/residence-permit-for-study", [
    step("admission", "Admission à temps plein", "Choisir un établissement reconnu et obtenir la confirmation d’admission ou d’inscription au programme.", ["Admission", "Programme", "Inscription"], "https://www.politsei.ee/en/instructions/residence-permit-for-study"),
    step("visa_d", "Visa D si nécessaire", "Déterminer avec la représentation compétente si un visa long séjour D est requis avant l’entrée.", ["Passeport", "Formulaire", "Assurance", "Ressources"], "https://vm.ee/en/consular-visa-and-travel-information/visa-information/application-long-stay-d-visa"),
    step("residence", "Permis de séjour pour études", "Déposer la demande auprès de la représentation ou du Police and Border Guard Board selon la situation juridique d’entrée.", ["Admission", "Assurance", "Ressources", "Casier"], "https://www.politsei.ee/en/instructions/residence-permit-for-study"),
    step("registration", "Installation et maintien", "S’installer, enregistrer la résidence et maintenir les études à temps plein pour conserver le permis.", ["Adresse", "Permis", "Progression"], "https://www.politsei.ee/en/instructions/residence-permit-for-study"),
  ]),
  regional("Estonie", "Travail", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-estonia_en", [
    step("employment_basis", "Choisir la base d’emploi", "Déterminer si l’emploi relève d’un enregistrement de courte durée ou d’un permis temporaire de séjour pour emploi.", ["Employeur", "Poste", "Durée"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-estonia_en"),
    step("short_term_registration", "Enregistrement emploi court", "Pour un emploi temporaire, l’employeur doit enregistrer l’emploi auprès du Police and Border Guard Board avant le début du travail.", ["Employeur", "Contrat", "Enregistrement"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-estonia_en"),
    step("visa_or_residence", "Visa D ou permis d’emploi", "Déposer la demande appropriée selon la durée, la base de séjour, les critères de salaire et les éventuels quotas.", ["Passeport", "Contrat", "Assurance", "Ressources"], "https://vm.ee/en/consular-visa-and-travel-information/visa-information/application-long-stay-d-visa"),
    step("residence_registration", "Enregistrement après arrivée", "Après l’entrée, enregistrer la résidence et respecter les conditions liées à l’employeur et au permis.", ["Adresse", "Permis", "Employeur"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-estonia_en"),
  ]),
  regional("Bulgarie", "Visiteur", "https://www.mfa.bg/en/services-travel/consular-services/travel-bulgaria/visa-bulgaria", [
    step("visa_c", "Vérifier le visa C Schengen", "Déterminer selon la nationalité et la durée si un visa uniforme Schengen C est requis pour la Bulgarie.", ["Nationalité", "Destination", "Durée"], "https://www.mfa.bg/en/services-travel/consular-services/travel-bulgaria/visa-bulgaria"),
    step("application", "Dépôt de la demande", "Remplir le formulaire et déposer la demande auprès de la représentation ou du centre compétent avec biométrie.", ["Formulaire", "Passeport", "Rendez-vous", "Biométrie"], "https://www.mfa.bg/en/services-travel/consular-services/travel-bulgaria/visa-application-forms"),
    step("documents", "Pièces du court séjour", "Réunir motif, hébergement, ressources, assurance et justificatifs demandés par la représentation.", ["Motif", "Hébergement", "Ressources", "Assurance"], "https://www.mfa.bg/en/services-travel/consular-services/travel-bulgaria/visa-bulgaria"),
    step("decision", "Décision et entrée", "Suivre la décision ; le visa C ne donne pas un droit général d’étudier, de travailler ou de s’installer.", ["Référence", "Notifications", "Documents"], "https://www.mfa.bg/en/services-travel/consular-services/travel-bulgaria/visa-bulgaria"),
  ]),
  regional("Bulgarie", "Études", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-bulgaria_en", [
    step("admission", "Admission dans un établissement", "Obtenir l’admission à un programme reconnu avant de demander le visa de long séjour.", ["Admission", "Programme", "Inscription"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-bulgaria_en"),
    step("visa_d", "Visa national D", "Déposer la demande de visa D auprès de l’ambassade ou du consulat compétent avec les pièces d’études.", ["Visa D", "Passeport", "Admission", "Ressources"], "https://www.mfa.bg/en/services-travel/consular-services/travel-bulgaria/visa-bulgaria"),
    step("residence", "Permis de séjour", "Après l’arrivée, demander le permis de séjour auprès de la Migration Directorate selon la durée du programme.", ["Visa D", "Logement", "Assurance", "Ressources"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-bulgaria_en"),
    step("registration", "Adresse et maintien", "Notifier l’adresse et respecter les conditions de maintien des études et du permis.", ["Adresse", "Permis", "Progression"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-bulgaria_en"),
  ]),
  regional("Bulgarie", "Travail", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-bulgaria_en", [
    step("single_permit", "Approbation du permis unique", "L’employeur vérifie la procédure auprès de l’Employment Agency et de la Migration Directorate avant l’arrivée.", ["Employeur", "Poste", "Contrat", "Test du marché"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-bulgaria_en"),
    step("visa_d", "Visa national D", "Après l’approbation, déposer la demande de visa D auprès de la représentation bulgare compétente.", ["Visa D", "Passeport", "Approbation", "Assurance"], "https://www.mfa.bg/en/services-travel/consular-services/travel-bulgaria/visa-bulgaria"),
    step("residence", "Permis unique ou séjour", "Après l’arrivée, obtenir le permis unique ou le titre de séjour auprès de la Migration Directorate.", ["Permis", "Contrat", "Logement", "Ressources"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-bulgaria_en"),
    step("registration", "Adresse et suivi employeur", "Notifier l’adresse et respecter les conditions liées à l’employeur, au poste et à la durée autorisée.", ["Adresse", "Employeur", "Permis"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-bulgaria_en"),
  ]),
  regional("Hongrie", "Visiteur", "https://konzinfo.mfa.gov.hu/en/how-apply-visa", [
    step("visa_c", "Vérifier le court séjour Schengen", "Déterminer selon la nationalité et la durée si un visa C est requis pour la Hongrie.", ["Nationalité", "Destination", "Durée"], "https://konzinfo.mfa.gov.hu/en/how-apply-visa"),
    step("application", "Dépôt de la demande", "Déposer la demande auprès de la représentation compétente avec les justificatifs et la biométrie requis.", ["Formulaire", "Passeport", "Rendez-vous", "Biométrie"], "https://konzinfo.mfa.gov.hu/en/how-apply-visa"),
    step("documents", "Pièces du court séjour", "Réunir motif, hébergement, ressources, assurance et autres justificatifs demandés.", ["Motif", "Hébergement", "Ressources", "Assurance"], "https://konzinfo.mfa.gov.hu/en/how-apply-visa"),
    step("decision", "Décision et entrée", "Suivre la décision ; le court séjour ne donne pas un droit général de travailler, étudier à long terme ou s’installer.", ["Référence", "Notifications", "Documents"], "https://konzinfo.mfa.gov.hu/en/how-apply-visa"),
  ]),
  regional("Hongrie", "Études", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-hungary_en", [
    step("admission", "Admission et préparation", "Obtenir l’admission à un établissement ou programme reconnu et préparer les justificatifs linguistiques et financiers.", ["Admission", "Programme", "Langue", "Ressources"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-hungary_en"),
    step("residence_application", "Demande de titre d’études", "Déposer la demande auprès de la mission compétente ou via Enter Hungary lorsque la procédure le permet.", ["Passeport", "Admission", "Logement", "Assurance"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-hungary_en"),
    step("entry", "Entrée et retrait du titre", "Utiliser la décision ou le visa d’entrée applicable, puis obtenir le titre auprès de l’autorité compétente.", ["Décision", "Visa", "Adresse", "Titre"], "https://konzinfo.mfa.gov.hu/en/how-apply-visa"),
    step("renewal", "Maintien et renouvellement", "Respecter les conditions du programme, du séjour et du renouvellement dans Enter Hungary.", ["Progression", "Titre", "Renouvellement"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-hungary_en"),
  ]),
  regional("Hongrie", "Travail", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-hungary_en", [
    step("employment_basis", "Base d’emploi", "Obtenir une offre ou un contrat et vérifier si l’emploi relève du permis unique ou d’une autre autorisation.", ["Employeur", "Poste", "Contrat", "Qualification"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-hungary_en"),
    step("single_permit", "Demande de permis unique", "Déposer la demande auprès de la mission ou de l’autorité compétente, avec l’intervention de l’employeur et les pièces de séjour.", ["Permis", "Contrat", "Logement", "Ressources"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-hungary_en"),
    step("entry", "Entrée et titre", "Après décision favorable, utiliser le visa d’entrée lorsque nécessaire et retirer le titre de séjour de travail.", ["Décision", "Visa", "Titre", "Assurance"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-hungary_en"),
    step("employer_followup", "Suivi employeur et renouvellement", "Respecter les conditions liées à l’employeur, au poste, à la durée et au renouvellement du titre.", ["Employeur", "Poste", "Titre", "Échéance"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-hungary_en"),
  ]),
  regional("Lituanie", "Visiteur", "https://www.urm.lt/en", [
    step("visa_c", "Vérifier le court séjour Schengen", "Déterminer selon la nationalité, la destination principale et la durée si un visa C est requis pour la Lituanie.", ["Nationalité", "Destination", "Durée"], "https://www.urm.lt/en"),
    step("application", "Dépôt de la demande", "Remplir la demande et déposer les pièces auprès de la représentation ou du prestataire compétent.", ["Formulaire", "Passeport", "Rendez-vous", "Biométrie"], "https://www.urm.lt/en"),
    step("documents", "Pièces du court séjour", "Réunir le motif, l’hébergement, les ressources, l’assurance et les justificatifs demandés.", ["Motif", "Hébergement", "Ressources", "Assurance"], "https://www.urm.lt/en"),
    step("decision", "Décision et entrée", "Suivre la décision ; un visa court séjour ne donne pas un droit général d’études, de travail ou d’installation.", ["Référence", "Notifications", "Documents"], "https://www.urm.lt/en"),
  ]),
  regional("Lituanie", "Études", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-lithuania_en", [
    step("admission", "Admission dans un établissement reconnu", "Obtenir l’admission ou l’inscription et la lettre de médiation électronique de l’établissement si requise.", ["Admission", "Programme", "Médiation"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-lithuania_en"),
    step("visa_or_residence", "Choisir visa national ou permis", "Déterminer selon la durée et le programme si un visa national long séjour ou un permis temporaire est approprié.", ["Visa D", "Permis", "Durée"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-lithuania_en"),
    step("migris", "Dépôt MIGRIS ou consulaire", "Remplir la demande et déposer les pièces, ressources, logement, assurance et antécédents selon la voie retenue.", ["MIGRIS", "Ressources", "Logement", "Assurance"], "https://www.migracija.lt/home?lang=en"),
    step("registration", "Installation et maintien", "Déclarer la résidence après délivrance et respecter les conditions de maintien des études.", ["Adresse", "Permis", "Progression"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-lithuania_en"),
  ]),
  regional("Lituanie", "Travail", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-lithuania_en", [
    step("employment_basis", "Vérifier la base d’emploi", "Déterminer si le poste relève d’un visa national, d’un permis temporaire et d’une décision ou d’un permis du service de l’emploi.", ["Employeur", "Poste", "Durée"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-lithuania_en"),
    step("employer", "Médiation et autorisation employeur", "Faire préparer par l’employeur la lettre de médiation et, si nécessaire, la décision du service de l’emploi ou le permis de travail.", ["Contrat", "Médiation", "Permis"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-lithuania_en"),
    step("migris", "Demande visa ou permis", "Déposer la demande auprès de la représentation ou du Migration Department selon la durée et la base légale.", ["Passeport", "Contrat", "Assurance", "Ressources"], "https://www.migracija.lt/home?lang=en"),
    step("registration", "Installation et suivi", "Déclarer la résidence et respecter les conditions liées à l’employeur, au poste et au permis.", ["Adresse", "Permis", "Employeur"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-lithuania_en"),
  ]),
  regional("Lettonie", "Visiteur", "https://www.mfa.gov.lv/en/applying-visa", [
    step("visa_c", "Vérifier le court séjour Schengen", "Déterminer selon la nationalité, la destination principale et la durée si un visa C est requis pour la Lettonie.", ["Nationalité", "Destination", "Durée"], "https://www.mfa.gov.lv/en/applying-visa"),
    step("application", "Dépôt de la demande", "Remplir le formulaire et déposer la demande auprès de la mission compétente avec biométrie et documents requis.", ["Formulaire", "Passeport", "Rendez-vous", "Biométrie"], "https://www.mfa.gov.lv/en/applying-visa"),
    step("documents", "Pièces du court séjour", "Réunir motif, hébergement, moyens, assurance et justificatifs supplémentaires demandés par la représentation.", ["Motif", "Hébergement", "Ressources", "Assurance"], "https://www.mfa.gov.lv/en/documents-required-apply-visa"),
    step("decision", "Décision et entrée", "Suivre la décision ; le visa court séjour ne donne pas un droit général d’installation ou de travail.", ["Référence", "Notifications", "Documents"], "https://www.mfa.gov.lv/en/applying-visa"),
  ]),
  regional("Lettonie", "Études", "https://www.pmlp.gov.lv/en/residence-permit", [
    step("admission", "Admission et motif d’études", "Obtenir l’admission ou la confirmation de l’établissement et vérifier la base de séjour applicable.", ["Admission", "Programme", "Inscription"], "https://www.pmlp.gov.lv/en/residence-permit"),
    step("residence", "Permis de séjour pour études", "Déposer la demande auprès de l’autorité compétente avec les pièces liées aux études, aux ressources et à l’assurance.", ["Admission", "Ressources", "Assurance", "Passeport"], "https://www.pmlp.gov.lv/en/residence-permit"),
    step("application", "Dépôt consulaire ou administratif", "Vérifier le lieu de dépôt selon la nationalité, la durée et la représentation compétente.", ["Formulaire", "Rendez-vous", "Biométrie"], "https://www.mfa.gov.lv/en/applying-visa"),
    step("registration", "Installation et maintien", "Respecter les formalités d’adresse et les conditions liées au maintien du permis d’études.", ["Adresse", "Permis", "Progression"], "https://www.pmlp.gov.lv/en/residence-permit"),
  ]),
  regional("Lettonie", "Travail", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-latvia_en", [
    step("employment_basis", "Vérifier la base d’emploi", "Identifier le permis, le titre de séjour et les démarches employeur applicables au poste et à la durée.", ["Employeur", "Poste", "Durée"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-latvia_en"),
    step("employer", "Démarches de l’employeur", "Faire préparer par l’employeur les documents et autorisations nécessaires auprès de l’autorité lettone compétente.", ["Contrat", "Employeur", "Qualification"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-latvia_en"),
    step("residence", "Permis de séjour ou visa", "Déposer la demande selon la durée et la base d’emploi, avec les pièces requises.", ["Passeport", "Contrat", "Ressources", "Assurance"], "https://www.pmlp.gov.lv/en/residence-permit"),
    step("registration", "Installation et suivi", "Respecter les formalités d’arrivée et les conditions attachées au permis et à l’employeur.", ["Adresse", "Permis", "Employeur"], "https://www.pmlp.gov.lv/en/residence-permit"),
  ]),
  regional("Serbie", "Visiteur", "https://www.mfa.gov.rs/en/citizens/travel-serbia/visa-requirements", [
    step("visa_check", "Vérifier le droit d’entrée", "Vérifier la nationalité, les exemptions éventuelles et si une demande de visa est nécessaire avant l’entrée en Serbie.", ["Nationalité", "Passeport", "Durée"], "https://www.mfa.gov.rs/en/citizens/travel-serbia/visa-requirements"),
    step("visa_c", "Visa C court séjour", "Si requis, déposer une demande de visa C pour tourisme, affaires ou autre séjour jusqu’à 90 jours dans une période de 180 jours.", ["Formulaire", "Motif", "Hébergement", "Ressources", "Assurance"], "https://www.mfa.gov.rs/en/citizens/travel-serbia/visa-requirements"),
    step("portal_application", "Dépôt auprès de la mission ou du portail", "Déposer personnellement la demande auprès de l’ambassade/du consulat ou via le portail officiel lorsque la voie électronique est disponible.", ["Rendez-vous", "Biométrie", "Pièces", "Référence"], "http://welcometoserbia.gov.rs/home"),
    step("decision", "Décision et entrée", "Suivre la décision et respecter les limites du visa C ; ce visa ne constitue pas en principe une base d’installation ou de travail.", ["Décision", "Passeport", "Conditions"], "https://www.mfa.gov.rs/en/citizens/travel-serbia/visa-requirements"),
  ]),
  regional("Serbie", "Études", "https://www.mfa.gov.rs/en/citizens/travel-serbia/visa-requirements", [
    step("education_basis", "Admission et motif études", "Obtenir l’admission et réunir les documents justifiant l’éducation comme motif de séjour.", ["Admission", "Programme", "Passeport"], "https://www.mfa.gov.rs/en/citizens/travel-serbia/visa-requirements"),
    step("visa_d", "Visa D si requis", "Vérifier le visa D de long séjour pour entrer et séjourner entre 90 et 180 jours lorsque le régime de visa l’impose.", ["Formulaire", "Admission", "Assurance", "Ressources"], "https://www.mfa.gov.rs/en/citizens/travel-serbia/visa-requirements"),
    step("temporary_residence", "Résidence temporaire", "Déposer la demande de résidence temporaire par la voie officielle applicable et respecter les obligations de séjour et d’adresse.", ["Titre", "Logement", "Assurance", "Ressources"], "http://welcometoserbia.gov.rs/home"),
    step("study_maintenance", "Maintien du statut étudiant", "Respecter les conditions d’inscription, de présence, de renouvellement et les limites éventuelles du travail pendant les études.", ["Inscription", "Échéances", "Titre"], "http://welcometoserbia.gov.rs/home"),
  ]),
  regional("Serbie", "Travail", "http://welcometoserbia.gov.rs/residence-and-work-permit", [
    step("employment_basis", "Offre et base d’emploi", "Obtenir un contrat ou une autre base de travail et déterminer si un visa D ou une demande directe de permis s’applique.", ["Employeur", "Contrat", "Poste", "Qualification"], "http://welcometoserbia.gov.rs/residence-and-work-permit"),
    step("visa_d_or_permit", "Visa D ou permis unique", "Selon le cas, demander un visa D fondé sur l’emploi ou un permis unique temporaire de résidence et de travail via le portail officiel.", ["Visa D", "Permis", "Employeur", "Formulaire"], "http://welcometoserbia.gov.rs/residence-and-work-permit"),
    step("labour_market", "Vérifications employeur", "L’employeur accomplit les vérifications de marché du travail lorsque cette exigence s’applique à la base d’emploi.", ["Vacance", "Employeur", "Confirmation"], "http://welcometoserbia.gov.rs/residence-and-work-permit"),
    step("arrival_registration", "Entrée et suivi du permis", "Après décision, respecter l’entrée, la déclaration d’adresse, les conditions de l’employeur et le renouvellement du titre.", ["Décision", "Adresse", "Titre", "Échéance"], "http://welcometoserbia.gov.rs/home"),
  ]),
  regional("Slovaquie", "Visiteur", "https://www.mzv.sk/en/services/information-for-foreigners/visas-for-foreigners-to-enter-sr", [
    step("visa_c", "Vérifier le court séjour Schengen", "Déterminer selon la nationalité, la destination principale et la durée si un visa C est requis pour la Slovaquie.", ["Nationalité", "Destination", "Durée"], "https://www.mzv.sk/en/services/information-for-foreigners/visas-for-foreigners-to-enter-sr"),
    step("application", "Dépôt de la demande", "Déposer la demande auprès de la mission diplomatique, du centre de visa ou du représentant compétent avec biométrie et justificatifs.", ["Formulaire", "Passeport", "Rendez-vous", "Biométrie"], "https://www.mzv.sk/en/services/information-for-foreigners/visas-for-foreigners-to-enter-sr"),
    step("documents", "Pièces du court séjour", "Réunir le motif, l’hébergement, les ressources, l’assurance et les preuves demandées par la mission compétente.", ["Motif", "Hébergement", "Ressources", "Assurance"], "https://www.mzv.sk/en/services/information-for-foreigners/visas-for-foreigners-to-enter-sr"),
    step("decision", "Décision et entrée", "Suivre la décision ; le visa C ne constitue pas un droit général de travailler, d’étudier à long terme ou de s’installer.", ["Référence", "Notifications", "Documents"], "https://www.mzv.sk/en/services/information-for-foreigners/visas-for-foreigners-to-enter-sr"),
  ]),
  regional("Slovaquie", "Études", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-slovakia_en", [
    step("admission", "Admission dans un établissement", "Obtenir l’admission dans un établissement slovaque reconnu et préparer les documents d’études requis.", ["Admission", "Programme", "Passeport"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-slovakia_en"),
    step("residence_application", "Résidence temporaire pour études", "Déposer personnellement la demande auprès de l’ambassade ou de la Foreign Police selon la situation et la voie autorisée.", ["Formulaire", "Admission", "Casier", "Ressources", "Logement"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-slovakia_en"),
    step("national_visa", "Visa national si requis", "Vérifier si un visa D d’entrée est nécessaire avant l’arrivée, sans le confondre avec le titre de séjour étudiant.", ["Visa D", "Décision", "Assurance"], "https://www.minv.sk/?application-for-national-visa-1"),
    step("arrival_registration", "Installation et maintien", "Entrer dans le délai autorisé, déclarer le début du séjour, obtenir l’assurance et respecter les obligations médicales et de résidence.", ["Adresse", "Assurance", "Titre", "Échéances"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-slovakia_en"),
  ]),
  regional("Slovaquie", "Travail", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-slovakia_en", [
    step("employment_basis", "Base d’emploi", "Obtenir une offre ou un contrat et déterminer si le dossier relève du permis unique ou d’un permis de travail avec résidence temporaire.", ["Employeur", "Poste", "Contrat", "Qualification"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-slovakia_en"),
    step("labour_office", "Vacance et confirmation", "L’employeur vérifie la déclaration de vacance et la confirmation de possibilité de pourvoir le poste auprès du Labour Office lorsque la règle s’applique.", ["Vacance", "Employeur", "Confirmation", "Poste"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-slovakia_en"),
    step("residence_application", "Demande de permis ou résidence", "Déposer personnellement la demande avec contrat/promesse, casier, ressources, logement, assurance et traductions/authentifications requises.", ["Permis", "Contrat", "Casier", "Logement", "Ressources"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-slovakia_en"),
    step("entry_registration", "Entrée et suivi employeur", "Après décision, utiliser le visa d’entrée si requis, déclarer l’arrivée, obtenir le titre et respecter les conditions de l’employeur et du renouvellement.", ["Décision", "Visa", "Titre", "Adresse", "Échéance"], "https://www.minv.sk/?application-for-national-visa-1"),
  ]),
  regional("Slovénie", "Visiteur", "https://www.gov.si/en/topics/entry-and-residence/", [
    step("visa_c", "Vérifier le court séjour Schengen", "Déterminer selon la nationalité et la durée si un visa Schengen est requis pour entrer en Slovénie.", ["Nationalité", "Durée", "Motif"], "https://www.gov.si/en/topics/entry-and-residence/"),
    step("application", "Formulaire de visa", "Remplir le formulaire officiel, l’imprimer et le déposer auprès de l’ambassade ou du centre compétent.", ["Formulaire", "Passeport", "Rendez-vous"], "https://www.gov.si/en/registries/services/electronic-visa-application-form/"),
    step("documents", "Pièces du séjour", "Réunir motif, hébergement, ressources, assurance et justificatifs demandés par la représentation compétente.", ["Motif", "Hébergement", "Ressources", "Assurance"], "https://www.gov.si/en/topics/entry-and-residence/"),
    step("decision", "Décision et entrée", "Suivre la décision ; un visa de court séjour ne donne pas un droit d’installation ou de travail.", ["Référence", "Notifications", "Documents"], "https://www.gov.si/en/topics/entry-and-residence/"),
  ]),
  regional("Slovénie", "Études", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-slovenia_en", [
    step("admission", "Admission dans un établissement", "Obtenir la preuve d’admission ou d’inscription dans un programme reconnu.", ["Admission", "Programme", "Inscription"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-slovenia_en"),
    step("residence", "Permis temporaire d’études", "Demander le premier permis de séjour temporaire auprès de la mission diplomatique ou de l’unité administrative compétente.", ["Passeport", "Assurance", "Ressources", "Casier"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-slovenia_en"),
    step("registration", "Enregistrement de résidence", "Après l’arrivée, enregistrer le lieu de résidence dans le délai officiel applicable.", ["Adresse", "Permis", "Inscription"], "https://www.gov.si/en/topics/entry-and-residence/"),
    step("renewal", "Suivi et renouvellement", "Maintenir l’inscription et demander le renouvellement avant l’expiration du permis.", ["Permis", "Inscription", "Ressources"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-slovenia_en"),
  ]),
  regional("Slovénie", "Travail", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-slovenia_en", [
    step("single_permit", "Permis unique séjour-travail", "Le candidat ou l’employeur introduit la demande de permis unique auprès de la mission ou de l’unité administrative compétente.", ["Employeur", "Contrat", "Passeport"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-slovenia_en"),
    step("employment_consent", "Consentement du service de l’emploi", "L’autorité compétente recueille le consentement du service de l’emploi conformément aux règles applicables.", ["Contrat", "Qualification", "Employeur"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-slovenia_en"),
    step("documents", "Pièces de séjour et travail", "Fournir assurance, moyens, contrat signé, casier et les justificatifs exigés pour le permis unique.", ["Assurance", "Ressources", "Contrat", "Casier"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-slovenia_en"),
    step("residence", "Entrée et permis", "Après décision favorable, respecter les formalités d’entrée, de résidence et les limites liées à l’employeur.", ["Visa", "Adresse", "Permis"], "https://www.gov.si/en/topics/entry-and-residence/"),
  ]),
  regional("Roumanie", "Visiteur", "http://www.mae.ro/en/node/2035", [
    step("visa_c", "Vérifier le visa Schengen C", "Déterminer selon la nationalité et la destination principale si un visa Schengen court séjour est requis pour la Roumanie.", ["Nationalité", "Destination principale", "Durée"], "http://www.mae.ro/en/node/2035"),
    step("application", "Préparer la demande", "Réunir le motif, le passeport, les moyens, l’hébergement, l’assurance et les pièces demandées par le poste compétent.", ["Passeport", "Motif", "Ressources", "Assurance"], "http://www.mae.ro/en/node/2035"),
    step("submission", "Dépôt et biométrie", "Déposer la demande auprès de la représentation compétente et fournir les données requises.", ["Formulaire", "Rendez-vous", "Biométrie"], "http://www.mae.ro/en/node/2035"),
    step("decision", "Décision et entrée", "Suivre la décision ; le visa ne garantit pas l’entrée et ne permet pas de changer le motif du séjour.", ["Référence", "Notifications", "Documents"], "http://www.mae.ro/en/node/2035"),
  ]),
  regional("Roumanie", "Études", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-romania_en", [
    step("admission", "Lettre d’acceptation", "Obtenir l’admission et la lettre d’acceptation du ministère compétent pour le programme d’études.", ["Admission", "Lettre", "Programme"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-romania_en"),
    step("visa_d", "Visa long séjour études", "Déposer la demande de visa D avec ressources, assurance, casier et preuve d’inscription ou d’acceptation.", ["Passeport", "Ressources", "Assurance", "Casier"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-romania_en"),
    step("residence", "Permis de séjour temporaire", "Après l’arrivée, demander le permis auprès de l’Inspectorat général pour l’immigration si le séjour dépasse 90 jours.", ["Visa", "Adresse", "Inscription"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-romania_en"),
    step("renewal", "Suivi et renouvellement", "Maintenir l’inscription, les ressources et les conditions de séjour pour tout renouvellement.", ["Permis", "Inscription", "Ressources"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-romania_en"),
  ]),
  regional("Roumanie", "Travail", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-romania_en", [
    step("work_authorisation", "Autorisation de travail", "L’employeur demande l’autorisation auprès de l’Inspectorat général pour l’immigration, selon les exemptions et quotas applicables.", ["Employeur", "Contrat", "Autorisation"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-romania_en"),
    step("visa_d", "Visa D/AM", "Après l’autorisation, déposer dans le délai applicable la demande de visa long séjour emploi auprès de la mission roumaine.", ["Autorisation", "Passeport", "Casier"], "https://www.mae.ro/en/node/2054"),
    step("contract", "Contrat individuel", "Conclure le contrat individuel de travail conformément à l’autorisation et aux conditions approuvées.", ["Contrat", "Employeur", "Salaire"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-romania_en"),
    step("residence", "Permis de séjour", "Après l’entrée, demander le permis temporaire auprès de l’Inspectorat territorial pour la durée du contrat.", ["Visa", "Contrat", "Assurance", "Adresse"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-romania_en"),
  ]),
  regional("Croatie", "Visiteur", "https://mvep.gov.hr/consular-information-152362/visa-152363/152363", [
    step("visa_c", "Vérifier le visa C", "Déterminer selon la nationalité et la durée si un visa court séjour C est requis pour la Croatie.", ["Nationalité", "Durée", "Motif"], "https://mvep.gov.hr/consular-information-152362/visa-152363/152363"),
    step("application", "Formulaire crovisa", "Compléter le formulaire en ligne, l’imprimer et préparer le dépôt auprès de l’ambassade, du consulat ou du centre compétent.", ["Formulaire", "Passeport", "Rendez-vous"], "https://crovisa.mvep.hr/?lang=en"),
    step("documents", "Pièces et assurance", "Réunir le motif du séjour, l’hébergement, l’assurance et les justificatifs demandés par la mission croate compétente.", ["Motif", "Hébergement", "Assurance"], "https://gov.hr/en/visas/1216"),
    step("decision", "Décision et entrée", "Suivre la décision ; un visa ne garantit pas l’entrée et ne permet pas de travailler en Croatie.", ["Référence", "Notifications", "Documents"], "https://mvep.gov.hr/consular-information-152362/visa-152363/152363"),
  ]),
  regional("Croatie", "Études", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-croatia_en", [
    step("admission", "Admission universitaire", "Obtenir la preuve d’inscription dans un établissement d’enseignement supérieur croate.", ["Admission", "Programme", "Durée"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-croatia_en"),
    step("temporary_stay", "Séjour temporaire études", "Préparer la demande de séjour temporaire avec ressources, assurance, document de voyage et pièces requises.", ["Passeport", "Ressources", "Assurance", "Casier"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-croatia_en"),
    step("visa_d", "Visa D si requis", "Si l’entrée le requiert après l’octroi du séjour, demander le visa D auprès de la mission croate compétente.", ["Décision", "Passeport", "Visa"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-croatia_en"),
    step("biometrics", "Arrivée et biométrie", "Enregistrer l’adresse et fournir les données biométriques auprès de la police compétente pour la carte de séjour.", ["Adresse", "Biométrie", "Carte"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-croatia_en"),
  ]),
  regional("Croatie", "Travail", "https://mvep.gov.hr/consular-information-152362/visa-152363/152363", [
    step("employer", "Emploi et autorisation", "Vérifier le contrat, l’employeur et l’autorisation de séjour et de travail applicable avant le départ.", ["Employeur", "Contrat", "Autorisation"], "https://gov.hr/en/visas/1216"),
    step("visa", "Visa d’entrée si requis", "Déterminer avec la mission compétente si un visa D ou une autre formalité d’entrée est nécessaire après l’autorisation.", ["Passeport", "Autorisation", "Visa"], "https://mvep.gov.hr/consular-information-152362/visa-152363/152363"),
    step("application", "Dépôt et pièces", "Déposer la demande et fournir les pièces employeur et personnelles demandées par l’autorité compétente.", ["Formulaire", "Contrat", "Assurance"], "https://gov.hr/en/visas/1216"),
    step("registration", "Enregistrement et début autorisé", "Enregistrer le séjour et ne commencer l’activité qu’après confirmation de l’autorisation permettant légalement de travailler.", ["Décision", "Adresse", "Permis"], "https://mvep.gov.hr/consular-information-152362/visa-152363/152363"),
  ]),
  regional("Grèce", "Visiteur", "https://www.mfa.gr/usa/en/services/visas/", [
    step("visa_schengen", "Vérifier le visa Schengen", "Déterminer selon la nationalité et la durée si un visa Schengen court séjour est requis pour la Grèce.", ["Nationalité", "Durée", "Motif"], "https://www.mfa.gr/usa/en/services/visas/"),
    step("documents", "Préparer les justificatifs", "Réunir passeport, motif, ressources, hébergement, assurance et pièces demandées par la mission grecque compétente.", ["Passeport", "Motif", "Ressources", "Assurance"], "https://www.mfa.gr/usa/en/services/visas/"),
    step("appointment", "Dépôt et biométrie", "Déposer la demande selon les instructions de l’ambassade ou du consulat compétent et fournir les données requises.", ["Formulaire", "Rendez-vous", "Biométrie"], "https://www.mfa.gr/usa/en/services/visas/"),
    step("decision", "Décision et entrée", "Suivre la décision ; un visa ne garantit pas automatiquement l’entrée, qui reste contrôlée à la frontière.", ["Référence", "Notifications", "Documents"], "https://www.mfa.gr/usa/en/services/visas/"),
  ]),
  regional("Grèce", "Études", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-greece_en", [
    step("admission", "Admission dans un établissement", "Obtenir l’acceptation dans un établissement d’enseignement supérieur et confirmer le programme suivi.", ["Admission", "Programme", "Durée"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-greece_en"),
    step("resources", "Ressources et inscription", "Préparer la preuve de ressources et le paiement des frais d’inscription lorsqu’il est requis.", ["Ressources", "Frais", "Admission"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-greece_en"),
    step("visa", "Visa et permis d’études", "Déposer la demande de visa auprès de l’ambassade ou du consulat puis demander le permis de séjour selon la durée du cursus.", ["Passeport", "Admission", "Ressources"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-greece_en"),
    step("renewal", "Suivi et renouvellement", "Respecter la durée du permis, les obligations de suivi académique et les conditions de renouvellement.", ["Permis", "Inscription", "Résultats"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-greece_en"),
  ]),
  regional("Grèce", "Travail", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-greece_en", [
    step("employer_approval", "Autorisation d’emploi", "Vérifier l’autorisation et les volumes d’admission applicables à la région et à la spécialité avant le visa.", ["Employeur", "Région", "Spécialité"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-greece_en"),
    step("contract", "Contrat de travail", "Réunir le contrat signé et les justificatifs de l’employeur exigés pour l’approbation.", ["Contrat", "Employeur", "Rémunération"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-greece_en"),
    step("national_visa", "Visa national d’emploi", "Déposer la demande de visa auprès de l’ambassade ou du consulat après l’approbation compétente.", ["Passeport", "Contrat", "Approbation"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-greece_en"),
    step("residence", "Permis de séjour", "Après l’arrivée et avant l’expiration du visa, demander le permis auprès de l’administration décentralisée compétente.", ["Visa", "Assurance", "Contrat", "Frais"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-greece_en"),
  ]),
  regional("Irlande", "Visiteur", "https://www.ireland.ie/en/dfa/visas-for-ireland/", [
    step("visa_need", "Vérifier le besoin de visa irlandais", "Déterminer selon la nationalité, la durée et le motif si une autorisation ou un visa irlandais est requis ; un visa Schengen n’est pas valable en Irlande.", ["Nationalité", "Motif", "Durée"], "https://www.ireland.ie/en/dfa/visas-for-ireland/"),
    step("documents", "Préparer les justificatifs", "Réunir passeport, motif, hébergement, ressources, assurance et les pièces demandées par l’Irish Immigration Service.", ["Passeport", "Motif", "Hébergement", "Ressources"], "https://www.ireland.ie/en/dfa/visas-for-ireland/"),
    step("avats", "Demande AVATS", "Compléter la demande en ligne AVATS, imprimer le résumé, signer et suivre le lieu de dépôt indiqué.", ["Formulaire", "Résumé AVATS", "Frais"], "https://www.visas.inis.gov.ie/avats/onlinehome.aspx"),
    step("decision", "Décision et entrée", "Suivre la décision et comprendre qu’un visa autorise le voyage mais ne garantit pas l’entrée, décidée au contrôle frontalier.", ["Référence", "Notifications", "Documents"], "https://www.ireland.ie/en/dfa/visas-for-ireland/"),
  ]),
  regional("Irlande", "Études", "https://www.irishimmigration.ie/coming-to-study-in-ireland/what-are-my-study-visa-options/how-to-apply-for-long-term-study-visa/", [
    step("admission", "Admission et inscription", "Obtenir la lettre d’inscription et vérifier la durée de la formation et les exigences applicables aux ressortissants non-EEE/non-suisses.", ["Admission", "Programme", "Durée"], "https://www.irishimmigration.ie/coming-to-study-in-ireland/what-are-my-study-visa-options/how-to-apply-for-long-term-study-visa/"),
    step("visa_type", "Choisir C ou D études", "Distinguer le court séjour C pour une formation jusqu’à 90 jours du visa D pour une étude de plus de trois mois.", ["Nationalité", "Durée", "Admission"], "https://www.ireland.ie/en/dfa/visas-for-ireland/"),
    step("avats", "Demande et pièces", "Compléter AVATS, payer les frais applicables et envoyer les pièces exigées ; l’envoi des documents ne garantit pas l’acceptation.", ["Formulaire", "Frais", "Pièces"], "https://www.irishimmigration.ie/coming-to-study-in-ireland/what-are-my-study-visa-options/how-to-apply-for-long-term-study-visa/"),
    step("arrival", "Arrivée et permission", "Présenter les documents au contrôle et respecter la permission d’entrée, la durée autorisée et l’enregistrement lorsque requis.", ["Passeport", "Visa", "Enregistrement"], "https://www.irishimmigration.ie/coming-to-study-in-ireland/what-are-my-study-visa-options/how-to-apply-for-long-term-study-visa/"),
  ]),
  regional("Irlande", "Travail", "https://www.irishimmigration.ie/coming-to-work-in-ireland/", [
    step("permit", "Employment permit ou permission", "Vérifier l’autorisation de travail requise avant le visa, selon la nationalité, la durée et le type d’emploi.", ["Nationalité", "Emploi", "Durée"], "https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/"),
    step("contract", "Contrat et éligibilité", "Réunir le contrat signé, les informations employeur et les éléments de qualification exigés par le type de permis.", ["Employeur", "Contrat", "Qualification"], "https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/"),
    step("visa", "Visa C ou D puis AVATS", "Selon la durée, demander le visa irlandais approprié via AVATS après obtention ou vérification du permis d’emploi.", ["Permit", "Formulaire", "Frais"], "https://www.irishimmigration.ie/coming-to-work-in-ireland/"),
    step("registration", "Entrée et enregistrement", "Après l’arrivée, respecter la permission accordée et l’enregistrement requis pour un séjour de plus de 90 jours.", ["Visa", "Permission", "Enregistrement"], "https://www.irishimmigration.ie/coming-to-work-in-ireland/"),
  ]),
  regional("République tchèque", "Visiteur", "https://mzv.gov.cz/jnp/en/information_for_aliens/types_of_visas/index.html", [
    step("visa_c", "Vérifier le visa C", "Déterminer si un visa Schengen court séjour est requis et confirmer le but du voyage en République tchèque.", ["Nationalité", "Itinéraire", "Dates"], "https://mzv.gov.cz/jnp/en/information_for_aliens/types_of_visas/index.html"),
    step("documents", "Préparer les justificatifs", "Réunir passeport, motif, hébergement, assurance et pièces demandées par la mission tchèque compétente.", ["Passeport", "Motif", "Hébergement", "Assurance"], "https://mzv.gov.cz/jnp/en/information_for_aliens/types_of_visas/index.html"),
    step("appointment", "Dépôt et biométrie", "Déposer la demande auprès de la mission tchèque compétente selon les instructions consulaires.", ["Formulaire", "Rendez-vous", "Biométrie"], "https://mzv.gov.cz/jnp/en/information_for_aliens/visa_form/index.html"),
    step("decision", "Suivi de décision", "Suivre la décision et respecter la durée du visa C et les limites de circulation Schengen.", ["Référence", "Notifications"], "https://mzv.gov.cz/jnp/en/information_for_aliens/types_of_visas/index.html"),
  ]),
  regional("République tchèque", "Études", "https://ipc.gov.cz/en/visa-and-residence-permit-types/third-country-nationals/long-term-visa/long-term-visa-for-the-purpose-of-studies/", [
    step("admission", "Admission d’études", "Obtenir la confirmation d’admission ou d’inscription dans une formation relevant de la catégorie études.", ["Admission", "Programme", "Durée"], "https://ipc.gov.cz/en/visa-and-residence-permit-types/third-country-nationals/long-term-visa/long-term-visa-for-the-purpose-of-studies/"),
    step("permit", "Visa D ou résidence études", "Choisir avec la mission compétente entre visa long séjour études et permis de résidence longue durée selon le projet.", ["Passeport", "Admission", "Ressources"], "https://mzv.gov.cz/jnp/en/information_for_aliens/types_of_visas/index.html"),
    step("application", "Dépôt personnel", "Déposer la demande en personne avec logement, ressources, assurance et pièces complémentaires éventuellement requises.", ["Formulaire", "Logement", "Assurance", "Biométrie"], "https://ipc.gov.cz/en/visa-and-residence-permit-types/third-country-nationals/long-term-visa/long-term-visa-for-the-purpose-of-studies/"),
    step("decision", "Suivi et arrivée", "Suivre le statut, récupérer le visa ou permis et respecter l’enregistrement et les obligations de séjour.", ["Décision", "Référence", "Adresse"], "https://ipc.gov.cz/en/"),
  ]),
  regional("République tchèque", "Travail", "https://ipc.gov.cz/en/visa-and-residence-permit-types/third-country-nationals/long-term-residence-permits/employee-card/", [
    step("offer", "Contrat et vacance", "Vérifier le contrat, l’employeur et le numéro de poste vacant lorsqu’il est requis pour la carte salarié.", ["Employeur", "Contrat", "Poste vacant"], "https://ipc.gov.cz/en/visa-and-residence-permit-types/third-country-nationals/long-term-residence-permits/employee-card/"),
    step("permit", "Carte salarié ou autre permis", "Déterminer le permis de résidence longue durée adapté à l’emploi et les éventuelles qualifications exigées.", ["Passeport", "Qualification", "Salaire"], "https://ipc.gov.cz/en/visa-and-residence-permit-types/third-country-nationals/long-term-residence-permits/employee-card/"),
    step("application", "Dépôt et identification", "Déposer la demande auprès de la mission ou de l’autorité compétente, avec les pièces employeur et la biométrie.", ["Formulaire", "Contrat", "Biométrie"], "https://ipc.gov.cz/en/"),
    step("employment", "Début autorisé", "Ne commencer l’emploi qu’après la confirmation permettant légalement de travailler selon les limites du permis.", ["Décision", "Permis", "Employeur"], "https://ipc.gov.cz/en/visa-and-residence-permit-types/third-country-nationals/long-term-residence-permits/employee-card/"),
  ]),
  regional("Danemark", "Visiteur", "https://www.nyidanmark.dk/en-GB/You-want-to-apply/Short-stay-visa", [
    step("visa_schengen", "Vérifier le visa Schengen", "Déterminer si le Danemark est la destination principale et si un visa court séjour est requis.", ["Nationalité", "Itinéraire", "Dates"], "https://www.nyidanmark.dk/en-GB/You-want-to-apply/Short-stay-visa"),
    step("documents", "Préparer les justificatifs", "Réunir les pièces de visite, le passeport, l’assurance et les documents demandés par la mission compétente.", ["Passeport", "Motif", "Hébergement", "Assurance"], "https://um.dk/en/travel-and-residence/how-to-apply-for-a-visa/"),
    step("appointment", "Dépôt de la demande", "Déposer la demande auprès du canal ou de la représentation désignée par le Danemark dans le pays de résidence.", ["Formulaire", "Rendez-vous", "Biométrie"], "https://um.dk/en/travel-and-residence/how-to-apply-for-a-visa/"),
    step("decision", "Suivi de décision", "Suivre la décision et respecter la limite du court séjour ; le visa ne permet pas de s’installer, travailler ou étudier longuement.", ["Référence", "Notifications"], "https://www.nyidanmark.dk/en-GB/You-want-to-apply/Short-stay-visa"),
  ]),
  regional("Danemark", "Études", "https://www.nyidanmark.dk/en-GB/You-want-to-apply/Study", [
    step("admission", "Admission dans un établissement", "Obtenir l’admission dans le type d’enseignement concerné : supérieur, doctorat ou autre catégorie reconnue.", ["Admission", "Programme", "Durée"], "https://www.nyidanmark.dk/en-GB/You-want-to-apply/Study"),
    step("permit", "Permis de résidence étudiant", "Demander le permis de résidence et, si applicable, le droit au travail lié aux études ; un visa Schengen ne suffit pas pour les études longues.", ["Passeport", "Admission", "Ressources"], "https://www.nyidanmark.dk/en-GB/You-want-to-apply/Study"),
    step("application", "Dépôt et biométrie", "Compléter la demande auprès de Nyidanmark et suivre les instructions de dépôt et d’identification.", ["Formulaire", "Admission", "Biométrie"], "https://www.nyidanmark.dk/en-GB/You-want-to-apply"),
    step("residence", "Entrée et suivi du permis", "Après décision, respecter les limites du permis et les éventuelles règles de renouvellement ou de recherche d’emploi.", ["Décision", "Carte", "Renouvellement"], "https://www.nyidanmark.dk/en-GB/You-want-to-apply/Study"),
  ]),
  regional("Danemark", "Travail", "https://www.nyidanmark.dk/en-GB/You-want-to-apply", [
    step("offer", "Offre et catégorie professionnelle", "Vérifier le contrat, le poste et le programme professionnel ou la liste applicable avant la demande.", ["Employeur", "Contrat", "Fonction"], "https://www.nyidanmark.dk/en-GB/You-want-to-apply"),
    step("permit", "Permis de travail et de résidence", "Déterminer le permis Nyidanmark/SIRI requis ; un visa Schengen ne permet pas de travailler au Danemark.", ["Passeport", "Salaire", "Qualification"], "https://um.dk/en/travel-and-residence/how-to-apply-for-a-visa/"),
    step("application", "Dépôt de la demande", "Déposer la demande selon la catégorie, fournir les pièces employeur et accomplir l’identification auprès du canal compétent.", ["Formulaire", "Contrat", "Biométrie"], "https://www.nyidanmark.dk/en-GB/You-want-to-apply"),
    step("employment", "Début autorisé de l’activité", "Ne commencer le travail qu’après autorisation et selon les limites du permis délivré.", ["Permis", "Employeur", "Carte"], "https://www.nyidanmark.dk/en-GB/You-want-to-apply"),
  ]),
  regional("Finlande", "Visiteur", "https://migri.fi/en/visiting-finland", [
    step("visa_schengen", "Vérifier le court séjour", "Déterminer si un visa Schengen est requis et si la Finlande est la destination principale du voyage.", ["Nationalité", "Itinéraire", "Dates"], "https://migri.fi/en/visiting-finland"),
    step("documents", "Préparer les justificatifs", "Réunir passeport, motif, hébergement, assurance et les pièces demandées par le poste compétent.", ["Passeport", "Motif", "Hébergement", "Assurance"], "https://migri.fi/en/visiting-finland"),
    step("appointment", "Dépôt et biométrie", "Enregistrer la demande et déposer les documents selon les instructions de la représentation finlandaise compétente.", ["Formulaire", "Rendez-vous", "Biométrie"], "https://finlandabroad.fi/web/usa/frontpage"),
    step("decision", "Suivi de décision", "Suivre la décision et respecter la durée du court séjour autorisée.", ["Référence", "Notifications"], "https://migri.fi/en/visiting-finland"),
  ]),
  regional("Finlande", "Études", "https://migri.fi/en/residence-permit-application-for-studies", [
    step("admission", "Admission d’études", "Obtenir la place d’études et vérifier que la formation nécessite une résidence en Finlande.", ["Admission", "Programme", "Durée"], "https://www.studyinfinland.fi/admissions/student-residence-permit"),
    step("permit", "Permis de séjour étudiant", "Demander le permis Migri pour les études de plus de 90 jours, avec ressources et assurance lorsque requis.", ["Passeport", "Ressources", "Assurance"], "https://migri.fi/en/residence-permit-application-for-studies"),
    step("application", "Dépôt de la demande", "Déposer la demande auprès de Migri et suivre les instructions de vérification d’identité auprès du poste compétent.", ["Formulaire", "Admission", "Biométrie"], "https://finlandabroad.fi/web/usa/residence-permits-to-finland"),
    step("residence", "Entrée et carte de séjour", "Après décision favorable, suivre les instructions d’entrée et de délivrance de la carte.", ["Décision", "Carte", "Adresse"], "https://migri.fi/en/residence-permit-application-for-studies"),
  ]),
  regional("Finlande", "Travail", "https://migri.fi/en/residence-permit-for-an-employed-person", [
    step("offer", "Emploi et employeur", "Vérifier le contrat et l’employeur finlandais ou opérant en Finlande avant la demande.", ["Employeur", "Contrat", "Fonction"], "https://migri.fi/en/residence-permit-for-an-employed-person"),
    step("permit", "Permis fondé sur l’emploi", "Déterminer le type de permis de séjour et les éventuelles conditions liées au marché du travail.", ["Passeport", "Qualification", "Salaire"], "https://migri.fi/en/residence-permit-for-an-employed-person"),
    step("application", "Dépôt auprès de Migri", "Déposer la demande, fournir les pièces et accomplir la vérification d’identité auprès du poste compétent.", ["Formulaire", "Contrat", "Biométrie"], "https://finlandabroad.fi/web/usa/residence-permits-to-finland"),
    step("employment", "Début autorisé de l’emploi", "Ne commencer l’activité qu’après délivrance du permis et selon les limites de la décision.", ["Permis", "Employeur", "Carte"], "https://migri.fi/en/residence-permit-for-an-employed-person"),
  ]),
  regional("Norvège", "Visiteur", "https://www.norway.no/en/usa/services-info/visitors-visa-res-permit/visitors-visa/", [
    step("visa_c", "Vérifier le visa visiteur C", "Déterminer si la Norvège est la destination principale du séjour Schengen et si un visa est requis.", ["Nationalité", "Itinéraire", "Dates"], "https://www.norway.no/en/usa/services-info/visitors-visa-res-permit/visitors-visa/"),
    step("documents", "Préparer les justificatifs", "Réunir le formulaire, le passeport, l’assurance, l’itinéraire et les pièces exigées par la checklist officielle.", ["Formulaire", "Passeport", "Assurance", "Hébergement"], "https://www.norway.no/en/usa/services-info/visitors-visa-res-permit/visitors-visa/"),
    step("appointment", "Enregistrement et dépôt", "Enregistrer la demande en ligne, payer les frais applicables et déposer les documents avec biométrie lorsque requis.", ["Portail", "Rendez-vous", "Biométrie"], "https://www.norway.no/en/usa/services-info/visitors-visa-res-permit/visitors-visa/"),
    step("decision", "Suivi de la décision", "Suivre la décision auprès du consulat ou du centre compétent et respecter les limites du visa.", ["Référence", "Notifications"], "https://www.norway.no/en/usa/services-info/visitors-visa-res-permit/visitors-visa/"),
  ]),
  regional("Norvège", "Études", "https://www.udi.no/en/", [
    step("admission", "Admission et catégorie d’études", "Vérifier l’admission et la catégorie de permis d’études applicable auprès de l’UDI.", ["Admission", "Programme", "Durée"], "https://www.udi.no/en/"),
    step("permit", "Permis de séjour pour études", "Pour un séjour long, demander le permis de séjour approprié ; ne pas confondre le visa D d’entrée avec le permis.", ["Passeport", "Ressources", "Assurance"], "https://www.udi.no/en/word-definitions/entry-visas-d-visas/"),
    step("application", "Dépôt et biométrie", "Compléter la demande numérique, utiliser la checklist personnalisée et déposer les pièces au centre ou auprès de la mission compétente.", ["Formulaire", "Checklist UDI", "Rendez-vous"], "https://www.udi.no/en/word-definitions/entry-visas-d-visas/"),
    step("residence", "Entrée et carte de séjour", "Après décision favorable, suivre les instructions d’entrée et de délivrance de la carte de résidence.", ["Décision", "Carte", "Adresse"], "https://www.norway.no/en/usa/services-info/visitors-visa-res-permit/res-permit/"),
  ]),
  regional("Norvège", "Travail", "https://www.norway.no/en/usa/services-info/visitors-visa-res-permit/res-permit/", [
    step("offer", "Offre et catégorie de travail", "Vérifier le contrat, la catégorie d’emploi et le besoin de permis de travail ou de séjour.", ["Employeur", "Contrat", "Qualification"], "https://www.norway.no/en/usa/services-info/visitors-visa-res-permit/res-permit/"),
    step("permit", "Permis UDI", "Déterminer le permis de séjour pour travail applicable ; un visa D seul ne confère pas les droits du permis.", ["Passeport", "Contrat", "Ressources"], "https://www.udi.no/en/word-definitions/entry-visas-d-visas/"),
    step("application", "Dépôt de la demande", "Enregistrer la demande, réunir la checklist personnalisée et déposer les documents auprès de la mission ou du centre compétent.", ["Formulaire", "Checklist UDI", "Biométrie"], "https://www.norway.no/en/usa/services-info/visitors-visa-res-permit/res-permit/"),
    step("employment", "Début autorisé de l’activité", "Ne commencer l’emploi qu’après délivrance du permis et selon les limites de la décision.", ["Permis", "Contrat", "Carte"], "https://www.norway.no/en/usa/services-info/visitors-visa-res-permit/res-permit/"),
  ]),
  regional("Suède", "Visiteur", "https://www.government.se/government-policy/migration-and-asylum/information-on-visas/", [
    step("visa_schengen", "Vérifier le visa Schengen", "Déterminer si un visa est requis et si la Suède est la destination principale du court séjour.", ["Nationalité", "Itinéraire", "Dates"], "https://www.government.se/government-policy/migration-and-asylum/information-on-visas/"),
    step("documents", "Préparer les justificatifs", "Réunir les pièces demandées par la mission suédoise ou le pays Schengen représentant la Suède.", ["Passeport", "Motif", "Hébergement", "Assurance"], "https://www.government.se/government-policy/migration-and-asylum/information-on-visas/"),
    step("appointment", "Dépôt de demande", "Déposer la demande auprès de l’ambassade, du consulat ou du représentant compétent selon le lieu de résidence.", ["Formulaire", "Rendez-vous", "Biométrie"], "https://www.government.se/government-policy/migration-and-asylum/information-on-visas/"),
    step("decision", "Suivi de décision", "Suivre la décision et respecter la durée et les conditions indiquées par l’autorité compétente.", ["Référence", "Notifications"], "https://www.government.se/government-policy/migration-and-asylum/information-on-visas/"),
  ]),
  regional("Suède", "Études", "https://www.migrationsverket.se/en/you-want-to-apply/study/higher-education.html", [
    step("admission", "Admission finale", "Obtenir l’admission finale à un programme à temps plein et vérifier les éventuels frais exigibles.", ["Admission", "Programme", "Durée"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-sweden_en"),
    step("permit", "Permis d’études", "Pour des études de plus de trois mois, demander le permis de séjour avant le départ lorsque requis.", ["Passeport", "Assurance", "Ressources"], "https://www.migrationsverket.se/en/you-want-to-apply/study/higher-education.html"),
    step("application", "Dépôt auprès de la Migration Agency", "Déposer en ligne ou auprès de la représentation compétente avec les documents exigés.", ["Formulaire", "Admission", "Preuves financières"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-sweden_en"),
    step("study_rights", "Droits pendant les études", "Vérifier les conditions d’activité et de renouvellement liées au permis obtenu.", ["Permis", "Inscription", "Renouvellement"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-sweden_en"),
  ]),
  regional("Suède", "Travail", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/highly-qualified-worker-sweden_en", [
    step("offer", "Offre d’emploi écrite", "Vérifier l’offre, les conditions d’emploi et les obligations de l’employeur avant la demande.", ["Offre", "Salaire", "Conditions"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/highly-qualified-worker-sweden_en"),
    step("permit", "Permis de travail et de séjour", "Déterminer le permis applicable, notamment les voies générales, carte bleue ou transfert intra-groupe si pertinent.", ["Employeur", "Qualification", "Passeport"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/highly-qualified-worker-sweden_en"),
    step("application", "Dépôt de la demande", "Déposer en ligne auprès de la Migration Agency ou auprès de la représentation compétente depuis le pays autorisé.", ["Formulaire", "Contrat", "Pièces"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/highly-qualified-worker-sweden_en"),
    step("employment", "Début autorisé de l’emploi", "Ne commencer l’activité qu’après délivrance du permis et selon ses limites de profession/employeur.", ["Permis", "Contrat", "Employeur"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/highly-qualified-worker-sweden_en"),
  ]),
  regional("Pologne", "Visiteur", "https://www.gov.pl/web/usa-en/visas---general-information", [
    step("visa_c", "Vérifier le visa C", "Déterminer si la Pologne est la destination unique ou principale et si le séjour reste dans la limite Schengen applicable.", ["Nationalité", "Itinéraire", "Dates"], "https://www.gov.pl/web/usa-en/visas---general-information"),
    step("documents", "Préparer les justificatifs", "Réunir le formulaire, le passeport, la photo, l’assurance et les pièces de séjour demandées par le consulat compétent.", ["Formulaire", "Passeport", "Assurance", "Hébergement"], "https://www.gov.pl/web/usa-en/visas---general-information"),
    step("appointment", "Rendez-vous et biométrie", "Réserver selon le canal consulaire officiel et déposer les éléments en personne lorsque requis.", ["e-Konsulat", "Rendez-vous", "Biométrie"], "https://secure2.e-konsulat.gov.pl/"),
    step("decision", "Suivi de la demande", "Suivre la décision et respecter les conditions d’entrée ; le visa ne garantit pas l’admission à la frontière.", ["Référence", "Notifications"], "https://www.gov.pl/web/usa-en/visas---general-information"),
  ]),
  regional("Pologne", "Études", "https://study.gov.pl/visa-application", [
    step("admission", "Admission dans un établissement", "Obtenir la confirmation d’admission et vérifier le statut de l’établissement et la durée des études.", ["Admission", "Programme", "Durée"], "https://study.gov.pl/visa-application"),
    step("visa_d", "Visa national D", "Pour un séjour long, préparer une demande D et suivre les instructions de la représentation compétente.", ["Formulaire", "Passeport", "Photo", "Assurance"], "https://www.gov.pl/web/usa-en/d-type-national-visa"),
    step("appointment", "Dépôt e-Konsulat", "Réserver le rendez-vous, imprimer et signer la demande, puis déposer les pièces et la biométrie selon les règles applicables.", ["e-Konsulat", "Admission", "Ressources"], "https://study.gov.pl/visa-application"),
    step("residence", "Titre temporaire après arrivée", "Avant l’expiration du visa, vérifier la demande de titre temporaire auprès du voïvode compétent.", ["Adresse", "Inscription", "Titre"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-poland_en"),
  ]),
  regional("Pologne", "Travail", "https://www.gov.pl/web/usa-en/d-type-national-visa", [
    step("work_authorisation", "Autorisation professionnelle", "Vérifier le permis de travail ou le justificatif de statut qui permet l’activité envisagée.", ["Employeur", "Permis", "Contrat"], "https://www.gov.pl/web/usa-en/d-type-national-visa"),
    step("visa_d", "Visa national D", "Déposer la demande auprès de la mission compétente avec l’autorisation de travail lorsque celle-ci est requise.", ["Formulaire", "Passeport", "Assurance", "Permis"], "https://www.gov.pl/web/usa-en/d-type-national-visa"),
    step("appointment", "Dépôt en personne", "Utiliser le canal de rendez-vous officiel et respecter la compétence territoriale du consulat.", ["e-Konsulat", "Rendez-vous", "Biométrie"], "https://secure2.e-konsulat.gov.pl/"),
    step("employment", "Début d’activité autorisé", "Ne présenter le début de l’emploi qu’après confirmation du visa, du permis et des conditions du contrat.", ["Visa", "Permis", "Contrat"], "https://www.gov.pl/web/usa-en/d-type-national-visa"),
  ]),
  regional("Autriche", "Visiteur", "https://www.bmeia.gv.at/en/travel-stay/entrance-and-residence-in-austria/visa", [
    step("visa_c", "Vérifier le visa C", "Pour un court séjour touristique, de visite ou d’affaires sans activité lucrative, vérifier le visa Schengen C et la durée autorisée.", ["Nationalité", "Dates", "Motif"], "https://www.bmeia.gv.at/en/travel-stay/entrance-and-residence-in-austria/visa"),
    step("documents", "Préparer les justificatifs", "Réunir les pièces exactes demandées par la représentation autrichienne compétente.", ["Passeport", "Hébergement", "Ressources", "Assurance"], "https://www.bmeia.gv.at/en/travel-stay/entrance-and-residence-in-austria/visa"),
    step("appointment", "Dépôt et biométrie", "Prendre rendez-vous dans le canal officiel et déposer personnellement le dossier si requis.", ["Formulaire", "Rendez-vous", "Biométrie"], "https://www.bmeia.gv.at/en/travel-stay/entrance-and-residence-in-austria/visa"),
    step("decision", "Suivi de décision", "Suivre la demande auprès de la représentation compétente et respecter les conditions de la décision.", ["Référence", "Notifications"], "https://www.bmeia.gv.at/en/travel-stay/entrance-and-residence-in-austria/visa"),
  ]),
  regional("Autriche", "Études", "https://www.bmeia.gv.at/en/austrian-embassy-baku/travels-to-austria/study-in-austria", [
    step("admission", "Admission ou inscription", "Obtenir l’admission dans l’établissement et confirmer la durée du programme.", ["Admission", "Programme", "Durée"], "https://www.bmeia.gv.at/en/austrian-embassy-baku/travels-to-austria/study-in-austria"),
    step("visa_type", "Choisir visa C ou D", "Vérifier selon la durée si un visa C, un visa D ou un titre de séjour est nécessaire.", ["Durée", "Nationalité", "Programme"], "https://www.bmeia.gv.at/en/travel-stay/entrance-and-residence-in-austria/visa"),
    step("application", "Dépôt de la demande", "Présenter le dossier auprès de la représentation compétente avec les documents exigés.", ["Passeport", "Admission", "Ressources", "Assurance"], "https://www.bmeia.gv.at/en/austrian-embassy-baku/travels-to-austria/study-in-austria"),
    step("permit", "Titre de séjour et activité", "Vérifier le titre de séjour et toute autorisation nécessaire ; l’activité professionnelle pendant les études n’est pas automatique.", ["Titre", "Autorisation de travail si applicable"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-austria_en"),
  ]),
  regional("Autriche", "Travail", "https://www.migration.gv.at/en/types-of-immigration/permanent-immigration/very-highly-qualified-workers/", [
    step("qualification", "Vérifier la voie de travail", "Déterminer si le projet relève d’une carte de séjour, d’un régime de travailleurs qualifiés ou d’un visa de recherche d’emploi.", ["Qualification", "Offre", "Nationalité"], "https://www.migration.gv.at/en/"),
    step("authorisation", "Autorisation et titre", "Réunir les conditions d’autorisation de travail et de résidence applicables à la catégorie retenue.", ["Employeur", "Qualification", "Contrat"], "https://www.migration.gv.at/en/types-of-immigration/permanent-immigration/very-highly-qualified-workers/"),
    step("application", "Dépôt auprès de l’autorité compétente", "Déposer la demande auprès de la représentation ou de l’autorité compétente selon le dossier.", ["Formulaire", "Passeport", "Pièces"], "https://www.bmeia.gv.at/en/travel-stay/entrance-and-residence-in-austria/visa"),
    step("employment", "Début d’activité autorisé", "Ne présenter le début du travail qu’après obtention des autorisations et du titre requis.", ["Titre", "Autorisation", "Contrat"], "https://www.migration.gv.at/en/types-of-immigration/permanent-immigration/very-highly-qualified-workers/"),
  ]),
  regional("Portugal", "Visiteur", "https://newark.consuladoportugal.mne.gov.pt/en/consular-matters/visa", [
    step("visa_type", "Vérifier le type de séjour", "Distinguer court séjour Schengen, séjour temporaire et visa de résidence selon la durée et le motif.", ["Nationalité", "Dates", "Motif"], "https://vistos.mne.gov.pt/en/national-visas/general-information/type-of-visa"),
    step("documents", "Préparer les justificatifs", "Réunir les pièces générales et les pièces propres à la catégorie auprès du poste compétent.", ["Formulaire", "Passeport", "Assurance", "Ressources"], "https://newark.consuladoportugal.mne.gov.pt/en/consular-matters/visa"),
    step("appointment", "Dépôt en personne", "Prendre le rendez-vous officiel et déposer la demande selon la compétence territoriale du consulat.", ["Rendez-vous", "Dossier complet", "Entretien si requis"], "https://newark.consuladoportugal.mne.gov.pt/en/consular-matters/visa"),
    step("decision", "Suivi et décision", "Suivre la demande dans le canal officiel et respecter les conditions de la décision.", ["Référence", "Notifications"], "https://vistos.mne.gov.pt/en/"),
  ]),
  regional("Portugal", "Études", "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-portugal_en", [
    step("admission", "Admission dans un établissement", "Obtenir l’admission dans un établissement reconnu avant la demande de visa de résidence.", ["Admission", "Programme", "Durée"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-portugal_en"),
    step("residence_visa", "Visa de résidence étudiant", "Déposer la demande auprès de l’ambassade ou du consulat du pays d’origine ou de résidence.", ["Passeport", "Admission", "Ressources", "Assurance"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-portugal_en"),
    step("permit", "Permis de séjour", "Après l’entrée, vérifier la demande de permis de séjour auprès de l’autorité compétente et les documents propres au niveau d’études.", ["Adresse", "Inscription", "Permis"], "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/student-portugal_en"),
    step("decision", "Suivi du titre", "Conserver les preuves de dépôt et suivre la validité et le renouvellement du permis selon la décision.", ["Récépissé", "Titre", "Renouvellement"], "https://vistos.mne.gov.pt/en/national-visas/general-information/type-of-visa"),
  ]),
  regional("Portugal", "Travail", "https://vistos.mne.gov.pt/en/national-visas/general-information/type-of-visa", [
    step("visa_type", "Choisir le visa de travail", "Vérifier si le projet relève d’un séjour temporaire, d’une résidence ou d’un régime de recherche d’emploi qualifié.", ["Offre ou projet", "Durée", "Qualification"], "https://vistos.mne.gov.pt/en/national-visas/general-information/type-of-visa"),
    step("employer_documents", "Préparer les éléments professionnels", "Réunir le contrat ou les documents professionnels et les justificatifs demandés par le poste compétent.", ["Contrat", "Employeur", "Qualifications"], "https://newark.consuladoportugal.mne.gov.pt/en/consular-matters/visa"),
    step("application", "Visa et dépôt", "Déposer la demande auprès du poste compétent selon les modalités et la catégorie publiées.", ["Formulaire", "Passeport", "Assurance", "Ressources"], "https://vistos.mne.gov.pt/en/"),
    step("residence", "Formalités après arrivée", "Pour un visa de résidence, vérifier la demande de permis auprès d’AIMA et ne pas présenter l’emploi comme acquis avant les autorisations.", ["Entrée", "Adresse", "Permis de séjour"], "https://vistos.mne.gov.pt/en/national-visas/general-information/type-of-visa"),
  ]),
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
  regional("Türkiye", "Visiteur", "https://www.mfa.gov.tr/visa-information-for-foreigners.en.mfa", [
    step("visa_check", "Vérifier le régime d’entrée", "Vérifier la nationalité, le passeport, la durée et l’éligibilité éventuelle à l’exemption ou à l’e-Visa sur les portails officiels.", ["Nationalité", "Passeport", "Dates", "Motif"], "https://www.mfa.gov.tr/visa-information-for-foreigners.en.mfa"),
    step("visa_application", "Demande de visa ou e-Visa", "Si nécessaire, utiliser l’e-Visa officiel ou déposer une demande auprès de la représentation turque compétente.", ["Formulaire", "Passeport", "Justificatifs", "Frais"], "https://www.mfa.gov.tr/general-information-about-turkish-visas.en.mfa"),
    step("entry_conditions", "Conditions d’entrée et de séjour", "Respecter la validité du passeport, l’assurance et les limites de séjour applicables ; un visa ne garantit pas l’entrée.", ["Passeport", "Assurance", "Hébergement", "Référence"], "https://www.mfa.gov.tr/general-information-about-turkish-visas.en.mfa"),
    step("decision", "Décision et entrée", "Suivre la décision, conserver les justificatifs et respecter la limite de séjour accordée.", ["Décision", "Passeport", "Notifications"], "https://www.mfa.gov.tr/visa-information-for-foreigners.en.mfa"),
  ]),
  regional("Türkiye", "Études", "https://en.goc.gov.tr/residence-permit-types", [
    step("admission", "Admission ou programme officiel", "Obtenir l’admission ou l’inscription dans un programme reconnu et réunir le document justifiant le motif d’études.", ["Admission", "Programme", "Passeport"], "https://en.goc.gov.tr/residence-permit-types"),
    step("student_visa_check", "Vérifier le visa étudiant", "Déterminer auprès de la représentation turque si un visa étudiant/éducation est nécessaire avant l’entrée selon la nationalité et le programme.", ["Nationalité", "Admission", "Formulaire"], "https://www.mfa.gov.tr/general-information-about-turkish-visas.en.mfa"),
    step("residence_application", "Demande de résidence pour études", "Déposer la demande de résidence selon le motif et les conditions de l’autorité turque compétente.", ["Admission", "Assurance", "Ressources", "Adresse"], "https://en.goc.gov.tr/residence-permit-types"),
    step("study_maintenance", "Maintien du statut étudiant", "Respecter les obligations du programme, du titre et du renouvellement ; un titre étudiant ne vaut pas automatiquement autorisation de travail.", ["Inscription", "Titre", "Échéances"], "https://en.goc.gov.tr/work-permit"),
  ]),
  regional("Türkiye", "Travail", "https://www.csgb.gov.tr/uigm/en/general-information/information-and-documents-required-in-the-work-permit-evaluation-process/", [
    step("employment_basis", "Contrat et employeur", "Obtenir un contrat signé et confirmer l’employeur, le poste et les qualifications avant la demande.", ["Contrat", "Employeur", "Passeport", "Diplôme"], "https://www.csgb.gov.tr/uigm/en/general-information/information-and-documents-required-in-the-work-permit-evaluation-process/"),
    step("visa_application", "Visa de travail auprès de la mission", "Déposer la demande de permis et de visa auprès de la représentation turque, sauf si la voie de demande intérieure est légalement applicable.", ["Formulaire", "Passeport", "Contrat", "Lettre employeur"], "https://www.mfa.gov.tr/general-information-about-turkish-visas.en.mfa"),
    step("employer_submission", "Dossier employeur en ligne", "L’employeur transmet en ligne les documents requis au ministère du Travail et de la Sécurité sociale selon le système officiel.", ["Contrat", "Registre", "Documents employeur", "Diplôme"], "https://www.csgb.gov.tr/uigm/en/general-information/information-and-documents-required-in-the-work-permit-evaluation-process/"),
    step("permit_decision", "Décision du permis", "Attendre la décision du ministère ; le permis de travail remplace le titre de séjour pendant sa validité selon les règles officielles.", ["Décision", "Permis", "Référence"], "https://en.goc.gov.tr/work-permit"),
    step("arrival_registration", "Entrée et enregistrement", "Après l’entrée, respecter l’enregistrement auprès de la direction provinciale de la Migration Management et les conditions de l’emploi.", ["Adresse", "Permis", "Employeur", "Échéances"], "https://en.goc.gov.tr/work-permit"),
  ]),
  regional("Royaume-Uni", "Visiteur", "https://www.gov.uk/standard-visitor/apply-standard-visitor-visa", [
    step("visa_check", "Vérifier visa, ETA ou exemption", "Vérifier la nationalité et déterminer si une demande de Standard Visitor visa, une ETA ou une exemption s’applique.", ["Nationalité", "Passeport", "Motif", "Dates"], "https://www.gov.uk/standard-visitor/apply-standard-visitor-visa"),
    step("online_application", "Demande en ligne", "Remplir la demande officielle avant le voyage et fournir les informations sur le séjour et les ressources.", ["Formulaire", "Hébergement", "Ressources", "Historique"], "https://www.gov.uk/standard-visitor/apply-standard-visitor-visa"),
    step("biometrics", "Identité et justificatifs", "Prendre le rendez-vous requis dans un centre de visa et fournir passeport, biométrie et documents d’éligibilité.", ["Passeport", "Rendez-vous", "Biométrie", "Justificatifs"], "https://www.gov.uk/standard-visitor/apply-standard-visitor-visa"),
    step("decision", "Décision et séjour autorisé", "Suivre la décision et respecter uniquement les activités autorisées par le statut accordé.", ["Référence", "Notifications", "Conditions"], "https://www.gov.uk/standard-visitor/apply-standard-visitor-visa"),
  ]),
  regional("Royaume-Uni", "Études", "https://www.gov.uk/student-visa", [
    step("sponsor_admission", "Admission avec sponsor agréé", "Obtenir une place sur un cursus proposé par un sponsor étudiant agréé et le document de confirmation requis.", ["Admission", "Sponsor", "Programme", "Passeport"], "https://www.gov.uk/student-visa"),
    step("eligibility", "Conditions financières et linguistiques", "Vérifier les conditions de ressources, d’anglais, d’âge et de consentement parental lorsqu’elles s’appliquent.", ["Ressources", "Anglais", "Identité", "Consentement"], "https://www.gov.uk/student-visa"),
    step("online_application", "Demande de Student visa", "Déposer la demande dans la fenêtre officielle, payer les frais applicables et vérifier les modalités de séjour.", ["Formulaire", "Passeport", "Confirmation", "Frais"], "https://www.gov.uk/student-visa"),
    step("identity_decision", "Identité et décision", "Fournir l’identité et les documents demandés, puis respecter les droits d’études et de travail indiqués dans la décision.", ["Biométrie", "Documents", "Décision", "Conditions"], "https://www.gov.uk/student-visa"),
  ]),
  regional("Royaume-Uni", "Travail", "https://www.gov.uk/skilled-worker-visa", [
    step("confirmed_offer", "Offre d’emploi confirmée", "Obtenir une offre d’emploi dans un métier éligible auprès d’un employeur approuvé par le Home Office.", ["Employeur", "Poste", "Contrat", "Salaire"], "https://www.gov.uk/skilled-worker-visa"),
    step("sponsorship", "Certificate of Sponsorship", "Faire confirmer par l’employeur le Certificate of Sponsorship et les informations du poste.", ["CoS", "Employeur", "Référence", "Poste"], "https://www.gov.uk/skilled-worker-visa"),
    step("eligibility", "Éligibilité et anglais", "Vérifier le métier éligible, le salaire applicable et la preuve de connaissance de l’anglais selon le dossier.", ["Occupation", "Salaire", "Anglais", "Passeport"], "https://www.gov.uk/skilled-worker-visa"),
    step("online_application", "Demande et identité", "Déposer la demande en ligne, fournir l’identité et les documents requis, puis attendre la décision.", ["Formulaire", "Biométrie", "Documents", "Décision"], "https://www.gov.uk/skilled-worker-visa"),
  ]),
  regional("États-Unis", "Visiteur", "https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html/visa", [
    step("visa_category", "Catégorie B-1/B-2", "Vérifier que le motif relève du visiteur et ne constitue ni un emploi ni des études diplômantes.", ["Motif", "Durée", "Passeport"], "https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html/visa"),
    step("ds160", "Formulaire DS-160", "Remplir la demande non-immigrant en ligne et conserver la page de confirmation.", ["DS-160", "Photo", "Passeport"], "https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html/visa"),
    step("interview", "Rendez-vous et biométrie", "Prendre rendez-vous auprès du poste compétent, fournir les justificatifs et passer l’entretien lorsque requis.", ["Rendez-vous", "Biométrie", "Ressources", "Attaches"], "https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html/visa"),
    step("decision_entry", "Décision et admission", "Suivre la décision ; le visa permet de demander l’admission mais ne garantit pas l’entrée, décidée au port d’arrivée.", ["Décision", "Passeport", "I-94", "Conditions"], "https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html/visa"),
  ]),
  regional("États-Unis", "Études", "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html", [
    step("sevp_admission", "Admission dans une école SEVP", "Obtenir l’acceptation d’un établissement approuvé et l’inscription dans le système SEVIS.", ["Admission", "SEVP", "SEVIS"], "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html"),
    step("i20", "Formulaire I-20", "Recevoir le Form I-20 de l’établissement et payer la redevance SEVIS I-901 selon les instructions officielles.", ["I-20", "SEVIS", "Frais"], "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html"),
    step("ds160", "DS-160 et entretien", "Remplir le DS-160, fournir la photo et prendre rendez-vous auprès de la mission compétente.", ["DS-160", "Passeport", "Rendez-vous", "Photo"], "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html"),
    step("decision_entry", "Décision et entrée", "Présenter les documents requis et respecter les conditions F ou M après la décision et à l’entrée.", ["I-20", "Visa", "Biométrie", "Décision"], "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html"),
  ]),
  regional("États-Unis", "Travail", "https://travel.state.gov/content/travel/en/us-visas/employment/temporary-worker-visas.html", [
    step("category", "Catégorie de travail temporaire", "Identifier la catégorie adaptée au poste et à la durée du travail temporaire.", ["Poste", "Durée", "Employeur", "Qualification"], "https://travel.state.gov/content/travel/en/us-visas/employment/temporary-worker-visas.html"),
    step("petition", "Pétition employeur USCIS", "Faire approuver la pétition employeur requise, généralement le Form I-129, avant la demande de visa.", ["Employeur", "I-129", "USCIS", "Receipt"], "https://travel.state.gov/content/travel/en/us-visas/employment/temporary-worker-visas.html"),
    step("ds160", "DS-160 et rendez-vous", "Après approbation, remplir le DS-160, payer les frais applicables et prendre le rendez-vous consulaire.", ["DS-160", "Pétition", "Passeport", "Rendez-vous"], "https://travel.state.gov/content/travel/en/us-visas/employment/temporary-worker-visas.html"),
    step("decision_entry", "Décision et admission", "Fournir biométrie et pièces, suivre la décision et comprendre que l’admission finale relève du CBP au port d’entrée.", ["Biométrie", "Décision", "I-797", "I-94"], "https://travel.state.gov/content/travel/en/us-visas/employment/temporary-worker-visas.html"),
  ]),
  regional("Australie", "Visiteur", "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/visitor-600/tourist-stream-overseas", [
    step("visa_option", "Vérifier la sous-classe", "Vérifier la nationalité et déterminer si la sous-classe 600, l’ETA 601 ou l’eVisitor 651 est adaptée.", ["Nationalité", "Passeport", "Motif", "Dates"], "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/visitor-600/tourist-stream-overseas"),
    step("genuine_visitor", "Visiteur authentique", "Démontrer une visite temporaire, des ressources suffisantes et l’intention de respecter les conditions ; le travail est interdit.", ["Ressources", "Projet de séjour", "Retour", "Hébergement"], "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/visitor-600/tourist-stream-overseas"),
    step("online_application", "Demande Home Affairs", "Préparer les documents d’identité et justificatifs, puis déposer la demande selon le canal officiel.", ["Passeport", "Traductions", "Justificatifs", "ImmiAccount"], "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/visitor-600/tourist-stream-overseas"),
    step("decision_conditions", "Décision et conditions", "Suivre la décision et respecter la durée et les conditions figurant dans la notification de visa.", ["Décision", "Conditions", "Assurance", "Référence"], "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/visitor-600/tourist-stream-overseas"),
  ]),
  regional("Australie", "Études", "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500", [
    step("course_enrolment", "Inscription à un cursus éligible", "Choisir un cursus éligible et obtenir une Confirmation of Enrolment (CoE) valide.", ["Admission", "CoE", "CRICOS", "Passeport"], "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500"),
    step("health_cover", "Couverture et conditions étudiant", "Préparer l’OSHC, les justificatifs de santé/caractère et les dispositions de bien-être pour un mineur si nécessaire.", ["OSHC", "Santé", "Casier", "Welfare"], "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500"),
    step("online_application", "Demande de Student visa 500", "Déposer la demande en ligne avec le CoE et les documents requis selon les règles applicables au dossier.", ["ImmiAccount", "CoE", "Ressources", "Documents"], "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500"),
    step("decision_obligations", "Décision et obligations", "Suivre la décision et respecter les conditions du visa, dont les limites de travail et de séjour.", ["Décision", "Conditions", "Études", "Échéances"], "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500"),
  ]),
  regional("Australie", "Travail", "https://immi.homeaffairs.gov.au/Visa-subsite/Pages/work/explore-visa-options-work.aspx", [
    step("work_finder", "Sélection officielle de la voie", "Utiliser le visa finder Home Affairs selon la durée, le métier, la qualification et le besoin éventuel de sponsor.", ["Métier", "Durée", "Qualification", "Sponsor"], "https://immi.homeaffairs.gov.au/Visa-subsite/Pages/work/explore-visa-options-work.aspx"),
    step("occupation_check", "Vérifier la profession et les conditions", "Confirmer que la profession, les compétences et la voie sélectionnée satisfont les exigences de la sous-classe concernée.", ["Occupation", "Compétences", "Évaluation", "Anglais"], "https://immi.homeaffairs.gov.au/Visa-subsite/Pages/work/explore-visa-options-work.aspx"),
    step("sponsor_or_nomination", "Sponsor ou nomination si requis", "Réunir la nomination, le sponsor ou les éléments de points exigés par la sous-classe retenue.", ["Employeur", "Nomination", "Invitation", "Référence"], "https://immi.homeaffairs.gov.au/Visa-subsite/Pages/work/explore-visa-options-work.aspx"),
    step("online_application", "Demande et décision", "Déposer la demande selon Home Affairs, fournir les pièces et respecter les conditions du visa accordé.", ["ImmiAccount", "Passeport", "Santé", "Décision"], "https://immi.homeaffairs.gov.au/Visa-subsite/Pages/work/explore-visa-options-work.aspx"),
  ]),
  regional("Japon", "Visiteur", "https://www.mofa.go.jp/j_info/visit/visa/index.html", [
    step("short_stay_check", "Vérifier le court séjour", "Vérifier la nationalité, la durée et le motif ; le court séjour ne couvre pas le travail rémunéré.", ["Nationalité", "Motif", "Durée", "Passeport"], "https://www.mofa.go.jp/j_info/visit/visa/index.html"),
    step("mission_requirements", "Instructions de la mission compétente", "Consulter l’ambassade, le consulat ou le centre compétent pour les documents et le mode de dépôt applicables au lieu de résidence.", ["Mission", "Formulaire", "Photo", "Pièces"], "https://www.mofa.go.jp/j_info/visit/visa/index.html"),
    step("application", "Dépôt de la demande", "Préparer les pièces et déposer la demande auprès de la mission, d’une agence accréditée, d’un centre ou en ligne si autorisé.", ["Passeport", "Itinéraire", "Justificatifs", "Rendez-vous"], "https://www.mofa.go.jp/j_info/visit/visa/index.html"),
    step("decision_entry", "Décision et entrée", "Suivre la décision ; le visa est une condition d’entrée mais ne garantit pas la permission d’atterrir, accordée au contrôle frontalier.", ["Décision", "Visa", "Passeport", "Conditions"], "https://www.mofa.go.jp/j_info/visit/visa/index.html"),
  ]),
  regional("Japon", "Études", "https://www.mofa.go.jp/j_info/visit/visa/long/visa6.html", [
    step("school_admission", "Admission et activité d’études", "Obtenir l’admission dans un établissement et confirmer la nature du programme étudiant.", ["Admission", "Programme", "Établissement", "Passeport"], "https://www.mofa.go.jp/j_info/visit/visa/long/visa6.html"),
    step("coe", "Certificate of Eligibility", "Obtenir en principe le COE délivré par l’autorité régionale de l’Immigration Services Agency avant la demande de visa.", ["COE", "Établissement", "Identité", "Programme"], "https://www.mofa.go.jp/j_info/visit/visa/long/visa6.html"),
    step("visa_application", "Demande de visa étudiant", "Présenter passeport, formulaire, photo et COE à la mission compétente ; des pièces additionnelles peuvent dépendre de la nationalité.", ["Passeport", "Formulaire", "Photo", "COE"], "https://www.mofa.go.jp/j_info/visit/visa/long/visa6.html"),
    step("decision_entry", "Décision et statut de résidence", "Suivre la décision et respecter le statut de résidence étudiant accordé après l’entrée.", ["Décision", "Visa", "Statut", "Échéances"], "https://www.mofa.go.jp/j_info/visit/visa/long/visa6.html"),
  ]),
  regional("Japon", "Travail", "https://www.mofa.go.jp/j_info/visit/visa/long/index.html", [
    step("work_category", "Catégorie professionnelle", "Identifier la catégorie officielle correspondant à l’activité : ingénieur, services spécialisés, chercheur, travailleur qualifié, etc.", ["Poste", "Employeur", "Qualification", "Activité"], "https://www.mofa.go.jp/j_info/visit/visa/long/index.html"),
    step("coe", "Certificate of Eligibility", "Obtenir en principe le COE auprès de l’autorité régionale de l’Immigration Services Agency avant la demande de visa long séjour.", ["COE", "Employeur", "Contrat", "Qualification"], "https://www.mofa.go.jp/j_info/visit/visa/long/index.html"),
    step("visa_application", "Demande auprès de la mission", "Présenter les documents de la catégorie retenue, le passeport, le formulaire, la photo et le COE lorsque requis.", ["Passeport", "Formulaire", "Photo", "COE"], "https://www.mofa.go.jp/j_info/visit/visa/long/index.html"),
    step("decision_entry", "Décision et statut autorisé", "Suivre la décision et exercer uniquement l’activité correspondant au statut de résidence accordé.", ["Décision", "Visa", "Statut", "Employeur"], "https://www.mofa.go.jp/j_info/visit/visa/long/index.html"),
  ]),
  regional("Nouvelle-Zélande", "Visiteur", "https://www.immigration.govt.nz/visas/visitor-visa/", [
    step("visa_or_nzeta", "Vérifier Visa ou NZeTA", "Déterminer selon la nationalité si un Visitor Visa ou une NZeTA est nécessaire pour le séjour projeté.", ["Nationalité", "Passeport", "Motif", "Dates"], "https://www.immigration.govt.nz/visas/visitor-visa/"),
    step("genuine_intentions", "Visiteur authentique et ressources", "Démontrer le motif temporaire, les ressources ou le sponsor acceptable et la capacité à quitter la Nouvelle-Zélande.", ["Ressources", "Hébergement", "Retour", "Sponsor"], "https://www.immigration.govt.nz/visas/visitor-visa/"),
    step("online_application", "Demande Immigration New Zealand", "Déposer la demande en ligne avec identité, photo, justificatifs financiers, itinéraire et traductions si requises.", ["Formulaire", "Passeport", "Photo", "Justificatifs"], "https://www.immigration.govt.nz/visas/visitor-visa/"),
    step("decision_conditions", "Décision et conditions", "Suivre la décision et respecter la durée, les conditions de séjour et l’interdiction de travailler.", ["Décision", "Conditions", "Durée", "Référence"], "https://www.immigration.govt.nz/visas/visitor-visa/"),
  ]),
  regional("Nouvelle-Zélande", "Études", "https://www.immigration.govt.nz/study/study-visas/visas-for-studying-in-new-zealand/", [
    step("offer_of_place", "Offre d’un établissement agréé", "Choisir un établissement et obtenir l’offre de place nécessaire pour la demande de visa étudiant.", ["Admission", "Offre", "Programme", "Passeport"], "https://www.immigration.govt.nz/study/study-visas/visas-for-studying-in-new-zealand/"),
    step("student_option", "Choisir la catégorie étudiant", "Déterminer le visa étudiant adapté au cursus, à sa durée et aux règles de travail ou de voyage applicables.", ["Cursus", "Durée", "Fonds", "Conditions"], "https://www.immigration.govt.nz/study/study-visas/visas-for-studying-in-new-zealand/"),
    step("online_application", "Demande en ligne", "Déposer une demande complète avec l’offre, les pièces justificatives et les informations nécessaires avant le voyage.", ["Formulaire", "Offre", "Ressources", "Documents"], "https://www.immigration.govt.nz/study/study-visas/visas-for-studying-in-new-zealand/"),
    step("decision_obligations", "Décision et obligations étudiant", "Suivre la décision et respecter les conditions du visa, notamment les droits de travail autorisés.", ["Décision", "Conditions", "Études", "Échéances"], "https://www.immigration.govt.nz/study/study-visas/visas-for-studying-in-new-zealand/"),
  ]),
  regional("Nouvelle-Zélande", "Travail", "https://www.immigration.govt.nz/visas/accredited-employer-work-visa/", [
    step("accredited_employer", "Employeur accrédité", "Obtenir une offre d’emploi actuelle d’un employeur accrédité pour l’AEWV.", ["Employeur", "Accréditation", "Poste", "Offre"], "https://www.immigration.govt.nz/visas/accredited-employer-work-visa/"),
    step("job_offer", "Offre d’au moins 30 heures", "Vérifier que l’offre est à temps plein, au moins 30 heures par semaine, avec le job check et les conditions conformes.", ["Contrat", "30 heures", "Job check", "Salaire"], "https://www.immigration.govt.nz/visas/accredited-employer-work-visa/"),
    step("skills_evidence", "Compétences et qualifications", "Fournir les preuves d’expérience ou de qualification, d’enregistrement professionnel, de santé et de caractère selon le poste.", ["Expérience", "Diplôme", "Santé", "Casier"], "https://www.immigration.govt.nz/visas/accredited-employer-work-visa/"),
    step("online_application", "Demande AEWV et décision", "Utiliser le lien de demande transmis par l’employeur, fournir les pièces et respecter les conditions du visa accordé.", ["Lien", "Formulaire", "Contrat", "Décision"], "https://www.immigration.govt.nz/visas/accredited-employer-work-visa/"),
  ]),
  regional("Corée du Sud", "Visiteur", "https://www.visa.go.kr/", [
    step("visa_navigator", "Visa Navigator — court séjour", "Sélectionner la nationalité, le motif et la durée dans le Visa Navigator afin d’identifier la catégorie C-3 ou l’exemption applicable.", ["Nationalité", "Motif", "Durée", "Passeport"], "https://www.visa.go.kr/"),
    step("documents", "Pièces selon la catégorie", "Préparer le formulaire, passeport, photo et justificatifs exigés par la mission ou la catégorie sélectionnée.", ["Formulaire", "Passeport", "Photo", "Justificatifs"], "https://www.visa.go.kr/"),
    step("submission", "Dépôt auprès de la mission", "Déposer la demande selon les instructions de la représentation compétente et suivre les modalités officielles.", ["Mission", "Rendez-vous", "Dépôt", "Référence"], "https://www.visa.go.kr/"),
    step("decision_entry", "Décision et entrée", "Suivre la décision et respecter la durée et le motif autorisés ; ne pas utiliser un court séjour pour travailler ou étudier sans catégorie adaptée.", ["Décision", "Conditions", "Durée", "Entrée"], "https://www.visa.go.kr/"),
  ]),
  regional("Corée du Sud", "Études", "https://www.visa.go.kr/", [
    step("visa_navigator", "Identifier D-2 ou D-4", "Utiliser le Visa Navigator pour distinguer les études universitaires D-2 de la formation ou langue D-4 selon le programme.", ["Programme", "Établissement", "Durée", "Nationalité"], "https://www.visa.go.kr/"),
    step("admission", "Admission dans l’établissement", "Obtenir l’admission et les documents de l’établissement nécessaires à la catégorie de visa retenue.", ["Admission", "Programme", "Établissement", "Passeport"], "https://www.visa.go.kr/"),
    step("application", "Demande de visa étudiant", "Préparer le formulaire, photo, passeport et justificatifs financiers/académiques selon les instructions de la mission.", ["Formulaire", "Photo", "Ressources", "Diplômes"], "https://www.visa.go.kr/"),
    step("decision_residence", "Décision et séjour", "Suivre la décision et effectuer les formalités de séjour auprès de HiKorea lorsqu’elles sont requises.", ["Décision", "HiKorea", "Statut", "Échéances"], "https://www.hikorea.go.kr/Main.pt?locale=en"),
  ]),
  regional("Corée du Sud", "Travail", "https://www.visa.go.kr/", [
    step("work_category", "Catégorie de travail", "Identifier la catégorie officielle correspondant au poste, par exemple E-1 à E-7, via le Visa Navigator et les instructions compétentes.", ["Poste", "Employeur", "Qualification", "Activité"], "https://www.visa.go.kr/"),
    step("employer_documents", "Documents employeur et candidat", "Réunir contrat, recommandation ou documents d’employeur et preuves de qualification selon la catégorie.", ["Contrat", "Employeur", "Diplôme", "Expérience"], "https://www.visa.go.kr/"),
    step("application", "Demande auprès de la mission", "Déposer la demande avec les formulaires et pièces de la catégorie, puis suivre la délivrance ou le numéro de visa.", ["Formulaire", "Passeport", "Photo", "Référence"], "https://www.visa.go.kr/"),
    step("residence_conditions", "Séjour et conditions", "Après la décision, respecter le statut de séjour et les formalités HiKorea ; exercer uniquement l’activité autorisée.", ["Décision", "HiKorea", "Statut", "Employeur"], "https://www.hikorea.go.kr/Main.pt?locale=en"),
  ]),
  regional("Inde", "Visiteur", "https://indianvisaonline.gov.in/evisa/tvoa.html", [
    step("eligibility", "Vérifier l’éligibilité e-Visa", "Vérifier la nationalité, le motif, le passeport et la catégorie e-Tourist ou la demande régulière applicable.", ["Nationalité", "Motif", "Passeport", "Durée"], "https://indianvisaonline.gov.in/evisa/tvoa.html"),
    step("online_application", "Demande e-Visa en ligne", "Remplir la demande et téléverser la photo récente et la page biographique du passeport selon les spécifications officielles.", ["Formulaire", "Photo", "Passeport", "Itinéraire"], "https://indianvisaonline.gov.in/evisa/tvoa.html"),
    step("fee_eta", "Paiement et ETA", "Payer les frais officiels, attendre l’Electronic Travel Authorization et vérifier son statut accordé avant le voyage.", ["Paiement", "ETA", "E-mail", "Statut"], "https://indianvisaonline.gov.in/evisa/tvoa.html"),
    step("arrival", "Voyage et contrôle d’entrée", "Imprimer l’ETA et la présenter au point d’immigration autorisé, avec le même passeport utilisé pour la demande.", ["ETA", "Passeport", "Point d’entrée", "Biométrie"], "https://indianvisaonline.gov.in/evisa/tvoa.html"),
  ]),
  regional("Inde", "Études", "https://indianvisaonline.gov.in/visa/visa-provision.html", [
    step("admission", "Admission dans un établissement indien", "Obtenir la preuve d’admission requise pour la catégorie Student ou e-Student adaptée au programme.", ["Admission", "Établissement", "Programme", "Passeport"], "https://indianvisaonline.gov.in/visa/visa-provision.html"),
    step("visa_category", "Choisir Student ou e-Student", "Vérifier dans les provisions officielles si la durée et le programme permettent l’e-Student ou nécessitent une demande régulière.", ["Durée", "Catégorie", "Nationalité", "Programme"], "https://indianvisaonline.gov.in/visa/visa-provision.html"),
    step("application", "Demande et pièces", "Déposer le formulaire en ligne avec admission, passeport et pièces ; imprimer et signer la demande régulière lorsque nécessaire.", ["Formulaire", "Admission", "Passeport", "Signature"], "https://indianvisaonline.gov.in/visa/"),
    step("submission_decision", "Dépôt et décision", "Déposer auprès du centre ou de la mission indienne compétente et respecter les formalités d’enregistrement si elles s’appliquent.", ["Mission", "Rendez-vous", "Décision", "Enregistrement"], "https://indianvisaonline.gov.in/visa/"),
  ]),
  regional("Inde", "Travail", "https://indianvisaonline.gov.in/visa/visa-provision.html", [
    step("employment_proof", "Preuve d’emploi", "Obtenir une nomination ou un contrat et les preuves d’emploi exigées pour la catégorie Employment.", ["Employeur", "Contrat", "Poste", "Durée"], "https://indianvisaonline.gov.in/visa/visa-provision.html"),
    step("visa_category", "Vérifier la catégorie Employment", "Confirmer la catégorie, la durée et les conditions selon l’emploi et la nationalité du candidat.", ["Catégorie", "Durée", "Qualification", "Nationalité"], "https://indianvisaonline.gov.in/visa/visa-provision.html"),
    step("regular_application", "Demande régulière", "Remplir, imprimer et signer le formulaire, puis joindre passeport, preuve d’emploi et justificatifs demandés.", ["Formulaire", "Signature", "Passeport", "Contrat"], "https://indianvisaonline.gov.in/visa/"),
    step("mission_decision", "Dépôt auprès de la mission", "Déposer au centre de visa ou à la mission indienne compétente et suivre la décision ainsi que les formalités de séjour.", ["IVAC", "Mission", "Décision", "Séjour"], "https://indianvisaonline.gov.in/visa/"),
  ]),
  regional("Afrique du Sud", "Visiteur", "https://dirco.gov.za/washingtondc/types-of-visas-and-requirements/", [
    step("visitor_category", "Choisir la Visitor’s Visa", "Vérifier la durée et le motif du séjour afin de distinguer le court séjour, le séjour de plus de 90 jours ou une autre catégorie officielle.", ["Motif", "Durée", "Passeport", "Nationalité"], "https://dirco.gov.za/washingtondc/types-of-visas-and-requirements/"),
    step("documents", "Préparer les pièces", "Réunir formulaire, passeport, justificatifs du séjour et toute pièce exigée par la mission compétente.", ["Formulaire", "Passeport", "Hébergement", "Ressources"], "https://dirco.gov.za/washingtondc/types-of-visas-and-requirements/"),
    step("submission", "Dépôt de la demande", "Déposer selon les instructions de la représentation sud-africaine ou du service officiel disponible.", ["Mission", "Rendez-vous", "Dépôt", "Référence"], "https://ehome.dha.gov.za/epermit/home"),
    step("decision_conditions", "Décision et conditions", "Respecter la durée et le motif de la Visitor’s Visa accordée ; une autorisation de visite ne vaut pas autorisation générale de travail.", ["Décision", "Durée", "Conditions", "Entrée"], "https://dirco.gov.za/washingtondc/types-of-visas-and-requirements/"),
  ]),
  regional("Afrique du Sud", "Études", "https://dirco.gov.za/washingtondc/types-of-visas-and-requirements/", [
    step("study_admission", "Admission aux études", "Obtenir l’admission ou l’inscription dans l’établissement d’enseignement sud-africain concerné.", ["Admission", "Établissement", "Programme", "Passeport"], "https://dirco.gov.za/washingtondc/types-of-visas-and-requirements/"),
    step("study_visa", "Vérifier la Study Visa", "Confirmer que la catégorie Study Visa correspond à la durée et au programme envisagés.", ["Durée", "Programme", "Catégorie", "Nationalité"], "https://dirco.gov.za/washingtondc/types-of-visas-and-requirements/"),
    step("application", "Demande et pièces", "Préparer le formulaire, passeport, admission et justificatifs exigés par la mission compétente.", ["Formulaire", "Passeport", "Admission", "Justificatifs"], "https://dirco.gov.za/washingtondc/types-of-visas-and-requirements/"),
    step("decision_conditions", "Décision et séjour étudiant", "Suivre la décision et respecter les conditions de la Study Visa pendant le séjour.", ["Décision", "Conditions", "Études", "Échéances"], "https://ehome.dha.gov.za/epermit/home"),
  ]),
  regional("Afrique du Sud", "Travail", "https://dirco.gov.za/washingtondc/types-of-visas-and-requirements/", [
    step("work_category", "Choisir la catégorie de travail", "Identifier General Work, Critical Skills ou Intra-Company Transfer selon le poste et la situation professionnelle.", ["Poste", "Employeur", "Compétences", "Transfert"], "https://dirco.gov.za/washingtondc/types-of-visas-and-requirements/"),
    step("qualification_employer", "Preuves employeur et qualification", "Réunir l’offre, les qualifications, l’expérience et les éléments exigés pour la catégorie retenue.", ["Contrat", "Diplôme", "Expérience", "Employeur"], "https://www.dha.gov.za/images/notices/8october24/General_Work_Visa_requirements_-_8_Oct_2028.pdf"),
    step("application", "Demande auprès de la mission", "Déposer la demande avec les formulaires et pièces officiels, sans confondre les catégories de travail.", ["Formulaire", "Passeport", "Pièces", "Mission"], "https://dirco.gov.za/washingtondc/types-of-visas-and-requirements/"),
    step("decision_conditions", "Décision et respect du statut", "Suivre la décision et exercer uniquement l’activité autorisée par la catégorie accordée.", ["Décision", "Statut", "Employeur", "Conditions"], "https://www.dha.gov.za/images/notices/8october24/General_Work_Visa_requirements_-_8_Oct_2028.pdf"),
  ]),
  regional("Brésil", "Visiteur", "https://www.gov.br/mre/pt-br/consulado-los-angeles/english/visas/types-of-visa", [
    step("visitor_category", "Vérifier VIVIS et l’exemption", "Déterminer selon la nationalité si VIVIS ou une exemption s’applique au séjour jusqu’à 90 jours et au motif annoncé.", ["Nationalité", "Motif", "Durée", "Passeport"], "https://www.gov.br/mre/pt-br/consulado-los-angeles/english/visas/types-of-visa"),
    step("documents", "Préparer les documents", "Réunir formulaire, passeport, photo, preuve de résidence et ressources ainsi que les pièces liées au motif.", ["Formulaire", "Passeport", "Photo", "Ressources"], "https://www.gov.br/mre/pt-br/consulado-los-angeles/english/visas/types-of-visa"),
    step("consular_submission", "Dépôt consulaire ou e-Visa", "Suivre le canal indiqué pour la nationalité et le consulat compétent, notamment le portail VFS lorsqu’il est officiellement imposé.", ["Consulat", "VFS", "Rendez-vous", "Référence"], "https://www.gov.br/mre/pt-br/consulado-los-angeles/english/visas/types-of-visa"),
    step("decision_conditions", "Décision et interdiction d’emploi", "Respecter la durée et le motif accordés ; VIVIS n’autorise pas l’emploi rémunéré au Brésil.", ["Décision", "Durée", "Conditions", "Entrée"], "https://www.gov.br/mre/pt-br/consulado-los-angeles/english/visas/types-of-visa"),
  ]),
  regional("Brésil", "Études", "https://www.gov.br/mre/pt-br/embaixada-helsinque/consular-services/student-visa-vitem-iv", [
    step("study_program", "Programme et catégorie VITEM IV", "Confirmer que le cursus, l’échange, le stage ou la langue relève du Student Visa VITEM IV et vérifier la durée.", ["Programme", "Établissement", "Durée", "Nationalité"], "https://www.gov.br/mre/pt-br/embaixada-helsinque/consular-services/student-visa-vitem-iv"),
    step("online_form", "Formulaire en ligne et pièces", "Remplir le formulaire électronique, téléverser les documents et préparer les originaux requis par la mission.", ["Formulaire", "Passeport", "Photo", "Admission"], "https://www.gov.br/mre/pt-br/embaixada-helsinque/consular-services/student-visa-vitem-iv"),
    step("signature_submission", "Impression, signature et dépôt", "Imprimer et signer le reçu/formulaire puis transmettre les originaux selon les instructions de la représentation compétente.", ["Signature", "Originaux", "Dépôt", "Mission"], "https://www.gov.br/mre/pt-br/embaixada-helsinque/consular-services/student-visa-vitem-iv"),
    step("decision_conditions", "Décision et conditions étudiant", "Suivre la décision et respecter les conditions de séjour ; le visa étudiant n’est pas une autorisation générale de travail.", ["Décision", "Séjour", "Études", "Conditions"], "https://www.gov.br/mre/pt-br/embaixada-helsinque/consular-services/student-visa-vitem-iv"),
  ]),
  regional("Brésil", "Travail", "https://www.gov.br/mre/pt-br/embaixada-varsovia/visto-de-trabalho-vitem-v", [
    step("sponsor_authorization", "Autorisation préalable au Brésil", "L’entreprise sponsor doit initier au Brésil la demande d’autorisation préalable auprès du ministère compétent.", ["Sponsor", "Employeur", "Autorisation", "Contrat"], "https://www.gov.br/mre/pt-br/embaixada-varsovia/visto-de-trabalho-vitem-v"),
    step("qualification", "Qualification et activité compatible", "Vérifier que les qualifications ou l’expérience correspondent à l’activité et à la catégorie VITEM V retenue.", ["Diplôme", "Expérience", "Poste", "Activité"], "https://www.gov.br/mre/pt-br/embaixada-varsovia/visto-de-trabalho-vitem-v"),
    step("consular_application", "Demande consulaire après accord", "Après transmission de l’autorisation au consulat, déposer la demande avec formulaire, passeport, photo et pièces officielles.", ["Autorisation", "Formulaire", "Passeport", "Photo"], "https://www.gov.br/mre/pt-br/embaixada-varsovia/visto-de-trabalho-vitem-v"),
    step("federal_registration", "Décision et enregistrement", "Après l’entrée, respecter l’enregistrement auprès de la Polícia Federal dans le délai officiel et les conditions du statut.", ["Décision", "Entrée", "Polícia Federal", "Statut"], "https://www.gov.br/mre/pt-br/embaixada-varsovia/visto-de-trabalho-vitem-v"),
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
  const detailedCountry = ["france", "belgique", "suisse", "pays bas", "allemagne", "espagne", "portugal", "autriche", "pologne", "suede", "norvege", "finlande", "danemark", "republique tcheque", "irlande", "grece", "croatie", "slovaquie", "serbie", "turkiye", "turquie", "royaume uni", "etats unis", "australie", "japon", "nouvelle zelande", "new zealand", "coree du sud", "south korea", "inde", "india", "afrique du sud", "south africa", "bresil", "brazil", "roumanie", "slovenie", "estonie", "lettonie", "lituanie", "bulgarie"].find((candidate) => countryKey.includes(candidate));
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
