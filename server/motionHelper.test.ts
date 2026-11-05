// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { motionReduced, scrollBehavior } from "../client/src/lib/motion";

const stubMatchMedia = (reduce: boolean) =>
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: reduce && query.includes("reduce"), media: query, addEventListener: () => {}, removeEventListener: () => {} }));

describe("scrollBehavior : le défilement doux respecte le réglage du site et le système", () => {
  afterEach(() => {
    document.documentElement.classList.remove("motion-disabled");
    vi.unstubAllGlobals();
  });

  it("défilement doux quand rien n'est demandé", () => {
    stubMatchMedia(false);
    expect(motionReduced()).toBe(false);
    expect(scrollBehavior()).toBe("smooth");
  });

  it("saut direct quand l'utilisateur a réglé Animations sur Désactivé", () => {
    stubMatchMedia(false);
    document.documentElement.classList.add("motion-disabled");
    expect(motionReduced()).toBe(true);
    expect(scrollBehavior()).toBe("auto");
  });

  it("saut direct quand le système demande de réduire les animations", () => {
    stubMatchMedia(true);
    expect(motionReduced()).toBe(true);
    expect(scrollBehavior()).toBe("auto");
  });

  it("ne plante pas si matchMedia est indisponible", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(scrollBehavior()).toBe("smooth");
  });
});
