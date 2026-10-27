import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Search } from "lucide-react";
import { PATHWAY_LABELS } from "@shared/countryCatalog";
import { trpc } from "@/lib/trpc";
import { setPageSeo } from "@/lib/pageSeo";
import { ServicePageShell } from "@/components/ServicePageShell";
import { Input } from "@/components/ui/input";

const dateLabel = (value: string | null) => (value ? new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : null);

/** Index des guides par pays : uniquement ceux dont la fiche a été vérifiée et publiée. */
export default function CountryGuides() {
  const guides = trpc.countryCatalog.guideList.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const [search, setSearch] = useState("");

  useEffect(() => {
    setPageSeo({
      title: "Guides visa par pays | 3M TRAVEL AGENCY",
      description: "Pour chaque pays : étapes du visa travail, études ou visiteur, pièces à préparer, délais et frais, avec la date de vérification.",
    });
  }, []);

  const list = guides.data ?? [];
  const visible = useMemo(() => list.filter((guide) => guide.name.toLowerCase().includes(search.trim().toLowerCase())), [list, search]);

  return (
    <ServicePageShell
      eyebrow="Guides vérifiés"
      title="Guides visa par pays"
      introduction="Étapes, pièces à préparer, délais et frais pour le travail, les études et les séjours de visite. Un guide n'apparaît ici qu'après vérification complète de son contenu."
      primaryHref="/#evaluation-multi"
      primaryLabel="Lancer ma procédure"
      secondaryHref="/procedures"
      secondaryLabel="Toutes les procédures"
      notice="Ces repères sont indicatifs. Un conseiller 3M TRAVEL AGENCY confirme chaque exigence au moment d'instruire votre dossier."
    >
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6" aria-labelledby="country-guides-title" data-testid="country-guides">
        <h2 id="country-guides-title" className="text-2xl font-black text-slate-950">Pays disponibles</h2>
        {list.length > 0 ? (
          <div className="mt-4 max-w-md">
            <label htmlFor="country-guides-search" className="sr-only">Chercher un pays</label>
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><Input id="country-guides-search" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Chercher un pays" /></div>
          </div>
        ) : null}
        {guides.isLoading ? <p className="mt-6 text-slate-600" role="status">Chargement des guides…</p> : null}
        {!guides.isLoading && list.length === 0 ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-slate-800" role="status" data-testid="country-guides-empty">
            <p className="font-semibold">Les premiers guides sont en cours de vérification.</p>
            <p className="mt-1 text-sm">Nous ne publions un guide qu'après vérification complète de son contenu. En attendant, consultez les <Link href="/procedures" className="font-semibold text-blue-800 underline">procédures détaillées</Link>, l'<Link href="/evisas" className="font-semibold text-blue-800 underline">annuaire des e-Visas</Link> et les <Link href="/ressources" className="font-semibold text-blue-800 underline">ressources par pays</Link>.</p>
          </div>
        ) : null}
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((guide) => (
            <li key={guide.slug}>
              <Link href={`/pays/${guide.slug}`} className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" data-testid={`country-guide-card-${guide.slug}`}>
                <span className="text-lg font-black text-slate-950">{guide.name}</span>
                <span className="mt-2 flex flex-wrap gap-2">{guide.pathways.map((pathway) => <span key={pathway} className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-900">{PATHWAY_LABELS[pathway]}</span>)}</span>
                {guide.updatedAt ? <span className="mt-2 text-xs text-slate-500">Vérifié le {dateLabel(guide.updatedAt)}</span> : null}
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-blue-800">Ouvrir le guide <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" /></span>
              </Link>
            </li>
          ))}
        </ul>
        {list.length > 0 && visible.length === 0 ? <p className="mt-6 text-slate-600">Aucun guide ne correspond à « {search} ».</p> : null}
      </section>
    </ServicePageShell>
  );
}
