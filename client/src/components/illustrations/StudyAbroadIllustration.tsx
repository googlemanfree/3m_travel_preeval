/**
 * Illustration originale — Études à l'étranger (diplôme + livre + globe)
 * Création propre pour 3M Travel & Services, aucune ressource externe.
 */
export default function StudyAbroadIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 500 400" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sa-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eef2ff" />
          <stop offset="100%" stopColor="#f5f7ff" />
        </linearGradient>
      </defs>
      <rect width="500" height="400" fill="url(#sa-bg)" rx="24" />

      {/* Livre ouvert */}
      <g transform="translate(150,220)">
        <path d="M0,0 Q80,-30 160,0 L160,90 Q80,60 0,90 Z" fill="#2563eb" />
        <path d="M160,0 Q240,-30 320,0 L320,90 Q240,60 160,90 Z" fill="#1e3a8a" />
        <line x1="30" y1="10" x2="140" y2="-5" stroke="#93c5fd" strokeWidth="3" opacity="0.7" />
        <line x1="30" y1="30" x2="140" y2="15" stroke="#93c5fd" strokeWidth="3" opacity="0.7" />
        <line x1="30" y1="50" x2="140" y2="35" stroke="#93c5fd" strokeWidth="3" opacity="0.7" />
        <line x1="180" y1="-5" x2="290" y2="10" stroke="#60a5fa" strokeWidth="3" opacity="0.7" />
        <line x1="180" y1="15" x2="290" y2="30" stroke="#60a5fa" strokeWidth="3" opacity="0.7" />
        <line x1="180" y1="35" x2="290" y2="50" stroke="#60a5fa" strokeWidth="3" opacity="0.7" />
      </g>

      {/* Chapeau de diplôme */}
      <g transform="translate(200,90)">
        <polygon points="60,0 120,25 60,50 0,25" fill="#1e3a8a" />
        <rect x="45" y="25" width="30" height="28" fill="#2563eb" />
        <circle cx="120" cy="25" r="4" fill="#fbbf24" />
        <line x1="120" y1="25" x2="130" y2="60" stroke="#fbbf24" strokeWidth="2" />
        <circle cx="130" cy="64" r="5" fill="#fbbf24" />
      </g>

      {/* Petits globes/étoiles décoratifs */}
      <circle cx="90" cy="140" r="14" fill="#fbbf24" opacity="0.9" />
      <circle cx="410" cy="150" r="10" fill="#60a5fa" opacity="0.8" />
      <circle cx="420" cy="260" r="16" fill="#2563eb" opacity="0.25" />
      <circle cx="70" cy="300" r="10" fill="#1e3a8a" opacity="0.2" />

      {/* Avion en fond, discret */}
      <g transform="translate(360,80) rotate(20)" opacity="0.5">
        <path d="M0,0 L26,3 L32,0 L26,-3 L14,-10 L10,-10 L14,-2 L3,-3 L-1,-6 L-4,-6 L-1,0 L-4,6 L-1,6 L3,3 L14,1 L10,10 L14,10 Z" fill="#1e3a8a" />
      </g>
    </svg>
  );
}
