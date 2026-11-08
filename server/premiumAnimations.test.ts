// @vitest-environment jsdom
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { REVEAL_CLEANUP_MS, REVEAL_FAILSAFE_MS, REVEAL_MAX_STAGGER_STEPS, REVEAL_STAGGER_MS, createRevealSession, isRevealRoute, planReveals } from "../client/src/lib/scrollReveal";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const page = (html: string) => {
  const el = document.createElement("div");
  el.innerHTML = html;
  document.body.appendChild(el);
  return el;
};
const below = () => true;

describe("routes animées", () => {
  it("anime les pages publiques et jamais les espaces privés, paiements, formulaires d'évaluation ni l'administration", () => {
    for (const path of ["/", "/canada", "/procedures", "/blog/schengen", "/contact", "/en"]) expect(isRevealRoute(path), path).toBe(true);
    for (const path of ["/admin", "/admin/candidats", "/mon-espace", "/mon-dossier", "/paiement", "/payment/success", "/evaluation", "/document-upload", "/panier", "/login"]) {
      expect(isRevealRoute(path), path).toBe(false);
    }
  });
});

describe("plan d'apparition", () => {
  afterEach(() => { document.body.innerHTML = ""; });

  it("une section sous la ligne de flottaison apparaît d'un bloc, une section déjà visible n'est pas masquée", () => {
    const el = page(`<section id="a"><p>Haut</p></section><section id="b"><p>Bas</p></section>`);
    const plan = planReveals(el, { isBelowFold: (node) => node.id === "b" });
    expect(plan.map((item) => item.element.id)).toEqual(["b"]);
  });

  it("une grille de cartes apparaît en cascade (délai croissant, plafonné), son titre d'abord", () => {
    const cards = Array.from({ length: 10 }, (_, i) => `<div class="card" id="c${i}">${i}</div>`).join("");
    const el = page(`<section><h2 id="t">Titre</h2><div class="grid grid-cols-3">${cards}</div></section>`);
    const plan = planReveals(el, { isBelowFold: below });
    expect(plan[0].element.id).toBe("t");
    expect(plan[0].delay).toBe(0);
    expect(plan[2].delay).toBe(REVEAL_STAGGER_MS);
    expect(Math.max(...plan.map((item) => item.delay))).toBe(REVEAL_MAX_STAGGER_STEPS * REVEAL_STAGGER_MS);
    expect(plan).toHaveLength(11);
  });

  it("ne touche jamais un bloc contenant un formulaire, une zone data-no-reveal ni la cible d'une ancre", () => {
    const el = page(`<section id="form"><form><input /></form></section><section id="skip" data-no-reveal><p>x</p></section><section id="anchor"><h2 id="here">Ancre</h2></section><section id="ok"><p>y</p></section>`);
    const plan = planReveals(el, { isBelowFold: below, anchorTarget: document.getElementById("here") });
    expect(plan.map((item) => item.element.id)).toEqual(["ok"]);
  });

  it("laisse à framer-motion les éléments qu'il pilote déjà (style en ligne) : pas deux animations concurrentes", () => {
    const el = page(
      `<section id="fm" style="opacity: 0; transform: translateY(18px)"><p>x</p></section>` +
      `<section id="grid"><div class="grid grid-cols-2"><article id="driven" style="opacity:0;transform:translateY(20px)">a</article><article id="free">b</article></div></section>`,
    );
    const ids = planReveals(el, { isBelowFold: below }).map((item) => item.element.id);
    expect(ids).not.toContain("fm");
    expect(ids).not.toContain("driven");
    expect(ids).toContain("free");
  });

  it("une section imbriquée n'est pas animée deux fois", () => {
    const el = page(`<section id="outer"><section id="inner"><p>x</p></section></section>`);
    expect(planReveals(el, { isBelowFold: below }).map((item) => item.element.id)).toEqual(["outer"]);
  });
});

describe("session : le contenu ne reste jamais caché", () => {
  let observers: Array<{ cb: IntersectionObserverCallback; targets: Set<Element> }>;
  beforeEach(() => {
    vi.useFakeTimers();
    observers = [];
    class FakeObserver {
      targets = new Set<Element>();
      constructor(public cb: IntersectionObserverCallback) { observers.push(this); }
      observe(el: Element) { this.targets.add(el); }
      unobserve(el: Element) { this.targets.delete(el); }
      disconnect() { this.targets.clear(); }
    }
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    Object.defineProperty(window, "IntersectionObserver", { value: FakeObserver, configurable: true });
    // jsdom : pas de géométrie, tout est « sous la ligne de flottaison ».
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top: 5000, bottom: 5100, left: 0, right: 0, width: 0, height: 100, x: 0, y: 5000, toJSON: () => ({}) });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("masque, affiche à l'entrée dans l'écran, puis retire tout attribut (aucune transform résiduelle)", () => {
    const el = page(`<section id="s"><p>Bas</p></section>`);
    const session = createRevealSession(el, window as never);
    session.scan();
    const section = document.getElementById("s")!;
    expect(section.dataset.sr).toBe("hidden");
    observers[0].cb([{ isIntersecting: true, target: section } as unknown as IntersectionObserverEntry], observers[0] as never);
    expect(section.dataset.sr).toBe("shown");
    vi.advanceTimersByTime(REVEAL_CLEANUP_MS + 5);
    expect(section.dataset.sr).toBeUndefined();
    expect(section.style.getPropertyValue("--sr-delay")).toBe("");
    session.stop();
  });

  it("filet de sécurité : si l'observateur ne se déclenche jamais, tout est affiché au bout de quelques secondes", () => {
    const el = page(`<section id="s"><p>Bas</p></section>`);
    const session = createRevealSession(el, window as never);
    session.scan();
    const section = document.getElementById("s")!;
    expect(section.dataset.sr).toBe("hidden");
    vi.advanceTimersByTime(REVEAL_FAILSAFE_MS + REVEAL_CLEANUP_MS + 20);
    expect(section.dataset.sr).toBeUndefined();
    session.stop();
  });

  it("changer de page (stop) rend immédiatement tout visible ; un second scan n'anime pas deux fois", () => {
    const el = page(`<section id="s"><p>Bas</p></section>`);
    const session = createRevealSession(el, window as never);
    session.scan();
    session.scan();
    expect(observers[0].targets.size).toBe(1);
    session.stop();
    expect(document.getElementById("s")!.dataset.sr).toBeUndefined();
  });
});

describe("câblage et styles", () => {
  const css = read("client/src/index.css");

  it("le gestionnaire est monté dans l'application et respecte les préférences", () => {
    expect(read("client/src/App.tsx")).toContain("<ScrollRevealManager />");
    const manager = read("client/src/components/ScrollRevealManager.tsx");
    expect(manager).toContain("useMotionAllowed");
    expect(manager).toContain("isRevealRoute");
    const hook = read("client/src/hooks/useMotionAllowed.ts");
    expect(hook).toContain("useReducedMotion");
    expect(hook).toContain("animationsEnabled");
  });

  it("toutes les animations framer-motion suivent le réglage du site : MotionConfig global, « Désactivé » = mouvement coupé", () => {
    const app = read("client/src/App.tsx");
    expect(app).toContain("<MotionPreferenceBridge>");
    expect(app).toContain("</MotionPreferenceBridge>");
    // Le pont est à l'intérieur du fournisseur de préférences (il en lit la valeur).
    expect(app.indexOf("<AnimationPreferencesProvider>")).toBeLessThan(app.indexOf("<MotionPreferenceBridge>"));
    const bridge = read("client/src/components/MotionPreferenceBridge.tsx");
    expect(bridge).toContain("MotionConfig");
    expect(bridge).toContain('animationsEnabled ? "user" : "always"');
  });

  it("aucun défilement ne force `smooth` : tous passent par scrollBehavior(), qui respecte le réglage et le système", () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(resolve(root, dir), { withFileTypes: true })) {
        const rel = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(rel);
        else if (/\.(tsx?|jsx?)$/.test(entry.name) && !rel.endsWith("lib/motion.ts") && /behavior:\s*["']smooth["']/.test(read(rel))) offenders.push(rel);
      }
    };
    walk("client/src");
    expect(offenders).toEqual([]);
  });

  it("l'état masqué n'existe que sous data-sr, uniquement si l'utilisateur n'a pas demandé de réduire les animations", () => {
    const start = css.indexOf("Animations premium du site public");
    const block = css.slice(start);
    expect(block).toMatch(/@media \(prefers-reduced-motion: no-preference\) \{\s*\[data-sr="hidden"\]/);
    expect(block).toContain("html.motion-disabled [data-sr]");
    expect(block).toContain("@media print");
    // Aucune règle ne masque un élément sans l'attribut posé par le script.
    expect(block.match(/opacity:\s*0;/g)?.length).toBe(1);
  });

  it("le titre de page glisse sans jamais passer par l'opacité (le LCP n'est pas retardé)", () => {
    const keyframes = css.slice(css.indexOf("@keyframes sr-rise-soft"), css.indexOf("@keyframes sr-rise-soft") + 160);
    expect(keyframes).not.toContain("opacity");
  });

  it("le relief des cartes est limité aux pointeurs fins et aux pages publiques", () => {
    const start = css.indexOf("Cartes cliquables : relief au survol");
    const block = css.slice(start);
    expect(block).toContain("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    expect(block).not.toMatch(/\n\s*\.app-content/);
    expect(block).toContain("overflow-hidden");
  });
});
