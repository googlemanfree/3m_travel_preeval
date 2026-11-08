/**
 * Effets « premium » au pointeur (souris / stylet uniquement, jamais au toucher) :
 *  - halo doré qui suit le curseur sur les cartes (`.premium-surface`, `[data-spotlight]`) via --mx / --my ;
 *  - boutons magnétiques (`[data-magnetic]`) : ils se rapprochent légèrement du curseur, puis reviennent en douceur.
 *
 * Un seul écouteur délégué sur le document, regroupé par image (requestAnimationFrame) : aucun coût par carte.
 * L'effet magnétique passe par `transform` (Tailwind 4 anime `translate` / `scale` séparément : pas de conflit).
 */

export const SPOTLIGHT_SELECTOR = ".premium-surface, [data-spotlight]";
export const MAGNETIC_SELECTOR = "[data-magnetic]";
export const MAGNETIC_MAX_X = 7;
export const MAGNETIC_MAX_Y = 5;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Décalage magnétique (px) pour un curseur en (x, y) au-dessus d'un cadre. Nul au centre, plafonné aux bords. */
export function magneticOffset(rect: { left: number; top: number; width: number; height: number }, x: number, y: number) {
  if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 };
  const nx = clamp((x - (rect.left + rect.width / 2)) / (rect.width / 2), -1, 1);
  const ny = clamp((y - (rect.top + rect.height / 2)) / (rect.height / 2), -1, 1);
  return { x: Math.round(nx * MAGNETIC_MAX_X * 100) / 100, y: Math.round(ny * MAGNETIC_MAX_Y * 100) / 100 };
}

export function attachPointerEffects(win: Window & typeof globalThis = window): () => void {
  const doc = win.document;
  let frame = 0;
  let last: { target: Element | null; x: number; y: number } | null = null;
  let activeMagnet: HTMLElement | null = null;

  const releaseMagnet = (element: HTMLElement) => {
    const from = element.style.transform || "none";
    element.style.transform = "";
    if (from !== "none" && typeof element.animate === "function") {
      element.animate([{ transform: from }, { transform: "none" }], { duration: 260, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
    }
  };

  const flush = () => {
    frame = 0;
    if (!last) return;
    const { target, x, y } = last;
    const spot = target?.closest<HTMLElement>(SPOTLIGHT_SELECTOR) ?? null;
    if (spot) {
      const rect = spot.getBoundingClientRect();
      spot.style.setProperty("--mx", `${Math.round(x - rect.left)}px`);
      spot.style.setProperty("--my", `${Math.round(y - rect.top)}px`);
    }
    const magnet = target?.closest<HTMLElement>(MAGNETIC_SELECTOR) ?? null;
    if (activeMagnet && activeMagnet !== magnet) {
      releaseMagnet(activeMagnet);
      activeMagnet = null;
    }
    if (magnet) {
      const offset = magneticOffset(magnet.getBoundingClientRect(), x, y);
      magnet.style.transform = `translate3d(${offset.x}px, ${offset.y}px, 0)`;
      activeMagnet = magnet;
    }
  };

  const onMove = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    last = { target: event.target instanceof Element ? event.target : null, x: event.clientX, y: event.clientY };
    if (frame === 0) frame = win.requestAnimationFrame(flush);
  };

  const onLeave = () => {
    if (activeMagnet) {
      releaseMagnet(activeMagnet);
      activeMagnet = null;
    }
  };

  doc.addEventListener("pointermove", onMove, { passive: true });
  doc.documentElement.addEventListener("mouseleave", onLeave);
  win.addEventListener("blur", onLeave);

  return () => {
    if (frame) win.cancelAnimationFrame(frame);
    doc.removeEventListener("pointermove", onMove);
    doc.documentElement.removeEventListener("mouseleave", onLeave);
    win.removeEventListener("blur", onLeave);
    if (activeMagnet) activeMagnet.style.transform = "";
    activeMagnet = null;
  };
}
