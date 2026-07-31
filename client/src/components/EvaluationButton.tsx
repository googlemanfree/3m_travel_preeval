import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useCandidateAuth } from '@/hooks/useCandidateAuth';

interface EvaluationButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export default function EvaluationButton({
  variant = 'primary',
  size = 'md',
  className = '',
  children = '⭐ Évaluer mon profil'
}: EvaluationButtonProps) {
  const { candidate } = useCandidateAuth();
  const [, setLocation] = useLocation();

  // Sauvegarde localStorage de la tentative d'évaluation
  const handleEvaluationClick = () => {
    // Sauvegarder la tentative
    localStorage.setItem('evaluation_attempt', JSON.stringify({
      timestamp: new Date().toISOString(),
      authenticated: !!candidate
    }));

    if (candidate) {
      // Utilisateur connecté → redirection vers /evaluation
      setLocation('/evaluation');
    } else {
      // Utilisateur déconnecté → redirection vers /login
      // Sauvegarder l'intention pour redirection post-login
      localStorage.setItem('redirect_after_login', '/evaluation');
      setLocation('/login');
    }
  };

  // Styles selon la variante
  const variantStyles = {
    primary: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30',
    secondary: 'bg-blue-50/80 hover:bg-blue-100/80 text-blue-700 border border-blue-100',
    tertiary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
  };

  // Styles selon la taille
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg',
    md: 'px-5 py-2.5 text-sm font-bold rounded-xl',
    lg: 'px-6 py-3 text-base font-bold rounded-2xl'
  };

  return (
    <button
      onClick={handleEvaluationClick}
      className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        transition-all duration-200 active:scale-95
        ${className}
      `}
    >
      {children}
    </button>
  );
}
