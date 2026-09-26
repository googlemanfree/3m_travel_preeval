// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({
  rows: new Map<any, any[]>(),
  data: undefined as any,
  loading: false,
  error: null as any,
  lastInput: undefined as any,
}));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({ from: (table: any) => { const chain: any = { where: () => chain, limit: () => chain, then: (resolveRows: (rows: any[]) => unknown) => resolveRows(state.rows.get(table) ?? []) }; return chain; } }),
  }),
}));
vi.mock("./routers/adminAuth", () => ({ requireValidAdminSession: async () => ({ email: "agent@3mtravelagency.com" }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    delayStats: {
      get: { useQuery: (input: any) => { state.lastInput = input; return { data: state.data, isLoading: state.loading, error: state.error }; } },
    },
  },
}));

import { adminActivityLogs, evaluations } from "../drizzle/schema";
import { MIN_RELIABLE_SAMPLE, computeBilanDelays, computeStageDelays, formatHours, median, stageLabel } from "../shared/delayStats";
import { delayStatsRouter } from "./routers/delayStats";
import AdminDelayStats from "@/components/AdminDelayStats";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");
const at = (iso: string) => new Date(iso);

beforeEach(() => {
  state.rows = new Map();
  state.data = undefined;
  state.loading = false;
  state.error = null;
  state.lastInput = undefined;
});
afterEach(cleanup);

describe("médiane", () => {
  it("vide : null ; impair : l'élément du milieu ; pair : moyenne des deux du milieu ; ne modifie pas l'entrée", () => {
    expect(median([])).toBeNull();
    expect(median([9, 1, 5])).toBe(5);
    expect(median([1, 2, 3, 10])).toBe(2.5);
    const input = [3, 1, 2];
    median(input);
    expect(input).toEqual([3, 1, 2]);
  });
});

describe("délais des bilans", () => {
  const now = at("2026-09-26T12:00:00Z");
  const row = (createdAt: string, deadline: string | null, sent: string | null) => ({ createdAt: at(createdAt), reviewDeadline: deadline ? at(deadline) : null, finalResponseSentAt: sent ? at(sent) : null });

  it("compte dans le délai, en retard, sans échéance et en attente dépassée, sans rien mélanger", () => {
    const stats = computeBilanDelays(
      [
        row("2026-09-01T08:00:00Z", "2026-09-03T08:00:00Z", "2026-09-02T08:00:00Z"), // 24 h, à l'heure
        row("2026-09-01T08:00:00Z", "2026-09-03T08:00:00Z", "2026-09-03T08:00:00Z"), // 48 h pile : à l'heure
        row("2026-09-01T08:00:00Z", "2026-09-03T08:00:00Z", "2026-09-05T08:00:00Z"), // 96 h, en retard
        row("2026-09-01T08:00:00Z", null, "2026-09-02T20:00:00Z"), // sans échéance, 36 h
        row("2026-09-10T08:00:00Z", "2026-09-12T08:00:00Z", null), // pas de réponse, échéance dépassée
        row("2026-09-25T08:00:00Z", "2026-09-27T08:00:00Z", null), // pas de réponse, échéance à venir
        row("2026-09-10T08:00:00Z", null, null), // pas de réponse, pas d'échéance : ni retard ni attente dépassée
      ],
      now,
    );
    expect(stats).toEqual({ answered: 4, medianHours: 42, onTime: 2, late: 1, noDeadline: 1, overduePending: 1 });
  });

  it("aucune réponse : médiane nulle et aucun compteur inventé", () => {
    expect(computeBilanDelays([], now)).toEqual({ answered: 0, medianHours: null, onTime: 0, late: 0, noDeadline: 0, overduePending: 0 });
  });

  it("ignore une durée négative (date incohérente) dans la médiane sans la compter comme réponse manquante", () => {
    const stats = computeBilanDelays([row("2026-09-05T08:00:00Z", null, "2026-09-04T08:00:00Z"), row("2026-09-01T08:00:00Z", null, "2026-09-02T08:00:00Z")], now);
    expect(stats.answered).toBe(2);
    expect(stats.medianHours).toBe(24);
  });
});

describe("durée entre étapes", () => {
  const t = (id: string, newStatus: string | null, iso: string) => ({ id, oldStatus: null, newStatus, at: at(iso) });

  it("mesure le temps entre deux changements consécutifs d'un même dossier, quel que soit l'ordre des lignes", () => {
    const stages = computeStageDelays([
      t("a", "DOCUMENTS_CHECK", "2026-09-05T00:00:00Z"),
      t("a", "PUBLISHED", "2026-09-01T00:00:00Z"),
      t("b", "PUBLISHED", "2026-09-02T00:00:00Z"),
      t("b", "DOCUMENTS_CHECK", "2026-09-04T00:00:00Z"),
      t("c", "PUBLISHED", "2026-09-02T00:00:00Z"),
      t("c", "DOCUMENTS_CHECK", "2026-09-05T12:00:00Z"),
    ]);
    expect(stages).toEqual([{ from: "PUBLISHED", to: "DOCUMENTS_CHECK", count: 3, medianDays: 3.5 }]);
  });

  it("ne mélange pas les dossiers, ignore les statuts vides et les répétitions du même statut", () => {
    const stages = computeStageDelays([
      t("a", "PUBLISHED", "2026-09-01T00:00:00Z"),
      t("b", "DOCUMENTS_CHECK", "2026-09-02T00:00:00Z"),
      t("a", "PUBLISHED", "2026-09-03T00:00:00Z"),
      t("a", null, "2026-09-04T00:00:00Z"),
    ]);
    expect(stages).toEqual([]);
  });

  it("classe les passages les plus fréquents d'abord", () => {
    const stages = computeStageDelays([
      t("a", "PUBLISHED", "2026-09-01T00:00:00Z"), t("a", "SUBMITTED", "2026-09-02T00:00:00Z"),
      t("b", "PUBLISHED", "2026-09-01T00:00:00Z"), t("b", "DOCUMENTS_CHECK", "2026-09-02T00:00:00Z"),
      t("c", "PUBLISHED", "2026-09-01T00:00:00Z"), t("c", "DOCUMENTS_CHECK", "2026-09-03T00:00:00Z"),
    ]);
    expect(stages.map((stage) => stage.to)).toEqual(["DOCUMENTS_CHECK", "SUBMITTED"]);
  });
});

describe("libellés et formats", () => {
  it("les codes d'étape connus ont un libellé français, les inconnus restent tels quels ; heures sous 48 h, jours au-delà", () => {
    expect(stageLabel("DOCUMENTS_CHECK")).toBe("Collecte des documents");
    expect(stageLabel("QUELQUE_CHOSE")).toBe("QUELQUE_CHOSE");
    expect(formatHours(6.5)).toBe("6,5 h");
    expect(formatHours(47.9)).toBe("47,9 h");
    expect(formatHours(72)).toBe("3 j");
    expect(MIN_RELIABLE_SAMPLE).toBe(5);
  });
});

describe("routeur", () => {
  const caller = () => delayStatsRouter.createCaller({ req: { headers: {} } } as any);

  it("assemble bilans et étapes depuis les tables, uniquement les changements de statut de dossiers (sans ligne sans dossier)", async () => {
    state.rows.set(evaluations, [
      { createdAt: at("2026-09-01T08:00:00Z"), reviewDeadline: at("2026-09-03T08:00:00Z"), finalResponseSentAt: at("2026-09-02T08:00:00Z") },
      { createdAt: at("2026-09-01T08:00:00Z"), reviewDeadline: at("2026-09-03T08:00:00Z"), finalResponseSentAt: at("2026-09-06T08:00:00Z") },
    ]);
    state.rows.set(adminActivityLogs, [
      { id: 7, oldStatus: null, newStatus: "PUBLISHED", at: at("2026-09-01T00:00:00Z") },
      { id: 7, oldStatus: "PUBLISHED", newStatus: "DOCUMENTS_CHECK", at: at("2026-09-03T00:00:00Z") },
      { id: null, oldStatus: null, newStatus: "PUBLISHED", at: at("2026-09-01T00:00:00Z") },
    ]);
    const result = await caller().get({ sessionToken: "t" });
    expect(result.days).toBe(180);
    expect(result.evaluationsCount).toBe(2);
    expect(result.bilans).toMatchObject({ answered: 2, onTime: 1, late: 1 });
    expect(result.stages).toEqual([{ from: "PUBLISHED", to: "DOCUMENTS_CHECK", count: 1, medianDays: 2 }]);
  });

  it("refuse une période hors 30–365 jours", async () => {
    await expect(caller().get({ sessionToken: "t", days: 5 })).rejects.toThrow();
    await expect(caller().get({ sessionToken: "t", days: 1000 })).rejects.toThrow();
    await expect(caller().get({ sessionToken: "t", days: 90 })).resolves.toMatchObject({ days: 90 });
  });

  it("session admin exigée avant toute lecture, lecture seule, routeur enregistré", () => {
    const source = read("server/routers/delayStats.ts");
    expect(source.indexOf("requireValidAdminSession(input.sessionToken)")).toBeGreaterThan(-1);
    expect(source.indexOf("requireValidAdminSession(input.sessionToken)")).toBeLessThan(source.indexOf("await getDb()"));
    expect(source).not.toMatch(/\.(insert|update|delete)\(/);
    expect(read("server/routers.ts")).toContain("delayStats: delayStatsRouter");
  });
});

describe("carte « Délais réels de traitement »", () => {
  const data = (overrides: Record<string, unknown> = {}) => ({
    days: 180,
    evaluationsCount: 12,
    bilans: { answered: 10, medianHours: 30.5, onTime: 8, late: 2, noDeadline: 1, overduePending: 0 },
    stages: [
      { from: "PUBLISHED", to: "DOCUMENTS_CHECK", count: 7, medianDays: 2.5 },
      { from: "DOCUMENTS_CHECK", to: "SUBMITTED", count: 2, medianDays: 6 },
    ],
    ...overrides,
  });

  it("résumé replié : taux dans le délai ; rien de détaillé tant qu'elle est fermée", () => {
    state.data = data();
    render(<AdminDelayStats sessionToken="t" />);
    expect(screen.getByTestId("delay-stats").textContent).toContain("80% des bilans envoyés dans le délai sur 180 jours");
    expect(screen.queryByTestId("stage-delays")).toBeNull();
    expect(state.lastInput).toMatchObject({ sessionToken: "t", days: 180 });
  });

  it("des bilans sans réponse après l'échéance passent avant le taux dans le résumé", () => {
    state.data = data({ bilans: { answered: 4, medianHours: 20, onTime: 4, late: 0, noDeadline: 0, overduePending: 3 } });
    render(<AdminDelayStats sessionToken="t" />);
    expect(screen.getByTestId("delay-stats").textContent).toContain("3 bilans sans réponse après l’échéance");
  });

  it("ouverte : durée médiane, comptes, lignes d'étapes ; « indicatif » seulement sous 5 dossiers", () => {
    state.data = data();
    render(<AdminDelayStats sessionToken="t" />);
    fireEvent.click(screen.getByRole("button", { name: /Délais réels/ }));
    const bilans = screen.getByTestId("bilan-delays").textContent ?? "";
    expect(bilans).toContain("30,5 h");
    expect(bilans).toContain("(80%)");
    expect(bilans).toContain("1 réponse envoyée sans échéance enregistrée");
    const rows = screen.getAllByTestId("stage-row");
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain("Bilan disponible → Collecte des documents");
    expect(rows[0].textContent).toContain("2,5 j");
    expect(rows[0].textContent).not.toContain("indicatif");
    expect(rows[1].textContent).toContain("indicatif");
  });

  it("changer la période relance la requête avec la nouvelle valeur", () => {
    state.data = data();
    render(<AdminDelayStats sessionToken="t" />);
    fireEvent.click(screen.getByRole("button", { name: /Délais réels/ }));
    fireEvent.change(screen.getByLabelText("Période"), { target: { value: "30" } });
    expect(state.lastInput).toMatchObject({ days: 30 });
  });

  it("aucun bilan avec échéance : pas de taux inventé ; aucune étape : message ; erreur : message sans planter", () => {
    state.data = data({ bilans: { answered: 0, medianHours: null, onTime: 0, late: 0, noDeadline: 0, overduePending: 0 }, stages: [] });
    const { unmount } = render(<AdminDelayStats sessionToken="t" />);
    expect(screen.getByTestId("delay-stats").textContent).toContain("Pas encore assez de bilans avec échéance");
    fireEvent.click(screen.getByRole("button", { name: /Délais réels/ }));
    expect(screen.getByTestId("bilan-delays").textContent).toContain("—");
    expect(screen.getByTestId("stage-delays").textContent).toContain("Aucun changement d’étape enregistré");
    unmount();
    state.data = undefined;
    state.error = new Error("boom");
    render(<AdminDelayStats sessionToken="t" />);
    expect(screen.getByTestId("delay-stats").textContent).toContain("Statistiques indisponibles");
  });

  it("monté dans l'onglet pilotage, juste après la file de priorités", () => {
    const page = read("client/src/pages/AdminDashboard.tsx");
    expect(page).toContain("<AdminDelayStats sessionToken={sessionToken} />");
    expect(page.indexOf("<AdminPilotageQueue")).toBeGreaterThan(-1);
    expect(page.indexOf("<AdminPilotageQueue")).toBeLessThan(page.indexOf("<AdminDelayStats"));
  });
});
