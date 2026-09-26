import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

type Item = {
  kind: "agency_pre_dossier" | "account";
  id: number;
  reference: string;
  fullName: string;
  email: string;
  phone: string | null;
  createdAt: string | null;
  confidence: "certain" | "probable";
  reason: string;
  activeDossierReference: string;
  activeDossierStatus: string;
};

const keyOf = (item: Pick<Item, "kind" | "id">) => `${item.kind}:${item.id}`;
const KIND_LABEL: Record<Item["kind"], string> = { agency_pre_dossier: "Pré-dossier agence", account: "Compte sans dossier" };

/**
 * Pré-comptes redondants : la personne a déjà un dossier actif. Aperçu d'abord (rien n'est modifié), les cas certains sont
 * présélectionnés, les cas probables restent à cocher un par un. La suppression est une mise en corbeille RÉVERSIBLE.
 */
export default function AdminRedundantPreAccountsPanel({ sessionToken }: { sessionToken: string }) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const query = trpc.adminCandidateManagement.listRedundantPreAccounts.useQuery({ sessionToken }, { enabled: Boolean(sessionToken), retry: false });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const items = (query.data?.items ?? []) as Item[];

  // Les cas certains sont présélectionnés à chaque nouveau chargement ; les cas probables ne le sont jamais.
  useEffect(() => {
    setSelected(new Set(items.filter((item) => item.confidence === "certain").map(keyOf)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data]);

  const mutation = trpc.adminCandidateManagement.archiveRedundantPreAccounts.useMutation({
    onSuccess: (result) => {
      toast({ title: `${result.archivedCount} pré-compte(s) placé(s) dans la corbeille`, description: result.skippedCount > 0 ? `${result.skippedCount} élément(s) ignoré(s) : ils ne sont plus redondants.` : result.message });
      void utils.adminCandidateManagement.listRedundantPreAccounts.invalidate();
      void utils.adminCandidateManagement.listPreDossierAccounts.invalidate();
    },
    onError: (error) => toast({ title: "Mise en corbeille refusée", description: error.message, variant: "destructive" }),
  });

  const chosen = useMemo(() => items.filter((item) => selected.has(keyOf(item))), [items, selected]);
  const toggle = (item: Item) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(keyOf(item))) next.delete(keyOf(item)); else next.add(keyOf(item));
    return next;
  });

  const archive = () => {
    if (chosen.length === 0) return;
    const probable = chosen.filter((item) => item.confidence === "probable").length;
    const message = `Placer ${chosen.length} pré-compte(s) dans la corbeille ?${probable > 0 ? `\n\nAttention : ${probable} correspondance(s) probable(s) (même téléphone, nom proche) : vérifiez-les avant de continuer.` : ""}\n\nL’opération est réversible : les éléments restent restaurables depuis la corbeille de l’administration.`;
    if (!window.confirm(message)) return;
    mutation.mutate({ sessionToken, items: chosen.map((item) => ({ kind: item.kind, id: item.id })), confirmation: "CORBEILLE" });
  };

  if (query.isLoading) return <Card className="p-4 text-sm text-slate-500">Recherche des pré-comptes redondants…</Card>;
  if (query.error) return <Card className="p-4 text-sm text-rose-700">Analyse impossible : {query.error.message}</Card>;

  return (
    <Card className="border-amber-200 bg-amber-50/40" data-testid="redundant-pre-accounts">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-950">Pré-comptes déjà couverts par un dossier actif</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">Pré-dossiers ou comptes sans dossier dont la personne a déjà un dossier actif (même adresse e-mail, ou même téléphone et nom très proche). Les comptes de connexion qui possèdent leur propre dossier ne sont jamais proposés.</p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-emerald-100 text-emerald-800">{query.data?.certain ?? 0} certain(s)</Badge>
            <Badge className="bg-amber-100 text-amber-900">{query.data?.probable ?? 0} probable(s)</Badge>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="flex items-center gap-2 rounded-lg bg-white p-4 text-sm text-emerald-800"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Aucun pré-compte redondant : tout est propre.</p>
        ) : (
          <>
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={keyOf(item)} className={`flex items-start gap-3 rounded-xl border bg-white p-3 ${item.confidence === "certain" ? "border-emerald-200" : "border-amber-300"}`} data-testid="redundant-row" data-confidence={item.confidence}>
                  <input type="checkbox" className="mt-1 h-4 w-4" checked={selected.has(keyOf(item))} onChange={() => toggle(item)} aria-label={`Sélectionner ${item.fullName} (${item.reference})`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">{item.fullName} <span className="font-mono text-xs font-normal text-slate-500">{item.reference}</span></p>
                    <p className="truncate text-xs text-slate-500">{KIND_LABEL[item.kind]} · {item.email}{item.phone ? ` · ${item.phone}` : ""}</p>
                    <p className="mt-1 text-xs text-slate-700">{item.reason}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge className={item.confidence === "certain" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}>{item.confidence === "certain" ? "Certain" : "À vérifier"}</Badge>
                    <p className="mt-1 font-mono text-[11px] text-slate-500">{item.activeDossierReference}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="destructive" disabled={chosen.length === 0 || mutation.isPending} onClick={archive} className="gap-2"><Trash2 className="h-4 w-4" aria-hidden="true" />{mutation.isPending ? "Mise en corbeille…" : `Mettre ${chosen.length} pré-compte(s) en corbeille`}</Button>
              <p className="flex items-center gap-1.5 text-xs text-slate-600"><AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />Réversible : restauration possible depuis la corbeille. Chaque mise en corbeille est journalisée.</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
