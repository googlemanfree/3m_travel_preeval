import { Briefcase, Building2, Car, Cpu, FileCheck2, GraduationCap, Globe2, HeartHandshake, IdCard, MessageCircle, Plane, ShieldCheck, Stamp, Users2, type LucideIcon } from "lucide-react";
import { buildFreeEvaluationHref } from "@/components/PublicEvaluationCTA";

/**
 * Catalogue unique des activités de 3M TRAVEL AGENCY : l'accueil (« Que voulez-vous accomplir ? », « Nos services »)
 * et la page /services s'appuient sur la même source. Descriptions volontairement factuelles : aucun prix, délai
 * ni résultat garanti ; les décisions appartiennent aux autorités ou aux prestataires concernés.
 */

export type ServicePoleId = "mobilite" | "travel" | "services";

export type CatalogService = { id: string; title: string; description: string; href: string; icon: LucideIcon };

export type ServicePole = { id: ServicePoleId; title: string; tagline: string; icon: LucideIcon; accent: string; services: CatalogService[] };

export const SERVICE_POLES: ServicePole[] = [
  {
    id: "mobilite",
    title: "Mobilité internationale",
    tagline: "Notre cœur de métier : un dossier solide, du premier renseignement jusqu’à l’installation.",
    icon: Globe2,
    accent: "text-[#1e3a8a] bg-[#dbeafe]",
    services: [
      { id: "etudes", title: "Études", description: "Choix de la destination, préparation du dossier d’admission et de la demande de visa.", href: "/procedures", icon: GraduationCap },
      { id: "travail", title: "Travail", description: "Préparation d’un projet professionnel à l’étranger et des démarches qui l’accompagnent.", href: "/procedures", icon: Briefcase },
      { id: "immigration", title: "Immigration", description: "Voies d’immigration vers le Canada, avec un simulateur CRS pour situer votre profil.", href: "/canada", icon: Globe2 },
      { id: "visas", title: "Visas", description: "Visas de visite, d’études ou de travail : documents à réunir, dépôt et suivi.", href: "/procedures", icon: Stamp },
      { id: "famille", title: "Regroupement familial", description: "Constitution du dossier pour rejoindre un proche installé à l’étranger.", href: "/procedures", icon: Users2 },
    ],
  },
  {
    id: "travel",
    title: "Travel",
    tagline: "Tout ce qu’il faut pour préparer et sécuriser un déplacement, d’ici comme à destination.",
    icon: Plane,
    accent: "text-[#2563eb] bg-[#eff6ff]",
    services: [
      { id: "vols", title: "Billets d’avion", description: "Recherche et demande de réservation de vols avec 3M Booking.", href: "/flights", icon: Plane },
      { id: "hotels", title: "Hôtels", description: "Demande de devis pour un hébergement adapté à votre séjour.", href: "/tourisme?service=hotel", icon: Building2 },
      { id: "vehicules", title: "Location de véhicules", description: "Demande de devis pour une location de véhicule à destination.", href: "/tourisme?service=vehicle", icon: Car },
      { id: "assurance", title: "Assurance voyage", description: "Préparation de votre demande d’assurance avec validation par un conseiller.", href: "/assurance", icon: ShieldCheck },
    ],
  },
  {
    id: "services",
    title: "Services",
    tagline: "Des démarches administratives et numériques que 3M gère aussi, au-delà du voyage.",
    icon: ShieldCheck,
    accent: "text-[#0369a1] bg-[#e0f2fe]",
    services: [
      { id: "cni", title: "CNI & passeport", description: "Première demande, renouvellement, perte ou vol : préparation du dossier et suivi à Yaoundé.", href: "/cni-passeport", icon: IdCard },
      { id: "evisa", title: "e-Visa Cameroun", description: "Préparation et suivi de vos demandes d’e-Visa, avec un circuit documentaire sécurisé.", href: "/evisas", icon: Stamp },
      { id: "technologies", title: "Technologies", description: "Services numériques et accompagnement documentaire avec 3M Solutions.", href: "/3m-solutions", icon: Cpu },
      { id: "formations", title: "Formations", description: "Programmes de formation et d’orientation présentés à titre d’information.", href: "/formation", icon: GraduationCap },
      { id: "securite", title: "Solutions de sécurité", description: "Solutions de sécurité présentées par 3M Solutions ; demande détaillée à l’équipe.", href: "/3m-solutions", icon: ShieldCheck },
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
  { id: "travailler", title: "Travailler à l’étranger", hint: "Profil, employeur et autorisations", href: buildFreeEvaluationHref("travail"), icon: Briefcase },
  { id: "etudier", title: "Étudier à l’étranger", hint: "Admission et visa d’études", href: buildFreeEvaluationHref("etudes"), icon: GraduationCap },
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

export const ALL_CATALOG_HREFS: string[] = [
  ...SERVICE_POLES.flatMap((pole) => pole.services.map((service) => service.href)),
  ...QUICK_ACTIONS.map((action) => action.href),
];
