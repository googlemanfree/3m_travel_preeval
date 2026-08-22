import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FAQSection() {
  const [expanded, setExpanded] = useState<number | null>(null);

  const faqs = [
    {
      id: 1,
      question: 'Comment s\'effectue le paiement des frais d\'ouverture de dossier ?',
      answer:
        'Tous les règlements (65 000 FCFA) s\'effectuent par guichet sécurisé Mobile Money/Visa ou à l\'agence de Yaoundé avec reçu officiel au nom de 3M Travel & Services SARL. Nous acceptons également les virements bancaires pour les montants importants.',
    },
    {
      id: 2,
      question: 'Quelles sont vos garanties en cas de dossier non éligible ?',
      answer:
        'Notre audit préalable identifie les risques en amont pour éviter tout dépôt infructueux. Si votre profil ne correspond pas aux critères consulaires, nous vous le communiquons avant l\'ouverture du dossier, sans frais supplémentaires.',
    },
    {
      id: 3,
      question: 'Acceptez-vous les candidats titulaires du passeport camerounais pour l\'Europe ?',
      answer:
        'Oui, nos procédures (notamment pour la Pologne Type D) sont spécifiquement adaptées aux prérequis consulaires à Yaoundé. Nous avons une expertise reconnue auprès des ambassades et consulats européens pour les ressortissants camerounais.',
    },
    {
      id: 4,
      question: 'Combien de temps faut-il pour obtenir un visa après dépôt ?',
      answer:
        'Les délais varient selon la destination et le type de visa. En moyenne : Pologne (3-5 mois), Canada (6-12 mois), Luxembourg (3-5 mois), France (4-6 mois). Nous vous communiquons le délai exact lors de l\'ouverture de votre dossier.',
    },
  ];

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-gray-900 mb-3">
            ❓ Questions Fréquentes
          </h2>
          <p className="text-gray-600 text-lg">
            Trouvez les réponses aux questions les plus posées par nos clients.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq) => (
            <Card
              key={faq.id}
              className="border-2 border-gray-200 hover:border-blue-300 transition-all cursor-pointer overflow-hidden"
              onClick={() => setExpanded(expanded === faq.id ? null : faq.id)}
            >
              <CardContent className="p-0">
                <button className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  {expanded === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {expanded === faq.id && (
                  <div className="border-t border-gray-200 bg-blue-50 p-6">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 bg-white rounded-lg border-2 border-blue-200 p-8 text-center">
          <p className="text-gray-600 mb-4">
            Vous n\'avez pas trouvé la réponse à votre question ?
          </p>
          <a
            href="https://wa.me/237698104832?text=Bonjour%203M%20Travel%2C%20j%27ai%20une%20question%20concernant%20vos%20services."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg transition-all"
          >
            💬 Contactez-nous sur WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
