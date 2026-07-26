import React, { ImgHTMLAttributes, useState } from 'react';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  webpSrc?: string;
  placeholder?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  onLoadComplete?: () => void;
}

/**
 * Composant OptimizedImage pour servir des images WebP avec fallback
 * Réduit la taille des images de 25-35%
 *
 * @example
 * <OptimizedImage
 *   src="/images/hero.jpg"
 *   webpSrc="/images/hero.webp"
 *   alt="Hero banner"
 *   placeholder="/images/hero-blur.jpg"
 *   width={1200}
 *   height={600}
 * />
 */
export const OptimizedImage = React.forwardRef<HTMLImageElement, OptimizedImageProps>(
  (
    {
      src,
      webpSrc,
      alt,
      placeholder,
      width,
      height,
      className,
      onLoadComplete,
      ...props
    },
    ref
  ) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [useWebP, setUseWebP] = useState(!!webpSrc);

    const handleLoad = () => {
      setIsLoaded(true);
      onLoadComplete?.();
    };

    const handleError = () => {
      // Si WebP échoue, utiliser le fallback JPG
      if (useWebP && webpSrc) {
        setUseWebP(false);
      }
    };

    const imageSrc = useWebP && webpSrc ? webpSrc : src;

    return (
      <picture>
        {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
        <img
          ref={ref}
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-75'} transition-opacity duration-300`}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      </picture>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

/**
 * Composant pour images responsives avec WebP et srcset
 */
interface ResponsiveOptimizedImageProps extends OptimizedImageProps {
  srcSet?: string;
  webpSrcSet?: string;
  sizes?: string;
}

export const ResponsiveOptimizedImage = React.forwardRef<
  HTMLImageElement,
  ResponsiveOptimizedImageProps
>(
  (
    {
      src,
      webpSrc,
      srcSet,
      webpSrcSet,
      sizes,
      alt,
      placeholder,
      className,
      onLoadComplete,
      ...props
    },
    ref
  ) => {
    const [isLoaded, setIsLoaded] = useState(false);

    const handleLoad = () => {
      setIsLoaded(true);
      onLoadComplete?.();
    };

    return (
      <picture>
        {webpSrcSet && (
          <source srcSet={webpSrcSet} sizes={sizes} type="image/webp" />
        )}
        {srcSet && <source srcSet={srcSet} sizes={sizes} />}
        <img
          ref={ref}
          src={src}
          alt={alt}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-75'} transition-opacity duration-300`}
          loading="lazy"
          onLoad={handleLoad}
          {...props}
        />
      </picture>
    );
  }
);

ResponsiveOptimizedImage.displayName = 'ResponsiveOptimizedImage';
