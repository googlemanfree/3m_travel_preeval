import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const guardSource = readFileSync(
  resolve(import.meta.dirname, "../client/src/components/AdminGuard.tsx"),
  "utf8",
);

describe("garde administrateur", () => {
  it("bascule vers la page d’accès refusé si une vérification de session reste bloquée", () => {
    expect(guardSource).toContain("const [queryTimedOut, setQueryTimedOut] = useState(false)");
    expect(guardSource).toContain("window.setTimeout(() => setQueryTimedOut(true), 5_000)");
    expect(guardSource).toContain("const isChecking = adminSession.isLoading && !queryTimedOut");
    expect(guardSource).toContain("Se connecter en tant qu'Admin");
  });
});
