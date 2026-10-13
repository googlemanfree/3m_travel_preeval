import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Download,
  ExternalLink,
  Filter,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { PDF_CATEGORIES, type PdfCategory, getLocalizedPdfUrl } from "@shared/pdfResources";
import {
  availableProjectLabels,
  countAllPdfResources,
  countCountryResourcePages,
  listCountryResourcePages,
  type CountryResourcePage,
} from "@shared/countryResourceCatalog";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDestinationVisual, getServiceVisual } from "@/data/premiumVisuals";
import { PremiumCoverImage } from "@/components/PremiumCoverImage";
import { setPageSeo } from "@/lib/pageSeo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function CountryResourceCard({ page, language }: { page: CountryResourcePage; language: "fr" | "en" }) {
  const visual = getDestinationVisual(page.visualSlug) ?? getServiceVisual("mobilite");
  const name = language === "en" && page.countryEn ? page.countryEn : page.country;
  const tracks = availableProjectLabels(page, language === "en" ? "en" : "fr");
  const cover = { ...visual, alt: `3M TRAVEL AGENCY — ${name}` };
  return (
    <Link
      href={page.path}
      className="group relative flex min-h-[240px] flex-col justify-end overflow-hidden text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
      data-testid={`resource-country-card-${page.slug}`}
    >
      <PremiumCoverImage
        visual={cover}
        className="absolute inset-0"
        imgClassName="h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#041428]/95 via-[#0a3264]/40 to-transparent" />
      <div className="relative z-10 p-5">
        <p className="text-2xl leading-none" aria-hidden="true">{page.flag}</p>
        <h3 className="mt-2 text-xl font-black tracking-tight">{name}</h3>
        <p className="mt-1 text-sm text-blue-100">
          {page.resources.length} guide{page.resources.length > 1 ? "s" : ""}
          {tracks.length ? ` · ${tracks.join(" · ")}` : ""}
        </p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-amber-200 transition group-hover:gap-2.5">
          Ouvrir la page pays <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}

export default function Ressources() {
  const { language } = useLanguage();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const heroVisual = getDestinationVisual("france") ?? getServiceVisual("mobilite");
  const totalPdfs = countAllPdfResources();
  const totalCountries = countCountryResourcePages();
  const countries = useMemo(() => listCountryResourcePages(), []);
  const countrySlugByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const page of countries) map.set(page.country, page.slug);
    return map;
  }, [countries]);

  useEffect(() => {
    setPageSeo({
      title: language === "en" ? "Resource library | 3M TRAVEL AGENCY" : "Bibliothèque de ressources | 3M TRAVEL AGENCY",
      description:
        language === "en"
          ? `${totalCountries} destination pages · ${totalPdfs} procedure sheets for work, study and visit — premium country guides by 3M TRAVEL AGENCY.`
          : `${totalCountries} pages destinations · ${totalPdfs} fiches travail, études et visite — bibliothèque pays premium 3M TRAVEL AGENCY.`,
      image: heroVisual.desktop,
      imageAlt: "3M TRAVEL AGENCY — bibliothèque de guides par destination",
    });
  }, [language, heroVisual.desktop, totalCountries, totalPdfs]);

  const filteredCountries = useMemo(() => {
    const q = search.toLowerCase().trim();
    return countries.filter((page) => {
      if (activeCategory && !page.categories.includes(activeCategory as CountryResourcePage["categories"][number])) {
        return false;
      }
      if (!q) return true;
      const haystack = `${page.country} ${page.countryEn || ""} ${page.resources.map((r) => r.title).join(" ")}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [countries, search, activeCategory]);

  const categoryHits = useMemo(() => {
    const q = search.toLowerCase().trim();
    return PDF_CATEGORIES.map((cat) => {
      let resources = cat.resources;
      if (activeCategory && cat.id !== activeCategory) return { ...cat, resources: [] as typeof cat.resources };
      if (q) {
        resources = resources.filter(
          (r) => r.title.toLowerCase().includes(q) || r.country.toLowerCase().includes(q),
        );
      }
      return { ...cat, resources };
    });
  }, [search, activeCategory]);

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#e8eef8_0%,_#f1f5f9_45%,_#e2e8f0_100%)] text-slate-900">
      <section className="relative min-h-[70vh] overflow-hidden px-4 pb-16 pt-20 text-white sm:min-h-[76vh] sm:px-6 sm:pb-20 lg:px-8">
        <PremiumCoverImage
          visual={{ ...heroVisual, alt: "3M TRAVEL AGENCY — guides par destination" }}
          priority
          className="absolute inset-0"
          imgClassName="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#041428]/93 via-[#0a3264]/74 to-[#0e5b9f]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#041428]/70 via-transparent to-[#041428]/30" />
        <div className="relative z-10 mx-auto flex min-h-[54vh] max-w-6xl flex-col justify-end sm:min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-[Georgia,Cambria,'Times_New_Roman',serif] text-3xl font-normal tracking-tight text-amber-200 sm:text-4xl lg:text-5xl">
              3M TRAVEL AGENCY
            </p>
            <h1 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl">
              {language === "en" ? "Guides by destination" : "Guides par destination"}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-blue-50/95 sm:text-lg">
              {language === "en"
                ? `${totalCountries} countries · ${totalPdfs} published sheets for work, study and visit — verify every requirement with the competent authorities.`
                : `${totalCountries} pays · ${totalPdfs} fiches publiées pour le travail, les études et la visite — chaque exigence reste à confirmer auprès des autorités compétentes.`}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#pays-ressources"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-blue-950 shadow-lg transition hover:bg-blue-50"
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                Parcourir les pays
              </a>
              <Link
                href="/?project=travail#evaluation-multi"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-amber-300/60 bg-amber-400/15 px-5 py-3 text-sm font-black text-amber-100 transition hover:bg-amber-400/25"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Évaluer mon profil
              </Link>
              <a
                href="https://wa.me/237698104832?text=Bonjour%2C%20j%27ai%20une%20question%20sur%20les%20guides%20pays."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-300/50 bg-emerald-500/15 px-5 py-3 text-sm font-bold text-emerald-50 transition hover:bg-emerald-500/25"
              >
                WhatsApp conseiller
              </a>
              <Link
                href="/guide-procedures"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
              >
                Guide des procédures PDF
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <Input
              aria-label={language === "en" ? "Search by country or visa type" : "Rechercher par pays ou type de visa"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={language === "en" ? "Search country, visa type..." : "Rechercher un pays, un type de visa…"}
              maxLength={200}
              className="h-10 rounded-xl border-slate-200 bg-slate-50 pl-9 pr-9 focus:bg-white"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                aria-label="Effacer"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Filter className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeCategory === null ? "bg-[#1E3A8A] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tout ({totalPdfs})
            </button>
            {PDF_CATEGORIES.map((cat: PdfCategory) => {
              const shortLabel =
                cat.id === "travail"
                  ? "Travail"
                  : cat.id === "etudes"
                    ? "Études"
                    : cat.id === "visiteur"
                      ? "Visite"
                      : cat.id === "guide"
                        ? "Guides"
                        : cat.id === "formulaire"
                          ? "Formulaires"
                          : cat.label;
              return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeCategory === cat.id ? "bg-blue-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {shortLabel} ({cat.resources.length})
              </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
        <section id="pays-ressources" aria-labelledby="pays-ressources-title">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="pays-ressources-title" className="text-2xl font-black text-slate-950">
                {language === "en" ? "Choose a destination" : "Choisissez une destination"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {filteredCountries.length} pays · pages dédiées avec images premium et tous les PDF associés
              </p>
            </div>
          </div>
          {filteredCountries.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCountries.map((page, index) => (
                <motion.div
                  key={page.slug}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-20px" }}
                  transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.35) }}
                >
                  <CountryResourceCard page={page} language={language} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Search className="mx-auto mb-4 h-12 w-12 text-slate-300" aria-hidden="true" />
              <p className="text-lg font-medium text-slate-500">Aucun pays trouvé</p>
              <Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setActiveCategory(null); }}>
                Réinitialiser
              </Button>
            </div>
          )}
        </section>

        <section aria-labelledby="liste-pdf-title" className="border-t border-slate-200/80 pt-10">
          <h2 id="liste-pdf-title" className="text-xl font-black text-slate-950">
            Liste complète des PDF
          </h2>
          <p className="mt-1 text-sm text-slate-600">Téléchargement direct — ou ouvrez la page pays pour le contexte complet.</p>
          <div className="mt-6 space-y-8">
            {categoryHits.map((cat) => {
              if (!cat.resources.length) return null;
              return (
                <div key={cat.id}>
                  <h3 className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-blue-800">{cat.label}</h3>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {cat.resources.map((resource) => {
                      const countrySlug = countrySlugByName.get(resource.country.split("/")[0].trim());
                      return (
                        <li key={resource.id} className="flex items-center justify-between gap-3 border-b border-slate-100 py-2.5">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              <span aria-hidden="true">{resource.flag} </span>
                              {language === "en" && resource.titleEn ? resource.titleEn : resource.title}
                            </p>
                            <p className="text-xs text-slate-500">{resource.country}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            {countrySlug ? (
                              <Link
                                href={`/ressources/${countrySlug}`}
                                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-blue-800 hover:bg-blue-50"
                              >
                                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                                Pays
                              </Link>
                            ) : null}
                            <a
                              href={getLocalizedPdfUrl(resource, language)}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-800 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-900"
                            >
                              <Download className="h-3 w-3" aria-hidden="true" />
                              PDF
                            </a>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
