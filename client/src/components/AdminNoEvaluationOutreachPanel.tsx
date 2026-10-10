import { useMemo, useState } from "react";
import { Copy, Mail, RefreshCw, Search, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export default function AdminNoEvaluationOutreachPanel({ sessionToken }: { sessionToken: string }) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [onlyUnverifiedEmail, setOnlyUnverifiedEmail] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const query = trpc.adminCandidateManagement.listCandidatesWithoutEvaluation.useQuery(
    { sessionToken, search: search.trim(), onlyUnverifiedEmail },
    { enabled: Boolean(sessionToken), refetchInterval: 60_000 },
  );

  const sendMutation = trpc.adminCandidateManagement.sendNoEvaluationOutreach.useMutation({
    onSuccess: (result) => {
      toast({
        title: "Relance envoyée",
        description: result.emailSent
          ? `E-mail remis pour ${result.accountReference}.`
          : `Message déposé dans l’espace client (${result.accountReference}) ; e-mail en échec.`,
      });
      setSelectedId(null);
      void utils.adminCandidateManagement.listCandidatesWithoutEvaluation.invalidate();
    },
    onError: (error) => toast({ title: "Envoi impossible", description: error.message, variant: "destructive" }),
  });

  const selected = useMemo(
    () => query.data?.candidates.find((row) => row.id === selectedId) ?? null,
    [query.data?.candidates, selectedId],
  );

  const openDraft = (candidateId: number) => {
    const row = query.data?.candidates.find((item) => item.id === candidateId);
    if (!row) return;
    setSelectedId(candidateId);
    setSubject(row.draft.subject);
    setMessage(row.draft.bodyText);
  };

  const copyDraft = async () => {
    if (!selected) return;
    await navigator.clipboard.writeText(`${subject}\n\n${message}`);
    toast({ title: "Brouillon copié", description: "Collez-le dans votre client e-mail si besoin." });
  };

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardContent className="space-y-5 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Mail className="h-5 w-5 text-blue-700" />
              Inscrits sans évaluation
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Brouillons intelligents (pays + type d’accompagnement) pour faciliter la relance administrateur.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => void query.refetch()} disabled={query.isFetching}>
            <RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher nom, e-mail, pays…"
              className="pl-9"
              maxLength={120}
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <Checkbox checked={onlyUnverifiedEmail} onCheckedChange={(value) => setOnlyUnverifiedEmail(value === true)} />
            E-mail non confirmé seulement
          </label>
          <Badge variant="outline" className="w-fit border-blue-200 bg-blue-50 text-blue-800">
            {query.data?.total ?? "—"} compte(s)
          </Badge>
        </div>

        {query.isLoading ? (
          <p className="py-10 text-center text-sm text-slate-500">Chargement…</p>
        ) : query.isError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 py-6 text-center text-sm text-red-800">Impossible de charger la liste.</p>
        ) : !query.data?.candidates.length ? (
          <p className="rounded-xl border border-dashed py-10 text-center text-sm text-slate-500">Aucun inscrit sans évaluation pour ces filtres.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Compte</th>
                  <th className="px-4 py-3">Pays / visa</th>
                  <th className="px-4 py-3">Suggestion</th>
                  <th className="px-4 py-3">Inscription</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {query.data.candidates.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{row.fullName}</p>
                      <p className="text-xs text-slate-500">{row.email}</p>
                      <p className="mt-1 font-mono text-[11px] text-blue-800">{row.accountReference}</p>
                      {!row.emailVerified && <Badge variant="outline" className="mt-1 border-amber-200 bg-amber-50 text-amber-800">E-mail non confirmé</Badge>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <p>{row.preferredDestinations.length ? row.preferredDestinations.join(", ") : row.destinationPreference || "Non précisé"}</p>
                      <p className="mt-1">{row.visaType || "Type de visa à qualifier"}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <p className="font-medium text-slate-800">{row.draft.suggestedDestinationLabel}</p>
                      <p className="mt-1 capitalize">{row.draft.suggestedService.replaceAll("_", " ")}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(row.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openDraft(row.id)}>
                        <Send className="h-3.5 w-3.5" /> Préparer l’e-mail
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedId(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Relance — {selected?.fullName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Référence {selected?.accountReference} · le message est personnalisé selon le pays déclaré et le type d’accompagnement probable.
              </p>
              <div>
                <Label htmlFor="outreach-subject">Objet</Label>
                <Input id="outreach-subject" value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={255} />
              </div>
              <div>
                <Label htmlFor="outreach-body">Message</Label>
                <Textarea id="outreach-body" value={message} onChange={(event) => setMessage(event.target.value)} rows={14} maxLength={12000} />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" className="gap-1.5" onClick={() => void copyDraft()}>
                <Copy className="h-4 w-4" /> Copier
              </Button>
              {selected?.draft.mailtoHref && (
                <Button type="button" variant="outline" asChild>
                  <a href={selected.draft.mailtoHref}>Ouvrir mailto</a>
                </Button>
              )}
              <Button
                type="button"
                className="gap-1.5 bg-blue-700 hover:bg-blue-800"
                disabled={sendMutation.isPending || !selected}
                onClick={() => {
                  if (!selected) return;
                  sendMutation.mutate({
                    sessionToken,
                    candidateId: selected.id,
                    subject: subject.trim(),
                    message: message.trim(),
                    confirmed: true,
                  });
                }}
              >
                <Send className="h-4 w-4" />
                {sendMutation.isPending ? "Envoi…" : "Envoyer au candidat"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
