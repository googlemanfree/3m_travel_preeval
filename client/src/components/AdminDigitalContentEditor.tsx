import { useEffect, useState } from "react";
import { FilePenLine, Loader2, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Props = { sessionToken: string };
type Draft = { heroTitle: string; heroDescription: string; serviceIntro: string; requestIntro: string; serviceDefinitionsJson: string; pricingJson: string };

export default function AdminDigitalContentEditor({ sessionToken }: Props) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.digitalServices.adminGetContent.useQuery({ sessionToken }, { retry: false });
  const [draft, setDraft] = useState<Draft | null>(null);
  useEffect(() => { if (data) setDraft({ heroTitle: data.heroTitle, heroDescription: data.heroDescription, serviceIntro: data.serviceIntro, requestIntro: data.requestIntro, serviceDefinitionsJson: data.serviceDefinitionsJson, pricingJson: data.pricingJson }); }, [data]);
  const saveContent = trpc.digitalServices.adminUpdateContent.useMutation({
    onSuccess: () => { utils.digitalServices.getContent.invalidate(); utils.digitalServices.adminGetContent.invalidate({ sessionToken }); toast.success("Contenu 3M Digital enregistré."); },
    onError: (error) => toast.error(error.message || "Enregistrement du contenu impossible."),
  });
  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => current ? { ...current, [key]: value } : current);

  return <Card className="mt-7 border-blue-100 bg-white p-5 sm:p-6"><div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><div className="rounded-xl bg-blue-100 p-2.5 text-blue-700"><FilePenLine className="h-5 w-5" /></div><div><h2 className="font-black text-slate-950">Contenu publié de la sous-page</h2><p className="text-sm text-slate-600">Les changements sont visibles sur la page 3M Digital après enregistrement.</p></div></div><a href="/3m-digital" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-700 hover:text-blue-900">Prévisualiser la page</a></div>{isLoading || !draft ? <div className="flex h-36 items-center gap-2 text-slate-600"><Loader2 className="h-5 w-5 animate-spin" /> Chargement du contenu…</div> : <div className="mt-5 space-y-4"><div><label className="text-sm font-bold" htmlFor="digital-hero-title">Titre principal</label><Input id="digital-hero-title" className="mt-1.5" value={draft.heroTitle} onChange={(event) => update("heroTitle", event.target.value)} /></div><div><label className="text-sm font-bold" htmlFor="digital-hero-description">Introduction</label><Textarea id="digital-hero-description" className="mt-1.5" rows={3} value={draft.heroDescription} onChange={(event) => update("heroDescription", event.target.value)} /></div><div className="grid gap-4 lg:grid-cols-2"><div><label className="text-sm font-bold" htmlFor="digital-service-intro">Introduction des pôles</label><Textarea id="digital-service-intro" className="mt-1.5" rows={4} value={draft.serviceIntro} onChange={(event) => update("serviceIntro", event.target.value)} /></div><div><label className="text-sm font-bold" htmlFor="digital-request-intro">Introduction du formulaire</label><Textarea id="digital-request-intro" className="mt-1.5" rows={4} value={draft.requestIntro} onChange={(event) => update("requestIntro", event.target.value)} /></div></div><div><label className="text-sm font-bold" htmlFor="digital-service-definitions">Pôles de service <span className="font-normal text-slate-500">(JSON : 4 objets title, description, points)</span></label><Textarea id="digital-service-definitions" className="mt-1.5 min-h-48 font-mono text-xs" value={draft.serviceDefinitionsJson} onChange={(event) => update("serviceDefinitionsJson", event.target.value)} /></div><div><label className="text-sm font-bold" htmlFor="digital-pricing">Grille de cadrage <span className="font-normal text-slate-500">(JSON : title, subtitle, launchRange, annualRange, delivery, points)</span></label><p className="mt-1 text-xs leading-5 text-amber-700">Ces montants restent des estimations de cadrage à confirmer par un devis 3M Digital ; ils ne créent aucun engagement automatique.</p><Textarea id="digital-pricing" className="mt-1.5 min-h-56 font-mono text-xs" value={draft.pricingJson} onChange={(event) => update("pricingJson", event.target.value)} /></div><Button onClick={() => saveContent.mutate({ sessionToken, content: draft })} disabled={saveContent.isPending} className="bg-blue-700 hover:bg-blue-800"><Save className="mr-2 h-4 w-4" />{saveContent.isPending ? "Enregistrement…" : "Publier le contenu"}</Button></div>}</Card>;
}
