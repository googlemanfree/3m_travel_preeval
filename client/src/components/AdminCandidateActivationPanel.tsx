import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, CheckCircle2, Clock3, Mail, RefreshCw, Search, Send } from "lucide-react";

const STATUS_LABELS = {
  pending: { label: "En attente", className: "bg-amber-50 text-amber-800 border-amber-200" },
  failed: { label: "Échec d’envoi", className: "bg-red-50 text-red-800 border-red-200" },
  expired: { label: "Lien expiré", className: "bg-slate-100 text-slate-700 border-slate-200" },
} as const;

type StatusFilter = keyof typeof STATUS_LABELS | "all";

function formatDate(value: Date | string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export default function AdminCandidateActivationPanel({ sessionToken }: { sessionToken: string }) {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const input = useMemo(() => ({
    sessionToken,
    page,
    pageSize,
    status,
    search: search.trim(),
  }), [sessionToken, page, pageSize, status, search]);

  const query = trpc.adminActivation.list.useQuery(input, {
    enabled: Boolean(sessionToken),
    refetchInterval: 30_000,
  });
  const utils = trpc.useUtils();
  const resendMutation = trpc.adminActivation.resend.useMutation({
    onSuccess: () => {
      toast({ title: "Lien renvoyé", description: "Le nouveau lien d’activation a été envoyé si le transport e-mail l’a accepté." });
      void utils.adminActivation.list.invalidate();
    },
    onError: (error) => {
      toast({ title: "Renvoi impossible", description: error.message, variant: "destructive" });
    },
  });

  const data = query.data;
  const totalPages = data?.pages ?? 1;

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardContent className="p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" /> Activations de comptes candidats
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Suivez les comptes non confirmés sans exposer les tokens d’activation.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void query.refetch()} disabled={query.isFetching} className="gap-2 shrink-0">
            <RefreshCw className={`w-4 h-4 ${query.isFetching ? "animate-spin" : ""}`} /> Actualiser
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Total affiché</p>
            <p className="text-2xl font-bold text-slate-900">{data?.total ?? "—"}</p>
          </div>
          <div className="rounded-xl border bg-amber-50 border-amber-100 p-3">
            <p className="text-xs text-amber-700 flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" /> En attente</p>
            <p className="text-2xl font-bold text-amber-900">{data?.counts.pending ?? "—"}</p>
          </div>
          <div className="rounded-xl border bg-red-50 border-red-100 p-3">
            <p className="text-xs text-red-700 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Échecs</p>
            <p className="text-2xl font-bold text-red-900">{data?.counts.failed ?? "—"}</p>
          </div>
          <div className="rounded-xl border bg-slate-100 border-slate-200 p-3">
            <p className="text-xs text-slate-600 flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" /> Expirés</p>
            <p className="text-2xl font-bold text-slate-800">{data?.counts.expired ?? "—"}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Rechercher par nom ou e-mail…"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(value) => { setStatus(value as StatusFilter); setPage(1); }}>
            <SelectTrigger className="w-full md:w-52"><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="failed">Échec d’envoi</SelectItem>
              <SelectItem value="expired">Lien expiré</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); setPage(1); }}>
            <SelectTrigger className="w-full md:w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="25">25 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
              <SelectItem value="100">100 / page</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {query.isLoading ? (
          <div className="py-12 text-center text-sm text-gray-500"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />Chargement des activations…</div>
        ) : query.isError ? (
          <div className="py-8 text-center text-sm text-red-700 border border-red-200 bg-red-50 rounded-xl">Impossible de charger les activations. Vérifiez votre session administrateur.</div>
        ) : !data?.rows.length ? (
          <div className="py-12 text-center border border-dashed rounded-xl text-sm text-gray-500">Aucune activation ne correspond aux filtres actuels.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Candidat</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Expiration</th>
                  <th className="px-4 py-3">Dernier e-mail</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {data.rows.map((row) => {
                  const config = STATUS_LABELS[row.activationStatus];
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{row.fullName}</p>
                        <p className="text-xs text-slate-500">{row.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={config.className}>{config.label}</Badge>
                        {row.lastEmailErrorType && <p className="text-[11px] text-red-600 mt-1">{row.lastEmailErrorType.replaceAll("_", " ")}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{formatDate(row.verificationExpiresAt)}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          {row.lastEmailStatus === "sent" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                          {row.lastEmailStatus === "not_sent" ? "Non envoyé" : row.lastEmailStatus}
                        </span>
                        <p className="text-[11px] text-slate-400">{formatDate(row.lastEmailAt)}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          disabled={resendMutation.isPending}
                          onClick={() => resendMutation.mutate({ sessionToken, candidateId: row.id })}
                        >
                          <Send className="w-3.5 h-3.5" /> Renvoyer
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>Page {page} sur {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || query.isFetching} onClick={() => setPage((value) => value - 1)}>Précédent</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages || query.isFetching} onClick={() => setPage((value) => value + 1)}>Suivant</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
