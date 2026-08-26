import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");

function readProjectFile(relativePath: string) {
  return readFileSync(resolve(projectRoot, relativePath), "utf8");
}

describe("floating widgets and responsive header contracts", () => {
  it("persists a user-controlled widget visibility preference and gates the global widgets", () => {
    const context = readProjectFile("client/src/contexts/FloatingWidgetsPreferencesContext.tsx");
    const app = readProjectFile("client/src/App.tsx");
    const accessibility = readProjectFile("client/src/pages/Accessibility.tsx");

    expect(context).toContain('"3m-floating-widgets-visible"');
    expect(context).toContain("localStorage");
    expect(app).toContain("widgetsVisible && location !== \"/contact\"");
    expect(accessibility).toContain('aria-pressed={widgetsVisible}');
  });

  it("keeps tablet motion and keyboard feedback guarded by reduced-motion", () => {
    const css = readProjectFile("client/src/index.css");
    expect(css).toContain(".tablet-compact-header");
    expect(css).toContain(".glass-nav a:focus-visible");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(".glass-nav button:active");
  });
});
