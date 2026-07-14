import { useState, useRef } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Search, Filter, Download, Printer, Eye, CheckCircle, XCircle,
  Clock, FileText, Users, TrendingUp, DollarSign, RefreshCw,
  ChevronDown, ChevronUp, MessageCircle, Shield, Loader2
} from "lucide-react";

type DossierStatus = "nouveau" | "paye" | "en_cours" | "documents_requis" | "soumis" | "approuve" | "refuse";
type PaymentStatus = "ALL" | "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";

const STATUS_CONFIG: Record<DossierStatus, { label: string; color: string; bg: string }> = {
  nouveau: { label: "Nouveau", color: "text-slate-300", bg: "bg-slate-700" },
  paye: { label: "Payé", color: "text-blue-300", bg: "bg-blue-900/50" },
  en_cours: { label: "En cours", color: "text-yellow-300", bg: "bg-yellow-900/50" },
  documents_requis: { label: "Docs requis", color: "text-orange-300", bg: "bg-orange-900/50" },
  soumis: { label: "Soumis", color: "text-purple-300", bg: "bg-purple-900/50" },
  approuve: { label: "Approuvé ✓", color: "text-green-300", bg: "bg-green-900/50" },
  refuse: { label: "Refusé", color: "text-red-300", bg: "bg-red-900/50" },
};

const PAYMENT_BADGE: Record<string, { label: string; color: string }> = {
  PENDING: { label: "En attente", color: "bg-yellow-900/50 text-yellow-300 border-yellow-700" },
  SUCCESS: { label: "Payé ✓", color: "bg-green-900/50 text-green-300 border-green-700" },
  FAILED: { label: "Échoué", color: "bg-red-900/50 text-red-300 border-red-700" },
  CANCELLED: { label: "Annulé", color: "bg-slate-700 text-slate-300 border-slate-600" },
};

function printDossierPDF(app: Record<string, unknown>) {
  const printWindow = window.open("", "_blank", "width=800,height=900");
  if (!printWindow) return;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Fiche Candidat — ${app.dossierNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: white; }
    .header { background: linear-gradient(135deg, #1e3a8a, #1d4ed8); color: white; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { font-size: 22px; font-weight: 900; }
    .header .sub { font-size: 12px; opacity: 0.8; margin-top: 2px; }
    .dossier-num { background: rgba(255,255,255,0.15); border-radius: 8px; padding: 8px 16px; text-align: right; }
    .dossier-num .label { font-size: 10px; opacity: 0.8; }
    .dossier-num .num { font-size: 18px; font-weight: 900; letter-spacing: 1px; }
    .content { padding: 24px 32px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #1d4ed8; border-bottom: 2px solid #1d4ed8; padding-bottom: 4px; margin-bottom: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .field { background: #f8fafc; border-radius: 6px; padding: 8px 12px; }
    .field .label { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .field .value { font-size: 13px; color: #1e293b; font-weight: 600; margin-top: 2px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
    .status-paye { background: #dcfce7; color: #166534; }
    .status-pending { background: #fef9c3; color: #854d0e; }
    .status-failed { background: #fee2e2; color: #991b1b; }
    .footer { margin-top: 32px; padding: 16px 32px; background: #f1f5f9; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; }
    .watermark { text-align: center; margin-top: 16px; font-size: 10px; color: #94a3b8; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>3M TRAVEL AGENCY</h1>
      <div class="sub">RC/YAO/2019/A/2567 | NIU : M112417203369H</div>
      <div class="sub">Yaoundé, Cameroun | +237 620-996-045</div>
    </div>
    <div class="dossier-num">
      <div class="label">NUMÉRO DE DOSSIER</div>
      <div class="num">${app.dossierNumber}</div>
    </div>
  </div>

  <div class="content">
    <div class="section">
      <div class="section-title">Informations du Candidat</div>
      <div class="grid">
        <div class="field"><div class="label">Nom complet</div><div class="value">${app.fullName}</div></div>
        <div class="field"><div class="label">Email</div><div class="value">${app.email}</div></div>
        <div class="field"><div class="label">WhatsApp</div><div class="value">${app.whatsappNumber ?? "—"}</div></div>
        <div class="field"><div class="label">Nationalité</div><div class="value">${app.nationality ?? "—"}</div></div>
        <div class="field"><div class="label">Âge</div><div class="value">${app.age ? app.age + " ans" : "—"}</div></div>
        <div class="field"><div class="label">Destination</div><div class="value">${String(app.destination ?? "").toUpperCase()}</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Profil Professionnel</div>
      <div class="grid">
        <div class="field"><div class="label">Niveau académique</div><div class="value">${app.academicLevel ?? "—"}</div></div>
        <div class="field"><div class="label">Expérience</div><div class="value">${app.experienceYears != null ? app.experienceYears + " ans" : "—"}</div></div>
        <div class="field"><div class="label">Langues</div><div class="value">${app.languageSkills ?? "—"}</div></div>
        <div class="field"><div class="label">Secteur</div><div class="value">${app.jobSector ?? "—"}</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Paiement & Statut</div>
      <div class="grid">
        <div class="field"><div class="label">Formule choisie</div><div class="value">${app.formulaChosen ?? "—"}</div></div>
        <div class="field"><div class="label">Montant</div><div class="value">${app.paymentAmount ? Number(app.paymentAmount).toLocaleString("fr-FR") + " FCFA" : "—"}</div></div>
        <div class="field">
          <div class="label">Statut paiement</div>
          <div class="value">
            <span class="status-badge ${app.paymentStatus === "SUCCESS" ? "status-paye" : app.paymentStatus === "FAILED" ? "status-failed" : "status-pending"}">
              ${app.paymentStatus === "SUCCESS" ? "PAYÉ" : app.paymentStatus === "FAILED" ? "ÉCHOUÉ" : "EN ATTENTE"}
            </span>
          </div>
        </div>
        <div class="field"><div class="label">Statut dossier</div><div class="value">${String(app.dossierStatus ?? "").toUpperCase()}</div></div>
        <div class="field"><div class="label">Date de création</div><div class="value">${app.createdAt ? new Date(app.createdAt as string).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—"}</div></div>
        <div class="field"><div class="label">ID Transaction</div><div class="value" style="font-size:10px">${app.paymentTransactionId ?? "—"}</div></div>
      </div>
    </div>

    ${app.adminNote ? `
    <div class="section">
      <div class="section-title">Notes Administrateur</div>
      <div class="field" style="grid-column:span 2"><div class="value">${app.adminNote}</div></div>
    </div>
    ` : ""}
  </div>

  <div class="footer">
    <span>Document généré le ${new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
    <span>3M Travel Agency — Usage interne confidentiel</span>
  </div>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}

export default function Admin() {
  const { user, isAuthenticated, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus>("ALL");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<number, string>>({});

  const utils = trpc.useUtils();

  const { data: applications, isLoading, refetch } = trpc.application.listApplications.useQuery(
    { paymentStatus: paymentFilter, search: search || undefined, limit: 100, offset: 0 },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const updateStatus = trpc.application.updateApplicationStatus.useMutation({
    onSuccess: () => {
      utils.application.listApplications.invalidate();
      setUpdatingId(null);
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-6">
        <Shield className="w-16 h-16 text-red-400" />
        <h1 className="text-3xl font-black">Accès refusé</h1>
        <p className="text-slate-400">Cette page est réservée aux administrateurs de 3M Travel Agency.</p>
        <Link href="/">
          <Button className="bg-blue-600 hover:bg-blue-700">Retour à l'accueil</Button>
        </Link>
      </div>
    );
  }

  const stats = {
    total: applications?.length ?? 0,
    paid: applications?.filter(a => a.paymentStatus === "SUCCESS").length ?? 0,
    pending: applications?.filter(a => a.paymentStatus === "PENDING").length ?? 0,
    revenue: (applications?.filter(a => a.paymentStatus === "SUCCESS").length ?? 0) * 65000,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <div className="pt-24 pb-16 px-4 max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black">Panneau Administrateur</h1>
            <p className="text-slate-400 mt-1">Gestion des dossiers d'immigration — 3M Travel Agency</p>
          </div>
          <Button onClick={() => refetch()} variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent w-fit">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total dossiers", value: stats.total, icon: FileText, color: "text-blue-400" },
            { label: "Dossiers payés", value: stats.paid, icon: CheckCircle, color: "text-green-400" },
            { label: "En attente paiement", value: stats.pending, icon: Clock, color: "text-yellow-400" },
            { label: "Revenus générés", value: `${stats.revenue.toLocaleString("fr-FR")} FCFA`, icon: DollarSign, color: "text-emerald-400" },
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
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom, email, numéro de dossier..."
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-500"
            />
          </div>
          <Select value={paymentFilter} onValueChange={v => setPaymentFilter(v as PaymentStatus)}>
            <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              <SelectItem value="PENDING">En attente</SelectItem>
              <SelectItem value="SUCCESS">Payés</SelectItem>
              <SelectItem value="FAILED">Échoués</SelectItem>
              <SelectItem value="CANCELLED">Annulés</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Liste des dossiers */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : !applications || applications.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Aucun dossier trouvé</p>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map(app => {
              const isExpanded = expandedId === app.id;
              const payBadge = PAYMENT_BADGE[app.paymentStatus] ?? PAYMENT_BADGE.PENDING;
              const statusConf = STATUS_CONFIG[app.dossierStatus as DossierStatus] ?? STATUS_CONFIG.nouveau;

              return (
                <div key={app.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  {/* Ligne principale */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-blue-300 font-bold text-sm">{app.dossierNumber}</span>
                        <Badge className={`text-xs border ${payBadge.color}`}>{payBadge.label}</Badge>
                        <Badge className={`text-xs ${statusConf.bg} ${statusConf.color} border-0`}>{statusConf.label}</Badge>
                      </div>
                      <div className="text-white font-semibold mt-0.5">{app.fullName}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{app.email} · {app.destination?.toUpperCase()} · {app.createdAt ? new Date(app.createdAt).toLocaleDateString("fr-FR") : ""}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={`https://wa.me/${(app.whatsappNumber ?? "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Bonjour ${app.fullName}, concernant votre dossier ${app.dossierNumber}...`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" className="bg-green-700 hover:bg-green-600 text-white h-8 px-3">
                          <MessageCircle className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                      <Button
                        size="sm"
                        onClick={() => printDossierPDF(app as unknown as Record<string, unknown>)}
                        className="bg-slate-700 hover:bg-slate-600 text-white h-8 px-3"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setExpandedId(isExpanded ? null : app.id)}
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 bg-transparent h-8 px-3"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>

                  {/* Détail expandable */}
                  {isExpanded && (
                    <div className="border-t border-white/10 p-4 space-y-4 bg-white/3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {[
                          { label: "Téléphone", value: app.whatsappNumber },
                          { label: "Nationalité", value: app.nationality },
                          { label: "Âge", value: app.age ? `${app.age} ans` : null },
                          { label: "Formule", value: app.formulaChosen },
                          { label: "Niveau académique", value: app.academicLevel },
                          { label: "Expérience", value: app.experienceYears != null ? `${app.experienceYears} ans` : null },
                          { label: "Langues", value: app.languageSkills },
                          { label: "Secteur", value: app.jobSector },
                        ].map(field => (
                          <div key={field.label} className="bg-white/5 rounded-lg p-2.5">
                            <div className="text-slate-400 text-xs">{field.label}</div>
                            <div className="text-white font-medium text-xs mt-0.5">{field.value ?? "—"}</div>
                          </div>
                        ))}
                      </div>

                      {/* Changer le statut */}
                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                        <div className="flex-1">
                          <label className="text-slate-400 text-xs mb-1 block">Note interne</label>
                          <Input
                            value={noteInputs[app.id] ?? app.adminNote ?? ""}
                            onChange={e => setNoteInputs(prev => ({ ...prev, [app.id]: e.target.value }))}
                            placeholder="Ajouter une note..."
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-xs mb-1 block">Changer le statut</label>
                          <Select
                            value={app.dossierStatus}
                            onValueChange={(v) => {
                              setUpdatingId(app.id);
                              updateStatus.mutate({
                                id: app.id,
                                dossierStatus: v as DossierStatus,
                                adminNote: noteInputs[app.id] ?? undefined,
                              });
                            }}
                          >
                            <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white text-sm h-9">
                              {updatingId === app.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SelectValue />}
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(STATUS_CONFIG).map(([key, conf]) => (
                                <SelectItem key={key} value={key}>{conf.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
