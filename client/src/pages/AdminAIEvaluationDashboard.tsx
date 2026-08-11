import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AIScoreGauge } from "@/components/AIScoreGauge";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  History,
  Loader,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import jsPDF from "jspdf";

const TYPE_LABELS: Record<string, string> = {
  evaluation: "Pré-évaluation",
  luxembourg: "Luxembourg",
  etudes: "Visa Études",
  consultation: "Consultation + CV",
};

const PRIORITY_STYLES: Record<string, { badge: string; border: string }> = {
  haute: { badge: "bg-red-100 text-red-800", border: "border-l-4 border-red-500" },
  moyenne: { badge: "bg-amber-100 text-amber-800", border: "border-l-4 border-amber-400" },
  basse: { badge: "bg-gray-100 text-gray-600", border: "border-l-4 border-gray-200" },
};

type DashboardItem = {
  id: string;
  type: "evaluation" | "luxembourg" | "etudes" | "consultation";
  typeLabel?: string;
  fullName: string;
  email: string;
  createdAt: Date | string;
  score: number | null;
  hasConverted: boolean;
  priority: "haute" | "moyenne" | "basse";
  suggestedAction: string;
  destinationCategory?: string | null;
  destinationCountry?: string | null;
  nationality?: string | null;
  educationLevel?: string | null;
  employmentStatus?: string | null;
  maritalStatus?: string | null;
  status?: string | null;
  priorVisaRefusal?: boolean | null;
  criminalRecord?: boolean | null;
  familyAbroad?: boolean | null;
};

type ActivityLog = {
  id: number;
  adminEmail: string;
  action: "status_changed" | "csv_exported" | "pdf_exported";
  evaluationType?: string | null;
  evaluationId?: string | null;
  oldStatus?: string | null;
  newStatus?: string | null;
  resultCount?: number | null;
  details?: string | null;
  createdAt: Date | string;
};

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function displayValue(value: unknown) {
  return value === null || value === undefined || value === "" ? "Non renseigné" : String(value);
}

function buildCsv(items: DashboardItem[]) {
  const headers = [
    "Nom complet", "Email", "Type", "Pays", "Catégorie", "Nationalité", "Études", "Emploi",
    "Situation matrimoniale", "Statut", "Score IA", "Priorité", "Refus visa", "Antécédents judiciaires",
    "Famille à l’étranger", "Date de soumission",
  ];
  const rows = items.map((item) => [
    item.fullName,
    item.email,
    item.typeLabel ?? TYPE_LABELS[item.type] ?? item.type,
    item.destinationCountry,
    item.destinationCategory,
    item.nationality,
    item.educationLevel,
    item.employmentStatus,
    item.maritalStatus,
    item.status,
    item.score ?? "En attente",
    item.priority,
    item.priorVisaRefusal ? "Oui" : "Non",
    item.criminalRecord ? "Oui" : "Non",
    item.familyAbroad ? "Oui" : "Non",
    new Date(item.createdAt).toLocaleString("fr-FR"),
  ]);
  return "\uFEFF" + [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

function buildPdf(items: DashboardItem[]) {
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const margin = 12;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let y = 16;

  pdf.setFontSize(16);
  pdf.setTextColor(20, 58, 138);
  pdf.text("3M Travel & Services — Évaluations complètes", margin, y);
  y += 7;
  pdf.setFontSize(8);
  pdf.setTextColor(90, 100, 115);
  pdf.text(`Export généré le ${new Date().toLocaleString("fr-FR")} — ${items.length} résultat(s) filtré(s)`, margin, y);
  y += 10;

  const columns = ["Candidat", "Destination", "Profil", "Score IA", "Priorité", "Statut", "Soumis le"];
  const widths = [48, 40, 45, 22, 25, 28, 40];
  const tableWidth = widths.reduce((sum, width) => sum + width, 0);
  const rowHeight = 8;
  const drawHeader = () => {
    let x = margin;
    pdf.setFillColor(30, 58, 138);
    pdf.rect(margin, y - 5, tableWidth, rowHeight, "F");
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    columns.forEach((column, index) => {
      pdf.text(column, x + 2, y);
      x += widths[index];
    });
    y += rowHeight;
  };

  drawHeader();
  pdf.setFontSize(7.5);
  items.forEach((item, index) => {
    if (y > pageHeight - 15) {
      pdf.addPage();
      y = 16;
      drawHeader();
    }
    if (index % 2 === 0) {
      pdf.setFillColor(245, 248, 252);
      pdf.rect(margin, y - 5, tableWidth, rowHeight, "F");
    }
    const cells = [
      `${item.fullName}\n${item.email}`,
      `${displayValue(item.destinationCountry)}\n${displayValue(item.destinationCategory)}`,
      `${displayValue(item.educationLevel)} / ${displayValue(item.employmentStatus)}`,
      item.score === null ? "En attente" : `${item.score}/100`,
      item.priority,
      displayValue(item.status),
      new Date(item.createdAt).toLocaleDateString("fr-FR"),
    ];
    let x = margin;
    pdf.setTextColor(35, 45, 60);
    cells.forEach((cell, cellIndex) => {
      pdf.text(String(cell).split("\n"), x + 2, y);
      x += widths[cellIndex];
    });
    y += rowHeight;
  });

  // Évite une erreur de lint sur les environnements où la largeur est optimisée.
  void pageWidth;
  return pdf;
}

function statusOptionsFor(item: DashboardItem) {
  if (item.type === "evaluation") return ["pending", "reviewed", "contacted", "closed"];
  if (item.type === "consultation") return ["pending_ai", "pending_review", "validated_sent", "rejected"];
  return [];
}

function actionLabel(action: ActivityLog["action"]) {
  if (action === "csv_exported") return "Export CSV";
  if (action === "pdf_exported") return "Export PDF";
  return "Statut modifié";
}

export default function AdminAIEvaluationDashboard() {
  const sessionToken = typeof window !== "undefined" ? localStorage.getItem("adminSessionToken") || "" : "";
  const { data, isLoading, refetch, isFetching } = trpc.aiEvaluationManagement.getUnifiedDashboard.useQuery(
    { sessionToken, limit: 500 },
    { enabled: !!sessionToken, refetchInterval: false },
  );
  const historyQuery = trpc.aiEvaluationManagement.getActivityHistory.useQuery(
    { sessionToken, limit: 30 },
    { enabled: !!sessionToken, refetchInterval: false },
  );
  const updateStatus = trpc.aiEvaluationManagement.updateEvaluationStatus.useMutation({
    onSuccess: async () => {
      await refetch();
      await historyQuery.refetch();
    },
  });
  const recordExport = trpc.aiEvaluationManagement.recordExport.useMutation({
    onSuccess: async () => {
      await historyQuery.refetch();
    },
  });

  const items = (data?.items ?? []) as DashboardItem[];
  const summary = data?.summary;
  const history = (historyQuery.data ?? []) as ActivityLog[];
  const [search, setSearch] = useState("");
  const [scoreSort, setScoreSort] = useState<"default" | "desc" | "asc">("default");
  const [scoreFilter, setScoreFilter] = useState<"all" | "scored" | "pending">("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [destinationFilter, setDestinationFilter] = useState("all");
  const [educationFilter, setEducationFilter] = useState("all");
  const [employmentFilter, setEmploymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const pageSize = 15;

  const options = useMemo(() => ({
    types: Array.from(new Set(items.map((item) => item.type))).sort(),
    destinations: Array.from(new Set(items.map((item) => item.destinationCountry).filter(Boolean) as string[])).sort(),
    education: Array.from(new Set(items.map((item) => item.educationLevel).filter(Boolean) as string[])).sort(),
    employment: Array.from(new Set(items.map((item) => item.employmentStatus).filter(Boolean) as string[])).sort(),
    statuses: Array.from(new Set(items.map((item) => item.status).filter(Boolean) as string[])).sort(),
  }), [items]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = items.filter((item) => {
      const matchesQuery = !query || [item.fullName, item.email, item.destinationCountry, item.nationality, item.educationLevel, item.employmentStatus, item.typeLabel, item.suggestedAction]
        .filter(Boolean).join(" ").toLowerCase().includes(query);
      const matchesScore = scoreFilter === "all" || (scoreFilter === "scored" ? typeof item.score === "number" : typeof item.score !== "number");
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      const matchesDestination = destinationFilter === "all" || item.destinationCountry === destinationFilter;
      const matchesEducation = educationFilter === "all" || item.educationLevel === educationFilter;
      const matchesEmployment = employmentFilter === "all" || item.employmentStatus === employmentFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesQuery && matchesScore && matchesType && matchesDestination && matchesEducation && matchesEmployment && matchesStatus;
    });
    if (scoreSort === "default") return filtered;
    return [...filtered].sort((a, b) => {
      const aScore = typeof a.score === "number" ? a.score : -1;
      const bScore = typeof b.score === "number" ? b.score : -1;
      return scoreSort === "desc" ? bScore - aScore : aScore - bScore;
    });
  }, [items, search, scoreFilter, scoreSort, typeFilter, destinationFilter, educationFilter, employmentFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const pagedItems = useMemo(() => visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize), [visibleItems, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, scoreFilter, scoreSort, typeFilter, destinationFilter, educationFilter, employmentFilter, statusFilter]);

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount);
  }, [currentPage, pageCount]);

  const downloadCsv = () => {
    const csv = buildCsv(visibleItems);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `evaluations-completes-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    recordExport.mutate({ sessionToken, action: "csv_exported", resultCount: visibleItems.length, details: "Export CSV des évaluations filtrées" });
  };

  const openPdfPreview = () => {
    const pdf = buildPdf(visibleItems);
    const blobUrl = URL.createObjectURL(pdf.output("blob"));
    setPreviewUrl(blobUrl);
  };

  const downloadPdf = () => {
    const pdf = buildPdf(visibleItems);
    pdf.save(`evaluations-completes-${new Date().toISOString().slice(0, 10)}.pdf`);
    recordExport.mutate({ sessionToken, action: "pdf_exported", resultCount: visibleItems.length, details: "Export PDF des évaluations filtrées" });
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const changeStatus = (item: DashboardItem, newStatus: string) => {
    if (!newStatus || newStatus === item.status || updateStatus.isPending) return;
    const numericId = Number(item.id.split("-").at(-1));
    if (!Number.isInteger(numericId)) return;
    updateStatus.mutate({ sessionToken, evaluationType: item.type === "consultation" ? "consultation" : "evaluation", evaluationId: numericId, newStatus });
  };

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <div className="print:hidden"><Navbar /></div>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2"><Sparkles className="h-6 w-6 text-blue-600" /><h1 className="text-2xl font-bold text-gray-900">Gestion IA des évaluations</h1></div>
            <p className="mt-2 text-sm text-gray-500">Recherchez, filtrez, triez, exportez et mettez à jour rapidement les évaluations complètes.</p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" onClick={() => void refetch()} disabled={isFetching} className="gap-2"><RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Actualiser</Button>
            <Button variant="outline" onClick={downloadCsv} disabled={!visibleItems.length || recordExport.isPending} className="gap-2"><Download className="h-4 w-4" /> CSV</Button>
            <Button onClick={openPdfPreview} disabled={!visibleItems.length} className="gap-2 bg-blue-700 hover:bg-blue-800"><FileText className="h-4 w-4" /> Prévisualiser PDF</Button>
          </div>
        </div>

        {!sessionToken && <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 print:hidden">Session admin introuvable — reconnectez-vous sur /admin/login.</div>}

        <Card className="mb-6 p-4 print:hidden">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900"><SlidersHorizontal className="h-4 w-4 text-blue-600" /> Filtres des évaluations</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-medium text-slate-600 sm:col-span-2 lg:col-span-2">Rechercher<div className="relative mt-1"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, email, pays, études…" className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></div></label>
            <label className="text-xs font-medium text-slate-600">Type<select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="all">Tous les types</option>{options.types.map((value) => <option key={value} value={value}>{TYPE_LABELS[value] ?? value}</option>)}</select></label>
            <label className="text-xs font-medium text-slate-600">Pays<select value={destinationFilter} onChange={(event) => setDestinationFilter(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="all">Tous les pays</option>{options.destinations.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label className="text-xs font-medium text-slate-600">Études<select value={educationFilter} onChange={(event) => setEducationFilter(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="all">Tous les niveaux</option>{options.education.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label className="text-xs font-medium text-slate-600">Emploi<select value={employmentFilter} onChange={(event) => setEmploymentFilter(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="all">Toutes les situations</option>{options.employment.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label className="text-xs font-medium text-slate-600">Statut<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="all">Tous les statuts</option>{options.statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label className="text-xs font-medium text-slate-600">Score IA<select value={scoreFilter} onChange={(event) => setScoreFilter(event.target.value as typeof scoreFilter)} className="mt-1 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="all">Tous les scores</option><option value="scored">Score disponible</option><option value="pending">Score en attente</option></select></label>
            <label className="text-xs font-medium text-slate-600">Tri<select value={scoreSort} onChange={(event) => setScoreSort(event.target.value as typeof scoreSort)} className="mt-1 block h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="default">Priorité de suivi</option><option value="desc">Score décroissant</option><option value="asc">Score croissant</option></select></label>
          </div>
          <p className="mt-3 text-xs text-slate-500">{visibleItems.length} résultat(s) filtré(s) — page {currentPage} sur {pageCount}. Les exports utilisent toute la sélection filtrée.</p>
        </Card>

        {summary && <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5 print:grid-cols-5"><Card className="p-4"><p className="text-xs text-gray-500">Total</p><p className="text-2xl font-bold text-gray-900">{summary.total}</p></Card><Card className="border-l-4 border-red-500 p-4"><p className="flex items-center gap-1 text-xs text-gray-500"><AlertTriangle className="h-3 w-3" /> Priorité haute</p><p className="text-2xl font-bold text-red-600">{summary.haute}</p></Card><Card className="border-l-4 border-amber-400 p-4"><p className="text-xs text-gray-500">Priorité moyenne</p><p className="text-2xl font-bold text-amber-600">{summary.moyenne}</p></Card><Card className="p-4"><p className="text-xs text-gray-500">Priorité basse</p><p className="text-2xl font-bold text-gray-500">{summary.basse}</p></Card><Card className="border-l-4 border-green-500 p-4"><p className="flex items-center gap-1 text-xs text-gray-500"><CheckCircle2 className="h-3 w-3" /> Convertis</p><p className="text-2xl font-bold text-green-600">{summary.converted}</p></Card></div>}

        {isLoading ? <div className="flex justify-center py-16"><Loader className="h-6 w-6 animate-spin text-blue-600" /></div> : pagedItems.length === 0 ? <p className="py-16 text-center text-gray-500">Aucune évaluation correspondant à ces critères.</p> : <div className="space-y-3">{pagedItems.map((item) => {
          const priorityStyle = PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES.basse;
          const statusOptions = statusOptionsFor(item);
          return <Card key={item.id} className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${priorityStyle.border}`}>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2"><p className="font-semibold text-gray-900">{item.fullName}</p><Badge className={priorityStyle.badge}>{item.priority === "haute" ? "Priorité haute" : item.priority === "moyenne" ? "Priorité moyenne" : "Priorité basse"}</Badge><span className="text-xs text-gray-400">{item.typeLabel ?? TYPE_LABELS[item.type] ?? item.type}</span>{item.hasConverted && <Badge className="bg-green-100 text-green-800">✓ Converti</Badge>}</div>
              <p className="text-xs text-gray-500">{item.email} — {new Date(item.createdAt).toLocaleDateString("fr-FR")}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600"><span className="rounded bg-slate-100 px-2 py-1">Pays : {displayValue(item.destinationCountry)}</span><span className="rounded bg-slate-100 px-2 py-1">Études : {displayValue(item.educationLevel)}</span><span className="rounded bg-slate-100 px-2 py-1">Emploi : {displayValue(item.employmentStatus)}</span><span className="rounded bg-slate-100 px-2 py-1">Statut : {displayValue(item.status)}</span></div>
              <p className="mt-2 flex items-center gap-1 text-sm text-gray-700"><TrendingUp className="h-3 w-3 flex-shrink-0 text-blue-500" /> {item.suggestedAction}</p>
              {statusOptions.length > 0 ? <label className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-slate-600">Action rapide<select aria-label={`Modifier le statut de ${item.fullName}`} value={item.status ?? ""} onChange={(event) => changeStatus(item, event.target.value)} disabled={updateStatus.isPending} className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800"><option value="" disabled>Choisir</option>{statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}</select></label> : <span className="mt-3 inline-block text-xs text-slate-500">Statut géré par le moteur de scoring</span>}
            </div>
            <div className="w-full flex-shrink-0 sm:w-48"><AIScoreGauge score={typeof item.score === "number" ? item.score : null} compact label="Score IA" /></div>
          </Card>;
        })}</div>}

        {pageCount > 1 && <nav aria-label="Pagination des évaluations" className="mt-6 flex items-center justify-center gap-3 print:hidden"><Button variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}><ChevronLeft className="mr-1 h-4 w-4" /> Précédent</Button><span className="text-sm text-slate-600">Page {currentPage} / {pageCount}</span><Button variant="outline" size="sm" onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} disabled={currentPage === pageCount}>Suivant <ChevronRight className="ml-1 h-4 w-4" /></Button></nav>}

        <Card className="mt-8 p-4 print:hidden"><div className="mb-3 flex items-center gap-2"><History className="h-4 w-4 text-blue-600" /><h2 className="font-semibold text-slate-900">Historique récent</h2></div>{history.length === 0 ? <p className="text-sm text-slate-500">Aucune action enregistrée pour le moment.</p> : <div className="space-y-2">{history.slice(0, 10).map((entry) => <div key={entry.id} className="flex flex-col gap-1 rounded-lg bg-slate-50 px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between"><span className="font-medium text-slate-700">{actionLabel(entry.action)}</span><span className="text-slate-500">{entry.adminEmail} · {new Date(entry.createdAt).toLocaleString("fr-FR")}{entry.resultCount !== null && entry.resultCount !== undefined ? ` · ${entry.resultCount} résultat(s)` : ""}{entry.newStatus ? ` · ${entry.oldStatus ?? ""} → ${entry.newStatus}` : ""}</span></div>)}</div>}</Card>
      </div>

      {previewUrl && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-label="Prévisualisation de l’export PDF"><div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b px-4 py-3"><div><h2 className="font-semibold text-slate-900">Prévisualisation PDF</h2><p className="text-xs text-slate-500">Vérifiez le document avant le téléchargement.</p></div><div className="flex items-center gap-2"><Button size="sm" onClick={downloadPdf} className="gap-2 bg-blue-700 hover:bg-blue-800"><Download className="h-4 w-4" /> Télécharger</Button><Button size="icon" variant="outline" onClick={closePreview} aria-label="Fermer la prévisualisation"><X className="h-4 w-4" /></Button></div></div><iframe title="Prévisualisation de l’export PDF" src={previewUrl} className="min-h-0 flex-1 bg-slate-100" /></div></div>}
    </div>
  );
}
