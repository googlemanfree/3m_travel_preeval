import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, ExternalLink, Link2, Plus, RefreshCw, Save, Trash2, Wrench } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type ConfigLink = { label: string; href: string };
type LinkStatus = "pending" | "ok" | "broken" | "redirect" | "timeout" | "error";

const statusLabel: Record<LinkStatus, string> = {
  pending: "À vérifier", ok: "Actif", broken: "Brisé", redirect: "Redirection", timeout: "Délai dépassé", error: "Erreur",
};

const statusClass: Record<LinkStatus, string> = {
  pending: "bg-slate-100 text-slate-700 border-slate-200", ok: "bg-emerald-50 text-emerald-700 border-emerald-200", broken: "bg-red-50 text-red-700 border-red-200", redirect: "bg-amber-50 text-amber-700 border-amber-200", timeout: "bg-orange-50 text-orange-700 border-orange-200", error: "bg-red-50 text-red-700 border-red-200",
};

export function AdminRouteHealthManager({ sessionToken }: { sessionToken: string }) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const configQuery = trpc.routeHealth.getAdmin404Config.useQuery({ sessionToken }, { staleTime: 60_000 });
  const eventsQuery = trpc.routeHealth.list404Events.useQuery({ sessionToken, search: "", limit: 100 }, { staleTime: 30_000 });
  const linksQuery = trpc.routeHealth.listExternalLinks.useQuery({ sessionToken }, { staleTime: 30_000 });
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [links, setLinks] = useState<ConfigLink[]>([]);
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkHref, setNewLinkHref] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [externalLabel, setExternalLabel] = useState("");
  const [errorSearch, setErrorSearch] = useState("");

  useEffect(() => {
    if (!configQuery.data) return;
    setTitle(configQuery.data.title);
    setMessage(configQuery.data.message);
    setLinks(configQuery.data.links);
  }, [configQuery.data]);

  const filtered404 = useMemo(() => {
    const term = errorSearch.trim().toLowerCase();
    return (eventsQuery.data ?? []).filter((event) => !term || event.path.toLowerCase().includes(term));
  }, [eventsQuery.data, errorSearch]);

  const saveConfig = trpc.routeHealth.update404Config.useMutation({
    onSuccess: () => { toast({ title: "Page 404 enregistrée", description: "Les nouveaux liens utiles sont maintenant visibles sur la page introuvable." }); void utils.routeHealth.getAdmin404Config.invalidate(); },
    onError: (error) => toast({ title: "Enregistrement impossible", description: error.message, variant: "destructive" }),
  });
  const addExternalLink = trpc.routeHealth.upsertExternalLink.useMutation({
    onSuccess: () => { setExternalUrl(""); setExternalLabel(""); toast({ title: "Lien ajouté", description: "Le lien est prêt pour une vérification." }); void utils.routeHealth.listExternalLinks.invalidate(); },
    onError: (error) => toast({ title: "Lien refusé", description: error.message, variant: "destructive" }),
  });
  const checkLink = trpc.routeHealth.checkExternalLink.useMutation({
    onSuccess: (result) => { toast({ title: `Contrôle terminé : ${statusLabel[result.status]}`, description: result.httpStatus ? `HTTP ${result.httpStatus} · ${result.responseMs} ms` : result.errorMessage ?? "Aucune réponse HTTP." }); void utils.routeHealth.listExternalLinks.invalidate(); },
    onError: (error) => toast({ title: "Contrôle impossible", description: error.message, variant: "destructive" }),
  });
  const checkAll = trpc.routeHealth.checkAllExternalLinks.useMutation({
    onSuccess: (result) => { toast({ title: "Contrôle terminé", description: `${result.checked} lien(s) vérifié(s).` }); void utils.routeHealth.listExternalLinks.invalidate(); },
    onError: (error) => toast({ title: "Contrôle global impossible", description: error.message, variant: "destructive" }),
  });

  const add404Link = () => {
    const label = newLinkLabel.trim();
    const href = newLinkHref.trim();
    if (!label || !href || (!href.startsWith("/") && !href.startsWith("https://"))) {
      toast({ title: "Lien invalide", description: "Utilisez un libellé et une route interne ou une URL HTTPS.", variant: "destructive" });
      return;
    }
    setLinks((current) => [...current, { label, href }].slice(0, 8));
    setNewLinkLabel(""); setNewLinkHref("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Wrench className="w-5 h-5 text-blue-600" /> Santé des chemins & liens</h2>
          <p className="text-sm text-slate-500">Personnalisez la page 404, surveillez les chemins demandés et contrôlez vos liens HTTPS.</p>
        </div>
        <Button variant="outline" onClick={() => { void configQuery.refetch(); void eventsQuery.refetch(); void linksQuery.refetch(); }} className="gap-2"><RefreshCw className="w-4 h-4" />Actualiser</Button>
      </div>

      <Tabs defaultValue="404-config" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="404-config">Page 404</TabsTrigger>
          <TabsTrigger value="404-events">Erreurs introuvables <Badge className="ml-2" variant="secondary">{eventsQuery.data?.length ?? 0}</Badge></TabsTrigger>
          <TabsTrigger value="external-links">Liens externes <Badge className="ml-2" variant="secondary">{linksQuery.data?.length ?? 0}</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value="404-config" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Contenu de la page d’erreur</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="404-title">Titre</Label><Input id="404-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} /></div>
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">Les routes internes commencent par <code>/</code>. Les liens externes doivent utiliser <code>https://</code>.</div>
              </div>
              <div className="space-y-2"><Label htmlFor="404-message">Message affiché</Label><Textarea id="404-message" value={message} onChange={(event) => setMessage(event.target.value)} rows={4} maxLength={2000} /></div>
              <div className="space-y-3">
                <Label>Liens de redirection utiles</Label>
                <div className="space-y-2">
                  {links.map((link, index) => <div key={`${link.label}-${index}`} className="flex flex-col sm:flex-row gap-2 rounded-lg border p-2"><Input aria-label={`Libellé du lien ${index + 1}`} value={link.label} onChange={(event) => setLinks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} /><Input aria-label={`URL du lien ${index + 1}`} value={link.href} onChange={(event) => setLinks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, href: event.target.value } : item))} /><Button variant="ghost" size="icon" aria-label={`Supprimer le lien ${link.label}`} onClick={() => setLinks((current) => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="w-4 h-4 text-red-600" /></Button></div>)}
                </div>
                <div className="grid gap-2 md:grid-cols-[1fr_2fr_auto]"><Input placeholder="Libellé" value={newLinkLabel} onChange={(event) => setNewLinkLabel(event.target.value)} /><Input placeholder="/evaluation ou https://..." value={newLinkHref} onChange={(event) => setNewLinkHref(event.target.value)} /><Button type="button" variant="outline" onClick={add404Link} className="gap-2"><Plus className="w-4 h-4" />Ajouter</Button></div>
              </div>
              <div className="flex justify-end"><Button onClick={() => saveConfig.mutate({ sessionToken, title, message, links })} disabled={saveConfig.isPending} className="gap-2"><Save className="w-4 h-4" />{saveConfig.isPending ? "Enregistrement…" : "Enregistrer la page 404"}</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="404-events" className="space-y-4 mt-4">
          <Card><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><CardTitle className="text-base">Chemins introuvables les plus récents</CardTitle><Input className="sm:max-w-xs" placeholder="Filtrer un chemin" value={errorSearch} onChange={(event) => setErrorSearch(event.target.value)} /></div></CardHeader><CardContent>
            {filtered404.length === 0 ? <p className="text-sm text-slate-500 py-6 text-center">Aucune erreur 404 enregistrée.</p> : <div className="space-y-2">{filtered404.map((event) => <div key={event.id} className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"><div className="min-w-0"><p className="font-mono text-sm text-slate-800 break-all">{event.path}</p><p className="text-xs text-slate-500">Dernière visite : {new Date(event.lastSeenAt).toLocaleString("fr-FR")} · Référent : {event.referrer || "direct"}</p></div><Badge variant="outline" className="w-fit">{event.occurrenceCount} occurrence(s)</Badge></div>)}</div>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="external-links" className="space-y-4 mt-4">
          <Card><CardHeader><CardTitle className="text-base">Ajouter un lien à surveiller</CardTitle></CardHeader><CardContent><div className="grid gap-2 md:grid-cols-[1fr_2fr_auto]"><Input placeholder="Nom du portail" value={externalLabel} onChange={(event) => setExternalLabel(event.target.value)} /><Input placeholder="https://portail-officiel.example" value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} /><Button onClick={() => addExternalLink.mutate({ sessionToken, url: externalUrl, label: externalLabel })} disabled={addExternalLink.isPending} className="gap-2"><Plus className="w-4 h-4" />Ajouter</Button></div></CardContent></Card>
          <Card><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><CardTitle className="text-base">État des liens externes</CardTitle><Button variant="outline" onClick={() => checkAll.mutate({ sessionToken })} disabled={checkAll.isPending || !(linksQuery.data?.length)} className="gap-2"><Link2 className="w-4 h-4" />{checkAll.isPending ? "Vérification…" : "Vérifier tous les liens"}</Button></div></CardHeader><CardContent><div className="space-y-2">{(linksQuery.data ?? []).map((link) => { const status = link.status as LinkStatus; return <div key={link.id} className="flex flex-col gap-3 rounded-lg border p-3 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><p className="font-medium text-slate-900">{link.label || "Lien externe"}</p><a href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-700 break-all"><ExternalLink className="w-3 h-3 shrink-0" />{link.url}</a><p className="text-xs text-slate-500">{link.checkedAt ? `Contrôlé le ${new Date(link.checkedAt).toLocaleString("fr-FR")}` : "Jamais contrôlé"}{link.errorMessage ? ` · ${link.errorMessage}` : ""}</p></div><div className="flex items-center gap-2"><Badge variant="outline" className={statusClass[status]}>{status === "ok" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : status !== "pending" ? <AlertCircle className="w-3 h-3 mr-1" /> : null}{statusLabel[status]}</Badge><Button size="sm" variant="outline" onClick={() => checkLink.mutate({ sessionToken, id: link.id })} disabled={checkLink.isPending}>Vérifier</Button></div></div>; })}</div></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
