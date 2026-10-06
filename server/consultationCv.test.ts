import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  inserts: [] as any[],
  emails: [] as any[],
  fetched: [] as string[],
  signedKeys: [] as string[],
}));

vi.mock("./db", () => ({
  getDb: async () => ({
    insert: () => ({ values: (values: any) => { state.inserts.push(values); return { $returningId: async () => [{ id: 7 }] }; } }),
    update: () => ({ set: () => ({ where: async () => undefined }) }),
  }),
}));
vi.mock("./_core/email", () => ({ sendEmail: async (message: any) => { state.emails.push(message); } }));
vi.mock("./routers/adminAuth", () => ({ requireValidAdminSession: async () => ({ email: "agent@3mtravelagency.com" }) }));
vi.mock("./routers/candidate", async () => {
  const { publicProcedure } = await import("./_core/trpc");
  return { candidateProcedure: publicProcedure };
});
vi.mock("./storage", () => ({ storageGetSignedUrl: async (key: string) => { state.signedKeys.push(key); return `https://cdn.example.com/signed/${key}?sig=1`; } }));
vi.mock("./aiEvaluationService", () => ({ extractTextFromPDF: async () => "texte du CV", generateAIEvaluationReport: async () => "rapport" }));

import { consultationRequestRouter } from "./routers/consultationRequest";

const caller = () => consultationRequestRouter.createCaller({ req: { headers: {} } } as any);
const base = { fullName: "Aïcha Nkolo", email: "aicha@example.com" };
/** Ce que /api/candidate/upload-public renvoie réellement dans `fileUrl` (storagePut). */
const REAL_UPLOAD_URL = "/manus-storage/applications/intake/cv/1760000000000-abcdef0123456789abcdef01-cv-aicha.pdf";

beforeEach(() => {
  state.inserts = [];
  state.emails = [];
  state.fetched = [];
  state.signedKeys = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string) => { state.fetched.push(String(url)); return { ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(8) } as any; }));
});
afterEach(() => vi.unstubAllGlobals());

describe("demande de consultation avec CV", () => {
  it("accepte l'adresse réellement renvoyée par le dépôt (avant : « .url() » refusait toute demande avec CV)", async () => {
    const result = await caller().submit({ ...base, cvFileUrl: REAL_UPLOAD_URL, cvFileName: "cv-aicha.pdf", cvAnalysisConsent: true });
    expect(result.success).toBe(true);
    expect(state.inserts[0]).toMatchObject({ cvFileUrl: REAL_UPLOAD_URL, cvFileName: "cv-aicha.pdf", status: "pending_ai" });
  });

  it("lit le CV via un lien signé de NOTRE stockage, jamais l'adresse brute", async () => {
    await caller().submit({ ...base, cvFileUrl: REAL_UPLOAD_URL, cvAnalysisConsent: true });
    await vi.waitFor(() => expect(state.fetched.length).toBe(1));
    expect(state.signedKeys).toEqual(["applications/intake/cv/1760000000000-abcdef0123456789abcdef01-cv-aicha.pdf"]);
    expect(state.fetched[0]).toBe("https://cdn.example.com/signed/applications/intake/cv/1760000000000-abcdef0123456789abcdef01-cv-aicha.pdf?sig=1");
  });

  it("sans accord distinct : le CV est enregistré pour un conseiller mais RIEN n'est envoyé à l'outil d'analyse", async () => {
    const result = await caller().submit({ ...base, cvFileUrl: REAL_UPLOAD_URL, cvFileName: "cv-aicha.pdf" });
    expect(result.success).toBe(true);
    expect(state.inserts[0]).toMatchObject({ cvFileUrl: REAL_UPLOAD_URL, status: "pending_review" });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(state.signedKeys).toHaveLength(0);
    expect(state.fetched).toHaveLength(0);
    expect(state.emails[0]?.html ?? "").toContain("n'a pas autorisé l'analyse automatique");
  });

  it("avec l'accord : la demande attend l'analyse (« pending_ai ») et le CV est lu", async () => {
    await caller().submit({ ...base, cvFileUrl: REAL_UPLOAD_URL, cvAnalysisConsent: true });
    expect(state.inserts[0].status).toBe("pending_ai");
  });

  it("refuse toute adresse libre : externe, interne, ou remontée de dossier (le serveur n'ira jamais la télécharger)", async () => {
    for (const cvFileUrl of ["https://evil.example.com/cv.pdf", "http://169.254.169.254/latest/meta-data", "/etc/passwd", "/manus-storage/../secret.pdf", "javascript:alert(1)"]) {
      await expect(caller().submit({ ...base, cvFileUrl }), cvFileUrl).rejects.toThrow(/CV invalide/);
    }
    expect(state.inserts).toHaveLength(0);
    expect(state.fetched).toHaveLength(0);
  });

  it("sans CV : la demande part comme avant, sans lecture ni analyse", async () => {
    const result = await caller().submit(base);
    expect(result.success).toBe(true);
    expect(state.inserts[0].status).toBe("pending_review");
    expect(state.fetched).toHaveLength(0);
  });
});
