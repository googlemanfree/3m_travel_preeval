import { AlertCircle, CheckCircle2, Circle, ClipboardList, Clock3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCountryById, procedures107Complete } from "@/data/procedures107Complete";
import { getEvaluationDocumentRequirements, type EvaluationProjectType } from "@/data/evaluationDocumentCatalogue";

type ChecklistDocument = {
  documentType?: string | null;
  documentName?: string | null;
  verificationStatus?: string | null;
  status?: string | null;
};

type Requirement = { category: string; label: string; detail?: string; priority?: string };

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

function isProjectType(value?: string | null): value is EvaluationProjectType {
  return value === "travail" || value === "etudes" || value === "tourisme";
}

function getRequirements(destination?: string | null, projectType?: string | null): Requirement[] {
  if (destination && isProjectType(projectType)) {
    return getEvaluationDocumentRequirements(destination, projectType);
  }
  const procedure = resolveProcedure(destination);
  if (!procedure?.requiredDocuments?.length) return FALLBACK_REQUIREMENTS;
  return procedure.requiredDocuments.flatMap((group) =>
    group.documents.map((label) => ({ category: group.category, label }))
  );
}

function documentsForRequirement(requirement: Requirement, documents: ChecklistDocument[]): ChecklistDocument[] {
  const target = normalize(requirement.label);
  const aliases = target.includes("passeport") ? ["passport", "passeport"]
    : target.includes("photo") ? ["photo", "identite"]
    : target.includes("cv") ? ["cv", "professional", "experience"]
    : target.includes("diplome") || target.includes("releve") || target.includes("qualification") ? ["diplome", "diploma", "certificate", "releve", "transcript"]
    : target.includes("financement") || target.includes("ressource") ? ["bank", "financ", "ressource"]
    : target.includes("admission") || target.includes("acceptation") ? ["admission", "acceptance", "candidature"]
    : target.includes("employeur") || target.includes("emploi") ? ["employment", "employeur", "contrat", "offre", "professional"]
    : target.includes("residence") || target.includes("domicile") ? ["residence", "domicile", "hebergement"]
    : target.includes("naissance") ? ["naissance", "birth"]
    : [];
  return documents.filter((document) => {
    const source = normalize(`${document.documentType ?? ""} ${document.documentName ?? ""}`);
    if (!source) return false;
    return source.includes(target) || aliases.some((alias) => source.includes(alias));
  });
}

function documentState(requirement: Requirement, documents: ChecklistDocument[]) {
  const matches = documentsForRequirement(requirement, documents);
  if (!matches.length) return { kind: "missing" as const, label: "À fournir", tone: "border-amber-200 bg-amber-50", Icon: Circle };
  if (matches.some((document) => document.verificationStatus === "rejected" || document.status === "rejected")) {
    return { kind: "replace" as const, label: "À remplacer", tone: "border-rose-200 bg-rose-50", Icon: AlertCircle };
  }
  if (matches.some((document) => document.verificationStatus === "verified" || document.status === "verified")) {
    return { kind: "verified" as const, label: "Validé par l’agence", tone: "border-emerald-200 bg-emerald-50", Icon: CheckCircle2 };
  }
  return { kind: "received" as const, label: "Reçu — vérification en cours", tone: "border-blue-200 bg-blue-50", Icon: Clock3 };
}

export function deriveChecklistStates(destination: string | null | undefined, projectType: string | null | undefined, documents: ChecklistDocument[]) {
  return getRequirements(destination, projectType).map((requirement) => ({ requirement, state: documentState(requirement, documents) }));
}

export default function DossierDocumentChecklist({
  destination,
  documents,
  projectType,
  onOpenDocuments,
}: {
  destination?: string | null;
  documents: ChecklistDocument[];
  projectType?: string | null;
  onOpenDocuments?: () => void;
}) {
  const requirements = getRequirements(destination, projectType);
  const states = deriveChecklistStates(destination, projectType, documents);
  const receivedCount = states.filter(({ state }) => state.kind === "received" || state.kind === "verified").length;
  const verifiedCount = states.filter(({ state }) => state.kind === "verified").length;
  const pendingCount = states.filter(({ state }) => state.kind === "missing" || state.kind === "replace").length;
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
            Pièces à préparer pour <strong>{destinationLabel}</strong>. Cette liste s’adapte à votre projet et se met à jour après chaque dépôt ou vérification.
          </p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
          {receivedCount}/{requirements.length} reçue{receivedCount > 1 ? "s" : ""}
        </span>
      </CardHeader>
      <CardContent>
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-indigo-100" role="progressbar" aria-valuemin={0} aria-valuemax={requirements.length} aria-valuenow={receivedCount}>
          <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${requirements.length ? (receivedCount / requirements.length) * 100 : 0}%` }} />
        </div>
        <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold" aria-live="polite">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">{verifiedCount} validée{verifiedCount > 1 ? "s" : ""}</span>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-800">{receivedCount - verifiedCount} en vérification</span>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-900">{pendingCount} à compléter</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {states.map(({ requirement, state }, index) => {
            const StateIcon = state.Icon;
            return (
              <div key={`${requirement.category}-${requirement.label}-${index}`} className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${state.tone}`}>
                <StateIcon className="mt-0.5 h-4 w-4 shrink-0 text-current" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <span className="block font-semibold text-gray-900">{requirement.label}</span>
                  <span className="text-xs text-gray-600">{requirement.category} · {state.label}</span>
                  {requirement.detail && <span className="mt-1 block text-xs text-gray-600">{requirement.detail}</span>}
                  {(state.kind === "missing" || state.kind === "replace") && onOpenDocuments && <Button type="button" variant="link" className="mt-1 h-auto px-0 py-0 text-xs font-bold text-blue-800" onClick={onOpenDocuments}>Déposer cette pièce</Button>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export { getRequirements };
