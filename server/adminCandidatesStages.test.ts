import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { filterCandidateRecords } from "./routers/adminCandidateManagement";
import { dossierStageOf, dossierStatusLabel } from "@shared/dossierStages";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8");

const base = {
  search: "", status: "all", paymentStatus: "all" as const, scoreBand: "all" as const, destination: "all",
  portraitStatus: "all" as const, cvStatus: "all" as const, sortBy: "createdAt" as const, sortDirection: "desc" as const, page: 1, pageSize: 25,
};
const record = (id: string, status: string, source: "web" | "agence" | "compte" = "web", paymentStatus: "paye" | "en_attente" | "non_paye" = "non_paye") => ({
  id, applicationNumber: id.toUpperCase(), fullName: `Candidat ${id}`, email: `${id}@example.test`, phone: "", destination: "canada", visaType: "x",
  scoringTotal: 0, scoringBadge: "faible" as const, status, stage: dossierStageOf(status), statusLabel: dossierStatusLabel(status),
  paymentStatus, createdAt: new Date("2026-11-01"), documentsCount: 0, source, avatarVerificationStatus: "missing" as const, avatarFaceCount: 0, cvReceived: false, bilanSent: false,
});

describe("liste des candidats : étapes et statuts", () => {
  const records = [
    record("online_1", "visa_approuve"),
    record("agency_1", "approuve", "agence"),
    record("online_2", "en_attente_paiement"),
    record("account_3", "nouveau", "compte"),
    record("online_4", "refuse"),
  ];

  it("le filtre « Approuvé » retrouve les statuts approuvés de TOUTES les sources (avant : égalité stricte)", () => {
    const approved = filterCandidateRecords(records, { ...base, status: "approuve" });
    expect(approved.map((item) => item.id).sort()).toEqual(["agency_1", "online_1"]);
  });

  it("un statut brut reste accepté (vues enregistrées existantes)", () => {
    expect(filterCandidateRecords(records, { ...base, status: "visa_approuve" }).map((item) => item.id)).toEqual(["online_1"]);
  });

  it("skipStatus ignore le filtre d'étape pour calculer les compteurs", () => {
    expect(filterCandidateRecords(records, { ...base, status: "refuse" }, { skipStatus: true })).toHaveLength(5);
  });

  it("les comptes sans dossier sont dans la liste et filtrables comme les autres", () => {
    const all = filterCandidateRecords(records, base);
    expect(all.some((item) => item.source === "compte")).toBe(true);
    expect(filterCandidateRecords(records, { ...base, status: "nouveau" }).map((item) => item.id)).toEqual(["account_3"]);
  });
});

describe("administration candidats et dossiers : garde-fous de l'interface", () => {
  const manager = read("client/src/pages/CandidatesManager.tsx");

  it("les compteurs viennent du serveur (tout le périmètre), pas de la page affichée", () => {
    expect(manager).toContain("data?.stats.stageCounts.approuve");
    expect(manager).toContain("data?.stats.paidCount");
    expect(manager).not.toContain('candidates.filter((c) => c.status === "approuve")');
  });

  it("le changement de taille de page relance la requête (pageSize dans les dépendances)", () => {
    expect(manager).toContain("sortBy, page, pageSize]);\n  const { data, isLoading, error } = trpc.adminCandidateManagement.list.useQuery(filterInput);");
  });

  it("filtres avec libellés visibles et statuts lisibles (jamais de snake_case)", () => {
    for (const label of ["Étape", "Paiement", "Score", "Destination", "Tri"]) expect(manager).toContain(`uppercase tracking-wide text-gray-500">${label}</p>`);
    expect(manager).toContain("dossierStatusLabel(candidate.status)");
    expect(manager).toContain("Compte sans dossier");
  });

  it("revue des portraits repliable, et file du jour classée par urgence", () => {
    const panel = read("client/src/components/AdminPortraitReviewPanel.tsx");
    expect(panel).toContain('data-testid="portrait-review-toggle"');
    expect(panel).toContain("aria-expanded={expanded}");
    const today = read("client/src/components/AdminTodayDashboard.tsx");
    expect(today).toContain("buildAllTodayItems");
    expect(today).toContain('data-testid="today-show-more"');
  });

  it("en-tête public réduit dans l'administration et cartes lisibles sur fond sombre", () => {
    const css = read("client/src/index.css");
    expect(css).toContain('.premium-header[data-admin-area="true"] nav.order-4');
    expect(read("client/src/components/Navbar.tsx")).toContain("data-admin-area={inAdminArea");
    // .glass-card pose un dégradé clair (background-image) que bg-white/10 ne peut pas recouvrir.
    expect(read("client/src/components/AdminOperationsControlCenter.tsx")).toContain("!bg-none !bg-white/10 !text-white");
  });

  it("le tableau Dossiers masque Source, Score, Date et Destination sous 1536 px", () => {
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect((dashboard.match(/hidden 2xl:table-cell/g) ?? []).length).toBeGreaterThanOrEqual(8);
  });
});

describe("liste des candidats : file « CV reçu à traiter »", () => {
  const withCv = (id: string, cvReceived: boolean, bilanSent: boolean) => ({ ...record(id, "en_evaluation"), cvReceived, bilanSent });
  const records = [withCv("online_1", true, false), withCv("online_2", true, true), withCv("online_3", false, false), withCv("online_4", true, false)];
  it("« à traiter » = CV reçu ET bilan pas encore envoyé", () => {
    expect(filterCandidateRecords(records, { ...base, cvStatus: "a_traiter" }).map((r) => r.id).sort()).toEqual(["online_1", "online_4"]);
  });
  it("« reçu » garde aussi ceux dont le bilan est envoyé ; « sans » = aucun CV ; « tous » = tout", () => {
    expect(filterCandidateRecords(records, { ...base, cvStatus: "recu" })).toHaveLength(3);
    expect(filterCandidateRecords(records, { ...base, cvStatus: "sans" }).map((r) => r.id)).toEqual(["online_3"]);
    expect(filterCandidateRecords(records, base)).toHaveLength(4);
  });
  it("se combine avec la recherche et l'étape", () => {
    expect(filterCandidateRecords(records, { ...base, cvStatus: "a_traiter", search: "online_4" }).map((r) => r.id)).toEqual(["online_4"]);
  });
  it("l'écran propose le filtre et le badge, et le serveur calcule les compteurs sur tout le périmètre", () => {
    const client = read("client/src/pages/CandidatesManager.tsx");
    expect(client).toContain('data-testid="cv-filter"');
    expect(client).toContain("CV reçu à traiter");
    expect(client).toContain('data-testid="cv-badge"');
    const server = read("server/routers/adminCandidateManagement.ts");
    expect(server).toContain("cvToProcessCount");
    expect(server).toContain("cvReceivedCount");
  });
});
