import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { trpc } from "@/lib/trpc";
import { REVIEW_STALE_DAYS, REVIEW_STATE_LABELS, SHARE_TEMPLATES, buildShareMessage, shareLinks } from "@shared/contentKit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Out = inferRouterOutputs<AppRouter>["adminContent"];
type Section = "reviews" | "demand" | "updates" | "share";
const SECTIONS: Array<{ id: Section; label: string }> = [
  { id: "reviews", label: "Fraîcheur des pages" },
  { id: "demand", label: "Ce que les visiteurs cherchent" },
  { id: "updates", label: "Quoi de neuf" },
  { id: "share", label: "Messages à partager" },
];
const STATE_CLASS = { never: "bg-rose-100 text-rose-800", stale: "bg-amber-100 text-amber-900", ok: "bg-emerald-100 text-emerald-800" } as const;

function ReviewsPanel({ sessionToken }: { sessionToken: string }) {
  const utils = trpc.useUtils();
  const query = trpc.adminContent.adminContentReviews.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const [filter, setFilter] = useState<"todo" | "all">("todo");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const refresh = () => { void utils.adminContent.adminContentReviews.invalidate(); };
  const mark = trpc.adminContent.adminMarkReviewed.useMutation({ onSuccess: (result) => { toast.success(`${result.marked} page(s) marquée(s) relue(s)`); setSelected(new Set()); refresh(); }, onError: (error) => toast.error(error.message) });
  const clear = trpc.adminContent.adminClearReview.useMutation({ onSuccess: () => { toast.success("Relecture annulée"); refresh(); }, onError: (error) => toast.error(error.message) });
  const data = query.data as Out["adminContentReviews"] | undefined;
  const rows = useMemo(() => (data?.items ?? []).filter((item) => filter === "all" || item.state !== "ok"), [data, filter]);
  const toggle = (path: string) => setSelected((current) => { const next = new Set(current); if (next.has(path)) next.delete(path); else next.add(path); return next; });
  return (
    <div className="space-y-3" data-testid="content-reviews">
      <p className="text-sm text-slate-700">Une page non relue depuis {REVIEW_STALE_DAYS} jours est « à relire » : les règles de visa changent. Relisez la page en ligne, puis marquez-la relue.</p>
      {query.error && <p className="text-sm text-rose-700" role="alert">{query.error.message}</p>}
      {data && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded bg-rose-100 px-2 py-1 font-bold text-rose-800">{data.never} jamais relues</span>
          <span className="rounded bg-amber-100 px-2 py-1 font-bold text-amber-900">{data.stale} à relire</span>
          <span className="text-slate-600">sur {data.total} pages</span>
          <Button type="button" size="sm" variant={filter === "todo" ? "default" : "outline"} onClick={() => setFilter("todo")}>À faire</Button>
          <Button type="button" size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>Toutes</Button>
          <Button type="button" size="sm" disabled={selected.size === 0 || mark.isPending} onClick={() => mark.mutate({ sessionToken, paths: Array.from(selected), note: null })} data-testid="review-mark">Marquer {selected.size || ""} relue(s)</Button>
        </div>
      )}
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {rows.slice(0, 200).map((item) => (
          <li key={item.path} className="flex items-center gap-3 p-2 text-sm" data-testid={`review-${item.path}`}>
            <input type="checkbox" className="h-5 w-5" checked={selected.has(item.path)} onChange={() => toggle(item.path)} aria-label={`Sélectionner ${item.path}`} />
            <span className="min-w-0 flex-1"><a className="font-semibold text-blue-800 underline" href={item.path} target="_blank" rel="noopener noreferrer">{item.title}</a><span className="block truncate text-xs text-slate-500">{item.path}{item.reviewedAt ? ` · relue le ${new Date(item.reviewedAt).toLocaleDateString("fr-FR")} par ${item.reviewedBy}` : ""}</span></span>
            <span className={`rounded px-2 py-0.5 text-xs font-bold ${STATE_CLASS[item.state]}`}>{REVIEW_STATE_LABELS[item.state]}</span>
            {item.reviewedAt && <Button type="button" size="sm" variant="ghost" onClick={() => clear.mutate({ sessionToken, path: item.path })}>Annuler</Button>}
          </li>
        ))}
        {data && rows.length === 0 && <li className="p-3 text-sm font-semibold text-emerald-800">Toutes les pages sont à jour.</li>}
      </ul>
    </div>
  );
}

function DemandPanel({ sessionToken }: { sessionToken: string }) {
  const query = trpc.adminContent.adminDemand.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const data = query.data as Out["adminDemand"] | undefined;
  return (
    <div className="space-y-4" data-testid="content-demand">
      {query.error && <p className="text-sm text-rose-700" role="alert">{query.error.message}</p>}
      {data && (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-base font-black text-slate-950">Questions les plus posées à l'assistant (90 jours)</h3>
            <p className="mt-1 text-xs text-slate-600">Aucune adresse e-mail n'est affichée. Une question souvent jugée peu utile est la première à traiter.</p>
            <ul className="mt-2 space-y-1 text-sm">{data.questions.map((item) => <li key={item.question} className="border-t border-slate-100 py-1"><strong>{item.count}×</strong> {item.question}{item.unhelpful > 0 && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-900">{item.unhelpful} jugée(s) peu utile(s)</span>}{item.topPage && <span className="ml-2 text-xs text-slate-500">posée surtout sur {item.topPage}</span>}</li>)}{data.questions.length === 0 && <li className="text-slate-600">Aucune question enregistrée sur la période.</li>}</ul>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-base font-black text-slate-950">Destinations les plus visées (comptes des 180 derniers jours)</h3>
            <p className="mt-1 text-xs text-slate-600">{data.candidatesCounted} comptes lus. « À rédiger » = aucun parcours publié pour ce pays : c'est l'ordre de priorité des fiches.</p>
            <ul className="mt-2 space-y-1 text-sm">{data.countries.map((country) => <li key={country.code} className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 py-1" data-testid={`demand-${country.code}`}><span><strong>{country.name}</strong> · {country.demand} compte(s)</span>{country.needsWriting ? <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">À rédiger</span> : <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">Publié : {country.publishedPathways.join(", ")}</span>}</li>)}{data.countries.length === 0 && <li className="text-slate-600">Aucune destination exploitable.</li>}</ul>
          </section>
        </>
      )}
    </div>
  );
}

function UpdatesPanel({ sessionToken }: { sessionToken: string }) {
  const utils = trpc.useUtils();
  const list = trpc.adminContent.adminUpdates.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [path, setPath] = useState("");
  const refresh = () => { void utils.adminContent.adminUpdates.invalidate(); };
  const save = trpc.adminContent.adminSaveUpdate.useMutation({ onSuccess: () => { toast.success("Entrée enregistrée"); setTitle(""); setSummary(""); setPath(""); refresh(); }, onError: (error) => toast.error(error.message) });
  const publish = trpc.adminContent.adminSetUpdatePublished.useMutation({ onSuccess: refresh, onError: (error) => toast.error(error.message) });
  const archive = trpc.adminContent.adminArchiveUpdate.useMutation({ onSuccess: () => { toast.success("Entrée archivée"); refresh(); }, onError: (error) => toast.error(error.message) });
  const rows = (list.data ?? []) as Out["adminUpdates"];
  return (
    <div className="space-y-4" data-testid="content-updates">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-base font-black text-slate-950">Nouvelle entrée « Quoi de neuf »</h3>
        <p className="mt-1 text-sm text-slate-700">Un changement de règle ou de contenu, daté, visible sur la page publique /quoi-de-neuf. Écrivez des faits vérifiés, sans promesse.</p>
        <div className="mt-3 space-y-2">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titre (5 caractères minimum)" aria-label="Titre" />
          <Textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Ce qui a changé, en deux ou trois phrases (20 caractères minimum)" aria-label="Résumé" className="min-h-20" />
          <Input value={path} onChange={(event) => setPath(event.target.value)} placeholder="Page concernée (facultatif), ex. /guides/budget-vie-a-letranger" aria-label="Page concernée" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" className="min-h-10" disabled={title.trim().length < 5 || summary.trim().length < 20 || save.isPending} onClick={() => save.mutate({ sessionToken, title: title.trim(), summary: summary.trim(), pagePath: path.trim() || null, publish: true })} data-testid="update-publish">Publier</Button>
          <Button type="button" variant="outline" className="min-h-10" disabled={title.trim().length < 5 || summary.trim().length < 20 || save.isPending} onClick={() => save.mutate({ sessionToken, title: title.trim(), summary: summary.trim(), pagePath: path.trim() || null, publish: false })}>Enregistrer en brouillon</Button>
        </div>
      </section>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm" data-testid={`update-${row.id}`}>
            <div className="flex flex-wrap items-center justify-between gap-2"><strong>{row.title}</strong><span className={`rounded px-2 py-0.5 text-xs font-bold ${row.published ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{row.published ? "Publié" : "Brouillon"}</span></div>
            <p className="mt-1 text-slate-700">{row.summary}</p>
            <div className="mt-2 flex gap-2"><Button type="button" size="sm" variant="outline" onClick={() => publish.mutate({ sessionToken, id: row.id, published: !row.published })}>{row.published ? "Dépublier" : "Publier"}</Button><Button type="button" size="sm" variant="ghost" onClick={() => { if (window.confirm("Archiver cette entrée ?")) archive.mutate({ sessionToken, id: row.id }); }}>Archiver</Button></div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SharePanel() {
  const [template, setTemplate] = useState(SHARE_TEMPLATES[0].id);
  const [destination, setDestination] = useState("");
  const message = buildShareMessage(template, destination);
  const links = shareLinks(message);
  const copy = async () => { try { await navigator.clipboard.writeText(message); toast.success("Message copié"); } catch { toast.error("Copie impossible : sélectionnez le texte à la main."); } };
  return (
    <div className="space-y-3" data-testid="content-share">
      <p className="text-sm text-slate-700">Messages prêts pour WhatsApp et Facebook. Ils renvoient uniquement vers des outils gratuits réels, sans promesse, sans chiffre et sans témoignage.</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <select className="h-10 rounded-md border border-slate-300 bg-white px-2 text-sm" aria-label="Modèle de message" value={template} onChange={(event) => setTemplate(event.target.value)}>{SHARE_TEMPLATES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
        <Input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Destination (facultatif) : Canada, France…" aria-label="Destination" />
      </div>
      <Textarea readOnly value={message} className="min-h-24" aria-label="Message à partager" data-testid="share-message" />
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => { void copy(); }}>Copier</Button>
        <Button asChild variant="outline"><a href={links.whatsapp} target="_blank" rel="noopener noreferrer" data-testid="share-whatsapp">WhatsApp</a></Button>
        <Button asChild variant="outline"><a href={links.facebook} target="_blank" rel="noopener noreferrer">Facebook</a></Button>
      </div>
    </div>
  );
}

/** Contenu du site : fraîcheur des pages, demande réelle des visiteurs, « Quoi de neuf » et messages à partager. */
export function AdminContent({ sessionToken }: { sessionToken: string }) {
  const [section, setSection] = useState<Section>("reviews");
  return (
    <div className="space-y-4" data-testid="admin-content">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Contenu du site">
        {SECTIONS.map((item) => <Button key={item.id} type="button" size="sm" role="tab" aria-selected={section === item.id} variant={section === item.id ? "default" : "outline"} onClick={() => setSection(item.id)} data-testid={`content-tab-${item.id}`}>{item.label}</Button>)}
      </div>
      {section === "reviews" && <ReviewsPanel sessionToken={sessionToken} />}
      {section === "demand" && <DemandPanel sessionToken={sessionToken} />}
      {section === "updates" && <UpdatesPanel sessionToken={sessionToken} />}
      {section === "share" && <SharePanel />}
    </div>
  );
}
