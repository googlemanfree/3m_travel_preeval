export const CANDIDATE_PAGE_SIZES = [10, 25, 50, 100] as const;
export type CandidatePageSize = (typeof CANDIDATE_PAGE_SIZES)[number];

export type CandidateListUrlState = {
  searchQuery: string;
  statusFilter: string;
  paymentFilter: string;
  scoreFilter: string;
  destinationFilter: string;
  sortBy: "createdAt" | "fullName" | "score" | "priorite" | "soumission";
  page: number;
  pageSize: CandidatePageSize;
  /** Filtre CV (onglets de classement rapide) : conservé dans l'adresse, donc dans le lien copié et les vues favorites. */
  cvFilter: CandidateCvFilter;
  evaluationFilter: CandidateEvaluationFilter;
};

export const CANDIDATE_CV_FILTERS = ["all", "a_traiter", "recu", "sans", "eval_cv"] as const;
export type CandidateCvFilter = (typeof CANDIDATE_CV_FILTERS)[number];
export const CANDIDATE_EVALUATION_FILTERS = ["all", "evalue", "non_evalue"] as const;
export type CandidateEvaluationFilter = (typeof CANDIDATE_EVALUATION_FILTERS)[number];

const readText = (params: URLSearchParams, key: string, fallback: string) => params.get(key)?.trim() || fallback;
const readPositiveInt = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export function parseCandidateListUrl(search: string): CandidateListUrlState {
  const params = new URLSearchParams(search);
  const rawPageSize = readPositiveInt(params.get("pageSize"), 25);
  const pageSize = CANDIDATE_PAGE_SIZES.includes(rawPageSize as CandidatePageSize) ? rawPageSize as CandidatePageSize : 25;
  const rawSort = readText(params, "sort", "priorite");
  return {
    searchQuery: readText(params, "q", ""),
    statusFilter: readText(params, "status", "tous"),
    paymentFilter: readText(params, "payment", "tous"),
    scoreFilter: readText(params, "score", "tous"),
    destinationFilter: readText(params, "destination", "tous"),
    sortBy: rawSort === "fullName" || rawSort === "score" || rawSort === "createdAt" || rawSort === "priorite" || rawSort === "soumission" ? rawSort : "priorite",
    page: readPositiveInt(params.get("page"), 1),
    pageSize,
    cvFilter: CANDIDATE_CV_FILTERS.includes(params.get("cv") as CandidateCvFilter) ? params.get("cv") as CandidateCvFilter : "all",
    evaluationFilter: CANDIDATE_EVALUATION_FILTERS.includes(params.get("evaluation") as CandidateEvaluationFilter) ? params.get("evaluation") as CandidateEvaluationFilter : "all",
  };
}

export function serializeCandidateListUrl(state: CandidateListUrlState): string {
  const params = new URLSearchParams();
  if (state.searchQuery) params.set("q", state.searchQuery);
  if (state.statusFilter !== "tous") params.set("status", state.statusFilter);
  if (state.paymentFilter !== "tous") params.set("payment", state.paymentFilter);
  if (state.scoreFilter !== "tous") params.set("score", state.scoreFilter);
  if (state.destinationFilter !== "tous") params.set("destination", state.destinationFilter);
  if (state.sortBy !== "priorite") params.set("sort", state.sortBy);
  if (state.page !== 1) params.set("page", String(state.page));
  if (state.pageSize !== 25) params.set("pageSize", String(state.pageSize));
  if (state.cvFilter && state.cvFilter !== "all") params.set("cv", state.cvFilter);
  if (state.evaluationFilter && state.evaluationFilter !== "all") params.set("evaluation", state.evaluationFilter);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function getPageTokens(page: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const result: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) result.push("ellipsis");
  for (let value = start; value <= end; value += 1) result.push(value);
  if (end < totalPages - 1) result.push("ellipsis");
  result.push(totalPages);
  return result;
}
