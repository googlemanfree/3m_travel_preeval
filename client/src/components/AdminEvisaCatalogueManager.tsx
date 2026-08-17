import { useMemo, useState } from "react";
import { CheckCircle2, Edit3, Globe2, Plus, Search, ShieldAlert, Sparkles, Trash2, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { evisasDatabaseComplete } from "@/data/evisasDatabaseComplete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ManagedEntry = {
  id?: number;
  slug: string; country: string; capital: string; flag: string; region: string; visaType: string; duration: string; delay: string;
  requirements: string; fee: string; notes: string; imageUrl?: string; officialPortalUrl: string; officialPortalLabel: string;
  officialVerifiedAt: string; highlights: string[]; emblems: string[]; steps: string[]; isActive: boolean;
};
type AiSuggestion = { requirements: string[]; feeSuggestion: string; delaySuggestion: string; procedureSteps: string[]; precautions: string[]; adminReviewNote: string; requiresOfficialVerification: true };

const blankEntry = (): ManagedEntry => ({ slug: "", country: "", capital: "", flag: "🏳️", region: "Afrique", visaType: "e‑Visa", duration: "À confirmer", delay: "À confirmer", requirements: "", fee: "À confirmer", notes: "", imageUrl: "", officialPortalUrl: "https://", officialPortalLabel: "Portail officiel", officialVerifiedAt: new Date().toLocaleDateString("fr-FR"), highlights: [], emblems: [], steps: ["Vérifier l’éligibilité sur le portail officiel"], isActive: true });
const splitLines = (value: string) => value.split("\n").map((item) => item.trim()).filter(Boolean);
const joinLines = (value?: string[]) => (value ?? []).join("\n");

export function AdminEvisaCatalogueManager({ sessionToken }: { sessionToken: string }) {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ManagedEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedEntry | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const { data: managed = [], isLoading } = trpc.evisaCatalogue.listAdmin.useQuery({ sessionToken, includeInactive: true }, { enabled: Boolean(sessionToken) });
  const upsert = trpc.evisaCatalogue.upsert.useMutation({ onSuccess: async () => { await utils.evisaCatalogue.listAdmin.invalidate(); await utils.evisaCatalogue.getPublicOverrides.invalidate(); setEditing(null); toast.success("Catalogue e‑Visa enregistré"); }, onError: (error) => toast.error("Enregistrement impossible", { description: error.message }) });
  const setActive = trpc.evisaCatalogue.setActive.useMutation({ onSuccess: async () => { await utils.evisaCatalogue.listAdmin.invalidate(); await utils.evisaCatalogue.getPublicOverrides.invalidate(); toast.success("Visibilité de la destination mise à jour"); }, onError: (error) => toast.error("Action impossible", { description: error.message }) });
  const remove = trpc.evisaCatalogue.delete.useMutation({ onSuccess: async () => { await utils.evisaCatalogue.listAdmin.invalidate(); await utils.evisaCatalogue.getPublicOverrides.invalidate(); setDeleteTarget(null); toast.success("Surcharge e‑Visa supprimée"); }, onError: (error) => toast.error("Suppression impossible", { description: error.message }) });
  const assist = trpc.evisaCatalogue.suggestWithAI.useMutation({ onSuccess: (suggestion) => { setAiSuggestion(suggestion as AiSuggestion); toast.success("Brouillon IA prêt", { description: "Relisez les propositions puis appliquez uniquement les éléments utiles." }); }, onError: (error) => toast.error("Assistance IA indisponible", { description: error.message }) });

  const merged = useMemo(() => {
    const bySlug = new Map(managed.map((item: any) => [item.slug, item]));
    const standards = evisasDatabaseComplete.map((entry) => {
      const override: any = bySlug.get(entry.id);
      return override ? override : { ...entry, slug: entry.id, visaType: entry.type, requirements: entry.docs, notes: entry.note, imageUrl: entry.image, highlights: entry.highlights, emblems: entry.emblems, steps: entry.steps, isActive: true };
    });
    const customs = managed.filter((item: any) => !evisasDatabaseComplete.some((entry) => entry.id === item.slug));
    return [...standards, ...customs] as ManagedEntry[];
  }, [managed]);
  const visible = merged.filter((item) => `${item.country} ${item.region} ${item.requirements}`.toLowerCase().includes(search.toLowerCase()));

  const save = () => {
    if (!editing) return;
    upsert.mutate({ sessionToken, destination: editing });
  };
  const requestSuggestion = () => {
    if (!editing) return;
    setAiSuggestion(null);
    assist.mutate({ sessionToken, country: editing.country, region: editing.region, visaType: editing.visaType, officialPortalUrl: editing.officialPortalUrl, officialVerifiedAt: editing.officialVerifiedAt, currentRequirements: editing.requirements, currentFee: editing.fee, currentDelay: editing.delay, currentNotes: editing.notes });
  };
  const applySuggestion = () => {
    if (!editing || !aiSuggestion) return;
    setEditing({ ...editing, requirements: aiSuggestion.requirements.join("\n"), fee: aiSuggestion.feeSuggestion, delay: aiSuggestion.delaySuggestion, steps: aiSuggestion.procedureSteps, notes: [editing.notes, "\nPrécautions suggérées par l’IA — à vérifier :", ...aiSuggestion.precautions].filter(Boolean).join("\n") });
    setAiSuggestion(null);
    toast.success("Suggestion IA appliquée au brouillon", { description: "Le formulaire reste modifiable et aucun changement n’est enregistré automatiquement." });
  };

  return <section className="space-y-5">
    <div className="flex flex-col justify-between gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-5 lg:flex-row lg:items-center">
      <div><h2 className="flex items-center gap-2 text-xl font-bold text-slate-900"><Globe2 className="h-5 w-5 text-blue-700" />Catalogue e‑Visa administrable</h2><p className="mt-1 max-w-3xl text-sm text-slate-600">Les exigences, le portail officiel et la date de vérification sont modifiables. Chaque mutation est réservée aux administrateurs et inscrite dans le journal d’audit.</p></div>
      <Button onClick={() => setEditing(blankEntry())}><Plus className="mr-2 h-4 w-4" />Ajouter un pays</Button>
    </div>
    <div className="flex items-center gap-2"><Search className="h-4 w-4 text-slate-500" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un pays, une région ou une exigence…" className="max-w-xl" /><Badge variant="outline">{visible.length} fiche(s)</Badge></div>
    <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full min-w-[920px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-3">Pays</th><th className="p-3">Exigences</th><th className="p-3">Portail / vérification</th><th className="p-3">Statut</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>{isLoading ? <tr><td className="p-6 text-slate-500" colSpan={5}>Chargement du catalogue…</td></tr> : visible.map((item) => <tr key={item.slug} className="border-t align-top"><td className="p-3"><p className="font-semibold text-slate-900">{item.flag} {item.country}</p><p className="text-xs text-slate-500">{item.region} · {item.visaType}</p></td><td className="max-w-[280px] p-3 text-xs text-slate-600">{item.requirements}</td><td className="p-3"><a className="text-xs font-medium text-blue-700 underline" href={item.officialPortalUrl} target="_blank" rel="noreferrer">{item.officialPortalLabel}</a><p className="mt-1 text-xs text-slate-500">Vérifié le {item.officialVerifiedAt}</p></td><td className="p-3">{item.isActive ? <Badge className="bg-emerald-100 text-emerald-800"><CheckCircle2 className="mr-1 h-3 w-3" />Actif</Badge> : <Badge className="bg-slate-100 text-slate-700"><XCircle className="mr-1 h-3 w-3" />Masqué</Badge>}</td><td className="p-3 text-right"><div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setEditing({ ...item, imageUrl: item.imageUrl ?? "", highlights: item.highlights ?? [], emblems: item.emblems ?? [], steps: item.steps ?? [] })}><Edit3 className="mr-1 h-3.5 w-3.5" />Modifier</Button>{item.id ? <><Button variant="outline" size="sm" onClick={() => setActive.mutate({ sessionToken, id: item.id!, isActive: !item.isActive })}>{item.isActive ? "Masquer" : "Réactiver"}</Button><Button variant="outline" size="sm" className="text-rose-700" onClick={() => setDeleteTarget(item)}><Trash2 className="mr-1 h-3.5 w-3.5" />Supprimer</Button></> : null}</div></td></tr>)}</tbody></table></div>

    <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}><DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto"><DialogHeader><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><DialogTitle>{editing?.id ? `Modifier ${editing.country}` : "Ajouter une destination e‑Visa"}</DialogTitle><DialogDescription>Les données seront visibles dans le catalogue administrable. Vérifiez le portail officiel et la date avant l’enregistrement.</DialogDescription></div>{editing && <Button type="button" variant="outline" disabled={assist.isPending || editing.country.trim().length < 2 || !editing.officialPortalUrl.startsWith("https://")} onClick={requestSuggestion}><Sparkles className="mr-2 h-4 w-4 text-violet-600" />{assist.isPending ? "Analyse IA…" : "Assistance IA"}</Button>}</div></DialogHeader>{editing && <div className="grid gap-4 py-2 md:grid-cols-2">{aiSuggestion && <div className="md:col-span-2 rounded-xl border border-violet-200 bg-violet-50 p-4"><p className="flex items-center gap-2 font-semibold text-violet-950"><Sparkles className="h-4 w-4" />Suggestion IA à relire</p><p className="mt-1 text-sm text-violet-900">{aiSuggestion.adminReviewNote}</p><div className="mt-3 grid gap-3 text-sm md:grid-cols-2"><div><p className="font-medium">Exigences proposées</p><ul className="mt-1 list-disc pl-5 text-slate-700">{aiSuggestion.requirements.map((item) => <li key={item}>{item}</li>)}</ul></div><div><p className="font-medium">Frais / délai indicatifs</p><p className="mt-1 text-slate-700">{aiSuggestion.feeSuggestion}</p><p className="text-slate-700">{aiSuggestion.delaySuggestion}</p></div></div><div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-violet-800">À confirmer sur le portail officiel avant publication.</span><Button type="button" size="sm" onClick={applySuggestion}>Appliquer au brouillon</Button></div></div>}<Field label="Identifiant stable" value={editing.slug} onChange={(slug) => setEditing({ ...editing, slug })} placeholder="ex. kenya" /><Field label="Pays" value={editing.country} onChange={(country) => setEditing({ ...editing, country })} /><Field label="Capitale" value={editing.capital} onChange={(capital) => setEditing({ ...editing, capital })} /><Field label="Drapeau" value={editing.flag} onChange={(flag) => setEditing({ ...editing, flag })} /><Field label="Région" value={editing.region} onChange={(region) => setEditing({ ...editing, region })} /><Field label="Type e‑Visa" value={editing.visaType} onChange={(visaType) => setEditing({ ...editing, visaType })} /><Field label="Durée" value={editing.duration} onChange={(duration) => setEditing({ ...editing, duration })} /><Field label="Délai indicatif" value={editing.delay} onChange={(delay) => setEditing({ ...editing, delay })} /><Field label="Frais indicatifs" value={editing.fee} onChange={(fee) => setEditing({ ...editing, fee })} /><Field label="Date de vérification" value={editing.officialVerifiedAt} onChange={(officialVerifiedAt) => setEditing({ ...editing, officialVerifiedAt })} /><div className="md:col-span-2"><Field label="Portail officiel HTTPS" value={editing.officialPortalUrl} onChange={(officialPortalUrl) => setEditing({ ...editing, officialPortalUrl })} /><Field label="Libellé du portail" value={editing.officialPortalLabel} onChange={(officialPortalLabel) => setEditing({ ...editing, officialPortalLabel })} /></div><Area label="Exigences principales" value={editing.requirements} onChange={(requirements) => setEditing({ ...editing, requirements })} /><Area label="Note et limites d’éligibilité" value={editing.notes} onChange={(notes) => setEditing({ ...editing, notes })} /><Area label="Étapes de procédure (une ligne par étape)" value={joinLines(editing.steps)} onChange={(value) => setEditing({ ...editing, steps: splitLines(value) })} /><Area label="Points clés (une ligne par élément)" value={joinLines(editing.highlights)} onChange={(value) => setEditing({ ...editing, highlights: splitLines(value) })} /><div className="md:col-span-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><ShieldAlert className="h-4 w-4 shrink-0" />Les exigences sont informatives : ne publiez pas une éligibilité individuelle ou un délai garanti.</div></div>}<DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button><Button disabled={upsert.isPending} onClick={save}>{upsert.isPending ? "Enregistrement…" : "Enregistrer la destination"}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}><DialogContent><DialogHeader><DialogTitle>Supprimer cette surcharge e‑Visa ?</DialogTitle><DialogDescription>Cette action supprime la fiche administrée. Si elle remplaçait une fiche standard, la fiche standard redeviendra visible. Les messages et instantanés déjà partagés ne sont pas modifiés.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button><Button variant="destructive" disabled={remove.isPending} onClick={() => deleteTarget?.id && remove.mutate({ sessionToken, id: deleteTarget.id, confirmation: "SUPPRIMER" })}>Supprimer définitivement</Button></DialogFooter></DialogContent></Dialog>
  </section>;
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) { return <div className="space-y-1"><Label>{label}</Label><Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></div>; }
function Area({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <div className="space-y-1 md:col-span-2"><Label>{label}</Label><Textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} /></div>; }
