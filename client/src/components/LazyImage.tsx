import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Composant LazyImage avec Intersection Observer
 * 
 * Charge les images de manière lazy (au moment où elles deviennent visibles)
 * Supporte les formats WebP et AVIF avec fallback JPG/PNG
 * 
 * Usage:
 * <LazyImage 
 *   src="/images/hero.webp" 
 *   alt="Hero" 
 *   width={1200}
 *   height={600}
 *   priority={true}  // Charger immédiatement (pour LCP)
 * />
 */
export function LazyImage({
  src,
  alt,
  width,
  height,
  priority = false,
  placeholder,
  onLoad,
  onError,
  className = '',
  ...props
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(priority ? src : null);
  const [isLoading, setIsLoading] = useState(!priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Lazy loading avec Intersection Observer
  useEffect(() => {
    if (priority || imageSrc) return; // Déjà chargée ou prioritaire

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: '50px', // Charger 50px avant que l'image soit visible
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
  }, [src, priority, imageSrc]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  // Placeholder SVG par défaut
  const defaultPlaceholder = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width || 400} ${height || 300}"%3E%3Crect fill="%23f0f0f0" width="100%25" height="100%25"/%3E%3C/svg%3E`;

  return (
    <img
      ref={imgRef}
      src={imageSrc || placeholder || defaultPlaceholder}
      alt={alt}
      width={width}
      height={height}
      className={`
        ${className}
        ${isLoading ? 'blur-sm' : 'blur-0'}
        ${hasError ? 'opacity-50' : 'opacity-100'}
        transition-all duration-300 ease-out
      `}
      onLoad={handleLoad}
      onError={handleError}
      loading={priority ? 'eager' : 'lazy'}
      {...props}
    />
  );
}

/**
 * Composant OptimizedImage avec support WebP/AVIF
 * 
 * Utilise l'élément <picture> pour servir les meilleurs formats
 * Fallback automatique vers JPG/PNG
 * 
 * Usage:
 * <OptimizedImage 
 *   src="/images/hero" 
 *   alt="Hero"
 *   width={1200}
 *   height={600}
 *   priority={true}
 * />
 */
interface OptimizedImageProps extends Omit<LazyImageProps, 'src'> {
  src: string; // Sans extension (ex: "/images/hero")
  formats?: {
    avif?: string;
    webp?: string;
    jpg?: string;
  };
  sizes?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  formats,
  sizes,
  className = '',
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(priority ? `${src}.jpg` : null);
  const [isLoading, setIsLoading] = useState(!priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Lazy loading avec Intersection Observer
  useEffect(() => {
    if (priority || imageSrc) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(`${src}.jpg`);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: '50px',
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
  }, [src, priority, imageSrc]);

  const avifSrc = formats?.avif || `${src}.avif`;
  const webpSrc = formats?.webp || `${src}.webp`;
  const jpgSrc = formats?.jpg || `${src}.jpg`;

  return (
    <picture>
      {/* Format AVIF (meilleure compression) */}
      <source srcSet={avifSrc} type="image/avif" />

      {/* Format WebP (bonne compression) */}
      <source srcSet={webpSrc} type="image/webp" />

      {/* Fallback JPG/PNG */}
      <img
        ref={imgRef}
        src={imageSrc || jpgSrc}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        className={`
          ${className}
          ${isLoading ? 'blur-sm' : 'blur-0'}
          transition-all duration-300 ease-out
        `}
        onLoad={() => setIsLoading(false)}
        loading={priority ? 'eager' : 'lazy'}
        {...props}
      />
    </picture>
  );
}

/**
 * Composant ResponsiveImage avec srcset
 * 
 * Charge différentes résolutions selon la taille de l'écran
 * 
 * Usage:
 * <ResponsiveImage
 *   src="/images/hero"
 *   alt="Hero"
 *   sizes={{
 *     mobile: { width: 320, quality: 80 },
 *     tablet: { width: 768, quality: 85 },
 *     desktop: { width: 1280, quality: 90 },
 *   }}
 *   priority={true}
 * />
 */
interface ResponsiveImageProps extends Omit<LazyImageProps, 'src' | 'sizes'> {
  src: string;
  responsiveSizes?: {
    mobile?: { width: number; quality?: number };
    tablet?: { width: number; quality?: number };
    desktop?: { width: number; quality?: number };
  };
}

export function ResponsiveImage({
  src,
  alt,
  width,
  height,
  priority = false,
  responsiveSizes: customSizes,
  className = '',
  ...props
}: ResponsiveImageProps) {
  const defaultSizes = {
    mobile: { width: 320, quality: 80 },
    tablet: { width: 768, quality: 85 },
    desktop: { width: 1280, quality: 90 },
  };

  const sizes = customSizes || defaultSizes;
  const [imageSrc, setImageSrc] = useState<string | null>(priority ? src : null);
  const [isLoading, setIsLoading] = useState(!priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Lazy loading
  useEffect(() => {
    if (priority || imageSrc) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '50px', threshold: 0.01 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, priority, imageSrc]);

  // Construire le srcset
  const srcSet = [
    sizes.mobile && `${src}-${sizes.mobile.width}w.webp ${sizes.mobile.width}w`,
    sizes.tablet && `${src}-${sizes.tablet.width}w.webp ${sizes.tablet.width}w`,
    sizes.desktop && `${src}-${sizes.desktop.width}w.webp ${sizes.desktop.width}w`,
  ]
    .filter(Boolean)
    .join(', ');

  const sizesAttr = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  return (
    <img
      ref={imgRef}
      src={imageSrc || src}
      alt={alt}
      width={width}
      height={height}
      srcSet={srcSet}
      sizes={sizesAttr}
      className={`
        ${className}
        ${isLoading ? 'blur-sm' : 'blur-0'}
        transition-all duration-300 ease-out
      `}
      onLoad={() => setIsLoading(false)}
      loading={priority ? 'eager' : 'lazy'}
      {...props}
    />
  );
}
