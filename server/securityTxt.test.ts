import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { renderSecurityTxt, SECURITY_TXT_EXPIRES } from "./securityTxt";

describe("security.txt", () => {
  it("contient un contact, une expiration et l'adresse canonique", () => {
    const text = renderSecurityTxt();
    expect(text).toContain("Contact: mailto:hello@3mtravelagency.com");
    expect(text).toContain(`Expires: ${SECURITY_TXT_EXPIRES}`);
    expect(text).toContain("Canonical: https://www.3mtravelagency.com/.well-known/security.txt");
  });

  it("n'expire pas dans les trente prochains jours (à renouveler chaque année)", () => {
    const remainingMs = Date.parse(SECURITY_TXT_EXPIRES) - Date.now();
    expect(remainingMs).toBeGreaterThan(30 * 24 * 3600 * 1000);
  });

  it("est servi en texte brut par le serveur", () => {
    const vite = readFileSync(resolve(import.meta.dirname, "_core/vite.ts"), "utf8").replace(/\r/g, "");
    expect(vite).toContain('app.get("/.well-known/security.txt"');
    expect(vite).toContain("renderSecurityTxt()");
  });
});
