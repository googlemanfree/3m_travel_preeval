import React, { useEffect, useRef, useState } from 'react';

interface LazyIframeProps {
  src: string;
  title: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  loading?: 'lazy' | 'eager';
}

/**
 * Composant LazyIframe pour charger les iframes uniquement quand elles sont visibles
 * Améliore les performances en retardant le chargement des scripts externes
 *
 * @example
 * <LazyIframe
 *   src="https://www.google.com/maps/embed?pb=..."
 *   title="Google Maps"
 *   width="100%"
 *   height={400}
 *   placeholder={<div className="bg-gray-200 h-96 flex items-center justify-center">Chargement de la carte...</div>}
 * />
 */
export const LazyIframe = React.forwardRef<HTMLIFrameElement, LazyIframeProps>(
  (
    {
      src,
      title,
      width = '100%',
      height = 400,
      className,
      placeholder,
      onLoad,
      loading = 'lazy',
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(loading === 'eager');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (loading === 'eager') {
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '50px',
          threshold: 0.01,
        }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => {
        if (containerRef.current) {
          observer.unobserve(containerRef.current);
        }
      };
    }, [loading]);

    return (
      <div
        ref={containerRef}
        style={{ width, height }}
        className={`relative overflow-hidden ${className || ''}`}
      >
        {!isVisible && placeholder ? (
          placeholder
        ) : (
          <iframe
            ref={ref}
            src={isVisible ? src : ''}
            title={title}
            width={width}
            height={height}
            className="w-full h-full border-0"
            allowFullScreen
            loading={loading}
            onLoad={onLoad}
          />
        )}
      </div>
    );
  }
);

LazyIframe.displayName = 'LazyIframe';

/**
 * Composant pour YouTube videos avec lazy loading
 */
interface LazyYouTubeProps {
  videoId: string;
  title?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const LazyYouTube = React.forwardRef<HTMLIFrameElement, LazyYouTubeProps>(
  ({ videoId, title = 'YouTube video', width = '100%', height = 400, className }, ref) => {
    const src = `https://www.youtube.com/embed/${videoId}?rel=0`;

    return (
      <LazyIframe
        ref={ref}
        src={src}
        title={title}
        width={width}
        height={height}
        className={className}
        placeholder={
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="text-4xl mb-2">▶</div>
              <p>Cliquez pour charger la vidéo</p>
            </div>
          </div>
        }
      />
    );
  }
);

LazyYouTube.displayName = 'LazyYouTube';
