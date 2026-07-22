/**
 * CandidateManager — Composant admin pour gérer les candidats inscrits
 * Affiche la liste des candidats avec leurs étapes, paiements et documents remis.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, Search, ChevronDown, ChevronUp, Plus, CheckCircle, Clock,
  AlertCircle, XCircle, CreditCard, FileText, Download, Loader2,
  MessageCircle, RefreshCw, TrendingUp
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Candidate = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  nationality: string | null;
  destination: string | null;
  visaType: string | null;
  dossierStatus: string | null;
  formulaChosen: string | null;
  scoreResult: string | null;
  educationLevel: string | null;
  employmentStatus: string | null;
  languageLevel: string | null;
  dossierNote: string | null;
  createdAt: Date | null;
  lastLoginAt: Date | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  nouveau:          { label: "Nouveau",        color: "text-slate-300",  bg: "bg-slate-700" },
  evaluation:       { label: "Évaluation",     color: "text-blue-300",   bg: "bg-blue-900/50" },
  paiement:         { label: "Paiement",       color: "text-yellow-300", bg: "bg-yellow-900/50" },
  en_cours:         { label: "En cours",       color: "text-orange-300", bg: "bg-orange-900/50" },
  documents_requis: { label: "Docs requis",    color: "text-red-300",    bg: "bg-red-900/50" },
  soumis:           { label: "Soumis",         color: "text-purple-300", bg: "bg-purple-900/50" },
  approuve:         { label: "Approuvé ✓",     color: "text-green-300",  bg: "bg-green-900/50" },
  refuse:           { label: "Refusé",         color: "text-red-400",    bg: "bg-red-900/70" },
};

const STEP_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending:      { label: "En attente", color: "text-gray-500",  bg: "bg-gray-100",  icon: Clock },
  in_progress:  { label: "En cours",   color: "text-blue-600",  bg: "bg-blue-100",  icon: Clock },
  completed:    { label: "Terminé",    color: "text-green-600", bg: "bg-green-100", icon: CheckCircle },
  blocked:      { label: "Bloqué",     color: "text-red-600",   bg: "bg-red-100",   icon: AlertCircle },
  not_required: { label: "Non requis", color: "text-gray-400",  bg: "bg-gray-50",   icon: XCircle },
};

const PAYMENT_METHODS = [
  { value: "mtn_momo",     label: "MTN MoMo" },
  { value: "orange_money", label: "Orange Money" },
  { value: "virement",     label: "Virement" },
  { value: "especes",      label: "Espèces" },
  { value: "carte",        label: "Carte bancaire" },
  { value: "autre",        label: "Autre" },
];

const STEP_TEMPLATES = [
  { label: "Évaluation du profil", category: "evaluation" },
  { label: "Paiement des frais", category: "paiement" },
  { label: "Collecte des documents", category: "documents" },
  { label: "Tests de langue (TCF/TEF)", category: "tests" },
  { label: "Évaluation WES/IQAS", category: "equivalence" },
  { label: "Rédaction du dossier", category: "candidature" },
  { label: "Soumission Express Entry", category: "immigration" },
  { label: "Invitation à présenter (ITA)", category: "immigration" },
  { label: "Demande de résidence permanente", category: "immigration" },
  { label: "Biométrie", category: "visa" },
  { label: "Décision finale", category: "visa" },
  { label: "Arrivée au Canada", category: "arrivee" },
];

// ─── Composant principal ──────────────────────────────────────────────────────
export default function CandidateManager() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<Record<number, "steps" | "payments" | "docs">>({}); 
  const [addingStep, setAddingStep] = useState<number | null>(null);
  const [addingPayment, setAddingPayment] = useState<number | null>(null);
  const [addingDoc, setAddingDoc] = useState<number | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<number, string>>({});
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);

  // Forms state
  const [stepForm, setStepForm] = useState({ stepLabel: "", stepCategory: "general", description: "", status: "pending" as const });
  const [paymentForm, setPaymentForm] = useState({ amount: "", paymentMethod: "mtn_momo" as const, label: "", transactionRef: "", status: "confirmed" as const });
  const [docForm, setDocForm] = useState({ docLabel: "", fileUrl: "", notes: "" });

  const utils = trpc.useUtils();

  const { data: candidates, isLoading, refetch } = trpc.candidate.adminListCandidates.useQuery(undefined, {
    retry: false,
  });

  const updateStatus = trpc.candidate.adminUpdateCandidateStatus.useMutation({
    onSuccess: () => { utils.candidate.adminListCandidates.invalidate(); setStatusUpdating(null); },
  });

  const addStep = trpc.candidate.adminAddStep.useMutation({
    onSuccess: (_, vars) => {
      utils.candidate.adminGetCandidateSummary.invalidate({ candidateId: vars.candidateId });
      setAddingStep(null);
      setStepForm({ stepLabel: "", stepCategory: "general", description: "", status: "pending" });
    },
  });

  const updateStep = trpc.candidate.adminUpdateStep.useMutation({
    onSuccess: (_, vars) => {
      // invalidate the summary for the expanded candidate
      if (expandedId) utils.candidate.adminGetCandidateSummary.invalidate({ candidateId: expandedId });
    },
  });

  const deleteStep = trpc.candidate.adminDeleteStep.useMutation({
    onSuccess: () => {
      if (expandedId) utils.candidate.adminGetCandidateSummary.invalidate({ candidateId: expandedId });
    },
  });

  const addPayment = trpc.candidate.adminAddPayment.useMutation({
    onSuccess: (_, vars) => {
      utils.candidate.adminGetCandidateSummary.invalidate({ candidateId: vars.candidateId });
      setAddingPayment(null);
      setPaymentForm({ amount: "", paymentMethod: "mtn_momo", label: "", transactionRef: "", status: "confirmed" });
    },
  });

  const deliverDoc = trpc.candidate.adminDeliverDocument.useMutation({
    onSuccess: (_, vars) => {
      utils.candidate.adminGetCandidateSummary.invalidate({ candidateId: vars.candidateId });
      setAddingDoc(null);
      setDocForm({ docLabel: "", fileUrl: "", notes: "" });
    },
  });

  const filtered = (candidates ?? []).filter(c =>
    !search || c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.destination ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
      {/* En-tête */}
      <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Candidats inscrits</h2>
            <p className="text-slate-400 text-xs">{candidates?.length ?? 0} candidat{(candidates?.length ?? 0) > 1 ? "s" : ""} enregistré{(candidates?.length ?? 0) > 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9 bg-white/10 border-white/20 text-white placeholder:text-slate-500 w-56 h-9 text-sm"
            />
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 bg-transparent h-9">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
        </div>
      ) : !filtered.length ? (
        <div className="p-12 text-center text-slate-400">
          <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="font-medium">Aucun candidat trouvé</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {filtered.map(candidate => {
            const isExpanded = expandedId === candidate.id;
            const subTab = activeSubTab[candidate.id] ?? "steps";
            const statusConf = STATUS_CONFIG[candidate.dossierStatus ?? "nouveau"] ?? STATUS_CONFIG.nouveau;

            return (
              <CandidateRow
                key={candidate.id}
                candidate={candidate}
                isExpanded={isExpanded}
                subTab={subTab}
                statusConf={statusConf}
                noteInputs={noteInputs}
                statusUpdating={statusUpdating}
                addingStep={addingStep}
                addingPayment={addingPayment}
                addingDoc={addingDoc}
                stepForm={stepForm}
                paymentForm={paymentForm}
                docForm={docForm}
                onToggleExpand={() => setExpandedId(isExpanded ? null : candidate.id)}
                onSubTabChange={(tab: "steps" | "payments" | "docs") => setActiveSubTab(prev => ({ ...prev, [candidate.id]: tab }))}
                onNoteChange={(val: string) => setNoteInputs(prev => ({ ...prev, [candidate.id]: val }))}
                onStatusChange={(status: string) => {
                  setStatusUpdating(candidate.id);
                  updateStatus.mutate({ candidateId: candidate.id, dossierStatus: status, dossierNote: noteInputs[candidate.id] });
                }}
                onAddStepToggle={() => setAddingStep(addingStep === candidate.id ? null : candidate.id)}
                onAddPaymentToggle={() => setAddingPayment(addingPayment === candidate.id ? null : candidate.id)}
                onAddDocToggle={() => setAddingDoc(addingDoc === candidate.id ? null : candidate.id)}
                onStepFormChange={(f: typeof stepForm) => setStepForm(f)}
                onPaymentFormChange={(f: typeof paymentForm) => setPaymentForm(f)}
                onDocFormChange={(f: typeof docForm) => setDocForm(f)}
                onSubmitStep={() => addStep.mutate({ candidateId: candidate.id, ...stepForm, sortOrder: 0 })}
                onSubmitPayment={() => addPayment.mutate({ candidateId: candidate.id, amount: parseFloat(paymentForm.amount), paymentMethod: paymentForm.paymentMethod, label: paymentForm.label || undefined, transactionRef: paymentForm.transactionRef || undefined, status: paymentForm.status })}
                onSubmitDoc={() => deliverDoc.mutate({ candidateId: candidate.id, docLabel: docForm.docLabel, fileUrl: docForm.fileUrl || undefined, notes: docForm.notes || undefined })}
                onUpdateStep={(stepId: number, status: string) => updateStep.mutate({ stepId, status: status as any })}
                onDeleteStep={(stepId: number) => deleteStep.mutate({ stepId })}
                isSubmittingStep={addStep.isPending}
                isSubmittingPayment={addPayment.isPending}
                isSubmittingDoc={deliverDoc.isPending}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sous-composant : ligne candidat ─────────────────────────────────────────
function CandidateRow({
  candidate, isExpanded, subTab, statusConf, noteInputs, statusUpdating,
  addingStep, addingPayment, addingDoc, stepForm, paymentForm, docForm,
  onToggleExpand, onSubTabChange, onNoteChange, onStatusChange,
  onAddStepToggle, onAddPaymentToggle, onAddDocToggle,
  onStepFormChange, onPaymentFormChange, onDocFormChange,
  onSubmitStep, onSubmitPayment, onSubmitDoc,
  onUpdateStep, onDeleteStep,
  isSubmittingStep, isSubmittingPayment, isSubmittingDoc,
}: any) {
  const summaryQuery = trpc.candidate.adminGetCandidateSummary.useQuery(
    { candidateId: candidate.id },
    { enabled: isExpanded }
  );

  const summary = summaryQuery.data;

  return (
    <div className="bg-white/2">
      {/* Ligne principale */}
      <div
        className="px-6 py-4 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-black text-sm">
          {candidate.fullName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-sm">{candidate.fullName}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusConf.bg} ${statusConf.color}`}>
              {statusConf.label}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3 flex-wrap">
            <span>{candidate.email}</span>
            {candidate.destination && <span>🌍 {candidate.destination}</span>}
            {candidate.formulaChosen && <span>📋 {candidate.formulaChosen}</span>}
            {candidate.createdAt && <span>📅 {new Date(candidate.createdAt).toLocaleDateString("fr-FR")}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/${candidate.phone?.replace(/\D/g, "")}?text=Bonjour%20${encodeURIComponent(candidate.fullName)}%2C%20votre%20conseiller%203M%20Travel%20vous%20contacte.`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="w-8 h-8 bg-green-600/20 hover:bg-green-600/40 rounded-lg flex items-center justify-center transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-green-400" />
          </a>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Panneau étendu */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-white/5 pt-4">
          {/* Statut + note */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <Input
              value={noteInputs[candidate.id] ?? candidate.dossierNote ?? ""}
              onChange={e => onNoteChange(e.target.value)}
              placeholder="Note interne conseiller..."
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-sm h-9"
            />
            <Select
              value={candidate.dossierStatus ?? "nouveau"}
              onValueChange={onStatusChange}
            >
              <SelectTrigger className="w-44 bg-white/10 border-white/20 text-white text-sm h-9">
                {statusUpdating === candidate.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SelectValue />}
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([key, conf]) => (
                  <SelectItem key={key} value={key}>{conf.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sous-onglets */}
          <div className="flex gap-1 mb-4 bg-white/5 rounded-xl p-1">
            {[
              { key: "steps",    label: "Étapes", icon: TrendingUp },
              { key: "payments", label: "Paiements", icon: CreditCard },
              { key: "docs",     label: "Documents remis", icon: FileText },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => onSubTabChange(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                  subTab === key ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {summaryQuery.isLoading ? (
            <div className="py-8 text-center"><Loader2 className="w-6 h-6 text-blue-400 animate-spin mx-auto" /></div>
          ) : (
            <>
              {/* ── Étapes ── */}
              {subTab === "steps" && (
                <div className="space-y-2">
                  {summary?.steps?.length ? summary.steps.map((step: any) => {
                    const sc = STEP_STATUS_CONFIG[step.status] ?? STEP_STATUS_CONFIG.pending;
                    const StepIcon = sc.icon;
                    return (
                      <div key={step.id} className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${sc.bg}`}>
                          <StepIcon className={`w-4 h-4 ${sc.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white">{step.stepLabel}</div>
                          {step.description && <div className="text-xs text-slate-400">{step.description}</div>}
                        </div>
                        <Select
                          value={step.status}
                          onValueChange={(v) => onUpdateStep(step.id, v)}
                        >
                          <SelectTrigger className="w-36 bg-white/10 border-white/20 text-white text-xs h-7">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STEP_STATUS_CONFIG).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <button
                          onClick={() => onDeleteStep(step.id)}
                          className="w-7 h-7 bg-red-900/30 hover:bg-red-900/60 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-6 text-slate-500 text-sm">Aucune étape définie</div>
                  )}

                  {/* Ajouter une étape */}
                  {addingStep === candidate.id ? (
                    <div className="bg-white/5 rounded-xl p-4 space-y-3 border border-blue-500/30">
                      <div className="flex gap-2">
                        <Select value={stepForm.stepLabel} onValueChange={v => onStepFormChange({ ...stepForm, stepLabel: v })}>
                          <SelectTrigger className="flex-1 bg-white/10 border-white/20 text-white text-sm h-9">
                            <SelectValue placeholder="Choisir un modèle d'étape..." />
                          </SelectTrigger>
                          <SelectContent>
                            {STEP_TEMPLATES.map(t => (
                              <SelectItem key={t.label} value={t.label}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={stepForm.stepLabel}
                          onChange={e => onStepFormChange({ ...stepForm, stepLabel: e.target.value })}
                          placeholder="Ou saisir une étape personnalisée..."
                          className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-sm h-9"
                        />
                      </div>
                      <Input
                        value={stepForm.description}
                        onChange={e => onStepFormChange({ ...stepForm, description: e.target.value })}
                        placeholder="Description (optionnel)"
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-sm h-9"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={onSubmitStep}
                          disabled={!stepForm.stepLabel || isSubmittingStep}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isSubmittingStep ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                          Ajouter
                        </Button>
                        <Button onClick={onAddStepToggle} variant="outline" size="sm" className="border-white/20 text-white bg-transparent hover:bg-white/10">
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={onAddStepToggle} variant="outline" size="sm" className="w-full border-dashed border-white/20 text-slate-400 hover:text-white bg-transparent hover:bg-white/5">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter une étape
                    </Button>
                  )}
                </div>
              )}

              {/* ── Paiements ── */}
              {subTab === "payments" && (
                <div className="space-y-2">
                  {summary?.financials && (
                    <div className="bg-gradient-to-r from-blue-900/40 to-blue-800/30 border border-blue-500/20 rounded-xl p-4 mb-3">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className="text-lg font-black text-green-400">{summary.financials.totalPaid.toLocaleString("fr-FR")}</div>
                          <div className="text-xs text-slate-400">Versé (FCFA)</div>
                        </div>
                        <div>
                          <div className="text-lg font-black text-red-400">{summary.financials.remainingAmount.toLocaleString("fr-FR")}</div>
                          <div className="text-xs text-slate-400">Restant (FCFA)</div>
                        </div>
                        <div>
                          <div className="text-lg font-black text-white">{summary.financials.totalAmount.toLocaleString("fr-FR")}</div>
                          <div className="text-xs text-slate-400">Total (FCFA)</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {summary?.payments?.length ? summary.payments.map((p: any) => (
                    <div key={p.id} className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
                      <CreditCard className={`w-4 h-4 flex-shrink-0 ${p.status === "confirmed" ? "text-green-400" : p.status === "rejected" ? "text-red-400" : "text-yellow-400"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white">{p.label ?? "Versement"}</div>
                        <div className="text-xs text-slate-400">{PAYMENT_METHODS.find(m => m.value === p.paymentMethod)?.label ?? p.paymentMethod} · {new Date(p.createdAt).toLocaleDateString("fr-FR")}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-white text-sm">{p.amount.toLocaleString("fr-FR")} FCFA</div>
                        <Badge className={`text-xs ${p.status === "confirmed" ? "bg-green-900/50 text-green-300 border-green-700" : p.status === "rejected" ? "bg-red-900/50 text-red-300 border-red-700" : "bg-yellow-900/50 text-yellow-300 border-yellow-700"}`}>
                          {p.status === "confirmed" ? "Confirmé" : p.status === "rejected" ? "Refusé" : "En attente"}
                        </Badge>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-6 text-slate-500 text-sm">Aucun paiement enregistré</div>
                  )}

                  {addingPayment === candidate.id ? (
                    <div className="bg-white/5 rounded-xl p-4 space-y-3 border border-green-500/30">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={paymentForm.amount}
                          onChange={e => onPaymentFormChange({ ...paymentForm, amount: e.target.value })}
                          placeholder="Montant (FCFA)"
                          type="number"
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-sm h-9"
                        />
                        <Select value={paymentForm.paymentMethod} onValueChange={v => onPaymentFormChange({ ...paymentForm, paymentMethod: v })}>
                          <SelectTrigger className="bg-white/10 border-white/20 text-white text-sm h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={paymentForm.label}
                          onChange={e => onPaymentFormChange({ ...paymentForm, label: e.target.value })}
                          placeholder="Libellé (ex: Acompte 1)"
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-sm h-9"
                        />
                        <Input
                          value={paymentForm.transactionRef}
                          onChange={e => onPaymentFormChange({ ...paymentForm, transactionRef: e.target.value })}
                          placeholder="Référence transaction"
                          className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-sm h-9"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={onSubmitPayment}
                          disabled={!paymentForm.amount || isSubmittingPayment}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isSubmittingPayment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                          Enregistrer
                        </Button>
                        <Button onClick={onAddPaymentToggle} variant="outline" size="sm" className="border-white/20 text-white bg-transparent hover:bg-white/10">
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={onAddPaymentToggle} variant="outline" size="sm" className="w-full border-dashed border-white/20 text-slate-400 hover:text-white bg-transparent hover:bg-white/5">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Enregistrer un paiement
                    </Button>
                  )}
                </div>
              )}

              {/* ── Documents remis ── */}
              {subTab === "docs" && (
                <div className="space-y-2">
                  {summary?.deliveredDocs?.length ? summary.deliveredDocs.map((doc: any) => (
                    <div key={doc.id} className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
                      <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white">{doc.docLabel}</div>
                        <div className="text-xs text-slate-400">{new Date(doc.deliveredAt).toLocaleDateString("fr-FR")}</div>
                      </div>
                      {doc.fileUrl && (
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-400 hover:underline">
                          <Download className="w-3.5 h-3.5" /> Voir
                        </a>
                      )}
                    </div>
                  )) : (
                    <div className="text-center py-6 text-slate-500 text-sm">Aucun document remis</div>
                  )}

                  {addingDoc === candidate.id ? (
                    <div className="bg-white/5 rounded-xl p-4 space-y-3 border border-purple-500/30">
                      <Input
                        value={docForm.docLabel}
                        onChange={e => onDocFormChange({ ...docForm, docLabel: e.target.value })}
                        placeholder="Nom du document (ex: Lettre d'invitation)"
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-sm h-9"
                      />
                      <Input
                        value={docForm.fileUrl}
                        onChange={e => onDocFormChange({ ...docForm, fileUrl: e.target.value })}
                        placeholder="URL du fichier (optionnel)"
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-sm h-9"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={onSubmitDoc}
                          disabled={!docForm.docLabel || isSubmittingDoc}
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          {isSubmittingDoc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
                          Remettre
                        </Button>
                        <Button onClick={onAddDocToggle} variant="outline" size="sm" className="border-white/20 text-white bg-transparent hover:bg-white/10">
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={onAddDocToggle} variant="outline" size="sm" className="w-full border-dashed border-white/20 text-slate-400 hover:text-white bg-transparent hover:bg-white/5">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Remettre un document
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
