/**
 * Composant wrapper pour les animations d'apparition au défilement
 * Combine useScrollAnimation avec Framer Motion
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useScrollAnimation, animationVariants, animationDurations } from '@/hooks/useScrollAnimation';

export type AnimationType = keyof typeof animationVariants;

export interface ScrollAnimationWrapperProps {
  children: React.ReactNode;
  animation?: AnimationType;
  duration?: number;
  delay?: number;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Composant wrapper qui ajoute une animation au défilement
 */
export const ScrollAnimationWrapper: React.FC<ScrollAnimationWrapperProps> = ({
  children,
  animation = 'slideUp',
  duration = animationDurations.normal,
  delay = 0,
  className = '',
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true,
}) => {
  const { ref, isVisible } = useScrollAnimation({
    threshold,
    rootMargin,
    triggerOnce,
  });

  const variants = animationVariants[animation];

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      variants={variants}
      transition={{
        duration,
        delay,
        ease: 'easeOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Composant pour les listes avec animations en cascade
 */
export interface ScrollAnimationListProps {
  children: React.ReactNode[];
  animation?: AnimationType;
  itemDuration?: number;
  containerDelay?: number;
  staggerDelay?: number;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const ScrollAnimationList: React.FC<ScrollAnimationListProps> = ({
  children,
  animation = 'slideUp',
  itemDuration = animationDurations.normal,
  containerDelay = 0,
  staggerDelay = 0.1,
  className = '',
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true,
}) => {
  const { ref, isVisible } = useScrollAnimation({
    threshold,
    rootMargin,
    triggerOnce,
  });

  const variants = animationVariants[animation];

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: containerDelay,
          },
        },
      }}
    >
      {React.Children.map(children, (child) => (
        <motion.div
          variants={variants}
          transition={{
            duration: itemDuration,
            ease: 'easeOut',
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

/**
 * Composant pour les grilles avec animations
 */
export interface ScrollAnimationGridProps {
  children: React.ReactNode[];
  animation?: AnimationType;
  itemDuration?: number;
  containerDelay?: number;
  staggerDelay?: number;
  columns?: number;
  gap?: string;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const ScrollAnimationGrid: React.FC<ScrollAnimationGridProps> = ({
  children,
  animation = 'slideUp',
  itemDuration = animationDurations.normal,
  containerDelay = 0,
  staggerDelay = 0.08,
  columns = 3,
  gap = 'gap-6',
  className = '',
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true,
}) => {
  const { ref, isVisible } = useScrollAnimation({
    threshold,
    rootMargin,
    triggerOnce,
  });

  const variants = animationVariants[animation];

  return (
    <motion.div
      ref={ref}
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} ${gap} ${className}`}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: containerDelay,
          },
        },
      }}
    >
      {React.Children.map(children, (child) => (
        <motion.div
          variants={variants}
          transition={{
            duration: itemDuration,
            ease: 'easeOut',
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};
