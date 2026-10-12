import { CheckCircle2, Clock3, FileText, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ClientDocument = {
  id: number;
  fileName?: string | null;
  documentName?: string | null;
  fileType?: string | null;
  documentType?: string | null;
  status?: string | null;
  verificationStatus?: string | null;
  uploadedAt?: Date | string | null;
};

function getStatus(document: ClientDocument) {
  const status = String(document.verificationStatus || document.status || "pending").toLowerCase();
  if (["approved", "verified", "validé", "valide"].includes(status)) return { label: "Validé", className: "border-emerald-200 bg-emerald-50 text-emerald-800", Icon: CheckCircle2 };
  if (["rejected", "rejeté", "rejete"].includes(status)) return { label: "À corriger", className: "border-rose-200 bg-rose-50 text-rose-800", Icon: XCircle };
  return { label: "En vérification", className: "border-amber-200 bg-amber-50 text-amber-800", Icon: Clock3 };
}

export default function ClientUploadedDocumentsStatus({ documents }: { documents: ClientDocument[] }) {
  if (!documents.length) return null;
  return (
    <Card className="border-slate-200 bg-white shadow-sm" data-testid="client-uploaded-documents-status">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-slate-950"><FileText className="h-5 w-5 text-blue-700" />Statut de validation de vos dépôts</CardTitle>
        <p className="text-sm text-slate-600">Chaque pièce déposée est contrôlée par un conseiller avant d’être considérée comme validée.</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {documents.map((document) => {
          const state = getStatus(document);
          const Icon = state.Icon;
          return (
            <div key={document.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{document.documentName || document.fileName || "Document sans nom"}</p><p className="text-xs text-slate-500">{String(document.documentType || document.fileType || "Pièce").replaceAll("_", " ")}{document.uploadedAt ? ` · Déposé le ${new Date(document.uploadedAt).toLocaleDateString("fr-FR")}` : ""}</p></div>
              <span className={`inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${state.className}`} role="status"><Icon className="h-3.5 w-3.5" />{state.label}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
