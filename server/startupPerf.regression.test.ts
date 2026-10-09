import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

describe("démarrage plus léger", () => {
  it("ne charge plus les widgets flottants dans le bundle initial", () => {
    const app = read("client/src/App.tsx");
    expect(app).not.toMatch(/import\s+\{\s*FloatingActionMenu\s*\}\s+from/);
    expect(app).not.toMatch(/import\s+AiCopilotWidgetEnhanced\s+from/);
    expect(app).not.toMatch(/import\s+\{\s*SmartFlightAssistant\s*\}\s+from/);
    expect(app).toContain("lazyWithTimeout(() =>");
    expect(app).toContain("floatingToolsReady");
    expect(app).toContain("requestIdleCallback");
  });

  it("calme le QueryClient et le prefetch de navigation", () => {
    expect(read("client/src/main.tsx")).toContain("staleTime: 60_000");
    expect(read("client/src/main.tsx")).toContain("refetchOnWindowFocus: false");
    expect(read("client/src/lib/navigationCache.ts")).toContain("saveData");
    expect(read("client/src/lib/navigationCache.ts")).toContain("requestIdleCallback");
  });

  it("réduit le polling espace client / messages", () => {
    expect(read("client/src/lib/clientSpaceSync.ts")).toContain("45_000");
    expect(read("client/src/components/ClientMessagesPanel.tsx")).toContain("refetchInterval: 45_000");
    expect(read("client/src/components/ClientMessagesPanel.tsx")).toContain("refetchIntervalInBackground: false");
  });

  it("garde un seul lien B2B dans la navbar (hub)", () => {
    const navbar = read("client/src/components/Navbar.tsx");
    expect(navbar).toContain('/partenaires');
    expect(navbar).not.toContain('href: "/agences-placement"');
    expect(navbar).not.toContain('href: "/employeurs"');
  });
});
