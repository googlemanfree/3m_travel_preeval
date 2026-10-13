import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { DESTINATIONS_20, REGION_ORDER, type Destination20 } from "@/data/destinations20";
import { getDestinationVisual, getServiceVisual } from "@/data/premiumVisuals";
import { PremiumCoverImage } from "@/components/PremiumCoverImage";
import { setPageSeo } from "@/lib/pageSeo";

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
  name,
  label,
  visualSlug,
}: {
  href: string;
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
      </div>
      <div className="p-5">
        <p className="font-semibold tracking-tight text-slate-950">{name}</p>
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
        "Formation professionnelle et emploi qualifié : 3M TRAVEL AGENCY prépare votre dossier et vous oriente vers la destination la plus réaliste — Allemagne, Autriche, Suisse et d’autres destinations ciblées.",
      image: heroVisual.desktop,
      imageAlt: heroVisual.alt,
    });
  }, [heroVisual.desktop, heroVisual.alt]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative flex min-h-[88svh] items-end overflow-hidden px-4 pb-16 pt-28 text-white sm:items-center sm:px-6 sm:pb-24 sm:pt-24 lg:px-8">
        <PremiumCoverImage
          visual={heroVisual}
          priority
          className="absolute inset-0"
          imgClassName="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#061018]/90 via-[#0a2748]/48 to-[#061018]/25 sm:bg-gradient-to-r sm:from-[#061018]/88 sm:via-[#0a2748]/50 sm:to-[#061018]/15" />
        <div className="relative z-10 mx-auto w-full max-w-5xl">
          <div className="max-w-xl sm:max-w-lg lg:max-w-xl">
            <h1 className="text-3xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-4xl md:text-5xl">
              3M TRAVEL AGENCY
            </h1>
            <p className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-amber-50 sm:text-3xl md:text-4xl">
              Destinations d’accompagnement — un suivi traçable
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-blue-50/95 sm:text-lg">
              Allemagne, Autriche, Suisse et parcours formation / emploi : 3M prépare et suit le dossier. La destination se choisit selon votre secteur, votre langue et votre budget.
            </p>
            <Link
              href="/evaluation?project=etudes"
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-500 px-7 py-3.5 text-base font-bold text-slate-950 shadow-lg transition hover:bg-amber-400"
            >
              Démarrer mon évaluation gratuite <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <section>
          <h2 className="text-xl font-black text-slate-950">Formation en alternance rémunérée</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {FEATURED.map((item) => (
              <DestinationVisualCard
                key={item.slug}
                href={`/procedures/${item.slug}`}
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
                    name={destination.name}
                    label={destination.dispositif}
                    visualSlug={destination.slug}
                  />
                ))}
              </div>
            </section>
          );
        })}

        <section className="mt-12 rounded-2xl bg-blue-900 p-6 text-center text-white sm:p-10">
          <h2 className="text-2xl font-black">Vous ne savez pas quelle destination choisir ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-blue-100">
            Démarrez votre évaluation gratuite : nous comparons votre profil aux destinations réellement accompagnées pour vous orienter vers la plus réaliste.
          </p>
          <Link href="/evaluation?project=etudes" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-black text-blue-950 hover:bg-blue-50">
            Démarrer mon évaluation gratuite <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </main>
  );
}
