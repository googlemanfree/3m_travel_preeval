import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Globe2,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLocalizedPdfUrl } from "@shared/pdfResources";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PDF_CATEGORIES } from "@shared/pdfResources";
import { filterProcedureResources, getAllProcedureResources, getProcedureGuideUrl } from "@shared/procedureGuide";
import {
  FEATURED_GUIDE_COUNTRIES,
  countResourcesByCategory,
  featuredResourcesForCountry,
  getEnrichedProcedureResources,
  type EnrichedProcedureResource,
} from "@shared/procedureGuideEnrichment";
import { summarizePdfResource } from "@shared/publishedGuideSummaries";
import { PublishedGuideSummaryPanel } from "@/components/PublishedGuideSummaryPanel";

const CATEGORY_FILTERS = [
  { id: "all", label: "Tout" },
  { id: "travail", label: "Travail" },
  { id: "etudes", label: "Études" },
  { id: "visiteur", label: "Visiteur" },
  { id: "guide", label: "Guides" },
  { id: "formulaire", label: "Formulaires" },
] as const;

function ResourceCard({
  resource,
  language,
  expanded = false,
}: {
  resource: EnrichedProcedureResource;
  language: "fr" | "en";
  expanded?: boolean;
}) {
  const summary = summarizePdfResource({
    country: resource.country,
    category: resource.category,
    title: resource.title,
    url: getLocalizedPdfUrl(resource, language),
  });
  return (
    <article
      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:bg-blue-50/40"
      data-testid={`guide-resource-${resource.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900">{resource.title}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {resource.flag} {resource.country} · {resource.type.toUpperCase()} · {resource.category}
            </p>
          </div>
        </div>
        <a
          href={getLocalizedPdfUrl(resource, language)}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-900"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          PDF
        </a>
      </div>
      {expanded && summary ? (
        <PublishedGuideSummaryPanel
          tone="public"
          testId={`guide-summary-${resource.id}`}
          headline={summary.headline}
          overview={summary.overview}
          stepHighlights={summary.stepHighlights}
          programLabel={summary.visaLabel}
          pdfUrl={summary.pdfUrl}
          pdfTitle={summary.pdfTitle}
          officialPortalUrl={summary.officialPortalUrl}
          officialPortalLabel={summary.officialPortalLabel}
        />
      ) : summary?.overview ? (
        <p className="line-clamp-2 text-xs leading-5 text-slate-600" data-testid={`guide-summary-teaser-${resource.id}`}>
          {summary.overview}
        </p>
      ) : null}
      {(resource.procedurePath || resource.officialSources.length > 0) && (
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3 text-[11px] font-semibold">
          {resource.procedurePath ? (
            <a
              href={resource.procedurePath}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 hover:border-blue-300 hover:text-blue-800"
            >
              Fiche procédure <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          ) : null}
          {resource.officialSources[0] ? (
            <a
              href={resource.officialSources[0].url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-900 hover:border-emerald-300"
              title={resource.officialSources.map((source) => source.label).join(" · ")}
            >
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              Portail officiel
            </a>
          ) : null}
          {resource.verificationStatus === "verified" ? (
            <span className="inline-flex items-center rounded-full border border-emerald-100 bg-white px-2.5 py-1 text-emerald-800">
              Source vérifiée
            </span>
          ) : null}
        </div>
      )}
    </article>
  );
}

export default function ProcedureResourceGuide() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<(typeof CATEGORY_FILTERS)[number]["id"]>("all");
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const query = searchQuery.trim().toLowerCase();
  const shareUrl = typeof window !== "undefined" ? getProcedureGuideUrl(window.location.origin) : "/guide-procedures";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("q")?.trim();
    if (fromUrl) setSearchQuery(fromUrl);
  }, []);

  const enriched = useMemo(() => getEnrichedProcedureResources(), []);
  const categoryCounts = useMemo(() => countResourcesByCategory(), []);
  const canadaFeatured = useMemo(() => featuredResourcesForCountry("Canada"), []);
  const luxembourgFeatured = useMemo(() => featuredResourcesForCountry("Luxembourg"), []);

  const filteredResourceIds = useMemo(
    () => new Set(filterProcedureResources(query).map((resource) => resource.id)),
    [query],
  );

  const visibleResources = useMemo(() => {
    return enriched.filter((resource) => {
      if (!filteredResourceIds.has(resource.id)) return false;
      if (categoryFilter !== "all" && resource.category !== categoryFilter) return false;
      if (countryFilter) {
        const key = resource.country
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
        const wanted = countryFilter
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
        if (!key.includes(wanted)) return false;
      }
      return true;
    });
  }, [enriched, filteredResourceIds, categoryFilter, countryFilter]);

  const filteredCategories = useMemo(
    () =>
      PDF_CATEGORIES.map((category) => ({
        ...category,
        resources: visibleResources.filter((resource) => resource.category === category.id),
      })).filter((category) => category.resources.length > 0),
    [visibleResources],
  );

  const totalResources = visibleResources.length;
  const allResources = getAllProcedureResources().length;

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const shareGuide = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Guides & procédures 3M TRAVEL AGENCY",
        text: "Retrouvez les procédures et ressources PDF 3M TRAVEL AGENCY.",
        url: shareUrl,
      });
      return;
    }
    await copyShareLink();
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef4ff_0%,#f8fafc_28%,#ffffff_100%)] text-slate-900">
      <header className="bg-gradient-to-br from-[#0b1f4d] via-[#153a8a] to-[#1d4ed8] px-4 py-14 text-white md:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            3M TRAVEL AGENCY · Guide des procédures
          </p>
          <h1 className="max-w-3xl font-[Sora,ui-sans-serif] text-3xl font-black tracking-tight md:text-5xl">
            Bibliothèque PDF des procédures de mobilité
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-blue-50 md:text-lg">
            Même source que le traitement administrateur et l’espace client : chaque guide publié
            (travail, études, visiteur) est rattaché à sa fiche procédure et aux portails officiels
            à vérifier avant toute démarche.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button onClick={copyShareLink} className="rounded-xl bg-white text-blue-900 hover:bg-blue-50">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Lien copié" : "Copier le lien client"}
            </Button>
            <Button
              onClick={shareGuide}
              variant="outline"
              className="rounded-xl border-white/40 bg-white/10 text-white hover:bg-white/20"
            >
              <Share2 className="h-4 w-4" /> Partager le guide
            </Button>
            <a
              href="/procedures"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/30 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Explorer les fiches pays
              <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href="/sources-officielles"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/30 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Sources officielles
              <ShieldCheck className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-blue-50">
            <span className="rounded-full bg-white/10 px-3 py-1.5">{allResources} ressources cataloguées</span>
            <span className="rounded-full bg-white/10 px-3 py-1.5">
              {categoryCounts.travail || 0} travail · {categoryCounts.etudes || 0} études · {categoryCounts.visiteur || 0} visiteur
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1.5">Accès public · synchronisé admin / client</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <section
          className="mb-8 overflow-hidden rounded-3xl border border-red-100 bg-gradient-to-br from-rose-50 via-white to-sky-50 p-5 shadow-sm md:p-6"
          data-testid="guide-featured-canada"
          aria-labelledby="guide-canada-title"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-700">À la une · Canada</p>
              <h2 id="guide-canada-title" className="mt-1 font-[Sora,ui-sans-serif] text-xl font-bold text-slate-950 md:text-2xl">
                Guides PDF Canada (travail & études)
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
                Référence pour le traitement administrateur et le parcours client : les étapes IRCC / EIMT
                suivent ces documents publiés, avec contrôle sur les portails officiels.
              </p>
            </div>
            <a
              href="/procedures/canada-travail"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Fiche Canada travail <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {canadaFeatured.map((resource) => (
              <ResourceCard key={`featured-${resource.id}`} resource={resource} language={language} expanded />
            ))}
          </div>
        </section>

        <section
          className="mb-8 overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-5 shadow-sm md:p-6"
          data-testid="guide-featured-luxembourg"
          aria-labelledby="guide-luxembourg-title"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-800">Corridor prioritaire · Luxembourg</p>
              <h2 id="guide-luxembourg-title" className="mt-1 font-[Sora,ui-sans-serif] text-xl font-bold text-slate-950 md:text-2xl">
                Guides PDF Luxembourg (travail, études, visiteur)
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
                Traitement aligné sur Guichet.lu et ADEM : autorisation de séjour salarié / étudiant,
                déclaration de poste et dépôt visa D — synchronisés admin et espace client.
              </p>
            </div>
            <a
              href="/procedures/luxembourg-travail"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Fiche Luxembourg travail <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {luxembourgFeatured.map((resource) => (
              <ResourceCard key={`featured-lux-${resource.id}`} resource={resource} language={language} expanded />
            ))}
          </div>
        </section>

        <div className="sticky top-0 z-10 mb-6 space-y-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
          <label htmlFor="guide-search" className="sr-only">
            Rechercher une procédure ou une ressource
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <Input
              id="guide-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Rechercher un pays, un visa ou un guide PDF…"
              maxLength={200}
              className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrer par catégorie">
            {CATEGORY_FILTERS.map((filter) => {
              const active = categoryFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCategoryFilter(filter.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    active
                      ? "border-blue-800 bg-blue-800 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
                  }`}
                >
                  {filter.label}
                  {filter.id !== "all" ? ` (${categoryCounts[filter.id] || 0})` : ""}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Filtrer par destination vedette">
            <button
              type="button"
              onClick={() => setCountryFilter(null)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                !countryFilter ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <Globe2 className="h-3.5 w-3.5" aria-hidden="true" /> Toutes destinations
            </button>
            {FEATURED_GUIDE_COUNTRIES.map((country) => {
              const active = countryFilter === country;
              return (
                <button
                  key={country}
                  type="button"
                  onClick={() => setCountryFilter(active ? null : country)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    active
                      ? "border-blue-700 bg-blue-700 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
                  }`}
                >
                  {country}
                </button>
              );
            })}
          </div>
          <p className="px-1 text-xs text-slate-500">
            {totalResources} ressource(s) affichée(s) sur {allResources}.
          </p>
        </div>

        <div className="space-y-6">
          {filteredCategories.map((category) => (
            <section key={category.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4 md:px-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.resources[0]?.flag || "🌍"}</span>
                  <div>
                    <h2 className="font-bold text-slate-900">{category.label}</h2>
                    <p className="text-xs text-slate-500">{category.resources.length} ressource(s)</p>
                  </div>
                </div>
                <Sparkles className="h-5 w-5 text-blue-700" aria-hidden="true" />
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-2 md:p-6">
                {category.resources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource as EnrichedProcedureResource} language={language} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
            <p className="mt-3 font-semibold text-slate-700">Aucune ressource ne correspond à votre recherche.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("all");
                setCountryFilter(null);
              }}
              className="mt-3 text-sm font-semibold text-blue-700 underline underline-offset-4"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-sm leading-6 text-blue-950 md:p-6">
            <strong>Besoin d’une orientation personnalisée ?</strong> Posez votre question à Aureol depuis
            l’accueil ou utilisez WhatsApp pour être accompagné par un conseiller.
          </div>
          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 text-sm leading-6 text-amber-950 md:p-6">
            <strong>Vérification obligatoire.</strong> Les PDF 3M sont des guides de préparation. Les
            exigences exactes, délais et décisions relèvent des autorités compétentes (IRCC, ADEM,
            France-Visas, etc.) — consultez toujours le portail officiel lié à chaque ressource.
          </div>
        </div>
      </main>
    </div>
  );
}
