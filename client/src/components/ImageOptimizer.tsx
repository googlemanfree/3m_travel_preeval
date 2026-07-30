/**
 * Composant ImageOptimizer
 * 
 * Génère automatiquement les balises picture avec les meilleurs formats
 * Supporte WebP, AVIF avec fallback JPG/PNG
 * Lazy loading intégré
 */

import { LazyImage, ResponsiveImage, SkeletonImage } from './LazyImage';

export { LazyImage, ResponsiveImage, SkeletonImage };

// Alias pour compatibilité
export const OptimizedImage = ResponsiveImage;

/**
 * Hook pour détecter le support des formats d'image
 */
export function useImageFormats() {
  const supportsWebP = () => {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').includes('image/webp');
  };

  const supportsAVIF = () => {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/avif').includes('image/avif');
  };

  return {
    webp: supportsWebP(),
    avif: supportsAVIF(),
  };
}

/**
 * Utilitaire pour générer les URLs d'images optimisées
 */
export function getOptimizedImageUrl(
  baseUrl: string,
  width?: number,
  format: 'webp' | 'avif' | 'jpg' = 'webp'
) {
  const widthSuffix = width ? `-${width}w` : '';
  return `${baseUrl}${widthSuffix}.${format}`;
}

/**
 * Utilitaire pour générer un srcset
 */
export function generateSrcSet(
  baseUrl: string,
  widths: number[] = [320, 640, 1280],
  format: 'webp' | 'avif' = 'webp'
) {
  return widths
    .map(width => `${getOptimizedImageUrl(baseUrl, width, format)} ${width}w`)
    .join(', ');
}

/**
 * Configuration pour les images critiques (LCP)
 */
export const criticalImageConfig = {
  priority: true,
  loading: 'eager' as const,
  fetchPriority: 'high' as const,
};

/**
 * Configuration pour les images non-critiques
 */
export const nonCriticalImageConfig = {
  priority: false,
  loading: 'lazy' as const,
  fetchPriority: 'low' as const,
};
