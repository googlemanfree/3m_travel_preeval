import { useMemo } from "react";
import { Briefcase } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { getCandidateToken } from "@/hooks/useCandidateAuth";
import { INTERNATIONAL_FIELDS_NOTICE, INTERVIEW_MODE_LABELS, INTERVIEW_STATUS_LABELS, SUPPORT_LABELS, TRI_STATE_LABELS } from "@shared/recruitment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Opportunités soumises au candidat. Il ne postule pas lui-même : 3M a examiné l'offre et l'employeur, puis lui demande s'il est intéressé.
 * Rien n'est transmis à l'employeur sans sa réponse positive, et aucune coordonnée n'est échangée.
 */
export function CandidateOpportunitiesCard() {
  const candidateToken = useMemo(() => getCandidateToken(), []);
  const utils = trpc.useUtils();
  const query = trpc.recruitment.candidateOpportunities.useQuery({ candidateToken: candidateToken ?? "" }, { enabled: Boolean(candidateToken), retry: false });
  const refresh = () => void utils.recruitment.candidateOpportunities.invalidate();
  const respond = trpc.recruitment.candidateRespond.useMutation({ onSuccess: (r) => { toast.success(r.status === "candidate_interested" ? "Votre intérêt est enregistré" : "Réponse enregistrée"); refresh(); }, onError: (e) => toast.error(e.message) });
  const interview = trpc.recruitment.candidateInterviewRespond.useMutation({ onSuccess: () => { toast.success("Réponse enregistrée"); refresh(); }, onError: (e) => toast.error(e.message) });
  const data = query.data;
  // La carte n'apparaît que lorsqu'il y a quelque chose à montrer : un candidat hors CVthèque n'est pas encombré.
  if (!candidateToken || query.error || !data || (data.opportunities.length === 0 && data.interviews.length === 0 && data.notifications.length === 0)) return null;
  return (
    <Card className="border-sky-200" data-testid="candidate-opportunities">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Briefcase className="h-5 w-5 text-sky-700" aria-hidden="true" />Opportunités examinées par 3M</CardTitle>
        <CardDescription>3M a vérifié l’offre avant de vous la soumettre. Vous restez libre de décliner. Une opportunité n’est ni une promesse d’emploi, ni une garantie de visa ou d’admissibilité.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.notifications.slice(0, 3).map((n) => <p key={n.id} className="rounded-lg bg-sky-50 p-2 text-sm text-sky-950"><strong>{n.title}</strong> — {n.message}</p>)}
        {data.opportunities.map((o) => (
          <div key={o.id} className="rounded-xl border border-slate-200 p-3 text-sm" data-testid="candidate-opportunity">
            <p className="font-black text-slate-950">{o.view.title}</p>
            <p className="text-slate-700">{o.view.employer} · {o.view.country}{o.view.workLocation ? ` · ${o.view.workLocation}` : ""}{o.view.contractDuration ? ` · ${o.view.contractDuration}` : ""}{o.view.salary ? ` · ${o.view.salary}` : ""}</p>
            <p className="mt-1 text-slate-700">{o.missions}</p>
            <p className="mt-1 text-xs text-slate-600">Candidatures de l’étranger : {TRI_STATE_LABELS[o.view.foreignApplications].fr} · Sans autorisation de travail locale : {TRI_STATE_LABELS[o.view.noLocalWorkAuth].fr} · Accompagnement : {SUPPORT_LABELS[o.view.intlSupport].fr}</p>
            <p className="mt-1 text-xs text-slate-500">{INTERNATIONAL_FIELDS_NOTICE}</p>
            <p className="mt-2 font-semibold text-slate-900">{o.statusLabel}</p>
            {o.canRespond && (
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" size="sm" className="bg-emerald-700 text-white hover:bg-emerald-800" disabled={respond.isPending} onClick={() => respond.mutate({ candidateToken: candidateToken!, needCandidateId: o.id, interested: true })}>Cette offre m’intéresse</Button>
                <Button type="button" size="sm" variant="outline" disabled={respond.isPending} onClick={() => respond.mutate({ candidateToken: candidateToken!, needCandidateId: o.id, interested: false })}>Je décline</Button>
              </div>
            )}
          </div>
        ))}
        {data.interviews.map((iv) => (
          <div key={`iv-${iv.id}`} className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm" data-testid="candidate-interview">
            <p className="font-black text-indigo-950">Demande d’entretien — {INTERVIEW_STATUS_LABELS[iv.status]}</p>
            <p className="text-indigo-950">{INTERVIEW_MODE_LABELS[iv.mode]}{iv.scheduledAt ? ` · ${new Date(iv.scheduledAt).toLocaleString("fr-FR")}` : ""}</p>
            {iv.canRespond && (
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" size="sm" className="bg-indigo-700 text-white hover:bg-indigo-800" disabled={interview.isPending} onClick={() => interview.mutate({ candidateToken: candidateToken!, interviewId: iv.id, available: true })}>Je suis disponible</Button>
                <Button type="button" size="sm" variant="outline" disabled={interview.isPending} onClick={() => interview.mutate({ candidateToken: candidateToken!, interviewId: iv.id, available: false })}>Je ne suis pas disponible</Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
