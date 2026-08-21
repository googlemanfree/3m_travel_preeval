import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const componentSource = readFileSync(
  resolve(process.cwd(), "client/src/components/AdminEmailDeliveryManagement.tsx"),
  "utf8",
);

describe("suivi e-mail administrateur", () => {
  it("réutilise le jeton de session de la connexion administrateur avant tout ancien stockage local", () => {
    expect(componentSource).toContain('sessionStorage.getItem("adminSessionToken") || localStorage.getItem("adminSessionToken")');
    expect(componentSource).toContain("enabled: !!sessionToken");
  });
});
