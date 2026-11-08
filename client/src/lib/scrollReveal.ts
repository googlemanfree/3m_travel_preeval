/**
 * Apparition progressive des sections au défilement (pages publiques).
 *
 * Principes de sécurité — le contenu ne doit JAMAIS rester caché :
 *  - rien n'est masqué tant que ce code n'a pas posé `data-sr="hidden"` (sans JavaScript, le prérendu reste lisible) ;
 *  - ce qui est déjà à l'écran n'est pas masqué (pas de clignotement, le LCP n'est pas retardé) ;
 *  - un filet de sécurité affiche tout au bout de quelques secondes, même si l'observateur ne se déclenche pas
 *    (WebView d'aperçu, onglet en arrière-plan) ;
 *  - les blocs contenant un formulaire, la cible d'une ancre (#…) et les zones privées sont laissés intacts ;
 *  - une fois l'élément affiché, ses attributs sont retirés : aucune `transform` résiduelle (qui casserait
 *    `position: fixed` / `sticky` chez les descendants).
 */

/** Zones privées ou denses en données : jamais animées. */
export const REVEAL_DENY_PREFIXES = [
  "/admin",
  "/mon-",
  "/espace",
  "/candidate",
  "/client-dashboard",
  "/employer",
  "/employeur-portail",
  "/portail",
  "/partner",
  "/partenaire",
  "/agence-portail",
  "/login",
  "/connexion",
  "/inscription",
  "/signup",
  "/paiement",
  "/payment",
  "/document",
  "/mes-",
  "/evaluation",
  "/panier",
  "/checkout",
  "/reset",
  "/verify",
  "/signature",
  "/sign",
] as const;

export function isRevealRoute(pathname: string): boolean {
  const path = (pathname || "/").toLowerCase();
  return !REVEAL_DENY_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export type RevealPlanItem = { element: HTMLElement; delay: number };

export const REVEAL_STAGGER_MS = 70;
export const REVEAL_MAX_STAGGER_STEPS = 7;
export const REVEAL_FAILSAFE_MS = 2600;
export const REVEAL_CLEANUP_MS = 1100;

const INTERACTIVE_SELECTOR = "form, input, select, textarea, [role='dialog'], [contenteditable='true']";

/**
 * Un élément déjà piloté par framer-motion (opacité ou transformation posées en style en ligne) garde sa propre animation :
 * y ajouter l'apparition CSS ferait deux animations concurrentes sur les mêmes propriétés (saccades, double délai).
 */
function isDrivenByInlineMotion(element: HTMLElement): boolean {
  const { opacity, transform } = element.style;
  return opacity !== "" || (transform !== "" && transform !== "none");
}

function isProtected(element: HTMLElement, anchorTarget: HTMLElement | null): boolean {
  if (element.closest("[data-no-reveal]")) return true;
  if (isDrivenByInlineMotion(element)) return true;
  if (element.matches(INTERACTIVE_SELECTOR) || element.querySelector(INTERACTIVE_SELECTOR)) return true;
  if (anchorTarget && (element === anchorTarget || element.contains(anchorTarget) || anchorTarget.contains(element))) return true;
  return false;
}

/**
 * Décide quels éléments animer. `isBelowFold` est injectable pour les tests (jsdom n'a pas de géométrie).
 * Une section avec une grille (≥ 2 cartes) anime ses cartes en cascade ; sinon la section entière apparaît d'un bloc.
 */
export function planReveals(
  root: ParentNode,
  options: { isBelowFold: (element: HTMLElement) => boolean; anchorTarget?: HTMLElement | null; alreadyPlanned?: WeakSet<Element> },
): RevealPlanItem[] {
  const anchorTarget = options.anchorTarget ?? null;
  const planned = options.alreadyPlanned ?? new WeakSet<Element>();
  const plan: RevealPlanItem[] = [];
  const take = (element: HTMLElement, delay: number) => {
    if (planned.has(element)) return;
    planned.add(element);
    plan.push({ element, delay });
  };

  const blocks = Array.from(root.querySelectorAll<HTMLElement>("section, [data-reveal]"));
  for (const block of blocks) {
    // Seuls les blocs les plus externes : un bloc imbriqué est couvert par son parent.
    const parentBlock = block.parentElement?.closest("section, [data-reveal]");
    if (parentBlock && blocks.includes(parentBlock as HTMLElement)) continue;
    if (planned.has(block) || isProtected(block, anchorTarget)) continue;
    if (!options.isBelowFold(block)) continue;

    const grids = Array.from(block.querySelectorAll<HTMLElement>(".grid, [class*='grid-cols']")).filter((grid) => grid.children.length >= 2 && grid.children.length <= 24);
    if (grids.length === 0) {
      take(block, 0);
      continue;
    }
    for (const heading of Array.from(block.querySelectorAll<HTMLElement>("h2"))) {
      if (!grids.some((grid) => grid.contains(heading)) && !isProtected(heading, anchorTarget)) take(heading, 0);
    }
    for (const grid of grids) {
      Array.from(grid.children).forEach((child, index) => {
        const item = child as HTMLElement;
        if (isProtected(item, anchorTarget)) return;
        take(item, Math.min(index, REVEAL_MAX_STAGGER_STEPS) * REVEAL_STAGGER_MS);
      });
    }
  }
  return plan;
}

export type RevealSession = { scan: () => void; stop: () => void };

/** Démarre l'observation d'une page. `scan()` est idempotent : on peut le relancer quand du contenu paresseux arrive. */
export function createRevealSession(root: HTMLElement, win: Window & typeof globalThis = window): RevealSession {
  const planned = new WeakSet<Element>();
  const pending = new Set<HTMLElement>();
  const timers: number[] = [];
  let stopped = false;

  const finish = (element: HTMLElement) => {
    pending.delete(element);
    element.dataset.sr = "shown";
    timers.push(win.setTimeout(() => {
      // Retirer l'attribut : l'état final (opacité 1, pas de transform) est identique, sans résidu de style.
      delete element.dataset.sr;
      element.style.removeProperty("--sr-delay");
    }, REVEAL_CLEANUP_MS));
  };

  const observer = new win.IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          finish(entry.target as HTMLElement);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
  );

  const isBelowFold = (element: HTMLElement) => element.getBoundingClientRect().top > win.innerHeight * 0.92;

  const scan = () => {
    if (stopped) return;
    const hash = win.location.hash.replace(/^#/, "");
    const anchorTarget = hash ? win.document.getElementById(decodeURIComponent(hash)) : null;
    for (const { element, delay } of planReveals(root, { isBelowFold, anchorTarget, alreadyPlanned: planned })) {
      element.dataset.sr = "hidden";
      element.style.setProperty("--sr-delay", `${delay}ms`);
      pending.add(element);
      observer.observe(element);
    }
  };

  // Filet de sécurité : quoi qu'il arrive, tout est visible peu après.
  timers.push(win.setTimeout(() => {
    for (const element of Array.from(pending)) {
      observer.unobserve(element);
      finish(element);
    }
  }, REVEAL_FAILSAFE_MS));

  const stop = () => {
    stopped = true;
    observer.disconnect();
    timers.forEach((timer) => win.clearTimeout(timer));
    for (const element of Array.from(pending)) {
      delete element.dataset.sr;
      element.style.removeProperty("--sr-delay");
    }
    pending.clear();
  };

  return { scan, stop };
}
