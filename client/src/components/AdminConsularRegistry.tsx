import { useMemo, useState } from "react";
import { Globe, ExternalLink, Search, ShieldCheck, FileText, Building2, CircleAlert, CheckCircle2, SlidersHorizontal, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ADMIN_CONSULAR_CATALOG, ADMIN_CONSULAR_RESOURCE_TOTAL } from "@/lib/adminConsularCatalog";

type VerificationFilter = "all" | "verifie" | "a_completer";

export function AdminConsularRegistry() {
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<VerificationFilter>("all");

  const regions = useMemo(
    () => ["all", ...Array.from(new Set(ADMIN_CONSULAR_CATALOG.map((entry) => entry.region))).sort((left, right) => left.localeCompare(right, "fr"))],
    [],
  );
  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("fr");
    return ADMIN_CONSULAR_CATALOG.filter((entry) => {
      const matchesSearch = !normalizedSearch || [entry.countryName, entry.region, entry.procedures.join(" "), entry.sourceSummary]
        .join(" ")
        .toLocaleLowerCase("fr")
        .includes(normalizedSearch);
      return matchesSearch
        && (selectedRegion === "all" || entry.region === selectedRegion)
        && (selectedStatus === "all" || entry.verificationStatus === selectedStatus);
    });
  }, [search, selectedRegion, selectedStatus]);

  const verifiedCount = ADMIN_CONSULAR_CATALOG.filter((entry) => entry.verificationStatus === "verifie").length;
  const followUpCount = ADMIN_CONSULAR_CATALOG.length - verifiedCount;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white"><Globe className="h-6 w-6 text-blue-600" />Registre des Consulats & Liens officiels</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">Registre opérationnel construit à partir de la bibliothèque 3M : guides pays-procédure, portails e‑Visa documentés et statut de contrôle avant dépôt.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs sm:min-w-[360px]">
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-blue-950"><strong className="block text-lg">{ADMIN_CONSULAR_RESOURCE_TOTAL}</strong>guides 3M</div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-emerald-950"><strong className="block text-lg">{verifiedCount}</strong>portails vérifiés</div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-amber-950"><strong className="block text-lg">{followUpCount}</strong>à compléter</div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pays, procédure, région ou guide…" className="h-10 bg-slate-50 pl-9 dark:bg-slate-950" /></div>
          <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as VerificationFilter)} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"><option value="all">Tous les statuts</option><option value="verifie">Portail vérifié</option><option value="a_completer">Contrôle requis</option></select>
          <Button type="button" variant="outline" onClick={() => { setSearch(""); setSelectedRegion("all"); setSelectedStatus("all"); }} className="h-10 border-slate-200 dark:border-slate-800"><SlidersHorizontal className="mr-2 h-4 w-4" />Réinitialiser</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Filtrer par région">{regions.map((region) => <Button key={region} type="button" variant={selectedRegion === region ? "default" : "outline"} size="sm" onClick={() => setSelectedRegion(region)} className={selectedRegion === region ? "bg-blue-600 text-white" : "border-slate-200 dark:border-slate-800"}>{region === "all" ? "Toutes les régions" : region}</Button>)}</div>
      <div className="flex items-center justify-between gap-3 text-sm text-slate-500"><span><strong className="text-slate-900 dark:text-white">{filtered.length}</strong> destination{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}</span><span>Ouvrez toujours le portail officiel juste avant toute soumission.</span></div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((entry) => <Card key={entry.countryCode} className="flex flex-col border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><CardTitle className="truncate text-lg font-bold text-slate-900 dark:text-white">{entry.countryName}</CardTitle><CardDescription className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">{entry.region}</CardDescription></div>{entry.verificationStatus === "verifie" ? <Badge className="shrink-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-100"><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Vérifié</Badge> : <Badge className="shrink-0 bg-amber-100 text-amber-900 hover:bg-amber-100"><CircleAlert className="mr-1 h-3.5 w-3.5" />À compléter</Badge>}</div></CardHeader>
          <CardContent className="flex flex-1 flex-col space-y-4 text-sm">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"><p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Couverture 3M</p><p className="mt-1 text-xs leading-5 text-slate-500">{entry.sourceSummary}</p><div className="mt-2 flex flex-wrap gap-1.5">{entry.procedures.slice(0, 4).map((procedure) => <Badge key={procedure} variant="secondary" className="bg-white text-[10px] text-slate-700 shadow-none dark:bg-slate-900 dark:text-slate-200">{procedure}</Badge>)}</div></div>
            <div><p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-200">Guides et formulaires associés</p>{entry.resources.length ? <div className="space-y-1.5">{entry.resources.slice(0, 3).map((resource) => <a key={resource.id} href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-slate-800"><FileText className="h-3.5 w-3.5 shrink-0" /><span className="line-clamp-1">{resource.title}</span><ExternalLink className="ml-auto h-3 w-3 shrink-0" /></a>)}{entry.resources.length > 3 && <p className="px-2 text-xs text-slate-500">+ {entry.resources.length - 3} autre{entry.resources.length - 3 > 1 ? "s" : ""} guide{entry.resources.length - 3 > 1 ? "s" : ""}</p>}</div> : <p className="text-xs leading-5 text-slate-500">Aucun guide 3M associé pour l’instant.</p>}</div>
            <div className="mt-auto space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              {entry.officialPortalUrl ? <a href={entry.officialPortalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-between rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"><span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{entry.officialPortalLabel ?? "Portail officiel"}</span><ExternalLink className="h-3.5 w-3.5" /></a> : <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950"><CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />Lien institutionnel à renseigner et valider dans le catalogue e‑Visa ou la fiche consulaire.</div>}
              {entry.evisaUrl && entry.evisaUrl !== entry.officialPortalUrl && <a href={entry.evisaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100"><span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />Accès e‑Visa / autorisation</span><ExternalLink className="h-3.5 w-3.5" /></a>}
              {entry.officialVerifiedAt && <p className="text-[11px] text-slate-500">Vérifié le {entry.officialVerifiedAt}</p>}
            </div>
          </CardContent>
        </Card>)}
      </div>

      {filtered.length === 0 && <div className="rounded-xl border border-slate-200 bg-white py-12 text-center dark:border-slate-800 dark:bg-slate-900"><BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" /><p className="font-medium text-slate-700 dark:text-slate-300">Aucune fiche ne correspond aux filtres choisis.</p><Button type="button" variant="outline" onClick={() => { setSearch(""); setSelectedRegion("all"); setSelectedStatus("all"); }} className="mt-4">Réinitialiser les filtres</Button></div>}
    </div>
  );
}
