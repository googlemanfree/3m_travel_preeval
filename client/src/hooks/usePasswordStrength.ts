import { useMemo } from "react";

export interface PasswordStrengthResult {
  score: number;
  level: "weak" | "fair" | "good" | "strong" | "very-strong";
  percentage: number;
  color: string;
  message: string;
  recommendations: string[];
  isValid: boolean;
}

type Language = "fr" | "en";

export function usePasswordStrength(password: string, language: Language = "fr"): PasswordStrengthResult {
  return useMemo(() => {
    const t = (fr: string, en: string) => language === "en" ? en : fr;
    const recommendations: string[] = [];
    let score = 0;

    if (!password) return { score: 0, level: "weak", percentage: 0, color: "bg-red-500", message: t("Aucun mot de passe", "No password"), recommendations: [t("Saisissez un mot de passe", "Enter a password")], isValid: false };
    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 5;
    if (password.length >= 16) score += 5;
    if (password.length < 8) recommendations.push(t("Au moins 8 caractères", "At least 8 characters"));
    if (/[A-Z]/.test(password)) score += 15; else recommendations.push(t("Au moins une majuscule", "At least one uppercase letter"));
    if (/[a-z]/.test(password)) score += 15; else recommendations.push(t("Au moins une minuscule", "At least one lowercase letter"));
    if (/\d/.test(password)) score += 15; else recommendations.push(t("Au moins un chiffre", "At least one number"));
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 20; else recommendations.push(t("Au moins un caractère spécial (!@#$%^&*)", "At least one special character (!@#$%^&*)"));
    if (!/(.)\1{2,}/.test(password)) score += 5; else recommendations.push(t("Évitez les caractères répétés (aaa, 111)", "Avoid repeated characters (aaa, 111)"));
    if (!["password", "pass", "123456", "qwerty", "admin", "user", "test"].some(word => password.toLowerCase().includes(word))) score += 5; else recommendations.push(t("Évitez les mots courants", "Avoid common words"));

    const cappedScore = Math.min(score, 100);
    const strength = cappedScore < 20
      ? { level: "weak" as const, color: "bg-red-500", message: t("Très faible", "Very weak") }
      : cappedScore < 40
        ? { level: "fair" as const, color: "bg-orange-500", message: t("Faible", "Weak") }
        : cappedScore < 60
          ? { level: "good" as const, color: "bg-yellow-500", message: t("Acceptable", "Fair") }
          : cappedScore < 80
            ? { level: "strong" as const, color: "bg-lime-500", message: t("Fort", "Strong") }
            : { level: "very-strong" as const, color: "bg-green-600", message: t("Très fort", "Very strong") };
    return { score: cappedScore, percentage: cappedScore, recommendations, isValid: cappedScore >= 60, ...strength };
  }, [password, language]);
}
