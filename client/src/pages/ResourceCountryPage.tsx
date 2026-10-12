import { useEffect, useMemo } from "react";
import { Link, useRoute } from "wouter";
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
import { getCountryResourcePage } from "@shared/countryResourceCatalog";
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

  useEffect(() => {
    if (!page) return;
    const name = language === "en" && page.countryEn ? page.countryEn : page.country;
    setPageSeo({
      title: `Guides ${name} | 3M TRAVEL AGENCY`,
      description: `Fiches PDF travail, études et visite pour ${name} — bibliothèque 3M TRAVEL AGENCY, à vérifier auprès des autorités compétentes.`,
      image: visual.desktop,
      imageAlt: visual.alt,
    });
  }, [page, language, visual.desktop, visual.alt]);

  if (!page) return <NotFound />;

  const displayCountry = language === "en" && page.countryEn ? page.countryEn : page.country;
  const byCategory = page.categories.map((category) => ({
    category,
    meta: CATEGORY_META[category] ?? CATEGORY_META.guide,
    items: page.resources.filter((resource) => resource.category === category),
  }));

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden px-4 pb-16 pt-20 text-white sm:px-6 sm:pb-20 lg:px-8">
        <PremiumCoverImage
          visual={visual}
          priority
          className="absolute inset-0"
          imgClassName="h-full w-full object-cover object-center opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#061a36]/93 via-[#0a3264]/78 to-[#0e5b9f]/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#061a36]/75 via-transparent to-[#061a36]/30" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <Link
            href="/ressources"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-100 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Bibliothèque de ressources
          </Link>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-amber-200">
            3M TRAVEL AGENCY · {page.flag} {displayCountry}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Guides & procédures {displayCountry}
          </h1>
          <p className="mt-5 max-w-2xl rounded-2xl bg-[#020C3B]/35 px-4 py-3 text-base leading-7 text-white ring-1 ring-white/10 backdrop-blur-[2px] sm:text-lg">
            {page.resources.length} document{page.resources.length > 1 ? "s" : ""} publié{page.resources.length > 1 ? "s" : ""} pour préparer votre projet — sans promesse d’admission, d’emploi ou de visa.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={`/?project=travail&destination=${encodeURIComponent(page.slug)}#evaluation-multi`}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-blue-950 shadow-lg transition hover:bg-blue-50"
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
                Source officielle
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
        {byCategory.map(({ category, meta, items }) => {
          const Icon = meta.icon;
          return (
            <section key={category} aria-labelledby={`cat-${category}`}>
              <div className="mb-5 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 id={`cat-${category}`} className="text-xl font-black text-slate-950">
                    {meta.label}
                  </h2>
                  <p className="text-sm text-slate-600">{items.length} guide{items.length > 1 ? "s" : ""} téléchargeable{items.length > 1 ? "s" : ""}</p>
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
                      className="flex flex-col justify-between border-b border-slate-200 pb-4 pt-1"
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
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 transition hover:bg-slate-50"
                          >
                            Voir la fiche
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

        <section className="border-t border-slate-200 pt-10">
          <h2 className="text-xl font-black text-slate-950">Préparer votre prochaine action</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Les guides structurent votre dossier. L’évaluation 3M ordonne ensuite les informations selon votre profil réel.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/evaluation"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-800 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-900"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Ouvrir l’évaluation protégée
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
            >
              Contacter 3M TRAVEL AGENCY
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
