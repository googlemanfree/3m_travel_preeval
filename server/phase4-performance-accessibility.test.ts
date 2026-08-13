import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const readProjectFile = (relativePath: string) =>
  readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("phase 4 performance and accessibility contracts", () => {
  it("loads PDF dependencies only after an explicit export action", () => {
    const pdfExporter = readProjectFile("client/src/components/PDFExporter.tsx");
    const luxembourgForm = readProjectFile("client/src/components/LuxembourgEvaluationForm.tsx");

    expect(pdfExporter).not.toMatch(/import\s+[^;]*from\s+["']jspdf["']/);
    expect(pdfExporter).toContain('await import("jspdf")');
    expect(pdfExporter).toContain("exportProgress");
    expect(pdfExporter).toContain("Chargement des dépendances PDF");
    expect(pdfExporter).toContain('toast.success("Export PDF réussi"');
    expect(pdfExporter).toContain('toast.error("Échec de l’export PDF"');
    expect(luxembourgForm).not.toMatch(/import\s+[^;]*from\s+["']jspdf["']/);
    expect(luxembourgForm).toContain('await import("jspdf")');
    expect(luxembourgForm).toContain("pdfExportProgress");
    expect(luxembourgForm).toContain("Chargement des dépendances PDF");
    expect(luxembourgForm).toContain('toast.success("Export PDF réussi"');
    expect(luxembourgForm).toContain('toast.error("Échec de l’export PDF"');
  });

  it("keeps route-level vendor chunks explicit for mobile caching", () => {
    const viteConfig = readProjectFile("vite.config.ts");

    expect(viteConfig).toContain('return "pdf-vendor"');
    expect(viteConfig).toContain('return "react-vendor"');
    expect(viteConfig).toContain('return "data-vendor"');
    expect(viteConfig).toContain('return "icons-vendor"');
  });

  it("keeps floating actions above the mobile safe area", () => {
    const styles = readProjectFile("client/src/index.css");
    const floatingMenu = readProjectFile("client/src/components/FloatingActionMenu.tsx");
    const aureol = readProjectFile("client/src/components/AiCopilotWidgetEnhanced.tsx");

    expect(styles).toContain(".safe-bottom-floating-whatsapp");
    expect(styles).toContain(".safe-bottom-floating-chat");
    expect(styles).toContain("env(safe-area-inset-bottom)");
    expect(floatingMenu).toContain("safe-bottom-floating-whatsapp");
    expect(aureol).toContain("safe-bottom-floating-chat");
  });

  it("keeps the legal, sitemap and accessibility destinations real and keyboard-labelled", () => {
    const footer = readProjectFile("client/src/components/Footer.tsx");
    const institutionalFooter = readProjectFile("client/src/components/FooterLegal.tsx");
    const app = readProjectFile("client/src/App.tsx");
    const floatingMenu = readProjectFile("client/src/components/FloatingActionMenu.tsx");

    for (const path of ["/conditions-utilisation", "/plan-du-site", "/accessibilite"]) {
      expect(footer).toContain(path);
      expect(institutionalFooter).toContain(path);
      expect(app).toContain(path);
    }

    expect(footer).toContain("aria-label");
    expect(floatingMenu).toBeDefined();
  });
});
