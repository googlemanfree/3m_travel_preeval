import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Info, MessageSquareQuote } from "lucide-react";
import { ILLUSTRATIVE_MOBILITY_STORIES } from "@/data/illustrativeMobilityStories";
import { useLanguage } from "@/contexts/LanguageContext";

type Props = {
  className?: string;
  /** Limite d’affichage (défaut : tous) */
  limit?: number;
};

/**
 * Exemples illustratifs — personnages fictifs.
 * Séparé des avis clients approuvés ; jamais présenté comme preuve de résultat.
 */
export default function IllustrativeMobilityStories({ className = "", limit }: Props) {
  const { language } = useLanguage();
  const stories = typeof limit === "number" ? ILLUSTRATIVE_MOBILITY_STORIES.slice(0, limit) : ILLUSTRATIVE_MOBILITY_STORIES;
  const isEn = language === "en";

  return (
    <section
      className={`px-4 py-14 sm:px-6 ${className}`}
      aria-labelledby="illustrative-stories-title"
      data-testid="illustrative-mobility-stories"
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-amber-950">
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            {isEn ? "Illustrative examples — fictional personas" : "Exemples illustratifs — personnages fictifs"}
          </p>
          <h2 id="illustrative-stories-title" className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {isEn ? "How candidates typically describe the process" : "Comment les candidats décrivent souvent le parcours"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {isEn
              ? "These quotes are writing samples with African names (Cameroon, Côte d’Ivoire, Senegal…). They are not real client testimonials and do not claim any visa, job or admission result."
              : "Ces citations sont des exemples de rédaction avec des prénoms d’Afrique centrale et de l’Ouest (Cameroun, Côte d’Ivoire, Sénégal…). Ce ne sont pas de vrais avis clients et elles n’attribuent aucun résultat de visa, d’emploi ou d’admission."}
          </p>
        </div>

        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story, index) => (
            <motion.li
              key={story.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-24px" }}
              transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.24) }}
              className="flex flex-col border-b border-slate-200/90 pb-5"
              data-testid={`illustrative-story-${story.id}`}
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg"
                  aria-hidden="true"
                >
                  {story.flag}
                </span>
                <div className="min-w-0">
                  <p className="font-black text-slate-950">{story.displayName}</p>
                  <p className="text-xs font-semibold text-slate-500">
                    {story.cityOrigin}, {story.countryOrigin}
                    <span className="mx-1.5 text-slate-300" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-amber-800">{isEn ? "Fictional" : "Fictif"}</span>
                  </p>
                </div>
              </div>
              <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-slate-700">
                <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
                <span>{isEn ? story.quoteEn : story.quoteFr}</span>
              </p>
              <Link
                href={story.projectHref}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.12em] text-blue-800 hover:text-blue-950"
              >
                {story.projectLabel}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </motion.li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-200/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            {isEn
              ? "Looking for verified feedback? Only moderated reviews appear on the reviews page."
              : "Vous cherchez des retours vérifiés ? Seuls les avis modérés apparaissent sur la page Avis."}
          </p>
          <Link
            href="/avis"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-800 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-900"
            data-testid="illustrative-stories-avis-cta"
          >
            {isEn ? "See approved reviews" : "Voir les avis approuvés"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
