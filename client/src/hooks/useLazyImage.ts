import { useEffect, useRef, useState } from 'react';

/**
 * Hook pour lazy loading des images avec Intersection Observer
 * Améliore les performances en chargeant les images uniquement quand elles sont visibles
 *
 * @param src - URL de l'image à charger
 * @param placeholder - URL de l'image placeholder (optionnel)
 * @returns { src: string, isLoaded: boolean, ref: RefObject }
 */
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || src);
  const [isLoaded, setIsLoaded] = useState(!placeholder);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Si pas de placeholder, charger immédiatement
    if (!placeholder) {
      setImageSrc(src);
      return;
    }

    // Créer un Intersection Observer pour le lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            setIsLoaded(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Commencer à charger 50px avant d'être visible
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, placeholder]);

  return { src: imageSrc, isLoaded, ref: imgRef };
}

/**
 * Hook pour précharger une image
 * Utile pour les images critiques qui doivent être chargées rapidement
 *
 * @param src - URL de l'image à précharger
 */
export function usePreloadImage(src: string) {
  useEffect(() => {
    const img = new Image();
    img.src = src;
  }, [src]);
}

/**
 * Hook pour charger une image avec fallback
 * Permet de gérer les erreurs de chargement
 *
 * @param src - URL de l'image principale
 * @param fallback - URL de l'image de secours
 * @returns { src: string, error: boolean, ref: RefObject }
 */
export function useLazyImageWithFallback(src: string, fallback: string) {
  const [imageSrc, setImageSrc] = useState(src);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleError = () => {
    if (imageSrc !== fallback) {
      setImageSrc(fallback);
      setError(true);
    }
  };

  return { src: imageSrc, error, ref: imgRef, onError: handleError };
}
