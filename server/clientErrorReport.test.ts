import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleClientErrorReport, resetClientErrorLimiters, sanitizeClientErrorReport, scrubPath, scrubText } from "./_core/clientErrorReport";

const valid = {
  reference: "ERR-7K2M9Q",
  kind: "render",
  message: "Cannot read properties of undefined (reading 'map')",
  stack: "TypeError: x\n    at Foo (https://www.3mtravelagency.com/assets/index-abc.js:1:2)",
  componentStack: "\n    at Foo\n    at Bar",
  path: "/admin?token=SECRET#frag",
  userAgent: "Mozilla/5.0",
  build: "abcd1234",
};

function fakeResponse() {
  const res: any = { statusCode: 0, body: undefined as unknown };
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (body: unknown) => { res.body = body; return res; };
  res.end = () => res;
  return res;
}

function fakeRequest(body: unknown, ip = "1.2.3.4", length = 200) {
  return { body, headers: { "x-forwarded-for": ip, "content-length": String(length) }, socket: {} } as any;
}

beforeEach(() => {
  resetClientErrorLimiters();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("rapport d'erreur d'écran : nettoyage", () => {
  it("retire requête et fragment du chemin (un jeton peut y figurer)", () => {
    expect(scrubPath("/admin?token=SECRET#frag")).toBe("/admin");
    expect(scrubPath("https://www.3mtravelagency.com/verify-email-link?token=abc")).toBe("/verify-email-link");
    expect(scrubPath(42)).toBe("");
  });

  it("masque e-mails, jetons dans une URL, identifiants longs et JWT", () => {
    const text = scrubText("jean@gmail.com https://x/verify?token=AbC123&a=1 id=0123456789abcdef0123456789abcdef eyJhbGciOiJI.eyJzdWIiOiIx.c2lnbmF0dXJl", 500);
    expect(text).not.toContain("jean@gmail.com");
    expect(text).toContain("[email]");
    expect(text).not.toContain("AbC123");
    expect(text).not.toContain("0123456789abcdef0123456789abcdef");
    expect(text).toContain("[jeton]");
  });

  it("garde uniquement la liste blanche, tronquée", () => {
    const report = sanitizeClientErrorReport({ ...valid, message: "m".repeat(2000), extra: "ne-doit-pas-passer", password: "x" })!;
    expect(report.message).toHaveLength(300);
    expect(Object.keys(report).sort()).toEqual(["build", "componentStack", "kind", "message", "path", "reference", "stack", "userAgent"]);
    expect(report.path).toBe("/admin");
  });

  it("refuse une référence mal formée ou un message vide", () => {
    expect(sanitizeClientErrorReport({ ...valid, reference: "pirate" })).toBeNull();
    expect(sanitizeClientErrorReport({ ...valid, message: "" })).toBeNull();
    expect(sanitizeClientErrorReport(null)).toBeNull();
    expect(sanitizeClientErrorReport("texte")).toBeNull();
  });

  it("un type inconnu devient « other »", () => {
    expect(sanitizeClientErrorReport({ ...valid, kind: "n'importe quoi" })!.kind).toBe("other");
  });
});

describe("POST /api/client-error", () => {
  it("accepte un rapport valide (204) et journalise sans donnée personnelle", () => {
    const res = fakeResponse();
    handleClientErrorReport(fakeRequest({ ...valid, message: "boom jean@gmail.com" }), res);
    expect(res.statusCode).toBe(204);
    const line = String((console.error as any).mock.calls[0][0]);
    expect(line).toContain("ERR-7K2M9Q");
    expect(line).toContain("/admin");
    expect(line).not.toContain("SECRET");
    expect(line).not.toContain("jean@gmail.com");
  });

  it("répond 400 à un corps invalide et 413 à un corps trop gros", () => {
    const bad = fakeResponse();
    handleClientErrorReport(fakeRequest({ reference: "x" }), bad);
    expect(bad.statusCode).toBe(400);
    const big = fakeResponse();
    handleClientErrorReport(fakeRequest(valid, "1.2.3.4", 50_000), big);
    expect(big.statusCode).toBe(413);
  });

  it("plafonne par visiteur : au-delà de 8 rapports en 10 minutes, rien n'est plus journalisé", () => {
    for (let index = 0; index < 8; index += 1) handleClientErrorReport(fakeRequest(valid, "9.9.9.9"), fakeResponse());
    expect((console.error as any).mock.calls).toHaveLength(8);
    const res = fakeResponse();
    handleClientErrorReport(fakeRequest(valid, "9.9.9.9"), res);
    expect(res.statusCode).toBe(204);
    expect((console.error as any).mock.calls).toHaveLength(8);
    handleClientErrorReport(fakeRequest(valid, "8.8.8.8"), fakeResponse());
    expect((console.error as any).mock.calls).toHaveLength(9);
  });
});
