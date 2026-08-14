import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("client space navigation", () => {
  const root = resolve(process.cwd());
  const navbar = readFileSync(resolve(root, "client/src/components/Navbar.tsx"), "utf8");
  const navigation = readFileSync(resolve(root, "client/src/components/ClientSpaceNavigation.tsx"), "utf8");
  const evaluationSpace = readFileSync(resolve(root, "client/src/pages/EvaluationSpace.tsx"), "utf8");

  it("links the authenticated client name and mobile profile card to mon-espace", () => {
    expect(navbar).toContain('href="/mon-espace"');
    expect(navbar).toContain("Ouvrir mon espace");
    expect(navbar).toContain("Ouvrir l'espace de");
  });

  it("provides bidirectional client shortcuts without exposing agent routes", () => {
    expect(navigation).toContain('href: "/flights"');
    expect(navigation).toContain('href: "/mon-dossier"');
    expect(navigation).toContain('href: "/document-upload"');
    expect(navigation).toContain('href: "/evisas"');
    expect(navigation).toContain('setLocation("/")');
    expect(navigation).toContain("getMyRequests");
    expect(navigation).not.toContain("/admin/flight-requests");
  });

  it("mounts the navigation hub in both dossier states", () => {
    expect(evaluationSpace.match(/<ClientSpaceNavigation \/>/g)?.length).toBe(2);
  });
});
