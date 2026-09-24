import { ArrowRight, MessageCircle } from "lucide-react";
import { ServicePageShell, ServiceSection } from "@/components/ServicePageShell";
import { QuickActionsGrid } from "@/components/QuickActionsSection";
import { HOW_IT_WORKS, SERVICE_POLES } from "@/data/serviceCatalog";

const WHATSAPP_URL = `https://wa.me/237698104832?text=${encodeURIComponent("Bonjour, j’aimerais des informations sur vos services.")}`;

export default function Services() {
  return (
    <ServicePageShell
      eyebrow="Tous nos services"
      title="Visas, voyages et démarches administratives : un seul interlocuteur"
      introduction="3M Travel & Services accompagne la mobilité internationale, organise vos déplacements et prépare des démarches administratives et numériques, à Yaoundé et à distance."
      primaryHref="/consultation"
      primaryLabel="Parler à un conseiller"
      notice="Les décisions de visa, de délivrance de documents et de tarification appartiennent aux autorités et prestataires concernés : 3M prépare, oriente et suit votre dossier sans garantir de résultat."
    >
      <ServiceSection title="Que voulez-vous faire ?" introduction="Partez de votre besoin : chaque carte mène directement à la bonne démarche." tone="slate">
        <QuickActionsGrid />
      </ServiceSection>

      {SERVICE_POLES.map((pole, index) => (
        <ServiceSection key={pole.id} title={pole.title} introduction={pole.tagline} tone={index % 2 === 0 ? "white" : "blue"}>
          <ul id={pole.id} className="grid scroll-mt-24 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid={`pole-${pole.id}`}>
            {pole.services.map((service) => (
              <li key={service.id}>
                <a
                  href={service.href}
                  className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${pole.accent}`} aria-hidden="true">
                    <service.icon className="h-5 w-5" />
                  </span>
                  <span className="mt-4 text-base font-black text-slate-950">{service.title}</span>
                  <span className="mt-1.5 flex-1 text-sm leading-6 text-slate-600">{service.description}</span>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700">
                    En savoir plus <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </ServiceSection>
      ))}

      <ServiceSection title="Comment ça marche" introduction="La même méthode pour toutes les demandes, du premier contact au suivi.">
        <ol className="grid gap-4 md:grid-cols-3">
          {HOW_IT_WORKS.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-sm font-black text-white" aria-hidden="true">{index + 1}</span>
              <h3 className="mt-3 text-base font-black text-slate-950">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-slate-600">{step.text}</p>
            </li>
          ))}
        </ol>
      </ServiceSection>

      <ServiceSection title="Une question avant de commencer ?" tone="blue">
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href="/consultation" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
            Prendre rendez-vous <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-bold text-blue-900 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> Écrire sur WhatsApp
          </a>
        </div>
      </ServiceSection>
    </ServicePageShell>
  );
}
