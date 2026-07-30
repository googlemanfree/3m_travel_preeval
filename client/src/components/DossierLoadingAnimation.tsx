import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Loader } from 'lucide-react';

interface DossierLoadingAnimationProps {
  isLoading: boolean;
  status?: 'loading' | 'success' | 'error';
  message?: string;
  dossierNumber?: string;
}

export function DossierLoadingAnimation({
  isLoading,
  status = 'loading',
  message = 'Vérification de votre dossier...',
  dossierNumber = '',
}: DossierLoadingAnimationProps) {
  const [displayedNumber, setDisplayedNumber] = useState('');
  const [animationPhase, setAnimationPhase] = useState<'scanning' | 'verifying' | 'complete'>('scanning');

  // Animation du numéro de dossier
  useEffect(() => {
    if (!isLoading && dossierNumber) {
      let index = 0;
      const interval = setInterval(() => {
        if (index <= dossierNumber.length) {
          setDisplayedNumber(dossierNumber.slice(0, index));
          index++;
        } else {
          clearInterval(interval);
          setAnimationPhase('complete');
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isLoading, dossierNumber]);

  // Animation des phases
  useEffect(() => {
    if (isLoading) {
      const phases = ['scanning', 'verifying'];
      let currentPhase = 0;
      const interval = setInterval(() => {
        setAnimationPhase(phases[currentPhase % phases.length] as 'scanning' | 'verifying');
        currentPhase++;
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  if (!isLoading && status === 'loading') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-300">
        {/* Header avec icône */}
        <div className="flex justify-center mb-6">
          {isLoading ? (
            <div className="relative w-20 h-20">
              {/* Cercle animé */}
              <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-blue-600 animate-spin" />
              {/* Icône au centre */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
            </div>
          ) : status === 'success' ? (
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-green-100 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 animate-bounce" />
              </div>
            </div>
          ) : (
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-red-100 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-red-600" />
              </div>
            </div>
          )}
        </div>

        {/* Titre */}
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          {isLoading ? 'Vérification en cours' : status === 'success' ? 'Dossier trouvé!' : 'Erreur'}
        </h2>

        {/* Message */}
        <p className="text-center text-gray-600 mb-6">{message}</p>

        {/* Numéro de dossier avec animation */}
        {dossierNumber && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Numéro de dossier</p>
            <p className="text-xl font-mono font-bold text-blue-600 tracking-wider">
              {displayedNumber}
              {isLoading && <span className="animate-pulse">_</span>}
            </p>
          </div>
        )}

        {/* Phases d'animation */}
        {isLoading && (
          <div className="space-y-3 mb-6">
            {/* Phase 1: Scanning */}
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full transition-all ${animationPhase === 'scanning' ? 'bg-blue-600 scale-125' : 'bg-gray-300'}`} />
              <span className={`text-sm ${animationPhase === 'scanning' ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                Recherche du dossier...
              </span>
            </div>

            {/* Phase 2: Verifying */}
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full transition-all ${animationPhase === 'verifying' ? 'bg-blue-600 scale-125' : 'bg-gray-300'}`} />
              <span className={`text-sm ${animationPhase === 'verifying' ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                Vérification des données...
              </span>
            </div>
          </div>
        )}

        {/* Barre de progression */}
        {isLoading && (
          <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full animate-pulse" style={{
              width: animationPhase === 'scanning' ? '33%' : '66%',
              transition: 'width 0.3s ease-in-out'
            }} />
          </div>
        )}

        {/* Message d'attente */}
        {isLoading && (
          <p className="text-xs text-center text-gray-400 animate-pulse">
            Veuillez patienter...
          </p>
        )}
      </div>
    </div>
  );
}
