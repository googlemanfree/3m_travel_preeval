/**
 * Hook personnalisé pour évaluer la force d'un mot de passe
 * Retourne un score, une description et des recommandations
 */

import { useMemo } from 'react';

export interface PasswordStrengthResult {
  score: number; // 0-100
  level: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  percentage: number;
  color: string;
  message: string;
  recommendations: string[];
  isValid: boolean;
}

export function usePasswordStrength(password: string): PasswordStrengthResult {
  return useMemo(() => {
    const recommendations: string[] = [];
    let score = 0;

    // Vérifications de base
    if (!password) {
      return {
        score: 0,
        level: 'weak',
        percentage: 0,
        color: 'bg-red-500',
        message: 'Aucun mot de passe',
        recommendations: ['Entrez un mot de passe'],
        isValid: false,
      };
    }

    // Longueur (20 points max)
    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 5;
    if (password.length >= 16) score += 5;
    if (password.length < 8) {
      recommendations.push('Au moins 8 caractères');
    }

    // Majuscules (15 points)
    if (/[A-Z]/.test(password)) {
      score += 15;
    } else {
      recommendations.push('Au moins une lettre majuscule');
    }

    // Minuscules (15 points)
    if (/[a-z]/.test(password)) {
      score += 15;
    } else {
      recommendations.push('Au moins une lettre minuscule');
    }

    // Chiffres (15 points)
    if (/\d/.test(password)) {
      score += 15;
    } else {
      recommendations.push('Au moins un chiffre');
    }

    // Caractères spéciaux (20 points)
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 20;
    } else {
      recommendations.push('Au moins un caractère spécial (!@#$%^&*)');
    }

    // Pas de caractères répétés (5 points)
    if (!/(.)\1{2,}/.test(password)) {
      score += 5;
    } else {
      recommendations.push('Évitez les caractères répétés (aaa, 111)');
    }

    // Pas de mots courants (5 points)
    const commonWords = ['password', 'pass', '123456', 'qwerty', 'admin', 'user', 'test'];
    if (!commonWords.some(word => password.toLowerCase().includes(word))) {
      score += 5;
    } else {
      recommendations.push('Évitez les mots courants');
    }

    // Déterminer le niveau et la couleur
    let level: PasswordStrengthResult['level'];
    let color: string;
    let message: string;

    if (score < 20) {
      level = 'weak';
      color = 'bg-red-500';
      message = '🔴 Très faible';
    } else if (score < 40) {
      level = 'fair';
      color = 'bg-orange-500';
      message = '🟠 Faible';
    } else if (score < 60) {
      level = 'good';
      color = 'bg-yellow-500';
      message = '🟡 Acceptable';
    } else if (score < 80) {
      level = 'strong';
      color = 'bg-lime-500';
      message = '🟢 Fort';
    } else {
      level = 'very-strong';
      color = 'bg-green-600';
      message = '✅ Très fort';
    }

    // Capper le score à 100
    const cappedScore = Math.min(score, 100);

    return {
      score: cappedScore,
      level,
      percentage: cappedScore,
      color,
      message,
      recommendations,
      isValid: cappedScore >= 60, // Valide si au moins 60/100
    };
  }, [password]);
}
