import React, { ImgHTMLAttributes } from 'react';
import { useLazyImage } from '@/hooks/useLazyImage';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
}

/**
 * Composant LazyImage pour charger les images uniquement quand elles sont visibles
 * Améliore les performances et réduit la bande passante
 *
 * @example
 * <LazyImage
 *   src="/images/hero.jpg"
 *   alt="Hero banner"
 *   placeholder="/images/hero-blur.jpg"
 *   width={1200}
 *   height={600}
 *   className="w-full h-auto"
 * />
 */
export const LazyImage = React.forwardRef<HTMLImageElement, LazyImageProps>(
  ({ src, alt, placeholder, width, height, className, ...props }, ref) => {
    const { src: imageSrc, isLoaded } = useLazyImage(src, placeholder);

    return (
      <img
        ref={ref}
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-75'} transition-opacity duration-300`}
        loading="lazy"
        {...props}
      />
    );
  }
);

LazyImage.displayName = 'LazyImage';

/**
 * Composant pour images responsives avec srcset
 */
interface ResponsiveImageProps extends LazyImageProps {
  srcSet?: string;
  sizes?: string;
}

export const ResponsiveImage = React.forwardRef<HTMLImageElement, ResponsiveImageProps>(
  ({ src, alt, srcSet, sizes, placeholder, className, ...props }, ref) => {
    const { src: imageSrc, isLoaded } = useLazyImage(src, placeholder);

    return (
      <img
        ref={ref}
        src={imageSrc}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-75'} transition-opacity duration-300`}
        loading="lazy"
        {...props}
      />
    );
  }
);

ResponsiveImage.displayName = 'ResponsiveImage';

/**
 * Composant pour images avec skeleton loader
 */
interface SkeletonImageProps extends LazyImageProps {
  skeletonClassName?: string;
}

export const SkeletonImage = React.forwardRef<HTMLImageElement, SkeletonImageProps>(
  ({ src, alt, placeholder, className, skeletonClassName, ...props }, ref) => {
    const { src: imageSrc, isLoaded } = useLazyImage(src, placeholder);

    return (
      <div className="relative overflow-hidden">
        {!isLoaded && (
          <div
            className={`absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse ${
              skeletonClassName || ''
            }`}
          />
        )}
        <img
          ref={ref}
          src={imageSrc}
          alt={alt}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          loading="lazy"
          {...props}
        />
      </div>
    );
  }
);

SkeletonImage.displayName = 'SkeletonImage';
