import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2, FileText, CreditCard, CheckCircle, Clock, Shield,
  MessageCircle, ChevronDown, ChevronUp, AlertCircle, Info,
  ArrowRight, Banknote, Lock, Globe
} from "lucide-react";

// ─── Étapes du processus ───────────────────────────────────────────────────
const STEPS = [
  {
    num: 1,
    icon: Building2,
    title: "Ouverture du compte bloqué",
    delai: "2 à 5 jours ouvrés",
    color: "bg-blue-600",
    desc: "Ouverture d'un compte bancaire bloqué dans une banque partenaire agréée (Afriland First Bank, SCB Cameroun, UBA, etc.). Ce compte est spécialement conçu pour recevoir les fonds destinés à votre séjour à l'étranger.",
    docs: ["Pièce d'identité valide (CNI ou passeport)", "Lettre d'admission de l'établissement", "Formulaire de la banque partenaire"],
  },
  {
    num: 2,
    icon: Banknote,
    title: "Virement bancaire des fonds",
    delai: "3 à 7 jours ouvrés",
    color: "bg-indigo-600",
    desc: "Transfert du montant requis vers le compte bloqué. Le montant minimum varie selon le pays de destination : France (615 EUR/mois × durée), Canada (10 000 CAD minimum), Belgique (650 EUR/mois), Allemagne (934 EUR/mois).",
    docs: ["Justificatif de provenance des fonds", "Reçu de virement bancaire", "Relevé de compte source"],
  },
  {
    num: 3,
    icon: FileText,
    title: "Émission de l'AVI",
    delai: "24 à 48 heures",
    color: "bg-purple-600",
    desc: "La banque émet l'Attestation de Virement Irrévocable — un document officiel certifiant que les fonds ont été virés et sont bloqués. Ce document est signé et tamponné par la banque.",
    docs: ["L'AVI originale (document bancaire officiel)", "Relevé de compte bloqué", "Certificat de blocage des fonds"],
  },
  {
    num: 4,
    icon: Globe,
    title: "Intégration au dossier visa",
    delai: "Immédiat",
    color: "bg-green-600",
    desc: "L'AVI est jointe à votre dossier de demande de visa. Elle constitue la preuve financière exigée par l'ambassade pour démontrer que vous disposez des ressources suffisantes pour votre séjour.",
    docs: ["AVI + tous les autres documents du dossier", "Formulaire de demande de visa", "Convocation Campus France (si France)"],
  },
];

// ─── FAQ ───────────────────────────────────────────────────────────────────
const FAQ = [
  {
    q: "L'AVI est-elle obligatoire pour tous les visas étudiants ?",
    a: "L'AVI est obligatoire pour les visas étudiants en France (via Campus France), au Canada, en Belgique et dans la plupart des pays de l'UE. Elle peut être remplacée par une lettre de bourse ou une garantie financière parentale dans certains cas. Nos conseillers vous précisent ce qui s'applique à votre situation.",
  },
  {
    q: "Peut-on récupérer l'argent après l'obtention du visa ?",
    a: "Oui. Une fois votre visa obtenu et votre arrivée dans le pays de destination, vous pouvez accéder aux fonds bloqués. Les modalités de déblocage varient selon la banque et le pays, mais en général vous pouvez retirer progressivement les fonds dès votre arrivée.",
  },
  {
    q: "Que se passe-t-il si le visa est refusé ?",
    a: "En cas de refus de visa, les fonds bloqués vous sont intégralement restitués, déduction faite des frais bancaires de gestion du compte bloqué (généralement 5 000 à 15 000 FCFA). Nos frais de service 3M Travel sont remboursés si le refus est dû à un dossier incomplet de notre fait.",
  },
  {
    q: "L'AVI est-elle sécurisée ?",
    a: "Absolument. L'AVI est un document bancaire officiel émis par une institution financière agréée par la BEAC (Banque des États de l'Afrique Centrale). Elle est infalsifiable et vérifiable directement par l'ambassade auprès de la banque émettrice.",
  },
  {
    q: "Quel montant faut-il bloquer ?",
    a: "Le montant dépend du pays et de la durée du séjour. Pour la France : 615 EUR × nombre de mois (ex. 7 380 EUR pour 12 mois). Pour le Canada : minimum 10 000 CAD pour la première année. Pour la Belgique : 650 EUR/mois. Nos conseillers calculent le montant exact selon votre dossier.",
  },
  {
    q: "Combien de temps prend l'ensemble du processus ?",
    a: "De l'ouverture du compte à la réception de l'AVI, comptez 2 à 3 semaines en moyenne. Il est donc recommandé de démarrer ce processus au moins 6 semaines avant votre rendez-vous à l'ambassade.",
  },
];

// ─── Pays concernés ────────────────────────────────────────────────────────
const PAYS = [
  { flag: "🇫🇷", name: "France", montant: "615 EUR/mois", via: "Campus France" },
  { flag: "🇨🇦", name: "Canada", montant: "10 000 CAD min.", via: "IRCC" },
  { flag: "🇧🇪", name: "Belgique", montant: "650 EUR/mois", via: "Ambassade" },
  { flag: "🇩🇪", name: "Allemagne", montant: "934 EUR/mois", via: "Ambassade" },
  { flag: "🇨🇭", name: "Suisse", montant: "21 000 CHF/an", via: "Ambassade" },
  { flag: "🇳🇱", name: "Pays-Bas", montant: "900 EUR/mois", via: "IND" },
];

export default function AVI() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1E3A8A] via-[#1E40AF] to-[#312E81] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-amber-500 text-white text-sm px-4 py-1">Service Administratif</Badge>
              <Badge className="bg-green-500 text-white text-sm px-4 py-1">50 000 FCFA</Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              AVI — Attestation de Virement Irrévocable
            </h1>
            <p className="text-xl text-blue-200 max-w-3xl mb-6">
              Le document bancaire indispensable pour prouver vos ressources financières lors d'une demande de visa étudiant en France, au Canada, en Belgique ou en Allemagne.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://wa.me/237690000000?text=Bonjour%2C%20je%20souhaite%20d%C3%A9marrer%20le%20processus%20AVI%20pour%20mon%20visa%20%C3%A9tudiant."
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-3 rounded-xl text-lg">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Démarrer mon AVI
                </Button>
              </a>
              <Link href="/tarifs">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-900 font-bold px-8 py-3 rounded-xl text-lg">
                  Voir tous les tarifs
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Définition */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex gap-4">
            <Info className="w-8 h-8 text-blue-600 shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-black text-gray-900 mb-2">Qu'est-ce qu'une AVI ?</h2>
              <p className="text-gray-700 leading-relaxed">
                L'<strong>Attestation de Virement Irrévocable (AVI)</strong> est un document bancaire officiel certifiant qu'un virement a été effectué vers un <strong>compte bancaire bloqué</strong> au nom du candidat. Ce compte ne peut être débité qu'une fois le candidat arrivé dans le pays de destination, ce qui garantit à l'ambassade que les fonds sont réels et disponibles.
              </p>
              <p className="text-gray-700 leading-relaxed mt-3">
                Ce document est <strong>obligatoire</strong> pour les demandes de visa étudiant dans de nombreux pays (France via Campus France, Canada, Belgique, Allemagne, etc.) et remplace ou complète la preuve de ressources financières habituellement exigée.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pays concernés */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-gray-900 mb-2 text-center">Pays concernés</h2>
          <p className="text-gray-500 text-center mb-8">Montants indicatifs — à confirmer selon votre durée de séjour</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {PAYS.map((p) => (
              <div key={p.name} className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:border-blue-300 transition-colors">
                <div className="text-4xl mb-2">{p.flag}</div>
                <p className="font-bold text-gray-900">{p.name}</p>
                <p className="text-xs text-blue-600 font-semibold mt-1">{p.montant}</p>
                <p className="text-xs text-gray-400 mt-1">via {p.via}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Processus 4 étapes */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-gray-900 mb-2 text-center">Le Processus en 4 Étapes</h2>
          <p className="text-gray-500 text-center mb-10">Durée totale estimée : <strong>2 à 3 semaines</strong></p>

          <div className="relative">
            {/* Ligne verticale */}
            <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-600 via-purple-600 to-green-600 hidden md:block" />

            <div className="space-y-8">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  className="flex gap-6"
                >
                  {/* Icône */}
                  <div className={`w-16 h-16 rounded-full ${step.color} text-white flex items-center justify-center shrink-0 shadow-lg z-10`}>
                    <step.icon className="w-7 h-7" />
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 p-5">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <Badge className={`${step.color} text-white text-xs`}>Étape {step.num}</Badge>
                      <h3 className="text-lg font-black text-gray-900">{step.title}</h3>
                      <div className="flex items-center gap-1 text-gray-500 text-sm ml-auto">
                        <Clock className="w-4 h-4" />
                        {step.delai}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">{step.desc}</p>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Documents requis :</p>
                      <ul className="space-y-1">
                        {step.docs.map((d) => (
                          <li key={d} className="flex items-center gap-2 text-sm text-gray-700">
                            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tarif */}
      <section className="py-12 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-blue-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] text-white p-6">
              <h2 className="text-2xl font-black mb-1">Tarif du Service AVI</h2>
              <p className="text-blue-200 text-sm">Frais de service 3M Travel — hors frais bancaires</p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-4xl font-black text-[#1E3A8A]">50 000 <span className="text-xl font-normal text-gray-500">FCFA</span></p>
                  <p className="text-sm text-gray-500 mt-1">Frais de service 3M Travel</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">+ Frais bancaires variables</p>
                  <p className="text-xs text-gray-400">(selon la banque partenaire)</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="font-bold text-green-700 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Inclus dans nos frais
                  </p>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Accompagnement complet du processus</li>
                    <li>• Coordination avec la banque partenaire</li>
                    <li>• Vérification de tous les documents</li>
                    <li>• Suivi jusqu'à l'émission de l'AVI</li>
                    <li>• Conseils sur le montant à bloquer</li>
                  </ul>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="font-bold text-amber-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Non inclus (à prévoir)
                  </p>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Frais d'ouverture de compte bloqué</li>
                    <li>• Frais de virement bancaire</li>
                    <li>• Le montant à bloquer lui-même</li>
                    <li>• Frais de traduction de documents</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="https://wa.me/237690000000?text=Bonjour%2C%20je%20souhaite%20d%C3%A9marrer%20le%20processus%20AVI.%20Destination%20%3A%20%5Bpays%5D%20%2F%20D%C3%A9but%20%C3%A9tudes%20%3A%20%5Bdate%5D"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Démarrer via WhatsApp
                  </Button>
                </a>
                <Link href="/open-dossier">
                  <Button className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white font-bold rounded-xl">
                    <FileText className="w-4 h-4 mr-2" />
                    Ouvrir un dossier
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-gray-900 mb-2 text-center">Questions Fréquentes</h2>
          <p className="text-gray-500 text-center mb-8">Tout ce que vous devez savoir sur l'AVI</p>

          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-100 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">{item.q}</span>
                  {openFaq === i ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-200 pt-4">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-12 px-4 bg-gradient-to-br from-[#1E3A8A] to-[#312E81] text-white text-center">
        <div className="max-w-2xl mx-auto">
          <Lock className="w-12 h-12 mx-auto mb-4 text-amber-400" />
          <h2 className="text-2xl font-black mb-3">Besoin d'aide pour votre AVI ?</h2>
          <p className="text-blue-200 mb-6">
            Nos conseillers vous accompagnent de A à Z : calcul du montant, choix de la banque, coordination des documents et suivi jusqu'à l'émission.
          </p>
          <a
            href="https://wa.me/237690000000?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20pour%20mon%20AVI."
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-3 rounded-xl text-lg">
              <MessageCircle className="w-5 h-5 mr-2" />
              Contacter un conseiller
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
