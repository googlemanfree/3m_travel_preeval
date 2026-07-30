import React from 'react';
import { Link } from 'wouter';

const services = [
  {
    id: 'visa',
    title: 'Visa & Immigration',
    subtitle: 'Évaluation gratuite',
    icon: '🛂',
    badgeColor: 'bg-blue-100 text-blue-600',
    link: '/evaluation',
    isExternal: false,
  },
  {
    id: 'vols',
    title: "Billets d'avion",
    subtitle: 'Meilleurs tarifs',
    icon: '✈️',
    badgeColor: 'bg-indigo-100 text-indigo-600',
    link: '/vols',
    isExternal: false,
  },
  {
    id: 'hotels',
    title: 'Hôtels & Tourisme',
    subtitle: 'Réservation facile',
    icon: '🏨',
    badgeColor: 'bg-rose-100 text-rose-600',
    link: 'https://wa.me/237620996045?text=Bonjour%203M%20Travel,%20je%20souhaite%20une%20réservation%20d%27hôtel%20/%20séjour.',
    isExternal: true,
  },
  {
    id: 'assurance',
    title: 'Assurance voyage',
    subtitle: 'Protection complète',
    icon: '🛡️',
    badgeColor: 'bg-sky-100 text-sky-600',
    link: 'https://wa.me/237620996045?text=Bonjour%203M%20Travel,%20je%20souhaite%20souscrire%20une%20assurance%20voyage.',
    isExternal: true,
  },
  {
    id: 'traduction',
    title: 'Traduction Certifiée',
    subtitle: 'Documents officiels',
    icon: '📄',
    badgeColor: 'bg-purple-100 text-purple-600',
    link: "https://wa.me/237620996045?text=Bonjour%203M%20Travel,%20j%27ai%20des%20documents%20officiels%20à%20traduire.",
    isExternal: true,
  },
  {
    id: 'procedures',
    title: 'Procédures & Guides',
    subtitle: 'Toutes les infos',
    icon: '📋',
    badgeColor: 'bg-amber-100 text-amber-600',
    link: '/procedures',
    isExternal: false,
  },
];

export default function ServicesSection() {
  return (
    <section className="py-16 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Titre section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-[#0a2540] tracking-tight">
            Nos Domaines d'Expertise
          </h2>
          <p className="text-gray-500 mt-2 text-sm font-medium">
            Un accompagnement complet pour l'ensemble de vos projets à l'international
          </p>
        </div>

        {/* Grille des 6 cartes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((item) =>
            item.isExternal ? (
              <a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <ServiceCardContent item={item} />
              </a>
            ) : (
              <Link
                key={item.id}
                href={item.link}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
              >
                <ServiceCardContent item={item} />
              </Link>
            )
          )}
        </div>

      </div>
    </section>
  );
}

function ServiceCardContent({ item }: { item: typeof services[number] }) {
  return (
    <>
      <div>
        {/* Icône */}
        <div className="w-14 h-14 rounded-2xl bg-blue-50/80 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner">
          {item.icon}
        </div>

        {/* Titre & sous-titre */}
        <h3 className="text-lg font-bold text-[#0a2540] group-hover:text-blue-600 transition-colors">
          {item.title}
        </h3>
        <p className="text-sm font-medium text-gray-500 mt-1">
          {item.subtitle}
        </p>
      </div>

      {/* Flèche accès */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-blue-600">
        <span>En savoir plus</span>
        <span className="transform group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </>
  );
}
