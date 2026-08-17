import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("catalogue e‑Visa administrable", () => {
  it("protège les mutations avec une session administrateur et conserve un audit", () => {
    const source = readFileSync(resolve(process.cwd(), "server/routers/evisaCatalogueRouter.ts"), "utf8");
    expect(source).toContain("requireValidAdminSession(input.sessionToken)");
    expect(source).toContain("evisaCatalogueAuditLogs");
    expect(source).toContain("confirmation: z.literal(\"SUPPRIMER\")");
    expect(source).toContain("officialPortalUrl");
    expect(source).toContain("startsWith(\"https://\")");
  });
});
