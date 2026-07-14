import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, Briefcase, Globe, Star,
  CheckCircle, Clock, Users, Award,
  ArrowRight, Phone, MessageCircle, Shield, BookOpen,
  Plane, Building, ChevronDown, ChevronUp,
  FileText, Download, X, Euro, DollarSign, Zap,
  GraduationCap, TrendingUp, CheckCircle2, AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const LOGO_URL = "/manus-storage/pasted_file_nP22ud_logo3Mfull_b9e4b2c3.jpeg";
const WA_NUMBER = "237698104832";

function waLink(msg: string) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
type DestinationId = "canada" | "luxembourg" | "pologne" | "europe" | "golfe";
type PaymentOption = "integral" | "echelonne" | "garanti" | null;

interface Procedure {
  id: string;
  title: string;
  description: string;
  details: string[];
  badge?: string;
  badgeColor?: string;
  url?: string;
}

interface Destination {
  id: DestinationId;
  flag: string;
  country: string;
  subtitle: string;
  tagline: string;
  color: string;
  bgGradient: string;
  procedures: Procedure[];
  ctaLabel: string;
  ctaAction: "form" | "whatsapp" | "popup";
  ctaMessage?: string;
  highlight?: string;
}

// ─── DONNÉES DES DESTINATIONS ─────────────────────────────────────────────────
const DESTINATIONS: Destination[] = [
  {
    id: "canada",
    flag: "🇨🇦",
    country: "Canada",
    subtitle: "Option d'Élite — Résidence Permanente",
    tagline: "Notre domaine d'excellence depuis 2019. Le chemin le plus sûr vers la résidence permanente.",
    color: "#C8102E",
    bgGradient: "from-red-700 to-red-900",
    ctaLabel: "Évaluer mon éligibilité Canada",
    ctaAction: "form",
    highlight: "⭐ Notre Point Fort",
    procedures: [
      {
        id: "ca-1",
        title: "Entrée Express (Fédéral)",
        description: "Programme phare pour les travailleurs qualifiés bilingues souhaitant obtenir la résidence permanente.",
        details: [
          "Score CRS calculé sur vos compétences, expérience et niveau de langue",
          "Invitation à Présenter une Demande (ITA) envoyée par IRCC",
          "Résidence permanente obtenue en 6 mois après l'ITA",
          "3 volets : Travailleurs qualifiés fédéraux, Métiers spécialisés, Expérience canadienne",
          "Français ou anglais requis (IELTS / TEF Canada)"
        ],
        badge: "Prioritaire",
        badgeColor: "bg-red-100 text-red-700"
      },
      {
        id: "ca-2",
        title: "Programmes des Candidats des Provinces (PCP)",
        description: "Immigration régionale ciblée — chaque province sélectionne des profils adaptés à ses besoins.",
        details: [
          "Ontario, Québec, Alberta, Colombie-Britannique, Manitoba et plus",
          "Volets spécifiques par secteur (tech, santé, agriculture, transport)",
          "Nomination provinciale = points supplémentaires dans Entrée Express",
          "Certains volets ne nécessitent pas d'offre d'emploi préalable",
          "Délais : 6 à 18 mois selon la province"
        ],
        badge: "Régional",
        badgeColor: "bg-blue-100 text-blue-700"
      },
      {
        id: "ca-3",
        title: "Volet des Métiers Spécialisés",
        description: "Demande élevée pour les corps de métiers essentiels — traitement accéléré garanti.",
        details: [
          "Soudure & Chaudronnerie (SCIAN 7237, 7238)",
          "Vente B2B & Représentation commerciale",
          "Logistique & Gestion de la chaîne d'approvisionnement",
          "Chauffeurs poids lourds (classe 1) — pénurie critique",
          "Certification des compétences via Red Seal ou équivalent"
        ],
        badge: "Métiers",
        badgeColor: "bg-green-100 text-green-700"
      },
      {
        id: "ca-4",
        title: "Permis de Travail Temporaire",
        description: "Voie d'accès progressive — études, stage coopératif ou visa jeune professionnel.",
        details: [
          "Permis d'études + autorisation de travail hors campus",
          "Stage coopératif (co-op) intégré au cursus universitaire",
          "Visa Jeune Professionnel (Expérience Internationale Canada)",
          "Permis post-diplôme (PGWP) jusqu'à 3 ans",
          "Passerelle vers la résidence permanente via Expérience Canadienne"
        ],
        badge: "Temporaire",
        badgeColor: "bg-orange-100 text-orange-700"
      }
    ]
  },
  {
    id: "luxembourg",
    flag: "🇱🇺",
    country: "Luxembourg",
    subtitle: "Sélection Cadres & Profils Qualifiés",
    tagline: "Salaire minimum légal garanti : 3 165 EUR/mois brut. Audit de conformité de votre dossier inclus.",
    color: "#EF3340",
    bgGradient: "from-red-600 to-blue-800",
    ctaLabel: "Demander un Audit Luxembourg",
    ctaAction: "whatsapp",
    ctaMessage: "Bonjour 3M Travel, je souhaite un audit pour le Luxembourg. Voici mon profil : ",
    highlight: "💼 Sélection Élite",
    procedures: [
      {
        id: "lu-1",
        title: "Visa Salarié Hautement Qualifié — Carte Bleue UE",
        description: "Directive européenne réservée aux profils qualifiés avec contrat de travail supérieur au seuil légal.",
        details: [
          "Salaire brut minimum exigé : 3 165 EUR/mois (seuil légal 2026)",
          "Contrat de travail visé par le Ministère des Affaires Étrangères (MAEE)",
          "Diplôme universitaire ou expérience professionnelle équivalente (5 ans)",
          "Autorisation de séjour et de travail délivrée par la Direction de l'Immigration",
          "Voie d'accès à la résidence permanente après 5 ans"
        ],
        badge: "Carte Bleue UE",
        badgeColor: "bg-blue-100 text-blue-700"
      },
      {
        id: "lu-2",
        title: "Visa Travailleur Salarié Standard — Validation ADEM",
        description: "Procédure standard avec validation préalable par l'Agence pour le Développement de l'Emploi.",
        details: [
          "Offre d'emploi validée par l'ADEM (test du marché du travail)",
          "Dossier déposé auprès de l'Ambassade du Luxembourg ou Direction de l'Immigration",
          "Secteurs en tension : BTP, hôtellerie-restauration, services financiers, IT",
          "Regroupement familial possible dès l'obtention du titre de séjour",
          "Audit préalable de vos diplômes et certifications par 3M Travel"
        ],
        badge: "Standard",
        badgeColor: "bg-gray-100 text-gray-700"
      }
    ]
  },
  {
    id: "pologne",
    flag: "🇵🇱",
    country: "Pologne",
    subtitle: "Recrutement Direct & Placement Rapide",
    tagline: "Contrat garanti avec hébergement inclus. Salaire : 25,36 à 25,50 PLN/heure. Départ en 4-6 semaines.",
    color: "#DC143C",
    bgGradient: "from-red-700 to-gray-800",
    ctaLabel: "Postuler pour la Pologne",
    ctaAction: "whatsapp",
    ctaMessage: "Bonjour 3M Travel, je souhaite postuler pour la Pologne (logistique/industrie). Voici mon profil : ",
    highlight: "🏭 Recrutement Direct",
    procedures: [
      {
        id: "pl-1",
        title: "Permis de Travail National — Type D (Industrie & Logistique)",
        description: "Permis de travail national polonais pour les secteurs en forte demande de main-d'œuvre.",
        details: [
          "Contrat de travail signé avant le départ du Cameroun",
          "Secteurs : logistique lourde, manutention, production industrielle",
          "Hébergement entièrement pris en charge par l'employeur",
          "Délai d'obtention du permis : 4 à 6 semaines",
          "Visa national D délivré par l'Ambassade de Pologne"
        ],
        badge: "Type D",
        badgeColor: "bg-red-100 text-red-700"
      },
      {
        id: "pl-2",
        title: "Programme de Placement Direct — Plateformes Logistiques",
        description: "Partenariat direct avec des opérateurs logistiques majeurs (ex : ID Logistics, Amazon Poland).",
        details: [
          "Salaire garanti : 25,36 à 25,50 PLN/heure (environ 5 500 PLN/mois brut)",
          "Hébergement fourni et payé par l'employeur sur site",
          "Contrat à durée déterminée renouvelable (12 à 24 mois)",
          "Encadrement sur place à l'arrivée par un référent 3M Travel",
          "Possibilité de renouvellement et de régularisation après 2 ans"
        ],
        badge: "Contrat Garanti",
        badgeColor: "bg-green-100 text-green-700"
      }
    ]
  },
  {
    id: "europe",
    flag: "🇪🇺",
    country: "Europe Zone Schengen",
    subtitle: "Allemagne, France, Belgique & Plus",
    tagline: "Visa de recherche d'emploi, Chancenkarte allemande, études et alternance. Accès à 27 pays.",
    color: "#003399",
    bgGradient: "from-blue-800 to-indigo-900",
    ctaLabel: "Consulter les options Europe",
    ctaAction: "popup",
    highlight: "🌍 Zone Schengen",
    procedures: [
      {
        id: "eu-1",
        title: "Visa de Recherche d'Emploi — Allemagne",
        description: "Opportunité unique : séjourner en Allemagne pour chercher un emploi qualifié sur place.",
        details: [
          "Durée : 6 mois non renouvelables pour chercher un emploi",
          "Conditions : diplôme reconnu en Allemagne ou expérience équivalente",
          "Secteurs prioritaires : IT, ingénierie, santé, BTP",
          "Conversion en visa de travail dès l'obtention d'un contrat",
          "Reconnaissance des diplômes via anabin / KMK"
        ],
        badge: "🇩🇪 Allemagne",
        badgeColor: "bg-yellow-100 text-yellow-800"
      },
      {
        id: "eu-2",
        title: "Chancenkarte — Carte d'Opportunités Allemande",
        description: "Nouveau visa basé sur un système de points pour les profils qualifiés hors UE.",
        details: [
          "Système de points : diplôme (4 pts), expérience (2 pts), langue (2 pts), âge (1 pt)",
          "Score minimum requis : 6 points sur 10",
          "Durée : 1 an pour chercher un emploi ou tester un poste",
          "Travail partiel autorisé (jusqu'à 20h/semaine) pendant la recherche",
          "Lancée en 2024 — forte demande, délais encore raisonnables"
        ],
        badge: "🇩🇪 Chancenkarte",
        badgeColor: "bg-orange-100 text-orange-700"
      },
      {
        id: "eu-3",
        title: "Visa d'Études Supérieures & Alternance",
        description: "Études universitaires ou formation en alternance dans les pays Schengen.",
        details: [
          "France : BTS, Licence Pro, Master avec contrat d'apprentissage",
          "Belgique : universités francophones (UCLouvain, ULB, ULiège)",
          "Allemagne : Ausbildung (formation duale 2-3 ans, salaire 600-1 200 EUR/mois)",
          "Droit au travail pendant les études (20h/semaine en France)",
          "Passerelle vers la résidence longue durée après le diplôme"
        ],
        badge: "Études & Alternance",
        badgeColor: "bg-purple-100 text-purple-700"
      }
    ]
  },
  {
    id: "golfe",
    flag: "🇦🇪",
    country: "Golfe & Moyen-Orient",
    subtitle: "Émirats Arabes Unis, Qatar",
    tagline: "Visa de travail par parrainage employeur. Hôtellerie, Sécurité, BTP. Salaire net exonéré d'impôt.",
    color: "#00732F",
    bgGradient: "from-green-700 to-teal-900",
    ctaLabel: "En savoir plus sur le Golfe",
    ctaAction: "whatsapp",
    ctaMessage: "Bonjour 3M Travel, je souhaite des informations sur les opportunités au Golfe (EAU / Qatar). Mon profil : ",
    highlight: "🌟 Salaire Net",
    procedures: [
      {
        id: "ae-1",
        title: "Visa de Travail par Parrainage Employeur",
        description: "Système de parrainage (kafala) — l'employeur sponsor obtient le visa pour le travailleur.",
        details: [
          "Secteurs en forte demande : hôtellerie 5 étoiles, sécurité, BTP, restauration",
          "Contrat de travail signé avant l'entrée dans le pays",
          "Visa de résidence (Emirates ID / Qatar ID) inclus dans le package",
          "Logement et transport souvent pris en charge par l'employeur",
          "Salaire net exonéré d'impôt sur le revenu"
        ],
        badge: "🇦🇪 EAU / 🇶🇦 Qatar",
        badgeColor: "bg-green-100 text-green-700"
      },
      {
        id: "ae-2",
        title: "Visa de Recherche d'Emploi & Freelance — Émirats",
        description: "Les Émirats proposent un visa spécifique pour chercher un emploi ou exercer en freelance.",
        details: [
          "Visa de recherche d'emploi : 60 à 120 jours pour trouver un poste",
          "Freelance Visa : exercer en indépendant dans les zones franches (DMCC, DIFC)",
          "Visa Nomade Digital : résider aux EAU en travaillant pour un employeur étranger",
          "Pas de taxe sur le revenu, pas de TVA sur les services personnels",
          "Accès à un système bancaire international de premier rang"
        ],
        badge: "Freelance & Nomade",
        badgeColor: "bg-teal-100 text-teal-700"
      }
    ]
  }
];

// ─── TIMELINE STEPS ───────────────────────────────────────────────────────────
const TIMELINE_STEPS = [
  {
    number: "01", icon: Award, color: "from-blue-600 to-blue-800",
    title: "Évaluation & Score",
    subtitle: "65 000 FCFA",
    description: "Audit complet de votre profil, traduction de vos justificatifs et rapport de scoring officiel.",
    duration: "24-48h"
  },
  {
    number: "02", icon: Star, color: "from-amber-500 to-amber-700",
    title: "Choix de Formule",
    subtitle: "3 options",
    description: "Sélection de votre niveau de garantie : Intégral, Échelonné ou Permis Garanti.",
    duration: "1 jour"
  },
  {
    number: "03", icon: BookOpen, color: "from-indigo-600 to-indigo-800",
    title: "Livret de Compétences",
    subtitle: "Certification",
    description: "Vérification des diplômes, constitution du dossier professionnel, préparation linguistique.",
    duration: "2-4 semaines"
  },
  {
    number: "04", icon: Users, color: "from-teal-600 to-teal-800",
    title: "Mise en Avant du Profil",
    subtitle: "Employeurs partenaires",
    description: "Soumission officielle dans les bassins de sélection étatiques et employeurs partenaires.",
    duration: "4-12 semaines"
  },
  {
    number: "05", icon: Plane, color: "from-green-600 to-green-800",
    title: "Visa & Départ",
    subtitle: "Billet inclus",
    description: "Réception de votre permis, organisation du vol via notre plateforme intégrée.",
    duration: "Variable"
  },
];

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function Procedures() {
  const [activeDestination, setActiveDestination] = useState<DestinationId>("canada");
  const [expandedProcedure, setExpandedProcedure] = useState<string | null>(null);
  const [showEuropePopup, setShowEuropePopup] = useState(false);
  function scrollToFormules() {
    document.getElementById("formules")?.scrollIntoView({ behavior: "smooth" });
  }
  const [selectedPayment, setSelectedPayment] = useState<PaymentOption>(null);
  const [showEvalForm, setShowEvalForm] = useState(false);
  const [evalDestination, setEvalDestination] = useState<string>("");

  const currentDest = DESTINATIONS.find(d => d.id === activeDestination)!;

  function handleCTA(dest: Destination) {
    if (dest.ctaAction === "form") {
      setEvalDestination(dest.country);
      setShowEvalForm(true);
    } else if (dest.ctaAction === "whatsapp") {
      window.open(waLink(dest.ctaMessage ?? `Bonjour 3M Travel, je souhaite des informations sur ${dest.country}.`), "_blank");
    } else if (dest.ctaAction === "popup") {
      setShowEuropePopup(true);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#1E3A8A] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src={LOGO_URL} alt="3M Travel" className="h-12 w-12 rounded-full object-cover border-2 border-white/30" />
            <div className="text-white">
              <div className="font-bold text-lg leading-tight">3M Travel & Services</div>
              <div className="text-xs text-blue-200">Votre mobilité, notre expertise</div>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-5">
            <Link href="/" className="text-blue-200 hover:text-white text-sm transition-colors">Accueil</Link>
            <Link href="/flights" className="text-blue-200 hover:text-white text-sm transition-colors flex items-center gap-1">
              <Plane className="w-3.5 h-3.5" /> Vols
            </Link>
            <button onClick={scrollToFormules}
              className="text-yellow-300 hover:text-white text-sm font-semibold transition-colors flex items-center gap-1">
              <Star className="w-3.5 h-3.5" /> Nos Formules
            </button>
            <a href={waLink("Bonjour 3M Travel, je souhaite des informations sur vos services d'immigration.")}
              target="_blank" rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          </div>
          {/* Mobile: bouton WhatsApp */}
          <a href={waLink("Bonjour 3M Travel")} target="_blank" rel="noopener noreferrer"
            className="md:hidden bg-green-500 text-white p-2 rounded-full">
            <MessageCircle className="w-5 h-5" />
          </a>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#1E3A8A] via-[#1e4faa] to-[#2563EB] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-sm mb-5">
              <Globe className="w-4 h-4 text-yellow-300" />
              <span>Encyclopédie Migratoire — 5 destinations mondiales · 88 procédures</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
              Immigration & Mobilité<br />
              <span className="text-[#7CB9E8]">Internationale</span>
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
              Choisissez votre destination, découvrez toutes les procédures disponibles et démarrez votre dossier accompagné par nos experts certifiés.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={() => { setEvalDestination(""); setShowEvalForm(true); }}
                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-full font-bold transition-colors flex items-center gap-2 shadow-lg">
                <Star className="w-4 h-4" /> Évaluer mon éligibilité
              </button>
              <button               onClick={scrollToFormules}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-6 py-3 rounded-full font-bold transition-colors flex items-center gap-2">
                <Award className="w-4 h-4" /> Voir nos formules & tarifs
              </button>

            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SÉLECTEUR DE DESTINATIONS ────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        {/* Grille de sélection */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {DESTINATIONS.map((dest) => (
            <button key={dest.id} onClick={() => setActiveDestination(dest.id)}
              className={`relative rounded-2xl p-4 text-left transition-all duration-300 border-2 ${
                activeDestination === dest.id
                  ? "border-[#1E3A8A] bg-[#1E3A8A] text-white shadow-xl scale-105"
                  : "border-gray-200 bg-white text-gray-700 hover:border-[#2563EB] hover:shadow-md"
              }`}>
              <div className="text-3xl mb-2">{dest.flag}</div>
              <div className="font-bold text-sm leading-tight">{dest.country}</div>
              <div className={`text-xs mt-1 ${activeDestination === dest.id ? "text-blue-200" : "text-gray-400"}`}>
                {dest.highlight}
              </div>
            </button>
          ))}
        </div>

        {/* Contenu de la destination active */}
        <AnimatePresence mode="wait">
          <motion.div key={activeDestination}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}>

            {/* En-tête destination */}
            <div className={`bg-gradient-to-r ${currentDest.bgGradient} rounded-3xl p-8 text-white mb-8`}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-5xl">{currentDest.flag}</span>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black">{currentDest.country}</h2>
                      <p className="text-white/80 text-sm">{currentDest.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-white/90 max-w-xl">{currentDest.tagline}</p>
                </div>
                <div className="flex flex-col gap-3 flex-shrink-0">
                  <button onClick={() => handleCTA(currentDest)}
                    className="bg-white text-[#1E3A8A] px-6 py-3 rounded-full font-bold hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-lg whitespace-nowrap">
                    <ArrowRight className="w-4 h-4" /> {currentDest.ctaLabel}
                  </button>
                  <a href={waLink(`Bonjour 3M Travel, je souhaite des informations sur ${currentDest.country}.`)}
                    target="_blank" rel="noopener noreferrer"
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-bold transition-colors flex items-center gap-2 justify-center">
                    <MessageCircle className="w-4 h-4" /> Parler à un conseiller
                  </a>
                </div>
              </div>
            </div>

            {/* Procédures disponibles */}
            <h3 className="text-xl font-black text-[#1E3A8A] mb-5 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Procédures disponibles — {currentDest.country}
              <span className="bg-[#1E3A8A] text-white text-xs px-2 py-0.5 rounded-full ml-1">
                {currentDest.procedures.length} procédure{currentDest.procedures.length > 1 ? "s" : ""}
              </span>
            </h3>

            <div className="space-y-4">
              {currentDest.procedures.map((proc, i) => (
                <motion.div key={proc.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  {/* En-tête de la procédure */}
                  <button
                    onClick={() => setExpandedProcedure(expandedProcedure === proc.id ? null : proc.id)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="bg-[#1E3A8A] text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-bold text-[#1E3A8A] text-base">{proc.title}</h4>
                          {proc.badge && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${proc.badgeColor}`}>
                              {proc.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm">{proc.description}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {expandedProcedure === proc.id
                        ? <ChevronUp className="w-5 h-5 text-[#1E3A8A]" />
                        : <ChevronDown className="w-5 h-5 text-gray-400" />
                      }
                    </div>
                  </button>

                  {/* Détails expandables */}
                  <AnimatePresence>
                    {expandedProcedure === proc.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden">
                        <div className="px-5 pb-5 border-t border-gray-100">
                          <ul className="mt-4 space-y-2">
                            {proc.details.map((detail, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button onClick={() => handleCTA(currentDest)}
                              className="bg-[#1E3A8A] hover:bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1">
                              <ArrowRight className="w-3.5 h-3.5" /> {currentDest.ctaLabel}
                            </button>
                            <a href={waLink(`Bonjour 3M Travel, je suis intéressé(e) par la procédure "${proc.title}" pour ${currentDest.country}. Mon profil : `)}
                              target="_blank" rel="noopener noreferrer"
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1">
                              <MessageCircle className="w-3.5 h-3.5" /> Discuter de cette procédure
                            </a>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {/* Bouton principal CTA répété en bas */}
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <button onClick={() => handleCTA(currentDest)}
                className="bg-[#1E3A8A] hover:bg-[#2563EB] text-white px-8 py-4 rounded-full font-bold text-lg transition-colors flex items-center gap-2 shadow-xl">
                <ArrowRight className="w-5 h-5" /> {currentDest.ctaLabel}
              </button>
              <button onClick={scrollToFormules}
                className="border-2 border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white px-8 py-4 rounded-full font-bold text-lg transition-colors flex items-center gap-2">
                <Award className="w-5 h-5" /> Voir les formules & tarifs
              </button>

            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* ── SECTION FORMULES DE PAIEMENT ─────────────────────────────────────── */}
      <section id="formules" className="bg-gradient-to-br from-gray-50 to-blue-50 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <AlertCircle className="w-4 h-4" />
              Frais d'ouverture de dossier : 65 000 FCFA non remboursables
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-[#1E3A8A] mb-3">
              Choisissez Votre Formule de Garantie
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              L'ouverture, le traitement, la traduction et la soumission de tout dossier individuel exigent un règlement initial de <strong>65 000 FCFA non remboursables</strong>. Choisissez ensuite la formule adaptée à votre situation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Formule 1 : Intégral */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedPayment(selectedPayment === "integral" ? null : "integral")}
              className={`cursor-pointer rounded-3xl p-7 border-2 transition-all ${
                selectedPayment === "integral"
                  ? "border-[#1E3A8A] bg-[#1E3A8A] text-white shadow-2xl"
                  : "border-gray-200 bg-white hover:border-[#1E3A8A] hover:shadow-lg"
              }`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                selectedPayment === "integral" ? "bg-white/20" : "bg-blue-100"
              }`}>
                <Zap className={`w-7 h-7 ${selectedPayment === "integral" ? "text-white" : "text-[#1E3A8A]"}`} />
              </div>
              <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                selectedPayment === "integral" ? "text-blue-200" : "text-[#2563EB]"
              }`}>Option 1</div>
              <h3 className="text-xl font-black mb-2">Règlement Intégral</h3>
              <p className={`text-sm mb-4 ${selectedPayment === "integral" ? "text-blue-100" : "text-gray-500"}`}>
                Traitement accéléré prioritaire — votre dossier passe en tête de file.
              </p>
              <ul className="space-y-2 text-sm">
                {["Paiement unique à l'ouverture du dossier", "Traitement prioritaire immédiat", "Suivi dédié avec conseiller attitré", "Accès à toutes les destinations disponibles", "Rapport de scoring sous 24h"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 ${selectedPayment === "integral" ? "text-green-300" : "text-green-500"}`} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {selectedPayment === "integral" && (
                <a href={waLink("Bonjour 3M Travel, je choisis la formule Règlement Intégral. Je souhaite ouvrir mon dossier.")}
                  target="_blank" rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-5 w-full bg-white text-[#1E3A8A] py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors">
                  <MessageCircle className="w-4 h-4" /> Choisir cette formule
                </a>
              )}
            </motion.div>

            {/* Formule 2 : Échelonné */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedPayment(selectedPayment === "echelonne" ? null : "echelonne")}
              className={`cursor-pointer rounded-3xl p-7 border-2 transition-all relative ${
                selectedPayment === "echelonne"
                  ? "border-amber-500 bg-amber-500 text-white shadow-2xl"
                  : "border-amber-200 bg-white hover:border-amber-500 hover:shadow-lg"
              }`}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">Populaire</span>
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                selectedPayment === "echelonne" ? "bg-white/20" : "bg-amber-100"
              }`}>
                <Clock className={`w-7 h-7 ${selectedPayment === "echelonne" ? "text-white" : "text-amber-600"}`} />
              </div>
              <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                selectedPayment === "echelonne" ? "text-amber-100" : "text-amber-600"
              }`}>Option 2</div>
              <h3 className="text-xl font-black mb-2">Échelonné Flexible</h3>
              <p className={`text-sm mb-4 ${selectedPayment === "echelonne" ? "text-amber-100" : "text-gray-500"}`}>
                Paiement structuré sur 4 à 5 mois — adapté à votre budget.
              </p>
              <ul className="space-y-2 text-sm">
                {["65 000 FCFA à l'ouverture (non remboursables)", "Solde réparti sur 4 à 5 mensualités", "Traitement standard avec suivi régulier", "Flexibilité en cas d'imprévus financiers", "Contrat de paiement signé et sécurisé"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 ${selectedPayment === "echelonne" ? "text-amber-200" : "text-green-500"}`} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {selectedPayment === "echelonne" && (
                <a href={waLink("Bonjour 3M Travel, je choisis la formule Échelonné Flexible. Je souhaite ouvrir mon dossier.")}
                  target="_blank" rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-5 w-full bg-white text-amber-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-amber-50 transition-colors">
                  <MessageCircle className="w-4 h-4" /> Choisir cette formule
                </a>
              )}
            </motion.div>

            {/* Formule 3 : Permis Garanti */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedPayment(selectedPayment === "garanti" ? null : "garanti")}
              className={`cursor-pointer rounded-3xl p-7 border-2 transition-all ${
                selectedPayment === "garanti"
                  ? "border-green-600 bg-green-600 text-white shadow-2xl"
                  : "border-green-200 bg-white hover:border-green-600 hover:shadow-lg"
              }`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                selectedPayment === "garanti" ? "bg-white/20" : "bg-green-100"
              }`}>
                <Shield className={`w-7 h-7 ${selectedPayment === "garanti" ? "text-white" : "text-green-600"}`} />
              </div>
              <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                selectedPayment === "garanti" ? "text-green-100" : "text-green-600"
              }`}>Option 3</div>
              <h3 className="text-xl font-black mb-2">Formule Permis Garanti</h3>
              <p className={`text-sm mb-4 ${selectedPayment === "garanti" ? "text-green-100" : "text-gray-500"}`}>
                Nos honoraires réglés <strong>uniquement après l'obtention du visa</strong>.
              </p>
              <ul className="space-y-2 text-sm">
                {["65 000 FCFA à l'ouverture (non remboursables)", "Solde des honoraires après visa obtenu", "Engagement de résultat de 3M Travel", "Profils sélectionnés sur critères stricts", "Suivi premium jusqu'à l'arrivée à destination"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 ${selectedPayment === "garanti" ? "text-green-200" : "text-green-500"}`} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {selectedPayment === "garanti" && (
                <a href={waLink("Bonjour 3M Travel, je choisis la Formule Permis Garanti. Je souhaite vérifier mon éligibilité.")}
                  target="_blank" rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-5 w-full bg-white text-green-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-50 transition-colors">
                  <MessageCircle className="w-4 h-4" /> Vérifier mon éligibilité
                </a>
              )}
            </motion.div>
          </div>

          {/* Rappel frais obligatoires */}
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 mb-1">Rappel important — Frais d'ouverture non remboursables</p>
              <p className="text-amber-700 text-sm">
                Quelle que soit la formule choisie, l'ouverture, le traitement, la traduction et la soumission de tout dossier individuel exigent un règlement initial de <strong>65 000 FCFA non remboursables</strong>. Ces frais couvrent l'audit de votre profil, la traduction certifiée de vos documents et la préparation de votre rapport de scoring officiel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TIMELINE DU PARCOURS CANDIDAT ───────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#0f2460] to-[#1E3A8A] py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-blue-200 text-sm mb-4">
              <Clock className="w-4 h-4" /> Processus transparent et structuré
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Votre Parcours Candidat</h2>
            <p className="text-blue-200 max-w-xl mx-auto">
              De l'évaluation initiale à l'obtention de votre visa — 5 étapes claires et rassurantes.
            </p>
          </div>

          {/* Desktop horizontal */}
          <div className="hidden lg:flex items-start gap-0 relative">
            <div className="absolute top-12 left-[10%] right-[10%] h-0.5 bg-white/20 z-0" />
            {TIMELINE_STEPS.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="flex-1 flex flex-col items-center text-center px-3 relative z-10">
                <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${step.color} flex flex-col items-center justify-center shadow-xl mb-4 border-4 border-white/20`}>
                  <step.icon className="w-8 h-8 text-white mb-1" />
                  <span className="text-white/60 text-xs font-bold">{step.number}</span>
                </div>
                <h3 className="text-white font-bold text-sm mb-1">{step.title}</h3>
                <span className="text-yellow-300 text-xs font-semibold mb-2">{step.subtitle}</span>
                <p className="text-blue-200 text-xs leading-relaxed">{step.description}</p>
                <span className="mt-2 bg-white/10 text-blue-100 text-xs px-2 py-1 rounded-full">{step.duration}</span>
              </motion.div>
            ))}
          </div>

          {/* Mobile vertical */}
          <div className="lg:hidden space-y-4">
            {TIMELINE_STEPS.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex gap-4 bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex flex-col items-center justify-center flex-shrink-0`}>
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-bold text-sm">{step.title}</h3>
                    <span className="bg-white/10 text-blue-200 text-xs px-2 py-0.5 rounded-full">{step.duration}</span>
                  </div>
                  <span className="text-yellow-300 text-xs font-semibold block mb-1">{step.subtitle}</span>
                  <p className="text-blue-200 text-xs">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button onClick={() => { setEvalDestination(""); setShowEvalForm(true); }}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-colors shadow-xl">
              <Star className="w-5 h-5" /> Démarrer Mon Parcours — Évaluation Gratuite
            </button>
          </div>
        </div>
      </section>

      {/* ── BANDEAU CONFORMITÉ JURIDIQUE ─────────────────────────────────────── */}
      <section className="bg-gray-50 border-t border-gray-200 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-4 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="bg-[#1E3A8A] p-3 rounded-xl flex-shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[#1E3A8A] mb-2 flex items-center gap-2">
                Bandeau de Conformité Juridique & Éthique
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">Agence Agréée</span>
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                <strong>3M Travel & Services SARL (RC/YAO/2019/A/2567 | NIU : M112417203369H)</strong> s'engage au strict respect des réglementations d'immigration. Notre rôle se limite au conseil technique, à la préparation administrative rigoureuse de vos dossiers et à la mise en relation avec des employeurs partenaires agréés. L'octroi final des visas et permis de travail relève de la compétence souveraine des services d'immigration de chaque État d'accueil.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-[#1E3A8A] text-white py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="3M Travel" className="h-10 w-10 rounded-full object-cover border-2 border-white/30" />
            <div>
              <div className="font-bold">3M Travel & Services SARL</div>
              <div className="text-blue-200 text-xs">Yaoundé Biyem-Assi, Montée chapelle Obili</div>
            </div>
          </div>
          <div className="flex gap-4 text-sm text-blue-200">
            <a href="tel:+237620996045" className="hover:text-white flex items-center gap-1">
              <Phone className="w-3 h-3" /> +237 620-996-045
            </a>
            <a href="tel:+237698104832" className="hover:text-white flex items-center gap-1">
              <Phone className="w-3 h-3" /> +237 698-104-832
            </a>
          </div>
          <Link href="/" className="text-blue-200 hover:text-white text-sm">← Retour à l'accueil</Link>
        </div>
      </footer>

      {/* ── BOUTON WHATSAPP FLOTTANT ─────────────────────────────────────────── */}
      <a href={waLink("Bonjour 3M Travel, j'ai une question sur les procédures d'immigration.")}
        target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center gap-2">
        <MessageCircle className="w-6 h-6" />
        <span className="hidden md:block text-sm font-bold">WhatsApp</span>
      </a>

      {/* ── POP-UP EUROPE SCHENGEN ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showEuropePopup && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setShowEuropePopup(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="bg-gradient-to-r from-blue-800 to-indigo-900 p-6 rounded-t-3xl text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">🇪🇺</span>
                    <div>
                      <h3 className="text-xl font-black">Europe Zone Schengen</h3>
                      <p className="text-blue-200 text-sm">Allemagne · France · Belgique · 27 pays</p>
                    </div>
                  </div>
                  <button onClick={() => setShowEuropePopup(false)}
                    className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-5">
                {DESTINATIONS.find(d => d.id === "europe")?.procedures.map((proc, i) => (
                  <div key={proc.id} className="border border-gray-100 rounded-2xl p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-[#1E3A8A] text-white w-7 h-7 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-[#1E3A8A]">{proc.title}</h4>
                          {proc.badge && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${proc.badgeColor}`}>
                              {proc.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm">{proc.description}</p>
                      </div>
                    </div>
                    <ul className="space-y-1.5 ml-10">
                      {proc.details.map((detail, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <a href={waLink("Bonjour 3M Travel, je souhaite des informations sur les visas Europe Schengen (Allemagne, France, Belgique). Mon profil : ")}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 bg-[#1E3A8A] hover:bg-[#2563EB] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                    <MessageCircle className="w-4 h-4" /> Consulter un conseiller Europe
                  </a>
                  <button onClick={() => setShowEuropePopup(false)}
                    className="px-5 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors font-medium">
                    Fermer
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL FORMULAIRE D'ÉVALUATION ───────────────────────────────────── */}
      <AnimatePresence>
        {showEvalForm && (
          <EvaluationModal
            destination={evalDestination}
            onClose={() => setShowEvalForm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── MODAL D'ÉVALUATION ───────────────────────────────────────────────────────
function EvaluationModal({ destination, onClose }: { destination: string; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    nom: "",
    telephone: "",
    email: "",
    destination: destination || "",
    niveauEtudes: "",
    experience: "",
    langue: "",
    situation: "",
    message: ""
  });

  const destinations = ["Canada", "Luxembourg", "Pologne", "Allemagne", "France", "Belgique", "Émirats Arabes Unis", "Qatar", "Autre"];
  const niveauxEtudes = ["Baccalauréat", "BTS / DUT", "Licence / Bachelor", "Master / MBA", "Doctorat", "Formation professionnelle"];
  const experiences = ["Moins de 2 ans", "2 à 5 ans", "5 à 10 ans", "Plus de 10 ans"];
  const langues = ["Français uniquement", "Français + Anglais (intermédiaire)", "Français + Anglais (courant)", "Bilingue ou plus"];

  function buildWAMessage() {
    return `🌍 *NOUVELLE DEMANDE D'ÉVALUATION — 3M Travel*\n\n` +
      `👤 *Nom :* ${form.nom}\n` +
      `📞 *Téléphone :* ${form.telephone}\n` +
      `📧 *Email :* ${form.email}\n` +
      `🎯 *Destination souhaitée :* ${form.destination}\n` +
      `🎓 *Niveau d'études :* ${form.niveauEtudes}\n` +
      `💼 *Expérience professionnelle :* ${form.experience}\n` +
      `🗣️ *Niveau de langue :* ${form.langue}\n` +
      `📋 *Situation actuelle :* ${form.situation}\n` +
      (form.message ? `💬 *Message :* ${form.message}\n` : "") +
      `\n_Envoyé depuis le site 3mtravelagency.click_`;
  }

  function handleSubmit() {
    window.open(waLink(buildWAMessage()), "_blank");
    onClose();
  }

  const isStep1Valid = form.nom.trim() && form.telephone.trim();
  const isStep2Valid = form.destination && form.niveauEtudes && form.experience;
  const isStep3Valid = form.langue && form.situation;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-black">Évaluation d'Éligibilité</h3>
              <p className="text-blue-200 text-sm">Réponse de nos experts sous 24h</p>
            </div>
            <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Barre de progression */}
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? "bg-white" : "bg-white/30"}`} />
            ))}
          </div>
          <div className="flex justify-between text-xs text-blue-200 mt-1">
            <span>Coordonnées</span>
            <span>Profil</span>
            <span>Finalisation</span>
          </div>
        </div>

        {/* Corps du formulaire */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h4 className="font-bold text-[#1E3A8A] mb-4">Étape 1 — Vos coordonnées</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Nom complet *</label>
                    <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
                      placeholder="Ex : Jean-Baptiste NKOMO" className="border-gray-200" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Numéro WhatsApp *</label>
                    <Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                      placeholder="+237 6XX XXX XXX" className="border-gray-200" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Email (optionnel)</label>
                    <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="votre@email.com" type="email" className="border-gray-200" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h4 className="font-bold text-[#1E3A8A] mb-4">Étape 2 — Votre profil</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Destination souhaitée *</label>
                    <select value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]">
                      <option value="">Choisir une destination</option>
                      {destinations.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Niveau d'études *</label>
                    <select value={form.niveauEtudes} onChange={(e) => setForm({ ...form, niveauEtudes: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]">
                      <option value="">Sélectionner</option>
                      {niveauxEtudes.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Expérience professionnelle *</label>
                    <select value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]">
                      <option value="">Sélectionner</option>
                      {experiences.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h4 className="font-bold text-[#1E3A8A] mb-4">Étape 3 — Finalisation</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Niveau de langue *</label>
                    <select value={form.langue} onChange={(e) => setForm({ ...form, langue: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]">
                      <option value="">Sélectionner</option>
                      {langues.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Situation actuelle *</label>
                    <select value={form.situation} onChange={(e) => setForm({ ...form, situation: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]">
                      <option value="">Sélectionner</option>
                      <option value="Étudiant(e)">Étudiant(e)</option>
                      <option value="Salarié(e) du secteur privé">Salarié(e) du secteur privé</option>
                      <option value="Fonctionnaire / Secteur public">Fonctionnaire / Secteur public</option>
                      <option value="Entrepreneur / Indépendant">Entrepreneur / Indépendant</option>
                      <option value="En recherche d'emploi">En recherche d'emploi</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1">Message complémentaire (optionnel)</label>
                    <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Précisez votre domaine professionnel, vos certifications, vos questions..."
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] resize-none" />
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                    <strong>Rappel :</strong> Tout dossier ouvert requiert 65 000 FCFA non remboursables. Nos experts vous recontacteront sous 24h pour confirmer votre éligibilité.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)}
                className="px-5 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors font-medium">
                ← Retour
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                className="flex-1 bg-[#1E3A8A] hover:bg-[#2563EB] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                Continuer <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!isStep3Valid}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" /> Envoyer via WhatsApp
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
