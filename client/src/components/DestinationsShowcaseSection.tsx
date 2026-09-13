import { ArrowRight, Globe2 } from "lucide-react";

interface DestinationCard {
  href: string;
  flag: string;
  name: string;
  label: string;
  image?: string;
}

interface DestinationGroup {
  title: string;
  items: DestinationCard[];
}

const DESTINATION_GROUPS: DestinationGroup[] = [
  {
    title: "Europe francophone & germanophone",
    items: [
      { href: "/procedures/allemagne-formation", flag: "🇩🇪", name: "Allemagne", label: "Ausbildung dès B1", image: "/manus-storage/destination-germany_c58485b6.jpg" },
      { href: "/procedures/autriche-formation", flag: "🇦🇹", name: "Autriche", label: "Lehre & métiers en pénurie" },
      { href: "/procedures/suisse-formation", flag: "🇨🇭", name: "Suisse", label: "CFC reconnu à l'international", image: "/manus-storage/destination-switzerland_8e49fdb0.jpg" },
      { href: "/procedures/france", flag: "🇫🇷", name: "France", label: "Apprentissage & passeport talent", image: "/manus-storage/destination-france_dc1778e3.jpg" },
      { href: "/procedures/belgique", flag: "🇧🇪", name: "Belgique", label: "Permis unique multi-secteurs", image: "/manus-storage/destination-belgium_c2e1640d.jpg" },
      { href: "/procedures/luxembourg", flag: "🇱🇺", name: "Luxembourg", label: "Parmi les plus hauts salaires d'Europe", image: "/manus-storage/destination-luxembourg_9822a9b2.jpg" },
    ],
  },
  {
    title: "Europe (autres destinations)",
    items: [
      { href: "/procedures/pays-bas", flag: "🇳🇱", name: "Pays-Bas", label: "MBO & Highly Skilled Migrant" },
      { href: "/procedures/royaume-uni", flag: "🇬🇧", name: "Royaume-Uni", label: "Skilled Worker — santé & IT", image: "/manus-storage/destination-united-kingdom_f21f95c8.jpg" },
      { href: "/procedures/irlande", flag: "🇮🇪", name: "Irlande", label: "Critical Skills, voie vers la RP" },
      { href: "/procedures/portugal", flag: "🇵🇹", name: "Portugal", label: "Job Seeker Visa, 120 jours" },
      { href: "/procedures/espagne", flag: "🇪🇸", name: "Espagne", label: "Travail salarié ou arraigo" },
      { href: "/procedures/italie", flag: "🇮🇹", name: "Italie", label: "Decreto Flussi par quotas", image: "/manus-storage/destination-italy_3756968a.jpg" },
      { href: "/procedures/pologne", flag: "🇵🇱", name: "Pologne", label: "Procédure rapide, coût réduit" },
      { href: "/procedures/malte", flag: "🇲🇹", name: "Malte", label: "Anglophone — iGaming & IT" },
      { href: "/procedures/norvege", flag: "🇳🇴", name: "Norvège", label: "Métiers en tension, hauts salaires" },
    ],
  },
  {
    title: "Amérique & Océanie",
    items: [
      { href: "/canada", flag: "🇨🇦", name: "Canada", label: "Entrée express vers la résidence permanente", image: "/manus-storage/destination-canada_5e7dfbae.jpg" },
      { href: "/procedures/australie", flag: "🇦🇺", name: "Australie", label: "Skilled visas 189 / 190", image: "/manus-storage/destination-australia_8cc2aa45.jpg" },
      { href: "/procedures/nouvelle-zelande", flag: "🇳🇿", name: "Nouvelle-Zélande", label: "Accredited Employer Work Visa" },
    ],
  },
  {
    title: "Golfe & Asie",
    items: [
      { href: "/procedures/emirats", flag: "🇦🇪", name: "Émirats", label: "Golden Visa 10 ans" },
      { href: "/procedures/qatar", flag: "🇶🇦", name: "Qatar", label: "Visa sponsorisé, secteurs en essor" },
      { href: "/procedures/arabie-saoudite", flag: "🇸🇦", name: "Arabie Saoudite", label: "Vision 2030, grands projets" },
      { href: "/procedures/coree-du-sud", flag: "🇰🇷", name: "Corée du Sud", label: "Programme EPS (visa E-9)" },
      { href: "/procedures/japon", flag: "🇯🇵", name: "Japon", label: "TITP — industrie & soins" },
    ],
  },
];

function DestinationCardTile({ item }: { item: DestinationCard }) {
  return (
    <a
      href={item.href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-800 to-blue-950">
        {item.image ? (
          <img
            src={item.image}
            alt={`${item.name} — paysage représentatif`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-5xl opacity-90" aria-hidden="true">{item.flag}</span>
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-lg leading-none" aria-hidden="true">{item.flag}</span>
      </div>
      <div className="p-3">
        <p className="font-black text-slate-950">{item.name}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{item.label}</p>
      </div>
    </a>
  );
}

export default function DestinationsShowcaseSection() {
  return (
    <section aria-labelledby="destinations-showcase-title" className="bg-slate-50 px-4 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-blue-700">
            <Globe2 className="h-4 w-4" aria-hidden="true" /> 23 destinations, un seul accompagnement
          </p>
          <h2 id="destinations-showcase-title" className="mt-4 text-2xl font-black text-slate-950 md:text-3xl">Nos destinations</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600">
            Formation professionnelle rémunérée et emploi qualifié : chaque profil est différent, nous vous orientons vers la destination la plus réaliste selon votre secteur, votre niveau de langue et votre budget.
          </p>
        </div>

        {DESTINATION_GROUPS.map((group) => (
          <div key={group.title} className="mb-9 last:mb-0">
            <h3 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">{group.title}</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {group.items.map((item) => (
                <DestinationCardTile key={item.href} item={item} />
              ))}
            </div>
          </div>
        ))}

        <div className="mt-4 text-center">
          <p className="mb-4 text-base font-bold text-slate-800">Vous ne savez pas quelle destination choisir ?</p>
          <a
            href="/evaluation?project=etudes"
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-black text-white hover:bg-blue-800"
          >
            Démarrez votre évaluation gratuite <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
