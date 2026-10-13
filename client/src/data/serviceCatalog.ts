import { Briefcase, Building2, Car, Cpu, FileCheck2, GraduationCap, Globe2, HeartHandshake, IdCard, MessageCircle, Plane, ShieldCheck, Stamp, Users2, type LucideIcon } from "lucide-react";
import { buildFreeEvaluationHref } from "@/components/PublicEvaluationCTA";

/**
 * Catalogue unique des activités de 3M TRAVEL AGENCY : l'accueil (« Que voulez-vous accomplir ? », « Nos services »)
 * et la page /services s'appuient sur la même source. Descriptions volontairement factuelles : aucun prix, délai
 * ni résultat garanti ; les décisions appartiennent aux autorités ou aux prestataires concernés.
 */

export type ServicePoleId = "mobilite" | "travel" | "services";

/** `points` : trois repères concrets sur ce que 3M prépare ; jamais de prix, de délai ni de résultat promis. */
export type CatalogService = { id: string; title: string; description: string; points: string[]; href: string; icon: LucideIcon };

export type ServicePole = { id: ServicePoleId; title: string; tagline: string; summary: string; icon: LucideIcon; accent: string; services: CatalogService[] };

export const SERVICE_POLES: ServicePole[] = [
  {
    id: "mobilite",
    title: "Mobilité internationale",
    tagline: "Notre cœur de métier : un dossier solide, du premier renseignement jusqu’à l’installation.",
    summary: "Chaque projet commence par une évaluation de votre profil. Un conseiller vous indique la voie la plus réaliste, les pièces à réunir, les frais payés à des tiers et l’ordre des étapes, puis prépare et suit votre dossier jusqu’au dépôt. Les décisions de visa, d’admission ou d’autorisation de travail appartiennent toujours aux autorités, aux établissements et aux employeurs concernés.",
    icon: Globe2,
    accent: "text-[#1e3a8a] bg-[#dbeafe]",
    services: [
      { id: "etudes", title: "Études", description: "Choix de la destination, préparation du dossier d’admission et de la demande de visa.", points: ["Comparaison de destinations et de filières selon votre parcours", "Dossier d’admission : relevés, diplômes, lettre de motivation", "Demande de visa d’études et justificatifs financiers à préparer"], href: "/etudes", icon: GraduationCap },
      { id: "travail", title: "Travail", description: "Préparation d’un projet professionnel à l’étranger et des démarches qui l’accompagnent.", points: ["Analyse de votre profil, de votre secteur et des destinations accessibles", "CV, pièces et démarches liées à l’offre d’emploi ou au contrat", "Aucun emploi n’est promis : l’offre et le contrat relèvent de l’employeur"], href: "/travail", icon: Briefcase },
      { id: "immigration", title: "Immigration", description: "Voies d’immigration vers le Canada, avec un simulateur CRS pour situer votre profil.", points: ["Présentation des principales voies d’immigration vers le Canada", "Simulateur CRS pour situer votre profil, à titre indicatif", "Orientation vers les sources officielles avant chaque démarche"], href: "/canada", icon: Globe2 },
      { id: "visas", title: "Visas", description: "Visas de visite, d’études ou de travail : documents à réunir, dépôt et suivi.", points: ["Choix du visa adapté à votre projet : visite, études ou travail", "Liste des documents à réunir, avec traduction si elle est exigée", "Dépôt du dossier et suivi des étapes dans votre espace client"], href: "/procedures", icon: Stamp },
      { id: "famille", title: "Regroupement familial", description: "Constitution du dossier pour rejoindre un proche installé à l’étranger.", points: ["Vérification des pièces d’état civil et des liens familiaux à justifier", "Constitution du dossier selon les règles du pays de destination", "Suivi jusqu’à la décision de l’autorité compétente"], href: "/procedures", icon: Users2 },
    ],
  },
  {
    id: "travel",
    title: "Travel",
    tagline: "Tout ce qu’il faut pour préparer et sécuriser un déplacement, d’ici comme à destination.",
    summary: "Chaque demande passe par un conseiller : vous indiquez vos dates, votre budget et vos préférences, nous vérifions les informations et nous vous confirmons les conditions avant tout paiement. Les tarifs et les disponibilités sont ceux des compagnies et des prestataires au moment de la confirmation.",
    icon: Plane,
    accent: "text-[#2563eb] bg-[#eff6ff]",
    services: [
      { id: "vols", title: "Billets d’avion", description: "Recherche et demande de réservation de vols avec 3M Booking.", points: ["Recherche de vols et comparaison des itinéraires avec 3M Booking", "Demande de réservation transmise à un conseiller pour validation", "Plusieurs moyens de paiement, dont Mobile Money et paiement en agence"], href: "/flights", icon: Plane },
      { id: "hotels", title: "Hôtels", description: "Demande de devis pour un hébergement adapté à votre séjour.", points: ["Devis selon la ville, les dates et le budget que vous indiquez", "Proposition étudiée par un conseiller avant toute réservation", "Suivi de votre demande jusqu’à la confirmation par l’établissement"], href: "/tourisme?service=hotel", icon: Building2 },
      { id: "vehicules", title: "Location de véhicules", description: "Demande de devis pour une location de véhicule à destination.", points: ["Devis pour la ville et la période de location", "Choix du type de véhicule selon vos besoins", "Conditions de location précisées par le prestataire avant engagement"], href: "/tourisme?service=vehicle", icon: Car },
      { id: "assurance", title: "Assurance voyage", description: "Préparation de votre demande d’assurance avec validation par un conseiller.", points: ["Demande préparée avec les informations de chaque voyageur", "Validation par un conseiller avant la suite de la démarche", "Couverture à choisir selon la destination et la durée du séjour"], href: "/assurance", icon: ShieldCheck },
    ],
  },
  {
    id: "services",
    title: "Services",
    tagline: "Des démarches administratives et numériques que 3M gère aussi, au-delà du voyage.",
    summary: "Ces services couvrent des démarches que 3M prépare avec vous : liste des pièces, dépôt et suivi. Les délais et les décisions dépendent des administrations et des prestataires concernés ; votre conseiller vous indique ce qui est exigé avant que vous ne vous déplaciez ou ne payiez quoi que ce soit.",
    icon: ShieldCheck,
    accent: "text-[#0369a1] bg-[#e0f2fe]",
    services: [
      { id: "cni", title: "CNI & passeport", description: "Première demande, renouvellement, perte ou vol : préparation du dossier et suivi à Yaoundé.", points: ["Première demande, renouvellement, perte ou vol", "Liste des pièces à réunir avant de vous déplacer à Yaoundé", "Suivi de l’avancement de votre dossier"], href: "/cni-passeport", icon: IdCard },
      { id: "evisa", title: "e-Visa Cameroun", description: "Préparation et suivi de vos demandes d’e-Visa, avec un circuit documentaire sécurisé.", points: ["Vérification des conditions de l’e-Visa selon la destination et le motif du voyage", "Dépôt des pièces dans un circuit documentaire sécurisé", "Suivi de votre demande jusqu’à la décision de l’autorité"], href: "/evisas", icon: Stamp },
      { id: "technologies", title: "Technologies", description: "Services numériques et accompagnement documentaire avec 3M Solutions.", points: ["Services numériques : web, réseaux et accompagnement documentaire", "Demande détaillée traitée par l’équipe 3M Solutions", "Aucun engagement commercial automatique"], href: "/3m-solutions", icon: Cpu },
      { id: "formations", title: "Formations", description: "Programmes de formation et d’orientation présentés à titre d’information.", points: ["Programmes de formation et d’orientation présentés à titre d’information", "Conseils pour choisir un parcours adapté à votre projet", "Modalités confirmées par l’équipe avant toute inscription"], href: "/formation", icon: GraduationCap },
      { id: "securite", title: "Solutions de sécurité", description: "Solutions de sécurité présentées par 3M Solutions ; demande détaillée à l’équipe.", points: ["Solutions de sécurité présentées par 3M Solutions", "Besoin analysé avec vous avant toute proposition", "Demande détaillée à adresser à l’équipe"], href: "/3m-solutions", icon: ShieldCheck },
    ],
  },
];

export type QuickAction = { id: string; title: string; hint: string; href: string; icon: LucideIcon };

/**
 * Intentions d’accueil — le dossier et le recrutement autorisé passent avant
 * les services annexes (vols, assurance, e-Visa).
 */
export const QUICK_ACTIONS: QuickAction[] = [
  { id: "dossier", title: "Préparer mon dossier", hint: "Évaluation, pièces et suivi traçable", href: buildFreeEvaluationHref("travail"), icon: FileCheck2 },
  { id: "travailler", title: "Travailler à l’étranger", hint: "Profil, employeur et autorisations", href: "/travail", icon: Briefcase },
  { id: "etudier", title: "Étudier à l’étranger", hint: "Admission et visa d’études", href: "/etudes", icon: GraduationCap },
  { id: "visa", title: "Demander un visa", hint: "Checklist et dépôt guidés", href: "/procedures", icon: Stamp },
  { id: "recrutement", title: "Recrutement partenaires", hint: "Agences et employeurs vérifiés", href: "/partenaires", icon: Building2 },
  { id: "conseiller", title: "Parler à un conseiller", hint: "Échange direct, sans engagement", href: "/consultation", icon: MessageCircle },
  { id: "vol", title: "Réserver un vol", hint: "Après validation du dossier", href: "/flights", icon: Plane },
  { id: "assurance", title: "M’assurer pour voyager", hint: "Couverture adaptée au séjour", href: "/assurance", icon: HeartHandshake },
  { id: "evisa", title: "Obtenir un e-Visa", hint: "Autorisation électronique", href: "/evisas", icon: Globe2 },
  { id: "cni", title: "Refaire ma CNI ou mon passeport", hint: "Dossier prêt pour Yaoundé", href: "/cni-passeport", icon: IdCard },
];

/** Étapes communes à toutes les demandes ; le délai de réponse n'est pas promis ici, il figure sur la page de rendez-vous. */
export const HOW_IT_WORKS = [
  { title: "Vous précisez votre projet", text: "Formulaire, WhatsApp ou agence à Yaoundé : quelques informations suffisent pour cadrer votre objectif." },
  { title: "Nous structurons votre dossier", text: "Un conseiller liste les pièces, les frais tiers éventuels et l’ordre des étapes — avant tout engagement." },
  { title: "Vous avancez en toute clarté", text: "Votre espace client centralise le statut, les documents et les échanges avec l’équipe 3M." },
] as const;

/**
 * Questions fréquentes de la page /services. Réponses factuelles : aucun montant, aucun délai chiffré, aucun résultat promis.
 * Le montant des frais d’ouverture dépend du profil et est toujours confirmé par écrit avant paiement.
 */
export const SERVICES_FAQ = [
  {
    question: "Faut-il venir à l’agence pour commencer ?",
    answer: "Non. Vous pouvez commencer à distance, par le formulaire d’évaluation, par WhatsApp ou en prenant rendez-vous. L’agence de Yaoundé reste disponible pour déposer des originaux ou régler en agence.",
  },
  {
    question: "Que coûte l’accompagnement ?",
    answer: "Le montant des frais d’ouverture de dossier dépend de votre profil ; il vous est confirmé par écrit avant tout paiement. Les frais payés à des tiers (autorités, centres de visa, assurances, traductions) sont distincts : votre conseiller vous les indique dès que le dossier est structuré.",
  },
  {
    question: "3M peut-elle garantir l’obtention d’un visa ?",
    answer: "Non, et personne ne le peut : seules les autorités décident. 3M prépare un dossier complet et cohérent, vous oriente vers les sources officielles et suit chaque étape. Méfiez-vous de toute promesse de résultat assuré ou de toute demande d’argent en échange d’un visa ou d’un emploi.",
  },
  {
    question: "Combien de temps faut-il ?",
    answer: "Les délais dépendent de la destination, du type de demande et de l’administration concernée, et aucun délai n’est promis à l’avance. Votre conseiller vous indique les délais habituels publiés par les autorités et vous prévient à chaque étape.",
  },
  {
    question: "Comment suivre l’avancement de mon dossier ?",
    answer: "Votre espace client centralise le statut, les pièces demandées et les échanges avec l’équipe 3M. Vous y retrouvez les changements au fur et à mesure.",
  },
  {
    question: "Mes documents personnels sont-ils protégés ?",
    answer: "Vos pièces sont déposées dans l’espace sécurisé de votre dossier. Elles ne sont communiquées à un employeur ou à une agence partenaire qu’avec votre accord distinct, que vous pouvez retirer à tout moment.",
  },
  {
    question: "Je ne sais pas quel service choisir : que faire ?",
    answer: "Commencez par l’évaluation gratuite de votre profil ou prenez rendez-vous : un conseiller vous oriente vers le bon service, sans engagement.",
  },
] as const;

export const ALL_CATALOG_HREFS: string[] = [
  ...SERVICE_POLES.flatMap((pole) => pole.services.map((service) => service.href)),
  ...QUICK_ACTIONS.map((action) => action.href),
];
