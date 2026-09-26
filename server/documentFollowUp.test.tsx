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
}));
const fake = vi.hoisted(() => ({ db: null as any }));

vi.mock("./db", () => ({ getDb: async () => fake.db }));
vi.mock("./routers/adminAuth", () => ({ requireValidAdminSession: async () => ({ email: "agent@3mtravelagency.com" }) }));
vi.mock("@/lib/trpc", () => ({ trpc: { documentFollowUp: { listCandidatesToRemind: { useQuery: () => ({ data: state.data, isLoading: state.loading, error: state.error }) } } } }));

import { applications, candidates, emailDeliveryLogs, evaluations } from "../drizzle/schema";
import { documentFollowUpRouter, followUpMessage } from "./routers/documentFollowUp";
import { AdminCandidatesToRemind } from "@/components/AdminCandidatesToRemind";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");
const DAY = 24 * 60 * 60 * 1000;

const makeDb = () => ({
  select: () => ({
    from: (table: any) => {
      const chain: any = { where: () => chain, orderBy: () => chain, limit: () => chain, then: (resolveRows: (rows: any[]) => unknown) => resolveRows(state.rows.get(table) ?? []) };
      return chain;
    },
  }),
});

const candidate = (id: number, overrides: Record<string, unknown> = {}) => ({ id, email: `c${id}@example.com`, fullName: `Candidat ${id}`, phone: "6 98 10 48 32", emailVerified: true, dossierStatus: "documents", destination: "canada", preferredDestinations: '["Canada"]', lastLoginAt: null, createdAt: new Date(Date.now() - 10 * DAY), ...overrides });

beforeEach(() => {
  state.rows = new Map();
  state.data = undefined;
  state.loading = false;
  state.error = null;
  fake.db = makeDb();
  state.rows.set(applications, [{ email: "c1@example.com" }]);
  state.rows.set(evaluations, [{ projectType: "etudes" }]);
  state.rows.set(emailDeliveryLogs, []);
});
afterEach(cleanup);

describe("message WhatsApp du comptoir", () => {
  it("nomme la prochaine pièce, sans échéance ni promesse", () => {
    const message = followUpMessage({ fullName: "Aïcha Nkolo", missing: 3, replace: 1, firstLabel: "Passeport valide" });
    expect(message).toContain("Bonjour Aïcha");
    expect(message).toContain("4 pièces");
    expect(message).toContain("Passeport valide");
    expect(message).not.toMatch(/avant le|urgent|refus|annul/i);
    expect(followUpMessage({ fullName: "X", missing: 1, replace: 0, firstLabel: null })).toContain("1 pièce à envoyer");
  });
});

describe("liste admin des candidats à relancer", () => {
  const caller = () => documentFollowUpRouter.createCaller({ req: { headers: {} } } as any);

  it("liste les candidats avec des pièces manquantes, avec numéro WhatsApp normalisé et message prêt", async () => {
    state.rows.set(candidates, [candidate(1)]);
    const result = await caller().listCandidatesToRemind({ sessionToken: "t" });
    expect(result.count).toBe(1);
    const [item] = result.items;
    expect(item).toMatchObject({ candidateId: 1, fullName: "Candidat 1", hasWhatsApp: true, whatsappNumber: "237698104832", optedOut: false });
    expect(item.missing).toBeGreaterThan(2);
    expect(item.daysInactive).toBeGreaterThanOrEqual(9);
    expect(item.whatsappMessage).toContain("Candidat");
    expect(item.firstLabel).toBeTruthy();
  });

  it("classe du plus silencieux au plus récent ; un numéro invalide n'a pas de lien WhatsApp", async () => {
    state.rows.set(applications, [{ email: "c1@example.com" }, { email: "c2@example.com" }]);
    state.rows.set(candidates, [candidate(1, { createdAt: new Date(Date.now() - 5 * DAY) }), candidate(2, { createdAt: new Date(Date.now() - 20 * DAY), phone: "abc" })]);
    const result = await caller().listCandidatesToRemind({ sessionToken: "t" });
    expect(result.items.map((item) => item.candidateId)).toEqual([2, 1]);
    expect(result.items[0].hasWhatsApp).toBe(false);
    expect(result.items[0].whatsappNumber).toBeNull();
  });

  it("un compte non vérifié ou hors étape « documents » n'est pas listé", async () => {
    state.rows.set(applications, []);
    state.rows.set(candidates, [candidate(1, { emailVerified: false }), candidate(2, { dossierStatus: "nouveau" })]);
    expect((await caller().listCandidatesToRemind({ sessionToken: "t" })).count).toBe(0);
  });

  it("exige une session administrateur valide avant toute lecture", () => {
    const source = read("server/routers/documentFollowUp.ts");
    expect(source.indexOf("requireValidAdminSession(input.sessionToken)")).toBeGreaterThan(-1);
    expect(source.indexOf("requireValidAdminSession(input.sessionToken)")).toBeLessThan(source.indexOf("await getDb()"));
    expect(read("server/routers.ts")).toContain("documentFollowUp: documentFollowUpRouter");
  });
});

describe("panneau « Candidats à relancer »", () => {
  const item = (overrides: Record<string, unknown> = {}) => ({ candidateId: 1, fullName: "Aïcha Nkolo", email: "aicha@example.com", hasWhatsApp: true, whatsappNumber: "237698104832", whatsappMessage: "Bonjour Aïcha, pièce à envoyer", daysInactive: 9, lastActivityAt: "2026-09-17T00:00:00Z", missing: 3, replace: 1, total: 8, firstLabel: "Passeport valide", remindersSinceActivity: 2, optedOut: false, ...overrides });

  it("replié : affiche seulement le nombre ; déplié : une ligne par candidat avec le lien WhatsApp prérempli", () => {
    state.data = { count: 2, items: [item(), item({ candidateId: 2, fullName: "Paul Mbarga", hasWhatsApp: false, whatsappNumber: null, optedOut: true })] };
    render(<AdminCandidatesToRemind sessionToken="t" />);
    expect(screen.getByTestId("candidates-to-remind").textContent).toContain("2 candidats ont des pièces");
    expect(screen.queryByTestId("to-remind-list")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Candidats à relancer/ }));
    const rows = screen.getAllByTestId("to-remind-row");
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain("4 sur 8 pièces reçues");
    expect(rows[0].textContent).toContain("prochaine : Passeport valide");
    expect(rows[0].textContent).toContain("9 j sans activité");
    expect(rows[0].textContent).toContain("1 à remplacer");
    const link = screen.getByTestId("remind-whatsapp") as HTMLAnchorElement;
    expect(link.href).toContain("https://wa.me/237698104832?text=");
    expect(decodeURIComponent(link.href)).toContain("pièce à envoyer");
    expect(link.rel).toContain("noopener");
    expect(rows[1].textContent).toContain("Pas de numéro WhatsApp");
    expect(rows[1].textContent).toContain("Désinscrit des rappels");
  });

  it("aucun candidat : message rassurant ; erreur : message clair sans planter", () => {
    state.data = { count: 0, items: [] };
    const { unmount } = render(<AdminCandidatesToRemind sessionToken="t" />);
    expect(screen.getByTestId("candidates-to-remind").textContent).toContain("Aucun candidat n’a de pièce en attente");
    unmount();
    state.data = undefined;
    state.error = new Error("boom");
    render(<AdminCandidatesToRemind sessionToken="t" />);
    expect(screen.getByTestId("candidates-to-remind").textContent).toContain("Liste indisponible");
  });

  it("le panneau est monté dans l'onglet Documents de l'administration", () => {
    expect(read("client/src/components/AdminDocumentsManagement.tsx")).toContain("<AdminCandidatesToRemind sessionToken={sessionToken} />");
  });
});
