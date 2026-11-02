/**
 * Brouillons de la vague 1 (Canada, France, Allemagne, Belgique, Luxembourg, Royaume-Uni, Émirats arabes unis) : dispositifs, étapes,
 * pièces, délais et frais, rédigés à partir de la recherche du 27 octobre 2026 (docs/offres-emploi/procedures-vague-1.md).
 *
 * Ils s'importent en « À confirmer » et ne deviennent visibles du candidat qu'après relecture par un administrateur, source officielle
 * ouverte et marquée « vérifiée ». Les valeurs qui se contredisaient entre sources (seuils de ressources, frais de visa britanniques,
 * seuil de la Carte bleue) sont volontairement laissées « à confirmer par votre conseiller » : aucun chiffre douteux n'est importé.
 */
import type { OfferRequirement, Pathway, RouteType, SourceAuthority, StepActor } from "./countryCatalog";

export type DraftStep = { actor: StepActor; title: string; description?: string; documents?: string[]; delay?: string; fee?: string };
export type DraftProgram = {
  officialName: string;
  nameFr: string;
  routeType?: RouteType;
  offerRequired?: OfferRequirement;
  sponsorLicenceRequired?: boolean;
  labourMarketTest?: boolean;
  renewable?: boolean;
  familyAllowed?: boolean;
  legalBasis?: string;
  durationNote?: string;
  feesNote?: string;
  processingNote?: string;
  steps: DraftStep[];
};
export type DraftSource = { label: string; url: string; authority: SourceAuthority };
export type DraftPathway = { countryCode: string; pathway: Pathway; summary: string; programs: DraftProgram[]; sources: DraftSource[] };

const SCHENGEN_VISIT_STEPS: DraftStep[] = [
  { actor: "candidate", title: "Remplir la demande en ligne et prendre rendez-vous", description: "Le dépôt se fait auprès du pays de destination principale, au plus tôt 6 mois et en général au moins 15 jours avant le voyage." },
  { actor: "candidate", title: "Préparer les pièces", description: "Le passeport doit rester valide au moins 3 mois après le visa. Prévoir l'objet du voyage prouvé, les moyens de subsistance et l'assurance voyage.", documents: ["Passeport valide", "Deux photos d'identité", "Réservation d'hébergement ou invitation", "Billet aller-retour", "Relevés bancaires ou fiches de paie des 3 derniers mois", "Assurance voyage couvrant tous les États Schengen (30 000 € minimum)"] },
  { actor: "candidate", title: "Déposer le dossier en personne", description: "Le dépôt est obligatoire en personne, pour les empreintes digitales.", fee: "Frais de dossier de 90 € pour un court séjour" },
  { actor: "authority", title: "Décision", description: "Un dossier complet ne garantit pas la délivrance du visa. Le séjour est limité à 90 jours sur toute période de 180 jours." },
];
const SCHENGEN_NOTE = "Séjour de 90 jours au maximum sur toute période de 180 jours ; visa à entrées multiples possible dans cette limite cumulée.";
const schengenProgram: DraftProgram = { officialName: "Visa Schengen de court séjour (visa C)", nameFr: "Visa Schengen de court séjour", durationNote: SCHENGEN_NOTE, feesNote: "90 € de frais de dossier pour un court séjour.", steps: SCHENGEN_VISIT_STEPS };
const visit = (countryCode: string, label: string, url: string): DraftPathway => ({
  countryCode, pathway: "visit",
  summary: "Pour un séjour touristique, familial ou professionnel de moins de 90 jours, un visa Schengen est demandé selon la nationalité. Les pièces dépendent du poste de dépôt.",
  programs: [schengenProgram],
  sources: [{ label, url, authority: "immigration" }],
});

export const COUNTRY_CATALOG_DRAFTS: readonly DraftPathway[] = [
  // ─── Canada ───────────────────────────────────────────────────────────────────────────────────
  {
    countryCode: "CA", pathway: "work",
    summary: "Un permis de travail lié à un employeur suit en général une évaluation de l'impact sur le marché du travail (EIMT) demandée par l'employeur, puis la demande du candidat auprès d'IRCC.",
    programs: [{
      officialName: "Employer-specific work permit (LMIA / EIMT)", nameFr: "Permis de travail lié à un employeur (EIMT)", routeType: "employer", offerRequired: "yes", labourMarketTest: true,
      durationNote: "Durée liée au contrat et au volet choisi.", feesNote: "L'employeur paie 1 000 CAD par poste pour l'EIMT ; le candidat paie son permis de travail et la biométrie.",
      processingNote: "Les délais de l'EIMT varient par volet et changent chaque mois (de quelques jours pour Talents mondiaux à plusieurs semaines pour les volets haut et bas salaire), hors temps de recrutement.",
      steps: [
        { actor: "employer", title: "Choisir le volet", description: "Haut salaire, bas salaire, agricole, aide familial, résidence permanente ou Talents mondiaux : le volet fixe le recrutement, le salaire et les pièces." },
        { actor: "employer", title: "Vérifier le salaire offert", description: "Il doit au moins égaler le salaire médian ou prévalent pour la profession et le lieu de travail." },
        { actor: "employer", title: "Recruter d'abord localement", description: "Haut salaire : au moins 3 activités de recrutement dont une annonce de 4 semaines consécutives. Bas salaire : annonce d'au moins 8 semaines, notamment sur Job Bank." },
        { actor: "employer", title: "Déposer l'EIMT en ligne", description: "Jusqu'à 6 mois avant le début de l'emploi.", documents: ["Formulaire du volet", "Preuves de recrutement", "Preuves de légitimité de l'entreprise", "Offre d'emploi détaillée", "Preuve du salaire"], fee: "1 000 CAD par poste, payés par l'employeur" },
        { actor: "authority", title: "Décision sur l'EIMT", description: "Un EIMT positif donne une lettre à l'employeur, qu'il transmet au candidat avec l'offre d'emploi." },
        { actor: "candidate", title: "Déposer la demande de permis de travail", description: "En joignant l'EIMT positif et le contrat de travail.", documents: ["Passeport et photos", "EIMT positif et offre d'emploi", "Preuves financières et liens avec le pays de résidence selon le cas", "Examen médical ou certificat de police si demandé", "Biométrie"], fee: "Frais de permis de travail et de biométrie payés par le candidat" },
        { actor: "employer", title: "Remettre le contrat signé", description: "Au plus tard le premier jour de travail." },
      ],
    }],
    sources: [{ label: "EDSC : embaucher un travailleur étranger temporaire", url: "https://www.canada.ca/en/employment-social-development/services/foreign-workers.html", authority: "employment" }, { label: "IRCC : guide de demande de permis de travail depuis l'étranger", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/application/application-forms-guides/guide-5487-applying-work-permit-outside-canada.html", authority: "immigration" }],
  },
  {
    countryCode: "CA", pathway: "study",
    summary: "Le permis d'études suppose une lettre d'acceptation d'un établissement désigné, en général une attestation provinciale ou territoriale, et la preuve de fonds suffisants.",
    programs: [{
      officialName: "Study permit", nameFr: "Permis d'études", renewable: true,
      durationNote: "Liée à la durée du programme.", feesNote: "Permis d'études : 150 CAD. Biométrie : 85 CAD par personne, 170 CAD au maximum pour une famille.",
      processingNote: "Environ 30 à 50 jours pour une nouvelle demande hors du Canada ; traitement accéléré pour les doctorants.",
      steps: [
        { actor: "candidate", title: "Choisir un programme dans un établissement désigné" },
        { actor: "institution", title: "Obtenir la lettre d'acceptation", documents: ["Lettre d'acceptation de l'établissement"] },
        { actor: "authority", title: "Obtenir l'attestation provinciale ou territoriale", description: "Sauf exemption (notamment maîtrise et doctorat dans un établissement public). Le Québec a ses propres exigences.", documents: ["Attestation provinciale ou territoriale, ou preuve d'exemption"] },
        { actor: "candidate", title: "Réunir les preuves financières", description: "Frais de scolarité, frais de subsistance et voyage. Le seuil de fonds est révisé chaque 1er septembre : votre conseiller confirme le montant en vigueur.", documents: ["Passeport valide", "Preuves de fonds"] },
        { actor: "candidate", title: "Déposer la demande en ligne et payer", fee: "150 CAD + biométrie 85 CAD" },
        { actor: "candidate", title: "Donner empreintes et photo", description: "Dans les 30 jours suivant la lettre de biométrie." },
        { actor: "authority", title: "Décision", description: "Si le permis est approuvé, l'autorisation de voyage nécessaire est délivrée sans demande distincte." },
      ],
    }],
    sources: [{ label: "IRCC : demander un permis d'études", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/apply.html", authority: "immigration" }],
  },
  {
    countryCode: "CA", pathway: "visit",
    summary: "Selon la nationalité et le mode de transport, un visa de visiteur ou une autorisation de voyage électronique (AVE) est nécessaire, ou aucun des deux.",
    programs: [{
      officialName: "Temporary resident visa / eTA", nameFr: "Visa de visiteur ou AVE", durationNote: "Séjour de 6 mois en général ; l'agent à la frontière décide.",
      feesNote: "Visa de visiteur : 100 CAD par personne (500 CAD au maximum pour une famille de cinq ou plus), biométrie 85 CAD. AVE : 7 CAD, valable jusqu'à 5 ans ou l'expiration du passeport.",
      processingNote: "L'AVE est souvent approuvée en quelques minutes ; le visa de visiteur demande plusieurs semaines selon le pays.",
      steps: [
        { actor: "candidate", title: "Vérifier le document nécessaire", description: "Visa de visiteur, AVE ou exemption, selon la nationalité et le mode de transport." },
        { actor: "candidate", title: "Réunir les pièces", documents: ["Passeport valide", "Itinéraire et hébergement", "Relevés bancaires (idéalement 6 mois)", "Lettre d'invitation pour une visite familiale", "Autorisation parentale pour un mineur non accompagné"] },
        { actor: "candidate", title: "Déposer la demande en ligne et payer", description: "Pour le visa : compte IRCC, pièces, paiement, puis biométrie dans les 30 jours." },
      ],
    }],
    sources: [{ label: "IRCC : demander un visa de visiteur", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/apply-visitor-visa.html", authority: "immigration" }, { label: "IRCC : demander une AVE", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta/apply.html", authority: "immigration" }],
  },

  // ─── France ───────────────────────────────────────────────────────────────────────────────────
  {
    countryCode: "FR", pathway: "work",
    summary: "L'employeur demande l'autorisation de travail en ligne ; le candidat l'ajoute à sa demande de visa de long séjour valant titre de séjour.",
    programs: [{
      officialName: "Salarié / travailleur temporaire (VLS-TS)", nameFr: "Visa salarié ou travailleur temporaire", routeType: "employer", offerRequired: "yes",
      durationNote: "Visa de 12 mois au maximum, à valider en ligne dans les 3 mois suivant l'arrivée.", feesNote: "Une taxe employeur est due après l'octroi, selon le salaire.",
      steps: [
        { actor: "employer", title: "Demander l'autorisation de travail en ligne", description: "La demande se fait uniquement en ligne sur le portail dédié aux démarches des étrangers en France." },
        { actor: "authority", title: "Décision", description: "L'autorisation est envoyée par e-mail à l'employeur et au salarié. Un manquement de l'employeur au droit du travail ou social entraîne un refus." },
        { actor: "candidate", title: "Demander le visa de long séjour", description: "Mention « salarié » pour un CDI, « travailleur temporaire » pour un CDD. L'autorisation de travail est jointe à la demande.", documents: ["Autorisation de travail", "Contrat de travail", "Passeport valide"] },
        { actor: "candidate", title: "Valider le visa en ligne après l'arrivée", description: "Dans les 3 mois suivant l'arrivée en France." },
        { actor: "employer", title: "Vérifier le titre auprès de la préfecture", description: "Au moins 2 jours ouvrables avant l'embauche." },
      ],
    }],
    sources: [{ label: "Service-Public : autorisation de travail d'un étranger", url: "https://www.service-public.fr/particuliers/vosdroits/F35602", authority: "ministry" }, { label: "France-Visas : activité salariée", url: "https://france-visas.gouv.fr/web/france-visas/activite-salariee", authority: "immigration" }],
  },
  {
    countryCode: "FR", pathway: "study",
    summary: "Le visa de long séjour valant titre de séjour « étudiant » exige une admission préalable et des ressources suffisantes ; pour de nombreux pays, la préinscription passe par la procédure Études en France.",
    programs: [{
      officialName: "Visa long séjour étudiant (VLS-TS)", nameFr: "Visa étudiant", renewable: true, durationNote: "De 4 mois à 1 an, puis carte de séjour étudiant.",
      feesNote: "Frais de dossier de 99 € pour un visa de long séjour. Le montant mensuel de ressources exigé a changé : votre conseiller confirme le montant applicable à la date de votre dépôt.",
      steps: [
        { actor: "candidate", title: "Préinscrire et demander le visa sur la même plateforme", description: "Pour les pays concernés, la demande se fait en ligne avec la préinscription ; sinon, auprès du consulat de résidence." },
        { actor: "institution", title: "Obtenir l'accord préalable d'inscription" },
        { actor: "candidate", title: "Réunir le dossier", documents: ["Accord préalable d'inscription", "Dernier diplôme", "Justificatif d'hébergement", "Justificatifs financiers (attestation bancaire ou prise en charge par un garant résidant en France)", "Passeport valide au moins 1 an et 3 mois à la date du dépôt (selon le poste)"] },
        { actor: "candidate", title: "Valider le visa en ligne après l'arrivée", description: "Dans les 3 mois suivant l'arrivée ; une carte de séjour étudiant suit." },
      ],
    }],
    sources: [{ label: "France-Visas : étudiant", url: "https://france-visas.gouv.fr/etudiant", authority: "immigration" }],
  },
  visit("FR", "France-Visas : visa de court séjour", "https://france-visas.gouv.fr/en/visa-de-court-sejour"),

  // ─── Allemagne ────────────────────────────────────────────────────────────────────────────────
  {
    countryCode: "DE", pathway: "work",
    summary: "Les voies qualifiées reposent sur une offre ou un contrat concret, avec l'accord de l'Agence fédérale pour l'emploi obtenu pendant la procédure de visa. La Chancenkarte permet de chercher un emploi sans offre.",
    programs: [
      { officialName: "Visa für Fachkräfte", nameFr: "Visa travailleur qualifié", routeType: "qualified", offerRequired: "yes", steps: [
        { actor: "candidate", title: "Créer un compte sur le portail des services consulaires et déposer la demande de visa en ligne" },
        { actor: "authority", title: "Accord de l'Agence fédérale pour l'emploi", description: "Obtenu pendant la procédure de visa (2 semaines dans la procédure normale), sauf pour certaines Cartes bleues." },
        { actor: "candidate", title: "Retirer le visa national, puis demander le titre de séjour sur place" },
      ] },
      { officialName: "EU Blue Card", nameFr: "Carte bleue européenne", routeType: "qualified", offerRequired: "yes", durationNote: "Durée du contrat plus 3 mois, 4 ans au maximum.", feesNote: "Le seuil de salaire change chaque année : votre conseiller confirme le seuil en vigueur.", steps: [
        { actor: "candidate", title: "Faire reconnaître le diplôme", description: "Un diplôme reconnu et une offre d'un niveau de salaire suffisant sont exigés ; contrat d'au moins 6 mois." },
        { actor: "candidate", title: "Demander le visa puis la carte" },
      ] },
      { officialName: "Beschleunigtes Fachkräfteverfahren (§ 81a)", nameFr: "Procédure accélérée pour travailleurs qualifiés", routeType: "employer", offerRequired: "yes", durationNote: "Environ 4 mois.", feesNote: "411 € dus par l'employeur, quelle que soit l'issue.", steps: [
        { actor: "employer", title: "Demander à l'autorité des étrangers d'accélérer la procédure jusqu'à l'entrée du salarié", description: "Facultative ; une offre concrète est exigée." },
      ] },
      { officialName: "Chancenkarte (Opportunity Card)", nameFr: "Carte de recherche d'emploi", routeType: "jobseeker", offerRequired: "no", durationNote: "1 an au maximum ; travail à temps partiel jusqu'à 20 heures par semaine.", steps: [
        { actor: "candidate", title: "Remplir les conditions de qualification ou totaliser au moins 6 points", description: "Aucune offre préalable n'est nécessaire : ce n'est pas une voie avec contrat." },
      ] },
    ],
    sources: [{ label: "Make it in Germany : Carte bleue européenne", url: "https://www.make-it-in-germany.com/en/visa-residence/types/eu-blue-card", authority: "immigration" }, { label: "Make it in Germany : procédure accélérée", url: "https://www.make-it-in-germany.com/en/pdfs/brochure-fast-track-procedure-skilled-workers", authority: "immigration" }],
  },
  {
    countryCode: "DE", pathway: "study",
    summary: "Le visa étudiant suppose l'admission d'une université ou d'un Studienkolleg, la preuve du financement et, en général, un niveau de langue B2 dans la langue d'enseignement.",
    programs: [{
      officialName: "Nationales Visum zum Studium (§ 16b)", nameFr: "Visa national pour études", renewable: true,
      feesNote: "Frais de visa de l'ordre de 75 à 100 €. Le montant de ressources mensuel a été relevé : votre conseiller confirme le montant en vigueur. Compte bloqué : 70 à 150 € de frais d'ouverture selon la banque.",
      steps: [
        { actor: "institution", title: "Obtenir l'admission d'une université ou d'un Studienkolleg", description: "Le plus tôt possible." },
        { actor: "candidate", title: "Prouver le financement", description: "Compte bloqué (seule l'attestation d'ouverture est exigée au dépôt), bourse, revenus des parents ou déclaration d'engagement." },
        { actor: "candidate", title: "Demander le visa auprès de la mission allemande", documents: ["Passeport", "Diplômes", "Preuve de langue (en général B2)", "Assurance maladie"] },
      ],
    }],
    sources: [{ label: "Ambassade d'Allemagne : visa pour études", url: "https://www.germany.info/us-en/service/visa/study-visa-916776", authority: "embassy" }],
  },
  visit("DE", "Auswärtiges Amt : visa Schengen", "https://www.auswaertiges-amt.de/en/visa-service"),

  // ─── Belgique ─────────────────────────────────────────────────────────────────────────────────
  {
    countryCode: "BE", pathway: "work",
    summary: "Le permis unique réunit l'autorisation de séjour et de travail pour un contrat de 90 jours ou plus. L'employeur dépose la demande dans la région du lieu de travail principal.",
    programs: [{
      officialName: "Permis unique (autorisation de travail et de séjour)", nameFr: "Permis unique", routeType: "employer", offerRequired: "yes",
      processingNote: "De 1 à 2 mois pour un dossier complet, le double si le dossier est incomplet.",
      steps: [
        { actor: "employer", title: "Déposer la demande dans la région compétente", description: "Bruxelles : portail fédéral « Guichet unique » depuis le 4 mai 2026. Wallonie : portail fédéral Working in Belgium. Un employeur établi à l'étranger agit par une personne résidant en Belgique munie d'un mandat." },
        { actor: "authority", title: "Décision régionale puis décision de séjour" },
        { actor: "candidate", title: "Demander le visa D auprès du poste diplomatique" },
        { actor: "employer", title: "Déclarer le travailleur", description: "Déclaration DIMONA avant le début du travail ; mêmes conditions qu'un travailleur belge comparable ; copie du permis conservée." },
      ],
    }],
    sources: [{ label: "Bruxelles Économie et Emploi : autorisation de travail", url: "https://economie-emploi.brussels/autorisation-travail", authority: "employment" }, { label: "Wallonie : permis unique de durée limitée", url: "https://emploi.wallonie.be/home/travailleurs-etrangers/permis-de-travail/vous-etes-employeur/que-devez-vous-faire/permis-unique-de-duree-limitee.html", authority: "employment" }],
  },
  {
    countryCode: "BE", pathway: "study",
    summary: "Le visa D études exige une lettre d'admission, la preuve de moyens de subsistance ou une prise en charge par un garant, une assurance et un logement.",
    programs: [{
      officialName: "Visa D études", nameFr: "Visa étudiant (visa D)",
      processingNote: "Demander au plus tôt 6 mois avant le début ; plusieurs semaines de traitement, davantage pour les établissements privés. Un dossier incomplet n'est pas traité.",
      steps: [
        { actor: "institution", title: "Obtenir la lettre d'admission d'un établissement belge" },
        { actor: "candidate", title: "Réunir les pièces", documents: ["Moyens de subsistance suffisants ou déclaration de prise en charge d'un garant", "Assurance maladie couvrant tout le séjour", "Justificatif de logement", "Preuve de retour"] },
        { actor: "candidate", title: "Déposer la demande en personne", description: "Empreintes digitales et questionnaire sur le parcours et le projet d'études, souvent par un prestataire de dépôt." },
        { actor: "authority", title: "Décision de l'Office des étrangers" },
      ],
    }],
    sources: [{ label: "Ambassade de Belgique : visa d'études", url: "https://cameroon.diplomatie.belgium.be/sites/default/files/files/procedure_demande_visa_etudes.pdf", authority: "embassy" }],
  },
  visit("BE", "Diplomatie belge : visa C court séjour", "https://republiquedecoree.diplomatie.belgium.be/en/travel-belgium/visa-belgium/visa-c-short-stays-90-days"),

  // ─── Luxembourg ───────────────────────────────────────────────────────────────────────────────
  {
    countryCode: "LU", pathway: "work",
    summary: "Le salarié de pays tiers obtient une autorisation de séjour temporaire avant l'entrée ; l'employeur doit d'abord déclarer le poste à l'ADEM. La Carte bleue suit un parcours distinct.",
    programs: [
      { officialName: "Autorisation de séjour travailleur salarié", nameFr: "Salarié de pays tiers", routeType: "employer", offerRequired: "yes", labourMarketTest: true, steps: [
        { actor: "employer", title: "Déclarer le poste vacant à l'ADEM", description: "Sans candidat adapté sur le marché local sous 3 semaines, l'ADEM peut délivrer un certificat l'autorisant à embaucher un ressortissant de pays tiers." },
        { actor: "candidate", title: "Demander l'autorisation de séjour temporaire depuis le pays d'origine", description: "Auprès de la Direction générale de l'immigration ou d'un poste consulaire, avec le certificat de l'ADEM." },
        { actor: "authority", title: "Décision du ministère", description: "Réponse sous 3 mois au maximum ; le silence vaut rejet." },
        { actor: "candidate", title: "Déclarer son arrivée", description: "La déclaration d'arrivée et l'autorisation temporaire tiennent lieu d'autorisation de travail et de séjour jusqu'au titre de séjour." },
      ] },
      { officialName: "Carte bleue européenne", nameFr: "Carte bleue européenne", routeType: "qualified", offerRequired: "yes", durationNote: "En principe 4 ans, ou la durée du contrat plus 3 mois.", feesNote: "Le seuil de salaire est fixé par règlement et change : votre conseiller confirme le seuil en vigueur.", steps: [
        { actor: "candidate", title: "Obtenir l'autorisation de séjour temporaire avant l'entrée", description: "Une demande déposée depuis le territoire est irrecevable." },
        { actor: "candidate", title: "Demander le titre « carte bleue européenne » dans les 3 mois suivant l'arrivée", description: "Le titre inclut l'autorisation de travail." },
      ] },
    ],
    sources: [{ label: "Guichet.lu : salarié de pays tiers", url: "https://guichet.public.lu/fr/citoyens/immigration/plus-3-mois/ressortissant-tiers/salarie/salarie-pays-tiers.html", authority: "immigration" }, { label: "Guichet.lu : carte bleue européenne", url: "https://guichet.public.lu/fr/citoyens/immigration/plus-3-mois/ressortissant-tiers/hautement-qualifie/salarie-hautement-qualifie.html", authority: "immigration" }],
  },
  {
    countryCode: "LU", pathway: "study",
    summary: "L'autorisation de séjour pour études se demande avant l'entrée, depuis le pays d'origine, puis le titre de séjour étudiant dans les 3 mois suivant l'arrivée.",
    programs: [{
      officialName: "Autorisation de séjour pour études", nameFr: "Séjour pour études", renewable: true,
      steps: [
        { actor: "candidate", title: "Demander l'autorisation de séjour temporaire avant l'entrée", description: "Sur papier libre, auprès de la Direction générale de l'immigration ou d'un poste consulaire.", documents: ["Copie complète du passeport", "Extrait de casier judiciaire ou déclaration sur l'honneur", "Preuve d'admission à temps plein dans un établissement supérieur luxembourgeois", "Preuve de ressources (au moins 80 % du revenu d'inclusion sociale)", "Assurance maladie"] },
        { actor: "authority", title: "Autorisation temporaire", description: "Reçue par courrier, valable 90 jours ; un visa D est nécessaire pour les nationalités soumises au visa." },
        { actor: "institution", title: "Finaliser l'inscription", description: "L'inscription ne peut pas être finalisée sans l'autorisation temporaire." },
        { actor: "candidate", title: "Demander le titre de séjour étudiant dans les 3 mois suivant l'arrivée" },
      ],
    }],
    sources: [{ label: "Guichet.lu : étudiant de pays tiers", url: "https://guichet.public.lu/fr/citoyens/immigration/plus-3-mois/ressortissant-tiers/etudiant/etudiant-pays-tiers.html", authority: "immigration" }],
  },
  visit("LU", "Guichet.lu : entrée au Luxembourg", "https://guichet.public.lu/fr/citoyens/immigration/plus-3-mois/ressortissant-tiers/demarches-communes/entree-visa.html"),

  // ─── Royaume-Uni ──────────────────────────────────────────────────────────────────────────────
  {
    countryCode: "GB", pathway: "work",
    summary: "Le visa Skilled Worker exige un employeur titulaire d'une licence de parrainage et un certificat de parrainage (CoS) attribué au candidat.",
    programs: [{
      officialName: "Skilled Worker visa", nameFr: "Visa Skilled Worker", routeType: "employer", offerRequired: "yes", sponsorLicenceRequired: true, familyAllowed: true,
      feesNote: "L'employeur paie les frais du certificat de parrainage et ne peut jamais les faire payer au travailleur. Les frais de visa et la surcharge de santé du candidat sont mis à jour chaque année : votre conseiller confirme les montants en vigueur.",
      processingNote: "Certificat « défini » en général sous un jour ouvrable, « non défini » en général sous 12 semaines.",
      steps: [
        { actor: "employer", title: "Détenir une licence de parrainage", description: "La demande de licence prend en général environ 8 semaines." },
        { actor: "employer", title: "Attribuer un certificat de parrainage au candidat", description: "C'est un enregistrement électronique." },
        { actor: "candidate", title: "Demander le visa en ligne avec la référence du certificat", description: "Dans les 3 mois suivant l'attribution, et au plus tôt 3 mois avant le début du poste. Des conditions de métier, de salaire et de niveau d'anglais s'appliquent." },
        { actor: "candidate", title: "Donner les biométries", description: "Puis décision." },
      ],
    }],
    sources: [{ label: "GOV.UK : certificats de parrainage", url: "https://www.gov.uk/uk-visa-sponsorship-employers/certificates-of-sponsorship", authority: "immigration" }, { label: "GOV.UK : Skilled Worker, votre poste", url: "https://www.gov.uk/skilled-worker-visa/your-job", authority: "immigration" }],
  },
  {
    countryCode: "GB", pathway: "study",
    summary: "Le visa Student exige un numéro CAS délivré par l'établissement, la preuve de fonds détenus pendant 28 jours consécutifs et le paiement de la surcharge de santé.",
    programs: [{
      officialName: "Student visa", nameFr: "Visa Student", renewable: true,
      feesNote: "Frais de visa et surcharge de santé : montants mis à jour régulièrement, confirmés par votre conseiller.",
      steps: [
        { actor: "institution", title: "Obtenir le numéro CAS (confirmation d'acceptation)" },
        { actor: "candidate", title: "Prouver les fonds", description: "Frais de scolarité (indiqués sur le CAS) plus frais de subsistance, détenus au moins 28 jours consécutifs, la période se terminant dans les 31 jours avant la demande." },
        { actor: "candidate", title: "Demander le visa en ligne", description: "Au plus tôt 3 mois avant le début du cours, et payer la surcharge de santé." },
      ],
    }],
    sources: [{ label: "GOV.UK : Student visa", url: "https://www.gov.uk/student-visa", authority: "immigration" }],
  },
  {
    countryCode: "GB", pathway: "visit",
    summary: "Le Standard Visitor permet un séjour de 6 mois en général pour tourisme, visite familiale ou certaines réunions. Certaines nationalités demandent une ETA au lieu d'un visa.",
    programs: [{
      officialName: "Standard Visitor visa / ETA", nameFr: "Visa Standard Visitor ou ETA", durationNote: "6 mois par séjour en général (jusqu'à 11 mois pour soins médicaux privés).",
      feesNote: "Frais du visa et de l'ETA : montants mis à jour, confirmés par votre conseiller.",
      steps: [
        { actor: "candidate", title: "Vérifier si un visa, une ETA ou rien n'est nécessaire selon la nationalité" },
        { actor: "candidate", title: "Demander en ligne avant le voyage", description: "Au plus tôt 3 mois avant le voyage. Autorisé : tourisme, visite familiale, bénévolat de 30 jours au plus avec une association enregistrée, transit, certaines réunions. Interdit : travail pour une entreprise britannique, aides publiques, mariage." },
      ],
    }],
    sources: [{ label: "GOV.UK : Standard Visitor", url: "https://www.gov.uk/standard-visitor", authority: "immigration" }],
  },

  // ─── Émirats arabes unis ──────────────────────────────────────────────────────────────────────
  {
    countryCode: "AE", pathway: "work",
    summary: "L'employeur obtient le permis de travail, puis le permis d'entrée ; le salarié termine les formalités de résidence dans le mois suivant son arrivée. Travailler avec un visa de visite est interdit.",
    programs: [{
      officialName: "Employment visa / MoHRE work permit", nameFr: "Permis de travail et visa de résidence employé", routeType: "employer", offerRequired: "yes",
      durationNote: "Résidence de un ou deux ans selon le contrat.", feesNote: "L'employeur prend en charge le visa d'entrée, le voyage, les examens médicaux à l'arrivée et le permis de résidence.",
      processingNote: "Le permis de travail est en général délivré en environ 5 jours calendaires.",
      steps: [
        { actor: "employer", title: "Émettre une offre conforme au modèle du ministère, signée par les deux parties et enregistrée" },
        { actor: "employer", title: "Demander le permis de travail", documents: ["Photo", "Passeport valide 6 mois", "Diplômes authentifiés si le poste l'exige", "Lettre d'approbation professionnelle le cas échéant"] },
        { actor: "employer", title: "Obtenir le permis d'entrée", description: "Le candidat ne doit pas travailler avec un visa de visite ou de tourisme." },
        { actor: "candidate", title: "Terminer les formalités dans le mois suivant l'entrée", description: "Examen médical (test VIH obligatoire pour tout demandeur de résidence), contrôle de sécurité, carte Emirates ID, visa de résidence." },
      ],
    }],
    sources: [{ label: "u.ae : employer des expatriés", url: "https://u.ae/en/information-and-services/moving-to-the-uae/expatriates-working-in-the-uae/employment-of-expatriates-in-privately-held-companies", authority: "ministry" }, { label: "u.ae : dispositions du visa de résidence", url: "https://u.ae/en/information-and-services/visa-and-emirates-id/Visa-information/general-provisions-for-the-residence-visa", authority: "immigration" }],
  },
  {
    countryCode: "AE", pathway: "study",
    summary: "La résidence pour études est parrainée par l'université accréditée ou par un parent résident, avec admission, assurance santé et examen médical.",
    programs: [{
      officialName: "Residence visa for studying", nameFr: "Résidence pour études", durationNote: "Liée au programme ; 180 jours de séjour après la fin des études.",
      steps: [
        { actor: "institution", title: "Obtenir la lettre d'admission officielle (première inscription)" },
        { actor: "candidate", title: "Réunir les pièces", documents: ["Passeport valide 6 mois", "Photo", "Assurance santé", "Lettre d'admission ou preuve d'inscription"] },
        { actor: "institution", title: "Déposer la demande de résidence", description: "Parrainage par l'université ou un parent ; approbation de la direction de la résidence de l'émirat et examen médical." },
      ],
    }],
    sources: [{ label: "u.ae : résidence pour études", url: "https://u.ae/en/information-and-services/visa-and-emirates-id/Types-of-visas/residence-visa-for-studying-in-the-uae", authority: "immigration" }],
  },
  {
    countryCode: "AE", pathway: "visit",
    summary: "Les ambassades n'émettent pas de visa touristique : la demande passe par une compagnie aérienne basée aux Émirats, une agence ou un hôtel.",
    programs: [{
      officialName: "Tourist visa", nameFr: "Visa touristique", durationNote: "Séjours de 30, 60 ou 90 jours, prolongeables selon la décision de l'autorité. Le visa à entrées multiples de 5 ans autorise 90 jours par séjour et 180 jours par an au maximum.",
      feesNote: "Retard de sortie : amende de 50 AED par jour.",
      steps: [
        { actor: "candidate", title: "Choisir la durée et le type de visa" },
        { actor: "agency", title: "Faire déposer la demande par un organisme basé aux Émirats", description: "Compagnie aérienne, agence ou hôtel où vous séjournez." },
        { actor: "candidate", title: "Réunir les pièces", documents: ["Passeport valide 6 mois", "Billet retour", "Assurance santé (pour le visa de 5 ans, une couverture émise aux Émirats est exigée)"] },
      ],
    }],
    sources: [{ label: "u.ae : visa touristique", url: "https://u.ae/en/information-and-services/visa-and-emirates-id/Types-of-visas/tourist-visa", authority: "immigration" }],
  },
];
