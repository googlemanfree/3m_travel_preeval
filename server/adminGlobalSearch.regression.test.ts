import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("admin global search", () => {
  const source = readFileSync(resolve(process.cwd(), "client/src/pages/AdminDashboard.tsx"), "utf8");

  it("exposes the keyboard shortcut and an accessible search dialog", () => {
    expect(source).toContain('event.key.toLowerCase() === "k"');
    expect(source).toContain('aria-label="Ouvrir la recherche globale admin"');
    expect(source).toContain('aria-label="Recherche globale administrateur"');
    expect(source).toContain('role="listbox"');
  });

  it("limits the searchable entries to approved admin workspaces", () => {
    expect(source).toContain('const ADMIN_GLOBAL_SEARCH_ITEMS');
    expect(source).toContain('tab: "candidates"');
    expect(source).toContain('tab: "route-health"');
    expect(source).toContain('path: "/admin/destination-media"');
    const searchBlock = source.slice(source.indexOf("const ADMIN_GLOBAL_SEARCH_ITEMS"), source.indexOf("type ManualPriorityDeadline"));
    expect(searchBlock).not.toContain("candidate.email");
    expect(searchBlock).not.toContain("candidate.whatsapp");
  });
});

