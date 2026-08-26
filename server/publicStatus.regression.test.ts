import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("public service status page", () => {
  const page = readFileSync(resolve(process.cwd(), "client/src/pages/ServiceStatus.tsx"), "utf8");
  const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
  const footer = readFileSync(resolve(process.cwd(), "client/src/components/Footer.tsx"), "utf8");
  const prerender = readFileSync(resolve(process.cwd(), "server/publicPrerender.ts"), "utf8");

  it("exposes a bilingual public status route and footer access", () => {
    expect(app).toContain('path={"/etat-du-service"}');
    expect(app).toContain("component={ServiceStatus}");
    expect(footer).toContain('href: "/etat-du-service"');
    expect(page).toContain("No planned maintenance is currently announced.");
    expect(page).toContain("Aucune maintenance planifiée n’est actuellement annoncée.");
    expect(prerender).toContain('"/etat-du-service"');
  });

  it("keeps the page informational and free of internal operational details", () => {
    expect(page).toContain("no case data");
    expect(page).toContain("sans données de dossier");
    expect(page).not.toMatch(/DATABASE_URL|JINKO_API_KEY|SMTP_PASS|session cookie/);
  });
});
