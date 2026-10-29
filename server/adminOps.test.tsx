// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { toBilanHtml } from "../shared/bilanContent";
import { reviewBilan } from "../shared/bilanReview";
import { EXPECTED_TABLES, MIN_OUTCOME_SAMPLE, computeOutcomeStats, planAssignments, scheduleSummary } from "../shared/adminOps";
import { REPLY_TEMPLATES, REPLY_TEMPLATES_EN, fillTemplate, replyTemplatesFor } from "../shared/remoteSupport";

(globalThis as any).React = React;
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

const state = vi.hoisted(() => ({ templates: { data: [] as any[] }, save: vi.fn(), assign: { data: undefined as any }, health: { data: undefined as any } }));
vi.mock("@/lib/trpc", () => {
  const query = (get: () => unknown) => ({ useQuery: () => ({ ...(get() as object), error: null, isLoading: false }) });
  const mutation = (fn: ReturnType<typeof vi.fn>) => ({ useMutation: () => ({ mutate: fn, isPending: false }) });
  return {
    trpc: {
      useUtils: () => new Proxy({}, { get: () => new Proxy({}, { get: () => ({ invalidate: vi.fn(), fetch: vi.fn() }) }) }),
      remoteSupport: { adminFindCandidate: query(() => ({ data: [] })) },
      adminOps: {
        adminBilanTemplates: query(() => state.templates), adminSaveBilanTemplate: mutation(state.save), adminArchiveBilanTemplate: mutation(vi.fn()),
        adminDocumentChecks: query(() => ({ data: { checked: 3, passports: [{ candidateId: 4, fullName: "Aïcha Diallo", status: "too_short", daysLeft: 60, expiryDate: "2026-12-30", message: "Valide moins de 6 mois après le voyage." }], discrepancies: [], offersClosingSoon: [] } })),
        adminScheduleList: query(() => ({ data: { summary: null, items: [{ id: 1, candidateId: 4, candidateName: "Aïcha Diallo", label: "Acompte", amount: 50000, currency: "XAF", dueOn: "2026-01-01", status: "pending", paidOn: null, note: null, overdue: true }] } })),
        adminNotifyPassport: mutation(vi.fn()), adminScheduleCreate: mutation(vi.fn()), adminScheduleSetStatus: mutation(vi.fn()), adminScheduleRemind: mutation(vi.fn()),
        adminOutcomes: query(() => ({ data: { stats: [{ destination: "Canada", visaType: "Travail", accepted: 6, refused: 2, withdrawn: 0, decided: 8, ratePercent: null, lowSample: true }], reasons: [], recent: [] } })), adminRecordOutcome: mutation(vi.fn()), adminVoidOutcome: mutation(vi.fn()),
        adminAssignmentPreview: query(() => state.assign), adminAutoAssign: mutation(vi.fn()), adminSystemHealth: query(() => state.health),
      },
    },
  };
});

import { AdminOps } from "../client/src/components/AdminOps";
import { BilanTemplatesPanel } from "../client/src/components/BilanTemplatesPanel";
import { BilanPasteEditor } from "../client/src/components/BilanPasteEditor";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");
const model = readFileSync(resolve(process.cwd(), "server/fixtures/bilanModele.txt"), "utf8");
const scoreTable = (rows: Array<[string, string]>) => `<table data-d="plain"><tbody>${rows.map(([label, value]) => `<tr><td>${label}</td><td data-a="right"><strong>${value}</strong></td></tr>`).join("")}</tbody></table>`;
afterEach(() => { cleanup(); state.save.mockReset(); state.assign = { data: undefined }; state.health = { data: undefined }; state.templates = { data: [] }; });

describe("relecture automatique du bilan", () => {
  const context = { fullName: "PRÉNOM NOM", destinations: ["Luxembourg"], expectedAmount: 100000 };
  const codes = (html: string, ctx = context) => reviewBilan(html, ctx).map((issue) => `${issue.level}:${issue.code}`);

  it("le modèle complet adressé au bon candidat ne donne aucune erreur", () => {
    const html = toBilanHtml(model).replace("[À CONFIRMER]", "100 000");
    expect(reviewBilan(html, context).filter((issue) => issue.level === "error")).toEqual([]);
  });

  it("bloque un bilan adressé à une autre personne (reste d'un autre dossier), pas une simple formule d'appel", () => {
    expect(codes("<p>Cher Monsieur MARTIN Paul, voici votre bilan complet de préévaluation professionnelle avec toutes les étapes.</p>")).toContain("error:name_mismatch");
    expect(codes("<p>Cher Monsieur PRÉNOM NOM, voici votre bilan complet de préévaluation professionnelle avec toutes les étapes.</p>")).not.toContain("error:name_mismatch");
    expect(codes("<p>Cher Monsieur, voici votre bilan complet de préévaluation professionnelle avec toutes les étapes à suivre.</p>")).not.toContain("error:name_mismatch");
    expect(codes("<p>Dear Ms DOE Jane, here is your complete assessment with all the steps that we advise to follow.</p>")).toContain("error:name_mismatch");
  });

  it("vérifie la note globale, le score affiché et les maximums", () => {
    const ok = scoreTable([["Formation", "11 / 15"], ["Expérience", "17 / 20"], ["NOTE GLOBALE", "28 / 35"]]) + scoreTable([["VOTRE SCORE", "28 / 35"]]);
    expect(codes(ok).filter((code) => code.startsWith("error"))).toEqual([]);
    expect(codes(scoreTable([["Formation", "11 / 15"], ["Expérience", "17 / 20"], ["NOTE GLOBALE", "61 / 100"]]))).toContain("error:score_total");
    expect(codes(ok + scoreTable([["VOTRE SCORE", "40 / 100"]]).replace("28 / 35", "x"))).toContain("error:score_headline");
    expect(codes(scoreTable([["Langues", "18 / 15"], ["Cohérence", "4 / 5"], ["NOTE GLOBALE", "22 / 20"]]))).toContain("error:score_over_max");
  });

  it("avertit sur la destination, le montant et l'ancienne marque", () => {
    const html = scoreTable([["ORIENTATION PRINCIPALE", "Canada"], ["MONTANT", "65 000 XAF"]]) + "<p>Bilan établi par 3M TRAVEL &amp; SERVICES pour un projet de travail salarié en comptabilité.</p>";
    const found = codes(html);
    expect(found).toContain("warning:destination_mismatch");
    expect(found).toContain("warning:amount_mismatch");
    expect(found).toContain("warning:old_brand");
    expect(codes(scoreTable([["ORIENTATION PRINCIPALE", "Luxembourg"], ["MONTANT", "100 000 XAF"]]) + "<p>Votre projet de travail salarié en comptabilité et finance.</p>")).not.toContain("warning:amount_mismatch");
  });

  it("la validation serveur refuse les erreurs de relecture", () => {
    const router = read("server/routers/unifiedRequests.ts");
    expect(router).toContain("reviewBilan(resolvedBilan");
    expect(router).toContain('.filter((issue) => issue.level === "error")');
    expect(router).toContain("Relecture automatique :");
  });
});

describe("outils d'administration : calculs", () => {
  it("aucun pourcentage de réussite avant l'effectif minimal ; ensuite le taux ne compte que les décisions", () => {
    const rows = [...Array(6).fill("accepted"), ...Array(2).fill("refused"), "withdrawn"].map((outcome) => ({ destination: "Canada", visaType: "Travail", outcome })) as Parameters<typeof computeOutcomeStats>[0];
    const [small] = computeOutcomeStats(rows);
    expect(small).toMatchObject({ decided: 8, lowSample: true, ratePercent: null, withdrawn: 1 });
    const many = [...rows, ...Array(2).fill({ destination: "canada", visaType: "travail", outcome: "accepted" })] as typeof rows;
    const [big] = computeOutcomeStats(many);
    expect(MIN_OUTCOME_SAMPLE).toBe(10);
    expect(big).toMatchObject({ decided: 10, lowSample: false, ratePercent: 80 });
  });

  it("l'affectation donne chaque dossier à l'agent le moins chargé et reste équilibrée", () => {
    const plan = planAssignments([{ id: 1, label: "A", open: 5 }, { id: 2, label: "B", open: 0 }, { id: 3, label: "C", open: 2 }], [10, 11, 12, 13, 14, 15]);
    const count = (id: number) => plan.filter((item) => item.agentId === id).length;
    // A (5 dossiers) ne reçoit rien tant que B (0) et C (2) sont moins chargés : on termine à 5, 4 et 4.
    expect([count(1), count(2), count(3)]).toEqual([0, 4, 2]);
    expect(planAssignments([], [1, 2])).toEqual([]);
  });

  it("le résumé d'échéancier distingue reçu, reste et retard ; les échéances annulées ou dispensées ne comptent pas", () => {
    const summary = scheduleSummary([
      { amount: 50000, dueOn: "2026-01-01", status: "paid" }, { amount: 30000, dueOn: "2026-02-01", status: "pending" }, { amount: 20000, dueOn: "2026-12-01", status: "pending" },
      { amount: 99999, dueOn: "2026-02-01", status: "cancelled" }, { amount: 10000, dueOn: "2026-03-01", status: "waived" },
    ], "2026-03-15");
    expect(summary).toEqual({ total: 100000, paid: 50000, remaining: 50000, overdueCount: 1, overdueAmount: 30000, nextDueOn: "2026-02-01" });
  });

  it("réponses types en anglais : mêmes identifiants qu'en français, langue choisie selon le candidat", () => {
    expect(REPLY_TEMPLATES_EN.map((item) => item.id)).toEqual(REPLY_TEMPLATES.map((item) => item.id));
    expect(replyTemplatesFor("en")[0].body).toMatch(/^Hello/);
    expect(replyTemplatesFor("fr")[0].body).toMatch(/^Bonjour/);
    expect(replyTemplatesFor(null)).toBe(REPLY_TEMPLATES);
    expect(fillTemplate("Hello {prenom}, thanks.", "Jane DOE")).toBe("Hello Jane, thanks.");
    expect(fillTemplate("Hello {prenom}, thanks.", "")).toBe("Hello, thanks.");
  });

  it("la liste des tables attendues couvre chaque CREATE TABLE des migrations 0088 à 0093", () => {
    const declared = new Set(EXPECTED_TABLES.flatMap((entry) => entry.tables));
    for (const file of ["0088_study_catalog", "0089_job_offers", "0090_stay_programs", "0091_remote_support", "0092_admin_insights", "0093_admin_ops"]) {
      for (const match of Array.from(read(`drizzle/${file}.sql`).matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g))) expect(declared.has(match[1]), `${file} : ${match[1]}`).toBe(true);
    }
  });
});

describe("outils d'administration : serveur", () => {
  const router = read("server/routers/adminOps.ts");

  it("toute procédure d'administration vérifie la session ; une seule procédure candidat", () => {
    const names = Array.from(router.matchAll(/\n  (admin[A-Za-z]+): publicProcedure/g), (match) => match[1]);
    expect(names.length).toBe(17);
    expect((router.match(/await requireValidAdminSession\(input\.sessionToken\)/g) ?? []).length).toBe(names.length);
    expect(Array.from(router.matchAll(/\n  ([A-Za-z]+): candidateProcedure/g), (match) => match[1])).toEqual(["myPaymentPlan"]);
  });

  it("un paiement n'est « reçu » qu'avec date et référence ; un refus de visa exige son motif ; rien n'est effacé", () => {
    expect(router).toContain('input.status === "paid" && (!input.paidOn || (input.note ?? "").length < 3)');
    expect(router).toContain('input.outcome === "refused" && (input.refusalReason ?? "").length < 3');
    expect(router).not.toMatch(/db\.delete\(/);
    expect(router).toContain("set({ voidedAt: new Date() })");
    expect(router).toContain("set({ archivedAt: new Date() })");
  });

  it("l'affectation ne touche que les dossiers encore non assignés et trace chaque décision", () => {
    expect(router).toContain("isNull(unifiedClientRequests.assignedAdminAccountId)");
    expect(router).toContain('actionType: "auto_assigned"');
  });

  it("la migration 0093 ne crée que des tables ; le routeur et l'écran sont branchés", () => {
    const sql = read("drizzle/0093_admin_ops.sql");
    expect((sql.match(/CREATE TABLE IF NOT EXISTS/g) ?? []).length).toBe(3);
    expect(sql.replace(/ON UPDATE CURRENT_TIMESTAMP/g, "")).not.toMatch(/\b(?:DROP|ALTER|DELETE|UPDATE|TRUNCATE|INSERT)\b/i);
    expect(read("server/routers.ts")).toContain("adminOps: adminOpsRouter");
    expect(read("client/src/pages/AdminDashboard.tsx")).toContain("<AdminOps sessionToken={sessionToken} />");
    expect(read("client/src/components/ClientRemoteSupport.tsx")).toContain("<PaymentPlanCard enabled={enabled} />");
    expect(read("client/src/components/EvaluationDeliveryEditor.tsx")).toContain("<BilanTemplatesPanel");
  });
});

describe("outils d'administration : écrans", () => {
  it("pièces et échéances : passeport à risque et paiement en retard visibles", () => {
    render(<AdminOps sessionToken={"t".repeat(40)} />);
    expect(screen.getByTestId("passport-4").textContent).toMatch(/Aïcha Diallo/);
    expect(screen.getByTestId("ops-checks").textContent).toMatch(/En retard/);
    for (const id of ["checks", "schedule", "outcomes", "assign", "health"]) expect(screen.getByTestId(`ops-tab-${id}`)).toBeTruthy();
  });

  it("résultats : un effectif trop faible n'affiche aucun pourcentage", () => {
    render(<AdminOps sessionToken={"t".repeat(40)} />);
    fireEvent.click(screen.getByTestId("ops-tab-outcomes"));
    expect(screen.getByTestId("outcome-stat-Canada").textContent).toMatch(/effectif trop faible \(8\/10\)/);
    expect(screen.getByTestId("outcome-stat-Canada").textContent).not.toMatch(/%/);
  });

  it("affectation et santé : aperçu avant exécution, migrations manquantes signalées", () => {
    state.assign = { data: { unassigned: 3, plan: 3, agents: [{ id: 1, label: "Marie", open: 2, willReceive: 3 }] } };
    state.health = { data: { database: true, missingMigrations: [{ migration: "0093", tables: ["bilan_templates"] }], openEmailIncidents: 2, scheduler: { mode: "off", jobs: 4, automaticReminders: false } } };
    render(<AdminOps sessionToken={"t".repeat(40)} />);
    fireEvent.click(screen.getByTestId("ops-tab-assign"));
    expect(screen.getByTestId("ops-assign").textContent).toMatch(/3 dossier\(s\) non assigné/);
    expect((screen.getByTestId("auto-assign") as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByTestId("ops-tab-health"));
    expect(screen.getByTestId("ops-health").textContent).toMatch(/0093 — bilan_templates/);
    expect(screen.getByTestId("ops-health").textContent).toMatch(/Relances automatiques : éteintes/);
  });

  it("modèles de bilan : l'enregistrement exige un nom et un contenu", () => {
    const html = toBilanHtml("Bonjour {{prenom}}, voici votre bilan pour {{destination}}, avec un montant de {{montant}} XAF.");
    render(<BilanTemplatesPanel sessionToken={"t".repeat(40)} projectKind="Visa travail" currentHtml={html} onLoad={() => {}} />);
    const save = screen.getByTestId("template-save") as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Nom du nouveau modèle"), { target: { value: "Préévaluation travail" } });
    expect(save.disabled).toBe(false);
    fireEvent.click(save);
    expect(state.save).toHaveBeenCalledWith({ sessionToken: "t".repeat(40), profile: "travail", name: "Préévaluation travail", html });
    expect((screen.getByTestId("template-load") as HTMLButtonElement).disabled).toBe(true);
  });

  it("l'éditeur affiche la relecture automatique du dossier", () => {
    const html = toBilanHtml("Cher Monsieur MARTIN Paul, voici votre bilan complet de préévaluation professionnelle avec toutes les étapes à suivre.");
    render(<BilanPasteEditor value={html} onChange={() => {}} reviewContext={{ fullName: "PRÉNOM NOM", destinations: ["Luxembourg"] }} />);
    expect(screen.getByTestId("bilan-review").textContent).toMatch(/À corriger avant validation/);
    expect(screen.getByTestId("bilan-review").textContent).toMatch(/MARTIN Paul/);
  });
});
