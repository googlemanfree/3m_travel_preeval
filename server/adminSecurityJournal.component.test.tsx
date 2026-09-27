// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({ data: undefined as any, error: null as any, isLoading: false, lastInput: undefined as any }));

vi.mock("@/lib/trpc", () => ({
  trpc: { adminAuth: { listSecurityEvents: { useQuery: (input: any) => { state.lastInput = input; return { data: state.data, error: state.error, isLoading: state.isLoading }; } } } },
}));

import AdminSecurityJournal from "@/components/AdminSecurityJournal";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");
const event = (overrides: Record<string, unknown> = {}) => ({ id: 1, eventType: "login", adminEmail: "agent@3mtravelagency.com", adminFullName: "Agent 3M", createdAt: "2026-09-27T08:00:00Z", ...overrides });

beforeEach(() => {
  state.data = undefined;
  state.error = null;
  state.isLoading = false;
  state.lastInput = undefined;
});
afterEach(cleanup);

describe("journal de sécurité de l'équipe (composant)", () => {
  it("résumé replié : compte les événements autres qu'une connexion réussie ; rien de détaillé tant qu'il est fermé", () => {
    state.data = [event(), event({ id: 2, eventType: "login_failed" }), event({ id: 3, eventType: "twofactor_failed" })];
    render(<AdminSecurityJournal sessionToken="tok" />);
    expect(screen.getByTestId("security-summary").textContent).toContain("2 événements à regarder sur 30 jours");
    expect(screen.queryByTestId("security-event-row")).toBeNull();
    expect(state.lastInput).toMatchObject({ sessionToken: "tok", days: 30 });
  });

  it("rien d'anormal : message rassurant, pas de faux zéro alarmant", () => {
    state.data = [event(), event({ id: 2 })];
    render(<AdminSecurityJournal sessionToken="tok" />);
    expect(screen.getByTestId("security-summary").textContent).toContain("Rien d’anormal");
  });

  it("ouvert : chaque ligne montre l'admin concerné, le libellé en clair de l'événement, jamais le type technique brut", () => {
    state.data = [event({ eventType: "login_blocked" })];
    render(<AdminSecurityJournal sessionToken="tok" />);
    fireEvent.click(screen.getByRole("button", { name: /Journal de sécurité/ }));
    const row = screen.getByTestId("security-event-row");
    expect(row.textContent).toContain("Agent 3M");
    expect(row.textContent).toContain("agent@3mtravelagency.com");
    expect(row.textContent).toContain("Connexion refusée (compte désactivé)");
    expect(row.textContent).not.toContain("login_blocked");
  });

  it("changer la période relance la requête avec la nouvelle valeur", () => {
    state.data = [];
    render(<AdminSecurityJournal sessionToken="tok" />);
    fireEvent.click(screen.getByRole("button", { name: /Journal de sécurité/ }));
    fireEvent.change(screen.getByLabelText("Période"), { target: { value: "7" } });
    expect(state.lastInput).toMatchObject({ days: 7 });
  });

  it("aucun événement sur la période, et erreur du serveur : messages clairs, jamais une page cassée", () => {
    state.data = [];
    const { unmount } = render(<AdminSecurityJournal sessionToken="tok" />);
    fireEvent.click(screen.getByRole("button", { name: /Journal de sécurité/ }));
    expect(screen.getByText("Aucun événement sur cette période.")).toBeTruthy();
    unmount();
    state.data = undefined;
    state.error = new Error("boom");
    render(<AdminSecurityJournal sessionToken="tok" />);
    expect(screen.getByTestId("security-summary").textContent).toContain("indisponible");
  });

  it("monté sur la page des paramètres de sécurité, après la continuité de session", () => {
    const page = read("client/src/pages/AdminEmailSettings.tsx");
    expect(page).toContain("<AdminSecurityJournal sessionToken={sessionToken ?? \"\"} />");
    expect(page.indexOf("Continuité de session")).toBeLessThan(page.indexOf("<AdminSecurityJournal"));
  });
});
