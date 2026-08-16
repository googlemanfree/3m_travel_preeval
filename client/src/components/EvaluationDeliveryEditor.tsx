import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Eye, FilePenLine, Loader2, Save, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

type Props = {
  sessionToken: string;
  sourceRecordId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
};

const MESSAGE_TEMPLATES = {
  standard: {
    label: "Bilan standard",
    subject: "Votre Bilan d'Évaluation - 3M Travel & Services",
    message: "Bonjour,\n\nNotre équipe a finalisé l'analyse préliminaire de votre profil. Vous trouverez dans ce bilan vos points forts, les axes à renforcer et les prochaines étapes recommandées pour votre projet de mobilité internationale.",
  },
  promising: {
    label: "Profil prometteur",
    subject: "Votre profil présente de belles perspectives - 3M Travel",
    message: "Bonjour,\n\nVotre profil présente des atouts intéressants pour votre projet. Nous vous invitons à consulter le bilan joint et à préparer les éléments recommandés afin de renforcer votre candidature.",
  },
  improvement: {
    label: "Profil à renforcer",
    subject: "Votre plan d'amélioration personnalisé - 3M Travel",
    message: "Bonjour,\n\nNotre analyse identifie des axes précis à renforcer avant la suite de votre procédure. Votre bilan détaille les actions prioritaires qui permettront d'améliorer la présentation et la cohérence de votre dossier.",
  },
} as const;

const splitLines = (value: string) => value.split("\n").map((item) => item.trim()).filter(Boolean);
const joinLines = (values: string[]) => values.join("\n");

export function EvaluationDeliveryEditor({ sessionToken, sourceRecordId, open, onOpenChange, onCompleted }: Props) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.unifiedRequests.getEvaluationDelivery.useQuery({ sessionToken, sourceRecordId }, { enabled: open });
  const [score, setScore] = useState("0");
  const [verdict, setVerdict] = useState("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");

  useEffect(() => {
    if (!data?.draft) return;
    setScore(String(data.draft.finalScore));
    setVerdict(data.draft.verdict);
    setStrengths(joinLines(data.draft.strengths));
    setWeaknesses(joinLines(data.draft.weaknesses));
    setRecommendations(joinLines(data.draft.recommendations));
    setSubject(data.draft.subject);
    setMessage(data.draft.message);
    setScheduledAt(data.application.evaluationScheduledAt ? new Date(data.application.evaluationScheduledAt).toISOString().slice(0, 16) : "");
    setPreviewHtml("");
  }, [data]);

  const payload = useMemo(() => ({
    sessionToken,
    sourceRecordId,
    finalScore: Math.max(0, Math.min(100, Number(score) || 0)),
    verdict: verdict.trim() || "Évaluation préliminaire à consulter",
    strengths: splitLines(strengths),
    weaknesses: splitLines(weaknesses),
    recommendations: splitLines(recommendations),
    subject: subject.trim() || undefined,
    message: message.trim() || undefined,
  }), [sessionToken, sourceRecordId, score, verdict, strengths, weaknesses, recommendations, subject, message]);

  const saveDraft = trpc.unifiedRequests.saveEvaluationDeliveryDraft.useMutation({
    onSuccess: (result) => {
      setPreviewHtml(result.reportHtml);
      void utils.unifiedRequests.getEvaluationDelivery.invalidate({ sessionToken, sourceRecordId });
      toast({ title: "Brouillon enregistré", description: "La prévisualisation reflète le bilan qui sera envoyé." });
    },
    onError: (error) => toast({ title: "Brouillon non enregistré", description: error.message, variant: "destructive" }),
  });
  const sendNow = trpc.unifiedRequests.sendEvaluationNow.useMutation({
    onSuccess: (result) => {
      toast({ title: "Bilan envoyé", description: result.message });
      onCompleted();
      onOpenChange(false);
    },
    onError: (error) => toast({ title: "Envoi impossible", description: error.message, variant: "destructive" }),
  });
  const schedule = trpc.unifiedRequests.scheduleEvaluationDelivery.useMutation({
    onSuccess: (result) => {
      toast({ title: "Envoi programmé", description: result.message });
      onCompleted();
      onOpenChange(false);
    },
    onError: (error) => toast({ title: "Planification impossible", description: error.message, variant: "destructive" }),
  });

  const ensureDraft = async () => {
    if (!payload.recommendations.length) {
      toast({ title: "Recommandation requise", description: "Ajoutez au moins une recommandation personnalisée avant l’envoi.", variant: "destructive" });
      return false;
    }
    await saveDraft.mutateAsync(payload);
    return true;
  };

  const applyTemplate = (key: keyof typeof MESSAGE_TEMPLATES) => {
    const template = MESSAGE_TEMPLATES[key];
    setSubject(template.subject);
    setMessage(template.message);
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[94vh] max-w-6xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><FilePenLine className="h-5 w-5 text-blue-700" />Préparer le bilan avant envoi</DialogTitle>
        <DialogDescription>Modifiez le résultat, choisissez un message, prévisualisez le rendu, puis envoyez maintenant ou programmez la diffusion. L’envoi automatique à 48 h reste uniquement un filet de sécurité.</DialogDescription>
      </DialogHeader>
      {isLoading || !data ? <div className="py-12 text-center text-sm text-slate-500">Chargement du brouillon d’évaluation…</div> : <div className="grid gap-5 xl:grid-cols-[1fr_1.05fr]">
        <div className="space-y-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950"><strong>{data.application.fullName}</strong> · {data.application.dossierNumber} · {data.application.destination || "Destination à préciser"}</div>
          <div className="grid grid-cols-[120px_1fr] items-end gap-3"><div><Label htmlFor="delivery-score">Score final /100</Label><Input id="delivery-score" className="mt-1" type="number" min="0" max="100" value={score} onChange={(event) => setScore(event.target.value)} /></div><div><Label htmlFor="delivery-verdict">Verdict du conseiller</Label><Input id="delivery-verdict" className="mt-1" value={verdict} onChange={(event) => setVerdict(event.target.value)} placeholder="Ex. Profil favorable sous réserve" /></div></div>
          <div><Label htmlFor="delivery-strengths">Points forts — une ligne par point</Label><Textarea id="delivery-strengths" className="mt-1 min-h-20" value={strengths} onChange={(event) => setStrengths(event.target.value)} placeholder="Expérience professionnelle cohérente\nFormation valorisable" /></div>
          <div><Label htmlFor="delivery-weaknesses">Axes d’amélioration — une ligne par point</Label><Textarea id="delivery-weaknesses" className="mt-1 min-h-20" value={weaknesses} onChange={(event) => setWeaknesses(event.target.value)} placeholder="Justifier le niveau linguistique\nPréparer les attestations de travail" /></div>
          <div><Label htmlFor="delivery-recommendations">Recommandations — une ligne par action</Label><Textarea id="delivery-recommendations" className="mt-1 min-h-24" value={recommendations} onChange={(event) => setRecommendations(event.target.value)} placeholder="Passer un test TCF ou IELTS certifié\nFaire évaluer les diplômes" /></div>
          <div><Label>Modèle de message</Label><Select onValueChange={(value) => applyTemplate(value as keyof typeof MESSAGE_TEMPLATES)}><SelectTrigger className="mt-1"><SelectValue placeholder="Choisir un modèle, puis personnaliser" /></SelectTrigger><SelectContent>{Object.entries(MESSAGE_TEMPLATES).map(([value, template]) => <SelectItem key={value} value={value}>{template.label}</SelectItem>)}</SelectContent></Select></div>
          <div><Label htmlFor="delivery-subject">Objet de l’e-mail</Label><Input id="delivery-subject" className="mt-1" value={subject} onChange={(event) => setSubject(event.target.value)} /></div>
          <div><Label htmlFor="delivery-message">Message personnalisé</Label><Textarea id="delivery-message" className="mt-1 min-h-28" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ajoutez une introduction personnalisée visible en haut du bilan." /></div>
          <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void ensureDraft()} disabled={saveDraft.isPending}><Eye className="mr-1 h-4 w-4" />{saveDraft.isPending ? "Préparation…" : "Prévisualiser"}</Button><Button variant="outline" onClick={() => void ensureDraft()} disabled={saveDraft.isPending}><Save className="mr-1 h-4 w-4" />Enregistrer le brouillon</Button></div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3"><Label htmlFor="delivery-scheduled-at">Planifier l’envoi à une date et heure</Label><Input id="delivery-scheduled-at" className="mt-2" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /><Button className="mt-2" variant="outline" disabled={!scheduledAt || schedule.isPending || saveDraft.isPending} onClick={async () => { if (await ensureDraft()) schedule.mutate({ sessionToken, sourceRecordId, scheduledAt: new Date(scheduledAt) }); }}><CalendarClock className="mr-1 h-4 w-4" />{schedule.isPending ? "Programmation…" : "Programmer l’envoi"}</Button></div>
          <Button className="w-full bg-blue-700 hover:bg-blue-800" disabled={sendNow.isPending || saveDraft.isPending} onClick={async () => { if (await ensureDraft()) sendNow.mutate({ sessionToken, sourceRecordId }); }}><Send className="mr-2 h-4 w-4" />{sendNow.isPending ? "Envoi définitif…" : "Valider et envoyer maintenant"}</Button>
        </div>
        <div className="min-h-[620px] rounded-lg border border-slate-200 bg-slate-50 p-3"><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"><Eye className="h-4 w-4" />Aperçu du bilan qui sera envoyé</div>{previewHtml ? <iframe title="Prévisualisation du bilan" sandbox="" srcDoc={previewHtml} className="h-[680px] w-full rounded border bg-white" /> : <div className="flex h-[680px] items-center justify-center rounded border border-dashed bg-white p-8 text-center text-sm text-slate-500">Modifiez les éléments nécessaires puis cliquez sur <strong className="ml-1">Prévisualiser</strong> pour consulter le rendu exact avant l’envoi.</div>}</div>
      </div>}
    </DialogContent>
  </Dialog>;
}
