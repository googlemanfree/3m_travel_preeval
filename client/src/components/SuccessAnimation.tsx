import { useEffect, useState } from 'react';
import { CheckCircle, Gift, Sparkles } from 'lucide-react';

interface Confetti {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
}

export function SuccessAnimation() {
  const [confetti, setConfetti] = useState<Confetti[]>([]);

  useEffect(() => {
    // Générer des confettis
    const confettiPieces: Confetti[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 1,
      size: 4 + Math.random() * 8,
      color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)],
    }));
    setConfetti(confettiPieces);

    // Nettoyer les confettis après l'animation
    const timer = setTimeout(() => {
      setConfetti([]);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Confettis */}
      {confetti.map(piece => (
        <div
          key={piece.id}
          className="absolute animate-pulse"
          style={{
            left: `${piece.left}%`,
            top: '-10px',
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
            animation: `fall ${piece.duration}s linear ${piece.delay}s forwards`,
            opacity: 0.8,
          }}
        />
      ))}

      {/* Animation du centre */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-32 h-32">
          {/* Cercles d'expansion */}
          <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping" />
          <div
            className="absolute inset-0 rounded-full border-4 border-green-300"
            style={{
              animation: 'scaleOut 1.5s ease-out forwards',
            }}
          />
          <div
            className="absolute inset-0 rounded-full border-4 border-green-200"
            style={{
              animation: 'scaleOut 2s ease-out 0.3s forwards',
            }}
          />

          {/* Icône centrale */}
          <div className="absolute inset-0 flex items-center justify-center">
            <CheckCircle className="w-24 h-24 text-green-600 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Étoiles flottantes */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={`star-${i}`}
          className="absolute"
          style={{
            left: `${25 + (i % 4) * 25}%`,
            top: `${20 + Math.floor(i / 4) * 40}%`,
            animation: `float 3s ease-in-out ${i * 0.1}s infinite`,
          }}
        >
          <Sparkles className="w-6 h-6 text-yellow-400" />
        </div>
      ))}

      {/* Styles CSS */}
      <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes scaleOut {
          to {
            transform: scale(3);
            opacity: 0;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
      `}</style>
    </div>
  );
}
