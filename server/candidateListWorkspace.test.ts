import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseCandidateListUrl, serializeCandidateListUrl } from "../client/src/lib/adminCandidatePagination";

const read = (path: string) => readFileSync(path, "utf8");

describe("liste des candidats — dossier « Évaluation avec CV »", () => {
  const sql = read("server/services/candidateListQuery.ts");

  it("définit le filtre eval_cv : demande d'évaluation déposée ET CV déjà soumis", () => {
    expect(sql).toContain('"eval_cv"');
    expect(sql).toMatch(/filter\.cvStatus === "eval_cv"\) conditions\.push\(evaluationWithCvExpression\(def\)\)/);
    expect(sql).toContain("(${evaluationRequestedExpression(def)} AND (${def.ownCv} OR cvx.em IS NOT NULL))");
  });

  it("reconnaît une demande d'évaluation par dossier en ligne, évaluation non archivée ou évaluation déclarée sur le compte", () => {
    expect(sql).toContain("evrx");
    expect(sql).toMatch(/FROM evaluations e WHERE .*UNION SELECT LOWER\(a\.email\) FROM applications a UNION SELECT LOWER\(c\.email\) FROM candidates c WHERE c\.evaluationDeclarationStatus IN \('pending_validation', 'validated'\)/s);
    // les dossiers en ligne et les évaluations sans compte sont par nature des demandes ; agence et comptes seuls : seulement via l'adresse
    expect(sql.match(/ownRequest: sql\.raw\("\(1 = 1\)"\)/g)?.length).toBe(2);
    expect(sql.match(/ownRequest: sql\.raw\("\(1 = 0\)"\)/g)?.length).toBe(2);
  });

  it("compte les onglets « Évaluation avec CV » et « à évaluer », et marque chaque ligne", () => {
    expect(sql).toContain("evalCv:");
    expect(sql).toContain("evalCvToProcess:");
    expect(sql).toContain("evaluationWithCv: Number(row.evcv) > 0");
  });

  it("la recherche porte aussi sur le téléphone", () => {
    expect(sql).toContain("[def.name, def.email, def.phone,");
  });

  it("le routeur et les vues favorites acceptent le nouveau filtre", () => {
    expect(read("server/routers/adminCandidateManagement.ts")).toContain('cvStatus: z.enum(["all", "a_traiter", "recu", "sans", "eval_cv"])');
    const views = read("server/routers/adminSavedViews.ts");
    expect(views).toContain('cvFilter: z.enum(["all", "a_traiter", "recu", "sans", "eval_cv"]).default("all")');
    expect(views).toContain('evaluationFilter: z.enum(["all", "evalue", "non_evalue"]).default("all")');
  });
});

describe("liste des candidats — filtres dans l'adresse (lien copié, retour arrière, vues favorites)", () => {
  it("conserve le filtre CV et le filtre d'évaluation, et ignore les valeurs inconnues", () => {
    const state = { ...parseCandidateListUrl(""), cvFilter: "eval_cv" as const, evaluationFilter: "non_evalue" as const };
    const url = serializeCandidateListUrl(state);
    expect(url).toContain("cv=eval_cv");
    expect(url).toContain("evaluation=non_evalue");
    expect(parseCandidateListUrl(url)).toMatchObject({ cvFilter: "eval_cv", evaluationFilter: "non_evalue" });
    expect(parseCandidateListUrl("?cv=nimporte&evaluation=quoi")).toMatchObject({ cvFilter: "all", evaluationFilter: "all" });
    expect(serializeCandidateListUrl(parseCandidateListUrl(""))).toBe("");
  });
});

describe("liste des candidats — fluidité", () => {
  const page = read("client/src/pages/CandidatesManager.tsx");

  it("actualise la liste automatiquement (30 s, onglet visible, pas pendant qu'une fiche est ouverte) et permet de couper ou d'actualiser à la main", () => {
    expect(page).toContain("refetchInterval: autoRefresh && !isDetailOpen ? 30_000 : false");
    expect(page).toContain("refetchIntervalInBackground: false");
    expect(page).toContain("refetchOnWindowFocus: true");
    expect(page).toContain('data-testid="refresh-now"');
    expect(page).toContain('data-testid="refresh-auto-toggle"');
    expect(page).toContain("3m_admin_candidates_autorefresh");
  });

  it("propose les onglets « Évaluation avec CV », le raccourci « / », l'effacement de la recherche et les filtres actifs retirables", () => {
    expect(page).toContain('id: "eval-cv"');
    expect(page).toContain('id: "eval-cv-a-evaluer"');
    expect(page).toContain('event.key !== "/"');
    expect(page).toContain('data-testid="candidate-search-clear"');
    expect(page).toContain('data-testid="active-filters"');
    expect(page).toContain('data-testid="reset-all-filters"');
    expect(page).toContain('data-testid="badge-evaluation-cv"');
  });
});
