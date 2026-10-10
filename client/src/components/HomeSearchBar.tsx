import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, Search } from "lucide-react";
import { useLocation } from "wouter";
import { procedures107Complete } from "@/data/procedures107Complete";
import { Input } from "@/components/ui/input";

const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const VISA_LABEL: Record<string, string> = {
  travail: "Travail",
  etudes: "Études",
  visiteur: "Visiteur",
};

/**
 * Barre de recherche d’accueil : pays / visa / procédure → fiche ou guide PDF.
 */
export default function HomeSearchBar() {
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();
  const q = fold(query);

  const results = useMemo(() => {
    if (q.length < 2) return [];
    return procedures107Complete
      .filter((item) => {
        const haystack = fold(
          `${item.name} ${item.visaType} ${item.region} ${item.description} ${item.highlights.join(" ")}`,
        );
        return haystack.includes(q) || q.split(/\s+/).every((token) => haystack.includes(token));
      })
      .slice(0, 8);
  }, [q]);

  const goGuide = () => {
    const path = query.trim()
      ? `/guide-procedures?q=${encodeURIComponent(query.trim())}`
      : "/guide-procedures";
    navigate(path);
    setQuery("");
  };

  const goProcedure = (id: string) => {
    navigate(`/procedures/${encodeURIComponent(id)}`);
    setQuery("");
  };

  return (
    <section
      id="home-search"
      className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white py-6 md:py-8"
      data-testid="home-search"
      aria-labelledby="home-search-title"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-800">Recherche rapide</p>
              <h2 id="home-search-title" className="mt-1 font-[Sora,ui-sans-serif] text-lg font-bold text-slate-950 md:text-xl">
                Trouver une procédure par pays ou type de visa
              </h2>
            </div>
            <a
              href="/guide-procedures"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-800 underline-offset-4 hover:underline"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Bibliothèque PDF
            </a>
          </div>
          <label htmlFor="home-search-input" className="sr-only">
            Rechercher un pays, un visa ou une procédure
          </label>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <Input
              id="home-search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (results[0]) goProcedure(results[0].id);
                  else goGuide();
                }
              }}
              placeholder="Ex. Canada travail, Luxembourg études, France visiteur…"
              maxLength={120}
              className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-10 pr-28 text-sm"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={goGuide}
              className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-lg bg-blue-800 px-3 py-2 text-xs font-bold text-white hover:bg-blue-900"
            >
              Chercher <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          {q.length >= 2 && (
            <ul
              className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white"
              role="listbox"
              aria-label="Résultats de recherche"
              data-testid="home-search-results"
            >
              {results.length === 0 ? (
                <li className="px-4 py-3 text-sm text-slate-600">
                  Aucune fiche exacte —{" "}
                  <button type="button" onClick={goGuide} className="font-semibold text-blue-800 underline underline-offset-2">
                    ouvrir le guide PDF avec « {query.trim()} »
                  </button>
                </li>
              ) : (
                results.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="option"
                      onClick={() => goProcedure(item.id)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-blue-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-900">
                          {item.flag} {item.name} · {VISA_LABEL[item.visaType] || item.visaType}
                        </span>
                        <span className="block truncate text-xs text-slate-500">{item.description}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
