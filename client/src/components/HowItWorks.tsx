import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, FileText, Zap, Send } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      icon: CheckCircle,
      title: 'Évaluation & Audit',
      description: 'Soumettez vos pièces pour analyse consulaire préalable. Nos experts vérifient votre éligibilité.',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      number: 2,
      icon: FileText,
      title: 'Ouverture de Dossier (65 000 FCFA)',
      description: 'Reçu officiel et signature du mandat. Votre dossier est enregistré dans notre système.',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      number: 3,
      icon: Zap,
      title: 'Montage & Traduction Assermentée',
      description: 'Légalisation MINREX et mise aux normes. Tous les documents sont préparés pour le dépôt.',
      color: 'bg-amber-100 text-amber-600',
    },
    {
      number: 4,
      icon: Send,
      title: 'Dépôt & Suivi Consulaire',
      description: 'Rendez-vous ambassade/VFS et suivi dans votre Espace Client. Vous êtes informé à chaque étape.',
      color: 'bg-green-100 text-green-600',
    },
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-gray-900 mb-3">
            ⚙️ Comment ça marche ?
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Découvrez notre processus en 4 étapes simples et transparentes pour transformer votre projet en réalité.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-20 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-purple-200 to-green-200" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="flex flex-col items-center">
                  {/* Step number circle */}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${step.color} border-4 border-white shadow-lg`}>
                    <Icon className="w-8 h-8" />
                  </div>

                  {/* Card */}
                  <Card className="w-full border-2 border-gray-100 hover:border-gray-300 transition-all">
                    <CardContent className="p-4 text-center">
                      <div className="text-sm font-bold text-gray-500 mb-2">ÉTAPE {step.number}</div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                    </CardContent>
                  </Card>

                  {/* Arrow */}
                  {index < steps.length - 1 && (
                    <div className="md:hidden my-4 text-2xl text-gray-400">↓</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Prêt à commencer votre voyage ? Nos experts sont à votre disposition.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all hover:shadow-lg">
            Démarrer mon évaluation gratuite →
          </button>
        </div>
      </div>
    </section>
  );
}
