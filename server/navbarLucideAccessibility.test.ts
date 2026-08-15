import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.join(process.cwd(), "client/src/components/Navbar.tsx"),
  "utf8",
);

describe("Navbar avec icônes Lucide", () => {
  it("utilise des composants Lucide plutôt que des emojis pour les destinations", () => {
    expect(source).toContain('from "lucide-react"');
    expect(source).toContain("icon: Home");
    expect(source).toContain("icon: Plane");
    expect(source).toContain("icon: FileText");
    expect(source).not.toContain('icon: "🏠"');
    expect(source).not.toContain('icon: "✈️"');
  });

  it("préserve les contrôles tactiles et les libellés accessibles", () => {
    expect(source).toContain("min-h-11");
    expect(source).toContain("touch-target");
    expect(source).toContain('aria-label="Navigation principale"');
    expect(source).toContain('aria-label="Navigation mobile"');
  });
});
