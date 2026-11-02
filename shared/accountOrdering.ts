/**
 * Ranger, classer, réorganiser la liste des comptes avant ouverture de dossier : tri (date, nom, connexion, pièces, bilan en attente, étape du parcours)
 * et regroupement (par étape ou par destination). Calculs purs ; la mémorisation du choix et l'affichage sont dans l'écran.
 */
export type AccountSortKey = "created" | "name" | "activity" | "documents" | "waiting" | "stage";
export type AccountGroupKey = "none" | "stage" | "destination";
export type AccountSortDirection = "asc" | "desc";
export type AccountView = { sort: AccountSortKey; dir: AccountSortDirection; group: AccountGroupKey };

export const DEFAULT_ACCOUNT_VIEW: AccountView = { sort: "created", dir: "desc", group: "none" };

export const SORT_OPTIONS: ReadonlyArray<{ value: string; label: string; sort: AccountSortKey; dir: AccountSortDirection }> = [
  { value: "created:desc", label: "Plus récents d'abord", sort: "created", dir: "desc" },
  { value: "created:asc", label: "Plus anciens d'abord", sort: "created", dir: "asc" },
  { value: "name:asc", label: "Nom A → Z", sort: "name", dir: "asc" },
  { value: "name:desc", label: "Nom Z → A", sort: "name", dir: "desc" },
  { value: "activity:desc", label: "Connectés récemment", sort: "activity", dir: "desc" },
  { value: "documents:desc", label: "Plus de pièces d'abord", sort: "documents", dir: "desc" },
  { value: "waiting:desc", label: "Bilan en attente depuis le plus longtemps", sort: "waiting", dir: "desc" },
  { value: "stage:asc", label: "Étape du parcours", sort: "stage", dir: "asc" },
];
export const GROUP_OPTIONS: ReadonlyArray<{ value: AccountGroupKey; label: string }> = [
  { value: "none", label: "Sans regroupement" },
  { value: "stage", label: "Classer par étape" },
  { value: "destination", label: "Classer par destination" },
];

type DateLike = string | Date | null | undefined;
export type OrderableAccount = {
  id: number;
  fullName?: string | null;
  createdAt?: DateLike;
  lastLoginAt?: DateLike;
  documentsCount?: number;
  destinationPreference?: string | null;
  evaluationValidated?: boolean;
  paymentValidated?: boolean;
  pendingEvaluationReference?: string | null;
  bilan?: { sent?: boolean; sentAt?: DateLike; decision?: string | null; openingRequested?: boolean } | null;
};

/** Étapes du parcours, dans l'ordre où un compte les traverse. */
export const STAGES = [
  { id: "eval_external", label: "Évaluation externe à valider", rank: 1 },
  { id: "eval_todo", label: "Évaluation à faire", rank: 2 },
  { id: "waiting_answer", label: "Bilan envoyé : réponse attendue", rank: 3 },
  { id: "declined", label: "Bilan refusé : à rappeler", rank: 4 },
  { id: "opening", label: "Ouverture demandée : frais à payer", rank: 5 },
  { id: "ready", label: "Prêt à activer", rank: 6 },
  { id: "other", label: "Autres", rank: 7 },
] as const;
export type AccountStageId = (typeof STAGES)[number]["id"];

export function accountStage(account: OrderableAccount): (typeof STAGES)[number] {
  const pick = (id: AccountStageId) => STAGES.find((stage) => stage.id === id)!;
  if (account.evaluationValidated && account.paymentValidated) return pick("ready");
  if (account.pendingEvaluationReference && !account.evaluationValidated) return pick("eval_external");
  const bilan = account.bilan;
  if (bilan?.sent) {
    if (bilan.decision === "declined") return pick("declined");
    if (bilan.decision === "accepted" || bilan.openingRequested) return pick("opening");
    return pick("waiting_answer");
  }
  if (!account.evaluationValidated) return pick("eval_todo");
  return pick("other");
}

const time = (value: DateLike): number | null => {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
};
/** Jours depuis l'envoi du bilan, seulement tant que la réponse du candidat est attendue (sinon : pas de valeur). */
const waitingDays = (account: OrderableAccount, now: number): number | null => {
  const bilan = account.bilan;
  if (!bilan?.sent || bilan.decision || bilan.openingRequested) return null;
  const sentAt = time(bilan.sentAt);
  return sentAt === null ? null : Math.max(0, Math.floor((now - sentAt) / 86_400_000));
};
const destinationOf = (account: OrderableAccount) => (account.destinationPreference ?? "").trim() || "Non précisée";

/** Compare deux valeurs ; les valeurs absentes passent toujours en dernier, quel que soit le sens. */
function compareValues(a: number | string | null, b: number | string | null, dir: AccountSortDirection): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  const result = typeof a === "string" && typeof b === "string" ? a.localeCompare(b, "fr", { sensitivity: "base" }) : (a as number) - (b as number);
  return dir === "asc" ? result : -result;
}

export function sortAccounts<T extends OrderableAccount>(items: T[], view: Pick<AccountView, "sort" | "dir">, now: number = Date.now()): T[] {
  const value = (account: T): number | string | null => {
    switch (view.sort) {
      case "name": return (account.fullName ?? "").trim() || null;
      case "activity": return time(account.lastLoginAt);
      case "documents": return account.documentsCount ?? 0;
      case "waiting": return waitingDays(account, now);
      case "stage": return accountStage(account).rank;
      default: return time(account.createdAt);
    }
  };
  return [...items].sort((a, b) => compareValues(value(a), value(b), view.dir) || b.id - a.id);
}

export type ArrangedAccounts<T> = { rows: T[]; starts: Map<number, { label: string; count: number }> };

/** Liste prête à afficher : triée, puis regroupée (les groupes se suivent) ; `starts` donne l'en-tête de groupe à placer avant la première ligne de chaque groupe. */
export function arrangeAccounts<T extends OrderableAccount>(items: T[], view: AccountView, now: number = Date.now()): ArrangedAccounts<T> {
  const sorted = sortAccounts(items, view, now);
  if (view.group === "none") return { rows: sorted, starts: new Map() };
  const groups = new Map<string, { label: string; order: number; items: T[] }>();
  for (const account of sorted) {
    const stage = accountStage(account);
    const key = view.group === "stage" ? stage.id : destinationOf(account);
    const label = view.group === "stage" ? stage.label : key;
    const order = view.group === "stage" ? stage.rank : key === "Non précisée" ? Number.MAX_SAFE_INTEGER : 0;
    const group = groups.get(key) ?? { label, order, items: [] };
    group.items.push(account);
    groups.set(key, group);
  }
  const ordered = Array.from(groups.values()).sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));
  const starts = new Map<number, { label: string; count: number }>();
  const rows: T[] = [];
  for (const group of ordered) {
    starts.set(group.items[0].id, { label: group.label, count: group.items.length });
    rows.push(...group.items);
  }
  return { rows, starts };
}

export const optionValue = (view: Pick<AccountView, "sort" | "dir">) => `${view.sort}:${view.dir}`;

/** Lit un choix mémorisé en refusant tout ce qui n'est pas une valeur connue. */
export function parseStoredView(raw: string | null | undefined): AccountView {
  try {
    const parsed = JSON.parse(raw ?? "null") as Partial<AccountView> | null;
    const sort = SORT_OPTIONS.some((option) => option.sort === parsed?.sort) ? (parsed!.sort as AccountSortKey) : DEFAULT_ACCOUNT_VIEW.sort;
    const dir = parsed?.dir === "asc" || parsed?.dir === "desc" ? parsed.dir : DEFAULT_ACCOUNT_VIEW.dir;
    const group = GROUP_OPTIONS.some((option) => option.value === parsed?.group) ? (parsed!.group as AccountGroupKey) : DEFAULT_ACCOUNT_VIEW.group;
    return { sort, dir, group };
  } catch {
    return DEFAULT_ACCOUNT_VIEW;
  }
}
