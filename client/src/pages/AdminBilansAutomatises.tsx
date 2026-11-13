import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, RefreshCw, Search } from "lucide-react";
import { getAdminSessionToken } from "@/lib/adminSession";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AdminBilanSources from "@/components/AdminBilanSources";

const FILTERS = [
  { id: "pret", label: "Bilan prêt à valider" },
  { id: "complement", label: "Complément demandé" },
  { id: "incident", label: "Incidents à reprendre" },
  { id: "en_cours", label: "Analyse en cours" },
  { id: "publie", label: "Publiés" },
  { id: "tous", label: "Tous" },
] as const;
type FilterId = (typeof FILTERS)[number]["id"];

const PROVENANCE: Record<string, string> = { declare: "déclaré", piece: "pièce examinée", verifie: "vérifié par l'agence", non_renseigne: "non renseigné", contradictoire: "contradictoire", systeme: "calculé" };
const NOTIFICATION: Record<string, string> = { none: "—", pending: "en attente d'envoi", accepted_by_provider: "acceptée par le serveur d'envoi", delivered: "délivrée", bounced: "rebond", failed: "échec", unknown: "inconnu" };

function stateTone(state: string) {
  if (state === "ready_for_review") return "bg-emerald-100 text-emerald-900";
  if (state === "published") return "bg-blue-100 text-blue-900";
  if (state === "failed" || state === "retry_pending") return "bg-red-100 text-red-900";
  if (state === "needs_information") return "bg-amber-100 text-amber-900";
  return "bg-slate-100 text-slate-800";
}

export default function AdminBilansAutomatises() {
  const sessionToken = getAdminSessionToken();
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<FilterId>("pret");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const utils = trpc.useUtils();
  const enabled = Boolean(sessionToken);
  if (!sessionToken) setTimeout(() => setLocation("/admin/login"), 0);

  const status = trpc.adminBilanAuto.status.useQuery({ sessionToken }, { enabled, retry: false });
  const list = trpc.adminBilanAuto.list.useQuery({ sessionToken, filter, search: search || undefined }, { enabled, retry: false, refetchInterval: 30_000 });
  const detail = trpc.adminBilanAuto.get.useQuery({ sessionToken, runId: openId ?? 1 }, { enabled: enabled && openId !== null, retry: false });
  const refresh = () => { void utils.adminBilanAuto.list.invalidate(); void utils.adminBilanAuto.get.invalidate(); };
  const validate = trpc.adminBilanAuto.validate.useMutation({ onSuccess: (result) => { toast.success(result.alreadyPublished ? "Ce bilan était déjà publié." : "Bilan publié dans l'espace client ; notification en cours d'envoi."); refresh(); }, onError: (error) => toast.error(error.message) });
  const relaunch = trpc.adminBilanAuto.relaunch.useMutation({ onSuccess: () => { toast.success("Nouveau traitement mis en file."); refresh(); }, onError: (error) => toast.error(error.message) });
  const runNow = trpc.adminBilanAuto.runNow.useMutation({ onSuccess: (result) => { toast.success(`${result.processed} traitement(s) exécuté(s).`); refresh(); }, onError: (error) => toast.error(error.message) });
  const correct = trpc.adminBilanAuto.correct.useMutation({ onSuccess: () => { toast.success("Correction enregistrée et score recalculé."); refresh(); }, onError: (error) => toast.error(error.message) });

  const [subKey, setSubKey] = useState("");
  const [points, setPoints] = useState("");
  const [justification, setJustification] = useState("");
  const run = detail.data?.run;
  const subOptions = useMemo(() => (run?.scoreResult?.rubrics ?? []).flatMap((rubric: any) => rubric.subCriteria.map((sub: any) => ({ id: `${rubric.key}.${sub.key}`, label: `${rubric.label} · ${sub.label} (max ${sub.max})`, max: sub.max }))), [run]);

  const rows = list.data && list.data.enabled ? list.data.rows : [];
  const counts = (list.data && list.data.enabled ? list.data.counts : {}) as Record<string, number>;

  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6" aria-labelledby="bilans-auto-title">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 id="bilans-auto-title" className="text-2xl font-black text-slate-950">Bilans automatisés — projet travail</h1>
          <p className="mt-1 text-sm text-slate-600">Le système prépare le bilan ; il n'est publié et notifié qu'après votre validation.</p>
        </div>
        <Button variant="outline" onClick={() => runNow.mutate({ sessionToken })} disabled={runNow.isPending || !status.data?.enabled}><RefreshCw className="mr-2 h-4 w-4" />Traiter maintenant</Button>
      </header>

      {status.data && (
        <Card className="flex flex-wrap items-center gap-2 p-3 text-xs" role="status">
          <Badge className={status.data.enabled ? "bg-emerald-100 text-emerald-900" : "bg-slate-200 text-slate-800"}>{status.data.enabled ? "Activé" : "Désactivé"}</Badge>
          <Badge variant="outline">Mode : {status.data.mode === "validation_admin" ? "validation administrateur" : status.data.mode === "automatique" ? "automatique" : "simulation"}</Badge>
          <Badge className={status.data.gridApproved ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}>Barème v{status.data.gridVersion} {status.data.gridApproved ? "approuvé" : "en attente d'approbation"}</Badge>
          <Badge variant="outline">Seuil interne {status.data.threshold}/100</Badge>
          <Badge variant="outline">E-mails : {status.data.notificationsEnabled ? "actifs" : "coupés"}</Badge>
          {status.data.allowlistActive && <Badge className="bg-blue-100 text-blue-900">Dossiers de test uniquement</Badge>}
          {!status.data.visionEnabled && <Badge variant="outline">Lecture des scans : désactivée</Badge>}
        </Card>
      )}

      <AdminBilanSources />

      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filtrer les dossiers">
        {FILTERS.map((entry) => (
          <Button key={entry.id} role="tab" aria-selected={filter === entry.id} size="sm" variant={filter === entry.id ? "default" : "outline"} onClick={() => { setFilter(entry.id); setOpenId(null); }}>
            {entry.label}{typeof counts[entry.id] === "number" ? ` (${counts[entry.id]})` : ""}
          </Button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
          <Input aria-label="Rechercher un candidat" className="pl-9" placeholder="Nom, e-mail, dossier" value={search} onChange={(event) => setSearch(event.target.value)} maxLength={120} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <section aria-label="Liste des dossiers" className="space-y-2">
          {list.data && !list.data.enabled && <Card className="p-4 text-sm text-slate-700">Le bilan automatisé n'est pas activé sur cet environnement.</Card>}
          {list.isLoading && <p className="text-sm text-slate-500">Chargement…</p>}
          {list.data?.enabled && rows.length === 0 && <Card className="p-4 text-sm text-slate-600">Aucun dossier dans ce filtre.</Card>}
          {rows.map((row) => (
            <Card key={row.id} className={`cursor-pointer p-3 ${openId === row.id ? "border-2 border-[#0B2A52]" : ""}`} onClick={() => setOpenId(row.id)}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-950">{row.fullName}</p>
                  <p className="text-xs text-slate-500">{row.dossierRef ?? `Évaluation ${row.evaluationId}`} · {row.email}</p>
                </div>
                <Badge className={stateTone(row.state)}>{row.stateLabel}</Badge>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                {row.score !== null ? <strong>{row.score}/{row.scoreMax}</strong> : "Note non calculée"}
                {row.thresholdReached !== null && ` · ${row.thresholdReached ? "seuil atteint" : "seuil non atteint"}`}
                {row.mode === "simulation" && " · simulation"}
                {row.reviewStatus === "corrected" && " · corrigé"}
              </p>
              {row.lastError && <p className="mt-1 flex items-center gap-1 text-xs text-red-800"><AlertTriangle className="h-3 w-3" aria-hidden="true" />{row.lastError.slice(0, 140)}</p>}
            </Card>
          ))}
        </section>

        <section aria-label="Détail du bilan" className="space-y-3">
          {openId === null && <Card className="p-4 text-sm text-slate-600">Sélectionnez un dossier pour relire le bilan, ses notes expliquées et ses sources.</Card>}
          {detail.isLoading && openId !== null && <p className="text-sm text-slate-500">Chargement…</p>}
          {run && detail.data && (
            <>
              <Card className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">{run.fullName}</h2>
                    <p className="text-xs text-slate-500">Traitement n° {run.id} · barème {run.rubricVersion} · empreinte {run.reportHash?.slice(0, 10) ?? "—"}</p>
                  </div>
                  <Badge className={stateTone(run.state)}>{run.stateLabel}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {run.state === "ready_for_review" && run.mode !== "simulation" && (
                    <Button onClick={() => { if (window.confirm("Publier ce bilan dans l'espace client et notifier le candidat par e-mail ?")) validate.mutate({ sessionToken, runId: run.id }); }} disabled={validate.isPending}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />Valider et publier
                    </Button>
                  )}
                  {run.state !== "published" && <Button variant="outline" onClick={() => relaunch.mutate({ sessionToken, evaluationId: run.evaluationId })} disabled={relaunch.isPending}>Relancer le traitement</Button>}
                </div>
                <p className="text-xs text-slate-600">Notification : {NOTIFICATION[run.notificationState] ?? run.notificationState}{run.attempts > 0 ? ` · ${run.attempts}/${run.maxAttempts} tentative(s)` : ""}</p>
                {run.complement && run.complement.length > 0 && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs">
                    <p className="font-semibold text-amber-900">Complément demandé au candidat</p>
                    <ul className="mt-1 list-disc pl-5">{run.complement.map((item: any) => <li key={item.id}>{item.label}</li>)}</ul>
                  </div>
                )}
                {run.flags.length > 0 && (
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
                    <p className="font-semibold">Signalements</p>
                    <ul className="mt-1 list-disc pl-5">{run.flags.map((flag: string, index: number) => <li key={index}>{flag}</li>)}</ul>
                  </div>
                )}
                {run.previous && <p className="rounded-md bg-blue-50 p-3 text-xs text-blue-900">Évaluation antérieure du {new Date(run.previous.date).toLocaleDateString("fr-FR")} : {run.previous.score ?? "—"}/100 — {run.previous.verdict} ({run.previous.updateNature}).</p>}
              </Card>

              {run.scoreResult && (
                <Card className="space-y-3 p-4">
                  <h3 className="font-bold text-slate-950">Notes expliquées — {run.score ?? "non calculable"}/{run.scoreMax} (seuil 65)</h3>
                  {run.scoreResult.rubrics.map((rubric: any) => (
                    <div key={rubric.key}>
                      <p className="text-sm font-semibold">{rubric.label} : {rubric.points ?? "non calculable"}/{rubric.max}</p>
                      <ul className="mt-1 space-y-1 text-xs text-slate-700">
                        {rubric.subCriteria.map((sub: any) => (
                          <li key={sub.key}><strong>{sub.points ?? "—"}/{sub.max}</strong> {sub.label} <span className="text-slate-500">({PROVENANCE[sub.provenance] ?? sub.provenance})</span><br />{sub.explanation}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {run.state !== "published" && (
                    <form className="space-y-2 rounded-md border border-slate-200 p-3" onSubmit={(event) => { event.preventDefault(); const [rubric, subCriterion] = subKey.split("."); correct.mutate({ sessionToken, runId: run.id, rubric, subCriterion, points: Number(points), justification }); setJustification(""); }}>
                      <p className="text-sm font-semibold">Corriger une note (tracé, total recalculé par le système)</p>
                      <select aria-label="Sous-critère" className="w-full rounded-md border border-slate-300 p-2 text-sm" value={subKey} onChange={(event) => setSubKey(event.target.value)} required>
                        <option value="">Choisir un sous-critère</option>
                        {subOptions.map((option: any) => <option key={option.id} value={option.id}>{option.label}</option>)}
                      </select>
                      <Input aria-label="Points" type="number" min={0} max={20} placeholder="Points" value={points} onChange={(event) => setPoints(event.target.value)} required />
                      <Textarea aria-label="Justification" placeholder="Justification obligatoire (10 caractères minimum)" value={justification} onChange={(event) => setJustification(event.target.value)} minLength={10} maxLength={600} required />
                      <Button type="submit" variant="outline" disabled={correct.isPending}>Enregistrer la correction</Button>
                    </form>
                  )}
                </Card>
              )}

              {detail.data.text && <Card className="p-4"><h3 className="mb-2 font-bold text-slate-950">Texte du bilan (copiable)</h3><pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-800">{detail.data.text}</pre></Card>}

              <Card className="p-4">
                <h3 className="mb-2 font-bold text-slate-950">Journal</h3>
                <ul className="space-y-1 text-xs text-slate-700">
                  {detail.data.events.map((event, index) => <li key={index}>{new Date(event.at).toLocaleString("fr-FR")} · {event.actor} · <strong>{event.action}</strong>{event.detail ? ` — ${event.detail}` : ""}</li>)}
                </ul>
              </Card>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
