import React from 'react';
import { Link } from 'wouter';

const services = [
  {
    id: 'visa',
    title: 'Visa & Immigration',
    subtitle: 'Évaluation initiale et accompagnement structuré de votre projet.',
    icon: '🛂',
    badgeColor: 'bg-blue-100 text-blue-600',
    link: '/procedures',
    isExternal: false,
  },
  {
    id: 'vols',
    title: "Billets d'avion",
    subtitle: 'Recherche d’options adaptées à vos dates, itinéraire et budget.',
    icon: '✈️',
    badgeColor: 'bg-indigo-100 text-indigo-600',
    link: '/billets',
    isExternal: false,
  },
  {
    id: 'hotels',
    title: 'Hôtels & Tourisme',
    subtitle: 'Hébergements confortables et réservations simplifiées',
    icon: '🏨',
    badgeColor: 'bg-rose-100 text-rose-600',
    link: '/tourisme',
    isExternal: false,
  },
  {
    id: 'assurance',
    title: 'Assurance voyage',
    subtitle: 'Préparez une demande de couverture adaptée à votre séjour.',
    icon: '🛡️',
    badgeColor: 'bg-sky-100 text-sky-600',
    link: '/assurance',
    isExternal: false,
  },
  {
    id: 'traduction',
    title: 'Traduction Certifiée',
    subtitle: 'Traductions certifiées pour tous vos documents officiels',
    icon: '📄',
    badgeColor: 'bg-purple-100 text-purple-600',
    link: '/traduction/order',
    isExternal: false,
  },
  {
    id: 'procedures',
    title: 'Procédures & Guides',
    subtitle: 'Guides complets et démarches détaillées',
    icon: '📋',
    badgeColor: 'bg-amber-100 text-amber-600',
    link: '/procedures',
    isExternal: false,
  },
];

const intentRoutes = [
  { label: 'Vols', description: 'Rechercher un itinéraire', href: '/billets', icon: '✈️' },
  { label: 'Tourisme', description: 'Préparer un séjour', href: '/tourisme', icon: '✦' },
  { label: 'Hôtels', description: 'Trouver un hébergement', href: '/tourisme', icon: '⌂' },
  { label: 'Visa', description: 'Explorer les procédures', href: '/procedures', icon: '◈' },
  { label: 'Assurance', description: 'Préparer une couverture', href: '/assurance', icon: '▣' },
  { label: 'Traduction', description: 'Commander une traduction', href: '/traduction/order', icon: '文' },
  { label: 'Ressources', description: 'Consulter les guides', href: '/ressources', icon: '▤' },
];

export default function ServicesSection() {
  return (
    <section className="py-16 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <nav aria-label="Choisir un besoin" className="mb-10 grid grid-cols-2 gap-2 rounded-2xl border border-blue-100 bg-white p-2 shadow-sm sm:grid-cols-4 lg:grid-cols-7">
          {intentRoutes.map((item) => (
            <Link key={`${item.label}-${item.href}`} href={item.href} className="group flex min-h-16 flex-col items-center justify-center rounded-xl px-2 py-2 text-center transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700">
              <span className="text-lg text-blue-700" aria-hidden="true">{item.icon}</span>
              <span className="text-xs font-extrabold text-slate-900">{item.label}</span>
              <span className="hidden text-[10px] font-medium text-slate-500 sm:block">{item.description}</span>
            </Link>
          ))}
        </nav>

        {/* Titre section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-[#0a2540] tracking-tight">
            Nos Services Clés pour Votre Mobilité Internationale
          </h2>
          <p className="text-gray-500 mt-2 text-sm font-medium">
            De l'évaluation de votre éligibilité aux billets d'avion, nous couvrons tous les aspects de votre projet.
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

function ServiceCardContent({ item }: { item: typeof services[number] & { tag?: string } }) {
  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50/80 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
            {item.icon}
          </div>
          {item.tag && (
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${item.badgeColor}`}>
              {item.tag}
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-[#0a2540] group-hover:text-blue-600 transition-colors">
          {item.title}
        </h3>
        <p className="text-sm font-medium text-gray-500 mt-1 leading-relaxed">
          {item.subtitle}
        </p>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-blue-600">
        <span className="group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
          <span>Lancer la démarche</span>
          <span>→</span>
        </span>
        <span className="text-[11px] font-semibold text-slate-400">3M Travel</span>
      </div>
    </>
  );
}
