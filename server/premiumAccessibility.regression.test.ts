import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const styles = fs.readFileSync(path.join(root, "client/src/index.css"), "utf8");
const navbar = fs.readFileSync(path.join(root, "client/src/components/Navbar.tsx"), "utf8");
const footer = fs.readFileSync(path.join(root, "client/src/components/Footer.tsx"), "utf8");
const qrWidget = fs.readFileSync(path.join(root, "client/src/components/FacebookQRCodeWidget.tsx"), "utf8");
const adminDashboard = fs.readFileSync(path.join(root, "client/src/pages/AdminDashboard.tsx"), "utf8");

describe("passe accessibilité et style premium", () => {
  it("préserve des focus visibles et des cibles tactiles cohérentes", () => {
    expect(styles).toContain("focus-visible:ring-2");
    expect(styles).toContain("focus-visible:ring-offset-background");
    expect(styles).toContain(".touch-target");
    expect(styles).toContain("min-height: 2.75rem");
  });

  it("rend les contrôles de navigation accessibles au clavier", () => {
    expect(navbar).toContain('aria-controls="candidate-account-menu"');
    expect(navbar).toContain('aria-controls="mobile-main-navigation"');
    expect(navbar).toContain('event.key !== "Escape"');
    expect(navbar).toContain("closeProfile()");
  });

  it("évite le débordement du QR footer et préserve ses libellés", () => {
    expect(qrWidget).toContain("max-w-[13rem]");
    expect(qrWidget).toContain("break-all");
    expect(footer).toContain('aria-label="Informations et contacts 3M Travel"');
  });

  it("applique une hiérarchie premium au tableau de bord sans retirer les contrôles", () => {
    expect(adminDashboard).toContain("premium-surface");
    expect(adminDashboard).toContain("aria-label=\"Actualiser manuellement les données du dashboard\"");
    expect(adminDashboard).toContain("aria-label=\"File de priorités manuelle\"");
  });
});
