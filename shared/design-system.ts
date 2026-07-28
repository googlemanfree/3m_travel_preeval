/**
 * Design System Unifié - 3M Travel & Services
 * Centralise toutes les constantes visuelles pour assurer la cohérence
 * 
 * Utilisation :
 * import { designSystem } from '@/shared/design-system';
 * 
 * // Couleurs
 * const bgColor = designSystem.colors.primary.royal;
 * 
 * // Typographies
 * const heading = designSystem.typography.h1;
 * 
 * // Espacements
 * const padding = designSystem.spacing.lg;
 * 
 * // Icônes
 * const iconSize = designSystem.icons.sizes.md;
 */

// ─────────────────────────────────────────────────────────────────────────────
// 🎨 PALETTE DE COULEURS UNIFIÉE
// ─────────────────────────────────────────────────────────────────────────────

export const designSystem = {
  colors: {
    // Palette primaire 3M Travel & Services
    primary: {
      royal: '#1E3A8A',      // Bleu royal - Logo anneau extérieur
      mid: '#2563EB',        // Bleu moyen - Accents principaux
      sky: '#7CB9E8',        // Bleu ciel - Accents secondaires
      light: '#DBEAFE',      // Bleu très clair - Backgrounds
    },

    // Palette neutre
    neutral: {
      white: '#FFFFFF',      // Blanc pur
      gray: {
        50: '#F9FAFB',       // Très clair
        100: '#F3F4F6',      // Clair
        200: '#E5E7EB',      // Moyen clair
        300: '#D1D5DB',      // Moyen
        400: '#9CA3AF',      // Moyen foncé
        500: '#6B7280',      // Foncé
        600: '#4B5563',      // Plus foncé
        700: '#374151',      // Très foncé
        800: '#1F2937',      // Extrêmement foncé
        900: '#0F172A',      // Noir presque pur
      },
    },

    // Palette sémantique
    semantic: {
      success: {
        light: '#D1FAE5',
        main: '#10B981',
        dark: '#047857',
      },
      warning: {
        light: '#FEF3C7',
        main: '#F59E0B',
        dark: '#D97706',
      },
      error: {
        light: '#FEE2E2',
        main: '#EF4444',
        dark: '#DC2626',
      },
      info: {
        light: '#DBEAFE',
        main: '#3B82F6',
        dark: '#1D4ED8',
      },
    },

    // Palette de graphiques
    chart: {
      1: '#7CB9E8',  // Bleu ciel
      2: '#3B82F6',  // Bleu
      3: '#2563EB',  // Bleu moyen
      4: '#1E3A8A',  // Bleu royal
      5: '#0F2460',  // Bleu très foncé
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 🔤 TYPOGRAPHIES UNIFIÉES
  // ─────────────────────────────────────────────────────────────────────────

  typography: {
    // Headings
    h1: {
      size: '48px',
      weight: 900,
      lineHeight: '1.2',
      letterSpacing: '-0.02em',
    },
    h2: {
      size: '36px',
      weight: 800,
      lineHeight: '1.25',
      letterSpacing: '-0.01em',
    },
    h3: {
      size: '28px',
      weight: 700,
      lineHeight: '1.3',
      letterSpacing: '0',
    },
    h4: {
      size: '24px',
      weight: 700,
      lineHeight: '1.35',
      letterSpacing: '0',
    },
    h5: {
      size: '20px',
      weight: 600,
      lineHeight: '1.4',
      letterSpacing: '0',
    },
    h6: {
      size: '18px',
      weight: 600,
      lineHeight: '1.4',
      letterSpacing: '0',
    },

    // Body text
    body: {
      lg: {
        size: '18px',
        weight: 400,
        lineHeight: '1.6',
        letterSpacing: '0',
      },
      md: {
        size: '16px',
        weight: 400,
        lineHeight: '1.6',
        letterSpacing: '0',
      },
      sm: {
        size: '14px',
        weight: 400,
        lineHeight: '1.5',
        letterSpacing: '0',
      },
      xs: {
        size: '12px',
        weight: 400,
        lineHeight: '1.5',
        letterSpacing: '0',
      },
    },

    // Labels & captions
    label: {
      lg: {
        size: '16px',
        weight: 600,
        lineHeight: '1.5',
        letterSpacing: '0',
      },
      md: {
        size: '14px',
        weight: 600,
        lineHeight: '1.5',
        letterSpacing: '0',
      },
      sm: {
        size: '12px',
        weight: 600,
        lineHeight: '1.5',
        letterSpacing: '0.5px',
      },
    },

    // Button text
    button: {
      lg: {
        size: '16px',
        weight: 600,
        lineHeight: '1.5',
        letterSpacing: '0',
      },
      md: {
        size: '14px',
        weight: 600,
        lineHeight: '1.5',
        letterSpacing: '0',
      },
      sm: {
        size: '12px',
        weight: 600,
        lineHeight: '1.5',
        letterSpacing: '0',
      },
    },

    // Monospace
    mono: {
      size: '14px',
      weight: 500,
      lineHeight: '1.6',
      letterSpacing: '0',
      fontFamily: 'Menlo, Monaco, Courier New, monospace',
    },

    // Font family
    fontFamily: {
      sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: 'Menlo, Monaco, Courier New, monospace',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 📐 SYSTÈME D'ESPACEMENT UNIFIÉ
  // ─────────────────────────────────────────────────────────────────────────

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '80px',
    '5xl': '96px',
  },

  // Padding standardisé pour composants
  padding: {
    button: {
      xs: { x: '8px', y: '6px' },
      sm: { x: '12px', y: '8px' },
      md: { x: '16px', y: '10px' },
      lg: { x: '24px', y: '12px' },
      xl: { x: '32px', y: '16px' },
    },
    card: {
      xs: '12px',
      sm: '16px',
      md: '24px',
      lg: '32px',
    },
    input: {
      x: '12px',
      y: '10px',
    },
  },

  // Gap standardisé pour flex/grid
  gap: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 🎯 ICÔNES UNIFIÉES
  // ─────────────────────────────────────────────────────────────────────────

  icons: {
    sizes: {
      xs: '12px',
      sm: '16px',
      md: '20px',
      lg: '24px',
      xl: '32px',
      '2xl': '48px',
    },

    // Couleurs d'icônes standardisées
    colors: {
      default: '#0F172A',      // Gris foncé
      primary: '#1E3A8A',      // Bleu royal
      secondary: '#7CB9E8',    // Bleu ciel
      success: '#10B981',      // Vert
      warning: '#F59E0B',      // Orange
      error: '#EF4444',        // Rouge
      disabled: '#9CA3AF',     // Gris moyen
      light: '#FFFFFF',        // Blanc
    },

    // Paires taille/couleur courantes
    presets: {
      // Navigation
      nav: { size: '24px', color: '#1E3A8A' },
      // Boutons
      button: { size: '20px', color: '#FFFFFF' },
      // Formulaires
      form: { size: '16px', color: '#1E3A8A' },
      // Statuts
      status: { size: '20px', color: '#FFFFFF' },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 🎬 ANIMATIONS UNIFIÉES
  // ─────────────────────────────────────────────────────────────────────────

  animations: {
    durations: {
      fast: '100ms',
      normal: '150ms',
      slow: '200ms',
      slower: '300ms',
      slowest: '500ms',
    },

    easings: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOutBack: 'cubic-bezier(0.23, 1, 0.32, 1)',
      easeInOutBack: 'cubic-bezier(0.77, 0, 0.175, 1)',
    },

    // Transitions standardisées
    transitions: {
      // Boutons
      button: 'all 150ms cubic-bezier(0.23, 1, 0.32, 1)',
      // Hover
      hover: 'all 150ms cubic-bezier(0.23, 1, 0.32, 1)',
      // Focus
      focus: 'all 150ms cubic-bezier(0.23, 1, 0.32, 1)',
      // Couleur
      color: 'color 150ms cubic-bezier(0.23, 1, 0.32, 1)',
      // Transform
      transform: 'transform 150ms cubic-bezier(0.23, 1, 0.32, 1)',
      // Opacity
      opacity: 'opacity 150ms cubic-bezier(0.23, 1, 0.32, 1)',
      // Page
      page: 'all 300ms cubic-bezier(0.23, 1, 0.32, 1)',
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 🔲 BORDER RADIUS UNIFIÉ
  // ─────────────────────────────────────────────────────────────────────────

  borderRadius: {
    none: '0',
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    full: '9999px',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 🎨 SHADOWS UNIFIÉES
  // ─────────────────────────────────────────────────────────────────────────

  shadows: {
    none: 'none',
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 📱 BREAKPOINTS
  // ─────────────────────────────────────────────────────────────────────────

  breakpoints: {
    xs: '0px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ♿ ACCESSIBILITÉ
  // ─────────────────────────────────────────────────────────────────────────

  a11y: {
    // Tailles minimales de zone de clic
    minTouchTarget: '44px',
    // Épaisseur minimale du focus ring
    focusRingWidth: '2px',
    // Contraste minimum (WCAG AAA)
    minContrast: '7:1',
    // Durée minimale pour animations (prefers-reduced-motion)
    reducedMotionDuration: '0ms',
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 🎯 COMPOSANTS STANDARDISÉS
  // ─────────────────────────────────────────────────────────────────────────

  components: {
    button: {
      primary: {
        bg: '#1E3A8A',
        text: '#FFFFFF',
        hover: '#152E5F',
        active: '#0F2460',
        disabled: '#9CA3AF',
      },
      secondary: {
        bg: '#2563EB',
        text: '#FFFFFF',
        hover: '#1D4ED8',
        active: '#1E40AF',
        disabled: '#9CA3AF',
      },
      outline: {
        bg: 'transparent',
        text: '#1E3A8A',
        border: '#1E3A8A',
        hover: '#DBEAFE',
        active: '#BFDBFE',
        disabled: '#9CA3AF',
      },
      ghost: {
        bg: 'transparent',
        text: '#1E3A8A',
        hover: '#F3F4F6',
        active: '#E5E7EB',
        disabled: '#9CA3AF',
      },
    },

    card: {
      bg: '#FFFFFF',
      border: '#E5E7EB',
      shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      borderRadius: '12px',
      padding: '24px',
    },

    input: {
      bg: '#FFFFFF',
      border: '#E5E7EB',
      text: '#0F172A',
      placeholder: '#9CA3AF',
      focus: '#3B82F6',
      borderRadius: '8px',
      padding: '10px 12px',
    },

    badge: {
      primary: {
        bg: '#DBEAFE',
        text: '#1E3A8A',
      },
      success: {
        bg: '#D1FAE5',
        text: '#047857',
      },
      warning: {
        bg: '#FEF3C7',
        text: '#D97706',
      },
      error: {
        bg: '#FEE2E2',
        text: '#DC2626',
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 🛠️ UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère une classe CSS pour une transition standardisée
 */
export function getTransition(type: keyof typeof designSystem.animations.transitions) {
  return `transition-all ${designSystem.animations.durations.normal} ${designSystem.animations.easings.easeOut}`;
}

/**
 * Génère une classe CSS pour un focus ring accessible
 */
export function getFocusRing() {
  return `focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[${designSystem.colors.primary.mid}]`;
}

/**
 * Génère une classe CSS pour une zone de clic minimale
 */
export function getMinTouchTarget() {
  return `min-h-[${designSystem.a11y.minTouchTarget}] min-w-[${designSystem.a11y.minTouchTarget}]`;
}

/**
 * Génère une classe CSS pour respecter prefers-reduced-motion
 */
export function getReducedMotion() {
  return `@media (prefers-reduced-motion: reduce) { animation: none !important; transition: none !important; }`;
}

export default designSystem;
