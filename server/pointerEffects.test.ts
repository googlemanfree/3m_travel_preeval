// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAGNETIC_MAX_X, MAGNETIC_MAX_Y, attachPointerEffects, magneticOffset } from "../client/src/lib/pointerEffects";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("décalage magnétique", () => {
  const rect = { left: 100, top: 100, width: 200, height: 60 };
  it("nul au centre, plafonné aux bords et même au-delà", () => {
    expect(magneticOffset(rect, 200, 130)).toEqual({ x: 0, y: 0 });
    expect(magneticOffset(rect, 300, 160)).toEqual({ x: MAGNETIC_MAX_X, y: MAGNETIC_MAX_Y });
    expect(magneticOffset(rect, -500, -500)).toEqual({ x: -MAGNETIC_MAX_X, y: -MAGNETIC_MAX_Y });
  });
  it("un cadre vide ne produit aucun mouvement (pas de NaN)", () => {
    expect(magneticOffset({ left: 0, top: 0, width: 0, height: 0 }, 10, 10)).toEqual({ x: 0, y: 0 });
  });
});

describe("écouteur de pointeur", () => {
  let queue: FrameRequestCallback[];
  const flush = () => { const run = queue; queue = []; run.forEach((cb) => cb(0)); };
  beforeEach(() => {
    queue = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => { queue.push(cb); return queue.length; });
    vi.stubGlobal("cancelAnimationFrame", () => {});
    document.body.innerHTML = `<div id="card" class="premium-surface">carte</div><a id="cta" data-magnetic href="#">cta</a><p id="other">x</p>`;
    for (const id of ["card", "cta"]) {
      (document.getElementById(id) as HTMLElement).getBoundingClientRect = () => ({ left: 100, top: 100, width: 200, height: 60, right: 300, bottom: 160, x: 100, y: 100, toJSON() {} }) as DOMRect;
    }
  });
  afterEach(() => { document.body.innerHTML = ""; vi.unstubAllGlobals(); });

  const move = (id: string, x: number, y: number, pointerType = "mouse") => {
    const event = new Event("pointermove", { bubbles: true }) as any;
    event.clientX = x; event.clientY = y; event.pointerType = pointerType;
    document.getElementById(id)!.dispatchEvent(event);
    flush();
  };

  it("le halo suit le curseur sur une carte premium", () => {
    const detach = attachPointerEffects(window);
    move("card", 150, 120);
    const card = document.getElementById("card")!;
    expect(card.style.getPropertyValue("--mx")).toBe("50px");
    expect(card.style.getPropertyValue("--my")).toBe("20px");
    detach();
  });

  it("le bouton magnétique se rapproche du curseur, puis revient quand on le quitte", () => {
    const detach = attachPointerEffects(window);
    move("cta", 300, 160);
    const cta = document.getElementById("cta")!;
    expect(cta.style.transform).toBe(`translate3d(${MAGNETIC_MAX_X}px, ${MAGNETIC_MAX_Y}px, 0)`);
    move("other", 10, 10);
    expect(cta.style.transform).toBe("");
    detach();
  });

  it("ignore le toucher et ne laisse aucun style après détachement", () => {
    const detach = attachPointerEffects(window);
    move("cta", 300, 160, "touch");
    expect(document.getElementById("cta")!.style.transform).toBe("");
    move("cta", 300, 160);
    detach();
    expect(document.getElementById("cta")!.style.transform).toBe("");
  });
});

describe("câblage du mouvement premium", () => {
  const css = read("client/src/index.css");

  it("tout le mouvement décoratif est sous prefers-reduced-motion: no-preference et coupé par le réglage « Animations »", () => {
    const start = css.indexOf("Mouvement premium : aurore lumineuse");
    expect(start).toBeGreaterThan(0);
    const block = css.slice(start);
    expect(block).toMatch(/@media \(prefers-reduced-motion: no-preference\) \{\s*\.fx-aurora/);
    expect(block).toMatch(/html\.motion-disabled \.fx-aurora/);
    expect(block).toMatch(/html\.motion-disabled \.fx-float/);
    expect(block).toMatch(/html\.high-contrast \.premium-surface::after/);
  });

  it("la sortie du hero n'efface jamais le contenu (opacité plancher) et reste réservée aux navigateurs compatibles", () => {
    expect(css).toMatch(/@supports \(animation-timeline: view\(\)\)[\s\S]{0,400}hero-exit/);
    const keyframes = css.match(/@keyframes hero-exit \{[^}]*\}[^}]*\}/)?.[0] ?? "";
    const opacity = Number(keyframes.match(/opacity:\s*([\d.]+)/)?.[1]);
    expect(opacity).toBeGreaterThanOrEqual(0.4);
  });

  it("le hero et l'appel final portent les décors et boutons magnétiques, montés une seule fois dans App", () => {
    expect(read("client/src/components/HeroSectionVIP.tsx")).toMatch(/fx-aurora[\s\S]*fx-float|fx-float[\s\S]*fx-aurora/);
    expect(read("client/src/components/HeroSectionVIP.tsx").match(/data-magnetic/g)?.length).toBe(2);
    expect(read("client/src/pages/Home.tsx").match(/data-magnetic/g)?.length).toBe(2);
    expect(read("client/src/App.tsx").match(/<PremiumPointerEffects \/>/g)?.length).toBe(1);
  });

  it("les décors sont masqués aux lecteurs d'écran", () => {
    expect(read("client/src/components/HeroSectionVIP.tsx")).toMatch(/fx-aurora"\s+aria-hidden="true"/);
    expect(read("client/src/pages/Home.tsx")).toMatch(/fx-aurora"\s+aria-hidden="true"/);
  });
});
