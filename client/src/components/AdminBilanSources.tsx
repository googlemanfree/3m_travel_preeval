import { useState } from "react";
import { toast } from "sonner";
import { getAdminSessionToken } from "@/lib/adminSession";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const COUNTRIES = ["Luxembourg", "Lituanie", "Pologne", "Italie", "Serbie", "Grèce", "Canada"];
const today = () => new Date().toISOString().slice(0, 10);

/**
 * Référentiel de sources du bilan : l'agence y saisit offres et repères salariaux, datés et sourcés. Seules les entrées actives,
 * récentes et à adresse https alimentent un bilan ; sans source, le bilan indique « salaire à documenter » (aucun montant inventé).
 */
export default function AdminBilanSources() {
  const sessionToken = getAdminSessionToken();
  const utils = trpc.useUtils();
  const list = trpc.adminBilanAuto.listSources.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const refresh = () => utils.adminBilanAuto.listSources.invalidate();
  const create = trpc.adminBilanAuto.createSource.useMutation({ onSuccess: () => { toast.success("Source enregistrée."); void refresh(); setForm(initial); }, onError: (error) => toast.error(error.message) });
  const toggle = trpc.adminBilanAuto.setSourceActive.useMutation({ onSuccess: () => void refresh(), onError: (error) => toast.error(error.message) });
  const remove = trpc.adminBilanAuto.deleteSource.useMutation({ onSuccess: () => void refresh(), onError: (error) => toast.error(error.message) });
  const initial = { country: "Luxembourg", kind: "salaire" as "offre" | "salaire", occupation: "", employer: "", city: "", amountMin: "", amountMax: "", currency: "EUR", period: "mois" as "heure" | "jour" | "mois" | "an", grossOrNet: "brut" as "" | "brut" | "net", geography: "", url: "", title: "", observedAt: today(), remote: false };
  const [form, setForm] = useState(initial);
  const set = (key: keyof typeof initial) => (event: { target: { value: string } }) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const num = (value: string) => (value.trim() === "" ? null : Number(value));
    create.mutate({
      sessionToken,
      source: {
        country: form.country, kind: form.kind, occupation: form.occupation, employer: form.employer || null, city: form.city || null,
        amountMin: form.kind === "salaire" ? num(form.amountMin) : null, amountMax: form.kind === "salaire" ? num(form.amountMax) : null,
        currency: form.kind === "salaire" ? form.currency : null, period: form.kind === "salaire" ? form.period : null, grossOrNet: form.kind === "salaire" ? form.grossOrNet || null : null,
        geography: form.geography || null, url: form.url, title: form.title, observedAt: form.observedAt, remoteRecruiting: form.remote ? "confirmee" : "non_confirmee",
      } as never,
    });
  };

  return (
    <details className="rounded-lg border border-slate-200 bg-white p-4" data-testid="bilan-sources">
      <summary className="cursor-pointer text-base font-bold text-slate-950">Sources des orientations (offres et repères salariaux)</summary>
      <p className="mt-2 text-xs text-slate-600">Seules les sources actives, à adresse https, datées et récentes (180 jours) apparaissent dans un bilan. Le brut ou le net est repris tel que saisi : aucune conversion.</p>
      <form className="mt-3 grid gap-2 sm:grid-cols-2" onSubmit={submit}>
        <label className="text-xs font-semibold">Pays
          <select className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm" value={form.country} onChange={set("country")}>{COUNTRIES.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <label className="text-xs font-semibold">Type
          <select className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm" value={form.kind} onChange={set("kind")}><option value="salaire">Repère salarial</option><option value="offre">Offre repérée</option></select>
        </label>
        <label className="text-xs font-semibold sm:col-span-2">Métier / intitulé<Input className="mt-1" value={form.occupation} onChange={set("occupation")} required minLength={2} maxLength={160} /></label>
        {form.kind === "offre" ? (
          <>
            <label className="text-xs font-semibold">Employeur<Input className="mt-1" value={form.employer} onChange={set("employer")} required maxLength={160} /></label>
            <label className="text-xs font-semibold">Ville<Input className="mt-1" value={form.city} onChange={set("city")} maxLength={120} /></label>
            <label className="flex items-center gap-2 text-xs font-semibold sm:col-span-2"><input type="checkbox" checked={form.remote} onChange={(event) => setForm((current) => ({ ...current, remote: event.target.checked }))} />L'annonce mentionne explicitement le recrutement depuis l'étranger (sinon : non confirmé)</label>
          </>
        ) : (
          <>
            <label className="text-xs font-semibold">Montant minimum<Input className="mt-1" type="number" min={0} value={form.amountMin} onChange={set("amountMin")} /></label>
            <label className="text-xs font-semibold">Montant maximum<Input className="mt-1" type="number" min={0} value={form.amountMax} onChange={set("amountMax")} /></label>
            <label className="text-xs font-semibold">Devise<Input className="mt-1" value={form.currency} onChange={set("currency")} maxLength={3} required /></label>
            <label className="text-xs font-semibold">Période
              <select className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm" value={form.period} onChange={set("period")}><option value="heure">par heure</option><option value="jour">par jour</option><option value="mois">par mois</option><option value="an">par an</option></select>
            </label>
            <label className="text-xs font-semibold">Brut ou net
              <select className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm" value={form.grossOrNet} onChange={set("grossOrNet")}><option value="brut">brut</option><option value="net">net</option><option value="">non précisé</option></select>
            </label>
            <label className="text-xs font-semibold">Zone géographique<Input className="mt-1" value={form.geography} onChange={set("geography")} maxLength={120} /></label>
          </>
        )}
        <label className="text-xs font-semibold sm:col-span-2">Adresse de la source (https)<Input className="mt-1" type="url" value={form.url} onChange={set("url")} required maxLength={700} /></label>
        <label className="text-xs font-semibold">Titre de la source<Input className="mt-1" value={form.title} onChange={set("title")} required minLength={3} maxLength={200} /></label>
        <label className="text-xs font-semibold">Date de consultation<Input className="mt-1" type="date" max={today()} value={form.observedAt} onChange={set("observedAt")} required /></label>
        <div className="sm:col-span-2"><Button type="submit" disabled={create.isPending}>Enregistrer la source</Button></div>
      </form>
      <ul className="mt-4 space-y-2" aria-label="Sources enregistrées">
        {list.error && <li className="text-xs text-slate-600">Le bilan automatisé n'est pas activé : le référentiel n'est pas disponible.</li>}
        {(list.data ?? []).map((entry) => (
          <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 p-2 text-xs">
            <span><Badge variant="outline">{entry.country}</Badge> <strong>{entry.kind === "offre" ? "Offre" : "Salaire"}</strong> · {entry.occupation} · consultée le {entry.observedAt}{entry.active ? "" : " · désactivée"}</span>
            <span className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => toggle.mutate({ sessionToken, id: entry.id, active: !entry.active })}>{entry.active ? "Désactiver" : "Réactiver"}</Button>
              <Button size="sm" variant="outline" onClick={() => { if (window.confirm("Supprimer cette source ?")) remove.mutate({ sessionToken, id: entry.id }); }}>Supprimer</Button>
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
