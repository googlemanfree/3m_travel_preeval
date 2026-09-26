import { AlertCircle, CheckCircle2, Circle, CircleHelp, ClipboardList, Clock3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCountryById, procedures107Complete, type CountryProcedureComplete } from "@/data/procedures107Complete";
import { getEvaluationDocumentRequirements, type EvaluationProjectType } from "@/data/evaluationDocumentCatalogue";
import RequirementQuickUpload from "@/components/RequirementQuickUpload";

type ChecklistDocument = {
  documentType?: string | null;
  documentName?: string | null;
  verificationStatus?: string | null;
  status?: string | null;
};

type Requirement = { category: string; label: string; detail?: string; priority?: string };
type CustomRequirement = {
  id: number;
  documentType: string;
  status: "pending" | "received" | "approved" | "rejected" | "waived";
  dueAt?: Date | string | null;
  adminComment?: string | null;
};
type DocumentClarification = {
  id?: number;
  documentLabel?: string;
  status?: "pending" | "answered" | "closed";
  responseMessage?: string | null;
  createdAt?: Date | string | null;
  answeredAt?: Date | string | null;
  canUpload?: boolean;
  hasSubmittedDocument?: boolean;
};

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

/** procedures107Complete utilise "visiteur", le catalogue d'évaluation utilise "tourisme" pour le même parcours. */
function projectTypeToVisaType(projectType: EvaluationProjectType): CountryProcedureComplete["visaType"] {
  return projectType === "tourisme" ? "visiteur" : projectType;
}

function resolveProcedure(destination?: string | null, projectType?: string | null) {
  if (!destination) return undefined;
  const key = normalize(destination);
  if (isProjectType(projectType)) {
    const visaType = projectTypeToVisaType(projectType);
    const exactMatch = procedures107Complete.find((country) => normalize(country.id) === `${key}-${visaType}` || (normalize(country.name) === key && country.visaType === visaType));
    if (exactMatch) return exactMatch;
  }
  return getCountryById(destination) ?? procedures107Complete.find((country) => {
    const countryKey = normalize(country.id);
    return countryKey.startsWith(`${key}-`) || normalize(country.name) === key;
  });
}

function isProjectType(value?: string | null): value is EvaluationProjectType {
  return value === "travail" || value === "etudes" || value === "tourisme";
}

/** Thème générique d'une pièce, pour éviter de répéter la même idée sous deux formulations (ex: "Passeport
 * en cours de validité" côté socle générique et "Passeport valide" côté données pays). Retourne null pour
 * les pièces sans équivalent générique connu (ex: "Certificat de parrainage") : celles-ci ne sont jamais filtrées. */
function requirementTheme(label: string): string | null {
  const target = normalize(label);
  if (target.includes("passeport") || target.includes("passport")) return "passeport";
  if (target.includes("photo")) return "photo";
  if (/(^| )cv( |$)/.test(target) || target.includes("curriculum")) return "cv";
  if (target.includes("diplome") || target.includes("releve")) return "diplome";
  if (target.includes("naissance")) return "naissance";
  if (target.includes("domicile") || target.includes("residence") || target.includes("hebergement")) return "residence";
  if (target.includes("financ") || target.includes("ressource") || target.includes("bancaire") || target.includes("solvabilite")) return "financement";
  return null;
}

function getRequirements(destination?: string | null, projectType?: string | null): Requirement[] {
  const generic = destination && isProjectType(projectType) ? getEvaluationDocumentRequirements(destination, projectType) : [];
  // procedures107Complete couvre 41+ pays avec des pieces reellement propres au couple pays+type de visa,
  // contrairement a COUNTRY_REQUIREMENTS (evaluationDocumentCatalogue) qui ne detaille que 5 pays : on le
  // fusionne toujours pour que la checklist ne reste jamais generique faute de couverture.
  const procedure = resolveProcedure(destination, projectType);
  const countrySpecific = procedure?.requiredDocuments?.length
    ? procedure.requiredDocuments.flatMap((group) => group.documents.map((label) => ({ category: group.category, label })))
    : [];

  const genericThemes = new Set(generic.map((requirement) => requirementTheme(requirement.label)).filter((theme): theme is string => theme !== null));
  const genericLabels = new Set(generic.map((requirement) => normalize(requirement.label)));
  const seenCountryLabels = new Set<string>();
  const filteredCountrySpecific = countrySpecific.filter((requirement) => {
    const key = normalize(requirement.label);
    if (genericLabels.has(key) || seenCountryLabels.has(key)) return false;
    const theme = requirementTheme(requirement.label);
    if (theme && genericThemes.has(theme)) return false;
    seenCountryLabels.add(key);
    return true;
  });

  const merged = [...generic, ...filteredCountrySpecific];
  return merged.length ? merged : FALLBACK_REQUIREMENTS;
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
  return getRequirements(destination, projectType).map((requirement) => ({ requirement, state: documentState(requirement, documents), dueAt: undefined as Date | string | null | undefined }));
}

/** Résumé de la checklist pour « Votre prochaine étape » : combien de pièces manquent ou sont à remplacer, et laquelle en premier. */
export function summarizeChecklist(destination: string | null | undefined, projectType: string | null | undefined, documents: ChecklistDocument[], customRequirements: CustomRequirement[] = []) {
  const states = [
    ...deriveChecklistStates(destination, projectType, documents),
    ...customRequirements.filter((requirement) => requirement.status !== "waived").map((requirement) => ({ requirement: { category: "Demande de votre conseiller", label: requirement.documentType }, state: customRequirementState(requirement, documents) })),
  ];
  const missing = states.filter(({ state }) => state.kind === "missing");
  const replace = states.filter(({ state }) => state.kind === "replace");
  return { total: states.length, missing: missing.length, replace: replace.length, firstMissingLabel: missing[0]?.requirement.label ?? null, firstReplaceLabel: replace[0]?.requirement.label ?? null };
}

export function calculateChecklistProgress(states: Array<{ state: { kind: string } }>) {
  const total = states.length;
  const completed = states.filter(({ state }) => state.kind === "received" || state.kind === "verified").length;
  return {
    total,
    completed,
    percentage: total ? Math.round((completed / total) * 100) : 0,
  };
}

export function buildDocumentClarificationMessage(documentLabel: string, details?: string) {
  const safeLabel = documentLabel.replace(/\s+/g, " ").trim().slice(0, 180) || "Pièce de la checklist";
  const safeDetails = (details ?? "").replace(/\s+/g, " ").trim().slice(0, 1_500);
  return [
    `Demande de clarification — pièce : ${safeLabel}`,
    safeDetails || "Pouvez-vous préciser ce qui est attendu pour cette pièce ?",
  ].join("\n\n");
}

function customRequirementState(requirement: CustomRequirement, documents: ChecklistDocument[]) {
  if (requirement.status === "approved") return { kind: "verified" as const, label: "Validé par l’agence", tone: "border-emerald-200 bg-emerald-50", Icon: CheckCircle2 };
  if (requirement.status === "rejected") return { kind: "replace" as const, label: "À remplacer", tone: "border-rose-200 bg-rose-50", Icon: AlertCircle };
  if (requirement.status === "received" || documentsForRequirement({ category: "Demande de votre conseiller", label: requirement.documentType }, documents).length) return { kind: "received" as const, label: "Reçu — vérification en cours", tone: "border-blue-200 bg-blue-50", Icon: Clock3 };
  return { kind: "missing" as const, label: "À fournir", tone: "border-amber-200 bg-amber-50", Icon: Circle };
}

export default function DossierDocumentChecklist({
  destination,
  documents,
  projectType,
  onOpenDocuments,
  onRequestClarification,
  onUploadClarification,
  onUploaded,
  customRequirements = [],
  clarifications = [],
}: {
  destination?: string | null;
  documents: ChecklistDocument[];
  projectType?: string | null;
  onOpenDocuments?: () => void;
  onRequestClarification?: (documentLabel: string) => void;
  onUploadClarification?: (clarification: { id: number; documentLabel: string }) => void;
  /** Quand il est fourni, chaque pièce à fournir ou à remplacer a son propre bouton d'envoi direct (appelé après un envoi réussi). */
  onUploaded?: () => void;
  customRequirements?: CustomRequirement[];
  clarifications?: DocumentClarification[];
}) {
  const requirements = getRequirements(destination, projectType);
  const states = deriveChecklistStates(destination, projectType, documents);
  const manualStates = customRequirements.filter((requirement) => requirement.status !== "waived").map((requirement) => ({ requirement: { category: "Demande de votre conseiller", label: requirement.documentType, detail: requirement.adminComment ?? undefined }, state: customRequirementState(requirement, documents), dueAt: requirement.dueAt }));
  const allStates = [...states, ...manualStates];
  const progress = calculateChecklistProgress(allStates);
  const receivedCount = progress.completed;
  const verifiedCount = allStates.filter(({ state }) => state.kind === "verified").length;
  const pendingCount = allStates.filter(({ state }) => state.kind === "missing" || state.kind === "replace").length;
  const pendingClarificationCount = clarifications.filter((item) => item.status === "pending" && item.documentLabel?.trim()).length;
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
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold tabular-nums text-indigo-700" aria-label={`${progress.percentage}% de la checklist documentaire est prête`}>
          {progress.percentage}% prêt
        </span>
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex items-baseline justify-between gap-3 text-sm" aria-live="polite">
          <p className="font-semibold text-slate-900"><span className="text-2xl tabular-nums text-indigo-700">{progress.percentage}%</span> de votre checklist est prête</p>
          <p className="shrink-0 text-xs text-slate-600">{receivedCount}/{progress.total} pièce{progress.total > 1 ? "s" : ""} reçue{receivedCount > 1 ? "s" : ""}</p>
        </div>
        <div className="mb-4 h-3 overflow-hidden rounded-full bg-indigo-100" role="progressbar" aria-label="Avancement de la checklist documentaire" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.completed} aria-valuetext={`${progress.percentage}% de la checklist documentaire est prête : ${receivedCount} pièce${receivedCount > 1 ? "s" : ""} reçue${receivedCount > 1 ? "s" : ""} sur ${progress.total}`}>
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-700 via-blue-600 to-sky-500" style={{ width: `${progress.percentage}%` }} />
        </div>
        <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold" aria-live="polite">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">{verifiedCount} validée{verifiedCount > 1 ? "s" : ""}</span>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-800">{receivedCount - verifiedCount} en vérification</span>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-900">{pendingCount} à compléter</span>
          {pendingClarificationCount > 0 && <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-900">{pendingClarificationCount} précision{pendingClarificationCount > 1 ? "s" : ""} en attente</span>}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {allStates.map(({ requirement, state, dueAt }, index) => {
            const StateIcon = state.Icon;
            const matchingClarifications = clarifications.filter((item) => item.documentLabel && normalize(item.documentLabel) === normalize(requirement.label));
            const pendingClarification = matchingClarifications.find((item) => item.status === "pending");
            const answeredClarification = matchingClarifications.find((item) => item.status === "answered" && item.responseMessage?.trim());
            return (
              <div key={`${requirement.category}-${requirement.label}-${index}`} className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${state.tone}`}>
                <StateIcon className="mt-0.5 h-4 w-4 shrink-0 text-current" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <span className="block font-semibold text-gray-900">{requirement.label}</span>
                  <span className="text-xs text-gray-600">{requirement.category} · {state.label}</span>
                  {requirement.detail && <span className="mt-1 block text-xs text-gray-600">{requirement.detail}</span>}
                  {dueAt && <span className="mt-1 block text-xs font-medium text-slate-700">À déposer avant le {new Date(dueAt).toLocaleDateString("fr-FR")}</span>}
                  {pendingClarification && <span className="mt-2 inline-flex rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-900">En attente de réponse</span>}
                  {answeredClarification && <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-950"><strong>Réponse de l’agence :</strong> {answeredClarification.responseMessage}{answeredClarification.canUpload && answeredClarification.id && answeredClarification.documentLabel && onUploadClarification && <Button type="button" size="sm" className="mt-2 h-8 bg-emerald-700 text-xs hover:bg-emerald-800" onClick={() => onUploadClarification({ id: answeredClarification.id!, documentLabel: answeredClarification.documentLabel! })}>Déposer cette pièce maintenant</Button>}{answeredClarification.hasSubmittedDocument && <span className="mt-2 block font-semibold text-emerald-800">Pièce transmise — vérification en cours.</span>}</div>}
                  {(state.kind === "missing" || state.kind === "replace") && (onUploaded
                    ? <RequirementQuickUpload label={requirement.label} replace={state.kind === "replace"} onUploaded={onUploaded} />
                    : onOpenDocuments && <Button type="button" variant="link" className="mt-1 h-auto px-0 py-0 text-xs font-bold text-blue-800" onClick={onOpenDocuments}>Déposer cette pièce</Button>)}
                  {onRequestClarification && <Button type="button" variant="link" className="mt-1 h-auto px-0 py-0 text-xs font-bold text-slate-700" disabled={Boolean(pendingClarification)} onClick={() => onRequestClarification(requirement.label)} aria-label={pendingClarification ? `Une clarification est en attente pour ${requirement.label}` : `Demander une clarification sur ${requirement.label}`}><CircleHelp className="mr-1 h-3.5 w-3.5" aria-hidden="true" />{pendingClarification ? "Précision demandée" : "Demander une précision"}</Button>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Liste des pièces que le candidat peut choisir à l'envoi : celles de son pays et de son type de visa (les mêmes que la
 * checklist), puis les demandes de son conseiller (hors pièces dispensées), sans doublon.
 */
export function buildRequirementOptions(destination?: string | null, projectType?: string | null, customRequirements: Array<Pick<CustomRequirement, "documentType" | "status">> = []): Array<{ label: string; group: string }> {
  const seen = new Set<string>();
  const options: Array<{ label: string; group: string }> = [];
  const add = (label: string, group: string) => {
    const key = normalize(label);
    if (!key || seen.has(key)) return;
    seen.add(key);
    options.push({ label: label.trim(), group });
  };
  for (const requirement of getRequirements(destination, projectType)) add(requirement.label, requirement.category);
  for (const requirement of customRequirements) if (requirement.status !== "waived") add(requirement.documentType, "Demande de votre conseiller");
  return options;
}

export { getRequirements };
