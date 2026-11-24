import { useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { startDomTranslator, type Dictionary } from "@/i18n/domTranslator";

/** Zones qui restent en français : l'administration (équipe francophone) et les pages de l'espace personnel déjà gérées par `t()`. */
const FRENCH_ONLY_PREFIXES = ["/admin"];

let dictionaryPromise: Promise<Dictionary> | null = null;
const loadDictionary = (): Promise<Dictionary> => {
  dictionaryPromise ??= import("@/i18n/frToEn.json").then((module) => new Map(Object.entries(module.default as Record<string, string>)));
  return dictionaryPromise;
};

/**
 * Quand l'anglais est choisi, remplace le texte français restant à l'écran par sa traduction du dictionnaire (voir domTranslator.ts).
 * Le dictionnaire n'est chargé qu'en anglais : le site français n'en paie pas le poids.
 */
export default function DomTranslationBridge() {
  const { language } = useLanguage();
  const [location] = useLocation();
  const active = language === "en" && !FRENCH_ONLY_PREFIXES.some((prefix) => location.startsWith(prefix));

  useEffect(() => {
    if (!active || typeof document === "undefined") return;
    let stop: (() => void) | null = null;
    let cancelled = false;
    loadDictionary().then((dictionary) => {
      if (cancelled) return;
      stop = startDomTranslator({ dictionary });
    }).catch(() => undefined);
    return () => { cancelled = true; stop?.(); };
  }, [active]);

  return null;
}
