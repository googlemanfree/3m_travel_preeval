// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({
  desk: undefined as any,
  documents: undefined as any,
  reviews: undefined as any,
  deletions: undefined as any,
  lastInputs: {} as Record<string, any>,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    flightFollowUp: { deskOverview: { useQuery: (input: any) => { state.lastInputs.desk = input; return { data: state.desk }; } } },
    documentFollowUp: { listCandidatesToRemind: { useQuery: (input: any) => { state.lastInputs.documents = input; return { data: state.documents }; } } },
    reviewInvites: { listToInvite: { useQuery: (input: any) => { state.lastInputs.reviews = input; return { data: state.reviews }; } } },
    candidatePrivacy: { listDeletionRequests: { useQuery: (input: any) => { state.lastInputs.deletions = input; return { data: state.deletions }; } } },
  },
}));

import { AdminOperationsControlCenter } from "@/components/AdminOperationsControlCenter";

const baseProps = { sessionToken: "tok", totalCandidates: 10, pendingEvaluations: 1, pendingPayments: 1, pendingFlights: 1, openDeadlines: 1, smtpFailures: 0, lastSyncedAt: null, isRefreshing: false, onRefresh: () => undefined };

beforeEach(() => {
  state.desk = undefined;
  state.documents = undefined;
  state.reviews = undefined;
  state.deletions = undefined;
  state.lastInputs = {};
});
afterEach(cleanup);

describe("signaux « à faire aujourd'hui »", () => {
  it("chaque file d'attente déjà construite ailleurs alimente son propre compteur, avec le jeton de session", () => {
    state.desk = { stale: [{ requestId: 1 }, { requestId: 2 }], openChanges: [{ requestId: 3 }] };
    state.documents = { count: 4, items: [] };
    state.reviews = { count: 2, items: [] };
    state.deletions = [{ candidateId: 1 }];
    render(<AdminOperationsControlCenter {...baseProps} onNavigate={() => undefined} />);
    const signals = screen.getByTestId("today-signals");
    expect(signals.textContent).toContain("3"); // 2 en attente + 1 modification
    expect(signals.textContent).toContain("4");
    expect(signals.textContent).toContain("2");
    expect(signals.textContent).toContain("1");
    expect(state.lastInputs.desk).toMatchObject({ sessionToken: "tok" });
    expect(state.lastInputs.documents).toMatchObject({ sessionToken: "tok" });
  });

  it("vols et documents ouvrent l'onglet correspondant du tableau de bord", () => {
    state.desk = { stale: [], openChanges: [] };
    state.documents = { count: 0, items: [] };
    const calls: string[] = [];
    render(<AdminOperationsControlCenter {...baseProps} onNavigate={(tab) => calls.push(tab)} />);
    const signals = screen.getByTestId("today-signals");
    fireEvent.click(within(signals).getByText("Vols à traiter (options, modifications)"));
    fireEvent.click(within(signals).getByText("Candidats à relancer (documents)"));
    expect(calls).toEqual(["flights", "documents"]);
  });

  it("avis et suppressions mènent directement à leur propre page admin (pas un onglet)", () => {
    render(<AdminOperationsControlCenter {...baseProps} onNavigate={() => undefined} />);
    const signals = screen.getByTestId("today-signals");
    const reviewLink = within(signals).getByText("Avis clients à inviter").closest("a");
    const deletionLink = within(signals).getByText("Suppressions de compte demandées").closest("a");
    expect(reviewLink?.getAttribute("href")).toBe("/admin/customer-reviews");
    expect(deletionLink?.getAttribute("href")).toBe("/admin/email-settings");
  });

  it("aucune donnée encore chargée : un tiret, jamais un zéro trompeur", () => {
    render(<AdminOperationsControlCenter {...baseProps} onNavigate={() => undefined} />);
    expect(screen.getByTestId("today-signals").textContent).not.toContain("undefined");
    expect(screen.getAllByText("…")).toHaveLength(4);
  });
});
