/**
 * Traduction du texte visible français → anglais par dictionnaire, appliquée au document quand l'utilisateur choisit l'anglais.
 *
 * Pourquoi ce mécanisme : la plupart des pages du site sont rédigées en français sans appel à `t(fr, en)`. Plutôt que de réécrire des centaines
 * de composants, le texte réellement affiché est remplacé, nœud par nœud, par sa traduction quand elle existe dans le dictionnaire
 * (client/src/i18n/frToEn.json, généré par scripts/i18n). Une chaîne absente du dictionnaire reste telle quelle : le mécanisme ne
 * devine jamais une traduction. Les contenus saisis par des utilisateurs ne sont touchés que s'ils sont strictement identiques à une chaîne du site.
 *
 *  - fonctionne aussi sur le contenu qui arrive plus tard (routes chargées à la demande, données reçues) grâce à un MutationObserver ;
 *  - garde le texte d'origine de chaque nœud : repasser en français restitue le français ;
 *  - ne touche ni aux zones marquées `data-no-translate`, ni aux champs de saisie, scripts, styles, code.
 */
export type Dictionary = ReadonlyMap<string, string>;

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "CODE", "PRE", "SVG", "IFRAME"]);
const FORM_TAGS = new Set(["TEXTAREA", "INPUT"]);
const ATTRIBUTES = ["placeholder", "aria-label", "title", "alt", "aria-description", "data-tooltip"] as const;

const MONTHS_FR: Record<string, string> = { janvier: "January", février: "February", mars: "March", avril: "April", mai: "May", juin: "June", juillet: "July", août: "August", septembre: "September", octobre: "October", novembre: "November", décembre: "December" };
const DATE_FR = new RegExp(`\\b(\\d{1,2})(?:er)? (${Object.keys(MONTHS_FR).join("|")}) (\\d{4})\\b`, "gi");

/** Espaces normalisés : même clé que celle produite à l'extraction du dictionnaire. */
export const normalizeKey = (text: string): string => text.replace(/\s+/g, " ").trim();

/** Dates en toutes lettres (« 27 octobre 2026 » → « October 27, 2026 »), y compris dans une phrase traduite. */
export function translateDates(text: string): string {
  return text.replace(DATE_FR, (_match, day: string, month: string, year: string) => `${MONTHS_FR[month.toLowerCase()]} ${Number(day)}, ${year}`);
}

/** Traduction d'une chaîne : dictionnaire d'abord, puis dates ; null si rien ne change. */
export function translateString(text: string, dictionary: Dictionary): string | null {
  const key = normalizeKey(text);
  if (!key) return null;
  const direct = dictionary.get(key);
  if (direct !== undefined) return direct === key ? null : translateDates(direct);
  const dated = translateDates(key);
  if (dated !== key) {
    // « Vérifié le 27 octobre 2026 » : la partie fixe est cherchée avec une date modèle.
    const template = key.replace(DATE_FR, "{date}");
    const hit = dictionary.get(template);
    if (hit !== undefined) return hit.replace(/\{date\}/g, () => dated.match(/[A-Z][a-z]+ \d{1,2}, \d{4}/)?.[0] ?? "");
    return null;
  }
  return null;
}

type TranslatorOptions = { dictionary: Dictionary; root?: Node; shouldSkip?: (element: Element) => boolean };

export function startDomTranslator(options: TranslatorOptions): () => void {
  const { dictionary } = options;
  const root: Node = options.root ?? document.body;
  /** Texte d'origine et texte traduit de chaque nœud : si React réécrit le nœud, la valeur courante devient la nouvelle source. */
  const textState = new WeakMap<Node, { original: string; translated: string }>();
  const attributeState = new WeakMap<Element, Map<string, { original: string; translated: string }>>();
  const touchedTexts = new Set<WeakRef<Text>>();
  const touchedElements = new Set<WeakRef<Element>>();
  let stopped = false;
  let pending = new Set<Node>();
  let scheduled = false;

  const skipped = (element: Element | null, forAttributes = false): boolean => {
    for (let node: Element | null = element; node; node = node.parentElement) {
      // les champs de saisie ne sont jamais touchés dans leur contenu, mais leur placeholder et leur étiquette le sont
      if (SKIP_TAGS.has(node.tagName.toUpperCase()) && !(forAttributes && FORM_TAGS.has(node.tagName.toUpperCase()))) return true;
      if (node.hasAttribute("data-no-translate") || node.getAttribute("contenteditable") === "true") return true;
      if (options.shouldSkip?.(node)) return true;
    }
    return false;
  };

  const translateTextNode = (node: Text) => {
    if (skipped(node.parentElement)) return;
    const current = node.nodeValue ?? "";
    const state = textState.get(node);
    const source = state && current === state.translated ? state.original : current;
    const result = translateString(source, dictionary);
    if (result === null) return;
    const leading = source.match(/^\s*/)?.[0] ?? "";
    const trailing = source.match(/\s*$/)?.[0] ?? "";
    const next = `${leading}${result}${trailing}`;
    if (next === current) return;
    textState.set(node, { original: source, translated: next });
    touchedTexts.add(new WeakRef(node));
    node.nodeValue = next;
  };

  const translateAttributes = (element: Element) => {
    if (skipped(element, true)) return;
    for (const name of ATTRIBUTES) {
      const value = element.getAttribute(name);
      if (!value) continue;
      const saved = attributeState.get(element)?.get(name);
      const source = saved && value === saved.translated ? saved.original : value;
      const result = translateString(source, dictionary);
      if (result === null || result === value) continue;
      if (!attributeState.has(element)) attributeState.set(element, new Map());
      attributeState.get(element)!.set(name, { original: source, translated: result });
      touchedElements.add(new WeakRef(element));
      element.setAttribute(name, result);
    }
  };

  const walk = (start: Node) => {
    if (start.nodeType === Node.TEXT_NODE) { translateTextNode(start as Text); return; }
    if (start.nodeType !== Node.ELEMENT_NODE && start.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
    if (start.nodeType === Node.ELEMENT_NODE) translateAttributes(start as Element);
    const walker = document.createTreeWalker(start, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    for (let node: Node | null = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.nodeType === Node.TEXT_NODE) translateTextNode(node as Text);
      else translateAttributes(node as Element);
    }
  };

  const observerConfig: MutationObserverInit = { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: [...ATTRIBUTES] };
  const flush = () => {
    scheduled = false;
    if (stopped) return;
    const batch = pending;
    pending = new Set();
    // nos propres écritures ne doivent pas relancer l'observateur
    observer.disconnect();
    try { batch.forEach((node) => { if (node.isConnected) walk(node); }); } finally { if (!stopped) observer.observe(root, observerConfig); }
  };
  const schedule = () => {
    if (scheduled || stopped) return;
    scheduled = true;
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(flush); else setTimeout(flush, 16);
  };
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") mutation.addedNodes.forEach((node) => pending.add(node));
      else pending.add(mutation.target);
    }
    if (pending.size) schedule();
  });

  walk(root);
  observer.observe(root, observerConfig);

  return () => {
    stopped = true;
    observer.disconnect();
    touchedTexts.forEach((ref) => {
      const node = ref.deref();
      const state = node && textState.get(node);
      if (node && state && node.nodeValue === state.translated) node.nodeValue = state.original;
    });
    touchedElements.forEach((ref) => {
      const element = ref.deref();
      attributeState.get(element as Element)?.forEach((state, name) => { if (element && element.getAttribute(name) === state.translated) element.setAttribute(name, state.original); });
    });
  };
}
