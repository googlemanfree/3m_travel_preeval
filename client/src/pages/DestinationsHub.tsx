import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { DESTINATIONS_20, REGION_ORDER, type Destination20 } from "@/data/destinations20";

const FEATURED = [
  { slug: "allemagne-formation", name: "Allemagne", flag: "🇩🇪", label: "Cours de langue & Ausbildung" },
  { slug: "autriche-formation", name: "Autriche", flag: "🇦🇹", label: "Lehre & Red-White-Red Card" },
  { slug: "suisse-formation", name: "Suisse", flag: "🇨🇭", label: "Formation professionnelle initiale" },
];

function destinationHref(destination: Destination20) {
  return destination.existingPageUrl ?? `/procedures/${destination.slug}`;
}

export default function DestinationsHub() {
  useEffect(() => {
    document.title = "23 destinations, un seul accompagnement | 3M Travel & Services";
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute(
      "content",
      "Formation professionnelle et emploi qualifié dans 23 destinations : Allemagne, Autriche, Suisse et 20 autres pays. 3M Travel & Services vous oriente vers la destination la plus réaliste selon votre profil.",
    );
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-[radial-gradient(circle_at_85%_15%,rgba(96,165,250,.45),transparent_28%),linear-gradient(125deg,#061a36,#0a3264_55%,#0e5b9f)] px-4 pb-14 pt-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-black uppercase tracking-[.18em] text-blue-100">Réseau de destinations</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">23 destinations, un seul accompagnement</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-50">
            3M Travel &amp; Services élargit son réseau à 20 nouvelles destinations en formation professionnelle et emploi qualifié, en plus de l'Allemagne, l'Autriche et la Suisse déjà couvertes. Chaque profil est différent : notre rôle est de vous orienter vers la destination la plus réaliste selon votre secteur, votre niveau de langue et votre budget.
          </p>
          <Link href="/evaluation?project=etudes" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-black text-blue-950 hover:bg-blue-50">
            Démarrer mon évaluation gratuite <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <section>
          <h2 className="text-xl font-black text-slate-950">Formation en alternance rémunérée</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {FEATURED.map((item) => (
              <Link
                key={item.slug}
                href={`/procedures/${item.slug}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="text-3xl" aria-hidden="true">{item.flag}</span>
                <p className="mt-3 font-black text-slate-950">{item.name}</p>
                <p className="mt-1 text-sm text-slate-600">{item.label}</p>
              </Link>
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
                  <Link
                    key={destination.slug}
                    href={destinationHref(destination)}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <span className="text-3xl" aria-hidden="true">{destination.flag}</span>
                    <p className="mt-3 font-black text-slate-950">{destination.name}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{destination.dispositif}</p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        <section className="mt-12 rounded-2xl bg-blue-900 p-6 text-center text-white sm:p-10">
          <h2 className="text-2xl font-black">Vous ne savez pas quelle destination choisir ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-blue-100">
            Démarrez votre évaluation gratuite : nous comparons votre profil aux 23 destinations pour vous orienter vers la plus réaliste.
          </p>
          <Link href="/evaluation?project=etudes" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-black text-blue-950 hover:bg-blue-50">
            Démarrer mon évaluation gratuite <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </main>
  );
}
