import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("candidate evaluation registration gate", () => {
  it("does not expose the embedded evaluation form before account access", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "client/src/components/SimpleMultiProjectForm.tsx"
      ),
      "utf8"
    );
    expect(source).toContain('data-testid="evaluation-registration-gate"');
    expect(source).toContain("Créez votre compte avant de commencer");
    expect(source).toContain("href={`/register?from=${encodedReturnPath}`}");
    expect(source).toContain(
      "href={`/login?redirect=1&from=${encodedReturnPath}`}"
    );
  });

  it("does not offer a public bypass from the protected evaluation route", () => {
    const source = readFileSync(
      resolve(process.cwd(), "client/src/App.tsx"),
      "utf8"
    );
    expect(source).toContain(
      '<AuthGuard message="Vous devez créer un compte pour faire votre évaluation.">'
    );
    expect(source).not.toContain(
      'publicAlternative={{ label: "Pas encore de compte ? Faire l’évaluation gratuite rapide"'
    );
  });
});
