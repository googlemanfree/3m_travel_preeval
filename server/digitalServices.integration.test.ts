import { beforeEach, describe, expect, it, vi } from "vitest";

const inserted: unknown[] = [];
const updates: unknown[] = [];
const requestRow = {
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
  update: vi.fn(() => ({ set: vi.fn((value: unknown) => { updates.push(value); return { where: vi.fn(async () => undefined) }; }) })),
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
  });
});
