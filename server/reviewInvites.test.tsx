// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({
  rows: new Map<any, any[]>(),
  inserts: [] as Array<{ table: any; values: any }>,
  data: undefined as any,
  loading: false,
  error: null as any,
  marked: [] as any[],
}));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({ from: (table: any) => { const chain: any = { where: () => chain, limit: () => chain, then: (resolveRows: (rows: any[]) => unknown) => resolveRows(state.rows.get(table) ?? []) }; return chain; } }),
    insert: (table: any) => ({ values: async (values: any) => { state.inserts.push({ table, values }); state.rows.set(table, [...(state.rows.get(table) ?? []), values]); } }),
  }),
}));
vi.mock("./routers/adminAuth", () => ({ requireValidAdminSession: async () => ({ email: "agent@3mtravelagency.com" }) }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ reviewInvites: { listToInvite: { invalidate: vi.fn() } } }),
    reviewInvites: {
      listToInvite: { useQuery: () => ({ data: state.data, isLoading: state.loading, error: state.error }) },
      markInvited: { useMutation: () => ({ mutate: (input: any) => state.marked.push(input) }) },
    },
  },
}));

import { agencyDossiers, agencySettings, applications, customerReviews } from "../drizzle/schema";
import { pickClientsToInvite, reviewInvitedKey, reviewServiceFor, type InviteCandidate } from "../shared/reviewInviteTargets";
import { reviewInvitesRouter } from "./routers/reviewInvites";
import AdminReviewsToInvite from "@/components/AdminReviewsToInvite";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");
const candidate = (key: string, overrides: Partial<InviteCandidate> = {}): InviteCandidate => ({ key, email: `${key}@example.com`, fullName: "Aïcha Nkolo", phone: "698104832", destination: "Canada", visaType: "etude", approvedAt: new Date("2026-09-20"), ...overrides });

beforeEach(() => {
  state.rows = new Map();
  state.inserts = [];
  state.data = undefined;
  state.loading = false;
  state.error = null;
  state.marked = [];
});
afterEach(cleanup);

describe("qui inviter", () => {
  it("le type de visa donne le service du formulaire d'avis ; inconnu : vide (jamais deviné)", () => {
    expect(reviewServiceFor("etude")).toBe("Visa Études");
    expect(reviewServiceFor("Permis d'études")).toBe("Visa Études");
    expect(reviewServiceFor("travail")).toBe("Visa Travail");
    expect(reviewServiceFor("tourisme")).toBe("Visa Visiteur");
    expect(reviewServiceFor("visiteur")).toBe("Visa Visiteur");
    expect(reviewServiceFor("e-visa")).toBe("E-Visa");
    expect(reviewServiceFor("residence")).toBe("");
    expect(reviewServiceFor(null)).toBe("");
  });

  it("retire les clients déjà invités, ceux qui ont déjà donné leur avis (par e-mail) et les doublons d'adresse ; les visas récents d'abord", () => {
    const list = pickClientsToInvite(
      [candidate("online_1", { approvedAt: new Date("2026-09-01") }), candidate("online_2", { approvedAt: new Date("2026-09-25") }), candidate("online_3"), candidate("agency_4", { email: "online_2@example.com" }), candidate("online_5", { fullName: "  " })],
      new Set([reviewInvitedKey("online_3")]),
      new Set(["deja@example.com"]),
    );
    expect(list.map((item) => item.key)).toEqual(["online_2", "online_1"]);
    expect(pickClientsToInvite([candidate("online_9", { email: "Deja@Example.com" })], new Set(), new Set(["deja@example.com"]))).toEqual([]);
  });
});

describe("liste admin (routeur)", () => {
  const caller = () => reviewInvitesRouter.createCaller({ req: { headers: {} } } as any);
  const application = (id: number, overrides: Record<string, unknown> = {}) => ({ id, email: `c${id}@example.com`, fullName: `Client ${id}`, whatsappNumber: "698104832", destination: "canada", visaType: "etude", lastStatusUpdateAt: new Date("2026-09-20"), updatedAt: new Date("2026-09-20"), ...overrides });

  it("liste les visas accordés (en ligne et agence) avec service, destination et date", async () => {
    state.rows.set(applications, [application(1)]);
    state.rows.set(agencyDossiers, [{ id: 4, email: "paul@example.com", fullName: "Paul Mbarga", phone: "+237 6 55 00 00 00", destination: "Allemagne", visaType: "travail", lastStatusChangeAt: new Date("2026-09-24"), updatedAt: new Date("2026-09-24") }]);
    const result = await caller().listToInvite({ sessionToken: "t" });
    expect(result.count).toBe(2);
    expect(result.items.map((item) => item.key)).toEqual(["agency_4", "online_1"]);
    expect(result.items[0]).toMatchObject({ firstName: "Paul", service: "Visa Travail", destination: "Allemagne" });
    expect(result.items[1]).toMatchObject({ firstName: "Client", service: "Visa Études" });
  });

  it("exclut les invités et les clients qui ont déjà donné leur avis", async () => {
    state.rows.set(applications, [application(1), application(2), application(3)]);
    state.rows.set(agencySettings, [{ settingKey: reviewInvitedKey("online_1") }]);
    state.rows.set(customerReviews, [{ email: "C2@example.com" }]);
    const result = await caller().listToInvite({ sessionToken: "t" });
    expect(result.items.map((item) => item.key)).toEqual(["online_3"]);
  });

  it("noter une invitation est idempotent et refuse une clé invalide", async () => {
    await caller().markInvited({ sessionToken: "t", key: "online_7" });
    await caller().markInvited({ sessionToken: "t", key: "online_7" });
    const writes = state.inserts.filter((entry) => entry.table === agencySettings);
    expect(writes).toHaveLength(1);
    expect(writes[0].values.settingKey).toBe(reviewInvitedKey("online_7"));
    await expect(caller().markInvited({ sessionToken: "t", key: "../etc" as any })).rejects.toThrow();
  });

  it("session admin exigée avant toute lecture, routeur enregistré, rien n'est envoyé automatiquement", () => {
    const source = read("server/routers/reviewInvites.ts");
    expect(source.indexOf("requireValidAdminSession(input.sessionToken)")).toBeLessThan(source.indexOf("await getDb()"));
    expect(source).not.toMatch(/sendEmail|sendGenericEmail|whatsapp.*fetch/i);
    expect(read("server/routers.ts")).toContain("reviewInvites: reviewInvitesRouter");
  });
});

describe("panneau « Clients à inviter »", () => {
  const item = (overrides: Record<string, unknown> = {}) => ({ key: "online_1", fullName: "Aïcha Nkolo", firstName: "Aïcha", phone: "237698104832", destination: "Canada", service: "Visa Études", approvedAt: "2026-09-20T00:00:00Z", ...overrides });

  it("une ligne par client, avec le lien WhatsApp prérempli (numéro, prénom, formulaire du bon service) ; le clic note l'invitation", () => {
    state.data = { count: 1, items: [item()] };
    render(<AdminReviewsToInvite sessionToken="t" />);
    expect(screen.getByTestId("reviews-to-invite").textContent).toContain("1 client avec un visa accordé n’a pas encore été invité");
    const row = screen.getByTestId("to-invite-row");
    expect(row.textContent).toContain("Aïcha Nkolo");
    expect(row.textContent).toContain("Visa Études · Canada");
    const link = screen.getByTestId("invite-whatsapp") as HTMLAnchorElement;
    expect(link.href).toContain("https://wa.me/237698104832?text=");
    const text = decodeURIComponent(link.href);
    expect(text).toContain("Bonjour Aïcha");
    expect(text).toContain("service=Visa")
    expect(text).toContain("avec votre accord");
    expect(link.rel).toContain("noopener");
    fireEvent.click(link);
    expect(state.marked).toEqual([{ sessionToken: "t", key: "online_1" }]);
  });

  it("liste vide : message clair ; erreur : message clair sans planter", () => {
    state.data = { count: 0, items: [] };
    const { unmount } = render(<AdminReviewsToInvite sessionToken="t" />);
    expect(screen.getByTestId("reviews-to-invite").textContent).toContain("ont été invités ou ont déjà donné leur avis");
    unmount();
    state.data = undefined;
    state.error = new Error("boom");
    render(<AdminReviewsToInvite sessionToken="t" />);
    expect(screen.getByTestId("reviews-to-invite").textContent).toContain("Liste indisponible");
  });

  it("monté sur la page de modération des avis, au-dessus du formulaire manuel", () => {
    const page = read("client/src/pages/AdminCustomerReviews.tsx");
    expect(page).toContain("<AdminReviewsToInvite sessionToken={sessionToken} />");
    expect(page.indexOf("<AdminReviewsToInvite")).toBeLessThan(page.indexOf("<ReviewInvitationPanel />"));
  });
});

describe("numéro WhatsApp de l'invitation", () => {
  it("un numéro camerounais à 9 chiffres reçoit l'indicatif 237 (sinon le lien pointe vers un mauvais numéro)", async () => {
    state.rows = new Map();
    state.rows.set(applications, [{ id: 1, email: "c1@example.com", fullName: "Client 1", whatsappNumber: "698104832", destination: "canada", visaType: "etude", lastStatusUpdateAt: new Date(), updatedAt: new Date() }]);
    const result = await reviewInvitesRouter.createCaller({ req: { headers: {} } } as any).listToInvite({ sessionToken: "t" });
    expect(result.items[0].phone).toBe("237698104832");
  });
});
