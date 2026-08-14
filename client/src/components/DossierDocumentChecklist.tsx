import { CheckCircle2, Circle, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCountryById, procedures107Complete } from "@/data/procedures107Complete";

type ChecklistDocument = {
  documentType?: string | null;
  documentName?: string | null;
  verificationStatus?: string | null;
};

type Requirement = { category: string; label: string };

const FALLBACK_REQUIREMENTS: Requirement[] = [
  { category: "Identité", label: "Passeport valide" },
  { category: "Identité", label: "Photo d’identité" },
  { category: "État civil", label: "Acte de naissance" },
  { category: "Domicile", label: "Justificatif de domicile" },
  { category: "Financier", label: "Justificatifs de ressources" },
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function resolveProcedure(destination?: string | null) {
  if (!destination) return undefined;
  const key = normalize(destination);
  return getCountryById(destination) ?? procedures107Complete.find((country) => {
    const countryKey = normalize(country.id);
    return countryKey.startsWith(`${key}-`) || normalize(country.name) === key;
  });
}

function getRequirements(destination?: string | null): Requirement[] {
  const procedure = resolveProcedure(destination);
  if (!procedure?.requiredDocuments?.length) return FALLBACK_REQUIREMENTS;
  return procedure.requiredDocuments.flatMap((group) =>
    group.documents.map((label) => ({ category: group.category, label }))
  );
}

function isReceived(requirement: Requirement, documents: ChecklistDocument[]): boolean {
  const target = normalize(requirement.label);
  return documents.some((document) => {
    const source = normalize(`${document.documentType ?? ""} ${document.documentName ?? ""}`);
    return source.includes(target) || target.includes(source.split(" ")[0] ?? "") ||
      (target.includes("passeport") && source.includes("passport")) ||
      (target.includes("photo") && source.includes("photo"));
  });
}

export default function DossierDocumentChecklist({
  destination,
  documents,
}: {
  destination?: string | null;
  documents: ChecklistDocument[];
}) {
  const requirements = getRequirements(destination);
  const receivedCount = requirements.filter((requirement) => isReceived(requirement, documents)).length;
  const destinationLabel = resolveProcedure(destination)?.name ?? destination ?? "votre destination";

  return (
    <Card className="mb-8 border-indigo-100 bg-white shadow-sm" aria-labelledby="document-checklist-title">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle id="document-checklist-title" className="flex items-center gap-2 text-lg text-gray-900">
            <ClipboardList className="h-5 w-5 text-indigo-600" />
            Checklist documentaire
          </CardTitle>
          <p className="mt-1 text-sm text-gray-600">
            Pièces recommandées pour <strong>{destinationLabel}</strong>. Les éléments se mettent à jour après chaque dépôt.
          </p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
          {receivedCount}/{requirements.length}
        </span>
      </CardHeader>
      <CardContent>
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-indigo-100" role="progressbar" aria-valuemin={0} aria-valuemax={requirements.length} aria-valuenow={receivedCount}>
          <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${requirements.length ? (receivedCount / requirements.length) * 100 : 0}%` }} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {requirements.map((requirement, index) => {
            const received = isReceived(requirement, documents);
            return (
              <div key={`${requirement.category}-${requirement.label}-${index}`} className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${received ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
                {received ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />}
                <span>
                  <span className="block font-semibold text-gray-900">{requirement.label}</span>
                  <span className="text-xs text-gray-600">{requirement.category} · {received ? "Reçu" : "À fournir"}</span>
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export { getRequirements };
