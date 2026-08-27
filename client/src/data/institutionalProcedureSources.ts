/**
 * Références institutionnelles collectées le 27 août 2026 pour les fiches publiques.
 * Les points de préparation excluent volontairement les montants, délais et appréciations
 * individuelles : le portail de l'autorité reste la source de référence.
 */

export type InstitutionalProcedureSource = {
  procedureId: string;
  officialUrl: string;
  sourceTitle: string;
  consultedOn: string;
  preparationPoints: string[];
  caveat: string;
};

export const INSTITUTIONAL_PROCEDURE_SOURCES: InstitutionalProcedureSource[] = [
  {
    "procedureId": "albanie-evisa",
    "officialUrl": "https://e-visa.al/",
    "sourceTitle": "Système d'application e-Visa - République d'Albanie",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Documents traduits en albanais ou anglais et scannés en format PDF",
      "Justificatifs incluant une photo aux normes, la réservation du vol retour et une preuve d'hébergement"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "allemagne-etudes",
    "officialUrl": "https://www.auswaertiges-amt.de/fr/02-entree-sejour/02-etudier-en-allemagne-seite-1281874",
    "sourceTitle": "FAQ : Etudier en Allemagne - Ministère fédéral des Affaires étrangères",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Justification de l'admission ou inscription universitaire",
      "Preuve de financement garanti des études",
      "Vérification de la reconnaissance des diplômes étrangers via anabin"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "allemagne-travail",
    "officialUrl": "https://www.make-it-in-germany.com/fr/visa-sejour/types/travailleurs-qualifies",
    "sourceTitle": "Visa de travail pour travailleurs qualifiés - Make it in Germany",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Obtention d'une reconnaissance d'équivalence pour les diplômes étrangers",
      "Présentation d'une offre d'emploi concrète pour un poste qualifié",
      "Approbation préalable de l'Agence fédérale pour l'emploi (BA)"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "allemagne-visiteur",
    "officialUrl": "https://www.auswaertiges-amt.de/fr/02-entree-sejour/01-visabestimmungen-1361042",
    "sourceTitle": "Visas pour l’Allemagne - Ministère fédéral des Affaires étrangères",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Compléter le formulaire de demande en ligne via le portail Videx et prendre rendez-vous consulaire",
      "Présenter un passeport valide et des justificatifs relatifs à l'objet et aux conditions du séjour",
      "Justifier de moyens de subsistance suffisants ou d'une déclaration d'engagement de l'hôte et d'une assurance voyage"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "australie-etudes",
    "officialUrl": "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500",
    "sourceTitle": "Subclass 500 Student visa",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Inscription préalable et obtention d'une Confirmation of Enrolment (CoE)",
      "Souscription à une couverture santé pour étudiants étrangers (OSHC)",
      "Soumission de la demande en ligne via ImmiAccount"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "australie-travail",
    "officialUrl": "https://immi.homeaffairs.gov.au/visas/working-in-australia",
    "sourceTitle": "Working in Australia - Department of Home Affairs",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Identifier le visa adapté au projet professionnel",
      "Préparer un passeport valide et les preuves de compétences"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "autriche-etudes",
    "officialUrl": "https://oead.at/en/to-austria/entry-and-residence/residence-permit-student-no-mobility-programme",
    "sourceTitle": "Residence permit – student no mobility programme",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Admission : Obtention d'une notification d'admission (Zulassungsbescheid) d'un établissement d'enseignement supérieur autrichien",
      "Logement et Santé : Preuve d'un hébergement adéquat et d'une assurance maladie couvrant tous les risques en Autriche"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "autriche-travail",
    "officialUrl": "https://www.migration.gv.at/en/types-of-immigration/permanent-immigration/",
    "sourceTitle": "Permanent Immigration - Austria Migration Platform",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Obtention de la Carte Rouge-Blanc-Rouge pour travailleurs qualifiés",
      "Justification de ressources financières mensuelles suffisantes",
      "Preuve d'une couverture d'assurance maladie complète en Autriche"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "autriche-visiteur",
    "officialUrl": "https://www.bmeia.gv.at/fr/ambassade-dautriche-a-paris/voyages-en-autriche/entree-et-sejour/visa",
    "sourceTitle": "Visa – Ministère fédéral des Affaires étrangères d'Autriche",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Justificatifs de ressources financières suffisantes ou déclaration de prise en charge électronique"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "bahrein-evisa",
    "officialUrl": "https://www.evisa.gov.bh/",
    "sourceTitle": "Bahrain Electronic Visa Service",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Billet d'avion retour et preuve d'hébergement à Bahreïn",
      "Relevé bancaire récent au nom du demandeur"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "belgique-etudes",
    "officialUrl": "https://diplomatie.belgium.be/fr/venir-en-belgique/etudier-en-belgique",
    "sourceTitle": "Etudier en Belgique | SPF Affaires étrangères",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Déterminer la nécessité d'un visa auprès de l'ambassade ou du consulat",
      "Consulter les portails officiels Study in Belgium ou Study in Flanders",
      "Vérifier l'équivalence des diplômes étrangers auprès des Communautés"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "belgique-visiteur",
    "officialUrl": "https://dofi.ibz.be/fr/themes/third-country-nationals/court-sejour",
    "sourceTitle": "Court séjour - Office des Étrangers",
    "consultedOn": "2026-08-27",
    "preparationPoints": [],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "bulgarie-travail",
    "officialUrl": "https://www.az.government.bg/pages/au-predostaviane-na-razreshenie-za-dostup-do-pazara-na-truda-na-na-rabotnici-gravdani-ot-treti-durvavi/",
    "sourceTitle": "Permis de travail pour les ressortissants de pays tiers - Agence pour l'emploi",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Demande de permis de travail par l'employeur bulgare",
      "Sollicitation d'un visa de type D au consulat",
      "Preuves de ressources, logement et assurance santé"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "cambodge-evisa",
    "officialUrl": "https://www.evisa.gov.kh/",
    "sourceTitle": "eVisa Kingdom of Cambodia (Official Government Website)",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Remplissage du formulaire de demande en ligne avec les détails du passeport"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "canada-etudes",
    "officialUrl": "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada/permis-etudes.html",
    "sourceTitle": "Permis d'études : À propos du processus",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Inscription dans un établissement d'enseignement désigné (EED)",
      "Preuve de ressources financières suffisantes",
      "Obtention d'une lettre d'acceptation officielle"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "canada-travail",
    "officialUrl": "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/travailler-canada/permis-exterieur.html",
    "sourceTitle": "Permis de travail : Présentation d’une demande à l’extérieur du Canada",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Préparer les formulaires et documents requis par le bureau des visas local"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "chypre-travail",
    "officialUrl": "https://www.gov.cy/mip-md/en/documents/remunerated-employment-single-permit-gen-3/",
    "sourceTitle": "Migration Department - Remunerated employment (single permit – GEN)",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Contrat de travail validé par le Département du Travail",
      "Certificat de casier judiciaire et examens médicaux (tests sanguins et radio)",
      "Passeport en cours de validité et assurance santé locale"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "chypre-visiteur",
    "officialUrl": "https://www.gov.cy/mip-md/en/documents/visitors-and-family-members/",
    "sourceTitle": "Visitors and family members - Migration Department",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Soumission du formulaire MVIS8 avec documents justificatifs traduits et certifiés",
      "Entrée légale avec visa et document de voyage valides via les points officiels"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "croatie-travail",
    "officialUrl": "https://mup.gov.hr/aliens-281621/stay-and-work/work-of-third-country-nationals/281663",
    "sourceTitle": "Travail des ressortissants de pays tiers en Croatie",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Permis de séjour et de travail unique requis",
      "Test du marché du travail préalable par l'employeur",
      "Travail limité au poste et à l'employeur spécifiés"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "croatie-visiteur",
    "officialUrl": "https://mvep.gov.hr/services-for-citizens/consular-information-22802/visas-22807/issuance-procedure/enclosed-documents/22821",
    "sourceTitle": "Documents justificatifs pour visa Schengen",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Formulaire de demande complété et signé avec photo aux normes ICAO"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "danemark-etudes",
    "officialUrl": "https://www.nyidanmark.dk/en-GB/You-want-to-apply/Study/Higher-Education",
    "sourceTitle": "Higher educational programmes",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Admission dans un programme d'enseignement supérieur",
      "Preuve de compétences linguistiques",
      "Capacité financière à subvenir à ses besoins"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "danemark-travail",
    "officialUrl": "https://nyidanmark.dk/en-GB/You-want-to-apply/Work",
    "sourceTitle": "Portail officiel New to Denmark - Permis de travail",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Obtention préalable d'une offre d'emploi au Danemark",
      "Identification du programme de permis adapté au profil (Pay Limit, Positive List)",
      "Demande conjointe de permis de séjour et de travail auprès de SIRI"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "danemark-visiteur",
    "officialUrl": "https://nyidanmark.dk/en-GB/You-want-to-apply/Short-stay-visa/Private-visits-and-tourist-visits-",
    "sourceTitle": "Apply for a short term visa to private visits and tourist visits",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Justifier de l'intention de retour avant l'expiration du visa",
      "Vérifier les conditions spécifiques selon le groupe de pays du demandeur",
      "Présenter des preuves de l'objet du séjour privé ou touristique"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "djibouti-evisa",
    "officialUrl": "https://www.evisa.gouv.dj/",
    "sourceTitle": "Djibouti electronic visa platform",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Réservation de vol et adresse d'hébergement",
      "Lettre d'invitation (organisation ou hôte)"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "dubai-evisa",
    "officialUrl": "https://u.ae/en/information-and-services/visa-and-emirates-id/tourist-visa",
    "sourceTitle": "Visa touristique - Portail officiel du gouvernement des Émirats arabes unis",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Demande via un sponsor agréé (compagnie aérienne, hôtel ou agence)",
      "Passeport valide et photographie en couleur",
      "Assurance médicale couvrant le séjour aux Émirats"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "egypte-evisa",
    "officialUrl": "https://visa2egypt.gov.eg/",
    "sourceTitle": "Egypt e-Visa Portal",
    "consultedOn": "2026-08-27",
    "preparationPoints": [],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "espagne-etudes",
    "officialUrl": "https://www.inclusion.gob.es/web/migraciones/w/estancia-por-estudios",
    "sourceTitle": "Autorisation de séjour pour études en Espagne",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Admission dans un établissement d'enseignement agréé",
      "Assurance maladie auprès d'un assureur autorisé en Espagne"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "espagne-travail",
    "officialUrl": "https://www.inclusion.gob.es/web/migraciones/w/autorizacion-inicial-de-residencia-temporal-y-trabajo-por-cuenta-ajena-hi-16-",
    "sourceTitle": "Autorisation de résidence et travail salarié - Ministère de l'Inclusion",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Contrat de travail signé garantissant une activité continue",
      "Absence d'antécédents pénaux sur les cinq dernières années",
      "Vérification de la situation nationale de l'emploi"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "espagne-visiteur",
    "officialUrl": "https://www.inclusion.gob.es/web/migraciones/w/autorizacion-inicial-de-residencia-temporal-no-lucrativa",
    "sourceTitle": "Hoja 6 - Autorización inicial de residencia temporal no lucrativa",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Souscription à une assurance maladie complète auprès d'un assureur agréé en Espagne",
      "Présentation d'un certificat d'antécédents pénaux et d'un certificat médical officiel"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "estonie-travail",
    "officialUrl": "https://www.politsei.ee/en/instructions/residence-permit-for-employment",
    "sourceTitle": "Residence permit for employment",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Justifier des compétences et de l'expérience professionnelle adaptées au poste",
      "Vérifier que l'employeur est enregistré en Estonie et dispose de l'autorisation de recrutement"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "estonie-visiteur",
    "officialUrl": "https://vm.ee/en/consular-visa-and-travel-information/visa-information/application-schengen-visa",
    "sourceTitle": "Application for a Schengen visa",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Remplir le formulaire de demande de visa Schengen en ligne, l'imprimer et le signer",
      "Disposer d'un passeport valide au moins trois mois après le départ prévu avec deux pages vierges"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "etats-unis-travail",
    "officialUrl": "https://www.uscis.gov/working-in-the-united-states",
    "sourceTitle": "Working in the United States | USCIS",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Identification de la classification de visa (temporaire ou permanent)",
      "Dépôt d'une pétition par l'employeur auprès de l'USCIS",
      "Demande de visa auprès du Département d'État pour les résidents hors USA"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "ethiopie-evisa",
    "officialUrl": "https://www.evisa.gov.et/",
    "sourceTitle": "Tourist Visa-VT - Ethiopia eVisa",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Photo récente format passeport"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "finlande-etudes",
    "officialUrl": "https://migri.fi/en/studying-in-finland",
    "sourceTitle": "Studying in Finland - Finnish Immigration Service",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Acceptation préalable dans un établissement d'enseignement supérieur ou professionnel finlandais"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "finlande-travail",
    "officialUrl": "https://migri.fi/en/residence-permit-for-an-employed-person",
    "sourceTitle": "Residence permit for an employed person (TTOL) - Maahanmuuttovirasto",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Emploi confirmé requis avant le dépôt de la demande",
      "Dépôt de la première demande de permis de séjour depuis l'étranger"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "finlande-visiteur",
    "officialUrl": "https://um.fi/visa-to-visit-finland",
    "sourceTitle": "A visa to visit Finland - Ministry for Foreign Affairs",
    "consultedOn": "2026-08-27",
    "preparationPoints": [],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "france-etudes",
    "officialUrl": "https://france-visas.gouv.fr/etudiant",
    "sourceTitle": "France-Visas - Étudiant",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Inscription préalable dans un établissement d'enseignement supérieur",
      "Numérisation des pièces justificatives pour la demande en ligne"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "france-travail",
    "officialUrl": "https://www.service-public.gouv.fr/particuliers/vosdroits/R49998",
    "sourceTitle": "S'inscrire à France Travail (anciennement Pôle emploi)",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Création d'un espace personnel en ligne avec une adresse mail valide",
      "Préparation des pièces justificatives (identité, sécurité sociale, titre de séjour)",
      "Renseignement du parcours professionnel et du projet de recherche d'emploi"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "france-visiteur",
    "officialUrl": "https://france-visas.gouv.fr/web/france-visas/sejour-touristique-de-plus-de-3-mois",
    "sourceTitle": "Séjour touristique de plus de 3 mois - France-Visas",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Engagement formel à n'exercer aucune activité professionnelle en France",
      "Justification de ressources financières suffisantes et de la situation socio-économique",
      "Preuve d'hébergement et d'une couverture médicale couvrant le séjour"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "gabon-travail",
    "officialUrl": "https://fonction-publique.gouv.ga/149-services-aux-usagers/1758-demande-d-autorisation-et-de-renouvellement-d-emploi/1759-demande-d-autorisation-et-de-renouvellement-d-emploi/",
    "sourceTitle": "Demande d'autorisation et de renouvellement d'emploi",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Lettre de demande motivée adressée au Ministre",
      "CV, copies des diplômes et du passeport du travailleur",
      "Dossier juridique de l'entreprise employeuse (fiche circuit, statuts, CNSS)"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "grece-travail",
    "officialUrl": "https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/employed-worker-greece_en",
    "sourceTitle": "Employed worker in Greece - European Commission",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Obtention d'un visa national (type D) pour emploi salarié avant le départ",
      "Demande de permis de séjour auprès de l'Administration Décentralisée dès l'arrivée",
      "Présentation d'un contrat de travail d'au moins un an et d'une assurance santé complète"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "grece-visiteur",
    "officialUrl": "https://www.mfa.gr/usa/en/services/visas/",
    "sourceTitle": "Visas - Greece in the USA",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Preuve de ressources financières suffisantes et stables",
      "Certificats de santé et de moralité",
      "Assurance médicale de voyage"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "hongrie-etudes",
    "officialUrl": "https://oif.gov.hu/factsheets/residence-of-the-student-pupil",
    "sourceTitle": "Permis de séjour pour études - OIF Hongrie",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Certificat d'admission d'un établissement d'enseignement supérieur",
      "Justificatif de ressources financières suffisantes",
      "Preuve d'assurance maladie complète"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "hongrie-travail",
    "officialUrl": "https://oif.gov.hu/factsheets/residence-permit-for-the-purpose-of-employment",
    "sourceTitle": "Residence permit for the purpose of employment",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "L'objet du séjour doit être l'exercice d'une activité professionnelle réelle pour le compte d'autrui contre rémunération",
      "La demande peut être déposée par voie électronique via la plateforme Enter Hungary ou en personne auprès d'une direction régionale",
      "Un document de voyage valide et une preuve de relation d'emploi (contrat ou offre d'emploi) sont requis"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "hongrie-visiteur",
    "officialUrl": "https://konzinfo.mfa.gov.hu/en/short-term-stay",
    "sourceTitle": "Short Term Stay - Visiting friends, acquaintances",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Lettre d'invitation notariée ou déclaration signée",
      "Justificatifs de ressources financières suffisantes"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "inde-evisa",
    "officialUrl": "https://indianvisaonline.gov.in/evisa/tvoa.html",
    "sourceTitle": "e-Visa - Government of India",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Passeport valide au moins six mois",
      "Photographie récente sur fond blanc et scan du passeport",
      "Billet de retour ou de continuation et fonds suffisants"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "irlande-travail",
    "officialUrl": "https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/",
    "sourceTitle": "Employment permits - DETE",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Soumission d'un contrat de travail signé par les deux parties",
      "Vérification de la nécessité d'un test du marché du travail (annonce EURES)"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "islande-travail",
    "officialUrl": "https://island.is/en/permit-based-on-work",
    "sourceTitle": "Residence permit based on work | Ísland.is",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Contrat de travail et preuve de qualification"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "islande-visiteur",
    "officialUrl": "https://island.is/en/get-a-visa/supporting-documents",
    "sourceTitle": "Documents justificatifs pour un visa pour l'Islande",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Justificatifs de moyens financiers suffisants ou garantie de l'hôte"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "italie-etudes",
    "officialUrl": "https://www.universitaly.it/",
    "sourceTitle": "Universitaly - Portail officiel du Ministère de l'Université et de la Recherche",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Demande de visa d'études national (type D) auprès de la représentation diplomatique italienne"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "italie-travail",
    "officialUrl": "https://www.interno.gov.it/it/temi/immigrazione-e-asilo/modalita-dingresso/visto-e-permesso-soggiorno",
    "sourceTitle": "Visto e permesso di soggiorno - Ministero dell'Interno",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Obtention préalable d'un \"nulla osta\" au travail par l'employeur auprès du Sportello Unico per l'Immigrazione"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "italie-visiteur",
    "officialUrl": "https://consparigi.esteri.it/it/servizi-consolari-e-visti/servizi-per-il-cittadino-straniero/visti/residenza-elettiva-elective-residency/",
    "sourceTitle": "Residenza elettiva – Elective residency – Consolato Generale d'Italia a Parigi",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Justification de ressources financières passives substantielles et régulières",
      "Preuve d'hébergement en Italie via un titre de propriété ou un contrat de location enregistré",
      "Assurance médicale internationale avec couverture complète des risques"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "kenya-travail",
    "officialUrl": "https://immigration.go.ke/work-permits-and-passes/",
    "sourceTitle": "Work Permits and Passes - Department of Immigration Services",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Soumission des demandes exclusivement en ligne via le portail eFNS",
      "Téléchargement des documents justificatifs requis lors de la procédure numérique",
      "Impression et présentation du permis aux services d'immigration pour endossement final"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "lettonie-travail",
    "officialUrl": "https://www.pmlp.gov.lv/en/employment-foreigners",
    "sourceTitle": "Employment of foreigners",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Enregistrement de la vacance auprès de l'Agence nationale pour l'emploi",
      "Demande de parrainage soumise par l'employeur à l'OCMA",
      "Dépôt du dossier de permis de séjour en mission diplomatique"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "lettonie-visiteur",
    "officialUrl": "https://www.mfa.gov.lv/en/documents-required-apply-visa",
    "sourceTitle": "Documents required to apply for a visa",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Assurance médicale de voyage couvrant toute la zone Schengen"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "liechtenstein-travail",
    "officialUrl": "https://www.llv.li/en/national-administration/migration-and-passport-office/residence-in-liechtenstein-for-employment-purposes",
    "sourceTitle": "Residence in Liechtenstein for gainful employment",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Justification des qualifications professionnelles",
      "Responsabilité de l'employeur pour le dépôt de la demande"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "liechtenstein-visiteur",
    "officialUrl": "https://www.llv.li/en/national-administration/migration-and-passport-office/visa",
    "sourceTitle": "Visa - Migration and Passport Office - National Administration",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Soumission de la demande auprès de la représentation suisse locale",
      "Réglementations d'entrée alignées sur celles de la Suisse",
      "Vérification de l'obligation de visa via le portail du SEM suisse"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "lituanie-travail",
    "officialUrl": "https://www.migracija.lt/service/uzsienieciams?lang=en",
    "sourceTitle": "Migration Department of the Republic of Lithuania (MIGRIS)",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Lettre de médiation soumise par l'employeur via MIGRIS",
      "Contrat de travail ou engagement d'embauche valide",
      "Assurance santé couvrant la durée du séjour en Lituanie"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "lituanie-visiteur",
    "officialUrl": "https://in.mfa.lt/en/coming-to-lithuania/visas/documents-to-be-submitted-by-all-applicants-for-short-stay-visa-c-schengen-visa/116",
    "sourceTitle": "Documents to be submitted by all applicants for short-stay visa (C) (Schengen visa)",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Preuves de moyens financiers (relevés bancaires récents) et justificatifs d'hébergement ou lettre d'invitation"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "luxembourg-travail",
    "officialUrl": "https://guichet.public.lu/fr/citoyens/immigration/plus-3-mois/ressortissant-tiers/salarie/salarie-pays-tiers.html",
    "sourceTitle": "Séjourner au Luxembourg en tant que salarié ressortissant de pays tiers",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Déclaration préalable du poste à l’ADEM par l’employeur",
      "Demande d’autorisation de séjour temporaire avant l’entrée sur le territoire",
      "Justification des qualifications et du contrat de travail signé"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "luxembourg-visiteur",
    "officialUrl": "https://guichet.public.lu/fr/citoyens/immigration/moins-3-mois/ressortissant-tiers/entree-visa.html",
    "sourceTitle": "Demander un visa pour l’entrée au Luxembourg en tant que ressortissant de pays tiers",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Possession d'un titre de voyage en cours de validité",
      "Demande auprès du consulat luxembourgeois ou de la mission représentative",
      "Traduction conforme des documents par un traducteur assermenté"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "malaisie-travail",
    "officialUrl": "https://rai.malaysia.gov.my/work",
    "sourceTitle": "Work - MyGovernment Portal for Non-Citizen",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Diplômes traduits en anglais ou malais par une autorité agréée",
      "Enregistrement préalable de l'employeur auprès de l'Expatriate Services Division (ESD)"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "malte-travail",
    "officialUrl": "https://identita.gov.mt/expatriates-unit-main-page/noneu-nationals/employment-related-permits/single-permit/",
    "sourceTitle": "Expatriates Unit Non-EU Nationals - Single permit - Identità",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "La procédure de permis unique regroupe l'autorisation de travail et le permis de séjour en un seul document",
      "L'autorisation est strictement liée à un employeur spécifique et à une activité professionnelle désignée"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "malte-visiteur",
    "officialUrl": "https://identita.gov.mt/expatriates-unit-main-page/noneu-nationals/non-employment-permits/economic-self-sufficient/",
    "sourceTitle": "Expatriates Unit Non-Employment Permits - Economic Self-Sufficient - Identità",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Titulaire d'une autorisation de séjour ou visa valide",
      "Soumission en ligne via le portail Expatriates Unit"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "maroc-evisa",
    "officialUrl": "https://www.acces-maroc.ma/",
    "sourceTitle": "Accès Maroc - Portail e-Visa",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Dépôt de la demande via le portail officiel Accès Maroc",
      "Passeport en cours de validité couvrant la durée du séjour",
      "Copie numérique de la page d'identité du passeport"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "maurice-travail",
    "officialUrl": "https://residency.mu/work/professional-employed-in-mauritius-by-a-multinational-or-a-local-company/",
    "sourceTitle": "Professional - Residency by Profession",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Diplômes et qualifications professionnelles certifiés",
      "Certificat médical de moins de six mois"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "norvege-travail",
    "officialUrl": "https://www.udi.no/en/want-to-apply/work-immigration/skilled-workers/",
    "sourceTitle": "Want to apply: Skilled workers - UDI",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Offre d'emploi concrète d'un employeur norvégien",
      "Justification de qualifications académiques ou professionnelles"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "norvege-visiteur",
    "officialUrl": "https://www.udi.no/en/want-to-apply/visit-and-holiday/visitors-visa-to-norway/",
    "sourceTitle": "Want to apply: Visitor visas for Norway - UDI",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Passeport valide au moins trois mois après la fin du séjour",
      "Assurance médicale de voyage valide",
      "Preuve de moyens financiers suffisants pour la durée du séjour"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "nouvelle-zelande-travail",
    "officialUrl": "https://www.immigration.govt.nz/work/visas-for-working-in-new-zealand/",
    "sourceTitle": "Visas for working in New Zealand",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Déterminer si une offre d'emploi préalable est requise pour le type de visa sélectionné",
      "Vérifier les conditions d'âge et de nationalité pour les programmes spécifiques comme le visa vacances-travail",
      "Consulter les exigences relatives aux conditions de travail et à la rémunération minimale applicable"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "oman-evisa",
    "officialUrl": "https://evisa.rop.gov.om/",
    "sourceTitle": "Portail e-Visa - Police Royale d'Oman",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Réservation d'hôtel confirmée",
      "Billet de retour et assurance santé"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "ouganda-evisa",
    "officialUrl": "https://visas.immigration.go.ug/",
    "sourceTitle": "Uganda Electronic Visa/Permit Application System",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Photo d'identité récente",
      "Certificat de vaccination contre la fièvre jaune"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "pays-bas-etudes",
    "officialUrl": "https://ind.nl/en/residence-permits/study/student-residence-permit-for-university-or-higher-professional-education",
    "sourceTitle": "Student residence permit for university or higher professional education",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Inscription auprès d'un établissement d'enseignement supérieur agréé",
      "Test de tuberculose (TB) à effectuer après l'arrivée"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "pays-bas-travail",
    "officialUrl": "https://ind.nl/en/residence-permits/work",
    "sourceTitle": "Work - Immigration and Naturalisation Service (IND)",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Disposer d'un contrat de travail valide avec un employeur établi aux Pays-Bas",
      "Vérifier les seuils de revenus minimums applicables selon la catégorie d'emploi",
      "S'assurer que l'employeur est enregistré comme sponsor reconnu par l'IND si requis par la procédure"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "pays-bas-visiteur",
    "officialUrl": "https://www.netherlandsworldwide.nl/visa-the-netherlands/checklist-schengen-visa-tourism/fr",
    "sourceTitle": "Liste de contrôle - Demande de visa Schengen de tourisme",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Justificatifs de moyens financiers suffisants"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "pologne-etudes",
    "officialUrl": "https://study.gov.pl/visa-application",
    "sourceTitle": "VISA & APPLICATION | study.gov.pl",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Inscription sur le portail e-Consulat",
      "Justificatifs de ressources et assurance santé",
      "Demande de permis de séjour temporaire"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "pologne-travail",
    "officialUrl": "https://mos.cudzoziemcy.gov.pl/en/categories-information/doing-the-job/principles-general/",
    "sourceTitle": "Règles générales pour l'exercice d'un travail par des étrangers",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Posséder un titre de séjour légal (visa ou permis) autorisant explicitement le travail",
      "Obtenir une autorisation de travail (permis de travail via l'employeur ou permis unique de séjour et de travail)",
      "Exercer l'activité pour l'employeur et au poste spécifiés dans l'autorisation"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "pologne-visiteur",
    "officialUrl": "https://www.gov.pl/web/diplomacy/visas",
    "sourceTitle": "VISAS - Ministry of Foreign Affairs Republic of Poland",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Justificatifs de l'objet du voyage, de l'hébergement et des ressources financières"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "portugal-travail",
    "officialUrl": "https://vistos.mne.gov.pt/en/national-visas/necessary-documentation/residency",
    "sourceTitle": "Residency - Necessary Documentation - National Visas",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Contrat de travail ou promesse d'embauche valide",
      "Justificatif de ressources financières suffisantes",
      "Certificat de casier judiciaire apostillé ou légalisé"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "portugal-visiteur",
    "officialUrl": "https://vistos.mne.gov.pt/en/short-stay-visas-schengen/required-documentation/short-stay-visa",
    "sourceTitle": "Short Stay Visa - Portal Diplomático",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Formulaire de demande dûment rempli et signé avec photographie d'identité",
      "Passeport valide et assurance médicale de voyage couvrant toute la durée du séjour",
      "Preuves de moyens de subsistance et justificatif d'hébergement ou attestation d'accueil"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "qatar-travail",
    "officialUrl": "https://hukoomi.gov.qa/en/articles/residence-and-work-permits",
    "sourceTitle": "Residence and Work Permits in Qatar",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Parrainage par un employeur qatari requis",
      "Documents d'état civil authentifiés pour le parrainage familial"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "republique-tcheque-etudes",
    "officialUrl": "https://mzv.gov.cz/jnp/en/information_for_aliens/long_stay_visa/study_long_term.html",
    "sourceTitle": "Study | Ministry of Foreign Affairs of the Czech Republic",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Présentation en personne de la demande avec passeport, photos et preuve d'admission",
      "Justificatif de ressources financières suffisantes et preuve d'hébergement",
      "Traduction officielle en tchèque et légalisation des documents publics étrangers"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "republique-tcheque-travail",
    "officialUrl": "https://ipc.gov.cz/en/visa-and-residence-permit-types/third-country-nationals/long-term-residence-permits/employee-card/",
    "sourceTitle": "Employee Card - Information Portal for Foreigners",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "La carte d'employé regroupe en un seul titre le permis de séjour et le permis de travail pour une durée supérieure à trois mois",
      "La demande peut être déposée auprès d'une mission diplomatique tchèque à l'étranger pour les ressortissants de pays tiers",
      "La durée de validité est généralement fixée selon le contrat de travail pour un maximum de deux ans renouvelables"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "republique-tcheque-visiteur",
    "officialUrl": "https://mzv.gov.cz/jnp/en/information_for_aliens/short_stay_visa/visa_for_a_stay_up_to_90_days_for_the.html",
    "sourceTitle": "Tourism - Ministry of Foreign Affairs of the Czech Republic",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Passeport, formulaire et photo",
      "Hébergement, moyens financiers et transport",
      "Assurance médicale et biométrie"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "roumanie-etudes",
    "officialUrl": "https://studyinromania.gov.ro/visa",
    "sourceTitle": "Visa rules and procedures - Study in Romania",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Acceptation préalable par un établissement d'enseignement roumain accrédité",
      "Dépôt de la demande de visa de long séjour (Type D) via le portail officiel e-VISA",
      "Justification de ressources financières suffisantes et d'une assurance médicale valide"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "roumanie-travail",
    "officialUrl": "https://workinromania.gov.ro/workinro/default/angajati",
    "sourceTitle": "Informații pentru lucrătorii străini - Work in Romania",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Identification d'un employeur en Roumanie",
      "Obtention d'un visa de long séjour D/AM via la plateforme WorkinRomania",
      "Présentation d'un contrat de travail individuel enregistré"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "roumanie-visiteur",
    "officialUrl": "https://eviza.mae.ro/SupportingDocuments",
    "sourceTitle": "Documents justificatifs pour le visa - Ministère des Affaires Étrangères de Roumanie",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Justificatif de moyens de subsistance financiers pour le séjour"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "royaume-uni-etudes",
    "officialUrl": "https://www.gov.uk/student-visa",
    "sourceTitle": "Student visa : Overview - GOV.UK",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Obtention d'une Confirmation d'Acceptation d'Études (CAS) auprès d'un établissement agréé",
      "Preuve de maîtrise de la langue anglaise et paiement de la surtaxe santé (IHS)"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "royaume-uni-travail",
    "officialUrl": "https://www.gov.uk/skilled-worker-visa",
    "sourceTitle": "Skilled Worker visa: Overview",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Offre d'emploi d'un employeur approuvé",
      "Certificat de parrainage (CoS)",
      "Preuve de maîtrise de l'anglais"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "royaume-uni-visiteur",
    "officialUrl": "https://www.gov.uk/standard-visitor",
    "sourceTitle": "Visit the UK as a Standard Visitor",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Vérifier la nécessité d'un visa ou d'une autorisation ETA selon la nationalité",
      "Détenir un passeport valide pour la durée totale du séjour",
      "Justifier de ressources financières suffisantes pour le séjour et le retour"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "rwanda-evisa",
    "officialUrl": "https://www.migration.gov.rw/visa/visitors-visa",
    "sourceTitle": "Visitors Visa - Rwanda Directorate General of Immigration and Emigration",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Demande possible en ligne via le portail Irembo ou à l'arrivée"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "senegal-travail",
    "officialUrl": "https://www.interieur.gouv.sn/services/services-aux-usagers/carte-d-identite-d-etranger",
    "sourceTitle": "Carte d'identité d'étranger - Ministère de l'Intérieur",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Demande manuscrite adressée au Ministre de l'Intérieur",
      "Casier judiciaire du pays d'origine et certificat médical",
      "Justification de ressources ou contrat de travail visé"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "slovaquie-etudes",
    "officialUrl": "https://www.mzv.sk/en/web/en/visa-and-services/foreign-students-in-slovakia",
    "sourceTitle": "Foreign students in Slovakia - Ministry of Foreign and European Affairs",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Demande de permis de séjour temporaire pour études auprès de l'ambassade ou de la police des étrangers",
      "Présentation d'un justificatif d'admission scolaire, d'un extrait de casier judiciaire et de preuves de ressources financières",
      "Obligation de souscrire une assurance santé et de fournir un certificat médical après l'obtention du permis"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "slovaquie-travail",
    "officialUrl": "https://www.mzv.sk/en/web/en/visa-and-services/national-visa",
    "sourceTitle": "National visa - Ministry of Foreign and European Affairs of the Slovak Republic",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Formulaire de demande complété, passeport valide et photo aux normes OACI",
      "Justificatif du but du séjour comme un contrat de travail ou une promesse d'embauche"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "slovaquie-visiteur",
    "officialUrl": "https://www.mzv.sk/en/services/information-for-foreigners/visas-for-foreigners-to-enter-sr",
    "sourceTitle": "Visa for foreigners to enter the Slovak Republic",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Formulaire de demande dûment rempli et signé",
      "Document de voyage valide au moins trois mois après le départ prévu"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "slovenie-etudes",
    "officialUrl": "https://studyinslovenia.si/live/visa-and-residence-permit/temporary-residence-permit-for-studies/",
    "sourceTitle": "TEMPORARY RESIDENCE PERMIT FOR STUDIES - Study in Slovenia",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Dépôt de la demande de permis de séjour temporaire auprès de l'unité administrative locale ou de l'ambassade",
      "Preuve d'inscription, assurance santé et casier judiciaire de moins de trois mois requis"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "slovenie-travail",
    "officialUrl": "https://www.gov.si/en/topics/employment-and-work-of-foreign-nationals/",
    "sourceTitle": "Employment and work of foreign nationals",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Obtention d'un permis unique combinant séjour et travail",
      "Dépôt possible via l'employeur ou une représentation diplomatique",
      "Vérification de la conformité fiscale et légale de l'employeur"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "slovenie-visiteur",
    "officialUrl": "https://www.gov.si/en/topics/entry-and-residence/",
    "sourceTitle": "Entry and residence | GOV.SI",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Document de voyage valide et formulaire de demande de visa Schengen (Type C)",
      "Lettre de garantie (Garantno pismo) ou d'invitation pour les visites privées",
      "Justification de moyens financiers et assurance médicale de voyage"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "srilanka-evisa",
    "officialUrl": "https://www.eta.gov.lk/",
    "sourceTitle": "Electronic Travel Authorization (ETA) - Official Website",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Billet de retour ou de continuation confirmé",
      "Preuve de fonds suffisants pour couvrir les dépenses durant le séjour"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "suede-etudes",
    "officialUrl": "https://www.migrationsverket.se/en/you-want-to-apply/study/higher-education.html",
    "sourceTitle": "Permis de séjour pour études supérieures - Migrationsverket",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Admission définitive à des études à temps plein en présentiel",
      "Justification de ressources financières suffisantes pour la durée du séjour",
      "Détention d'une assurance maladie complète pour les programmes de moins d'un an"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "suede-travail",
    "officialUrl": "https://www.migrationsverket.se/en/you-want-to-apply/work/employee-or-self-employed/employees.html",
    "sourceTitle": "Apply for a work permit in Sweden - Migrationsverket",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Détenir un passeport valide et un contrat de travail signé par l'employeur et l'employé",
      "S'assurer que l'employeur a souscrit les assurances obligatoires (santé, vie, accidents et retraite)"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "suede-visiteur",
    "officialUrl": "https://www.migrationsverket.se/en/you-want-to-apply/visiting-sweden/visiting-sweden-for-up-to-90-days-entry-visa.html",
    "sourceTitle": "Visa Schengen (court séjour) - Agence suédoise des migrations",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Présenter un passeport valide au moins trois mois après l'expiration du visa"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "suisse-etudes",
    "officialUrl": "https://www.ch.ch/fr/ecole-et-formation/sejourner-en-suisse-sans-travailler/",
    "sourceTitle": "Séjourner en Suisse sans travailler - ch.ch",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Preuve d'admission dans un établissement reconnu",
      "Justificatif de ressources financières suffisantes",
      "Plan d'études et engagement de départ après la formation"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "suisse-travail",
    "officialUrl": "https://www.sem.admin.ch/sem/fr/home/overview-arbeit.html",
    "sourceTitle": "Travailler en Suisse - Secrétariat d’État aux migrations",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Contrat de travail valide requis",
      "Conditions spécifiques selon la nationalité (UE/AELE vs États tiers)"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "suisse-visiteur",
    "officialUrl": "https://www.sem.admin.ch/sem/fr/home/themen/einreise.html",
    "sourceTitle": "Entrée - Secrétariat d’État aux migrations SEM",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Posséder un document de voyage reconnu et valide",
      "Justifier l'objet et les conditions du séjour",
      "Présenter des moyens financiers suffisants ou une assurance-voyage"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "tanzanie-evisa",
    "officialUrl": "https://visa.immigration.go.tz/",
    "sourceTitle": "Tanzania Electronic Visa Application System",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Copie de la page biométrique du passeport",
      "Billet de retour ou de continuation",
      "Photo d'identité couleur sur fond uni (JPEG)"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "turquie-evisa",
    "officialUrl": "https://www.evisa.gov.tr/fr/",
    "sourceTitle": "République de Türkiye Système de Demande de Visa Électronique",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Paiement par carte bancaire (Visa, Mastercard ou UnionPay) avec 3D Secure",
      "Usage limité aux séjours touristiques ou commerciaux uniquement"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  },
  {
    "procedureId": "vietnam-evisa",
    "officialUrl": "https://evisa.gov.vn/",
    "sourceTitle": "Vietnam National Electronic Visa system",
    "consultedOn": "2026-08-27",
    "preparationPoints": [
      "Détention d'un passeport valide et non suspendu d'entrée",
      "Saisie précise des informations en anglais sur le portail officiel"
    ],
    "caveat": "Les exigences applicables à votre situation doivent être confirmées directement auprès de l’autorité compétente avant toute démarche."
  }
];

const byProcedureId = new Map(INSTITUTIONAL_PROCEDURE_SOURCES.map((source) => [source.procedureId, source]));

export const getInstitutionalProcedureSource = (procedureId: string) => byProcedureId.get(procedureId);
