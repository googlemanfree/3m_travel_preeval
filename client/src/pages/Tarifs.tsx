import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle, Shield, Clock, Award, Star, Phone, MessageCircle,
  Plane, FileText, Globe, CreditCard, Building2, ChevronDown, ChevronUp,
  Users, Zap, HeartHandshake, Lock
} from "lucide-react";

// ─── Données tarifaires ────────────────────────────────────────────────────
const TARIF_CATEGORIES = [
  {
    id: "canada",
    label: "🇨🇦 Immigration Canada",
    color: "from-red-600 to-red-800",
    badge: "Recommandé",
    badgeColor: "bg-amber-500",
    services: [
      { name: "Résidence Permanente (Express Entry / PNP)", price: "500 000", unit: "FCFA", delai: "12-18 mois", note: "Accompagnement complet jusqu'à l'obtention" },
      { name: "Permis de Travail (LMIA / Intra-compagnie)", price: "350 000", unit: "FCFA", delai: "3-6 mois", note: "Offre d'emploi requise" },
      { name: "Permis d'Études (Collège / Université)", price: "250 000", unit: "FCFA", delai: "2-4 mois", note: "Lettre d'admission requise" },
      { name: "Visa Visiteur / Tourisme", price: "400 000", unit: "FCFA", delai: "4-8 semaines", note: "Inclut préparation dossier complet" },
      { name: "Regroupement Familial", price: "Sur devis", unit: "", delai: "12-24 mois", note: "Selon situation familiale" },
    ],
  },
  {
    id: "europe",
    label: "🇪🇺 Europe & Schengen",
    color: "from-blue-600 to-blue-800",
    badge: null,
    badgeColor: "",
    services: [
      { name: "Visa Schengen Tourisme / Affaires", price: "150 000", unit: "FCFA", delai: "3-6 semaines", note: "Allemagne, France, Belgique, etc." },
      { name: "Visa Étudiant France (Campus France)", price: "200 000", unit: "FCFA", delai: "2-3 mois", note: "Inclut préparation entretien Campus France" },
      { name: "Chancenkarte Allemagne (Carte des Chances)", price: "280 000", unit: "FCFA", delai: "3-6 mois", note: "Nouveau programme 2024" },
      { name: "Permis de Travail Luxembourg", price: "320 000", unit: "FCFA", delai: "3-5 mois", note: "Salaire min. 3 165 EUR/mois requis" },
      { name: "Permis de Travail Pologne", price: "220 000", unit: "FCFA", delai: "2-4 mois", note: "Contrat de travail requis" },
      { name: "Visa Long Séjour (VLS-TS)", price: "250 000", unit: "FCFA", delai: "2-4 mois", note: "France, Belgique, Allemagne" },
    ],
  },
  {
    id: "golfe",
    label: "🇦🇪 Golfe & Moyen-Orient",
    color: "from-yellow-600 to-yellow-800",
    badge: null,
    badgeColor: "",
    services: [
      { name: "Visa Tourisme Dubaï / UAE", price: "95 000", unit: "FCFA", delai: "5-10 jours", note: "30 ou 60 jours" },
      { name: "Visa Travail Dubaï / UAE", price: "180 000", unit: "FCFA", delai: "3-6 semaines", note: "Offre d'emploi requise" },
      { name: "Visa Qatar / Arabie Saoudite", price: "120 000", unit: "FCFA", delai: "1-3 semaines", note: "Selon type de visa" },
    ],
  },
  {
    id: "afrique",
    label: "🌍 Afrique & Autres",
    color: "from-green-600 to-green-800",
    badge: null,
    badgeColor: "",
    services: [
      { name: "Visa Côte d'Ivoire", price: "68 000", unit: "FCFA", delai: "5-10 jours", note: "" },
      { name: "Visa Gabon / Congo", price: "80 000", unit: "FCFA", delai: "1-2 semaines", note: "" },
      { name: "Investissement au Cameroun", price: "Sur devis", unit: "", delai: "Variable", note: "Accompagnement juridique et administratif" },
    ],
  },
  {
    id: "administratif",
    label: "📋 Services Administratifs",
    color: "from-purple-600 to-purple-800",
    badge: null,
    badgeColor: "",
    services: [
      { name: "AVI — Attestation de Virement Irrévocable", price: "50 000", unit: "FCFA", delai: "2-3 semaines", note: "+ frais bancaires variables" },
      { name: "Assurance Voyage", price: "Dès 15 000", unit: "FCFA", delai: "24-48h", note: "Selon durée et destination" },
      { name: "Réservation Avion (pour dossier visa)", price: "Dès 5 000", unit: "FCFA", delai: "24h", note: "Réservation confirmée sans paiement billet" },
      { name: "Réservation Hôtel (pour dossier visa)", price: "Dès 5 000", unit: "FCFA", delai: "24h", note: "Confirmation d'hébergement" },
      { name: "Traduction certifiée de documents", price: "Dès 20 000", unit: "FCFA", delai: "2-5 jours", note: "Par document" },
      { name: "Légalisation / Apostille", price: "Dès 30 000", unit: "FCFA", delai: "1-2 semaines", note: "Selon type de document" },
    ],
  },
  {
    id: "tests",
    label: "🎓 Tests de Langue",
    color: "from-teal-600 to-teal-800",
    badge: null,
    badgeColor: "",
    services: [
      { name: "Préparation TCF / TEF Canada", price: "80 000", unit: "FCFA", delai: "4-8 semaines", note: "Cours intensifs + simulations" },
      { name: "Préparation TCF Québec", price: "80 000", unit: "FCFA", delai: "4-8 semaines", note: "Spécifique immigration Québec" },
      { name: "Préparation IELTS / TOEFL", price: "90 000", unit: "FCFA", delai: "4-8 semaines", note: "Anglais pour Canada, UK, USA" },
      { name: "Préparation DELF / DALF", price: "75 000", unit: "FCFA", delai: "4-8 semaines", note: "Français pour Europe" },
      { name: "Préparation TestDaF", price: "85 000", unit: "FCFA", delai: "4-8 semaines", note: "Allemand pour Allemagne" },
    ],
  },
];

// ─── Garanties ─────────────────────────────────────────────────────────────
const GARANTIES = [
  {
    icon: Shield,
    title: "Visa Garanti*",
    desc: "Si votre dossier est refusé après notre accompagnement complet, nous remboursons nos frais de service.",
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
  },
  {
    icon: Award,
    title: "Experts Certifiés",
    desc: "Notre équipe est formée aux procédures IRCC, OFII, Campus France et aux exigences de chaque ambassade.",
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
  },
  {
    icon: Clock,
    title: "Suivi 24/7",
    desc: "Un conseiller dédié répond à vos questions 7j/7 via WhatsApp. Vous n'êtes jamais seul dans votre démarche.",
    color: "text-purple-600",
    bg: "bg-purple-50 border-purple-200",
  },
  {
    icon: Lock,
    title: "Données Sécurisées",
    desc: "Vos documents et informations personnelles sont traités avec une confidentialité absolue et stockés de façon sécurisée.",
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
  },
];

// ─── Partenaires ───────────────────────────────────────────────────────────
const PARTENAIRES = [
  { name: "IRCC Canada", logo: "🇨🇦", desc: "Immigration, Réfugiés et Citoyenneté Canada" },
  { name: "Campus France", logo: "🎓", desc: "Agence française pour la promotion de l'enseignement supérieur" },
  { name: "MTN MoMo", logo: "📱", desc: "Mobile Money — Paiement sécurisé" },
  { name: "Orange Money", logo: "🟠", desc: "Paiement mobile Orange" },
  { name: "CinetPay", logo: "💳", desc: "Paiement en ligne sécurisé" },
  { name: "Resend", logo: "📧", desc: "Notifications email sécurisées" },
];

// ─── Formules de paiement ──────────────────────────────────────────────────
const FORMULES = [
  {
    id: "integral",
    name: "Paiement Intégral",
    badge: "Économique",
    badgeColor: "bg-green-500",
    price: "Prix affiché",
    desc: "Réglez la totalité dès le démarrage. Aucun frais supplémentaire.",
    avantages: ["Dossier traité en priorité", "Remise de 5% sur le total", "Démarrage immédiat"],
    icon: Zap,
    color: "border-green-400 bg-green-50",
    headerColor: "bg-green-600",
  },
  {
    id: "echelonne",
    name: "Paiement Échelonné",
    badge: "Flexible",
    badgeColor: "bg-blue-500",
    price: "En 2 ou 3 versements",
    desc: "50% au démarrage, le solde à mi-parcours ou à l'obtention du visa.",
    avantages: ["Accessible à tous les budgets", "Calendrier de paiement personnalisé", "Accompagnement identique"],
    icon: CreditCard,
    color: "border-blue-400 bg-blue-50",
    headerColor: "bg-blue-600",
  },
  {
    id: "garanti",
    name: "Permis Garanti",
    badge: "Sécurisé",
    badgeColor: "bg-amber-500",
    price: "Prix + 65 000 FCFA",
    desc: "Remboursement de nos frais de service en cas de refus après dossier complet.",
    avantages: ["Garantie de remboursement", "Dossier renforcé et relu 3 fois", "Conseiller senior dédié"],
    icon: Shield,
    color: "border-amber-400 bg-amber-50",
    headerColor: "bg-amber-600",
  },
];

// ─── Composant principal ───────────────────────────────────────────────────
export default function Tarifs() {
  const [openCategory, setOpenCategory] = useState<string | null>("canada");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1E3A8A] via-[#1E40AF] to-[#1D4ED8] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge className="bg-amber-500 text-white mb-4 text-sm px-4 py-1">Transparence Totale</Badge>
            <h1 className="text-4xl md:text-5xl font-black mb-4">Nos Tarifs & Services</h1>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto mb-8">
              Tous nos prix sont affichés clairement. Aucun frais caché, aucune surprise.
              Votre projet d'immigration mérite une totale transparence.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/open-dossier">
                <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-3 rounded-xl text-lg">
                  <FileText className="w-5 h-5 mr-2" />
                  Ouvrir un dossier
                </Button>
              </Link>
              <a href="https://wa.me/237690000000?text=Bonjour%2C%20je%20souhaite%20un%20devis%20personnalis%C3%A9" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-900 font-bold px-8 py-3 rounded-xl text-lg">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Devis personnalisé
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Réassurance */}
      <section className="py-10 px-4 bg-white border-b">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {GARANTIES.map((g, i) => (
            <motion.div
              key={g.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-xl border p-4 ${g.bg}`}
            >
              <g.icon className={`w-8 h-8 ${g.color} mb-2`} />
              <h3 className="font-bold text-gray-900 text-sm mb-1">{g.title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{g.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Grille tarifaire */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Grille Tarifaire Complète</h2>
            <p className="text-gray-500">Cliquez sur une catégorie pour voir les détails</p>
          </div>

          <div className="space-y-4">
            {TARIF_CATEGORIES.map((cat) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenCategory(openCategory === cat.id ? null : cat.id)}
                  className={`w-full flex items-center justify-between p-5 bg-gradient-to-r ${cat.color} text-white font-bold text-lg`}
                >
                  <span className="flex items-center gap-3">
                    {cat.label}
                    {cat.badge && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cat.badgeColor} text-white`}>
                        {cat.badge}
                      </span>
                    )}
                  </span>
                  {openCategory === cat.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>

                {openCategory === cat.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="divide-y divide-gray-100">
                      {cat.services.map((svc, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-gray-50 transition-colors gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{svc.name}</p>
                            {svc.note && <p className="text-xs text-gray-500 mt-0.5">{svc.note}</p>}
                          </div>
                          <div className="flex items-center gap-6 shrink-0">
                            <div className="text-center">
                              <p className="text-xs text-gray-400 uppercase tracking-wide">Délai</p>
                              <p className="text-sm font-medium text-gray-700">{svc.delai}</p>
                            </div>
                            <div className="text-right min-w-[120px]">
                              <p className="text-xs text-gray-400 uppercase tracking-wide">Frais de service</p>
                              <p className="text-xl font-black text-[#1E3A8A]">
                                {svc.price}
                                {svc.unit && <span className="text-sm font-normal text-gray-500 ml-1">{svc.unit}</span>}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-gray-50 border-t">
                      <Link href="/open-dossier">
                        <Button className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white rounded-lg text-sm">
                          Démarrer ma procédure →
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          <p className="text-xs text-gray-400 mt-4 text-center">
            * Les frais de service 3M Travel sont distincts des frais d'ambassade, frais bancaires et frais de tests de langue qui restent à la charge du candidat.
          </p>
        </div>
      </section>

      {/* Formules de paiement */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Formules de Paiement</h2>
            <p className="text-gray-500">Choisissez la formule adaptée à votre situation</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FORMULES.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl border-2 overflow-hidden ${f.color}`}
              >
                <div className={`${f.headerColor} text-white p-5`}>
                  <div className="flex items-center justify-between mb-2">
                    <f.icon className="w-8 h-8" />
                    <Badge className={`${f.badgeColor} text-white text-xs`}>{f.badge}</Badge>
                  </div>
                  <h3 className="text-xl font-black">{f.name}</h3>
                  <p className="text-sm opacity-90 mt-1">{f.price}</p>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-600 mb-4">{f.desc}</p>
                  <ul className="space-y-2">
                    {f.avantages.map((a) => (
                      <li key={a} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mini-module réservation vol pour visa */}
      <section className="py-12 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-blue-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] text-white p-6 flex items-center gap-4">
              <Plane className="w-10 h-10" />
              <div>
                <h2 className="text-2xl font-black">Réservation Vol pour Dossier Visa</h2>
                <p className="text-blue-200 text-sm">Obtenez une confirmation de vol sans payer votre billet — obligatoire pour certains visas</p>
              </div>
              <Badge className="bg-amber-500 text-white ml-auto shrink-0">Dès 5 000 FCFA</Badge>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    Pourquoi ce service ?
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Les ambassades exigent souvent une réservation de vol confirmée</li>
                    <li>• Vous n'avez pas à payer votre billet avant d'avoir votre visa</li>
                    <li>• La réservation est valable 2 à 4 semaines selon la compagnie</li>
                    <li>• Acceptée par les ambassades Schengen, Canada, UK, USA</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Ce que vous recevez
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Confirmation de réservation avec PNR (numéro de dossier)</li>
                    <li>• Document PDF officiel à joindre à votre dossier visa</li>
                    <li>• Itinéraire aller (et retour si demandé)</li>
                    <li>• Livraison par email sous 24h</li>
                  </ul>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://wa.me/237690000000?text=Bonjour%2C%20je%20souhaite%20une%20r%C3%A9servation%20de%20vol%20pour%20mon%20dossier%20visa.%20D%C3%A9part%20%3A%20%5Bville%5D%20%E2%86%92%20Destination%20%3A%20%5Bville%5D%20%2F%20Date%20%3A%20%5Bdate%5D"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Commander via WhatsApp
                  </Button>
                </a>
                <Link href="/vols">
                  <Button variant="outline" className="border-[#1E3A8A] text-[#1E3A8A] hover:bg-blue-50 font-bold rounded-xl">
                    <Plane className="w-4 h-4 mr-2" />
                    Rechercher un vol complet
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partenaires */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-2">Ils nous font confiance</h2>
          <p className="text-gray-500 mb-8">Nos partenaires institutionnels et technologiques</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {PARTENAIRES.map((p) => (
              <div key={p.name} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="text-4xl mb-2">{p.logo}</div>
                <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                <p className="text-xs text-gray-500 mt-1 leading-tight">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-16 px-4 bg-gradient-to-br from-[#1E3A8A] to-[#1D4ED8] text-white text-center">
        <div className="max-w-2xl mx-auto">
          <HeartHandshake className="w-16 h-16 mx-auto mb-4 text-amber-400" />
          <h2 className="text-3xl font-black mb-4">Prêt à démarrer votre projet ?</h2>
          <p className="text-blue-200 mb-8">
            Obtenez une évaluation gratuite de votre profil en 2 minutes. Nos experts analysent votre dossier et vous proposent le meilleur parcours.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/#evaluation">
              <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-3 rounded-xl text-lg">
                <Star className="w-5 h-5 mr-2" />
                Évaluation gratuite
              </Button>
            </Link>
            <Link href="/open-dossier">
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-900 font-bold px-8 py-3 rounded-xl text-lg">
                <FileText className="w-5 h-5 mr-2" />
                Ouvrir un dossier
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
