import { useEffect, useRef, useState } from 'react';

interface LazyScriptProps {
  src: string;
  onLoad?: () => void;
  onError?: () => void;
  async?: boolean;
  defer?: boolean;
  module?: boolean;
  noModule?: boolean;
  integrity?: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
  loading?: 'lazy' | 'eager';
  attributes?: Record<string, string>;
}

/**
 * Hook pour charger les scripts externes de manière lazy
 * Améliore les performances en retardant le chargement des scripts non-critiques
 *
 * @example
 * useLazyScript({
 *   src: 'https://maps.googleapis.com/maps/api/js?key=YOUR_KEY',
 *   onLoad: () => console.log('Maps loaded'),
 *   loading: 'lazy'
 * })
 */
export function useLazyScript({
  src,
  onLoad,
  onError,
  async = true,
  defer = false,
  module = false,
  noModule = false,
  integrity,
  crossOrigin,
  loading = 'lazy',
  attributes = {},
}: LazyScriptProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // Si eager, charger immédiatement
    if (loading === 'eager') {
      loadScript();
      return;
    }

    // Sinon, attendre que la page soit chargée
    const handleLoad = () => {
      loadScript();
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', handleLoad);
      return () => document.removeEventListener('DOMContentLoaded', handleLoad);
    } else {
      loadScript();
    }
  }, [src, loading]);

  const loadScript = () => {
    // Vérifier si le script est déjà chargé
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      setIsLoaded(true);
      onLoad?.();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = async;
    script.defer = defer;

    if (module) script.type = 'module';
    if (noModule) script.noModule = true;
    if (integrity) script.integrity = integrity;
    if (crossOrigin) script.crossOrigin = crossOrigin;

    // Ajouter les attributs personnalisés
    Object.entries(attributes).forEach(([key, value]) => {
      script.setAttribute(key, value);
    });

    script.onload = () => {
      setIsLoaded(true);
      onLoad?.();
    };

    script.onerror = () => {
      setIsError(true);
      onError?.();
    };

    scriptRef.current = script;
    document.body.appendChild(script);
  };

  return { isLoaded, isError };
}

/**
 * Composant pour charger les scripts Google Maps de manière lazy
 */
interface LazyGoogleMapsProps {
  apiKey: string;
  onLoad?: () => void;
  libraries?: string[];
}

export function useLazyGoogleMaps({ apiKey, onLoad, libraries = [] }: LazyGoogleMapsProps) {
  const librariesParam = libraries.length > 0 ? `&libraries=${libraries.join(',')}` : '';
  const mapsUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}${librariesParam}`;

  return useLazyScript({
    src: mapsUrl,
    onLoad,
    loading: 'lazy',
    attributes: {
      'data-lazy-load': 'true',
    },
  });
}

/**
 * Composant pour charger les scripts Analytics de manière lazy
 */
interface LazyAnalyticsProps {
  trackingId: string;
  onLoad?: () => void;
}

export function useLazyAnalytics({ trackingId, onLoad }: LazyAnalyticsProps) {
  return useLazyScript({
    src: `https://www.googletagmanager.com/gtag/js?id=${trackingId}`,
    onLoad,
    loading: 'lazy',
    async: true,
  });
}

/**
 * Composant pour charger les scripts Stripe de manière lazy
 */
interface LazyStripeProps {
  onLoad?: () => void;
}

export function useLazyStripe({ onLoad }: LazyStripeProps) {
  return useLazyScript({
    src: 'https://js.stripe.com/v3/',
    onLoad,
    loading: 'lazy',
    async: true,
  });
}
