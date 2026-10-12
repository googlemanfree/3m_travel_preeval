import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("FloatingServices — boutons accessibles", () => {
  it("ne contient plus de path # et pointe vers des routes réelles", () => {
    const source = readFileSync(
      path.resolve(import.meta.dirname, "../client/src/components/FloatingServices.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(/path:\s*"#"/);
    expect(source).toContain('path: "/assurance"');
    expect(source).toContain('path: "/traduction/order"');
    expect(source).toContain('path: "/3m-solutions"');
    expect(source).toContain('path: "/flights"');
  });
});
