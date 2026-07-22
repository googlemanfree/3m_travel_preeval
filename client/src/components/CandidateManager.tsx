/**
 * CandidateManager — Panneau admin de gestion des candidats inscrits
 * Permet à l'admin de gérer le statut, les étapes de traitement,
 * les honoraires, les notes et la messagerie de chaque candidat.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search, ChevronDown, ChevronUp, Loader2, MessageCircle, FileText,
  CheckCircle, Clock, AlertCircle, XCircle, Star, RefreshCw,
  Send, Users, DollarSign, Eye, EyeOff
} from "lucide-react";

type DossierStatus = "nouveau" | "evaluation" | "documents" | "traitement" | "soumis" | "approuve" | "refuse";
type HonorairesStatus = "pending" | "proposed" | "accepted" | "refused";

const DOSSIER_STEPS = [
  { key: "nouveau",    label: "Nouveau dossier",       icon: Star,         color: "text-gray-400",   bg: "bg-gray-800" },
  { key: "evaluation", label: "Évaluation en cours",   icon: Clock,        color: "text-blue-400",   bg: "bg-blue-900/50" },
  { key: "documents",  label: "Documents requis",      icon: AlertCircle,  color: "text-amber-400",  bg: "bg-amber-900/50" },
  { key: "traitement", label: "Traitement du dossier", icon: FileText,     color: "text-indigo-400", bg: "bg-indigo-900/50" },
  { key: "soumis",     label: "Dossier soumis",        icon: CheckCircle,  color: "text-purple-400", bg: "bg-purple-900/50" },
  { key: "approuve",   label: "Visa approuvé ✓",       icon: CheckCircle,  color: "text-green-400",  bg: "bg-green-900/50" },
  { key: "refuse",     label: "Dossier refusé",        icon: XCircle,      color: "text-red-400",    bg: "bg-red-900/50" },
] as const;

const PROCESSING_STEPS_TEMPLATE = [
  { key: "reception",       label: "Réception du dossier" },
  { key: "analyse_profil",  label: "Analyse du profil" },
  { key: "proposition",     label: "Proposition d'honoraires" },
  { key: "accord_client",   label: "Accord client" },
  { key: "collecte_docs",   label: "Collecte des documents" },
  { key: "verification",    label: "Vérification des pièces" },
  { key: "constitution",    label: "Constitution du dossier" },
  { key: "depot",           label: "Dépôt auprès des autorités" },
  { key: "suivi",           label: "Suivi de la demande" },
  { key: "decision",        label: "Décision finale" },
];

type ProcessingStep = {
  key: string;
  label: string;
  status: "pending" | "in_progress" | "done" | "blocked";
  completedAt?: string;
  note?: string;
};

function parseSteps(raw: string | null | undefined): ProcessingStep[] {
  if (!raw) return PROCESSING_STEPS_TEMPLATE.map(s => ({ ...s, status: "pending" as const }));
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return PROCESSING_STEPS_TEMPLATE.map(s => ({ ...s, status: "pending" as const }));
}

const STEP_STATUS_CONFIG = {
  pending:     { label: "En attente",   color: "bg-slate-700 text-slate-300", dot: "bg-slate-400" },
  in_progress: { label: "En cours",     color: "bg-blue-900/60 text-blue-300", dot: "bg-blue-400 animate-pulse" },
  done:        { label: "Terminé",      color: "bg-green-900/60 text-green-300", dot: "bg-green-400" },
  blocked:     { label: "Bloqué",       color: "bg-red-900/60 text-red-300", dot: "bg-red-400" },
};

export default function CandidateManager() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DossierStatus | "ALL">("ALL");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"steps" | "messages" | "docs">("steps");
  const [noteInputs, setNoteInputs] = useState<Record<number, string>>({});
  const [privateNoteInputs, setPrivateNoteInputs] = useState<Record<number, string>>({});
  const [honorairesInputs, setHonorairesInputs] = useState<Record<number, string>>({});
  const [honorairesNoteInputs, setHonorairesNoteInputs] = useState<Record<number, string>>({});
  const [procedureInputs, setProcedureInputs] = useState<Record<number, string>>({});
  const [msgInputs, setMsgInputs] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [showPrivate, setShowPrivate] = useState<Record<number, boolean>>({});

  const utils = trpc.useUtils();

  const { data: candidates, isLoading, refetch } = trpc.candidate.adminListCandidates.useQuery({
    search: search || undefined,
    status: statusFilter,
    limit: 100,
    offset: 0,
  });

  const updateMutation = trpc.candidate.adminUpdateCandidate.useMutation({
    onSuccess: () => {
      utils.candidate.adminListCandidates.invalidate();
      setSavingId(null);
      toast.success("Candidat mis à jour avec succès.");
    },
    onError: (err) => {
      setSavingId(null);
      toast.error(err.message);
    },
  });

  const sendMsgMutation = trpc.candidate.adminSendMessage.useMutation({
    onSuccess: (_, vars) => {
      setMsgInputs(prev => ({ ...prev, [vars.candidateId]: "" }));
      utils.candidate.adminGetCandidateMessages.invalidate({ candidateId: vars.candidateId });
      toast.success("Message envoyé.");
    },
    onError: (err) => toast.error(err.message),
  });

  // Messages d'un candidat ouvert
  const { data: messages } = trpc.candidate.adminGetCandidateMessages.useQuery(
    { candidateId: expandedId! },
    { enabled: expandedId !== null && activeTab === "messages" }
  );

  // Documents d'un candidat ouvert
  const { data: candidateDocs } = trpc.candidate.adminGetCandidateFiles.useQuery(
    { candidateId: expandedId! },
    { enabled: expandedId !== null && activeTab === "docs" }
  );

  function handleSave(candidateId: number, candidate: any) {
    setSavingId(candidateId);
    const steps = parseSteps(candidate.processingSteps);
    updateMutation.mutate({
      id: candidateId,
      adminNote: noteInputs[candidateId] ?? candidate.adminNote ?? undefined,
      adminPrivateNote: privateNoteInputs[candidateId] ?? candidate.adminPrivateNote ?? undefined,
      processingSteps: JSON.stringify(steps),
      honoraires: honorairesInputs[candidateId] ? parseInt(honorairesInputs[candidateId]) : candidate.honoraires ?? undefined,
      honorairesNote: honorairesNoteInputs[candidateId] ?? candidate.honorairesNote ?? undefined,
      procedureChoisie: procedureInputs[candidateId] ?? candidate.procedureChoisie ?? undefined,
    });
  }

  function handleStatusChange(candidateId: number, newStatus: DossierStatus, candidate: any) {
    setSavingId(candidateId);
    updateMutation.mutate({
      id: candidateId,
      dossierStatus: newStatus,
      adminNote: noteInputs[candidateId] ?? candidate.adminNote ?? undefined,
    });
  }

  function handleStepStatusChange(candidateId: number, candidate: any, stepKey: string, newStatus: ProcessingStep["status"]) {
    const steps = parseSteps(candidate.processingSteps).map(s =>
      s.key === stepKey
        ? { ...s, status: newStatus, completedAt: newStatus === "done" ? new Date().toISOString() : s.completedAt }
        : s
    );
    updateMutation.mutate({
      id: candidateId,
      processingSteps: JSON.stringify(steps),
    });
  }

  function handleProposeHonoraires(candidateId: number, candidate: any) {
    const amount = parseInt(honorairesInputs[candidateId] ?? "0");
    if (!amount || amount < 1000) { toast.error("Montant invalide (min 1 000 FCFA)"); return; }
    setSavingId(candidateId);
    updateMutation.mutate({
      id: candidateId,
      honoraires: amount,
      honorairesNote: honorairesNoteInputs[candidateId] ?? candidate.honorairesNote ?? undefined,
      honorairesStatus: "proposed",
    });
  }

  const stats = {
    total: candidates?.length ?? 0,
    evaluation: candidates?.filter(c => c.dossierStatus === "evaluation").length ?? 0,
    traitement: candidates?.filter(c => c.dossierStatus === "traitement").length ?? 0,
    approuve: candidates?.filter(c => c.dossierStatus === "approuve").length ?? 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Candidats inscrits", value: stats.total, icon: Users, color: "text-blue-400" },
          { label: "En évaluation", value: stats.evaluation, icon: Clock, color: "text-amber-400" },
          { label: "En traitement", value: stats.traitement, icon: FileText, color: "text-indigo-400" },
          { label: "Approuvés", value: stats.approuve, icon: CheckCircle, color: "text-green-400" },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-slate-400 text-xs">{stat.label}</span>
              </div>
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
            </div>
          );
        })}
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone..."
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
          />
        </div>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
          <SelectTrigger className="w-52 bg-white/10 border-white/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les statuts</SelectItem>
            {DOSSIER_STEPS.map(s => (
              <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => refetch()} variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
          <RefreshCw className="w-4 h-4 mr-2" /> Actualiser
        </Button>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      ) : !candidates || candidates.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Aucun candidat inscrit trouvé</p>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map(candidate => {
            const isExpanded = expandedId === candidate.id;
            const stepConf = DOSSIER_STEPS.find(s => s.key === candidate.dossierStatus) ?? DOSSIER_STEPS[0];
            const StepIcon = stepConf.icon;
            const steps = parseSteps(candidate.processingSteps);
            const doneCount = steps.filter(s => s.status === "done").length;

            return (
              <div key={candidate.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                {/* Ligne principale */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`text-xs border-0 ${stepConf.bg} ${stepConf.color} flex items-center gap-1`}>
                        <StepIcon className="w-3 h-3" />
                        {stepConf.label}
                      </Badge>
                      {candidate.honorairesStatus === "proposed" && (
                        <Badge className="text-xs bg-yellow-900/50 text-yellow-300 border border-yellow-700">
                          💰 Honoraires proposés
                        </Badge>
                      )}
                      {candidate.honorairesStatus === "accepted" && (
                        <Badge className="text-xs bg-green-900/50 text-green-300 border border-green-700">
                          ✓ Honoraires acceptés
                        </Badge>
                      )}
                      <span className="text-slate-500 text-xs">{doneCount}/{steps.length} étapes</span>
                    </div>
                    <div className="text-white font-semibold mt-0.5">{candidate.fullName}</div>
                    <div className="text-slate-400 text-xs mt-0.5">
                      {candidate.email} · {candidate.destination?.toUpperCase()} · {candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString("fr-FR") : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={`https://wa.me/${(candidate.phone ?? "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Bonjour ${candidate.fullName}, concernant votre dossier 3M Travel...`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" className="bg-green-700 hover:bg-green-600 text-white h-8 px-3">
                        <MessageCircle className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      onClick={() => {
                        setExpandedId(isExpanded ? null : candidate.id);
                        setActiveTab("steps");
                      }}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 bg-transparent h-8 px-3"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                {/* Panneau détail */}
                {isExpanded && (
                  <div className="border-t border-white/10 bg-white/3">
                    {/* Onglets */}
                    <div className="flex border-b border-white/10">
                      {[
                        { id: "steps", label: "Étapes de traitement" },
                        { id: "messages", label: "Messagerie" },
                        { id: "docs", label: "Documents" },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`px-4 py-2.5 text-xs font-semibold transition-colors ${
                            activeTab === tab.id
                              ? "text-blue-300 border-b-2 border-blue-400"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="p-4 space-y-4">
                      {/* ── ONGLET ÉTAPES ── */}
                      {activeTab === "steps" && (
                        <div className="space-y-4">
                          {/* Infos de base */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            {[
                              { label: "Téléphone", value: candidate.phone },
                              { label: "Nationalité", value: candidate.nationality },
                              { label: "Destination", value: candidate.destination?.toUpperCase() },
                              { label: "Type de visa", value: candidate.visaType },
                              { label: "Niveau d'études", value: candidate.educationLevel },
                              { label: "Score profil", value: candidate.scoreResult },
                            ].map(field => (
                              <div key={field.label} className="bg-white/5 rounded-lg p-2.5">
                                <div className="text-slate-400 text-xs">{field.label}</div>
                                <div className="text-white font-medium text-xs mt-0.5">{field.value ?? "—"}</div>
                              </div>
                            ))}
                          </div>

                          {/* Statut du dossier */}
                          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                            <div className="flex-1">
                              <label className="text-slate-400 text-xs mb-1 block">Statut du dossier</label>
                              <Select
                                value={candidate.dossierStatus}
                                onValueChange={(v) => handleStatusChange(candidate.id, v as DossierStatus, candidate)}
                              >
                                <SelectTrigger className="bg-white/10 border-white/20 text-white text-sm h-9">
                                  {savingId === candidate.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SelectValue />}
                                </SelectTrigger>
                                <SelectContent>
                                  {DOSSIER_STEPS.map(s => (
                                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex-1">
                              <label className="text-slate-400 text-xs mb-1 block">Procédure recommandée</label>
                              <Input
                                value={procedureInputs[candidate.id] ?? candidate.procedureChoisie ?? ""}
                                onChange={e => setProcedureInputs(prev => ({ ...prev, [candidate.id]: e.target.value }))}
                                placeholder="Ex: Express Entry Canada, VLS-TS France..."
                                className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-sm h-9"
                              />
                            </div>
                          </div>

                          {/* Étapes de traitement */}
                          <div>
                            <div className="text-slate-300 text-xs font-semibold uppercase tracking-wide mb-2">Étapes de traitement</div>
                            <div className="space-y-2">
                              {steps.map(step => {
                                const conf = STEP_STATUS_CONFIG[step.status];
                                return (
                                  <div key={step.key} className="flex items-center gap-3 bg-white/5 rounded-lg p-2.5">
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${conf.dot}`} />
                                    <span className="text-white text-xs flex-1">{step.label}</span>
                                    {step.completedAt && step.status === "done" && (
                                      <span className="text-slate-500 text-xs">{new Date(step.completedAt).toLocaleDateString("fr-FR")}</span>
                                    )}
                                    <Select
                                      value={step.status}
                                      onValueChange={(v) => handleStepStatusChange(candidate.id, candidate, step.key, v as ProcessingStep["status"])}
                                    >
                                      <SelectTrigger className={`w-32 h-7 text-xs border-0 ${conf.color}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">En attente</SelectItem>
                                        <SelectItem value="in_progress">En cours</SelectItem>
                                        <SelectItem value="done">Terminé</SelectItem>
                                        <SelectItem value="blocked">Bloqué</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Honoraires */}
                          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4 space-y-3">
                            <div className="text-yellow-300 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                              <DollarSign className="w-4 h-4" /> Proposition d'honoraires
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <div className="flex-1">
                                <label className="text-slate-400 text-xs mb-1 block">Montant (FCFA)</label>
                                <Input
                                  type="number"
                                  value={honorairesInputs[candidate.id] ?? (candidate.honoraires?.toString() ?? "")}
                                  onChange={e => setHonorairesInputs(prev => ({ ...prev, [candidate.id]: e.target.value }))}
                                  placeholder="Ex: 150000"
                                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-sm h-9"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-slate-400 text-xs mb-1 block">Statut honoraires</label>
                                <Select
                                  value={candidate.honorairesStatus ?? "pending"}
                                  onValueChange={(v) => updateMutation.mutate({ id: candidate.id, honorairesStatus: v as HonorairesStatus })}
                                >
                                  <SelectTrigger className="bg-white/10 border-white/20 text-white text-sm h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">En attente</SelectItem>
                                    <SelectItem value="proposed">Proposé au client</SelectItem>
                                    <SelectItem value="accepted">Accepté</SelectItem>
                                    <SelectItem value="refused">Refusé</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <label className="text-slate-400 text-xs mb-1 block">Détail de la proposition</label>
                              <Input
                                value={honorairesNoteInputs[candidate.id] ?? (candidate.honorairesNote ?? "")}
                                onChange={e => setHonorairesNoteInputs(prev => ({ ...prev, [candidate.id]: e.target.value }))}
                                placeholder="Ex: Inclut constitution dossier, suivi et dépôt..."
                                className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-sm h-9"
                              />
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleProposeHonoraires(candidate.id, candidate)}
                              disabled={savingId === candidate.id}
                              className="bg-yellow-600 hover:bg-yellow-500 text-white text-xs"
                            >
                              {savingId === candidate.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <DollarSign className="w-3.5 h-3.5 mr-1" />}
                              Envoyer la proposition au client
                            </Button>
                          </div>

                          {/* Notes */}
                          <div className="space-y-3">
                            <div>
                              <label className="text-slate-400 text-xs mb-1 block">Note visible par le client</label>
                              <Input
                                value={noteInputs[candidate.id] ?? (candidate.adminNote ?? "")}
                                onChange={e => setNoteInputs(prev => ({ ...prev, [candidate.id]: e.target.value }))}
                                placeholder="Message affiché dans le Mon Espace du candidat..."
                                className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-sm"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <label className="text-slate-400 text-xs">Note confidentielle (admin uniquement)</label>
                                <button
                                  onClick={() => setShowPrivate(prev => ({ ...prev, [candidate.id]: !prev[candidate.id] }))}
                                  className="text-slate-500 hover:text-slate-300"
                                >
                                  {showPrivate[candidate.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                              {showPrivate[candidate.id] && (
                                <Input
                                  value={privateNoteInputs[candidate.id] ?? (candidate.adminPrivateNote ?? "")}
                                  onChange={e => setPrivateNoteInputs(prev => ({ ...prev, [candidate.id]: e.target.value }))}
                                  placeholder="Note interne confidentielle..."
                                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-sm"
                                />
                              )}
                            </div>
                          </div>

                          <Button
                            onClick={() => handleSave(candidate.id, candidate)}
                            disabled={savingId === candidate.id}
                            className="bg-blue-600 hover:bg-blue-500 text-white w-full sm:w-auto"
                          >
                            {savingId === candidate.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Enregistrer les modifications
                          </Button>
                        </div>
                      )}

                      {/* ── ONGLET MESSAGERIE ── */}
                      {activeTab === "messages" && (
                        <div className="space-y-3">
                          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                            {!messages || messages.length === 0 ? (
                              <p className="text-slate-500 text-xs text-center py-8">Aucun message échangé</p>
                            ) : messages.map(msg => (
                              <div
                                key={msg.id}
                                className={`rounded-xl px-3 py-2 text-sm max-w-[85%] ${
                                  msg.senderRole === "advisor"
                                    ? "ml-auto bg-blue-700 text-white"
                                    : "bg-white/10 text-white"
                                }`}
                              >
                                <div className="text-xs opacity-60 mb-1">
                                  {msg.senderRole === "advisor" ? "Vous (conseiller)" : candidate.fullName}
                                  {" · "}{new Date(msg.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </div>
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={msgInputs[candidate.id] ?? ""}
                              onChange={e => setMsgInputs(prev => ({ ...prev, [candidate.id]: e.target.value }))}
                              onKeyDown={e => {
                                if (e.key === "Enter" && !e.shiftKey && msgInputs[candidate.id]?.trim()) {
                                  sendMsgMutation.mutate({ candidateId: candidate.id, content: msgInputs[candidate.id] });
                                }
                              }}
                              placeholder="Écrire un message au candidat..."
                              className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-sm flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={() => {
                                if (msgInputs[candidate.id]?.trim()) {
                                  sendMsgMutation.mutate({ candidateId: candidate.id, content: msgInputs[candidate.id] });
                                }
                              }}
                              disabled={!msgInputs[candidate.id]?.trim() || sendMsgMutation.isPending}
                              className="bg-blue-600 hover:bg-blue-500"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* ── ONGLET DOCUMENTS ── */}
                      {activeTab === "docs" && (
                        <div className="space-y-2">
                          {!candidateDocs || candidateDocs.length === 0 ? (
                            <p className="text-slate-500 text-xs text-center py-8">Aucun document uploadé</p>
                          ) : candidateDocs.map(doc => (
                            <div key={doc.id} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                              <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-white text-sm font-medium truncate">{doc.fileName}</div>
                                <div className="text-slate-400 text-xs">{doc.fileType} · {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("fr-FR") : ""}</div>
                              </div>
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-xs font-medium flex-shrink-0"
                              >
                                Voir
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
