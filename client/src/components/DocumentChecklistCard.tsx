import { AlertTriangle, CheckCircle2, Circle, FileCheck2, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";

const LABELS: Record<string, string> = { a_fournir: "À fournir", recu: "Reçu", lisible: "Lisible", a_mettre_a_jour: "À mettre à jour", verifie: "Vérifié par l'agence" };
const TONE: Record<string, string> = { a_fournir: "bg-slate-100 text-slate-800", recu: "bg-blue-100 text-blue-900", lisible: "bg-emerald-100 text-emerald-900", a_mettre_a_jour: "bg-amber-100 text-amber-900", verifie: "bg-emerald-200 text-emerald-950" };

function Icon({ status }: { status: string }) {
  if (status === "verifie" || status === "lisible") return <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />;
  if (status === "a_mettre_a_jour") return <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />;
  if (status === "recu") return <FileText className="h-5 w-5 text-blue-600" aria-hidden="true" />;
  return <Circle className="h-5 w-5 text-slate-300" aria-hidden="true" />;
}

/** Liste des pièces attendues pour le projet du candidat, avec un statut par pièce et, si besoin, la raison à corriger. Rien n'est affiché sans liste. */
export default function DocumentChecklistCard({ evaluationId }: { evaluationId: number }) {
  const query = trpc.evaluationValidation.myDocumentChecklist.useQuery({ evaluationId }, { retry: false, refetchInterval: 120_000 });
  const items = query.data?.items ?? [];
  if (items.length === 0) return null;
  return (
    <Card className="p-5" data-testid="document-checklist" aria-labelledby="document-checklist-title">
      <h3 id="document-checklist-title" className="flex items-center gap-2 text-base font-bold text-slate-950"><FileCheck2 className="h-5 w-5" aria-hidden="true" />Vos documents</h3>
      <p className="mt-1 text-xs text-slate-600">« Lisible » signifie que le document a pu être lu ; seule l'agence peut le marquer « vérifié ».</p>
      <ul className="mt-3 divide-y divide-slate-100">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 py-2 text-sm">
            <Icon status={item.status} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">{item.label}{item.required ? "" : " (facultatif)"}</p>
              {item.reason && <p className="mt-0.5 text-xs text-amber-900">{item.reason}</p>}
            </div>
            <Badge className={TONE[item.status]}>{LABELS[item.status] ?? item.status}</Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}
