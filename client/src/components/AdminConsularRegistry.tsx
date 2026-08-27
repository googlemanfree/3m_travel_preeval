import { useMemo, useState } from "react";
import { Globe, ExternalLink, Search, ShieldCheck, FileText, Building2, CircleAlert, CheckCircle2, SlidersHorizontal, BookOpen, Pencil, Save, CalendarClock, BellRing } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { ADMIN_CONSULAR_CATALOG, ADMIN_CONSULAR_RESOURCE_TOTAL } from "@/lib/adminConsularCatalog";
import { getConsularRevalidationState, needsConsularRevalidation, type ConsularRevalidationState } from "@/lib/consularRevalidation";
import { trpc } from "@/lib/trpc";

type VerificationFilter = "all" | "verifie" | "a_completer";
type EditableVerificationStatus = Exclude<VerificationFilter, "all">;
type RevalidationFilter = "all" | Exclude<ConsularRevalidationState, "current">;

const revisionBadge = (state: ConsularRevalidationState) => {
  if (state === "overdue") return { label: "Révision en retard", className: "bg-rose-100 text-rose-900 hover:bg-rose-100" };
  if (state === "due_soon") return { label: "À actualiser bientôt", className: "bg-amber-100 text-amber-900 hover:bg-amber-100" };
  if (state === "missing_deadline") return { label: "Échéance à définir", className: "bg-slate-100 text-slate-800 hover:bg-slate-100" };
  if (state === "control_required") return { label: "Contrôle requis", className: "bg-amber-100 text-amber-900 hover:bg-amber-100" };
  return null;
};

export function AdminConsularRegistry({ sessionToken }: { sessionToken: string }) {
  const [search, setSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<VerificationFilter>("all");
  const [selectedRevalidation, setSelectedRevalidation] = useState<RevalidationFilter>("all");
  const [editingEntry, setEditingEntry] = useState<(typeof ADMIN_CONSULAR_CATALOG)[number] | null>(null);
  const [portalUrl, setPortalUrl] = useState("");
  const [portalLabel, setPortalLabel] = useState("");
  const [verifiedAt, setVerifiedAt] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<EditableVerificationStatus>("a_completer");
  const [verificationNote, setVerificationNote] = useState("");
  const [revalidateDueAt, setRevalidateDueAt] = useState("");
  const { toast } = useToast();
  const overridesQuery = trpc.consularRegistry.listOverrides.useQuery({ sessionToken }, { enabled: Boolean(sessionToken) });
  const revalidationQueueQuery = trpc.consularRegistry.listRevalidationQueue.useQuery({ sessionToken, daysAhead: 30 }, { enabled: Boolean(sessionToken) });
  const saveOverrideMutation = trpc.consularRegistry.upsertOverride.useMutation({
    onSuccess: () => {
      void overridesQuery.refetch();
      void revalidationQueueQuery.refetch();
      setEditingEntry(null);
      toast({ title: "Fiche consulaire mise à jour", description: "Le lien et son statut de vérification ont été enregistrés dans le journal administratif." });
    },
    onError: (error) => toast({ title: "Mise à jour impossible", description: error.message, variant: "destructive" }),
  });

  const catalog = useMemo(() => {
    const overrides = new Map((overridesQuery.data ?? []).map((override: any) => [override.countryCode, override]));
    return ADMIN_CONSULAR_CATALOG.map((entry) => {
      const override = overrides.get(entry.countryCode);
      if (!override) return entry;
      return {
        ...entry,
        officialPortalUrl: override.officialPortalUrl || undefined,
        officialPortalLabel: override.officialPortalLabel || undefined,
        officialVerifiedAt: override.officialVerifiedAt || undefined,
        verificationStatus: override.verificationStatus,
        verificationNote: override.verificationNote || undefined,
        revalidateDueAt: override.revalidateDueAt || undefined,
      };
    });
  }, [overridesQuery.data]);

  const regions = useMemo(
    () => ["all", ...Array.from(new Set(catalog.map((entry) => entry.region))).sort((left, right) => left.localeCompare(right, "fr"))],
    [catalog],
  );
  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("fr");
    return catalog.filter((entry) => {
      const matchesSearch = !normalizedSearch || [entry.countryName, entry.region, entry.procedures.join(" "), entry.sourceSummary]
        .join(" ")
        .toLocaleLowerCase("fr")
        .includes(normalizedSearch);
      return matchesSearch
        && (selectedRegion === "all" || entry.region === selectedRegion)
        && (selectedStatus === "all" || entry.verificationStatus === selectedStatus)
        && (selectedRevalidation === "all" || getConsularRevalidationState(entry as any) === selectedRevalidation);
    });
  }, [catalog, search, selectedRegion, selectedStatus, selectedRevalidation]);

  const verifiedCount = catalog.filter((entry) => entry.verificationStatus === "verifie").length;
  const followUpCount = catalog.length - verifiedCount;
  const revalidationQueue = useMemo(() => {
    return catalog.filter((entry: any) => needsConsularRevalidation(entry));
  }, [catalog]);
  const overdueCount = useMemo(() => catalog.filter((entry: any) => getConsularRevalidationState(entry) === "overdue").length, [catalog]);

  const openEditor = (entry: (typeof ADMIN_CONSULAR_CATALOG)[number]) => {
    setEditingEntry(entry);
    setPortalUrl(entry.officialPortalUrl ?? "");
    setPortalLabel(entry.officialPortalLabel ?? "");
    setVerifiedAt(entry.officialVerifiedAt ?? "");
    setVerificationStatus(entry.verificationStatus as EditableVerificationStatus);
    setVerificationNote(entry.verificationNote ?? "");
    setRevalidateDueAt((entry as any).revalidateDueAt ? new Date((entry as any).revalidateDueAt).toISOString().slice(0, 10) : "");
  };

  const savePortal = () => {
    if (!editingEntry) return;
    saveOverrideMutation.mutate({
      sessionToken,
      portal: {
        countryCode: editingEntry.countryCode,
        countryName: editingEntry.countryName,
        officialPortalUrl: portalUrl.trim(),
        officialPortalLabel: portalLabel.trim(),
        officialVerifiedAt: verifiedAt.trim(),
        verificationStatus,
        verificationNote: verificationNote.trim(),
        revalidateDueAt: revalidateDueAt ? new Date(`${revalidateDueAt}T12:00:00`).toISOString() : "",
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white"><Globe className="h-6 w-6 text-blue-600" />Registre des Consulats & Liens officiels</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">Registre opérationnel construit à partir de la bibliothèque 3M : guides pays-procédure, portails e‑Visa documentés et statut de contrôle avant dépôt.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4 sm:min-w-[440px]">
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-blue-950"><strong className="block text-lg">{ADMIN_CONSULAR_RESOURCE_TOTAL}</strong>guides 3M</div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-emerald-950"><strong className="block text-lg">{verifiedCount}</strong>portails vérifiés</div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-amber-950"><strong className="block text-lg">{followUpCount}</strong>à compléter</div>
            <div className={`rounded-lg border px-3 py-2 ${overdueCount ? "border-rose-200 bg-rose-50 text-rose-950" : "border-slate-200 bg-slate-50 text-slate-800"}`}><strong className="block text-lg">{overdueCount}</strong>révision{overdueCount > 1 ? "s" : ""} en retard</div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pays, procédure, région ou guide…" className="h-10 bg-slate-50 pl-9 dark:bg-slate-950" /></div>
          <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as VerificationFilter)} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"><option value="all">Tous les statuts</option><option value="verifie">Portail vérifié</option><option value="a_completer">Contrôle requis</option></select>
          <select value={selectedRevalidation} onChange={(event) => setSelectedRevalidation(event.target.value as RevalidationFilter)} aria-label="Filtrer les échéances de revalidation" className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"><option value="all">Toutes les échéances</option><option value="overdue">Révision en retard</option><option value="due_soon">À actualiser bientôt</option><option value="missing_deadline">Échéance à définir</option><option value="control_required">Contrôle requis</option></select>
          <Button type="button" variant="outline" onClick={() => { setSearch(""); setSelectedRegion("all"); setSelectedStatus("all"); setSelectedRevalidation("all"); }} className="h-10 border-slate-200 dark:border-slate-800"><SlidersHorizontal className="mr-2 h-4 w-4" />Réinitialiser</Button>
        </div>
      </div>

      <section className="rounded-xl border border-amber-200 bg-amber-50/70 p-4" aria-label="Liens consulaires à revalider">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><div className="rounded-lg bg-amber-100 p-2 text-amber-800"><BellRing className="h-4 w-4" /></div><div><h3 className="font-semibold text-amber-950">File de revalidation des liens officiels</h3><p className="mt-1 text-sm text-amber-900">{revalidationQueue.length} fiche(s) à contrôler : en retard, à actualiser dans les 30 jours, sans échéance ou incomplètes.</p></div></div><Button type="button" size="sm" variant="outline" className="border-amber-300 bg-white text-amber-950" onClick={() => setSelectedRevalidation("overdue")}>Voir les révisions urgentes</Button></div>
        {revalidationQueue.slice(0, 5).length > 0 && <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">{revalidationQueue.slice(0, 5).map((entry: any) => <button key={entry.countryCode} type="button" onClick={() => openEditor(entry)} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-left text-xs text-amber-950 hover:border-amber-400"><span className="block font-semibold">{entry.countryName}</span><span className="mt-1 block text-amber-800">{entry.revalidateDueAt ? `Échéance : ${new Date(entry.revalidateDueAt).toLocaleDateString("fr-FR")}` : "Échéance à définir"}</span></button>)}</div>}
      </section>

      <div className="flex flex-wrap gap-2" aria-label="Filtrer par région">{regions.map((region) => <Button key={region} type="button" variant={selectedRegion === region ? "default" : "outline"} size="sm" onClick={() => setSelectedRegion(region)} className={selectedRegion === region ? "bg-blue-600 text-white" : "border-slate-200 dark:border-slate-800"}>{region === "all" ? "Toutes les régions" : region}</Button>)}</div>
      <div className="flex items-center justify-between gap-3 text-sm text-slate-500"><span><strong className="text-slate-900 dark:text-white">{filtered.length}</strong> destination{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}</span><span>Ouvrez toujours le portail officiel juste avant toute soumission.</span></div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((entry) => { const reviewState = getConsularRevalidationState(entry as any); const reviewBadge = revisionBadge(reviewState); return <Card key={entry.countryCode} className="flex flex-col border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><CardTitle className="truncate text-lg font-bold text-slate-900 dark:text-white">{entry.countryName}</CardTitle><CardDescription className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">{entry.region}</CardDescription></div><div className="flex max-w-[180px] flex-wrap justify-end gap-1">{reviewBadge && <Badge className={`shrink-0 ${reviewBadge.className}`}><CalendarClock className="mr-1 h-3.5 w-3.5" />{reviewBadge.label}</Badge>}{entry.verificationStatus === "verifie" ? <Badge className="shrink-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-100"><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Vérifié</Badge> : <Badge className="shrink-0 bg-amber-100 text-amber-900 hover:bg-amber-100"><CircleAlert className="mr-1 h-3.5 w-3.5" />À compléter</Badge>}</div></div></CardHeader>
          <CardContent className="flex flex-1 flex-col space-y-4 text-sm">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"><p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Couverture 3M</p><p className="mt-1 text-xs leading-5 text-slate-500">{entry.sourceSummary}</p><div className="mt-2 flex flex-wrap gap-1.5">{entry.procedures.slice(0, 4).map((procedure) => <Badge key={procedure} variant="secondary" className="bg-white text-[10px] text-slate-700 shadow-none dark:bg-slate-900 dark:text-slate-200">{procedure}</Badge>)}</div></div>
            <div><p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-200">Guides et formulaires associés</p>{entry.resources.length ? <div className="space-y-1.5">{entry.resources.slice(0, 3).map((resource) => <a key={resource.id} href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-slate-800"><FileText className="h-3.5 w-3.5 shrink-0" /><span className="line-clamp-1">{resource.title}</span><ExternalLink className="ml-auto h-3 w-3 shrink-0" /></a>)}{entry.resources.length > 3 && <p className="px-2 text-xs text-slate-500">+ {entry.resources.length - 3} autre{entry.resources.length - 3 > 1 ? "s" : ""} guide{entry.resources.length - 3 > 1 ? "s" : ""}</p>}</div> : <p className="text-xs leading-5 text-slate-500">Aucun guide 3M associé pour l’instant.</p>}</div>
            <div className="mt-auto space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              {entry.officialPortalUrl ? <a href={entry.officialPortalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-between rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"><span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{entry.officialPortalLabel ?? "Portail officiel"}</span><ExternalLink className="h-3.5 w-3.5" /></a> : <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950"><CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />Lien institutionnel à renseigner et valider dans le catalogue e‑Visa ou la fiche consulaire.</div>}
              {entry.evisaUrl && entry.evisaUrl !== entry.officialPortalUrl && <a href={entry.evisaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100"><span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />Accès e‑Visa / autorisation</span><ExternalLink className="h-3.5 w-3.5" /></a>}
              {entry.officialVerifiedAt && <p className="text-[11px] text-slate-500">Vérifié le {entry.officialVerifiedAt}</p>}
              {(entry as any).revalidateDueAt && <p className="flex items-center gap-1 text-[11px] text-amber-800"><CalendarClock className="h-3 w-3" />À revalider avant le {new Date((entry as any).revalidateDueAt).toLocaleDateString("fr-FR")}</p>}
              <Button type="button" variant="outline" size="sm" className="w-full border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200" onClick={() => openEditor(entry)} disabled={!sessionToken}><Pencil className="mr-1.5 h-3.5 w-3.5" />Mettre à jour / vérifier</Button>
            </div>
          </CardContent>
        </Card>})}
      </div>

      {filtered.length === 0 && <div className="rounded-xl border border-slate-200 bg-white py-12 text-center dark:border-slate-800 dark:bg-slate-900"><BookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" /><p className="font-medium text-slate-700 dark:text-slate-300">Aucune fiche ne correspond aux filtres choisis.</p><Button type="button" variant="outline" onClick={() => { setSearch(""); setSelectedRegion("all"); setSelectedStatus("all"); }} className="mt-4">Réinitialiser les filtres</Button></div>}

      <Dialog open={Boolean(editingEntry)} onOpenChange={(open) => { if (!open) setEditingEntry(null); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Vérifier le lien institutionnel — {editingEntry?.countryName}</DialogTitle><DialogDescription>Enregistrez uniquement un portail gouvernemental ou consulaire en HTTPS. Chaque modification est journalisée avec son auteur.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label htmlFor="portal-url">URL officielle</Label><Input id="portal-url" type="url" value={portalUrl} onChange={(event) => setPortalUrl(event.target.value)} placeholder="https://…" /></div>
            <div className="grid gap-2"><Label htmlFor="portal-label">Libellé du portail</Label><Input id="portal-label" value={portalLabel} onChange={(event) => setPortalLabel(event.target.value)} placeholder="Ex. Portail officiel des visas" /></div>
            <div className="grid gap-2"><Label htmlFor="portal-date">Date de vérification</Label><Input id="portal-date" value={verifiedAt} onChange={(event) => setVerifiedAt(event.target.value)} placeholder="Ex. 19 août 2026" /></div>
            <div className="grid gap-2"><Label htmlFor="portal-revalidation-date">Échéance de revalidation</Label><Input id="portal-revalidation-date" type="date" value={revalidateDueAt} onChange={(event) => setRevalidateDueAt(event.target.value)} /><p className="text-xs text-slate-500">Laissez vide si aucun rappel programmé n’est nécessaire.</p></div>
            <div className="grid gap-2"><Label htmlFor="portal-status">Statut</Label><select id="portal-status" value={verificationStatus} onChange={(event) => setVerificationStatus(event.target.value as EditableVerificationStatus)} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="verifie">Portail vérifié</option><option value="a_completer">Lien à compléter / recontrôler</option></select></div>
            <div className="grid gap-2"><Label htmlFor="portal-note">Note de contrôle</Label><Textarea id="portal-note" value={verificationNote} onChange={(event) => setVerificationNote(event.target.value)} placeholder="Source consultée, motif de la mise à jour ou point à recontrôler…" /></div>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setEditingEntry(null)}>Annuler</Button><Button type="button" className="bg-blue-700 hover:bg-blue-800" onClick={savePortal} disabled={saveOverrideMutation.isPending || !sessionToken}><Save className="mr-2 h-4 w-4" />{saveOverrideMutation.isPending ? "Enregistrement…" : "Enregistrer la vérification"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
