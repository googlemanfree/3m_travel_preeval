import { useState } from "react";
import { ChevronDown, Check, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function AVI() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "Est-ce obligatoire pour obtenir un visa étudiant ?",
      a: "Oui, l'AVI est obligatoire pour les visas étudiants en France (Campus France), Canada, Belgique, Allemagne et autres pays de l'UE. C'est une preuve que vos ressources financières sont bloquées et disponibles pour vos études.",
    },
    {
      q: "Peut-on récupérer l'argent après l'obtention du visa ?",
      a: "Oui, une fois votre visa approuvé, vous pouvez demander le déblocage de votre compte auprès de la banque. Les fonds vous seront restitués selon les conditions du contrat de compte bloqué.",
    },
    {
      q: "Est-ce sécurisé ? Qui a accès à mon argent ?",
      a: "Oui, c'est très sécurisé. L'argent est bloqué sur un compte bancaire à votre nom. Seul vous et la banque pouvez y accéder. Aucun tiers n'a accès à ces fonds.",
    },
    {
      q: "Quel montant minimum faut-il bloquer ?",
      a: "Le montant dépend du pays et du programme d'études. Généralement : France (15 000-20 000 EUR), Canada (20 000-30 000 CAD), Allemagne (10 000-12 000 EUR).",
    },
    {
      q: "Combien de temps faut-il pour obtenir l'AVI ?",
      a: "Délai total : 2-3 semaines. Ouverture du compte (2-5 jours) + Virement (3-7 jours) + Émission de l'AVI (24-48h).",
    },
    {
      q: "Quels documents sont nécessaires ?",
      a: "Pièce d'identité valide, lettre d'admission, justificatif de fonds (relevé bancaire), formulaire Campus France (si France), et formulaire de demande d'AVI.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-b from-green-600 to-green-700 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">🏦 AVI — Attestation de Virement Irrévocable</h1>
          <p className="text-lg text-green-100">Document bancaire prouvant un virement irrévocable vers un compte bloqué</p>
        </div>
      </section>

      {/* Contenu */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Définition */}
          <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded">
            <h2 className="text-2xl font-bold text-blue-900 mb-3">Qu'est-ce que l'AVI ?</h2>
            <p className="text-gray-700 leading-relaxed">
              L'AVI est un document bancaire officiel prouvant qu'un montant d'argent a été viré de manière irrévocable vers un compte bloqué à votre nom. Ce compte est gelé et l'argent ne peut pas être retiré avant la levée du blocage. C'est une garantie financière exigée par les autorités consulaires pour les visas étudiants.
            </p>
          </div>

          {/* Pays concernés */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🌍 Pays Concernés</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { flag: "🇫🇷", country: "France", amount: "15 000 - 20 000 EUR" },
                { flag: "🇨🇦", country: "Canada", amount: "20 000 - 30 000 CAD" },
                { flag: "🇧🇪", country: "Belgique", amount: "12 000 - 15 000 EUR" },
                { flag: "🇩🇪", country: "Allemagne", amount: "10 000 - 12 000 EUR" },
                { flag: "🇳🇱", country: "Pays-Bas", amount: "12 000 - 15 000 EUR" },
                { flag: "🇪🇺", country: "Autres UE", amount: "Variable selon pays" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-3xl">{item.flag}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{item.country}</p>
                    <p className="text-sm text-gray-600">{item.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Processus 4 étapes */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">⚙️ Processus en 4 Étapes</h2>
            <div className="space-y-4">
              {[
                { step: 1, title: "Ouverture de compte bloqué", delay: "2-5 jours", desc: "Ouverture d'un compte bancaire spécial avec blocage des fonds" },
                { step: 2, title: "Virement bancaire", delay: "3-7 jours", desc: "Transfert irrévocable du montant vers le compte bloqué" },
                { step: 3, title: "Émission de l'AVI", delay: "24-48h", desc: "La banque émet l'attestation officielle de virement irrévocable" },
                { step: 4, title: "Intégration au dossier", delay: "Immédiat", desc: "Ajout de l'AVI à votre dossier de visa" },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                      {item.step}
                    </div>
                    {item.step < 4 && <div className="w-1 h-12 bg-green-200 mt-2" />}
                  </div>
                  <div className="pb-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-green-600 font-semibold">⏱️ {item.delay}</p>
                    <p className="text-gray-600 mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tarif */}
          <div className="bg-yellow-50 border-l-4 border-yellow-600 p-6 rounded">
            <h2 className="text-2xl font-bold text-yellow-900 mb-4">💰 Tarif</h2>
            <div className="space-y-2">
              <p className="text-lg"><strong>Frais de service 3M Travel :</strong> 50 000 FCFA</p>
              <p className="text-gray-700"><strong>Inclus :</strong> Conseil, suivi, coordination avec la banque</p>
              <p className="text-gray-700"><strong>Non inclus :</strong> Frais bancaires variables (selon banque et montant)</p>
              <p className="text-sm text-gray-600 mt-3">⏱️ Délai total : 2-3 semaines</p>
            </div>
          </div>

          {/* Documents requis */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Documents Requis</h2>
            <ul className="space-y-2">
              {[
                "Pièce d'identité valide (passeport ou CNI)",
                "Lettre d'admission de l'établissement",
                "Justificatif de fonds (relevé bancaire)",
                "Formulaire Campus France (si France)",
                "Formulaire de demande d'AVI (fourni par 3M Travel)",
              ].map((doc, idx) => (
                <li key={idx} className="flex items-center gap-3 p-3 bg-blue-50 rounded">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">{doc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">❓ Questions Fréquentes</h2>
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <p className="font-semibold text-gray-900 text-left">{faq.q}</p>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-600 flex-shrink-0 transition-transform ${
                        expandedFaq === idx ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expandedFaq === idx && (
                    <div className="p-4 bg-blue-50 text-gray-700 border-t border-gray-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Prêt à demander votre AVI ?</h3>
            <a
              href="https://wa.me/237698104832?text=Bonjour%203M%20Travel%2C%20je%20souhaite%20demander%20une%20AVI%20pour%20mon%20visa%20%C3%A9tudiant."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 bg-white text-green-600 font-bold rounded-lg hover:bg-gray-100 transition-colors"
            >
              💬 Contacter un conseiller
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
