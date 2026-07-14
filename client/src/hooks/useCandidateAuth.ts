/**
 * Hook d'authentification pour l'espace candidat.
 * Stocke le JWT dans localStorage et l'injecte dans les headers tRPC.
 */
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "3m_candidate_token";
const CANDIDATE_KEY = "3m_candidate_info";

export interface CandidateInfo {
  id: number;
  fullName: string;
  email: string;
  destination?: string | null;
  dossierStatus?: string | null;
}

export function useCandidateAuth() {
  const [token, setToken] = useState<string | null>(() => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  });
  const [candidate, setCandidate] = useState<CandidateInfo | null>(() => {
    try {
      const raw = localStorage.getItem(CANDIDATE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const login = useCallback((newToken: string, info: CandidateInfo) => {
    localStorage.setItem(STORAGE_KEY, newToken);
    localStorage.setItem(CANDIDATE_KEY, JSON.stringify(info));
    setToken(newToken);
    setCandidate(info);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CANDIDATE_KEY);
    setToken(null);
    setCandidate(null);
  }, []);

  const isAuthenticated = !!token;

  return { token, candidate, isAuthenticated, login, logout };
}

/** Récupère le token candidat depuis localStorage (pour les appels tRPC directs) */
export function getCandidateToken(): string | null {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}
