/**
 * Parcours-type d'une procédure de visa, valable pour TOUS les pays d'un même type (travail, études, visiteur, e-Visa).
 *
 * Règle d'écriture : ce contenu décrit la MÉTHODE (ce qu'il faut faire, dans quel ordre, quels pièges éviter), jamais un chiffre
 * propre à un pays. Les montants, délais et pièces exactes d'un pays viennent de la source officielle citée sur la fiche et
 * restent à confirmer sur le portail officiel. Aucune promesse de résultat : la décision revient toujours à l'autorité du pays.
 */

export type ProcedureKind = "travail" | "etudes" | "visiteur" | "evisa";
export type BlueprintLocale = "fr" | "en";

export type BlueprintStep = { title: string; what: string; watch: string; help: string };
export type BlueprintDocumentGroup = { group: string; items: string[] };
export type BlueprintCostFamily = { title: string; text: string };

export type ProcedureBlueprint = {
  forWhom: string;
  steps: BlueprintStep[];
  documents: BlueprintDocumentGroup[];
  costs: BlueprintCostFamily[];
  delayFactors: string[];
  mistakes: string[];
  afterApproved: string;
  afterRefused: string;
};

export function resolveProcedureKind(visaType: string | undefined | null, slug?: string | null): ProcedureKind {
  const type = String(visaType ?? "").toLowerCase();
  const id = String(slug ?? "").toLowerCase();
  if (type === "evisa" || type === "e-visa" || id.endsWith("-evisa") || id.startsWith("evisa")) return "evisa";
  if (type === "etudes" || type === "etude" || type === "formation" || id.endsWith("-etudes") || id.endsWith("-formation")) return "etudes";
  if (type === "visiteur" || type === "tourisme" || id.endsWith("-visiteur")) return "visiteur";
  return "travail";
}

const COMMON_COSTS_FR: BlueprintCostFamily[] = [
  { title: "Frais officiels", text: "Payés à l’autorité du pays (consulat, portail, centre agréé) : redevance de visa ou de permis, parfois biométrie. Le montant exact figure sur le portail officiel cité sur cette fiche ; il peut changer sans préavis." },
  { title: "Frais de tiers", text: "Traductions certifiées, légalisations, assurance, tests de langue, photos, envoi de documents. Ils dépendent des pièces demandées et ne passent pas par 3M." },
  { title: "Honoraires 3M", text: "Fixés selon votre profil et confirmés par écrit avant tout paiement. Vous savez ce que couvre l’accompagnement avant de vous engager." },
];

const COMMON_COSTS_EN: BlueprintCostFamily[] = [
  { title: "Official fees", text: "Paid to the country’s authority (consulate, portal, approved centre): visa or permit fee, sometimes biometrics. The exact amount is on the official portal cited on this page; it can change without notice." },
  { title: "Third-party costs", text: "Certified translations, legalisation, insurance, language tests, photos, document shipping. They depend on the documents requested and do not go through 3M." },
  { title: "3M fees", text: "Set according to your profile and confirmed in writing before any payment. You know what the support covers before you commit." },
];

export const PROCEDURE_BLUEPRINTS_FR: Record<ProcedureKind, ProcedureBlueprint> = {
  travail: {
    forWhom: "Vous avez une offre d’emploi à l’étranger, vous en cherchez une, ou vous visez un permis fondé sur vos compétences. L’autorité attend un dossier cohérent entre votre métier, vos diplômes, votre expérience et le poste visé.",
    steps: [
      { title: "Cadrer votre projet", what: "Précisez le métier visé, votre niveau de qualification et la destination. Vérifiez que le pays recrute réellement dans ce métier.", watch: "Un métier absent des listes officielles change la voie d’accès possible.", help: "Évaluation gratuite et lecture de votre profil par un conseiller." },
      { title: "Identifier la voie d’accès ouverte à votre nationalité", what: "Permis lié à un employeur, permis fondé sur des points ou des quotas, permis de recherche : repérez celui qui s’applique à vous.", watch: "Seul le portail officiel fait foi ; un forum ou un témoignage ne remplace pas la règle en vigueur.", help: "Orientation vers la voie adaptée et renvoi à la source officielle." },
      { title: "Obtenir l’offre ou l’autorisation de l’employeur", what: "Offre écrite, contrat ou autorisation préalable de l’employeur, selon ce que le pays exige.", watch: "Méfiez-vous de toute offre qui demande un paiement avant un entretien ou un contrat vérifiable.", help: "Aide à vérifier le sérieux d’une offre et de l’organisation qui la propose." },
      { title: "Réunir les pièces", what: "Identité, état civil, diplômes, preuves d’expérience, casier judiciaire si exigé, justificatifs de ressources, assurance.", watch: "Les noms, dates et intitulés doivent être identiques d’une pièce à l’autre.", help: "Liste de contrôle personnalisée et revue de cohérence avant dépôt." },
      { title: "Traduire et légaliser", what: "Traductions certifiées, apostille ou légalisation selon le pays de destination.", watch: "Une pièce mal légalisée est l’une des causes les plus fréquentes de retour de dossier.", help: "Explication de la chaîne de légalisation applicable à vos documents." },
      { title: "Déposer par le canal officiel", what: "Portail en ligne, consulat ou centre agréé : prise de rendez-vous, biométrie, entretien éventuel.", watch: "Utilisez uniquement les adresses officielles indiquées sur cette fiche.", help: "Accompagnement pour la prise de rendez-vous et la préparation de l’entretien." },
      { title: "Suivre et répondre aux demandes", what: "Suivez l’état du dossier et répondez dans le délai fixé à toute demande de compléments.", watch: "Une demande ignorée peut entraîner le rejet du dossier.", help: "Suivi dans votre espace client et alertes de relance." },
      { title: "Préparer le départ et l’arrivée", what: "Après décision favorable : assurance, billet, démarches d’arrivée (déclaration de résidence, titre de séjour).", watch: "N’achetez pas de billet avant la décision.", help: "Conseils d’installation et orientation vers les démarches d’arrivée." },
    ],
    documents: [
      { group: "Identité et état civil", items: ["Passeport en cours de validité", "Acte de naissance", "Photos d’identité conformes", "Justificatif d’état civil si exigé"] },
      { group: "Parcours professionnel", items: ["CV à jour et cohérent", "Diplômes et attestations", "Certificats de travail ou preuves d’expérience", "Lettres de recommandation si utiles"] },
      { group: "Projet et emploi", items: ["Offre ou contrat de travail", "Autorisation de l’employeur si exigée", "Lettre de motivation ou d’explication"] },
      { group: "Ressources et santé", items: ["Justificatifs de ressources", "Assurance si exigée", "Certificat médical ou casier judiciaire selon le pays"] },
    ],
    costs: COMMON_COSTS_FR,
    delayFactors: ["Complétude du dossier au premier dépôt", "Période de forte demande auprès de l’autorité", "Vérifications de l’employeur ou des diplômes", "Rendez-vous de biométrie disponibles", "Nationalité et jours fériés dans le pays de dépôt"],
    mistakes: ["Déposer avant que les pièces soient traduites et légalisées", "Informations différentes entre CV, contrat et formulaire", "Payer un intermédiaire non vérifié", "Ignorer une demande de compléments", "Réserver un billet avant la décision"],
    afterApproved: "Vérifiez que les dates, le nom et la durée portés sur la décision sont exacts, puis préparez l’assurance, le voyage et les démarches d’arrivée. Conservez toutes les pièces : elles serviront aux renouvellements.",
    afterRefused: "Lisez le motif écrit avant toute chose. Selon le pays, un recours ou une nouvelle demande corrigée est possible. Ne redéposez pas à l’identique : corrigez d’abord la cause du refus.",
  },
  etudes: {
    forWhom: "Vous visez une formation, un diplôme ou un programme dans un établissement étranger. L’autorité attend une admission, un projet d’études crédible et la preuve que vous pouvez financer votre séjour.",
    steps: [
      { title: "Choisir le programme et l’établissement", what: "Comparez les formations, les conditions d’admission, les langues d’enseignement et les calendriers d’inscription.", watch: "Vérifiez que l’établissement et le diplôme sont reconnus dans le pays.", help: "Orientation selon votre niveau, votre budget et votre projet." },
      { title: "Constituer le dossier d’admission", what: "Relevés de notes, diplômes, lettre de motivation, CV, tests de langue demandés.", watch: "Les dates limites d’inscription précèdent souvent de plusieurs mois la rentrée.", help: "Relecture de la lettre de motivation et du calendrier de dépôt." },
      { title: "Obtenir l’admission", what: "Lettre d’acceptation, attestation d’inscription ou pré-inscription, selon l’établissement.", watch: "Gardez la preuve écrite : le visa en dépend.", help: "Suivi des réponses des établissements." },
      { title: "Prouver le financement", what: "Ressources personnelles, garant ou bourse : montrez comment vous couvrez études et séjour.", watch: "Les justificatifs doivent être récents, traçables et cohérents avec le garant déclaré.", help: "Aide à présenter un dossier financier clair et vérifiable." },
      { title: "Traduire et légaliser", what: "Traductions certifiées et légalisation des diplômes et relevés selon le pays.", watch: "Une légalisation oubliée bloque l’examen du dossier.", help: "Explication de la chaîne de légalisation de vos documents." },
      { title: "Déposer la demande de visa étudiant", what: "Portail ou consulat : rendez-vous, biométrie, entretien éventuel sur votre projet d’études.", watch: "Votre projet doit être cohérent : pourquoi ce pays, ce programme, et ensuite ?", help: "Préparation à l’entretien et revue de cohérence du dossier." },
      { title: "Répondre aux demandes de compléments", what: "Fournissez rapidement les pièces demandées, dans le format exigé.", watch: "Respectez le délai indiqué dans la demande.", help: "Suivi dans votre espace client." },
      { title: "Préparer l’arrivée", what: "Logement, assurance, inscription sur place, titre de séjour étudiant si nécessaire.", watch: "Certaines démarches doivent être faites dès l’arrivée, dans un délai court.", help: "Conseils d’installation et orientation vers les démarches locales." },
    ],
    documents: [
      { group: "Identité et état civil", items: ["Passeport en cours de validité", "Acte de naissance", "Photos d’identité conformes"] },
      { group: "Parcours académique", items: ["Diplômes et relevés de notes", "Attestation de niveau de langue si exigée", "Lettre de motivation et CV"] },
      { group: "Admission", items: ["Lettre d’acceptation ou attestation d’inscription", "Programme et calendrier de la formation"] },
      { group: "Financement et santé", items: ["Justificatifs de ressources ou de bourse", "Garant et pièces associées si applicable", "Assurance maladie si exigée"] },
    ],
    costs: [
      ...COMMON_COSTS_FR,
      { title: "Frais d’études", text: "Frais d’inscription et de scolarité facturés par l’établissement : ils ne sont pas inclus dans les frais de visa ni dans nos honoraires." },
    ],
    delayFactors: ["Dates limites d’inscription de l’établissement", "Complétude du dossier financier", "Période de forte demande avant la rentrée", "Rendez-vous de biométrie disponibles", "Vérification des diplômes"],
    mistakes: ["Commencer trop tard par rapport à la rentrée", "Justificatifs financiers non traçables ou incohérents", "Projet d’études mal expliqué à l’entretien", "Diplômes non légalisés", "Payer des frais d’inscription sans admission écrite"],
    afterApproved: "Vérifiez la période de validité et les conditions du visa, puis organisez logement, assurance et voyage. Conservez les preuves d’inscription : elles sont demandées à l’arrivée et pour le renouvellement.",
    afterRefused: "Lisez le motif écrit. Selon le pays, un recours ou une nouvelle demande est possible. Renforcez d’abord le point fragile (financement, cohérence du projet, pièces manquantes) avant de redéposer.",
  },
  visiteur: {
    forWhom: "Vous voyagez pour du tourisme, une visite familiale, une visite d’affaires ou un court séjour. L’autorité vérifie surtout que vous avez une raison claire de voyager, des moyens pour le séjour et l’intention de rentrer.",
    steps: [
      { title: "Définir le motif et les dates", what: "Tourisme, visite familiale, affaires ou événement : le motif détermine les pièces à fournir.", watch: "Le motif déclaré doit correspondre aux pièces du dossier.", help: "Évaluation gratuite et choix du bon type de visa." },
      { title: "Vérifier si un visa est requis", what: "Selon votre nationalité, le pays peut exiger un visa, une autorisation électronique ou aucune formalité.", watch: "La règle change selon le pays et peut évoluer : vérifiez la source officielle.", help: "Renvoi au portail officiel et vérification des conditions d’entrée." },
      { title: "Préparer le justificatif de séjour", what: "Réservation d’hébergement ou invitation, itinéraire, assurance de voyage si exigée.", watch: "Évitez les réservations non remboursables avant la décision.", help: "Conseils pour un justificatif de séjour clair et cohérent." },
      { title: "Prouver vos moyens et vos attaches", what: "Ressources suffisantes pour le séjour et éléments montrant votre retour (emploi, famille, études).", watch: "Des mouvements bancaires soudains et inexpliqués attirent l’attention.", help: "Aide à présenter vos justificatifs de façon lisible." },
      { title: "Réunir les pièces d’identité et de voyage", what: "Passeport valide, photos conformes, formulaire complété.", watch: "Vérifiez la validité restante du passeport exigée par le pays.", help: "Liste de contrôle personnalisée." },
      { title: "Déposer la demande", what: "Portail en ligne, consulat ou centre agréé : rendez-vous et biométrie si exigée.", watch: "Utilisez uniquement les adresses officielles indiquées sur cette fiche.", help: "Accompagnement pour le rendez-vous et le dépôt." },
      { title: "Suivre la décision", what: "Suivez le dossier et répondez à toute demande de compléments.", watch: "Gardez vos pièces à portée de main pendant l’instruction.", help: "Suivi dans votre espace client." },
      { title: "Voyager en règle", what: "Respectez la durée et les conditions de séjour accordées et conservez les justificatifs jusqu’au retour.", watch: "Un dépassement de séjour peut compromettre vos demandes futures.", help: "Rappel des conditions de séjour avant le départ." },
    ],
    documents: [
      { group: "Identité et voyage", items: ["Passeport en cours de validité", "Photos d’identité conformes", "Formulaire de demande complété"] },
      { group: "Séjour", items: ["Réservation d’hébergement ou lettre d’invitation", "Itinéraire prévisionnel", "Assurance de voyage si exigée"] },
      { group: "Moyens et attaches", items: ["Justificatifs de ressources", "Attestation d’emploi, d’études ou d’activité", "Éléments familiaux ou professionnels justifiant le retour"] },
    ],
    costs: COMMON_COSTS_FR,
    delayFactors: ["Saison de forte demande", "Complétude du dossier au dépôt", "Rendez-vous disponibles au centre de dépôt", "Vérifications complémentaires de l’autorité", "Jours fériés dans le pays de dépôt"],
    mistakes: ["Déposer trop tard avant la date de voyage", "Réservations incohérentes avec le motif déclaré", "Ressources insuffisantes ou inexpliquées", "Dossier incomplet au premier dépôt", "Acheter un billet non modifiable avant la décision"],
    afterApproved: "Contrôlez le nom, les dates et le nombre d’entrées indiqués sur le visa avant de voyager, puis respectez la durée autorisée.",
    afterRefused: "Lisez le motif écrit. Selon le pays, un recours ou une nouvelle demande est possible : corrigez la cause du refus avant de redéposer.",
  },
  evisa: {
    forWhom: "Le pays délivre une autorisation d’entrée en ligne. La demande se fait sur le portail officiel, avec des pièces numérisées, sans passage systématique au consulat.",
    steps: [
      { title: "Confirmer que le e-Visa s’applique à votre nationalité", what: "Vérifiez sur le portail officiel que votre nationalité et votre motif de voyage sont éligibles.", watch: "Seul le site gouvernemental officiel est valable : de nombreux sites copiés facturent des frais supplémentaires.", help: "Renvoi vers le portail officiel et vérification de l’adresse." },
      { title: "Choisir le bon type d’autorisation", what: "Touriste, affaires, transit ou autre : chaque type a ses conditions.", watch: "Un mauvais type peut entraîner un refus à l’entrée.", help: "Aide au choix selon votre motif." },
      { title: "Préparer les fichiers numériques", what: "Scan du passeport, photo conforme, justificatifs de voyage au format et à la taille demandés.", watch: "Un fichier flou ou au mauvais format bloque la demande.", help: "Contrôle de la qualité des fichiers avant envoi." },
      { title: "Remplir le formulaire en ligne", what: "Saisissez les informations exactement comme sur votre passeport.", watch: "Une faute sur un nom ou une date de passeport peut invalider l’autorisation.", help: "Relecture du formulaire avant validation." },
      { title: "Payer sur le site officiel", what: "Réglez les frais officiels par le moyen proposé, uniquement sur le portail gouvernemental.", watch: "Ne payez jamais un lien reçu par message : passez toujours par le portail officiel.", help: "Rappel des bonnes pratiques de paiement sécurisé." },
      { title: "Recevoir et vérifier l’autorisation", what: "Téléchargez l’autorisation et contrôlez nom, dates et type.", watch: "Une information erronée doit être corrigée avant le départ.", help: "Vérification des informations portées sur l’autorisation." },
      { title: "Imprimer et conserver", what: "Gardez une version imprimée et une version numérique pour le contrôle à l’embarquement et à l’arrivée.", watch: "Certains transporteurs demandent l’autorisation avant l’embarquement.", help: "Check-list de voyage." },
      { title: "Respecter les conditions d’entrée", what: "Durée de séjour, nombre d’entrées et conditions sanitaires éventuelles.", watch: "Les conditions peuvent évoluer : relisez-les juste avant le départ.", help: "Rappel des conditions avant le départ." },
    ],
    documents: [
      { group: "Identité et voyage", items: ["Passeport numérisé en cours de validité", "Photo d’identité numérique conforme"] },
      { group: "Voyage", items: ["Billet ou itinéraire si demandé", "Réservation d’hébergement si demandée", "Assurance si exigée"] },
      { group: "Paiement", items: ["Moyen de paiement accepté sur le portail officiel"] },
    ],
    costs: [
      { title: "Frais officiels", text: "Payés uniquement sur le portail gouvernemental du pays. Le montant exact et la monnaie sont affichés sur ce portail ; ils peuvent évoluer." },
      { title: "Frais de tiers", text: "Photo, impression, assurance, éventuelles traductions. Ils ne passent pas par 3M." },
      { title: "Honoraires 3M", text: "Fixés selon votre profil et confirmés par écrit avant tout paiement. Ils couvrent la vérification de la demande avant envoi, jamais les frais officiels." },
    ],
    delayFactors: ["Qualité et conformité des fichiers", "Période de forte demande", "Vérifications complémentaires de l’autorité", "Exactitude des informations saisies"],
    mistakes: ["Passer par un site non officiel", "Faute de saisie sur un nom ou une date", "Photo non conforme", "Payer à la mauvaise adresse", "Attendre la veille du départ pour demander"],
    afterApproved: "Contrôlez que chaque information de l’autorisation correspond au passeport, conservez-la sous forme imprimée et numérique et vérifiez les conditions d’entrée avant le départ.",
    afterRefused: "Lisez le motif indiqué. Corrigez l’élément en cause avant une nouvelle demande, ou demandez l’avis d’un conseiller si le motif n’est pas clair.",
  },
};

export const PROCEDURE_BLUEPRINTS_EN: Record<ProcedureKind, ProcedureBlueprint> = {
  travail: {
    forWhom: "You have a job offer abroad, you are looking for one, or you aim for a skills-based permit. The authority expects a file that is consistent across your occupation, diplomas, experience and the position targeted.",
    steps: [
      { title: "Frame your project", what: "Define the occupation, your qualification level and the destination. Check that the country really recruits in this field.", watch: "An occupation missing from official lists changes the route available to you.", help: "Free assessment and profile review by an adviser." },
      { title: "Identify the route open to your nationality", what: "Employer-sponsored permit, points or quota based permit, job-search permit: find the one that applies to you.", watch: "Only the official portal is authoritative; a forum post does not replace the rule in force.", help: "Guidance to the right route and pointer to the official source." },
      { title: "Obtain the employer’s offer or authorisation", what: "Written offer, contract or prior employer authorisation, depending on what the country requires.", watch: "Be wary of any offer asking for payment before an interview or a verifiable contract.", help: "Help checking an offer and the organisation behind it." },
      { title: "Gather the documents", what: "ID, civil status, diplomas, proof of experience, criminal record if required, proof of funds, insurance.", watch: "Names, dates and titles must be identical from one document to the next.", help: "Personalised checklist and consistency review before filing." },
      { title: "Translate and legalise", what: "Certified translations, apostille or legalisation depending on the destination.", watch: "A badly legalised document is one of the most frequent reasons files are returned.", help: "Explanation of the legalisation chain for your documents." },
      { title: "File through the official channel", what: "Online portal, consulate or approved centre: appointment, biometrics, possible interview.", watch: "Use only the official addresses listed on this page.", help: "Support booking the appointment and preparing the interview." },
      { title: "Follow up and answer requests", what: "Track the file and answer any request for additional documents within the set time.", watch: "An ignored request can lead to rejection.", help: "Follow-up in your client space and reminders." },
      { title: "Prepare departure and arrival", what: "After a favourable decision: insurance, ticket, arrival formalities (residence registration, residence permit).", watch: "Do not buy a ticket before the decision.", help: "Settling-in advice and pointers to arrival formalities." },
    ],
    documents: [
      { group: "Identity and civil status", items: ["Valid passport", "Birth certificate", "Compliant ID photos", "Civil status proof if required"] },
      { group: "Professional background", items: ["Up-to-date, consistent CV", "Diplomas and certificates", "Employment certificates or proof of experience", "Reference letters where useful"] },
      { group: "Project and job", items: ["Job offer or contract", "Employer authorisation if required", "Motivation or explanation letter"] },
      { group: "Funds and health", items: ["Proof of funds", "Insurance if required", "Medical certificate or criminal record depending on the country"] },
    ],
    costs: COMMON_COSTS_EN,
    delayFactors: ["Completeness of the file at first filing", "Peak demand at the authority", "Employer or diploma checks", "Available biometrics appointments", "Nationality and public holidays in the filing country"],
    mistakes: ["Filing before documents are translated and legalised", "Different information across CV, contract and form", "Paying an unverified intermediary", "Ignoring a request for additional documents", "Booking a ticket before the decision"],
    afterApproved: "Check that dates, name and duration on the decision are correct, then arrange insurance, travel and arrival formalities. Keep every document: you will need them for renewals.",
    afterRefused: "Read the written reason first. Depending on the country, an appeal or a corrected new application is possible. Do not refile identically: fix the cause of the refusal first.",
  },
  etudes: {
    forWhom: "You aim for a course, a degree or a programme at a foreign institution. The authority expects an admission, a credible study plan and proof you can fund your stay.",
    steps: [
      { title: "Choose the programme and institution", what: "Compare courses, admission requirements, languages of instruction and enrolment calendars.", watch: "Check that the institution and the degree are recognised in the country.", help: "Guidance based on your level, budget and project." },
      { title: "Build the admission file", what: "Transcripts, diplomas, motivation letter, CV, required language tests.", watch: "Enrolment deadlines often fall several months before the start of the academic year.", help: "Review of your motivation letter and filing calendar." },
      { title: "Obtain the admission", what: "Acceptance letter, enrolment certificate or pre-enrolment, depending on the institution.", watch: "Keep the written proof: the visa depends on it.", help: "Follow-up of institutions’ answers." },
      { title: "Prove your funding", what: "Personal funds, sponsor or scholarship: show how you cover studies and stay.", watch: "Proofs must be recent, traceable and consistent with the declared sponsor.", help: "Help presenting a clear, verifiable financial file." },
      { title: "Translate and legalise", what: "Certified translations and legalisation of diplomas and transcripts depending on the country.", watch: "A forgotten legalisation blocks the review of the file.", help: "Explanation of the legalisation chain for your documents." },
      { title: "File the student visa application", what: "Portal or consulate: appointment, biometrics, possible interview about your study plan.", watch: "Your plan must be consistent: why this country, this programme, and what next?", help: "Interview preparation and consistency review of the file." },
      { title: "Answer requests for additional documents", what: "Provide requested documents quickly, in the required format.", watch: "Respect the deadline given in the request.", help: "Follow-up in your client space." },
      { title: "Prepare your arrival", what: "Housing, insurance, on-site enrolment, student residence permit if needed.", watch: "Some formalities must be completed shortly after arrival.", help: "Settling-in advice and pointers to local formalities." },
    ],
    documents: [
      { group: "Identity and civil status", items: ["Valid passport", "Birth certificate", "Compliant ID photos"] },
      { group: "Academic background", items: ["Diplomas and transcripts", "Language proficiency proof if required", "Motivation letter and CV"] },
      { group: "Admission", items: ["Acceptance letter or enrolment certificate", "Programme and course calendar"] },
      { group: "Funding and health", items: ["Proof of funds or scholarship", "Sponsor and related documents if applicable", "Health insurance if required"] },
    ],
    costs: [
      ...COMMON_COSTS_EN,
      { title: "Tuition costs", text: "Enrolment and tuition fees billed by the institution: they are not included in visa fees or in our fees." },
    ],
    delayFactors: ["Institution enrolment deadlines", "Completeness of the financial file", "Peak demand before the start of term", "Available biometrics appointments", "Diploma verification"],
    mistakes: ["Starting too late relative to the start of term", "Untraceable or inconsistent financial proofs", "Study plan poorly explained at the interview", "Diplomas not legalised", "Paying enrolment fees without a written admission"],
    afterApproved: "Check the validity period and conditions of the visa, then arrange housing, insurance and travel. Keep proof of enrolment: it is requested on arrival and for renewal.",
    afterRefused: "Read the written reason. Depending on the country, an appeal or a new application is possible. Strengthen the weak point first (funding, project consistency, missing documents) before refiling.",
  },
  visiteur: {
    forWhom: "You are travelling for tourism, a family visit, a business visit or a short stay. The authority mainly checks that you have a clear reason to travel, the means for the stay and the intention to return.",
    steps: [
      { title: "Define the purpose and dates", what: "Tourism, family visit, business or event: the purpose determines the documents.", watch: "The declared purpose must match the documents in the file.", help: "Free assessment and choice of the right visa type." },
      { title: "Check whether a visa is required", what: "Depending on your nationality, the country may require a visa, an electronic authorisation or no formality.", watch: "The rule differs by country and can change: check the official source.", help: "Pointer to the official portal and entry-requirement check." },
      { title: "Prepare proof of stay", what: "Accommodation booking or invitation, itinerary, travel insurance if required.", watch: "Avoid non-refundable bookings before the decision.", help: "Advice for a clear, consistent proof of stay." },
      { title: "Show your means and ties", what: "Sufficient funds for the stay and elements showing your return (job, family, studies).", watch: "Sudden, unexplained bank movements attract attention.", help: "Help presenting your proofs legibly." },
      { title: "Gather identity and travel documents", what: "Valid passport, compliant photos, completed form.", watch: "Check the remaining passport validity the country requires.", help: "Personalised checklist." },
      { title: "File the application", what: "Online portal, consulate or approved centre: appointment and biometrics if required.", watch: "Use only the official addresses listed on this page.", help: "Support for the appointment and filing." },
      { title: "Follow the decision", what: "Track the file and answer any request for additional documents.", watch: "Keep your documents at hand during processing.", help: "Follow-up in your client space." },
      { title: "Travel in compliance", what: "Respect the granted duration and conditions of stay and keep proofs until you return.", watch: "Overstaying can compromise future applications.", help: "Reminder of stay conditions before departure." },
    ],
    documents: [
      { group: "Identity and travel", items: ["Valid passport", "Compliant ID photos", "Completed application form"] },
      { group: "Stay", items: ["Accommodation booking or invitation letter", "Planned itinerary", "Travel insurance if required"] },
      { group: "Means and ties", items: ["Proof of funds", "Certificate of employment, studies or activity", "Family or professional elements justifying return"] },
    ],
    costs: COMMON_COSTS_EN,
    delayFactors: ["High-demand season", "Completeness of the file at filing", "Appointments available at the filing centre", "Additional checks by the authority", "Public holidays in the filing country"],
    mistakes: ["Filing too close to the travel date", "Bookings inconsistent with the declared purpose", "Insufficient or unexplained funds", "Incomplete file at first filing", "Buying a non-changeable ticket before the decision"],
    afterApproved: "Check the name, dates and number of entries on the visa before travelling, then respect the authorised duration.",
    afterRefused: "Read the written reason. Depending on the country, an appeal or a new application is possible: fix the cause of the refusal before refiling.",
  },
  evisa: {
    forWhom: "The country issues an online entry authorisation. The application is made on the official portal with scanned documents, without systematically going to a consulate.",
    steps: [
      { title: "Confirm the e-Visa applies to your nationality", what: "Check on the official portal that your nationality and purpose of travel are eligible.", watch: "Only the official government site is valid: many copy-cat sites charge extra fees.", help: "Pointer to the official portal and address check." },
      { title: "Choose the right authorisation type", what: "Tourist, business, transit or other: each type has its own conditions.", watch: "The wrong type can lead to refusal at entry.", help: "Help choosing according to your purpose." },
      { title: "Prepare the digital files", what: "Passport scan, compliant photo, travel proofs in the requested format and size.", watch: "A blurry or wrongly formatted file blocks the application.", help: "Quality check of files before sending." },
      { title: "Fill in the online form", what: "Enter information exactly as on your passport.", watch: "A typo in a name or passport date can invalidate the authorisation.", help: "Form review before submission." },
      { title: "Pay on the official site", what: "Pay the official fees by the means offered, only on the government portal.", watch: "Never pay a link received by message: always go through the official portal.", help: "Reminder of secure payment practices." },
      { title: "Receive and check the authorisation", what: "Download the authorisation and check name, dates and type.", watch: "Wrong information must be corrected before departure.", help: "Check of the information on the authorisation." },
      { title: "Print and keep", what: "Keep a printed and a digital copy for boarding and arrival checks.", watch: "Some carriers ask for the authorisation before boarding.", help: "Travel checklist." },
      { title: "Respect entry conditions", what: "Length of stay, number of entries and any health conditions.", watch: "Conditions can change: reread them just before departure.", help: "Reminder of conditions before departure." },
    ],
    documents: [
      { group: "Identity and travel", items: ["Scanned valid passport", "Compliant digital ID photo"] },
      { group: "Travel", items: ["Ticket or itinerary if requested", "Accommodation booking if requested", "Insurance if required"] },
      { group: "Payment", items: ["Payment method accepted on the official portal"] },
    ],
    costs: [
      { title: "Official fees", text: "Paid only on the country’s government portal. The exact amount and currency are shown on that portal; they may change." },
      { title: "Third-party costs", text: "Photo, printing, insurance, possible translations. They do not go through 3M." },
      { title: "3M fees", text: "Set according to your profile and confirmed in writing before any payment. They cover checking the application before submission, never the official fees." },
    ],
    delayFactors: ["Quality and compliance of files", "Peak demand", "Additional checks by the authority", "Accuracy of the information entered"],
    mistakes: ["Using an unofficial site", "Typo in a name or date", "Non-compliant photo", "Paying at the wrong address", "Waiting until the day before departure to apply"],
    afterApproved: "Check that every item on the authorisation matches the passport, keep it printed and digital, and check entry conditions before departure.",
    afterRefused: "Read the stated reason. Fix the item concerned before a new application, or ask an adviser if the reason is unclear.",
  },
};

export function getProcedureBlueprint(kind: ProcedureKind, locale: BlueprintLocale): ProcedureBlueprint {
  return (locale === "en" ? PROCEDURE_BLUEPRINTS_EN : PROCEDURE_BLUEPRINTS_FR)[kind];
}
