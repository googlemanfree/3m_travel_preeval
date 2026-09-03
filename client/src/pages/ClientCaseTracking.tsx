import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronDown, CircleHelp, Clock3, Download, FileText, RefreshCw, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const labels: Record<string, string> = { nouveau: "Dossier créé", en_evaluation: "Évaluation en cours", bilan_envoye: "Bilan envoyé", en_attente_paiement: "Paiement en attente", paye: "Paiement confirmé", en_attente_documents: "Documents requis", documents_recus: "Documents reçus", en_cours_traitement: "Dossier en traitement", soumis: "Dossier soumis", approuve: "Dossier approuvé", visa_approuve: "Visa approuvé" };
const progressFor = (status: string) => Math.min(100, Math.max(10, ({ nouveau: 10, en_evaluation: 20, bilan_envoye: 30, en_attente_paiement: 40, paye: 50, en_attente_documents: 60, documents_recus: 70, en_cours_traitement: 80, soumis: 90, approuve: 100, visa_approuve: 100 } as Record<string, number>)[status] ?? 10));
const workflowStages = [
  { key: "evaluation", label: "Évaluation", statuses: ["nouveau", "en_evaluation", "bilan_envoye"], help: "Analyse initiale du projet et transmission du bilan par l’agence." },
  { key: "payment", label: "Paiement", statuses: ["en_attente_paiement", "paye"], help: "Le paiement est contrôlé et confirmé avant le traitement." },
  { key: "documents", label: "Documents", statuses: ["en_attente_documents", "documents_recus"], help: "Les pièces demandées sont déposées puis vérifiées." },
  { key: "processing", label: "Traitement", statuses: ["en_cours_traitement", "soumis", "approuve", "visa_approuve"], help: "L’agence prépare ou suit la procédure auprès de l’organisme compétent." },
];

function stageIndex(status: string) {
  const index = workflowStages.findIndex((stage) => stage.statuses.includes(status));
  return index < 0 ? 0 : index;
}

function StageTimeline({ status }: { status: string }) {
  const activeIndex = stageIndex(status);
  return (
    <div className="grid grid-cols-4 gap-1.5" aria-label="Progression détaillée du dossier">
      {workflowStages.map((stage, index) => {
        const complete = index < activeIndex || (index === activeIndex && ["bilan_envoye", "paye", "documents_recus", "soumis", "approuve", "visa_approuve"].includes(status));
        const active = index === activeIndex;
        return (
          <Tooltip key={stage.key}>
            <TooltipTrigger asChild>
              <div tabIndex={0} className="min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2" aria-label={`${stage.label} : ${complete ? "terminée" : active ? "en cours" : "à venir"}`}>
                <div className={`mb-2 h-1.5 rounded-full ${complete ? "bg-emerald-500" : active ? "bg-blue-600" : "bg-slate-200"}`} />
                <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${complete ? "text-emerald-700" : active ? "text-blue-800" : "text-slate-400"}`}>
                  {complete ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : active ? <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-current" aria-hidden="true" />}
                  <span className="truncate">{stage.label}</span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">{stage.help}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

export default function ClientCaseTracking() {
  const utils = trpc.useUtils();
  const [expandedCaseId, setExpandedCaseId] = useState<number | null>(null);
  const tracking = trpc.caseTracking.getMyCases.useQuery(undefined, { retry: false });
  const insurance = trpc.caseTracking.getMyInsuranceRequests.useQuery(undefined, { retry: false });
  const refresh = async () => { await Promise.all([utils.caseTracking.getMyCases.invalidate(), utils.caseTracking.getMyInsuranceRequests.invalidate()]); toast.success("Vos informations ont été actualisées."); };
  const downloadDocument = async (id: number) => { try { const result = await utils.caseTracking.downloadMyDocument.fetch({ documentId: id }); window.open(result.url, "_blank", "noopener,noreferrer"); } catch { toast.error("Document indisponible."); } };
  const downloadCoupon = async (id: number) => { try { const result = await utils.caseTracking.downloadMyInsuranceCoupon.fetch({ insuranceRequestId: id }); window.open(result.url, "_blank", "noopener,noreferrer"); } catch { toast.error("Coupon indisponible."); } };
  const downloadAttestation = async (id: number) => { try { const result = await utils.caseTracking.downloadMyInsuranceAttestation.fetch({ insuranceRequestId: id }); window.open(result.url, "_blank", "noopener,noreferrer"); } catch { toast.error("Attestation indisponible."); } };
  const loading = tracking.isLoading || insurance.isLoading;

  return <TooltipProvider delayDuration={180}><main className="min-h-screen bg-slate-50 pb-16 pt-24"><div className="container max-w-6xl space-y-6">
    <section className="rounded-3xl bg-gradient-to-br from-[#052b56] to-[#0b5ca8] p-7 text-white shadow-xl"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="flex items-center gap-2 text-sm text-blue-100"><ShieldCheck className="h-4 w-4" aria-hidden="true" /> Espace client sécurisé</p><h1 className="mt-2 text-3xl font-bold">Suivi de mes dossiers</h1><p className="mt-2 text-blue-100">Consultez vos étapes, documents et attestations depuis un seul espace.</p></div><Button variant="secondary" onClick={refresh} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />Actualiser</Button></div></section>
    {tracking.isError ? <Card className="border-amber-200 bg-amber-50"><CardContent className="p-6"><p className="font-semibold">Connexion candidate requise</p><p className="mt-1 text-sm">Connectez-vous pour voir exclusivement les dossiers associés à votre compte.</p><Button asChild className="mt-4"><Link href="/login">Se connecter</Link></Button></CardContent></Card> : null}
    <section className="grid gap-4 md:grid-cols-3"><Card><CardContent className="p-5"><p className="text-2xl font-bold">{tracking.data?.cases.length ?? 0}</p><p className="text-sm text-muted-foreground">Dossiers suivis</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-2xl font-bold">{tracking.data?.unreadNotifications ?? 0}</p><p className="text-sm text-muted-foreground">Notifications non lues</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Actualisation manuelle</p><p className="font-semibold">À la demande</p></CardContent></Card></section>
    <section className="space-y-4"><div><h2 className="text-xl font-bold">Mes dossiers</h2><p className="text-sm text-muted-foreground">Les informations sont filtrées par votre identité candidate côté serveur.</p></div>{loading ? <Card><CardContent className="p-8 text-center text-muted-foreground">Chargement…</CardContent></Card> : null}{!loading && !tracking.data?.cases.length ? <Card><CardContent className="p-8 text-center"><FileText className="mx-auto h-10 w-10 text-blue-700" aria-hidden="true" /><p className="mt-3 font-semibold">Aucun dossier associé à votre compte</p><Button asChild className="mt-4"><Link href="/evaluation">Lancer une évaluation</Link></Button></CardContent></Card> : null}{tracking.data?.cases.map(item => { const expanded = expandedCaseId === item.id; const percent = progressFor(item.currentStatus); const processedDocuments = item.requirements.filter(req => ["received", "approved", "waived"].includes(req.status)).length; return <Card key={item.id} className="overflow-hidden border-slate-200 shadow-sm transition-shadow hover:shadow-md"><CardHeader><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><CardTitle>{item.caseNumber}</CardTitle><CardDescription>{item.countryTarget || "Destination à confirmer"} · {item.visaType || item.caseType || "Procédure"}</CardDescription></div><Tooltip><TooltipTrigger asChild><Badge tabIndex={0} className="w-fit cursor-help outline-none focus-visible:ring-2 focus-visible:ring-blue-700">{labels[item.currentStatus] || item.currentStatus}<CircleHelp className="ml-1 h-3 w-3" aria-hidden="true" /></Badge></TooltipTrigger><TooltipContent>Statut transmis par l’agence : {labels[item.currentStatus] || item.currentStatus}.</TooltipContent></Tooltip></div></CardHeader><CardContent className="space-y-4"><div><div className="mb-2 flex items-center justify-between text-sm"><span className="font-semibold">Avancement du dossier</span><span className="font-bold text-blue-800">{percent}%</span></div><Tooltip><TooltipTrigger asChild><div tabIndex={0} className="cursor-help outline-none focus-visible:ring-2 focus-visible:ring-blue-700"><Progress value={percent} aria-label={`Avancement du dossier : ${percent}%`} /></div></TooltipTrigger><TooltipContent>Cette progression reflète la dernière étape synchronisée par l’agence.</TooltipContent></Tooltip></div><StageTimeline status={item.currentStatus} /><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-600"><strong>Documents :</strong> {processedDocuments}/{item.requirements.length || 0} traités</p><Button type="button" variant="outline" size="sm" onClick={() => setExpandedCaseId(expanded ? null : item.id)} aria-expanded={expanded} aria-controls={`case-details-${item.id}`}>{expanded ? "Réduire les détails" : "Voir les détails"}<ChevronDown className={`ml-2 h-4 w-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} aria-hidden="true" /></Button></div><AnimatePresence initial={false}>{expanded && <motion.div id={`case-details-${item.id}`} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="overflow-hidden"><div className="border-t border-slate-100 pt-4"><p className="text-sm leading-6 text-slate-600">Les étapes sont mises à jour après vérification humaine. Consultez les documents disponibles ci-dessous et contactez l’agence si une information vous semble incorrecte.</p>{item.documents.length ? <div className="mt-4 flex flex-wrap gap-2">{item.documents.map(doc => <Button key={doc.id} variant="outline" size="sm" onClick={() => downloadDocument(doc.id)}><Download className="mr-2 h-3.5 w-3.5" aria-hidden="true" />{doc.fileName}</Button>)}</div> : <p className="mt-4 text-sm text-slate-500">Aucun document final n’est encore disponible dans cet espace.</p>}</div></motion.div>}</AnimatePresence></CardContent></Card>; })}</section>
    <section className="space-y-4"><div><h2 className="text-xl font-bold">Mes assurances voyage</h2><p className="text-sm text-muted-foreground">Votre coupon est disponible dès l’enregistrement ; l’attestation suit la finalisation par l’agence.</p></div>{insurance.data?.length ? <div className="grid gap-4 md:grid-cols-2">{insurance.data.map(item => <Card key={item.id}><CardContent className="space-y-3 p-5"><div className="flex justify-between gap-2"><div><p className="font-semibold">{item.reference}</p><p className="text-sm text-muted-foreground">{item.destinationCountry} · {item.coveragePlan}</p></div><Badge variant="outline">{item.status}</Badge></div><div className="grid gap-2">{item.couponFileName ? <Button className="w-full" variant="outline" onClick={() => downloadCoupon(item.id)}><Download className="mr-2 h-4 w-4" aria-hidden="true" />Télécharger le coupon</Button> : null}{item.attestationFileName ? <Button className="w-full" onClick={() => downloadAttestation(item.id)}><Download className="mr-2 h-4 w-4" aria-hidden="true" />Télécharger l’attestation</Button> : <p className="text-sm text-muted-foreground">Attestation en attente de finalisation.</p>}</div></CardContent></Card>)}</div> : <Card><CardContent className="p-5 text-sm text-muted-foreground">Aucune demande d’assurance associée à ce compte.</CardContent></Card>}</section>
  </div></main></TooltipProvider>;
}
