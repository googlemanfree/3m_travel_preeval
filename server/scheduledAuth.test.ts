import express from "express";
import { createServer } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { requireCronSecret } from "./_core/scheduledAuth";

let server: ReturnType<typeof createServer>;
let endpoint = "";

beforeAll(async () => {
  const app = express();
  app.post("/api/scheduled/test-auth", (req, res) => {
    if (!requireCronSecret(req, res)) return;
    res.status(200).json({ ok: true });
  });
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Port de test indisponible");
  endpoint = `http://127.0.0.1:${address.port}/api/scheduled/test-auth`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

describe("endpoints planifiés protégés", () => {
  it("refuse un appel sans secret", async () => {
    const response = await fetch(endpoint, { method: "POST" });
    expect(response.status).toBe(401);
  });

  it("accepte l’appel authentifié par CRON_SECRET", async () => {
    const secret = process.env.CRON_SECRET;
    expect(secret).toBeTruthy();
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
