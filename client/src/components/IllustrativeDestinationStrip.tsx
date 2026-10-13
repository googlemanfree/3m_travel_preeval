import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PremiumCoverImage } from "@/components/PremiumCoverImage";
import { getDestinationVisual, getServiceVisual } from "@/data/premiumVisuals";

export type StripDestination = {
  slug: string;
  flag: string;
  label: string;
  href: string;
};

const DEFAULT_STRIP: StripDestination[] = [
  { slug: "canada", flag: "🇨🇦", label: "Canada", href: "/canada" },
  { slug: "france", flag: "🇫🇷", label: "France", href: "/etudes" },
  { slug: "allemagne", flag: "🇩🇪", label: "Allemagne", href: "/travail" },
  { slug: "luxembourg", flag: "🇱🇺", label: "Luxembourg", href: "/procedures/luxembourg" },
  { slug: "emirats", flag: "🇦🇪", label: "Émirats", href: "/ressources/emirats" },
  { slug: "qatar", flag: "🇶🇦", label: "Qatar", href: "/procedures/qatar-travail" },
];

type Props = {
  title?: string;
  lead?: string;
  destinations?: StripDestination[];
  className?: string;
};

/** Bande illustrée de destinations premium — images réelles du catalogue. */
export function IllustrativeDestinationStrip({
  title = "Destinations en images",
  lead = "Visuels premium issus du catalogue 3M — pour situer l’ambiance de chaque corridor.",
  destinations = DEFAULT_STRIP,
  className = "",
}: Props) {
  return (
    <section
      className={`px-4 py-12 sm:px-6 lg:px-8 ${className}`}
      aria-labelledby="illustrative-strip-title"
      data-testid="illustrative-destination-strip"
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 id="illustrative-strip-title" className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{lead}</p>
        </div>
        <ul className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((item, index) => {
            const visual = getDestinationVisual(item.slug) ?? getServiceVisual("mobilite");
            return (
              <motion.li
                key={item.slug}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.24) }}
              >
                <Link
                  href={item.href}
                  className="group relative flex min-h-[160px] flex-col justify-end overflow-hidden text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                  data-testid={`illustrative-strip-${item.slug}`}
                >
                  <PremiumCoverImage
                    visual={{ ...visual, alt: `3M TRAVEL AGENCY — ${item.label}` }}
                    className="absolute inset-0"
                    imgClassName="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#041428]/92 via-[#0a3264]/35 to-transparent" />
                  <div className="relative z-10 p-4">
                    <p className="text-xl leading-none" aria-hidden="true">
                      {item.flag}
                    </p>
                    <p className="mt-2 text-lg font-black tracking-tight">{item.label}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.12em] text-amber-200">
                      Explorer <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
