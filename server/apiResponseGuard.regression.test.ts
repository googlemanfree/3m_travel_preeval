import { describe, expect, it } from "vitest";
import { normalizeApiResponse } from "../client/src/lib/apiResponseGuard";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("garde-fou des réponses API", () => {
  it("convertit un document HTML inattendu en erreur JSON structurée", async () => {
    const response = await normalizeApiResponse(new Response("<!doctype html><html><body>fallback</body></html>", {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    }));

    expect(response.status).toBe(502);
    expect(response.headers.get("content-type")).toContain("application/json");
    const payload = await response.json();
    expect(payload[0].error.json.message).toContain("réponse API");
  });

  it("ré-encapsule une réponse JSON brute dans une enveloppe tRPC", async () => {
    const response = await normalizeApiResponse(new Response('{"candidate":{"id":7}}', {
      status: 200,
      headers: { "content-type": "application/json" },
    }));
    expect(await response.json()).toEqual([{ result: { data: { json: { candidate: { id: 7 } } } } }]);
  });

  it("ré-encapsule aussi un JSON brut servi avec un Content-Type texte", async () => {
    const response = await normalizeApiResponse(new Response('{"candidate":{"id":7}}', {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    }));
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toEqual([{ result: { data: { json: { candidate: { id: 7 } } } } }]);
  });

  it("ré-encapsule un JSON brut sans Content-Type", async () => {
    const response = await normalizeApiResponse(new Response('{"candidate":{"id":7}}', { status: 200 }));
    expect(await response.json()).toEqual([{ result: { data: { json: { candidate: { id: 7 } } } } }]);
  });

  it("laisse passer une réponse JSON valide sans la modifier", async () => {
    const response = new Response('{"result":{"data":null}}', {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    expect(await normalizeApiResponse(response)).toBe(response);
  });

  it("prévoit une récupération unique quand le client reçoit une réponse tRPC obsolète", () => {
    const main = readFileSync(resolve(process.cwd(), "client/src/main.tsx"), "utf8");
    expect(main).toContain('3m_api_transform_error_reload_attempted');
    expect(main).toContain('recoverFromApiTransformError();');
    expect(main).toContain('clearStaleClientCaches().finally(() => window.location.reload())');
  });
});
