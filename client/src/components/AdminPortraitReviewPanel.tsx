import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, ImageOff, Loader2, ShieldCheck, UserRound, XCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type PortraitCandidate = {
  id: string | number;
  applicationNumber: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  avatarVerificationStatus: "missing" | "pending" | "verified" | "rejected";
  avatarVerificationReason?: string | null;
  avatarFaceCount: number;
};

type Props = {
  candidates: PortraitCandidate[];
};

const statusCopy: Record<PortraitCandidate["avatarVerificationStatus"], { label: string; className: string }> = {
  missing: { label: "Portrait absent", className: "bg-slate-100 text-slate-700" },
  pending: { label: "À revoir", className: "bg-amber-100 text-amber-800" },
  verified: { label: "Vérifié", className: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Suspect / rejeté", className: "bg-red-100 text-red-800" },
};

export default function AdminPortraitReviewPanel({ candidates }: Props) {
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const utils = trpc.useUtils();
  const reviewMutation = trpc.adminCandidateManagement.reviewPortrait.useMutation({
    onSuccess: async (result) => {
      await utils.adminCandidateManagement.list.invalidate();
      toast.success(result.status === "verified" ? "Portrait validé manuellement." : "Demande de nouvelle photo enregistrée.");
    },
    onError: (error) => toast.error(error.message || "Impossible de mettre à jour le portrait."),
  });

  const reviewQueue = useMemo(
    () => candidates.filter((candidate) => candidate.avatarVerificationStatus !== "verified"),
    [candidates],
  );

  const updateReason = (candidateId: string | number, value: string) => {
    setReasons((current) => ({ ...current, [String(candidateId)]: value.slice(0, 500) }));
  };

  const review = (candidate: PortraitCandidate, decision: "approve" | "reject" | "request_new") => {
    reviewMutation.mutate({
      candidateId: String(candidate.id),
      decision,
      reason: reasons[String(candidate.id)]?.trim() || undefined,
    });
  };

  return (
    <Card className="mb-8 border-amber-200 bg-amber-50/40 p-5 shadow-sm sm:p-6" aria-labelledby="admin-portrait-review-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-amber-100 p-2 text-amber-800"><ShieldCheck className="h-5 w-5" /></div>
          <div>
            <h2 id="admin-portrait-review-title" className="text-lg font-bold text-slate-900">Revue des portraits</h2>
            <p className="mt-1 text-sm text-slate-600">Vérifiez les portraits signalés ou demandez une nouvelle prise avant d’autoriser l’accès complet.</p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
          <Clock3 className="h-3.5 w-3.5" /> {reviewQueue.length} à revoir
        </span>
      </div>

      {reviewQueue.length === 0 ? (
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> Aucun portrait en attente sur cette page.
        </div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {reviewQueue.map((candidate) => {
            const status = statusCopy[candidate.avatarVerificationStatus];
            const reason = reasons[String(candidate.id)] || "";
            return (
              <article key={candidate.id} className="rounded-xl border border-white bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
                    {candidate.avatarUrl ? (
                      <img src={candidate.avatarUrl} alt={`Portrait de ${candidate.fullName}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400"><ImageOff className="h-5 w-5" /></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold text-slate-900">{candidate.fullName}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${status.className}`}>{status.label}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">{candidate.applicationNumber} · {candidate.email}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-600"><UserRound className="h-3.5 w-3.5" /> Visages détectés : {candidate.avatarFaceCount}</p>
                    {candidate.avatarVerificationReason && <p className="mt-2 rounded-md bg-slate-50 p-2 text-xs text-slate-600">{candidate.avatarVerificationReason}</p>}
                  </div>
                </div>
                <Textarea
                  value={reason}
                  onChange={(event) => updateReason(candidate.id, event.target.value)}
                  className="mt-3 min-h-16 bg-white text-sm"
                  placeholder="Note ou consigne envoyée au candidat (facultatif)"
                  aria-label={`Motif de revue pour ${candidate.fullName}`}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => review(candidate, "approve")} disabled={!candidate.avatarUrl || reviewMutation.isPending} className="bg-emerald-600 text-white hover:bg-emerald-700">
                    {reviewMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />} Valider
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => review(candidate, "request_new")} disabled={reviewMutation.isPending} className="border-amber-300 text-amber-800 hover:bg-amber-50">
                    <AlertTriangle className="mr-1.5 h-4 w-4" /> Demander une nouvelle photo
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => review(candidate, "reject")} disabled={reviewMutation.isPending} className="text-red-700 hover:bg-red-50 hover:text-red-800">
                    <XCircle className="mr-1.5 h-4 w-4" /> Signaler suspect
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Card>
  );
}
