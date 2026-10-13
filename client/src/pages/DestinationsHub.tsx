import { useEffect } from "react";
import { ChecklistSection, FaqSection } from "@/components/PageEnrichment";
import { DESTINATIONS_CRITERIA, DESTINATIONS_FAQ } from "@/data/pageEnrichment";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { DESTINATIONS_20, REGION_ORDER, type Destination20 } from "@/data/destinations20";
import { getDestinationVisual, getServiceVisual } from "@/data/premiumVisuals";
import { PremiumCoverImage } from "@/components/PremiumCoverImage";
import { PremiumAtmosphere } from "@/components/PremiumAtmosphere";
import { IllustrativeDestinationStrip } from "@/components/IllustrativeDestinationStrip";
import { setPageSeo } from "@/lib/pageSeo";
import { INTERNATIONAL_BRAND } from "@/data/internationalBrand";
import { buildFreeEvaluationHref } from "@/components/PublicEvaluationCTA";

const FEATURED = [
  { slug: "allemagne-formation", name: "Allemagne", flag: "🇩🇪", label: "Cours de langue & Ausbildung", visualSlug: "allemagne" },
  { slug: "autriche-formation", name: "Autriche", flag: "🇦🇹", label: "Lehre & Red-White-Red Card", visualSlug: "autriche" },
  { slug: "suisse-formation", name: "Suisse", flag: "🇨🇭", label: "Formation professionnelle initiale", visualSlug: "suisse" },
];

function destinationHref(destination: Destination20) {
  return destination.existingPageUrl ?? `/procedures/${destination.slug}`;
}

function DestinationVisualCard({
  href,
  flag,
  name,
  label,
  visualSlug,
}: {
  href: string;
  flag: string;
  name: string;
  label: string;
  visualSlug: string;
}) {
  const visual = getDestinationVisual(visualSlug) ?? getServiceVisual("mobilite");
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <PremiumCoverImage
          visual={visual}
          className="h-full w-full"
          imgClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-lg leading-none shadow-sm" aria-hidden="true">
          {flag}
        </span>
      </div>
      <div className="p-5">
        <p className="font-black text-slate-950">{name}</p>
        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{label}</p>
      </div>
    </Link>
  );
}

export default function DestinationsHub() {
  const heroVisual = getServiceVisual("mobilite");

  useEffect(() => {
    setPageSeo({
      title: "Destinations d’accompagnement | 3M TRAVEL AGENCY",
      description:
        "Corridors internationaux 3M TRAVEL AGENCY : formation, emploi et mobilité — Allemagne, Autriche, Suisse, Canada et destinations ciblées, avec suivi traçable depuis Yaoundé et Ottawa.",
      image: heroVisual.desktop,
      imageAlt: heroVisual.alt,
    });
  }, [heroVisual.desktop, heroVisual.alt]);

  return (
    <PremiumAtmosphere washVisual={heroVisual} washOpacity={16}>
    <main className="premium-page-shell min-h-screen text-slate-900">
      <section className="relative overflow-hidden px-4 pb-14 pt-16 text-white sm:px-6 lg:px-8">
        <PremiumCoverImage
          visual={heroVisual}
          priority
          className="absolute inset-0"
          imgClassName="h-full w-full object-cover object-center opacity-90 brightness-105 saturate-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#061a36]/94 via-[#0a3264]/80 to-[#0e5b9f]/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#061a36]/70 via-transparent to-[#061a36]/30" />
        <div className="relative z-10 mx-auto max-w-5xl">
          <p className="font-[Georgia,Cambria,'Times_New_Roman',serif] text-3xl font-normal tracking-tight text-amber-200 sm:text-4xl">
            {INTERNATIONAL_BRAND.publicName}
          </p>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-blue-100/90">{INTERNATIONAL_BRAND.corridor}</p>
          <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">Destinations d’accompagnement, un suivi traçable</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50">
            Allemagne, Autriche, Suisse, Canada et d’autres corridors de formation et d’emploi : chaque profil est différent. 3M prépare et suit le dossier ; la destination se choisit selon votre secteur, votre langue et votre budget — pas selon un compteur de pays.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href={buildFreeEvaluationHref("etudes")} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-black text-blue-950 hover:bg-blue-50">
              {INTERNATIONAL_BRAND.cta.evaluate.fr} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/procedures" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/20">
              {INTERNATIONAL_BRAND.cta.procedures.fr}
            </Link>
          </div>
        </div>
      </section>

      <IllustrativeDestinationStrip
        title="Corridors en images"
        lead="Catalogue premium — Canada, Europe et Golfe — pour situer chaque destination avant de démarrer l’évaluation."
        className="border-b border-slate-200/60 bg-white/40"
      />

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <section>
          <h2 className="text-xl font-black text-slate-950">Formation en alternance rémunérée</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {FEATURED.map((item) => (
              <DestinationVisualCard
                key={item.slug}
                href={`/procedures/${item.slug}`}
                flag={item.flag}
                name={item.name}
                label={item.label}
                visualSlug={item.visualSlug}
              />
            ))}
          </div>
        </section>

        {REGION_ORDER.map((region) => {
          const items = DESTINATIONS_20.filter((destination) => destination.region === region);
          if (items.length === 0) return null;
          return (
            <section key={region} className="mt-10">
              <h2 className="text-xl font-black text-slate-950">{region}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((destination) => (
                  <DestinationVisualCard
                    key={destination.slug}
                    href={destinationHref(destination)}
                    flag={destination.flag}
                    name={destination.name}
                    label={destination.dispositif}
                    visualSlug={destination.slug}
                  />
                ))}
              </div>
            </section>
          );
        })}

        <section className="mt-12 overflow-hidden rounded-3xl border border-blue-900/20 bg-gradient-to-br from-[#061a36] via-[#0a3264] to-[#165dff] p-6 text-center text-white shadow-xl sm:p-10">
          <h2 className="text-2xl font-black">Vous ne savez pas quelle destination choisir ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
            Démarrez votre évaluation gratuite : nous comparons votre profil aux destinations réellement accompagnées pour vous orienter vers la plus réaliste — sans promesse d’admission ni de visa.
          </p>
          <Link href={buildFreeEvaluationHref("etudes")} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-black text-blue-950 hover:bg-blue-50">
            {INTERNATIONAL_BRAND.cta.evaluate.fr} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <p className="mx-auto mt-4 max-w-lg text-xs leading-5 text-blue-200/90">{INTERNATIONAL_BRAND.disclaimer.fr}</p>
        </section>
      </div>
      <ChecklistSection title="Ce qui compte pour choisir une destination" introduction="Six points à examiner avec votre conseiller avant de vous engager dans une procédure." items={DESTINATIONS_CRITERIA} tone="white" testId="destinations-criteria" />
      <FaqSection items={DESTINATIONS_FAQ} tone="slate" testId="destinations-faq" />
    </main>
    </PremiumAtmosphere>
  );
}
