import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Download, Eye, FilePenLine, GitCompareArrows, History, Save, Send, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
const evaluationDestinations = ["canada", "luxembourg", "europe"] as const;
type EvaluationDestination = typeof evaluationDestinations[number];
const normalizeDestination = (value: string | null | undefined): EvaluationDestination => {
  const normalized = (value || "").toLowerCase();
  if (normalized.includes("canada")) return "canada";
  if (normalized.includes("luxembourg")) return "luxembourg";
  return "europe";
};

export function EvaluationDeliveryEditor({ sessionToken, sourceRecordId, open, onOpenChange, onCompleted }: Props) {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.unifiedRequests.getEvaluationDelivery.useQuery({ sessionToken, sourceRecordId }, { enabled: open });
  const [score, setScore] = useState("0");
  const [destination, setDestination] = useState<EvaluationDestination>("europe");
  const [verdict, setVerdict] = useState("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [requiresSecondApproval, setRequiresSecondApproval] = useState(false);
  const [comparisonLeftId, setComparisonLeftId] = useState("");
  const [comparisonRightId, setComparisonRightId] = useState("");

  useEffect(() => {
    if (!data?.draft) return;
    setDestination(normalizeDestination(data.draft.destination));
    setScore(String(data.draft.finalScore));
    setVerdict(data.draft.verdict);
    setStrengths(joinLines(data.draft.strengths));
    setWeaknesses(joinLines(data.draft.weaknesses));
    setRecommendations(joinLines(data.draft.recommendations));
    setSubject(data.draft.subject);
    setMessage(data.draft.message);
    setScheduledAt(data.application.evaluationScheduledAt ? new Date(data.application.evaluationScheduledAt).toISOString().slice(0, 16) : "");
    setRequiresSecondApproval(data.draft.requiresSecondApproval);
    setComparisonLeftId(String(data.versions[1]?.id ?? data.versions[0]?.id ?? ""));
    setComparisonRightId(String(data.versions[0]?.id ?? ""));
    setPreviewHtml("");
  }, [data]);

  const payload = useMemo(() => ({
    sessionToken,
    sourceRecordId,
    destination,
    finalScore: Math.max(0, Math.min(100, Number(score) || 0)),
    verdict: verdict.trim() || "Évaluation préliminaire à consulter",
    strengths: splitLines(strengths),
    weaknesses: splitLines(weaknesses),
    recommendations: splitLines(recommendations),
    subject: subject.trim() || undefined,
    message: message.trim() || undefined,
    requiresSecondApproval,
  }), [sessionToken, sourceRecordId, destination, score, verdict, strengths, weaknesses, recommendations, subject, message, requiresSecondApproval]);

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
  const approve = trpc.unifiedRequests.approveSensitiveEvaluation.useMutation({
    onSuccess: (result) => { void utils.unifiedRequests.getEvaluationDelivery.invalidate({ sessionToken, sourceRecordId }); toast({ title: "Bilan approuvé", description: result.message }); },
    onError: (error) => toast({ title: "Approbation impossible", description: error.message, variant: "destructive" }),
  });
  const generateAiDraft = trpc.unifiedRequests.generateDestinationEvaluationDraft.useMutation({
    onSuccess: (result) => {
      setDestination(result.draft.destination);
      setScore(String(result.draft.finalScore));
      setVerdict(result.draft.verdict);
      setStrengths(joinLines(result.draft.strengths));
      setWeaknesses(joinLines(result.draft.weaknesses));
      setRecommendations(joinLines(result.draft.recommendations));
      setPreviewHtml(result.reportHtml);
      void utils.unifiedRequests.getEvaluationDelivery.invalidate({ sessionToken, sourceRecordId });
      toast({ title: "Brouillon IA généré", description: "Relisez et ajustez le bilan. La validation conseiller reste obligatoire avant diffusion." });
    },
    onError: (error) => toast({ title: "Génération IA indisponible", description: error.message, variant: "destructive" }),
  });
  const validateDraft = trpc.unifiedRequests.validateEvaluationDraft.useMutation({
    onSuccess: (result) => {
      void utils.unifiedRequests.getEvaluationDelivery.invalidate({ sessionToken, sourceRecordId });
      toast({ title: "Bilan validé", description: result.message });
    },
    onError: (error) => toast({ title: "Validation impossible", description: error.message, variant: "destructive" }),
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
  const currentDraft = data?.draft ?? { advisorValidated: false };
  const requiresApprovalBeforeDelivery = !currentDraft.advisorValidated || (requiresSecondApproval && data?.application?.evaluationApprovalStatus !== "approved");
  const parseVersionDraft = (version: any) => { try { return JSON.parse(version?.contentJson || "{}").adminDraft ?? {}; } catch { return {}; } };
  const versions = data?.versions ?? [];
  const comparisonLeft = versions.find((version: any) => String(version.id) === comparisonLeftId);
  const comparisonRight = versions.find((version: any) => String(version.id) === comparisonRightId);
  const leftDraft = parseVersionDraft(comparisonLeft);
  const rightDraft = parseVersionDraft(comparisonRight);
  const comparisonRows = [
    ["Score final", String(leftDraft.finalScore ?? "—"), String(rightDraft.finalScore ?? "—")],
    ["Verdict", leftDraft.verdict || "—", rightDraft.verdict || "—"],
    ["Points forts", Array.isArray(leftDraft.strengths) ? leftDraft.strengths.join(" · ") : "—", Array.isArray(rightDraft.strengths) ? rightDraft.strengths.join(" · ") : "—"],
    ["Axes d’amélioration", Array.isArray(leftDraft.weaknesses) ? leftDraft.weaknesses.join(" · ") : "—", Array.isArray(rightDraft.weaknesses) ? rightDraft.weaknesses.join(" · ") : "—"],
    ["Recommandations", Array.isArray(leftDraft.recommendations) ? leftDraft.recommendations.join(" · ") : "—", Array.isArray(rightDraft.recommendations) ? rightDraft.recommendations.join(" · ") : "—"],
  ] as const;
  const exportComparisonPdf = async () => {
    if (!comparisonLeft || !comparisonRight) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    let y = 18;
    const write = (label: string, left: string, right: string) => {
      if (y > 260) { doc.addPage(); y = 18; }
      doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text(label, 14, y); y += 6;
      doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      const leftLines = doc.splitTextToSize(`Version ${comparisonLeft.versionNumber} : ${left}`, 85) as string[];
      const rightLines = doc.splitTextToSize(`Version ${comparisonRight.versionNumber} : ${right}`, 85) as string[];
      const height = Math.max(leftLines.length, rightLines.length) * 5;
      if (y + height > 280) { doc.addPage(); y = 18; }
      doc.text(leftLines, 14, y); doc.text(rightLines, 110, y); y += height + 6;
    };
    doc.setFillColor(30, 58, 138); doc.rect(0, 0, 210, 28, "F"); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.text("3M Travel & Services — Audit de versions", 14, 17);
    doc.setTextColor(31, 41, 55); doc.setFontSize(10); doc.setFont("helvetica", "normal"); y = 40;
    doc.text(`${data.application.fullName} · Dossier ${data.application.dossierNumber}`, 14, y); y += 7;
    doc.text(`Comparatif exporté le ${new Date().toLocaleString("fr-FR")}`, 14, y); y += 10;
    comparisonRows.forEach(([label, left, right]) => write(label, left, right));
    doc.save(`audit-bilan-${data.application.dossierNumber}-v${comparisonLeft.versionNumber}-v${comparisonRight.versionNumber}.pdf`);
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
          <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3"><Label htmlFor="evaluation-destination" className="text-cyan-950">Modèle d’évaluation par destination</Label><div className="mt-2 flex flex-wrap gap-2"><Select value={destination} onValueChange={(value) => setDestination(value as EvaluationDestination)}><SelectTrigger id="evaluation-destination" className="w-full bg-white sm:w-60"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="canada">Canada</SelectItem><SelectItem value="luxembourg">Luxembourg</SelectItem><SelectItem value="europe">Europe</SelectItem></SelectContent></Select><Button type="button" variant="outline" className="border-cyan-300 bg-white" disabled={generateAiDraft.isPending} onClick={() => generateAiDraft.mutate({ sessionToken, sourceRecordId, destination })}>{generateAiDraft.isPending ? "Génération IA…" : "Générer un brouillon IA"}</Button></div><p className="mt-2 text-xs text-cyan-900">Le score est construit sur 100 points et le brouillon demeure obligatoirement soumis à votre relecture.</p></div>
          <div className="grid grid-cols-[120px_1fr] items-end gap-3"><div><Label htmlFor="delivery-score">Score final /100</Label><Input id="delivery-score" className="mt-1" type="number" min="0" max="100" value={score} onChange={(event) => setScore(event.target.value)} /></div><div><Label htmlFor="delivery-verdict">Verdict du conseiller</Label><Input id="delivery-verdict" className="mt-1" value={verdict} onChange={(event) => setVerdict(event.target.value)} placeholder="Ex. Profil favorable sous réserve" /></div></div>
          <div><Label htmlFor="delivery-strengths">Points forts — une ligne par point</Label><Textarea id="delivery-strengths" className="mt-1 min-h-20" value={strengths} onChange={(event) => setStrengths(event.target.value)} placeholder="Expérience professionnelle cohérente\nFormation valorisable" /></div>
          <div><Label htmlFor="delivery-weaknesses">Axes d’amélioration — une ligne par point</Label><Textarea id="delivery-weaknesses" className="mt-1 min-h-20" value={weaknesses} onChange={(event) => setWeaknesses(event.target.value)} placeholder="Justifier le niveau linguistique\nPréparer les attestations de travail" /></div>
          <div><Label htmlFor="delivery-recommendations">Recommandations — une ligne par action</Label><Textarea id="delivery-recommendations" className="mt-1 min-h-24" value={recommendations} onChange={(event) => setRecommendations(event.target.value)} placeholder="Passer un test TCF ou IELTS certifié\nFaire évaluer les diplômes" /></div>
          <div><Label>Modèle de message</Label><Select onValueChange={(value) => applyTemplate(value as keyof typeof MESSAGE_TEMPLATES)}><SelectTrigger className="mt-1"><SelectValue placeholder="Choisir un modèle, puis personnaliser" /></SelectTrigger><SelectContent>{Object.entries(MESSAGE_TEMPLATES).map(([value, template]) => <SelectItem key={value} value={value}>{template.label}</SelectItem>)}</SelectContent></Select></div>
          <div><Label htmlFor="delivery-subject">Objet de l’e-mail</Label><Input id="delivery-subject" className="mt-1" value={subject} onChange={(event) => setSubject(event.target.value)} /></div>
          <div><Label htmlFor="delivery-message">Message personnalisé</Label><Textarea id="delivery-message" className="mt-1 min-h-28" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ajoutez une introduction personnalisée visible en haut du bilan." /></div>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-violet-950"><Checkbox checked={requiresSecondApproval} onCheckedChange={(value) => setRequiresSecondApproval(value === true)} /><span><strong className="block">Bilan sensible : exiger une seconde approbation</strong>Un autre administrateur devra valider cette version avant son envoi ou sa programmation.</span></label>
          <div className={`rounded-lg border p-3 text-sm ${currentDraft.advisorValidated ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-200 bg-amber-50 text-amber-950"}`}><div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" />Validation obligatoire du conseiller : {currentDraft.advisorValidated ? "effectuée" : "à effectuer"}</div><p className="mt-1 text-xs">Chaque modification remet le bilan à contrôler. L’envoi et la programmation restent bloqués tant que cette validation n’est pas enregistrée.</p><Button className="mt-2" size="sm" variant="outline" disabled={validateDraft.isPending || saveDraft.isPending} onClick={async () => { if (await ensureDraft()) validateDraft.mutate({ sessionToken, sourceRecordId, validationComment: "Bilan relu, ajusté si nécessaire et validé avant diffusion." }); }}>{validateDraft.isPending ? "Validation…" : "Valider le bilan après relecture"}</Button></div>
          {requiresSecondApproval && <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900"><div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" />Seconde approbation : {data.application.evaluationApprovalStatus === "approved" ? "approuvée" : data.application.evaluationApprovalStatus === "pending" ? "en attente d’un second administrateur" : "à soumettre"}</div>{data.application.evaluationApprovalStatus === "pending" && <Button className="mt-2" size="sm" variant="outline" disabled={approve.isPending} onClick={() => approve.mutate({ sessionToken, sourceRecordId, approvalComment: "Bilan contrôlé avant diffusion." })}>{approve.isPending ? "Approbation…" : "Approuver comme second administrateur"}</Button>}</div>}
          <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void ensureDraft()} disabled={saveDraft.isPending}><Eye className="mr-1 h-4 w-4" />{saveDraft.isPending ? "Préparation…" : "Prévisualiser"}</Button><Button variant="outline" onClick={() => void ensureDraft()} disabled={saveDraft.isPending}><Save className="mr-1 h-4 w-4" />Enregistrer le brouillon</Button></div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3"><Label htmlFor="delivery-scheduled-at">Planifier l’envoi à une date et heure</Label><Input id="delivery-scheduled-at" className="mt-2" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /><Button className="mt-2" variant="outline" disabled={!scheduledAt || schedule.isPending || saveDraft.isPending || requiresApprovalBeforeDelivery} onClick={async () => { if (requiresSecondApproval) schedule.mutate({ sessionToken, sourceRecordId, scheduledAt: new Date(scheduledAt) }); else if (await ensureDraft()) schedule.mutate({ sessionToken, sourceRecordId, scheduledAt: new Date(scheduledAt) }); }}><CalendarClock className="mr-1 h-4 w-4" />{schedule.isPending ? "Programmation…" : "Programmer l’envoi"}</Button></div>
          <Button className="w-full bg-blue-700 hover:bg-blue-800" disabled={sendNow.isPending || saveDraft.isPending || requiresApprovalBeforeDelivery} onClick={async () => { if (requiresSecondApproval) sendNow.mutate({ sessionToken, sourceRecordId }); else if (await ensureDraft()) sendNow.mutate({ sessionToken, sourceRecordId }); }}><Send className="mr-2 h-4 w-4" />{sendNow.isPending ? "Envoi définitif…" : "Valider et envoyer maintenant"}</Button>
        </div>
        <div className="space-y-4"><div className="min-h-[520px] rounded-lg border border-slate-200 bg-slate-50 p-3"><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"><Eye className="h-4 w-4" />Aperçu du bilan qui sera envoyé</div>{previewHtml ? <iframe title="Prévisualisation du bilan" sandbox="" srcDoc={previewHtml} className="h-[560px] w-full rounded border bg-white" /> : <div className="flex h-[560px] items-center justify-center rounded border border-dashed bg-white p-8 text-center text-sm text-slate-500">Modifiez les éléments nécessaires puis cliquez sur <strong className="ml-1">Prévisualiser</strong> pour consulter le rendu exact avant l’envoi.</div>}</div><div className="rounded-lg border p-3"><p className="flex items-center gap-2 text-sm font-semibold text-slate-800"><History className="h-4 w-4" />Historique des versions</p><div className="mt-3 space-y-2">{data.versions.length ? data.versions.map((version) => <div key={version.id} className="flex items-center justify-between gap-3 rounded border bg-slate-50 p-2 text-xs"><div><strong>Version {version.versionNumber}</strong> · {version.approvalStatus}<br /><span className="text-slate-500">{new Date(version.createdAt).toLocaleString("fr-FR")}</span></div>{version.pdfUrl && <Button asChild size="sm" variant="outline"><a href={version.pdfUrl} target="_blank" rel="noreferrer"><Download className="mr-1 h-3.5 w-3.5" />PDF</a></Button>}</div>) : <p className="text-sm text-slate-500">La première version apparaîtra dès l’enregistrement du brouillon.</p>}</div>{data.versions.length > 1 && <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="flex items-center gap-2 text-sm font-semibold text-indigo-950"><GitCompareArrows className="h-4 w-4" />Comparer deux versions</p><Button size="sm" variant="outline" disabled={!comparisonLeft || !comparisonRight || comparisonLeft.id === comparisonRight.id} onClick={exportComparisonPdf}><Download className="mr-1 h-3.5 w-3.5" />Exporter le comparatif PDF</Button></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><Select value={comparisonLeftId} onValueChange={setComparisonLeftId}><SelectTrigger><SelectValue placeholder="Version précédente" /></SelectTrigger><SelectContent>{data.versions.map((version: any) => <SelectItem key={version.id} value={String(version.id)}>Version {version.versionNumber}</SelectItem>)}</SelectContent></Select><Select value={comparisonRightId} onValueChange={setComparisonRightId}><SelectTrigger><SelectValue placeholder="Version récente" /></SelectTrigger><SelectContent>{data.versions.map((version: any) => <SelectItem key={version.id} value={String(version.id)}>Version {version.versionNumber}</SelectItem>)}</SelectContent></Select></div><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-xs"><thead><tr className="border-b text-slate-500"><th className="p-2">Élément</th><th className="p-2">V{comparisonLeft?.versionNumber ?? "—"}</th><th className="p-2">V{comparisonRight?.versionNumber ?? "—"}</th></tr></thead><tbody>{comparisonRows.map(([label, left, right]) => { const changed = left !== right; return <tr key={label} className="border-b last:border-0"><th className="p-2 font-medium text-slate-700">{label}</th><td className={`p-2 align-top ${changed ? "bg-amber-50 text-amber-950" : "text-slate-700"}`}>{left}</td><td className={`p-2 align-top ${changed ? "bg-emerald-50 text-emerald-950" : "text-slate-700"}`}>{right}</td></tr>; })}</tbody></table></div></div>}</div></div>
      </div>}
    </DialogContent>
  </Dialog>;
}
