import { useEffect, useRef, useState } from "react";

interface UseLazyScriptOptions {
  /** URL du script à charger */
  src: string;
  /** ID unique du script (pour éviter les doublons) */
  id?: string;
  /** Attributs supplémentaires du script (async, defer, crossOrigin, etc.) */
  attributes?: Record<string, string | boolean>;
  /** Callback quand le script est chargé */
  onLoad?: () => void;
  /** Callback en cas d'erreur */
  onError?: (error: Event) => void;
  /** Délai avant le chargement (en ms) */
  delay?: number;
  /** Charger le script immédiatement ou attendre un événement */
  immediate?: boolean;
}

/**
 * Hook pour charger les scripts de manière lazy (optimisé pour les performances).
 * Utile pour Google Maps, analytics, tracking, etc.
 *
 * @example
 * const { loading, error, trigger } = useLazyScript({
 *   src: "https://maps.googleapis.com/maps/api/js?key=...",
 *   id: "google-maps",
 *   onLoad: () => console.log("Maps loaded"),
 * });
 *
 * // Charger le script à la demande
 * <button onClick={trigger}>Charger Google Maps</button>
 */
export function useLazyScript({
  src,
  id,
  attributes = {},
  onLoad,
  onError,
  delay = 0,
  immediate = true,
}: UseLazyScriptOptions) {
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadScript = () => {
    // Vérifier si le script est déjà chargé
    if (scriptRef.current) {
      onLoad?.();
      return;
    }

    // Vérifier si un script avec le même ID existe déjà
    if (id && document.getElementById(id)) {
      onLoad?.();
      return;
    }

    setLoading(true);
    setError(null);

    const script = document.createElement("script");
    script.src = src;
    script.async = true;

    // Appliquer les attributs
    if (id) script.id = id;
    Object.entries(attributes).forEach(([key, value]) => {
      if (value === true) {
        script.setAttribute(key, "");
      } else if (value !== false) {
        script.setAttribute(key, String(value));
      }
    });

    const handleLoad = () => {
      setLoading(false);
      scriptRef.current = script;
      onLoad?.();
    };

    const handleError = (e: Event) => {
      setLoading(false);
      const err = new Error(`Failed to load script: ${src}`);
      setError(err);
      onError?.(e);
    };

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    // Appliquer le délai si nécessaire
    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        document.head.appendChild(script);
      }, delay);
    } else {
      document.head.appendChild(script);
    }
  };

  useEffect(() => {
    if (immediate) {
      loadScript();
    }

    return () => {
      // Cleanup: retirer le script si nécessaire
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Note: On ne retire pas le script du DOM pour éviter de le recharger
      // à chaque remontage du composant
    };
  }, [src, id, immediate]);

  return {
    loading,
    error,
    trigger: loadScript,
  };
}
