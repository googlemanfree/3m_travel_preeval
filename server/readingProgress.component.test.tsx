// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

let path = "/";
vi.mock("wouter", () => ({ useLocation: () => [path, () => {}] }));
let allowed = true;
let queue: FrameRequestCallback[] = [];
const flush = () => { const run = queue; queue = []; run.forEach((cb) => cb(0)); };
vi.mock("@/hooks/useMotionAllowed", () => ({ useMotionAllowed: () => allowed }));

import ReadingProgress from "@/components/ReadingProgress";

beforeEach(() => {
  path = "/";
  allowed = true;
  queue = [];
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => { queue.push(cb); return queue.length; });
  vi.stubGlobal("cancelAnimationFrame", () => {});
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("barre de lecture", () => {
  it("décorative et inerte : masquée aux lecteurs d'écran, aucun clic capté, jamais animée par le système de révélation", () => {
    render(<ReadingProgress />);
    const host = screen.getByTestId("reading-progress");
    expect(host.getAttribute("aria-hidden")).toBe("true");
    expect(host.className).toContain("pointer-events-none");
    expect(host.hasAttribute("data-no-reveal")).toBe(true);
  });

  it("absente quand le mouvement est réduit ou sur les espaces privés", () => {
    allowed = false;
    const { unmount } = render(<ReadingProgress />);
    expect(screen.queryByTestId("reading-progress")).toBeNull();
    unmount();
    allowed = true;
    path = "/admin/candidats";
    render(<ReadingProgress />);
    expect(screen.queryByTestId("reading-progress")).toBeNull();
  });

  it("suit le défilement : transform proportionnelle à l'avancement", () => {
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 2000 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 1000 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 500 });
    render(<ReadingProgress />);
    flush();
    const bar = screen.getByTestId("reading-progress").firstElementChild as HTMLElement;
    expect(bar.style.transform).toBe("scaleX(0.5)");
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    window.dispatchEvent(new Event("scroll"));
    flush();
    expect(bar.style.transform).toBe("scaleX(0)");
    expect(bar.style.opacity).toBe("0");
  });
});
