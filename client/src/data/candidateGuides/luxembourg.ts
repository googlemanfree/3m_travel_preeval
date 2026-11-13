import type { CandidateGuide } from "./types";

/**
 * Guide candidat Luxembourg — reprise fidèle du guide PDF « LUXEMBOURG 3M GUIDE » (20 pages, édition 2026).
 * Les repères [S1]…[S14] renvoient aux sources de la dernière rubrique. Les montants du guide sont des grilles commerciales
 * de l'agence, jamais des tarifs fixés par les autorités ; le guide ne promet ni embauche ni visa.
 */
export const luxembourgGuide: CandidateGuide = {
  slug: "luxembourg",
  country: "Luxembourg",
  flag: "🇱🇺",
  heading: "Travailler au Luxembourg",
  lead: "Évaluation • Recrutement • Formalités • Voyage • Installation. Votre mobilité, notre expertise. Votre réussite, notre mission.",
  edition: "2026",
  maturity: "complete",
  disclaimer:
    "Une évaluation favorable ne garantit pas une embauche. Un contrat de travail ne garantit pas un visa. Les sources officielles ne valident pas les tarifs ni les partenariats privés de l’agence. Document commercial privé : simulations et clauses indicatives à valider avant utilisation contractuelle. Le drapeau identifie la destination, sans affiliation aux autorités.",
  contents: [
    { label: "Évaluation et procédure en 12 étapes", sectionIds: ["evaluation", "etapes-1", "etapes-2", "etapes-3", "etapes-4"] },
    { label: "Pièces, prestations et deux protocoles", sectionIds: ["prestations", "protocoles"] },
    { label: "Paiements, échéanciers et financement", sectionIds: ["paiements", "echeancier", "prefinancement"] },
    { label: "Responsabilités, contrat et essai", sectionIds: ["responsabilites", "contrat", "essai"] },
    { label: "Logement, visa, voyage et installation", sectionIds: ["logement", "visa", "voyage"] },
    { label: "Postes, FAQ, sécurité et sources", sectionIds: ["postes", "faq-securite", "sources"] },
  ],
  sections: [
    {
      id: "evaluation",
      number: "02",
      title: "Évaluation en ligne et espace candidat",
      blocks: [
        { type: "text", text: "Commencer sur www.3mtravelagency.com. La page publique présente une évaluation gratuite, accessible depuis un compte candidat gratuit. Indiquez votre métier, votre projet et le Luxembourg comme destination. Déposez votre CV à jour et utilisez une adresse email personnelle et un numéro joignable. [S1]" },
        {
          type: "cards",
          items: [
            { title: "Renseigner un parcours précis", text: "Indiquez dates, formations, missions, outils et langues réellement maîtrisées. Les informations doivent correspondre aux justificatifs disponibles. Ne dissimulez pas une interruption et n’inventez aucun diplôme ou emploi." },
            { title: "Recevoir le bilan et les modalités", text: "Selon les modalités communiquées par l’agence, résultats et conditions sont transmis par email et dans l’espace candidat lorsqu’il est accessible. Un complément peut être demandé avant conclusion." },
            { title: "Accéder à l’espace puis activer", text: "Suivez les instructions d’accès. L’activation payante intervient après acceptation du Protocole n° 01 et validation des conditions d’ouverture. L’équipe confirme la mise en suivi." },
          ],
        },
        {
          type: "table",
          headers: ["Avant activation", "Après activation"],
          rows: [["Évaluation, CV, pays cible, résultat et examen des conditions.", "Préparation, informations de suivi et réponses aux demandes de pièces."]],
        },
        { type: "callout", tone: "warning", text: "Un paiement ne prouve pas la transmission à un employeur. Le statut doit correspondre à un événement identifiable. Consultez aussi vos emails. Les fonctionnalités connectées ne sont pas vérifiées par la page publique : aucun suivi automatique n’est présumé." },
      ],
    },
    {
      id: "etapes-1",
      number: "03",
      kicker: "Procédure détaillée",
      title: "Du projet à l’ouverture",
      blocks: [
        { type: "step", number: "01", title: "Présenter le projet", actors: "Candidat et équipe.", action: "Commencez l’évaluation, choisissez le Luxembourg et envoyez votre CV avec vos expériences et coordonnées.", expected: "Demande exploitable et instructions d’accès.", vigilance: "Un CV reçu ne vaut ni activation ni soumission à un employeur." },
        { type: "step", number: "02", title: "Recevoir l’évaluation", actors: "Équipe d’évaluation et recruteur concerné selon l’organisation effective.", action: "Répondez aux demandes ; recevez le bilan : profil pouvant être présenté, pièces à compléter ou réorientation.", expected: "Résultat et modalités par email et dans l’espace lorsqu’il est accessible.", vigilance: "L’évaluation gratuite ne reconnaît pas officiellement un diplôme et ne garantit pas l’embauche." },
        { type: "step", number: "03", title: "Signer le premier protocole", actors: "Candidat et agence.", action: "Lisez prestations, exclusions et conditions d’arrêt. Après accord, signez le Protocole n° 01 et réglez les 100 000 FCFA selon les conditions prévues.", expected: "Protocole, reçu nominatif et activation confirmée une fois les conditions réunies.", vigilance: "Vérifiez le bénéficiaire ; une promesse orale ne remplace pas le contrat." },
        { type: "callout", tone: "info", text: "Le premier protocole encadre ouverture et candidature. Le second encadre la procédure administrative après sélection confirmée." },
      ],
    },
    {
      id: "etapes-2",
      number: "04",
      kicker: "Procédure détaillée",
      title: "Constituer et présenter",
      blocks: [
        { type: "step", number: "04", title: "Compléter et mettre en suivi", actors: "Candidat et équipe.", action: "Transmettez les pièces lisibles et répondez aux demandes. L’équipe confirme activation, référence et suivi.", expected: "Dossier activé et informations sur les manquants.", vigilance: "Activation ne signifie pas sélection." },
        { type: "step", number: "05", title: "Monter la candidature", actors: "Candidat et équipe de préparation.", action: "Le CV est structuré et les pièces classées. Les traductions prévues sont réalisées dans les limites du protocole.", expected: "Dossier préparé, contenu validé et compléments identifiés.", vigilance: "Distinguer traduction de candidature et traduction assermentée. Aucun fait inventé." },
        { type: "step", number: "06", title: "Présenter aux recruteurs", actors: "Agence et interlocuteurs concernés.", action: "Avec votre accord, la candidature est soumise pour les besoins correspondant au profil. Restez disponible pour les compléments.", expected: "Transmission effective ou retour identifiable et prochaine action.", vigilance: "Une annonce ne constitue pas un poste réservé. Un recruteur réel n’est pas automatiquement partenaire." },
        { type: "callout", tone: "info", text: "Le protocole définit durée, périmètre des soumissions et suivi. Aucun nombre de candidatures ni délai d’embauche n’est garanti ici." },
      ],
    },
    {
      id: "etapes-3",
      number: "05",
      kicker: "Procédure détaillée",
      title: "Entretien et sélection",
      blocks: [
        { type: "step", number: "07", title: "Passer l’entretien", actors: "Employeur ou recruteur ; candidat.", action: "Présentez votre métier et vos réalisations. Répondez aux questions et au test éventuel. Préparez une connexion stable et vos questions sur le poste.", expected: "Complément, poursuite, refus ou sélection confirmée.", vigilance: "Un entretien n’est pas une embauche. Un profil favorable peut être refusé." },
        { type: "step", number: "08", title: "Examiner contrat et second protocole", actors: "Employeur et candidat ; agence pour son protocole.", action: "Vérifiez missions, lieu, brut, horaires et avantages. Signez personnellement si l’offre convient. Après sélection, examinez le Protocole n° 02 administratif.", expected: "Documents distincts, sélection identifiable et conditions comprises.", vigilance: "Le protocole privé ne remplace pas le contrat employeur." },
        { type: "step", number: "09", title: "Préparer le certificat ADEM", actors: "Employeur et ADEM.", action: "La fiche consultée indique qu’après trois semaines suivant la déclaration de vacance sans proposition convenant au poste, l’employeur peut demander le certificat permettant le recrutement. [S2]", expected: "Certificat disponible lorsqu’exigé.", vigilance: "Ce délai ne couvre pas tout le recrutement ou le visa. Le certificat n’est ni visa ni titre." },
        { type: "callout", tone: "info", text: "En intérim, l’agence de travail intérimaire est l’employeur ; l’entreprise utilisatrice accueille le salarié. [S5]" },
      ],
    },
    {
      id: "etapes-4",
      number: "06",
      kicker: "Procédure détaillée",
      title: "Dépôt, départ et arrivée",
      blocks: [
        { type: "step", number: "10", title: "Déposer la demande", actors: "Candidat, représentation compétente et DGIM.", action: "Suivez la fiche visa D du 01/10/2026 : demande avant entrée et pièces complètes. Les visas D sont délivrés par des ambassades luxembourgeoises ou belges. [S2]", expected: "Dépôt conforme ; justificatif et référence conservés si fournis.", vigilance: "Confirmer compétence et tarifs ; aucune ancienne adresse sans vérification." },
        { type: "step", number: "11", title: "Organiser le départ après accord", actors: "Autorités ; candidat ; employeur.", action: "Vérifiez les documents. La fiche indique un visa D de six mois en cas d’accord. Confirmez logement, arrivée, billet et budget. [S2]", expected: "Documents obtenus et organisation confirmée.", vigilance: "Éviter le billet non remboursable avant accord. Durées du visa et du contrat distinctes." },
        { type: "step", number: "12", title: "Accomplir les formalités", actors: "Candidat, commune, médecin et DGIM.", action: "Déclaration dans les trois jours, contrôle médical et demande de titre selon instructions. Les sources divergent sur le délai limite : préparer dès l’arrivée. [S3–S4]", expected: "Demande suivie ; après accord, taxe de 80 € sur invitation et biométrie.", vigilance: "Page : trois mois avant expiration du visa ; formulaire : deux mois. Confirmer à la DGIM sans attendre le délai le plus tardif." },
      ],
    },
    {
      id: "prestations",
      number: "07",
      kicker: "Prestations et pièces",
      title: "Protocole d’accord n° 01",
      blocks: [
        {
          type: "table",
          headers: ["Prestation", "Contenu à encadrer"],
          rows: [
            ["Ouverture", "Enregistrement, référence et données de suivi."],
            ["Traitement", "Lisibilité, cohérence et demandes de complément."],
            ["CV", "Présentation au poste sans modification des faits."],
            ["Traduction", "Documents, langues, volume et certification éventuelle."],
            ["Montage", "Classement et harmonisation."],
            ["Soumissions", "Présentation consentie aux employeurs et agences concernés."],
            ["Suivi", "Demandes reçues et retours connus."],
          ],
        },
        {
          type: "cards",
          items: [
            { title: "Pièces à préparer", text: "CV, qualifications, attestations et passeport. Selon la procédure : casier récent ou affidavit dans les conditions prévues, contrat, certificat ADEM et assurance. Pour les pièces hors français, allemand ou anglais, traduction assermentée selon la fiche officielle. [S2]" },
            { title: "Limites du forfait", text: "Préciser traductions, pièces supplémentaires, durée, soumissions et clôture. Le montant de 100 000 FCFA est global ; aucune répartition interne chiffrée n’est inventée." },
          ],
        },
        { type: "callout", tone: "warning", text: "Ces frais n’achètent pas un emploi. Attendre les consignes pour les documents à validité limitée. Refuser faux diplômes, contrats, casiers et justificatifs bancaires." },
      ],
    },
    {
      id: "protocoles",
      number: "08",
      kicker: "Deux protocoles",
      title: "Deux engagements distincts",
      blocks: [
        {
          type: "table",
          headers: ["Point", "Protocole n° 01", "Protocole n° 02"],
          rows: [
            ["Déclencheur", "Évaluation et accord.", "Sélection confirmée."],
            ["Objet", "Ouverture, traitement, traduction, montage et soumissions.", "Accompagnement administratif."],
            ["Financement", "100 000 FCFA selon mandat.", "Tarif et échéances actualisés."],
            ["Justificatifs", "Protocole, reçu et suivi.", "Sélection, contrat et pièces."],
            ["Limite", "Pas d’embauche garantie.", "Pas de visa garanti."],
          ],
        },
        {
          type: "cards",
          items: [
            { title: "Le second protocole", text: "Préciser examen des documents employeur, liste des pièces, montage, assistance et coordination. Les orientations au voyage et après arrivée doivent être expressément comprises." },
            { title: "Éviter le double paiement", text: "Définir si les 100 000 FCFA sont imputés au forfait ou distincts. Identifier les dépenses déjà payées ou financées par l’employeur. Ne pas exiger les honoraires du second protocole sous le titre du premier." },
          ],
        },
        { type: "callout", tone: "confirm", text: "Confirmer total, prestations, échéances, frais externes et règles d’arrêt/remboursement avant usage. Remplacer les anciennes formulations incohérentes sur les déclencheurs de paiement." },
      ],
    },
    {
      id: "paiements",
      number: "09",
      kicker: "Modalités de paiement",
      title: "Comparer les formules",
      blocks: [
        { type: "text", text: "Grille commerciale communiquée par l’agence, non fixée par les autorités. L’inclusion de l’ouverture et le périmètre restent à confirmer au devis." },
        {
          type: "table",
          headers: ["Formule", "Montant de référence", "Écart au comptant"],
          rows: [
            ["Comptant", "2 300 000 FCFA", "Base."],
            ["Échelonnée", "2 645 000 FCFA", "+345 000 ; +15 %."],
            ["Solde après visa", "2 875 000 FCFA", "+575 000 ; +25 %."],
          ],
        },
        {
          type: "cards",
          items: [
            { title: "Comptant", text: "Solde à l’événement du Protocole n° 02. Avec ouverture incluse et payée, restant : 2 200 000 FCFA." },
            { title: "Échelonnement", text: "Chaque tranche a un montant et un déclencheur écrit. Avec ouverture incluse, restant : 2 545 000 FCFA. Surcoût annoncé : 345 000 FCFA." },
            { title: "Solde après visa", text: "Le protocole fixe paiements préalables et solde. Si l’ouverture incluse est le seul premier versement, restant : 2 775 000 FCFA. Cette hypothèse n’est pas une condition confirmée." },
          ],
        },
        { type: "callout", tone: "confirm", text: "Si l’ouverture s’ajoute, totaux : 2 400 000, 2 745 000 et 2 975 000 FCFA. Une seule hypothèse doit être retenue au devis. Ce guide ne déclenche aucun paiement." },
      ],
    },
    {
      id: "echeancier",
      number: "10",
      kicker: "Échéancier proposé et frais externes",
      title: "Simulation non contractuelle",
      blocks: [
        { type: "text", text: "Simulation non contractuelle : ouverture incluse. Applicable uniquement après validation et signature. Montants en FCFA." },
        {
          type: "table",
          headers: ["Événement proposé", "Comptant", "Échelonné", "Après visa"],
          rows: [
            ["Premier protocole / activation", "100 000", "100 000", "100 000"],
            ["Sélection, contrat vérifié et second protocole", "2 200 000", "1 018 000", "0"],
            ["Dossier complet et preuve de dépôt", "0", "1 018 000", "0"],
            ["Visa délivré et vérifié", "0", "509 000", "2 775 000"],
            ["TOTAL FCFA", "2 300 000", "2 645 000", "2 875 000"],
          ],
          note: "Tranches de 40 %, 40 % et 20 % du restant de 2 545 000 FCFA. Définir les conséquences d’un arrêt entre étapes.",
        },
        {
          type: "table",
          caption: "Frais externes",
          headers: ["Dépense", "Traitement au devis"],
          rows: [
            ["Visa D", "Tarif officiel à confirmer ; anciens 200 € non validés."],
            ["Premier titre", "80 € après accord et invitation ; distinct du visa. [S3]"],
            ["Pièces, assurance, examens", "Montants, payeurs et inclusion/exclusion."],
            ["Voyage, logement", "Budget, aides et remboursement."],
          ],
        },
        { type: "callout", tone: "warning", text: "Exiger un reçu. Définir annulation, refus, absence d’emploi et remboursement éventuel. Solde après visa ne signifie pas visa garanti." },
      ],
    },
    {
      id: "prefinancement",
      number: "11",
      kicker: "Préfinancement éventuel par l’employeur",
      title: "Participation de l’employeur",
      blocks: [
        { type: "text", text: "Une participation se négocie après sélection et se confirme par écrit. Les frais de mobilité évoqués par Guichet.lu pour les salariés hautement qualifiés ne créent pas un droit général. [S6]" },
        {
          type: "table",
          headers: ["Forme", "Fonctionnement", "À écrire"],
          rows: [
            ["Prise en charge", "Coût définitivement supporté par l’employeur.", "Postes, plafonds et conditions."],
            ["Avance", "Somme remboursable.", "Dette, échéancier et mécanisme légal vérifié."],
            ["Remboursement", "Dépense préautorisée sur facture.", "Pièces, plafond et délai."],
          ],
        },
        {
          type: "cards",
          items: [
            { title: "À négocier", text: "Billet, logement initial, installation et dépenses identifiées. Les honoraires de l’agence ne sont pas automatiquement couverts par une aide à la mobilité." },
            { title: "Organisation", text: "Confirmer sélection → établir le budget → demander l’aide → distinguer avance et prise en charge → obtenir l’écrit avant dépense → reporter au second protocole." },
          ],
        },
        { type: "callout", tone: "warning", text: "Traiter refus, annulation, non-démarrage et fin d’emploi. Ne jamais présumer une retenue salariale légale du seul fait d’une avance. Faire vérifier le mécanisme." },
      ],
    },
    {
      id: "responsabilites",
      number: "12",
      kicker: "Responsabilités",
      title: "Qui intervient ?",
      blocks: [
        {
          type: "table",
          headers: ["Intervenant", "Mission", "Confirmation / limite"],
          rows: [
            ["Agence accompagnatrice", "Prestations des deux protocoles.", "Contrats, reçus et suivi ; aucune autorisation délivrée."],
            ["Agence de placement", "Rapprochement besoin/profil selon accord.", "Rôle et lien contractuel à confirmer."],
            ["Employeur", "Sélection, contrat, ADEM et aides écrites.", "Documents requis ; aides non présumées. [S2]"],
            ["ADEM", "Recrutement et certificat applicable.", "Ni visa ni titre. [S2]"],
            ["Ambassade", "Circuit du visa D.", "Compétence à vérifier. [S2]"],
            ["DGIM", "Séjour, titre et biométrie.", "Décision indépendante. [S2–S3]"],
            ["Commune", "Arrivée et résidence.", "Adresse légale à justifier. [S3]"],
            ["Intervenants médicaux", "Examens et certificat.", "Examen antérieur non substituable automatiquement. [S3]"],
            ["Employeur / CCSS", "Déclaration d’entrée.", "Dans les huit jours. [S7]"],
            ["Candidat", "Informations et démarches personnelles.", "Obligations maintenues."],
          ],
        },
        { type: "callout", tone: "info", text: "Les missions privées sont contractuelles. En intérim, l’agence est l’employeur ; l’entreprise utilisatrice accueille le salarié. [S5]" },
      ],
    },
    {
      id: "contrat",
      number: "13",
      kicker: "Contrat de travail",
      title: "Clauses essentielles",
      blocks: [
        {
          type: "table",
          headers: ["Clause", "Contrôle concret"],
          rows: [
            ["Identités", "Salarié, adresse et employeur."],
            ["Début et lieu", "Date effective, site et déplacements."],
            ["Fonctions", "Tâches et qualifications."],
            ["Temps de travail", "Durée et horaires."],
            ["Salaire", "Brut, indice et compléments."],
            ["Congés / préavis", "Durée ou détermination, rupture."],
            ["Essai", "Écrit dès l’entrée et durée conforme."],
            ["Cadre collectif", "Convention et pension si applicables."],
          ],
          note: "Mentions de Guichet.lu ; adapter au secteur et au contrat. [S8]",
        },
        {
          type: "cards",
          items: [
            { title: "CDD, temps partiel, intérim", text: "CDD : motif, terme ou durée minimale et renouvellement éventuel. Temps partiel : durée, répartition et flexibilité. Intérim : contrat de mission avec l’agence et règles propres. [S5, S9, S10]" },
            { title: "Mobilité et aides", text: "Préciser conditions d’autorisations, logement, voyage et avances. Pour chaque aide : payeur, montant, date et traitement d’un refus ou d’une rupture. Le salaire brut n’est pas le net." },
          ],
        },
        { type: "callout", tone: "warning", text: "Faire vérifier retenues, remboursements, pénalités et non-concurrence. Les protocoles privés ne remplacent pas le contrat employeur." },
      ],
    },
    {
      id: "essai",
      number: "14",
      kicker: "Période d’essai",
      title: "Clauses et préavis",
      blocks: [
        { type: "text", text: "Essai écrit au plus tard à l’entrée, non renouvelable dans une même relation. La durée doit correspondre à la situation. [S8]" },
        {
          type: "table",
          headers: ["Situation générale", "Maximum présenté"],
          rows: [
            ["Inférieure DAP/CATP", "3 mois."],
            ["DAP/CATP ou supérieur", "6 mois."],
            ["Salaire au seuil légal", "12 mois ; seuil indexé à vérifier."],
          ],
          note: "Minimum général : deux semaines. Examiner suspensions et protections particulières. [S8]",
        },
        {
          type: "table",
          caption: "Préavis de rupture pendant l’essai",
          headers: ["Durée initiale", "Préavis", "Durée initiale", "Préavis"],
          rows: [
            ["2 semaines", "Pas de rupture ordinaire", "4 mois", "16 jours"],
            ["3 semaines", "3 jours", "5 mois", "20 jours"],
            ["4 semaines", "4 jours", "6 mois", "24 jours"],
            ["2 ou 3 mois", "15 jours", "7 mois", "28 jours"],
            ["8 à 12 mois", "1 mois", "Intérim", "Règles propres"],
          ],
          note: "Les deux premières semaines excluent la rupture unilatérale ordinaire ; faute grave et accord commun distincts. Préavis sur la durée initiale et se terminant dans l’essai. [S11]",
        },
        { type: "callout", tone: "info", title: "Clause indicative à adapter", text: "« L’essai de [durée] commence à l’entrée effective. Sa durée, sa suspension et sa rupture respectent la loi. Les dates actualisées sont communiquées. »" },
        { type: "text", text: "Intérim : maximum 3, 5 ou 8 jours travaillés pour une mission jusqu’à un mois, de plus d’un à deux mois ou de plus de deux mois. [S5] Traiter séparément logement et avances après rupture." },
      ],
    },
    {
      id: "logement",
      number: "15",
      kicker: "Logement",
      title: "Préparation et budget",
      blocks: [
        { type: "text", text: "Confirmer avant départ qui cherche, réserve et paie. Aucune gratuité liée à l’ouverture." },
        {
          type: "table",
          headers: ["Situation", "À confirmer", "Écrit"],
          rows: [
            ["Employeur logeur", "Adresse, durée, coût, charges et départ.", "Contrat ou annexe."],
            ["Temporaire", "Coût, accès et résidence possible.", "Réservation."],
            ["Location autonome", "Loyer, charges, garantie et durée.", "Bail et reçus."],
            ["Participation", "Plafond et remboursement.", "Accord écrit."],
          ],
        },
        {
          type: "cards",
          items: [
            { title: "Adresse pour le séjour", text: "Le titre nécessite une adresse légale valable et un logement approprié si la preuve n’a pas déjà été fournie. Ne pas considérer l’hôtel comme suffisant sans vérification. [S3]" },
            { title: "Budget", text: "Premier loyer, charges, garantie, frais et équipement. Pour les baux relevant des règles décrites : garantie maximale de deux mois de loyer et frais d’intermédiaire partagés par moitié. [S12]" },
          ],
        },
        { type: "callout", tone: "warning", text: "Vérifier logement, bailleur, mandat et bénéficiaire avant paiement. Les aides restent conditionnelles. [S13] Le second protocole distingue orientation et prestation définie de recherche/réservation. Aucun logement promis sans écrit." },
      ],
    },
    {
      id: "visa",
      number: "16",
      kicker: "Visa et titre de séjour",
      title: "Documents distincts",
      blocks: [
        {
          type: "cards",
          items: [
            { title: "Avant départ", text: "La fiche du 01/10/2026 prévoit la demande visa D avant entrée. Vérifier catégorie, pièces et représentation ; délivrance par ambassades luxembourgeoises ou belges. Paiement et contrat ne remplacent pas l’accord. [S2]" },
            { title: "Après arrivée", text: "Arrivée déclarée dans les trois jours, médical et demande de titre ; après accord, taxe de 80 € et biométrie. Ce n’est pas le tarif du visa. [S3]" },
          ],
        },
        {
          type: "table",
          headers: ["Action", "Contrôle"],
          rows: [
            ["Identifier", "Procédure correspondant au recrutement."],
            ["Confirmer", "Représentation, canal, rendez-vous et tarifs."],
            ["Constituer", "Pièces et traductions requises."],
            ["Attendre", "Compléments et références conservés."],
          ],
        },
        { type: "callout", tone: "confirm", title: "Délai à confirmer", text: "Page officielle : trois mois avant expiration ; formulaire : deux mois. Préparer dès l’arrivée et confirmer à la DGIM sans attendre le délai le plus tardif. [S3–S4]" },
        { type: "callout", tone: "info", title: "Accompagnement", text: "Assistance limitée au second protocole ; démarches personnelles et informations exactes demeurent à la charge du candidat. Aucun résultat administratif garanti." },
      ],
    },
    {
      id: "voyage",
      number: "17",
      kicker: "Voyage et installation",
      title: "Les premières semaines",
      blocks: [
        {
          type: "table",
          headers: ["Moment", "Action"],
          rows: [
            ["Avant réservation", "Confirmer documents, poste, logement, trajet et payeur."],
            ["Avant départ", "Billet, bagages, pièces en cabine et copies sécurisées."],
            ["À l’arrivée", "Adresse rejointe ; employeur informé ; rendez-vous confirmé."],
            ["Trois jours", "Déclaration communale. [S3]"],
            ["Dès que possible", "Médical et préparation du titre ; délai DGIM à confirmer. [S3–S4]"],
            ["Entrée en service", "Déclaration employeur CCSS sous huit jours. [S7]"],
          ],
        },
        {
          type: "cards",
          items: [
            { title: "Documents accessibles", text: "Passeport, visa, contrat, adresse, preuve de logement, assurance, billet et contacts. Confirmer les exigences du trajet avec autorités et compagnie." },
            { title: "Avant le premier salaire", text: "Prévoir logement, alimentation, téléphone, transport, démarches et imprévus. Demander la date du salaire. Aucune avance, réception aéroport ou prise en charge de billet présumée." },
          ],
        },
        { type: "callout", tone: "info", text: "Les réservations, aides et orientations doivent être écrites au second protocole. Les démarches administratives restent personnelles." },
      ],
    },
    {
      id: "postes",
      number: "18",
      kicker: "Offres publiées",
      title: "Postes et recruteurs",
      blocks: [
        { type: "text", text: "Disponibilité actuelle et accès hors UE à confirmer. Aucun poste réservé ou partenariat présumé. [S14]" },
        {
          type: "table",
          headers: ["Poste / recruteur", "Lieu", "Rémunération affichée"],
          rows: [
            ["Électricien / LIP", "Dudelange", "19,50–22 €/heure ; intérim."],
            ["Maintenance PAC / LIP", "Walferdange", "3 600–4 500 €/mois ; contrat à clarifier."],
            ["Maçon VRD / GH intérim Wiltz", "Useldange", "2 900–4 100 €/mois ; intérim."],
            ["Pneus / GH intérim Wiltz", "Mersch", "2 500–2 900 €/mois ; intérim."],
            ["Sanitaire / Morgan Services", "Esch-sur-Alzette", "18,29 €/heure ; intérim."],
            ["Assistant RH / Harry Hope", "Gare Luxembourg", "40 000–50 000 €/an ; CDI ; télétravail possible affiché."],
          ],
          note: "Base brute/nette à confirmer ; annonce non nominative et aucun salaire net garanti.",
        },
        {
          type: "cards",
          items: [
            { title: "Électricité", text: "Tubage, saignées, câbles, boîtes et raccordement ; horaires affichés 06 h–14 h 30 ; autonomie et rigueur." },
            { title: "Maintenance PAC", text: "2–5 ans, bac professionnel froid/climatisation minimum et permis B. Véhicule de service, téléphone, outillage, formations et primes annoncés. Contrat fixe au descriptif mais catégorie intérim : à confirmer." },
          ],
        },
        { type: "callout", tone: "warning", text: "Logement, billet, repas et usage privé d’un véhicule non présumés. Retenir uniquement les conditions écrites confirmées." },
      ],
    },
    {
      id: "faq-securite",
      number: "19",
      kicker: "FAQ, sécurité et contacts",
      title: "Questions fréquentes et sécurité",
      blocks: [
        {
          type: "faq",
          items: [
            { question: "Pourquoi deux protocoles ?", answer: "Ouverture et candidature pour le premier ; administration après sélection pour le second." },
            { question: "Profil favorable : suis-je recruté ?", answer: "Non. La décision finale appartient à l’employeur." },
            { question: "Remboursement sans emploi ou visa ?", answer: "Conditions écrites avant paiement ; aucune automaticité promise." },
            { question: "Recruteurs cités : partenaires ?", answer: "Le lien contractuel se confirme séparément des annonces." },
            { question: "Comment suivre ?", answer: "Consultez espace et emails après activation ; paiement ne vaut pas soumission." },
          ],
        },
        { type: "callout", tone: "danger", title: "Sécurité", text: "Vérifier contacts et bénéficiaires, exiger mandat et reçu, confirmer les changements de compte. Ne partager aucun code, PIN ou mot de passe. Refuser faux documents et résultats garantis. Suspicion : arrêter les versements, conserver les preuves, contacter banque/opérateur et autorités. Aucun nouveau paiement pour récupérer des fonds." },
        {
          type: "cards",
          items: [
            { title: "3M TRAVEL AGENCY", text: "Yaoundé — Biyem-Assi, Montée Chapelle Obili, près du collège anglophone EHS. +237 698 104 832 / +237 620 996 045. hello@3mtravelagency.com • www.3mtravelagency.com. Ottawa : +1 672 897 2999, sur rendez-vous. [S1]" },
          ],
        },
      ],
    },
  ],
  sources: [
    { key: "S1", text: "www.3mtravelagency.com : contacts et évaluation ; fonctions connectées non vérifiées." },
    { key: "S2", text: "Guichet.lu : Visa D pour un titre de séjour travailleur salarié, 01/10/2026." },
    { key: "S3", text: "Guichet.lu : premier titre de séjour ; arrivée, médical, demande, taxe et biométrie." },
    { key: "S4", text: "Formulaire officiel demande-titre-sejour.pdf : divergence de délai à confirmer auprès de la DGIM." },
    { key: "S5", text: "ITM D2a2 et Guichet.lu : intérim, employeur, mission et essai." },
    { key: "S6", text: "Guichet.lu : mobilité des salariés hautement qualifiés ; contexte spécifique." },
    { key: "S7", text: "Guichet.lu : déclaration d’entrée et déclarations tardives CCSS." },
    { key: "S8", text: "Guichet.lu : CDI, 04/06/2026, mentions et essai." },
    { key: "S9–S10", text: "Guichet.lu : CDD ; temps partiel." },
    { key: "S11", text: "Guichet.lu : rupture pendant essai, 23/07/2025 ; démission avec préavis." },
    { key: "S12", text: "Guichet.lu : bail d’habitation, 26/06/2025." },
    { key: "S13", text: "Guichet.lu : aides au logement et garantie locative." },
    { key: "S14", text: "Moovijob : LIP, électricien Dudelange et maintenance PAC Walferdange ; résultats temps plein / salaire indiqué. Offres évolutives." },
  ],
  toValidate: [
    "Inclusion de l’ouverture, échéances, frais externes, remboursements, traductions et partenariats.",
    "Adapter les clauses employeur.",
    "Vérifier compétence consulaire, tarifs, logement et délai de titre.",
    "Les sources ne certifient pas les tarifs ou partenariats privés. Simulations non contractuelles. Les dispositions officielles signalées comme pas encore applicables ne sont pas utilisées comme règles en vigueur.",
  ],
};
