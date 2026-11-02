import { useEffect, useMemo } from "react";
import { Link, useRoute } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Globe2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  availableProjectLabels,
  countryResourceLead,
  getCountryResourcePage,
  primaryEvalProjectForPage,
} from "@shared/countryResourceCatalog";
import { normalizePublicEvaluationProject } from "@shared/evaluationFormRequirements";
import { getLocalizedPdfUrl } from "@shared/pdfResources";
import { summarizePdfResource } from "@shared/publishedGuideSummaries";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDestinationVisual, getServiceVisual } from "@/data/premiumVisuals";
import { PremiumCoverImage } from "@/components/PremiumCoverImage";
import { setPageSeo } from "@/lib/pageSeo";
import NotFound from "./NotFound";

const CATEGORY_META: Record<string, { label: string; icon: typeof Briefcase }> = {
  travail: { label: "Visa travail", icon: Briefcase },
  etudes: { label: "Visa études", icon: GraduationCap },
  visiteur: { label: "Visa visiteur", icon: Globe2 },
  guide: { label: "Guides", icon: BookOpen },
  formulaire: { label: "Formulaires", icon: FileText },
};

export default function ResourceCountryPage() {
  const [, params] = useRoute<{ countrySlug: string }>("/ressources/:countrySlug");
  const { language } = useLanguage();
  const page = useMemo(
    () => (params?.countrySlug ? getCountryResourcePage(params.countrySlug) : null),
    [params?.countrySlug],
  );

  const visual = useMemo(() => {
    if (!page) return getServiceVisual("mobilite");
    return getDestinationVisual(page.visualSlug) ?? getServiceVisual("mobilite");
  }, [page]);

  const lead = useMemo(
    () => (page ? countryResourceLead(page, language === "en" ? "en" : "fr") : ""),
    [page, language],
  );

  useEffect(() => {
    if (!page) return;
    const name = language === "en" && page.countryEn ? page.countryEn : page.country;
    setPageSeo({
      title: `Guides ${name} | 3M TRAVEL AGENCY`,
      description: lead,
      image: visual.desktop,
      imageAlt: `3M TRAVEL AGENCY — ${name}`,
    });
  }, [page, language, visual.desktop, lead]);

  if (!page) return <NotFound />;

  const displayCountry = language === "en" && page.countryEn ? page.countryEn : page.country;
  const evalProject = normalizePublicEvaluationProject(primaryEvalProjectForPage(page)) ?? "travail";
  const projectLabels = availableProjectLabels(page, language === "en" ? "en" : "fr");
  const byCategory = page.categories.map((category) => ({
    category,
    meta: CATEGORY_META[category] ?? CATEGORY_META.guide,
    items: page.resources.filter((resource) => resource.category === category),
  }));
  const coverVisual = {
    ...visual,
    alt: `3M TRAVEL AGENCY — mobilité ${displayCountry}`,
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#e8eef8_0%,_#f1f5f9_45%,_#e2e8f0_100%)] text-slate-900">
      <section className="relative min-h-[72vh] overflow-hidden px-4 pb-16 pt-20 text-white sm:min-h-[78vh] sm:px-6 sm:pb-20 lg:px-8">
        <PremiumCoverImage
          visual={coverVisual}
          priority
          className="absolute inset-0"
          imgClassName="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#041428]/94 via-[#0a3264]/72 to-[#0e5b9f]/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#041428]/80 via-transparent to-[#041428]/35" />
        <div className="relative z-10 mx-auto flex min-h-[56vh] max-w-6xl flex-col justify-end sm:min-h-[62vh]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href="/ressources"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-100 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Bibliothèque de ressources
            </Link>
            <p className="mt-8 font-[Georgia,Cambria,'Times_New_Roman',serif] text-3xl font-normal tracking-tight text-amber-200 sm:text-4xl lg:text-5xl">
              3M TRAVEL AGENCY
            </p>
            <h1 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
              <span aria-hidden="true">{page.flag} </span>
              Guides {displayCountry}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-blue-50/95 sm:text-lg">{lead}</p>
            {projectLabels.length > 0 ? (
              <p className="mt-3 text-sm font-semibold text-amber-100/90">
                {language === "en" ? "Available tracks:" : "Parcours disponibles :"}{" "}
                {projectLabels.join(" · ")}
              </p>
            ) : null}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={`/?project=${evalProject}&destination=${encodeURIComponent(page.slug)}#evaluation-multi`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-blue-950 shadow-lg transition hover:bg-blue-50"
                data-testid="resource-country-eval-cta"
              >
                Évaluer mon profil {displayCountry}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              {page.procedurePaths[0] ? (
                <Link
                  href={page.procedurePaths[0]}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-amber-300/60 bg-amber-400/15 px-5 py-3 text-sm font-black text-amber-100 transition hover:bg-amber-400/25"
                >
                  Fiche procédure
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : null}
              {page.officialSources[0] ? (
                <a
                  href={page.officialSources[0].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  {page.officialSources[0].label || "Source officielle"}
                </a>
              ) : null}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
        {byCategory.map(({ category, meta, items }, sectionIndex) => {
          const Icon = meta.icon;
          return (
            <motion.section
              key={category}
              aria-labelledby={`cat-${category}`}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: Math.min(sectionIndex * 0.05, 0.2) }}
            >
              <div className="mb-5 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 id={`cat-${category}`} className="text-xl font-black text-slate-950">
                    {meta.label}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {items.length} guide{items.length > 1 ? "s" : ""} téléchargeable{items.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <ul className="grid gap-4 md:grid-cols-2">
                {items.map((resource) => {
                  const summary = summarizePdfResource({
                    country: resource.country,
                    category: resource.category,
                    title: resource.title,
                    url: getLocalizedPdfUrl(resource, language),
                  });
                  const title = language === "en" && resource.titleEn ? resource.titleEn : resource.title;
                  return (
                    <li
                      key={resource.id}
                      className="flex flex-col justify-between border-b border-slate-200/80 pb-4 pt-1"
                      data-testid={`resource-country-item-${resource.id}`}
                    >
                      <div>
                        <h3 className="text-base font-black text-slate-950">{title}</h3>
                        {summary?.overview ? (
                          <p className="mt-2 text-sm leading-6 text-slate-600">{summary.overview}</p>
                        ) : (
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            Fiche 3M TRAVEL AGENCY à croiser avec les exigences officielles en vigueur.
                          </p>
                        )}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <a
                          href={getLocalizedPdfUrl(resource, language)}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-800 px-4 py-2 text-xs font-black text-white transition hover:bg-blue-900"
                        >
                          <Download className="h-3.5 w-3.5" aria-hidden="true" />
                          Télécharger le PDF
                        </a>
                        {resource.procedurePath ? (
                          <Link
                            href={resource.procedurePath}
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-4 py-2 text-xs font-bold text-slate-800 transition hover:bg-white"
                          >
                            Voir la fiche
                          </Link>
                        ) : null}
                        {summary?.officialPortalUrl ? (
                          <a
                            href={summary.officialPortalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-2 text-xs font-bold text-emerald-900 transition hover:bg-emerald-50"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                            {summary.officialPortalLabel || "Portail officiel"}
                          </a>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </motion.section>
          );
        })}

        <section className="border-t border-slate-200/80 pt-10">
          <h2 className="text-xl font-black text-slate-950">Préparer votre prochaine action</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Les guides structurent votre dossier. L’évaluation 3M ordonne ensuite les informations selon votre profil réel.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/?project=${evalProject}&destination=${encodeURIComponent(page.slug)}#evaluation-multi`}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-800 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-900"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Ouvrir l’évaluation protégée
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-white"
            >
              Contacter 3M TRAVEL AGENCY
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
