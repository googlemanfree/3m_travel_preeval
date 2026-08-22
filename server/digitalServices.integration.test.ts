import { beforeEach, describe, expect, it, vi } from "vitest";

const inserted: unknown[] = [];
const updates: unknown[] = [];
const requestRow: any = {
  id: 42,
  reference: "DGT-2026-123456",
  service: "web_platform" as const,
  fullName: "Client Digital",
  email: "client@example.test",
  phone: "+237690000000",
  organization: "Entreprise Test",
  message: "Nous souhaitons lancer une plateforme de réservation.",
  status: "new" as const,
  adminNotes: null,
  handledByAdminEmail: null,
  handledAt: null,
  createdAt: new Date("2026-08-22T10:00:00.000Z"),
  updatedAt: new Date("2026-08-22T10:00:00.000Z"),
};

const fakeDb = {
  insert: vi.fn(() => ({ values: vi.fn((value: unknown) => { inserted.push(value); return { onDuplicateKeyUpdate: vi.fn(async () => undefined), then: (resolve: (value: unknown) => unknown) => Promise.resolve(undefined).then(resolve) }; }) })),
  select: vi.fn(() => ({ from: vi.fn(() => ({ orderBy: vi.fn(async () => [requestRow]), where: vi.fn(() => ({ limit: vi.fn(async () => [requestRow]) })) })) })),
  update: vi.fn(() => ({ set: vi.fn((value: unknown) => { updates.push(value); Object.assign(requestRow, value); return { where: vi.fn(async () => undefined) }; }) })),
};

vi.mock("./db", () => ({ getDb: vi.fn(async () => fakeDb) }));
vi.mock("./routers/adminAuth", () => ({ requireValidAdminSession: vi.fn(async () => ({ email: "admin@3mtravelagency.com", fullName: "Admin 3M" })) }));

import { digitalServicesRouter } from "./routers/digitalServices";

const ctx = { req: { headers: {} }, res: {} } as any;

describe("cycle complet des demandes 3M Digital", () => {
  beforeEach(() => { inserted.length = 0; updates.length = 0; vi.clearAllMocks(); });

  it("crée une demande publique, la rend visible à l’administration puis permet son traitement humain", async () => {
    const caller = digitalServicesRouter.createCaller(ctx);
    const created = await caller.createRequest({ service: "web_platform", fullName: "Client Digital", email: "client@example.test", phone: "+237690000000", organization: "Entreprise Test", message: "Nous souhaitons lancer une plateforme de réservation." });
    expect(created.reference).toMatch(/^DGT-\d{4}-\d{6}$/);
    expect(inserted).toHaveLength(2);

    const listed = await caller.adminList({ sessionToken: "valid-admin-session" });
    expect(listed[0]?.reference).toBe(requestRow.reference);

    const outcome = await caller.updateRequest({ sessionToken: "valid-admin-session", requestId: requestRow.id, status: "contacted", adminNotes: "Appel de qualification prévu demain." });
    expect(outcome).toEqual({ success: true });
    expect(updates[0]).toMatchObject({ status: "contacted", adminNotes: "Appel de qualification prévu demain.", handledByAdminEmail: "admin@3mtravelagency.com" });
    expect((updates[0] as { handledAt?: unknown }).handledAt).toBeInstanceOf(Date);
    expect(requestRow).toMatchObject({ status: "contacted", adminNotes: "Appel de qualification prévu demain.", handledByAdminEmail: "admin@3mtravelagency.com" });
    expect(requestRow.handledAt).toBeInstanceOf(Date);
  });

  it("enregistre une grille de cadrage administrable sans créer de tarif contractuel", async () => {
    const caller = digitalServicesRouter.createCaller(ctx);
    const pricingJson = JSON.stringify([
      { title: "Vitrine évolutive", subtitle: "Demande et validation humaine.", launchRange: "3 600 000 – 14 500 000 XAF", annualRange: "1 150 000 – 7 200 000 XAF / an", delivery: "6 à 12 semaines", points: ["Formulaires", "Suivi"] },
      { title: "Plateforme transactionnelle", subtitle: "Services standardisés.", launchRange: "17 500 000 – 66 000 000 XAF", annualRange: "8 100 000 – 47 000 000 XAF / an", delivery: "4 à 9 mois", points: ["Catalogue", "Paiement"] },
    ]);
    const outcome = await caller.adminUpdateContent({
      sessionToken: "valid-admin-session",
      content: {
        heroTitle: "Le digital qui fait avancer vos projets.",
        heroDescription: "Une présentation structurée des services numériques 3M Digital.",
        serviceIntro: "Des expertises adaptées aux besoins numériques et opérationnels.",
        requestIntro: "Chaque demande est traitée par un conseiller avant toute proposition.",
        serviceDefinitionsJson: JSON.stringify([
          { title: "Web", description: "Sites", points: ["Conseil"] },
          { title: "Croissance", description: "Visibilité", points: ["Contenu"] },
          { title: "Support", description: "Fiabilité", points: ["Assistance"] },
          { title: "Formation", description: "Compétences", points: ["Ateliers"] },
        ]),
        pricingJson,
      },
    });
    expect(outcome).toEqual({ success: true });
    expect(inserted.at(-1)).toMatchObject({ pricingJson, updatedByAdminEmail: "admin@3mtravelagency.com" });
  });
});
