/**
 * Illustration originale — Mobilité internationale (avion + globe + trajet)
 * Création propre pour 3M Travel & Services, aucune ressource externe.
 */
export default function GlobalMobilityIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 500 400" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gm-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="100%" stopColor="#eff6ff" />
        </linearGradient>
        <linearGradient id="gm-globe" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
      <rect width="500" height="400" fill="url(#gm-sky)" rx="24" />

      {/* Globe */}
      <circle cx="250" cy="220" r="120" fill="url(#gm-globe)" opacity="0.95" />
      <ellipse cx="250" cy="220" rx="120" ry="40" fill="none" stroke="#93c5fd" strokeWidth="2" opacity="0.6" />
      <ellipse cx="250" cy="220" rx="60" ry="120" fill="none" stroke="#93c5fd" strokeWidth="2" opacity="0.6" />
      <ellipse cx="250" cy="220" rx="100" ry="120" fill="none" stroke="#93c5fd" strokeWidth="1.5" opacity="0.4" />
      <line x1="130" y1="220" x2="370" y2="220" stroke="#93c5fd" strokeWidth="1.5" opacity="0.5" />

      {/* Points de destination */}
      <circle cx="200" cy="170" r="6" fill="#fbbf24" />
      <circle cx="300" cy="260" r="6" fill="#fbbf24" />
      <circle cx="220" cy="270" r="6" fill="#fbbf24" />
      <path d="M200,170 Q250,140 300,260" stroke="#fbbf24" strokeWidth="2" fill="none" strokeDasharray="4 4" opacity="0.8" />
      <path d="M220,270 Q260,230 300,260" stroke="#fbbf24" strokeWidth="2" fill="none" strokeDasharray="4 4" opacity="0.8" />

      {/* Avion */}
      <g transform="translate(330,120) rotate(35)">
        <path d="M0,0 L36,4 L44,0 L36,-4 L20,-14 L14,-14 L20,-2 L4,-4 L-2,-8 L-6,-8 L-2,0 L-6,8 L-2,8 L4,4 L20,2 L14,14 L20,14 Z" fill="#ffffff" stroke="#1e3a8a" strokeWidth="1.5" />
      </g>
      <path d="M330,120 Q280,90 220,110" stroke="#ffffff" strokeWidth="2" fill="none" strokeDasharray="3 5" opacity="0.9" />

      {/* Valise */}
      <g transform="translate(90,300)">
        <rect x="0" y="10" width="60" height="45" rx="6" fill="#2563eb" />
        <rect x="18" y="0" width="24" height="14" rx="4" fill="none" stroke="#2563eb" strokeWidth="4" />
        <rect x="10" y="28" width="40" height="6" rx="2" fill="#93c5fd" />
      </g>

      {/* Passeport */}
      <g transform="translate(370,300) rotate(-8)">
        <rect x="0" y="0" width="44" height="58" rx="4" fill="#1e3a8a" />
        <circle cx="22" cy="24" r="10" fill="none" stroke="#fbbf24" strokeWidth="2" />
        <rect x="8" y="42" width="28" height="4" rx="2" fill="#93c5fd" />
      </g>
    </svg>
  );
}
