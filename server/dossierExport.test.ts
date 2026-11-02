import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  rows: new Map<unknown, any[]>(),
  audits: [] as any[],
  admin: { id: 1, email: "agent@3mtravelagency.com" } as any,
  authFails: false,
}));

vi.mock("./db", () => ({
  getDb: async () => {
    const chain = (rows: any[]) => {
      const c: any = { where: () => c, limit: () => c, orderBy: () => c, then: (resolve: (value: any[]) => unknown) => resolve(rows) };
      return c;
    };
    return { select: () => ({ from: (table: unknown) => chain(state.rows.get(table) ?? []) }) };
  },
}));
vi.mock("./routers/adminAuth", () => ({
  requireValidAdminSession: async (token: string) => {
    const { TRPCError } = await import("@trpc/server");
    if (state.authFails || token === "bad-token-123456") throw new TRPCError({ code: "UNAUTHORIZED", message: "Session invalide" });
    return state.admin;
  },
}));
vi.mock("./services/adminAudit", () => ({
  recordAdminAudit: async (event: any) => { state.audits.push(event); },
  getRequestIp: () => "10.0.0.1",
}));

import { candidateFiles, candidates } from "../drizzle/schema";
import { buildZip, crc32, safeZipName, uniqueZipNames } from "./services/zipStore";
import { buildDossierExport, exportEntryName } from "./services/dossierExport";
import { bearerToken, registerAdminDossierExportRoute } from "./routers/adminDossierExport";

/** Lecteur ZIP minimal (méthode « store ») pour vérifier l'archive produite. */
function readZip(buffer: Buffer) {
  const endOffset = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  expect(endOffset).toBeGreaterThan(-1);
  const count = buffer.readUInt16LE(endOffset + 10);
  let centralOffset = buffer.readUInt32LE(endOffset + 16);
  const files: Array<{ name: string; data: Buffer; crcOk: boolean }> = [];
  for (let i = 0; i < count; i += 1) {
    expect(buffer.readUInt32LE(centralOffset)).toBe(0x02014b50);
    const crc = buffer.readUInt32LE(centralOffset + 16);
    const size = buffer.readUInt32LE(centralOffset + 20);
    const nameLength = buffer.readUInt16LE(centralOffset + 28);
    const localOffset = buffer.readUInt32LE(centralOffset + 42);
    const name = buffer.subarray(centralOffset + 46, centralOffset + 46 + nameLength).toString("utf8");
    expect(buffer.readUInt32LE(localOffset)).toBe(0x04034b50);
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const dataStart = localOffset + 30 + localNameLength;
    const data = buffer.subarray(dataStart, dataStart + size);
    files.push({ name, data: Buffer.from(data), crcOk: crc32(data) === crc });
    centralOffset += 46 + nameLength;
  }
  return files;
}

describe("archive ZIP", () => {
  it("CRC32 : valeur de référence connue", () => {
    expect(crc32(Buffer.from("123456789"))).toBe(0xcbf43926);
  });

  it("produit une archive relisible, noms accentués inclus, contenu et CRC intacts", () => {
    const zip = buildZip([
      { name: "Passeport_validée.pdf", data: Buffer.from("%PDF-1.4 contenu") },
      { name: "vide.txt", data: Buffer.alloc(0) },
      { name: "LISEZ-MOI.txt", data: Buffer.from("bonjour é", "utf8") },
    ]);
    const files = readZip(zip);
    expect(files.map((file) => file.name)).toEqual(["Passeport_validée.pdf", "vide.txt", "LISEZ-MOI.txt"]);
    expect(files.every((file) => file.crcOk)).toBe(true);
    expect(files[0].data.toString()).toBe("%PDF-1.4 contenu");
    expect(files[2].data.toString("utf8")).toBe("bonjour é");
  });

  it("noms sûrs : pas de chemin absolu ni de remontée de dossier ; doublons numérotés", () => {
    expect(safeZipName("../../etc/passwd")).toBe("etc/passwd");
    expect(safeZipName("C:\\Users\\x\\a.pdf")).toBe("C:/Users/x/a.pdf");
    expect(safeZipName("..")).toBe("fichier");
    expect(uniqueZipNames(["a.pdf", "A.pdf", "a.pdf", "b"])).toEqual(["a.pdf", "A (2).pdf", "a (3).pdf", "b"]);
  });
});

describe("export des pièces d'un dossier", () => {
  const file = (id: number, fileType: string, fileName: string, status: string, fileKey = `candidates/5/${fileType}/${id}.pdf`) => ({ id, fileType, fileName, fileUrl: `/manus-storage/${fileKey}`, fileKey, status, rejectionReason: status === "rejected" ? "Document illisible : rescannez." : null, uploadedAt: new Date("2026-10-10T10:00:00Z") });
  const ok = (text: string) => ({ ok: true, status: 200, arrayBuffer: async () => Buffer.from(text) });

  beforeEach(() => {
    state.rows = new Map();
    state.audits = [];
    state.authFails = false;
    state.rows.set(candidates, [{ id: 5, fullName: "Aïcha Nkolo", activeDossierNumber: "3M-2026-0012" }]);
  });

  it("nomme les pièces par catégorie et statut, exclut les rejetées par défaut et les liste dans LISEZ-MOI", async () => {
    state.rows.set(candidateFiles, [file(1, "passeport", "passeport.pdf", "verified"), file(2, "diplome", "diplôme.pdf", "uploaded"), file(3, "cv", "cv.pdf", "rejected")]);
    const result = await buildDossierExport({ candidateId: 5 }, { resolveUrl: async (value) => `https://storage.test/${value}`, fetcher: async (url) => ok(`contenu:${url.split("/").pop()}`) });
    expect(result?.included).toBe(2);
    expect(result?.skipped).toEqual([{ fileName: "cv.pdf", reason: "pièce rejetée (non incluse par défaut)" }]);
    expect(result?.fileName).toBe("Dossier_3M-2026-0012_pieces.zip");
    const files = readZip(result!.zip);
    expect(files.map((item) => item.name)).toEqual(["LISEZ-MOI.txt", "Passeport_validee_passeport.pdf", "Diplome_a_verifier_diplome.pdf"]);
    expect(files.every((item) => item.crcOk)).toBe(true);
    const readme = files[0].data.toString("utf8");
    expect(readme).toContain("Aïcha Nkolo");
    expect(readme).toContain("3M-2026-0012");
    expect(readme).toContain("cv.pdf : pièce rejetée");
  });

  it("includeRejected inclut les pièces rejetées avec leur motif", async () => {
    state.rows.set(candidateFiles, [file(3, "cv", "cv.pdf", "rejected")]);
    const result = await buildDossierExport({ candidateId: 5, includeRejected: true }, { resolveUrl: async (value) => `https://storage.test/${value}`, fetcher: async () => ok("x") });
    expect(result?.included).toBe(1);
    expect(readZip(result!.zip)[0].data.toString("utf8")).toContain("motif : Document illisible");
  });

  it("une pièce illisible côté stockage ou trop grosse est listée comme non incluse, sans faire échouer l'export", async () => {
    state.rows.set(candidateFiles, [file(1, "passeport", "a.pdf", "verified"), file(2, "cv", "b.pdf", "verified"), file(3, "diplome", "c.pdf", "verified")]);
    const result = await buildDossierExport({ candidateId: 5 }, {
      resolveUrl: async (value) => (value.includes("/cv/") ? "/relatif/non-recuperable" : `https://storage.test/${value}`),
      fetcher: async (url) => (url.includes("/diplome/") ? { ok: false, status: 503, arrayBuffer: async () => Buffer.alloc(0) } : ok("x")),
    });
    expect(result?.included).toBe(1);
    expect(result?.skipped.map((item) => item.reason)).toEqual(["fichier non récupérable depuis le stockage", "stockage indisponible (503)"]);
  });

  it("candidat inconnu : null", async () => {
    state.rows.set(candidates, []);
    expect(await buildDossierExport({ candidateId: 99 }, { fetcher: async () => ok("x") })).toBeNull();
  });

  it("exportEntryName : catégorie lisible, statut, nom d'origine assaini", () => {
    expect(exportEntryName({ fileType: "extrait_naissance", fileName: "Acte / naissance.pdf", status: "verified" })).toBe("Acte_de_naissance_validee_Acte_naissance.pdf");
  });
});

describe("route POST /api/admin/dossier-export", () => {
  type Handler = (req: any, res: any) => Promise<void>;
  const setup = (build?: any) => {
    let handler: Handler | null = null;
    registerAdminDossierExportRoute({ post: (_path: string, fn: Handler) => { handler = fn; } } as any, build ? { build } : {});
    const call = async (req: any) => {
      const res: any = { statusCode: 200, headers: {} as Record<string, string>, body: undefined as unknown, setHeader(k: string, v: string) { this.headers[k] = v; }, status(code: number) { this.statusCode = code; return this; }, json(body: unknown) { this.body = body; return this; }, send(body: unknown) { this.body = body; return this; } };
      await handler!(req, res);
      return res;
    };
    return call;
  };
  const token = "good-token-123456";
  const request = (body: any, auth: string | null = `Bearer ${token}`) => ({ headers: auth ? { authorization: auth } : {}, body, socket: {} });

  beforeEach(() => { state.audits = []; state.authFails = false; });

  it("extrait le jeton Bearer, refuse tout le reste", () => {
    expect(bearerToken({ headers: { authorization: "Bearer abcdefghijkl" } })).toBe("abcdefghijkl");
    expect(bearerToken({ headers: { authorization: "Basic abcdefghijkl" } })).toBe("");
    expect(bearerToken({ headers: {} })).toBe("");
  });

  it("sans session administrateur valide : 401, rien n'est construit ni journalisé", async () => {
    const build = vi.fn();
    const call = setup(build);
    expect((await call(request({ candidateId: 5 }, null))).statusCode).toBe(401);
    expect((await call(request({ candidateId: 5 }, "Bearer bad-token-123456"))).statusCode).toBe(401);
    expect(build).not.toHaveBeenCalled();
    expect(state.audits).toEqual([]);
  });

  it("candidat invalide : 400", async () => {
    const call = setup(vi.fn());
    expect((await call(request({ candidateId: "abc" }))).statusCode).toBe(400);
    expect((await call(request({}))).statusCode).toBe(400);
  });

  it("export réussi : ZIP en pièce jointe, jamais mis en cache, et inscrit dans le journal d'audit", async () => {
    const zip = buildZip([{ name: "a.txt", data: Buffer.from("x") }]);
    const call = setup(vi.fn(async () => ({ zip, fileName: "Dossier_3M_pieces.zip", included: 1, skipped: [{ fileName: "b.pdf", reason: "x" }] })));
    const res = await call(request({ candidateId: 5 }));
    expect(res.statusCode).toBe(200);
    expect(res.headers["Content-Type"]).toBe("application/zip");
    expect(res.headers["Content-Disposition"]).toContain('attachment; filename="Dossier_3M_pieces.zip"');
    expect(res.headers["Cache-Control"]).toBe("no-store");
    expect(res.headers["X-Export-Skipped"]).toBe("1");
    expect(state.audits).toHaveLength(1);
    expect(state.audits[0]).toMatchObject({ action: "dossier_export", category: "access", resourceType: "candidate", resourceId: "5", adminEmail: "agent@3mtravelagency.com" });
    expect(state.audits[0].details).toEqual({ included: 1, skipped: 1, includeRejected: false });
  });

  it("candidat introuvable : 404 sans journal ; erreur interne : 500 sans fuite de détail", async () => {
    expect((await setup(vi.fn(async () => null))(request({ candidateId: 77 }))).statusCode).toBe(404);
    const res = await setup(vi.fn(async () => { throw new Error("clé secrète du stockage"); }))(request({ candidateId: 5 }));
    expect(res.statusCode).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain("secrète");
    expect(state.audits).toEqual([]);
  });

  it("limite de débit : le 7e export en 10 minutes est refusé (429)", async () => {
    state.admin = { id: 2, email: "limite@3mtravelagency.com" };
    const zip = buildZip([{ name: "a.txt", data: Buffer.from("x") }]);
    const call = setup(vi.fn(async () => ({ zip, fileName: "d.zip", included: 1, skipped: [] })));
    const statuses: number[] = [];
    for (let i = 0; i < 7; i += 1) statuses.push((await call(request({ candidateId: 5 }))).statusCode);
    expect(statuses.slice(0, 6).every((code) => code === 200)).toBe(true);
    expect(statuses[6]).toBe(429);
  });
});

describe("bouton d'export (écran des pièces)", () => {
  it("n'apparaît que si l'identifiant du compte candidat est connu, et envoie le jeton administrateur en Bearer", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const crm = readFileSync(resolve(import.meta.dirname, "..", "client/src/components/CandidateDocumentsCrm.tsx"), "utf8").replace(/\r/g, "");
    expect(crm).toContain('data-testid="documents-export-zip"');
    expect(crm).toContain("bilanContext?.exportCandidateId ? (");
    expect(crm).toContain('fetch("/api/admin/dossier-export"');
    expect(crm).toContain("Authorization: `Bearer ${sessionToken}`");
    const workspace = readFileSync(resolve(import.meta.dirname, "..", "client/src/components/Candidate360Workspace.tsx"), "utf8").replace(/\r/g, "");
    expect(workspace).toContain("exportCandidateId: summaryCandidateId > 0 ? summaryCandidateId : undefined");
  });
});
