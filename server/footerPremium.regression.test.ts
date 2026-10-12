import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const footer = readFileSync(resolve(import.meta.dirname, "../client/src/components/Footer.tsx"), "utf8");

describe("footer premium — lisibilité et contrats publics", () => {
  it("expose une structure claire marque / bureaux / liens / newsletter", () => {
    expect(footer).toContain('data-testid="site-footer"');
    expect(footer).toContain('data-testid="footer-offices"');
    expect(footer).toContain('data-testid="footer-fraud-notice"');
    expect(footer).toContain('data-testid="footer-newsletter"');
    expect(footer).toContain("Nos bureaux");
    expect(footer).toContain("radial-gradient");
  });

  it("conserve les raccourcis accessibles et le tracking d’engagement", () => {
    expect(footer).toContain("FOOTER_SHORTCUT_CLASS");
    expect(footer).toContain("footerEngagement.record.useMutation");
    expect(footer).toContain('surface: "footer_shortcut"');
    expect(footer).toContain('surface: "footer_social"');
    expect(footer).toContain('role="tooltip"');
    expect(footer).toContain("Mini-plan du site");
  });

  it("ne réintroduit pas de réseaux non confirmés ni de QR", () => {
    expect(footer).not.toContain("instagram.com");
    expect(footer).not.toContain("linkedin.com");
    expect(footer).not.toContain("FacebookQRCodeWidget");
    expect(footer).not.toContain("<Tooltip");
  });
});
