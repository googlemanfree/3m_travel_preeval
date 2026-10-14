import { ArrowRight, Briefcase, GraduationCap, Plane } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { buildFreeEvaluationHref } from "@/components/PublicEvaluationCTA";

const PRIMARY_PATHS = [
  {
    id: "etudes",
    icon: GraduationCap,
    title: { fr: "Études", en: "Studies" },
    lead: {
      fr: "Admission, fonds et visa d’études — dossier structuré avec un conseiller.",
      en: "Admission, funds and study visa — a structured file with an advisor.",
    },
    href: "/etudes",
    cta: { fr: "Voir le parcours études", en: "See the studies path" },
    evalHref: buildFreeEvaluationHref("etudes"),
    accent: "from-[#0b3a6e] to-[#1d4ed8]",
  },
  {
    id: "travail",
    icon: Briefcase,
    title: { fr: "Travail", en: "Work" },
    lead: {
      fr: "Profil, partenaires autorisés et autorisations — sans promesse d’emploi.",
      en: "Profile, authorised partners and permits — no job promise.",
    },
    href: "/travail",
    cta: { fr: "Voir le parcours travail", en: "See the work path" },
    evalHref: buildFreeEvaluationHref("travail"),
    accent: "from-[#0f4c3a] to-[#059669]",
  },
  {
    id: "voyage-visa",
    icon: Plane,
    title: { fr: "Voyage / visa", en: "Travel / visa" },
    lead: {
      fr: "Visite, e-Visa ou court séjour : checklist, dépôt guidé et vols si besoin.",
      en: "Visit, e-Visa or short stay: checklist, guided filing and flights if needed.",
    },
    href: "/procedures",
    cta: { fr: "Explorer visas & destinations", en: "Browse visas & destinations" },
    evalHref: buildFreeEvaluationHref("tourisme"),
    accent: "from-[#7c2d12] to-[#c2410c]",
  },
] as const;

/** Trois choix prioritaires en tête d’accueil — le reste des services vient plus bas. */
export default function HomePrimaryPathsSection() {
  const { language, t } = useLanguage();
  const lang = language === "en" ? "en" : "fr";

  return (
    <section
      aria-labelledby="home-primary-paths-title"
      className="bg-gradient-to-b from-slate-50 to-white pb-4 pt-10 md:pt-12"
      data-testid="home-primary-paths"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 text-center md:mb-8">
          <h2 id="home-primary-paths-title" className="text-2xl font-black text-slate-950 md:text-3xl">
            {t("Par où commencer ?", "Where do you start?")}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
            {t(
              "Trois parcours clairs. Choisissez le vôtre — les autres services (vols, assurance, CNI…) sont plus bas.",
              "Three clear paths. Pick yours — other services (flights, insurance, ID…) come further down.",
            )}
          </p>
        </div>
        <ul className="grid gap-4 md:grid-cols-3">
          {PRIMARY_PATHS.map((path) => (
            <li key={path.id}>
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className={`bg-gradient-to-br ${path.accent} px-5 py-5 text-white`}>
                  <path.icon className="h-8 w-8 opacity-90" aria-hidden="true" />
                  <h3 className="mt-3 text-2xl font-black tracking-tight">{path.title[lang]}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/90">{path.lead[lang]}</p>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <a
                    href={path.href}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  >
                    {path.cta[lang]}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                  <a
                    href={path.evalHref}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    {t("Évaluer mon projet — gratuit", "Assess my project — free")}
                  </a>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
