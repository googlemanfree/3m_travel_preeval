import { useMemo, useState } from "react";
import { BookOpen, Check, Copy, Download, ExternalLink, FileText, Search, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PDF_CATEGORIES } from "@shared/pdfResources";
import { filterProcedureResources, getAllProcedureResources, getProcedureGuideUrl } from "@shared/procedureGuide";

export default function ProcedureResourceGuide() {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const query = search.trim().toLowerCase();
  const shareUrl = typeof window !== "undefined" ? getProcedureGuideUrl(window.location.origin) : "/guide-procedures";

  const filteredResourceIds = useMemo(() => new Set(filterProcedureResources(query).map((resource) => resource.id)), [query]);
  const filteredCategories = useMemo(() => PDF_CATEGORIES.map((category) => ({
    ...category,
    resources: category.resources.filter((resource) => filteredResourceIds.has(resource.id)),
  })).filter((category) => category.resources.length > 0), [filteredResourceIds]);

  const totalResources = filteredCategories.reduce((sum, category) => sum + category.resources.length, 0);
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
      await navigator.share({ title: "Guides & procédures 3M Travel", text: "Retrouvez les procédures et ressources PDF 3M Travel.", url: shareUrl });
      return;
    }
    await copyShareLink();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-gradient-to-br from-[#0f2460] via-[#1e3a8a] to-[#2563eb] px-4 py-14 text-white md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
            <BookOpen className="h-4 w-4" />
            Lien client à partager
          </div>
          <h1 className="max-w-3xl text-3xl font-black tracking-tight md:text-5xl">Guides & procédures de mobilité internationale</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100 md:text-lg">
            Une bibliothèque claire pour retrouver les procédures par destination, type de visa et document PDF disponible dans les ressources 3M Travel.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button onClick={copyShareLink} className="rounded-xl bg-white text-blue-900 hover:bg-blue-50">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Lien copié" : "Copier le lien client"}
            </Button>
            <Button onClick={shareGuide} variant="outline" className="rounded-xl border-white/40 bg-white/10 text-white hover:bg-white/20">
              <Share2 className="h-4 w-4" /> Partager le guide
            </Button>
            <a href="/procedures" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/30 px-4 text-sm font-semibold text-white transition hover:bg-white/10">
              Explorer les procédures
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-blue-100">
            <span className="rounded-full bg-white/10 px-3 py-1.5">{allResources} ressources cataloguées</span>
            <span className="rounded-full bg-white/10 px-3 py-1.5">Accès public</span>
            <span className="rounded-full bg-white/10 px-3 py-1.5">Mise à jour par 3M Travel</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <div className="sticky top-0 z-10 mb-7 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
          <label htmlFor="guide-search" className="sr-only">Rechercher une procédure ou une ressource</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input id="guide-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un pays, un visa ou un guide PDF…" className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10" />
          </div>
          <p className="mt-2 px-1 text-xs text-slate-500">{totalResources} ressource(s) affichée(s) sur {allResources}.</p>
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
                <Sparkles className="h-5 w-5 text-blue-600" aria-hidden="true" />
              </div>
              <div className="grid gap-3 p-4 md:grid-cols-2 md:p-6">
                {category.resources.map((resource) => (
                  <article key={resource.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/40">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700"><FileText className="h-5 w-5" /></div>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-slate-900">{resource.title}</h3>
                        <p className="mt-1 text-xs text-slate-500">{resource.flag} {resource.country} · {resource.type.toUpperCase()}</p>
                      </div>
                    </div>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" download className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-800">
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Ouvrir</span>
                    </a>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 font-semibold text-slate-700">Aucune ressource ne correspond à votre recherche.</p>
            <button type="button" onClick={() => setSearch("")} className="mt-3 text-sm font-semibold text-blue-700 underline underline-offset-4">Réinitialiser la recherche</button>
          </div>
        )}

        <div className="mt-8 rounded-3xl border border-blue-100 bg-blue-50 p-5 text-sm leading-6 text-blue-950 md:p-6">
          <strong>Besoin d’une orientation personnalisée ?</strong> Posez votre question à Aureol depuis l’accueil ou utilisez WhatsApp pour être accompagné par un conseiller.
        </div>
      </main>
    </div>
  );
}
