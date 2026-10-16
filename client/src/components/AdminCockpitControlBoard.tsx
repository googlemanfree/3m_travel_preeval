import { useMemo, useState } from "react";
import { AlertTriangle, Gauge, Loader2, Mail, MessageCircle, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { formatAdminSyncTime } from "@shared/adminSync";

type Category =
  | "email_unverified"
  | "no_evaluation"
  | "payment_pending"
  | "ready_to_activate"
  | "protocol_pending"
  | "documents_pending";

const CATEGORY_TO_STAGE: Record<Category, string> = {
  email_unverified: "email_unverified",
  no_evaluation: "evaluation_missing",
  payment_pending: "payment_pending",
  ready_to_activate: "ready_to_activate",
  protocol_pending: "protocol_pending",
  documents_pending: "documents_pending",
};

const CATEGORY_ORDER: Category[] = [
  "email_unverified",
  "no_evaluation",
  "payment_pending",
  "ready_to_activate",
  "protocol_pending",
  "documents_pending",
];

const URGENCY_STYLE = {
  high: "border-rose-200 bg-rose-50",
  normal: "border-amber-200 bg-white",
  low: "border-slate-200 bg-white",
} as const;

type ForceConfirmTarget = {
  candidateId: number;
  fullName: string;
  email: string;
  reference: string;
};

export default function AdminCockpitControlBoard({
  sessionToken,
  onOpen,
}: {
  sessionToken: string;
  onOpen: (openId: string) => void;
}) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const query = trpc.adminCandidateManagement.listCockpitControlBoard.useQuery(
    { sessionToken },
    { enabled: Boolean(sessionToken), refetchInterval: 60_000 },
  );
  const [filter, setFilter] = useState<Category | "all">("all");
  const [visible, setVisible] = useState(16);
  const [forceConfirm, setForceConfirm] = useState<ForceConfirmTarget | null>(null);
  const [forceConfirmReason, setForceConfirmReason] = useState("");
  const [relancePendingKey, setRelancePendingKey] = useState<string | null>(null);

  const sendDynamicRelanceMutation = trpc.adminCandidateManagement.sendDynamicRelance.useMutation({
    onSuccess: (result, variables) => {
      setRelancePendingKey(null);
      toast({ title: "Relance envoyée", description: result.message });
      if ((variables.channel === "whatsapp" || variables.channel === "both") && result.whatsappUrl) {
        window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
      }
      void query.refetch();
    },
    onError: (error) => {
      setRelancePendingKey(null);
      toast({ title: "Relance impossible", description: error.message, variant: "destructive" });
    },
  });

  const resendMutation = trpc.adminActivation.resend.useMutation({
    onSuccess: () => {
      toast({
        title: "Lien de confirmation renvoyé",
        description: "Le candidat reçoit un nouvel e-mail. Prévenez-le aussi de vérifier ses spams.",
      });
      void query.refetch();
    },
    onError: (error) => {
      toast({ title: "Renvoi impossible", description: error.message, variant: "destructive" });
    },
  });

  const forceConfirmMutation = trpc.adminActivation.forceConfirmEmail.useMutation({
    onSuccess: (result) => {
      toast({
        title: "E-mail confirmé manuellement",
        description: `${result.email} est maintenant vérifié (${result.confirmedBy}).`,
      });
      setForceConfirm(null);
      setForceConfirmReason("");
      void query.refetch();
      void utils.adminCandidateManagement.listCockpitControlBoard.invalidate();
    },
    onError: (error) => {
      toast({ title: "Confirmation impossible", description: error.message, variant: "destructive" });
    },
  });

  const items = useMemo(() => {
    const rows = query.data?.items ?? [];
    return filter === "all" ? rows : rows.filter((row) => row.category === filter);
  }, [query.data?.items, filter]);

  const counts = query.data?.counts;
  const labels = query.data?.labels;

  return (
    <Card className="border-cyan-100" data-testid="cockpit-control-board">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-black text-slate-950">
              <Gauge className="h-4 w-4 text-cyan-700" />
              Contrôle total — files actionnables
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Relance client prête (e-mail / WhatsApp). Pour les e-mails bloqués en spam : renvoyer le lien ou confirmer manuellement.
            </p>
            <p className="mt-1 text-xs text-slate-500" aria-live="polite">
              {query.isFetching
                ? "Synchronisation…"
                : query.dataUpdatedAt
                  ? `Dernière sync : ${formatAdminSyncTime(new Date(query.dataUpdatedAt))}`
                  : formatAdminSyncTime(null)}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => void query.refetch()} disabled={query.isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 ${query.isFetching ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>

        {query.isLoading ? (
          <p className="text-sm text-slate-500">Analyse du contrôle dossiers…</p>
        ) : query.isError ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
            Impossible de charger le tableau de contrôle : {query.error.message}
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les files de contrôle">
              <button
                type="button"
                onClick={() => { setFilter("all"); setVisible(16); }}
                aria-pressed={filter === "all"}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold ${filter === "all" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"}`}
              >
                Tout ({counts?.total ?? 0})
                {counts && counts.high > 0 ? <span className="ml-1 text-rose-300">· {counts.high} urgent(s)</span> : null}
              </button>
              {CATEGORY_ORDER.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => { setFilter(category); setVisible(16); }}
                  aria-pressed={filter === category}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold ${filter === category ? "ring-2 ring-slate-900" : ""} border-cyan-200 bg-cyan-50 text-cyan-950`}
                >
                  {labels?.[category] ?? category} ({counts?.[category] ?? 0})
                </button>
              ))}
            </div>

            {items.length === 0 ? (
              <p className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900">Aucune file actionnable pour ce filtre.</p>
            ) : (
              <ul className="space-y-2">
                {items.slice(0, visible).map((item) => {
                  const stage = CATEGORY_TO_STAGE[item.category as Category] ?? "generic";
                  const canForceConfirm = item.category === "email_unverified" && typeof item.candidateId === "number";
                  const canResendLink = canForceConfirm;
                  const mailKey = `${item.id}:email`;
                  const waKey = `${item.id}:whatsapp`;
                  const sendRelance = (channel: "email" | "whatsapp") => {
                    setRelancePendingKey(channel === "email" ? mailKey : waKey);
                    sendDynamicRelanceMutation.mutate({
                      sessionToken,
                      candidateId: item.openId,
                      stage,
                      channel,
                      useAi: true,
                    });
                  };

                  return (
                    <li key={item.id}>
                      <div
                        className={`flex w-full flex-col gap-3 rounded-xl border p-3 transition hover:border-cyan-400 hover:shadow-sm sm:flex-row sm:items-start ${URGENCY_STYLE[item.urgency]}`}
                      >
                        <button
                          type="button"
                          onClick={() => onOpen(item.openId)}
                          className="flex min-w-0 flex-1 items-start gap-3 text-left"
                          data-testid="cockpit-open-row"
                        >
                          <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${item.urgency === "high" ? "text-rose-600" : "text-amber-600"}`} aria-hidden="true" />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">{item.fullName}</span>
                              <span className="font-mono text-[11px] text-slate-500">{item.reference}</span>
                              <Badge variant="outline" className="border-cyan-200 bg-white text-cyan-900">{item.categoryLabel}</Badge>
                              <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">{item.progressPercent}%</Badge>
                            </span>
                            <span className="mt-1 block text-sm font-semibold text-slate-800">{item.nextActionLabel}</span>
                            <span className="mt-0.5 block text-xs text-slate-600">{item.stageLabel}</span>
                            {item.blockers[0] ? <span className="mt-1 block text-xs text-slate-500">{item.blockers[0]}</span> : null}
                          </span>
                        </button>
                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5" data-testid="cockpit-relance-actions">
                          {item.email ? (
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 gap-1 bg-blue-700 px-2.5 text-xs font-bold text-white hover:bg-blue-800"
                              data-testid="cockpit-relance-mail"
                              disabled={sendDynamicRelanceMutation.isPending}
                              title={`Envoyer la relance à ${item.fullName} (espace + e-mail)`}
                              onClick={(event) => {
                                event.stopPropagation();
                                sendRelance("email");
                              }}
                            >
                              {relancePendingKey === mailKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Mail className="h-3.5 w-3.5" aria-hidden="true" />}
                              Envoyer e-mail
                            </Button>
                          ) : null}
                          {item.phone ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 border-emerald-200 bg-emerald-50 px-2.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100"
                              data-testid="cockpit-relance-whatsapp"
                              disabled={sendDynamicRelanceMutation.isPending}
                              title={`Déposer dans l’espace puis ouvrir WhatsApp pour ${item.fullName}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                sendRelance("whatsapp");
                              }}
                            >
                              {relancePendingKey === waKey ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />}
                              WhatsApp
                            </Button>
                          ) : item.email && item.category !== "ready_to_activate" ? (
                            <span className="text-[11px] text-slate-500" data-testid="cockpit-relance-whatsapp-missing">
                              WhatsApp : tél. manquant
                            </span>
                          ) : null}
                          {canResendLink ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 border-indigo-200 px-2.5 text-xs font-bold text-indigo-900 hover:bg-indigo-50"
                              data-testid="cockpit-resend-confirm-link"
                              disabled={resendMutation.isPending}
                              onClick={(event) => {
                                event.stopPropagation();
                                if (typeof item.candidateId !== "number") return;
                                resendMutation.mutate({ sessionToken, candidateId: item.candidateId });
                              }}
                              title="Renvoyer le lien de confirmation (si bloqué en spam)"
                            >
                              <Send className="h-3.5 w-3.5" aria-hidden="true" />
                              Renvoyer lien
                            </Button>
                          ) : null}
                          {canForceConfirm ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 border-emerald-300 bg-white px-2.5 text-xs font-bold text-emerald-900 hover:bg-emerald-50"
                              data-testid="cockpit-force-confirm-email"
                              disabled={forceConfirmMutation.isPending}
                              onClick={(event) => {
                                event.stopPropagation();
                                if (typeof item.candidateId !== "number") return;
                                setForceConfirm({
                                  candidateId: item.candidateId,
                                  fullName: item.fullName,
                                  email: item.email,
                                  reference: item.reference,
                                });
                                setForceConfirmReason("");
                              }}
                              title="Confirmer l’e-mail côté admin (spam / boîte inaccessible)"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                              Confirmer e-mail
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {items.length > visible ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setVisible((value) => value + 16)}>
                Afficher plus ({items.length - visible} restants)
              </Button>
            ) : null}
          </>
        )}

        <Dialog
          open={Boolean(forceConfirm)}
          onOpenChange={(open) => {
            if (!open) {
              setForceConfirm(null);
              setForceConfirmReason("");
            }
          }}
        >
          <DialogContent data-testid="cockpit-force-confirm-dialog">
            <DialogHeader>
              <DialogTitle>Confirmer l’e-mail manuellement</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <p className="text-slate-600">
                Compte : <strong>{forceConfirm?.fullName}</strong> · {forceConfirm?.email}
                {forceConfirm?.reference ? (
                  <>
                    {" "}
                    · <span className="font-mono text-xs">{forceConfirm.reference}</span>
                  </>
                ) : null}
              </p>
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                À utiliser si le lien est bloqué en spam, la boîte inaccessible, ou l’OTP impossible. Vérifiez l’identité (appel / WhatsApp) avant de confirmer. L’action est journalisée.
              </p>
              <div>
                <Label htmlFor="cockpit-force-confirm-reason">Motif (obligatoire)</Label>
                <Textarea
                  id="cockpit-force-confirm-reason"
                  value={forceConfirmReason}
                  onChange={(event) => setForceConfirmReason(event.target.value)}
                  placeholder="Ex. : identité vérifiée par WhatsApp ; e-mail bloqué en spam Yahoo."
                  rows={4}
                  maxLength={500}
                  data-testid="cockpit-force-confirm-reason"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setForceConfirm(null);
                  setForceConfirmReason("");
                }}
              >
                Annuler
              </Button>
              <Button
                type="button"
                className="bg-emerald-700 hover:bg-emerald-800"
                data-testid="cockpit-force-confirm-submit"
                disabled={forceConfirmMutation.isPending || forceConfirmReason.trim().length < 8 || !forceConfirm}
                onClick={() => {
                  if (!forceConfirm) return;
                  forceConfirmMutation.mutate({
                    sessionToken,
                    candidateId: forceConfirm.candidateId,
                    reason: forceConfirmReason.trim(),
                    confirmed: true,
                  });
                }}
              >
                {forceConfirmMutation.isPending ? "Confirmation…" : "Confirmer l’e-mail"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
