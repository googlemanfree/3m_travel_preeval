import { useEffect, useMemo, useState } from "react";
import { ArrowRight, MessageCircle } from "lucide-react";
import { ServicePageShell, ServiceSection } from "@/components/ServicePageShell";
import { QuickActionsGrid } from "@/components/QuickActionsSection";
import { PremiumCoverImage } from "@/components/PremiumCoverImage";
import { HOW_IT_WORKS, SERVICE_POLES, type ServicePoleId } from "@/data/serviceCatalog";
import { getServiceVisual, type VisualSources } from "@/data/premiumVisuals";
import { setPageSeo } from "@/lib/pageSeo";
import { trpc } from "@/lib/trpc";

const WHATSAPP_URL = `https://wa.me/237698104832?text=${encodeURIComponent("Bonjour, j’aimerais des informations sur vos services.")}`;

const POLE_IDS: ServicePoleId[] = ["mobilite", "travel", "services"];

function resolvePoleFromHash(): ServicePoleId {
  if (typeof window === "undefined") return "mobilite";
  const hash = window.location.hash.replace("#", "");
  return POLE_IDS.includes(hash as ServicePoleId) ? (hash as ServicePoleId) : "mobilite";
}

function withOverride(base: VisualSources, imageUrl?: string | null, alt?: string | null): VisualSources {
  if (!imageUrl) return base;
  return { ...base, desktop: imageUrl, mobile: imageUrl, alt: alt || base.alt };
}

export default function Services() {
  const [activePole, setActivePole] = useState<ServicePoleId>(() => resolvePoleFromHash());
  const mediaQuery = trpc.destinationMedia.listPublic.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const mediaById = useMemo(() => {
    const map = new Map<string, { imageUrl?: string | null; imageAlt?: string | null }>();
    for (const item of mediaQuery.data ?? []) {
      if (item.destinationId) map.set(item.destinationId, item);
    }
    return map;
  }, [mediaQuery.data]);

  useEffect(() => {
    const sync = () => setActivePole(resolvePoleFromHash());
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    const visual = getServiceVisual(activePole);
    const override = mediaById.get(activePole);
    setPageSeo({
      title: "Tous nos services | 3M TRAVEL AGENCY",
      description:
        "Immigration, visas, billets d’avion, hôtels, assurance voyage, CNI, passeport, e-Visa et formations : tous les services de 3M à Yaoundé.",
      image: override?.imageUrl ?? visual.desktop,
      imageAlt: override?.imageAlt ?? visual.alt,
    });
  }, [activePole, mediaById]);

  const heroVisual = withOverride(getServiceVisual(activePole), mediaById.get(activePole)?.imageUrl, mediaById.get(activePole)?.imageAlt);

  return (
    <ServicePageShell
      eyebrow="Tous nos services"
      title="Visas, voyages et démarches administratives : un seul interlocuteur"
      introduction="3M TRAVEL AGENCY accompagne la mobilité internationale, organise vos déplacements et prépare des démarches administratives et numériques, à Yaoundé et à distance."
      primaryHref="/consultation"
      primaryLabel="Parler à un conseiller"
      notice="Les décisions de visa, de délivrance de documents et de tarification appartiennent aux autorités et prestataires concernés : 3M prépare, oriente et suit votre dossier sans garantir de résultat."
      heroVisual={heroVisual}
    >
      <nav aria-label="Pôles de services" className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-2">
          {SERVICE_POLES.map((pole) => (
            <a
              key={pole.id}
              href={`#${pole.id}`}
              onClick={() => setActivePole(pole.id)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                activePole === pole.id ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-blue-50"
              }`}
              aria-current={activePole === pole.id ? "true" : undefined}
            >
              {pole.title}
            </a>
          ))}
        </div>
      </nav>

      <ServiceSection title="Que voulez-vous accomplir ?" introduction="Partez de votre intention : chaque carte mène directement à la bonne démarche, avec un accompagnement jusqu’au dépôt." tone="slate">
        <QuickActionsGrid />
      </ServiceSection>

      {SERVICE_POLES.map((pole, index) => (
        <ServiceSection key={pole.id} title={pole.title} introduction={pole.tagline} tone={index % 2 === 0 ? "white" : "blue"}>
          <ul id={pole.id} className="grid scroll-mt-24 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid={`pole-${pole.id}`}>
            {pole.services.map((service) => {
              const override = mediaById.get(service.id);
              const visual = withOverride(getServiceVisual(service.id), override?.imageUrl, override?.imageAlt);
              return (
                <li key={service.id}>
                  <a
                    href={service.href}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                    data-testid={`service-card-${service.id}`}
                  >
                    <PremiumCoverImage
                      visual={visual}
                      className="aspect-[16/9]"
                      imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="flex flex-1 flex-col p-5">
                      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${pole.accent}`} aria-hidden="true">
                        <service.icon className="h-5 w-5" />
                      </span>
                      <span className="mt-4 text-base font-black text-slate-950">{service.title}</span>
                      <span className="mt-1.5 flex-1 text-sm leading-6 text-slate-600">{service.description}</span>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700">
                        En savoir plus <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
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
