import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const componentSource = readFileSync(
  resolve(process.cwd(), "client/src/components/AdminEmailDeliveryManagement.tsx"),
  "utf8",
);
const helperSource = readFileSync(
  resolve(process.cwd(), "client/src/lib/adminSession.ts"),
  "utf8",
);

describe("suivi e-mail administrateur", () => {
  it("réutilise le jeton admin dual-read (localStorage puis sessionStorage, comme AdminGuard)", () => {
    expect(componentSource).toContain("getAdminSessionToken");
    expect(componentSource).toContain("enabled: !!sessionToken");
    expect(helperSource).toContain('localStorage.getItem("adminSessionToken") || sessionStorage.getItem("adminSessionToken")');
  });
});
