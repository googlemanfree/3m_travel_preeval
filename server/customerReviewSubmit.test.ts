import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  inserted: [] as any[],
  existing: [] as any[],
  notified: [] as any[],
}));

vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({ from: () => ({ where: () => ({ limit: async () => state.existing }) }) }),
    insert: () => ({ values: async (row: any) => { state.inserted.push(row); } }),
  }),
}));
vi.mock("./routers/adminNotifications", () => ({ notifyAdmins: async (input: any) => { state.notified.push(input); } }));
vi.mock("./_core/llm", () => ({ invokeLLM: async () => ({}) }));

import { customerReviewRouter } from "./routers/customerReview";

let ip = 0;
const caller = () => customerReviewRouter.createCaller({ req: { headers: {}, socket: { remoteAddress: `10.9.0.${++ip}` } } } as any);
const review = (overrides: Record<string, unknown> = {}) => ({
  fullName: "Client Réel",
  email: `client${ip}@example.com`,
  rating: 5,
  reviewText: "Accompagnement sérieux du début à la fin.",
  consentToPublish: true,
  ...overrides,
});

beforeEach(() => {
  state.inserted = [];
  state.existing = [];
  state.notified = [];
});

describe("dépôt d'un avis client", () => {
  it("enregistre l'avis en attente de modération (jamais publié) et prévient l'administration", async () => {
    await caller().submit(review({ destinationCountry: "Canada" }));
    expect(state.inserted).toHaveLength(1);
    expect(state.inserted[0]).toMatchObject({ status: "pending_review", consentToPublish: true });
    expect(state.notified).toHaveLength(1);
    expect(state.notified[0]).toMatchObject({ title: "Nouvel avis client à modérer", targetAdminType: "accompagnement" });
    expect(state.notified[0].message).toContain("5/5");
    expect(state.notified[0].message).toContain("Canada");
  });

  it("refuse un avis sans consentement de publication", async () => {
    await expect(caller().submit(review({ consentToPublish: false }))).rejects.toThrow(/consentement/i);
    expect(state.inserted).toHaveLength(0);
  });

  it("un avis renvoyé à l'identique (double clic) ne crée pas de doublon à modérer", async () => {
    state.existing = [{ id: 7 }];
    const result = await caller().submit(review());
    expect(result.success).toBe(true);
    expect(state.inserted).toHaveLength(0);
    expect(state.notified).toHaveLength(0);
  });

  it("plafonne les envois d'une même adresse e-mail (file de modération protégée)", async () => {
    const email = "rafale@example.com";
    for (let index = 0; index < 3; index += 1) await caller().submit(review({ email, reviewText: `Avis numéro ${index} bien détaillé.` }));
    await expect(caller().submit(review({ email, reviewText: "Encore un avis bien détaillé." }))).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(state.inserted).toHaveLength(3);
  });

  it("plafonne les envois d'une même connexion", async () => {
    const fixed = customerReviewRouter.createCaller({ req: { headers: {}, socket: { remoteAddress: "10.77.0.1" } } } as any);
    for (let index = 0; index < 5; index += 1) await fixed.submit(review({ email: `unique${index}@example.com`, reviewText: `Avis distinct numéro ${index} détaillé.` }));
    await expect(fixed.submit(review({ email: "unique9@example.com", reviewText: "Un de plus, toujours détaillé." }))).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });
});
