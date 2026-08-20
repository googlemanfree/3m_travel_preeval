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
});
