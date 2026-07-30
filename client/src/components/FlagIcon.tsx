import React from 'react';

interface FlagIconProps {
  country: string;
  className?: string;
}

// Composant pour afficher les drapeaux SVG de haute qualité
export const FlagIcon: React.FC<FlagIconProps> = ({ country, className = 'w-12 h-8' }) => {
  const flags: Record<string, React.ReactNode> = {
    'Allemagne': (
      <svg viewBox="0 0 5 3" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="5" height="1" fill="#000"/>
        <rect y="1" width="5" height="1" fill="#D00"/>
        <rect y="2" width="5" height="1" fill="#FFCE00"/>
      </svg>
    ),
    'Australie': (
      <svg viewBox="0 0 7.5 5" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="7.5" height="5" fill="#00008B"/>
        <path d="M0 0 L2.5 1.67 L0 3.33 Z" fill="#FFF"/>
        <path d="M2.5 0 L5 1.67 L2.5 3.33 Z" fill="#FFF"/>
        <path d="M5 0 L7.5 1.67 L5 3.33 Z" fill="#FFF"/>
        <path d="M0 1.67 L2.5 0 L2.5 3.33 Z" fill="#FFF"/>
        <path d="M2.5 1.67 L5 0 L5 3.33 Z" fill="#FFF"/>
        <path d="M5 1.67 L7.5 0 L7.5 3.33 Z" fill="#FFF"/>
      </svg>
    ),
    'Canada': (
      <svg viewBox="0 0 5 3" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="5" height="3" fill="#FF0000"/>
        <rect x="1" width="3" height="3" fill="#FFF"/>
        <path d="M2.5 0.5 L2.7 1.2 L3.4 1.2 L2.85 1.65 L3.05 2.35 L2.5 1.9 L1.95 2.35 L2.15 1.65 L1.6 1.2 L2.3 1.2 Z" fill="#FF0000"/>
      </svg>
    ),
    'France': (
      <svg viewBox="0 0 5 3" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="1.67" height="3" fill="#002395"/>
        <rect x="1.67" width="1.66" height="3" fill="#FFF"/>
        <rect x="3.33" width="1.67" height="3" fill="#ED2939"/>
      </svg>
    ),
    'États-Unis': (
      <svg viewBox="0 0 7.5 4" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="7.5" height="4" fill="#B22234"/>
        <rect y="0.5" width="7.5" height="0.5" fill="#FFF"/>
        <rect y="1.5" width="7.5" height="0.5" fill="#FFF"/>
        <rect y="2.5" width="7.5" height="0.5" fill="#FFF"/>
        <rect width="3" height="2" fill="#3C3B6B"/>
      </svg>
    ),
    'Royaume-Uni': (
      <svg viewBox="0 0 5 3" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="5" height="3" fill="#012169"/>
        <path d="M0 0 L5 3 M5 0 L0 3" stroke="#FFF" strokeWidth="0.6"/>
        <path d="M0 0 L5 3 M5 0 L0 3" stroke="#C8102E" strokeWidth="0.3" strokeDasharray="0.3,0.3"/>
        <rect y="1" width="5" height="1" fill="#FFF"/>
        <rect x="1.67" height="3" width="1.66" fill="#FFF"/>
        <rect y="1.2" width="5" height="0.6" fill="#C8102E"/>
        <rect x="1.9" height="3" width="1.2" fill="#C8102E"/>
      </svg>
    ),
    'Suisse': (
      <svg viewBox="0 0 3 3" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="3" height="3" fill="#FF0000"/>
        <rect x="0.6" y="1.2" width="1.8" height="0.6" fill="#FFF"/>
        <rect x="1.2" y="0.6" width="0.6" height="1.8" fill="#FFF"/>
      </svg>
    ),
    'Nouvelle-Zélande': (
      <svg viewBox="0 0 7.5 5" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="7.5" height="5" fill="#00008B"/>
        <path d="M0 0 L2.5 1.67 L0 3.33 Z" fill="#FFF"/>
        <path d="M2.5 0 L5 1.67 L2.5 3.33 Z" fill="#FFF"/>
        <path d="M5 0 L7.5 1.67 L5 3.33 Z" fill="#FFF"/>
        <circle cx="5" cy="2.5" r="0.5" fill="#FF0000"/>
      </svg>
    ),
    'Irlande': (
      <svg viewBox="0 0 5 3" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="1.67" height="3" fill="#169B62"/>
        <rect x="1.67" width="1.66" height="3" fill="#FFF"/>
        <rect x="3.33" width="1.67" height="3" fill="#FF7F00"/>
      </svg>
    ),
    'Italie': (
      <svg viewBox="0 0 5 3" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="1.67" height="3" fill="#009246"/>
        <rect x="1.67" width="1.66" height="3" fill="#FFF"/>
        <rect x="3.33" width="1.67" height="3" fill="#CE2B37"/>
      </svg>
    ),
    'Pologne': (
      <svg viewBox="0 0 5 3" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="5" height="1.5" fill="#FFF"/>
        <rect y="1.5" width="5" height="1.5" fill="#DC143C"/>
      </svg>
    ),
    'Portugal': (
      <svg viewBox="0 0 5 3" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="2" height="3" fill="#006600"/>
        <rect x="2" width="3" height="3" fill="#FF0000"/>
        <circle cx="2" cy="1.5" r="0.8" fill="#FFD700"/>
      </svg>
    ),
    'Qatar': (
      <svg viewBox="0 0 5 3" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="5" height="3" fill="#8B0000"/>
        <path d="M2 0 Q2.5 0.5 2 1 Q2.5 1.5 2 2 Q2.5 2.5 2 3" fill="#FFF"/>
      </svg>
    ),
    'Malaisie': (
      <svg viewBox="0 0 5 3" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="5" height="1.5" fill="#FF0000"/>
        <rect y="1.5" width="5" height="1.5" fill="#FFF"/>
        <rect width="2" height="3" fill="#0066CC"/>
        <circle cx="1" cy="1.5" r="0.5" fill="#FFD700"/>
      </svg>
    ),
    'Kenya': (
      <svg viewBox="0 0 5 3" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="5" height="1" fill="#000"/>
        <rect y="1" width="5" height="1" fill="#FF0000"/>
        <rect y="2" width="5" height="1" fill="#00AA00"/>
        <rect x="1.5" y="0.75" width="2" height="1.5" fill="#FFF" opacity="0.3"/>
      </svg>
    ),
    'Schengen': (
      <svg viewBox="0 0 5 3" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="5" height="3" fill="#0066CC"/>
        <circle cx="2.5" cy="1.5" r="1.2" fill="#FFD700" opacity="0.8"/>
      </svg>
    ),
  };

  return flags[country] || <span className={className}>🌍</span>;
};

export default FlagIcon;
