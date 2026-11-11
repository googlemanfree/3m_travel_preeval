import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Globe2,
  MapPin,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  SEARCH_COUNTRIES,
  SEARCH_SERVICE_TYPES,
  SEARCH_VISA_TYPES,
  searchInternalSite,
} from "@/lib/globalSearchIndex";

const FRENCH_MARKERS = [
  "visa",
  "travail",
  "études",
  "etudes",
  "pays",
  "recherche",
  "france",
  "canada",
];
const ENGLISH_MARKERS = [
  "visa",
  "work",
  "study",
  "country",
  "search",
  "france",
  "canada",
  "passport",
];

function detectLanguage(query: string): "fr" | "en" {
  const folded = query
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const frenchScore = FRENCH_MARKERS.filter(marker =>
    folded.includes(marker.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
  ).length;
  const englishScore = ENGLISH_MARKERS.filter(marker =>
    folded.includes(marker)
  ).length;
  if (englishScore > frenchScore) return "en";
  if (frenchScore > 0) return "fr";
  return typeof navigator !== "undefined" &&
    navigator.language.toLowerCase().startsWith("en")
    ? "en"
    : "fr";
}

const copy = {
  fr: {
    eyebrow: "Recherche 3M Travel",
    title: "Trouvez une destination, une procédure ou une information",
    intro:
      "Les résultats 3M sont présentés en premier. Les résultats web publics sont séparés et doivent être vérifiés auprès de l’autorité compétente.",
    placeholder: "Canada, visa travail, études, passport…",
    submit: "Rechercher",
    filters: "Filtres avancés",
    country: "Pays",
    visa: "Type de visa",
    service: "Catégorie de service",
    all: "Tous",
    internal: "Résultats vérifiés dans notre site",
    web: "Informations à vérifier",
    loading: "Recherche web en cours…",
    noInternal: "Aucun contenu interne ne correspond à ces critères.",
    noWeb: "Aucun résultat web public trouvé pour cette recherche.",
    webUnavailable:
      "La recherche web est temporairement indisponible. Les résultats 3M restent accessibles.",
    source: "Source : Wikipédia · vérifier la source officielle",
    hint: "Les conditions de visa, d’admission, d’emploi et de séjour changent.",
    detected: "Langue détectée",
  },
  en: {
    eyebrow: "3M Travel search",
    title: "Find a destination, procedure or information",
    intro:
      "3M results appear first. Public web results are separated and must be checked with the competent authority.",
    placeholder: "Canada, work visa, study, passport…",
    submit: "Search",
    filters: "Advanced filters",
    country: "Country",
    visa: "Visa type",
    service: "Service category",
    all: "All",
    internal: "Verified results on our site",
    web: "Information to verify",
    loading: "Searching the web…",
    noInternal: "No internal content matches these filters.",
    noWeb: "No public web result was found for this search.",
    webUnavailable:
      "Web search is temporarily unavailable. 3M results remain available.",
    source: "Source: Wikipedia · verify the official source",
    hint: "Visa, admission, employment and stay rules change.",
    detected: "Detected language",
  },
};

export default function GlobalSearch() {
  const [location, navigate] = useLocation();
  const readQuery = () =>
    new URLSearchParams(window.location.search).get("q") ?? "";
  const [query, setQuery] = useState(readQuery);
  const [country, setCountry] = useState("");
  const [visaType, setVisaType] = useState("");
  const [serviceType, setServiceType] = useState("");
  const normalizedQuery = query.trim();
  const language = useMemo(
    () => detectLanguage(normalizedQuery),
    [normalizedQuery]
  );
  const text = copy[language];
  const filters = useMemo(
    () => ({
      country: country || undefined,
      visaType: visaType || undefined,
      serviceType: serviceType || undefined,
    }),
    [country, visaType, serviceType]
  );
  const hasCriteria =
    normalizedQuery.length >= 2 || Object.values(filters).some(Boolean);
  const internalResults = useMemo(
    () => searchInternalSite(normalizedQuery, 20, filters),
    [normalizedQuery, filters]
  );
  const webSearch = trpc.globalSearch.web.useQuery(
    { query: normalizedQuery, language },
    { enabled: normalizedQuery.length >= 2, staleTime: 60_000, retry: false }
  );

  useEffect(() => {
    setQuery(readQuery());
  }, [location]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = query.trim();
    if (next) navigate(`/search?q=${encodeURIComponent(next)}`);
  };

  return (
    <main className="min-h-[70vh] bg-gradient-to-b from-slate-50 via-white to-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-800">
                {text.eyebrow}
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {text.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {text.intro}
              </p>
            </div>
            <div
              className="rounded-2xl bg-blue-50 p-3 text-blue-800"
              aria-hidden="true"
            >
              <Globe2 className="h-7 w-7" />
            </div>
          </div>
          <form
            onSubmit={submit}
            className="mt-6 flex flex-col gap-2 sm:flex-row"
            role="search"
          >
            <label htmlFor="global-search-input" className="sr-only">
              {text.title}
            </label>
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-700"
                aria-hidden="true"
              />
              <Input
                id="global-search-input"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder={text.placeholder}
                className="h-12 rounded-xl border-blue-100 bg-slate-50 pl-10 text-base"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              className="h-12 rounded-xl bg-blue-800 px-6 font-bold hover:bg-blue-900"
            >
              {text.submit}
            </Button>
          </form>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-800">
              {text.detected}: {language === "fr" ? "Français" : "English"}
            </span>
          </div>
          <details
            className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3"
            open={hasCriteria}
          >
            <summary className="cursor-pointer text-sm font-bold text-slate-800">
              {text.filters}
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-bold text-slate-600">
                {text.country}
                <select
                  value={country}
                  onChange={event => setCountry(event.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800"
                >
                  <option value="">{text.all}</option>
                  {SEARCH_COUNTRIES.map(item => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold text-slate-600">
                {text.visa}
                <select
                  value={visaType}
                  onChange={event => setVisaType(event.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800"
                >
                  <option value="">{text.all}</option>
                  {SEARCH_VISA_TYPES.map(item => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold text-slate-600">
                {text.service}
                <select
                  value={serviceType}
                  onChange={event => setServiceType(event.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800"
                >
                  <option value="">{text.all}</option>
                  {SEARCH_SERVICE_TYPES.map(item => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </details>
        </div>

        {!hasCriteria ? (
          <div className="mt-6 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-6 text-sm text-slate-700">
            Saisissez au moins deux caractères ou choisissez un filtre pour
            rechercher dans les 196 pays, les procédures et les services 3M.
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <section
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              aria-labelledby="internal-results-title"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-blue-800">
                    Dans 3M Travel
                  </p>
                  <h2
                    id="internal-results-title"
                    className="mt-1 text-xl font-black text-slate-950"
                  >
                    {text.internal}
                  </h2>
                </div>
                <ShieldCheck
                  className="h-5 w-5 text-emerald-600"
                  aria-hidden="true"
                />
              </div>
              <div className="mt-4 divide-y divide-slate-100">
                {internalResults.length === 0 ? (
                  <p className="py-5 text-sm text-slate-600">
                    {text.noInternal}
                  </p>
                ) : (
                  internalResults.map(result => (
                    <a
                      key={result.id}
                      href={result.href}
                      className="flex items-start gap-3 px-1 py-4 transition hover:bg-blue-50/60"
                    >
                      <span className="mt-0.5 text-xl" aria-hidden="true">
                        {result.flag ?? "•"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-slate-900">
                          {result.title}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                          {result.category} · {result.description}
                        </span>
                      </span>
                      <ArrowUpRight
                        className="mt-1 h-4 w-4 shrink-0 text-blue-700"
                        aria-hidden="true"
                      />
                    </a>
                  ))
                )}
              </div>
            </section>
            <section
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              aria-labelledby="web-results-title"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-[#9a6c16]">
                    Web public
                  </p>
                  <h2
                    id="web-results-title"
                    className="mt-1 text-xl font-black text-slate-950"
                  >
                    {text.web}
                  </h2>
                </div>
                <Globe2 className="h-5 w-5 text-[#b98525]" aria-hidden="true" />
              </div>
              {webSearch.isLoading ? (
                <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  {text.loading}
                </p>
              ) : webSearch.isError ? (
                <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                  {text.webUnavailable}
                </p>
              ) : webSearch.data?.results.length ? (
                <div className="mt-4 divide-y divide-slate-100">
                  {webSearch.data.results.map(result => (
                    <a
                      key={result.href}
                      href={result.href}
                      target="_blank"
                      rel="noreferrer"
                      className="block px-1 py-4 transition hover:bg-amber-50/60"
                    >
                      <span className="flex items-start gap-2">
                        <span className="min-w-0 flex-1 text-sm font-bold text-slate-900">
                          {result.title}
                        </span>
                        <ArrowUpRight
                          className="h-4 w-4 shrink-0 text-[#9a6c16]"
                          aria-hidden="true"
                        />
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-600">
                        {result.summary}
                      </span>
                      <span className="mt-2 block text-[11px] font-semibold text-[#9a6c16]">
                        {text.source}
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  {text.noWeb}
                </p>
              )}
            </section>
          </div>
        )}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-white p-4 text-xs leading-5 text-slate-600 shadow-sm">
          <MapPin
            className="mt-0.5 h-4 w-4 shrink-0 text-blue-700"
            aria-hidden="true"
          />
          <p>
            {text.hint} 3M vous aide à structurer votre projet, mais la décision
            appartient toujours à l’autorité officielle du pays concerné.
          </p>
        </div>
      </div>
    </main>
  );
}
