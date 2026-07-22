import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import {
  ArrowRight, CheckCircle, MessageCircle, Star,
  Plane, Globe, FileText, Shield, GraduationCap,
  Briefcase, Home, Users, Building2, CreditCard
} from "lucide-react";

const WHATSAPP_NUMBER = "237698104832";

function whatsappLink(msg: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

// ─── Données des services alignées sur EasyVisa ───────────────────────────────

interface ServiceFormule {
  id: string;
  title: string;
  price: string;
  priceNote: string;
  popular?: boolean;
  items: string[];
  whatsappMsg: string;
  ctaLabel?: string;
}

interface ServiceCategory {
  id: string;
  icon: React.ReactNode;
  category: string;
  subtitle: string;
  color: string;
  services: ServiceFormule[];
}

const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "canada",
    icon: <Globe size={24} />,
    category: "Immigration Canada",
    subtitle: "Résidence permanente, études, travail, visite",
    color: "from-red-500 to-red-700",
    services: [
      {
        id: "canada-rp",
        title: "Résidence Permanente",
        price: "500 000 FCFA",
        priceNote: "Frais d'accompagnement uniquement",
        popular: true,
        items: [
          "Étude de profil approfondie",
          "Remplissage des formulaires officiels",
          "Vérification complète des documents",
          "Assistance équivalence diplômes (WES)",
          "Suivi dossier jusqu'à décision",
        ],
        whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le forfait Résidence Permanente Canada (500 000 FCFA). Pouvez-vous m'en dire plus ?",
      },
      {
        id: "canada-etudes",
        title: "Permis d'Études",
        price: "250 000 FCFA",
        priceNote: "Frais d'accompagnement uniquement",
        items: [
          "Demande d'admission (frais client)",
          "Demande de CAQ (Québec)",
          "Rédaction lettre explicative",
          "Soumission permis d'études",
          "Préparation à l'arrivée",
        ],
        whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le forfait Permis d'Études Canada (250 000 FCFA). Pouvez-vous m'en dire plus ?",
      },
      {
        id: "canada-travail",
        title: "Permis de Travail",
        price: "350 000 FCFA",
        priceNote: "Frais d'accompagnement uniquement",
        items: [
          "Optimisation CV format canadien",
          "Vérification contrat & EIMT",
          "Soumission demande permis",
          "Préparation à l'arrivée",
          "Conseils installation",
        ],
        whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le forfait Permis de Travail Canada (350 000 FCFA). Pouvez-vous m'en dire plus ?",
      },
      {
        id: "canada-visiteur",
        title: "Visa Visiteur",
        price: "400 000 FCFA",
        priceNote: "Frais d'accompagnement uniquement",
        items: [
          "Analyse lettre d'invitation",
          "Constitution dossier preuves financières",
          "Vérification attaches pays d'origine",
          "Formulaires et soumission",
          "Suivi de la demande",
        ],
        whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le forfait Visa Visiteur Canada (400 000 FCFA). Pouvez-vous m'en dire plus ?",
      },
    ],
  },
  {
    id: "voyage",
    icon: <Plane size={24} />,
    category: "Accompagnement Voyage",
    subtitle: "Tourisme, visas, destinations populaires",
    color: "from-blue-500 to-blue-700",
    services: [
      {
        id: "cote-ivoire",
        title: "Visiter la Côte d'Ivoire",
        price: "68 000 FCFA",
        priceNote: "Tout inclus",
        items: [
          "Visa tourisme Côte d'Ivoire",
          "Constitution du dossier complet",
          "Soumission à l'ambassade",
          "Suivi de la demande",
        ],
        whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le service Visa Côte d'Ivoire (68 000 FCFA). Pouvez-vous m'en dire plus ?",
      },
      {
        id: "dubai",
        title: "Visa Tourisme Dubaï",
        price: "Dès 95 000 FCFA",
        priceNote: "Selon durée de séjour",
        items: [
          "Visa touristique 30 ou 60 jours",
          "Constitution du dossier",
          "Soumission en ligne",
          "Délai 3–5 jours ouvrés",
        ],
        whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le Visa Tourisme Dubaï (dès 95 000 FCFA). Pouvez-vous m'en dire plus ?",
      },
      {
        id: "booking",
        title: "Réservations pour Visa (Avion & Hôtel)",
        price: "Dès 5 000 FCFA",
        priceNote: "Par réservation",
        items: [
          "Réservation billet d'avion fictif",
          "Réservation hôtel fictif",
          "Documents valides pour ambassade",
          "Livraison rapide (24h)",
        ],
        whatsappMsg: "Bonjour 3M Travel, j'ai besoin d'une réservation d'avion/hôtel pour visa (dès 5 000 FCFA). Pouvez-vous m'aider ?",
      },
      {
        id: "accueil-aeroport",
        title: "Accueil Aéroport & Installation",
        price: "Dès 25 000 FCFA",
        priceNote: "Selon destination",
        items: [
          "Accueil à l'aéroport d'arrivée",
          "Transport vers le logement",
          "Aide à l'installation",
          "Conseils pratiques locaux",
        ],
        whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par le service Accueil Aéroport (dès 25 000 FCFA). Pouvez-vous m'en dire plus ?",
      },
    ],
  },
  {
    id: "administratif",
    icon: <FileText size={24} />,
    category: "Services Administratifs",
    subtitle: "AVI, assurance, création d'entreprise",
    color: "from-green-500 to-green-700",
    services: [
      {
        id: "avi",
        title: "Attestation de Virement Irrévocable (AVI)",
        price: "50 000 FCFA",
        priceNote: "Frais de service",
        items: [
          "Attestation bancaire officielle",
          "Montant personnalisé selon ambassade",
          "Délai 24–48h",
          "Document accepté par toutes les ambassades",
        ],
        whatsappMsg: "Bonjour 3M Travel, j'ai besoin d'une Attestation de Virement Irrévocable (AVI) à 50 000 FCFA. Pouvez-vous m'aider ?",
      },
      {
        id: "assurance",
        title: "Assurance Voyage",
        price: "Dès 15 000 FCFA",
        priceNote: "Selon durée et destination",
        items: [
          "Couverture médicale internationale",
          "Rapatriement d'urgence",
          "Annulation de voyage",
          "Partenaires : AXA, Allianz",
        ],
        whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par l'Assurance Voyage (dès 15 000 FCFA). Pouvez-vous m'en dire plus ?",
      },
      {
        id: "entreprise",
        title: "Création d'Entreprise",
        price: "Dès 150 000 FCFA",
        priceNote: "Selon type de structure",
        items: [
          "SARL, SA ou Établissement",
          "Assistance juridique et fiscale",
          "Immatriculation au registre du commerce",
          "NIU et ouverture de compte bancaire",
        ],
        whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par la Création d'Entreprise (dès 150 000 FCFA). Pouvez-vous m'en dire plus ?",
      },
    ],
  },
  {
    id: "formation",
    icon: <GraduationCap size={24} />,
    category: "Formation & Études",
    subtitle: "Langues, études à l'étranger, orientation",
    color: "from-purple-500 to-purple-700",
    services: [
      {
        id: "tcf-tef",
        title: "Préparation TCF/TEF",
        price: "Dès 50 000 FCFA",
        priceNote: "Par session",
        items: [
          "Cours intensifs TCF Canada",
          "Préparation TEF Canada",
          "Simulations d'examens",
          "Coaching personnalisé",
        ],
        whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par la Préparation TCF/TEF (dès 50 000 FCFA). Pouvez-vous m'en dire plus ?",
      },
      {
        id: "etudes-france",
        title: "Études en France",
        price: "Sur devis",
        priceNote: "Selon établissement",
        items: [
          "Recherche d'établissements",
          "Dossier Campus France",
          "Visa étudiant France",
          "Logement et installation",
        ],
        whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par les Études en France. Pouvez-vous me faire un devis ?",
        ctaLabel: "Demander un devis",
      },
      {
        id: "immigration-allemagne",
        title: "Immigration Allemagne",
        price: "Sur devis",
        priceNote: "Selon profil",
        items: [
          "Visa de travail qualifié",
          "Reconnaissance des diplômes",
          "Cours d'allemand B1/B2",
          "Accompagnement installation",
        ],
        whatsappMsg: "Bonjour 3M Travel, je suis intéressé(e) par l'Immigration en Allemagne. Pouvez-vous me faire un devis ?",
        ctaLabel: "Demander un devis",
      },
    ],
  },
];

// ─── Composant Carte de Formule ───────────────────────────────────────────────

function FormuleCard({ formule }: { formule: ServiceFormule }) {
  const [, navigate] = useLocation();
  return (
    <Card className={`relative flex flex-col border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${formule.popular ? "border-blue-500 shadow-md" : "border-gray-200"}`}>
      {formule.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-blue-600 text-white px-3 py-1 text-xs font-semibold">
            ⭐ POPULAIRE
          </Badge>
        </div>
      )}
      <CardHeader className="pb-3 pt-6">
        <CardTitle className="text-base font-bold text-gray-900">{formule.title}</CardTitle>
        <div className="mt-2">
          <span className="text-2xl font-black text-blue-700">{formule.price}</span>
          <p className="text-xs text-gray-500 mt-0.5">{formule.priceNote}</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-4">
        <ul className="space-y-2 flex-1">
          {formule.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2 pt-2">
          <a
            href={whatsappLink(formule.whatsappMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors"
          >
            <MessageCircle size={15} />
            {formule.ctaLabel ?? "Choisir ce forfait"}
          </a>
          <Button
            variant="outline"
            size="sm"
            className="text-blue-700 border-blue-300 hover:bg-blue-50"
            onClick={() => navigate("/open-dossier")}
          >
            <FileText size={14} className="mr-1.5" />
            Ouvrir un dossier
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function Services() {
  const [, navigate] = useLocation();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const displayed = activeCategory
    ? SERVICE_CATEGORIES.filter((c) => c.id === activeCategory)
    : SERVICE_CATEGORIES;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-800 to-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <Badge className="bg-white/20 text-white border-white/30 mb-4 text-sm px-4 py-1">
            ✅ Visa Garanti* · Experts Certifiés · Suivi 24/7
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Nos Solutions Voyage & Immigration</h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            3M Travel & Services vous accompagne à chaque étape : de la planification de votre voyage à votre installation à l'étranger.
          </p>
          <p className="text-xs text-blue-200 mt-3">
            * Nous maximisons vos chances. La décision finale appartient aux ambassades. Nous garantissons un dossier conforme à 100%.
          </p>
        </div>
      </section>

      {/* Filtres par catégorie */}
      <section className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant={activeCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(null)}
              className="text-sm"
            >
              Tous les services
            </Button>
            {SERVICE_CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
                className="text-sm"
              >
                {cat.category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Contenu des services */}
      <main className="container mx-auto px-4 py-12 space-y-16">
        {displayed.map((cat) => (
          <section key={cat.id}>
            {/* En-tête de catégorie */}
            <div className="flex items-center gap-3 mb-8">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center`}>
                {cat.icon}
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">{cat.category}</h2>
                <p className="text-sm text-gray-500">{cat.subtitle}</p>
              </div>
            </div>

            {/* Grille des formules */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cat.services.map((formule) => (
                <FormuleCard key={formule.id} formule={formule} />
              ))}
            </div>
          </section>
        ))}

        {/* FAQ */}
        <section className="bg-white rounded-2xl border p-8 max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-gray-900 mb-6 text-center">Questions Fréquentes</h2>
          <div className="space-y-4">
            <details className="group border rounded-lg p-4 cursor-pointer">
              <summary className="font-semibold text-gray-900 list-none flex justify-between items-center">
                Quels sont les délais de traitement ?
                <ArrowRight size={16} className="group-open:rotate-90 transition-transform text-gray-400" />
              </summary>
              <p className="mt-3 text-sm text-gray-600">
                Le délai dépend du service choisi. En général, les services de visa prennent <strong>2 à 4 semaines</strong>, tandis que les services administratifs peuvent être plus rapides. Le Canada RP peut prendre 6 à 18 mois.
              </p>
            </details>
            <details className="group border rounded-lg p-4 cursor-pointer">
              <summary className="font-semibold text-gray-900 list-none flex justify-between items-center">
                Est-ce que c'est garanti ?
                <ArrowRight size={16} className="group-open:rotate-90 transition-transform text-gray-400" />
              </summary>
              <p className="mt-3 text-sm text-gray-600">
                <strong>Nous maximisons vos chances.</strong> Cependant, la décision finale appartient aux ambassades. Nous ne pouvons garantir l'obtention du visa à 100%, mais nous garantissons un dossier conforme à 100%.
              </p>
            </details>
            <details className="group border rounded-lg p-4 cursor-pointer">
              <summary className="font-semibold text-gray-900 list-none flex justify-between items-center">
                Comment payer les frais de service ?
                <ArrowRight size={16} className="group-open:rotate-90 transition-transform text-gray-400" />
              </summary>
              <p className="mt-3 text-sm text-gray-600">
                Nous acceptons les paiements via Mobile Money (Orange Money, MTN MoMo), virement bancaire et espèces dans nos bureaux à Yaoundé. Contactez-nous sur WhatsApp pour les détails.
              </p>
            </details>
          </div>
        </section>

        {/* CTA final */}
        <section className="text-center py-8">
          <p className="text-gray-600 mb-4">Vous ne savez pas quel service choisir ?</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={whatsappLink("Bonjour 3M Travel, j'ai besoin d'aide pour choisir le bon service. Pouvez-vous m'orienter ?")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              <MessageCircle size={18} />
              Discuter sur WhatsApp
            </a>
            <Button
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50 py-3 px-6 rounded-xl"
              onClick={() => navigate("/")}
            >
              <Star size={16} className="mr-2" />
              Évaluation gratuite
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
