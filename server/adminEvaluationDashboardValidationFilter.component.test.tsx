// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// la page n'importe pas React (JSX automatique côté Vite) ; l'environnement de test l'attend en global
(globalThis as any).React = React;

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({ matches: false, media: query, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false }),
  });
}
if (!HTMLElement.prototype.hasPointerCapture) {
  Object.defineProperties(HTMLElement.prototype, {
    hasPointerCapture: { value: () => false },
    setPointerCapture: { value: () => undefined },
    releasePointerCapture: { value: () => undefined },
    scrollIntoView: { value: () => undefined },
  });
}

const state = vi.hoisted(() => ({ items: [] as any[], statuses: [] as any[], statusQueryFails: false }));

vi.mock("@/lib/trpc", () => {
  const query = (data: unknown) => ({ data, isLoading: false, isSuccess: true, isError: false, error: null, isFetching: false, refetch: async () => ({}) });
  const failing = { data: undefined, isLoading: false, isSuccess: false, isError: true, error: new Error("panne"), isFetching: false, refetch: async () => ({}) };
  const endpoint = (path: string) => ({
    useQuery: () => {
      if (path === "aiEvaluationManagement.getUnifiedDashboard") return query({ items: state.items, summary: { total: state.items.length, haute: 0, moyenne: state.items.length, basse: 0, converted: 0 }, reviewSla: null });
      if (path === "evaluationValidation.listStatuses") return state.statusQueryFails ? failing : query(state.statuses);
      return query(undefined);
    },
    useMutation: () => ({ isPending: false, mutate: () => undefined, mutateAsync: async () => ({}) }),
  });
  const node = (path: string): any =>
    new Proxy({}, { get: (_target, property) => (property === "useQuery" || property === "useMutation" ? endpoint(path)[property] : node(path ? `${path}.${String(property)}` : String(property))) });
  const trpc = new Proxy({ useUtils: () => ({ evaluationValidation: { listStatuses: { invalidate: () => undefined } } }) } as any, {
    get: (target, property) => (property in target ? target[property] : node(String(property))),
  });
  return { trpc };
});

import AdminAIEvaluationDashboard from "@/pages/AdminAIEvaluationDashboard";

const base = { typeLabel: "Pré-évaluation", email: "candidat@example.com", createdAt: "2026-09-20T10:00:00.000Z", score: null, hasConverted: false, priority: "moyenne", suggestedAction: "Relire l’évaluation", destinationCountry: "Canada", status: "pending" };
const evaluation = (id: number, fullName: string) => ({ ...base, id: `evaluation-${id}`, type: "evaluation", fullName });

const NAMES = ["Alice À Valider", "Bruno Publié", "Chloé Ancien Parcours", "Denis Luxembourg", "Emma Compléments"];

beforeEach(() => {
  localStorage.setItem("adminSessionToken", "token-admin");
  state.statusQueryFails = false;
  state.items = [evaluation(1, NAMES[0]), evaluation(2, NAMES[1]), evaluation(3, NAMES[2]), { ...base, id: "luxembourg-9", type: "luxembourg", typeLabel: "Luxembourg", fullName: NAMES[3] }, evaluation(5, NAMES[4])];
  state.statuses = [
    { evaluationId: 1, status: "en_revue_admin", label: "EN REVUE ADMINISTRATEUR", versionNumber: 1 },
    { evaluationId: 2, status: "validee_publiee_notifiee", label: "ÉVALUATION VALIDÉE, PUBLIÉE ET NOTIFIÉE", versionNumber: 1 },
    { evaluationId: 5, status: "informations_complementaires", label: "INFORMATIONS COMPLÉMENTAIRES REQUISES", versionNumber: 1 },
  ];
});
afterEach(cleanup);

const visibleNames = () => NAMES.filter((name) => screen.queryByText(name) !== null);
const filter = () => screen.getByLabelText("Filtrer par état de validation") as HTMLSelectElement;

describe("tableau de bord administrateur : filtre de la file d'attente de validation", () => {
  it("affiche tout par défaut, avec la pastille de statut de chaque évaluation gérée par la validation structurée", () => {
    render(<AdminAIEvaluationDashboard />);
    expect(visibleNames()).toEqual(NAMES);
    expect(screen.getByText("EN REVUE ADMINISTRATEUR")).toBeTruthy();
    expect(screen.getByText("ÉVALUATION VALIDÉE, PUBLIÉE ET NOTIFIÉE")).toBeTruthy();
    expect(filter().value).toBe("all");
  });

  it("annonce les effectifs de chaque choix", () => {
    render(<AdminAIEvaluationDashboard />);
    const labels = within(filter()).getAllByRole("option").map((option) => option.textContent);
    expect(labels).toEqual(["Toutes les évaluations (4)", "À valider (1)", "Compléments demandés (1)", "Publiées (1)", "Sans validation structurée (1)"]);
  });

  it("« À valider » ne garde que les évaluations en attente ou en revue, et écarte les autres types", async () => {
    const user = userEvent.setup();
    render(<AdminAIEvaluationDashboard />);
    await user.selectOptions(filter(), "to_validate");
    expect(visibleNames()).toEqual([NAMES[0]]);
  });

  it("filtre les compléments demandés, les publiées et l'ancien parcours, puis revient à tout afficher", async () => {
    const user = userEvent.setup();
    render(<AdminAIEvaluationDashboard />);
    await user.selectOptions(filter(), "info_requested");
    expect(visibleNames()).toEqual([NAMES[4]]);
    await user.selectOptions(filter(), "published");
    expect(visibleNames()).toEqual([NAMES[1]]);
    await user.selectOptions(filter(), "legacy");
    expect(visibleNames()).toEqual([NAMES[2]]);
    await user.selectOptions(filter(), "all");
    expect(visibleNames()).toEqual(NAMES);
  });

  it("l'ancien éditeur de réponse n'apparaît que pour l'évaluation restée sur l'ancien parcours", () => {
    render(<AdminAIEvaluationDashboard />);
    expect(screen.getAllByRole("button", { name: "Préparer la réponse" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Validation structurée" })).toHaveLength(4); // une par évaluation
  });

  it("garde la liste utilisable si les statuts de validation sont indisponibles (ancien parcours conservé)", () => {
    state.statusQueryFails = true;
    render(<AdminAIEvaluationDashboard />);
    expect(visibleNames()).toEqual(NAMES);
    expect(screen.getAllByRole("button", { name: "Préparer la réponse" })).toHaveLength(4); // aucun statut connu : l'ancien éditeur reste offert
    const labels = within(filter()).getAllByRole("option").map((option) => option.textContent);
    expect(labels[0]).toBe("Toutes les évaluations (4)");
    expect(labels[1]).toBe("À valider"); // pas d'effectif tant que les statuts ne sont pas connus
  });
});
