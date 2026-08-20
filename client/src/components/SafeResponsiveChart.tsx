import { useEffect, useRef, useState, type ReactNode } from "react";

interface SafeResponsiveChartProps {
  children: ReactNode;
  className: string;
  label: string;
}

/**
 * Ne monte le graphique qu’une fois son conteneur visible et mesurable.
 * Cela évite les avertissements Recharts lorsque le tableau de bord, un
 * onglet ou un panneau replié est temporairement masqué.
 */
export function SafeResponsiveChart({ children, className, label }: SafeResponsiveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMeasurable, setIsMeasurable] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      setIsMeasurable(width > 8 && height > 8);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`min-w-0 ${className}`} aria-label={label}>
      {isMeasurable ? children : <div className="h-full w-full" aria-hidden="true" />}
    </div>
  );
}
