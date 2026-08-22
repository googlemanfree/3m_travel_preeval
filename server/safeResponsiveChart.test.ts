import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");

describe("SafeResponsiveChart", () => {
  it("ne monte un graphique qu’après la mesure d’un conteneur visible", () => {
    const source = fs.readFileSync(
      path.join(projectRoot, "client/src/components/SafeResponsiveChart.tsx"),
      "utf8",
    );

    expect(source).toContain("new ResizeObserver(measure)");
    expect(source).toContain("width > 8 && height > 8");
    expect(source).toContain("{isMeasurable ? children");
  });

  it("protège les graphiques Recharts existants par le conteneur mesuré", () => {
    const chartFiles = [
      "client/src/components/AdminDashboardAdvanced.tsx",
      "client/src/components/AdminDestinationAnalytics.tsx",
      "client/src/components/CanadaScoreSimulator.tsx",
    ];

    for (const relativePath of chartFiles) {
      const source = fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
      expect(source).toContain("SafeResponsiveChart");
      expect(source).toContain("<ResponsiveContainer width=\"100%\" height=\"100%\">");
    }
  });

  it("protège aussi le graphique de fidélité lorsqu’il est affiché dans un panneau masqué", () => {
    const source = fs.readFileSync(
      path.join(projectRoot, "client/src/components/ClientSpaceNavigation.tsx"),
      "utf8",
    );

    expect(source).toContain("SafeResponsiveChart");
    expect(source).toContain('label="Évolution des points de fidélité"');
  });

  it("centralise la bascule des anciens liens WhatsApp vers le bureau d’Ottawa", () => {
    const source = fs.readFileSync(
      path.join(projectRoot, "client/src/components/OttawaWhatsAppPriority.tsx"),
      "utf8",
    );

    expect(source).toContain('OTTAWA_WHATSAPP_NUMBER = "16728972999"');
    expect(source).toContain("ottawaWhatsAppUrl");
  });

  it("ne conserve plus l’ancien contact WhatsApp dans les sources applicatives", () => {
    const sourceRoots = ["client", "server", "shared"];
    const pending = sourceRoots.map((directory) => path.join(projectRoot, directory));
    const sources: string[] = [];

    while (pending.length) {
      const current = pending.pop()!;
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const absolutePath = path.join(current, entry.name);
        if (entry.isDirectory()) pending.push(absolutePath);
        if (entry.isFile() && /\.(ts|tsx|html)$/.test(entry.name) && !entry.name.endsWith(".test.ts")) sources.push(absolutePath);
      }
    }

    for (const sourcePath of sources) {
      expect(fs.readFileSync(sourcePath, "utf8")).not.toMatch(/237698104832|\+237[\s-]*698[\s-]*104[\s-]*832/);
    }
  });
});
