import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  inserted: [] as Array<Record<string, unknown>>,
  notifications: [] as Array<Record<string, unknown>>,
  handlers: [] as Array<Function>,
}));

vi.mock("multer", () => ({
  default: Object.assign(() => ({ single: () => (_req: unknown, _res: unknown, next: () => void) => next() }), {
    memoryStorage: () => ({}),
  }),
}));
vi.mock("jsonwebtoken", () => ({ default: { verify: vi.fn(() => ({ sub: 42, type: "candidate" })) } }));
vi.mock("./storage", () => ({ storagePut: vi.fn(async () => ({ key: "candidates/42/cv/test-cv.pdf", url: "https://storage.example.test/test-cv.pdf" })) }));
vi.mock("./services/documentSubmissionNotification", () => ({ notifyDocumentSubmission: vi.fn(async (payload) => state.notifications.push(payload)) }));
vi.mock("./db", () => ({
  getDb: vi.fn(async () => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => [{ email: "candidate@example.test", dossierStatus: "evaluation" }]),
          orderBy: vi.fn(() => ({ limit: vi.fn(async () => []) })),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(async (value: Record<string, unknown>) => {
        state.inserted.push(value);
        return [{ insertId: 701 }];
      }),
    })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(async () => undefined) })) })),
  })),
}));

import { registerCandidateUploadRoute } from "./routers/candidateUpload";

describe("POST /api/candidate/upload — persistance centralisée", () => {
  beforeEach(() => {
    state.inserted.length = 0;
    state.notifications.length = 0;
    state.handlers.length = 0;
  });

  it("enregistre la pièce dans candidateFiles et alerte l’administration avant le succès navigateur", async () => {
    registerCandidateUploadRoute({ post: (_path: string, ...handlers: Function[]) => state.handlers.push(...handlers) } as any);
    const handler = state.handlers.at(-1)!;
    const response = { status: vi.fn(() => response), json: vi.fn() };
    await handler({
      headers: { authorization: "Bearer test-token" },
      body: { fileType: "cv" },
      file: { buffer: Buffer.from("%PDF-1.7\nminimal"), mimetype: "application/pdf", originalname: "cv.pdf", size: 16 },
    }, response);

    expect(state.inserted[0]).toMatchObject({ candidateId: 42, fileType: "cv", fileName: "cv.pdf", status: "uploaded" });
    expect(state.notifications[0]).toMatchObject({ candidateEmail: "candidate@example.test", documentType: "cv" });
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ documentId: 701, synchronized: true }));
  });
});
