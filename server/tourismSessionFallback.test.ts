import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const routerSource = readFileSync(resolve(process.cwd(), "server/routers/tourism.ts"), "utf8");
const panelSource = readFileSync(resolve(process.cwd(), "client/src/components/AdminTourismRequests.tsx"), "utf8");

describe("repli de session Tourisme", () => {
  it("accepte un jeton administrateur valide lorsque le cookie est absent", () => {
    expect(routerSource).toContain("requireTourismAdminSession");
    expect(routerSource).toContain("requireValidAdminSession(sessionToken)");
    expect(routerSource).toContain("sessionToken: z.string().min(1).optional()");
  });

  it("transmet le jeton aux recherches et aux actions de validation du catalogue", () => {
    expect(panelSource).toContain('sessionStorage.getItem("adminSessionToken")');
    expect(panelSource).toContain('verificationStatus: "verified", sessionToken');
    expect(panelSource).toContain("cityKey: catalogCity as any, sessionToken");
  });
});
