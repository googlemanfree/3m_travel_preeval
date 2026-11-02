import { describe, expect, it, vi } from "vitest";
import { createPublicHealthCheck, registerPublicHealthRoute, type PublicHealth } from "./publicHealth";

describe("contrôle public de disponibilité", () => {
  it("renvoie « ok » quand la base répond, et met le résultat en cache quelques secondes", async () => {
    const probe = vi.fn().mockResolvedValue(true);
    let clock = 1_000_000;
    const check = createPublicHealthCheck(probe, () => clock);
    const first = await check();
    expect(first).toEqual({ status: "ok", database: "ok", checkedAt: new Date(1_000_000).toISOString() });
    clock += 5_000;
    await check();
    expect(probe).toHaveBeenCalledTimes(1);
    clock += 20_000;
    await check();
    expect(probe).toHaveBeenCalledTimes(2);
  });

  it("renvoie « dégradé » quand la base ne répond pas, sans détail d'infrastructure", async () => {
    const check = createPublicHealthCheck(async () => false, () => 42);
    const result = await check();
    expect(result.status).toBe("degraded");
    expect(result.database).toBe("down");
    expect(Object.keys(result).sort()).toEqual(["checkedAt", "database", "status"]);
  });

  it("la route répond 200 ou 503 et n'est jamais mise en cache par le navigateur", async () => {
    const handlers: Record<string, (req: unknown, res: any) => Promise<void>> = {};
    const app = { get: (path: string, handler: (req: unknown, res: any) => Promise<void>) => { handlers[path] = handler; } };
    const run = async (health: PublicHealth) => {
      registerPublicHealthRoute(app as any, { check: async () => health });
      const headers: Record<string, string> = {};
      let statusCode = 0;
      let body: unknown;
      const res = {
        setHeader: (name: string, value: string) => { headers[name] = value; },
        status(code: number) { statusCode = code; return res; },
        json(payload: unknown) { body = payload; return res; },
      };
      await handlers["/api/public/health"]({}, res);
      return { headers, statusCode, body };
    };
    const ok = await run({ status: "ok", database: "ok", checkedAt: "2026-10-17T00:00:00.000Z" });
    expect(ok.statusCode).toBe(200);
    expect(ok.headers["Cache-Control"]).toBe("no-store");
    const down = await run({ status: "degraded", database: "down", checkedAt: "2026-10-17T00:00:00.000Z" });
    expect(down.statusCode).toBe(503);
  });
});
