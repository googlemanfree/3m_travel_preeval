/**
 * Illustration originale — Traitement de dossier / démarches administratives
 * Création propre pour 3M Travel & Services, aucune ressource externe.
 */
export default function DocumentProcessIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 500 400" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="dp-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#eff6ff" />
          <stop offset="100%" stopColor="#e0e7ff" />
        </linearGradient>
      </defs>
      <rect width="500" height="400" fill="url(#dp-bg)" rx="24" />

      {/* Pile de documents */}
      <g transform="translate(150,120)">
        <rect x="16" y="16" width="140" height="180" rx="8" fill="#93c5fd" />
        <rect x="8" y="8" width="140" height="180" rx="8" fill="#60a5fa" />
        <rect x="0" y="0" width="140" height="180" rx="8" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
        <line x1="20" y1="30" x2="120" y2="30" stroke="#dbeafe" strokeWidth="8" />
        <line x1="20" y1="55" x2="100" y2="55" stroke="#dbeafe" strokeWidth="8" />
        <line x1="20" y1="80" x2="110" y2="80" stroke="#dbeafe" strokeWidth="8" />
        <line x1="20" y1="105" x2="90" y2="105" stroke="#dbeafe" strokeWidth="8" />
        <circle cx="70" cy="150" r="26" fill="none" stroke="#22c55e" strokeWidth="5" />
        <path d="M58,150 L67,159 L84,140" fill="none" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Loupe d'analyse */}
      <g transform="translate(320,240)">
        <circle cx="0" cy="0" r="36" fill="none" stroke="#1e3a8a" strokeWidth="8" />
        <line x1="26" y1="26" x2="55" y2="55" stroke="#1e3a8a" strokeWidth="9" strokeLinecap="round" />
      </g>

      {/* Tampon */}
      <g transform="translate(370,100) rotate(-15)">
        <rect x="-30" y="-20" width="60" height="40" rx="6" fill="none" stroke="#dc2626" strokeWidth="3" />
        <text x="0" y="6" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#dc2626" fontFamily="Arial, sans-serif">OK</text>
      </g>

      {/* Étoiles décoratives */}
      <circle cx="90" cy="80" r="8" fill="#fbbf24" opacity="0.8" />
      <circle cx="430" cy="300" r="12" fill="#2563eb" opacity="0.2" />
      <circle cx="60" cy="330" r="10" fill="#60a5fa" opacity="0.4" />
    </svg>
  );
}
