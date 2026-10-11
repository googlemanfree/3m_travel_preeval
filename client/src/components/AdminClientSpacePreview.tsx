import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  CircleAlert,
  Eye,
  FileText,
  FolderOpen,
  Loader2,
  Mail,
  MessageSquare,
  ShieldCheck,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Props = {
  sessionToken: string;
  candidateId: string;
  candidateName?: string;
  triggerClassName?: string;
  compact?: boolean;
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminClientSpacePreview({
  sessionToken,
  candidateId,
  candidateName,
  triggerClassName,
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const previewQuery = trpc.admin.previewClientSpace.useQuery(
    { sessionToken, candidateId },
    { enabled: open && Boolean(sessionToken && candidateId), refetchOnWindowFocus: false, retry: 1 },
  );
  const data = previewQuery.data;

  return (
    <>
      <Button
        type="button"
        size={compact ? "sm" : "default"}
        variant="outline"
        className={triggerClassName ?? "gap-2 border-indigo-300 bg-white text-indigo-900 hover:bg-indigo-50"}
        onClick={() => setOpen(true)}
        data-testid="admin-client-space-preview-trigger"
      >
        <Eye className="h-4 w-4" />
        {compact ? "Espace client" : "Prévisualiser l’espace client"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-hidden p-0" data-testid="admin-client-space-preview-dialog">
          <DialogHeader className="border-b border-indigo-100 bg-indigo-50 px-5 py-4 text-left">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">Mode prévisualisation — lecture seule</p>
                <DialogTitle className="mt-1 text-lg text-slate-950">
                  Espace client{candidateName ? ` · ${candidateName}` : ""}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-slate-600">
                  Rendu fidèle de ce que le candidat voit dans /mon-espace. Aucune action candidat n’est exécutée depuis cet aperçu.
                </DialogDescription>
              </div>
              <Button type="button" size="icon" variant="ghost" onClick={() => setOpen(false)} aria-label="Fermer la prévisualisation">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="max-h-[calc(92vh-7rem)] overflow-y-auto bg-slate-100 p-4 sm:p-5">
            {previewQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" /> Chargement de l’espace client…
              </div>
            ) : previewQuery.isError || !data ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                Impossible de charger la prévisualisation : {previewQuery.error?.message || "données indisponibles."}
              </div>
            ) : (
              <div className="mx-auto max-w-xl space-y-4" data-testid="admin-client-space-preview-body">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="bg-gradient-to-br from-[#0B2A52] to-[#1d4ed8] px-5 py-5 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">3M TRAVEL AGENCY · Mon espace</p>
                    <h3 className="mt-2 text-xl font-black">{data.candidate.fullName}</h3>
                    <p className="mt-1 text-sm text-blue-100">
                      {data.candidate.dossierNumber} · {data.candidate.destination || "Destination à préciser"}
                      {data.candidate.visaType ? ` · ${data.candidate.visaType}` : ""}
                    </p>
                    <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="text-xs text-blue-200">Statut visible (phase client)</p>
                        <p className="font-semibold">{data.candidate.statusLabel}</p>
                        {data.candidate.statusDetail ? (
                          <p className="mt-1 text-xs text-blue-100">{data.candidate.statusDetail}</p>
                        ) : null}
                      </div>
                      <Badge className="border-white/20 bg-white/15 text-white">{data.progress.percent}%</Badge>
                    </div>
                    <Progress className="mt-3 h-2 bg-white/20" value={data.progress.percent} />
                    {data.progress.stepLabel && (
                      <p className="mt-2 text-xs text-blue-100">
                        Étape {data.progress.stepNumber}/{data.progress.stepCount} · {data.progress.stepLabel}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 p-4">
                    <section className="rounded-xl border border-amber-200 bg-amber-50/80 p-3" data-testid="client-preview-next-action">
                      <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Action suivante (vue candidat)</p>
                      <p className="mt-1 font-semibold text-slate-950">{data.nextClientAction.label}</p>
                      <p className="mt-1 text-sm text-slate-700">{data.nextClientAction.detail}</p>
                    </section>

                    <section className="grid gap-2 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"><ShieldCheck className="h-3.5 w-3.5" />Paiement</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{data.payment.confirmed ? "Confirmé" : "En attente"}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"><FileText className="h-3.5 w-3.5" />Protocole</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{data.payment.protocolSigned ? "Signé" : "À signer"}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"><FolderOpen className="h-3.5 w-3.5" />Pièces</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{data.documents.total - data.documents.pending}/{data.documents.total}</p>
                      </div>
                    </section>

                    <section className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Checklist documents</p>
                        {data.documents.pending > 0 ? (
                          <Badge className="border-amber-200 bg-amber-50 text-amber-900">{data.documents.pending} en attente</Badge>
                        ) : (
                          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">À jour</Badge>
                        )}
                      </div>
                      {data.documents.checklist.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500">Aucune pièce spécifique demandée pour le moment.</p>
                      ) : (
                        <ul className="mt-2 space-y-1.5">
                          {data.documents.checklist.map((item, index) => (
                            <li key={`${item.label}-${index}`} className="flex items-start gap-2 text-sm text-slate-800">
                              {["received", "approved", "completed"].includes(String(item.status)) ? (
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                              ) : (
                                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                              )}
                              <span>
                                <span className="font-medium">{item.label}</span>
                                <span className="ml-2 text-xs text-slate-500">{item.status}</span>
                                {item.comment ? <span className="mt-0.5 block text-xs text-slate-600">{item.comment}</span> : null}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>

                    <section className="rounded-xl border border-violet-200 bg-violet-50/50 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-violet-800">Évaluation</p>
                      {!data.evaluation ? (
                        <p className="mt-2 text-sm text-slate-600">Aucune évaluation publiée côté candidat.</p>
                      ) : data.evaluation.responsePublished && data.evaluation.responseHtml ? (
                        <div className="mt-2">
                          <p className="text-sm font-semibold text-emerald-800">Réponse validée visible par le candidat</p>
                          <div
                            className="prose prose-sm mt-2 max-w-none rounded-lg border border-violet-100 bg-white p-3 text-slate-800"
                            dangerouslySetInnerHTML={{ __html: data.evaluation.responseHtml }}
                          />
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-slate-600">
                          Évaluation {data.evaluation.referenceCode || ""} — réponse non encore diffusée dans l’espace client.
                        </p>
                      )}
                    </section>

                    <section className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 p-3">
                        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                          <Bell className="h-3.5 w-3.5" /> Notifications
                          {data.communications.unreadNotifications > 0 ? (
                            <Badge className="ml-1 border-amber-200 bg-amber-50 text-amber-900">{data.communications.unreadNotifications}</Badge>
                          ) : null}
                        </p>
                        {data.communications.recentNotifications.length === 0 ? (
                          <p className="mt-2 text-sm text-slate-500">Aucune notification.</p>
                        ) : (
                          <ul className="mt-2 space-y-2">
                            {data.communications.recentNotifications.map((item) => (
                              <li key={item.title + String(item.createdAt)} className="rounded-lg bg-slate-50 p-2 text-sm">
                                <p className="font-medium text-slate-900">{item.title}</p>
                                <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{item.body}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="rounded-xl border border-slate-200 p-3">
                        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                          <MessageSquare className="h-3.5 w-3.5" /> Messagerie
                          {data.communications.unreadMessages > 0 ? (
                            <Badge className="ml-1 border-amber-200 bg-amber-50 text-amber-900">{data.communications.unreadMessages}</Badge>
                          ) : null}
                        </p>
                        {data.communications.recentMessages.length === 0 ? (
                          <p className="mt-2 text-sm text-slate-500">Aucun message.</p>
                        ) : (
                          <ul className="mt-2 space-y-2">
                            {data.communications.recentMessages.map((item) => (
                              <li key={String(item.createdAt) + item.content.slice(0, 12)} className="rounded-lg bg-slate-50 p-2 text-sm">
                                <p className="text-xs font-semibold text-slate-500">
                                  {item.senderRole === "candidate" ? "Candidat" : "Agence"} · {formatDate(item.createdAt)}
                                </p>
                                <p className="mt-0.5 line-clamp-3 text-slate-800">{item.content}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </section>
                  </div>
                </div>

                <p className="flex items-start gap-2 text-xs text-slate-500">
                  <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Aperçu consulté par {data.previewedBy} · {formatDate(data.previewedAt)}. Journalisé dans l’activité admin.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
