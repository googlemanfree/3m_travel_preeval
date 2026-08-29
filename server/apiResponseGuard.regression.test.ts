import { describe, expect, it } from "vitest";
import { normalizeApiResponse } from "../client/src/lib/apiResponseGuard";

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

  it("laisse passer une réponse JSON valide sans la modifier", async () => {
    const response = new Response('{"result":{"data":null}}', {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    expect(await normalizeApiResponse(response)).toBe(response);
  });
});
