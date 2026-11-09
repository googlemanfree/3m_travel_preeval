// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(globalThis as any).React = React;

let allowed = true;
vi.mock("@/hooks/useMotionAllowed", () => ({ useMotionAllowed: () => allowed }));

import CountUp from "@/components/CountUp";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

type ObserverCallback = (entries: Array<{ isIntersecting: boolean }>) => void;
let callbacks: ObserverCallback[] = [];
let frames: Array<(now: number) => void> = [];

beforeEach(() => {
  allowed = true;
  callbacks = [];
  frames = [];
  (globalThis as any).IntersectionObserver = class {
    constructor(callback: ObserverCallback) {
      callbacks.push(callback);
    }
    observe() {}
    disconnect() {}
    unobserve() {}
  };
  vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => {
    frames.push(callback);
    return frames.length;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("compteur animé (CountUp)", () => {
  it("affiche tout de suite la vraie valeur : sans observateur déclenché, le visiteur ne voit jamais 0", () => {
    const { container } = render(<CountUp value={107} />);
    expect(container.textContent).toBe("107");
  });

  it("affiche la valeur finale sans animation quand les animations sont réduites", () => {
    allowed = false;
    const { container } = render(<CountUp value={107} />);
    expect(callbacks).toHaveLength(0);
    expect(container.textContent).toBe("107");
  });

  it("repart de 0 à la première apparition puis termine exactement sur la valeur", () => {
    const { container } = render(<CountUp value={107} durationMs={1000} />);
    act(() => callbacks[0]([{ isIntersecting: true }]));
    expect(container.textContent).toBe("0");

    // L'animation avance de 0 à 100 % : valeurs croissantes, jamais au-dessus de la cible.
    const seen: number[] = [];
    const startFrame = frames.shift()!;
    const origin = performance.now();
    act(() => startFrame(origin + 500));
    seen.push(Number(container.textContent));
    act(() => frames.shift()!(origin + 1500));
    expect(container.textContent).toBe("107");
    expect(seen[0]).toBeGreaterThan(0);
    expect(seen[0]).toBeLessThan(107);
  });

  it("ne rejoue pas et suit la nouvelle valeur si les données changent ensuite", () => {
    const { container, rerender } = render(<CountUp value={10} durationMs={1000} />);
    act(() => callbacks[0]([{ isIntersecting: true }]));
    const origin = performance.now();
    act(() => frames.shift()!(origin + 2000));
    expect(container.textContent).toBe("10");
    rerender(<CountUp value={25} durationMs={1000} />);
    expect(container.textContent).toBe("25");
  });

  it("une entrée non visible ne déclenche rien", () => {
    const { container } = render(<CountUp value={5} />);
    act(() => callbacks[0]([{ isIntersecting: false }]));
    expect(container.textContent).toBe("5");
    expect(frames).toHaveLength(0);
  });
});

describe("en-tête qui se resserre au défilement", () => {
  const navbar = read("client/src/components/Navbar.tsx").replace(/\s+/g, " ");
  const css = read("client/src/index.css");

  it("Navbar pose data-scrolled avec un seuil à hystérésis et un écouteur passif nettoyé", () => {
    expect(navbar).toContain('data-scrolled={scrolled ? "true" : "false"}');
    expect(navbar).toContain("previous ? window.scrollY > 4 : window.scrollY > 48");
    expect(navbar).toContain('addEventListener("scroll", onScroll, { passive: true })');
    expect(navbar).toContain('removeEventListener("scroll", onScroll)');
  });

  it("le resserrement est de la mise en page ; seules les transitions suivent les préférences de mouvement", () => {
    expect(css).toContain('.premium-header[data-scrolled="true"] > div > div');
    const block = css.slice(css.indexOf("En-tête qui se resserre au défilement"));
    const transitionIndex = block.indexOf("transition: padding-block");
    expect(transitionIndex).toBeGreaterThan(-1);
    const mediaIndex = block.indexOf("@media (prefers-reduced-motion: no-preference)");
    expect(mediaIndex).toBeGreaterThan(-1);
    expect(mediaIndex).toBeLessThan(transitionIndex);
    expect(block).toContain("html.motion-disabled .premium-header > div > div");
  });

  it("l'enfoncement tactile des cartes exclut les éléments positionnés et respecte les préférences", () => {
    const block = css.slice(css.indexOf("Écran tactile : la carte s'enfonce"));
    expect(block).toContain("@media (hover: none) and (prefers-reduced-motion: no-preference)");
    expect(block).toContain(':not([class*="fixed"]):not([class*="sticky"]):active');
    expect(block).toContain("html.motion-disabled .premium-surface:active");
  });
});

describe("compteurs : seulement des nombres réels", () => {
  it("la page Fiches compte ses procédures et ses pays depuis ses données", () => {
    const fiches = read("client/src/pages/Fiches.tsx");
    expect(fiches).toContain("<CountUp value={dedupedData.length} />");
    expect(fiches).toContain("<CountUp value={countries.length - 1} />");
  });
});
