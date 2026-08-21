/**
 * Hook d'authentification pour l'espace candidat.
 * Stocke le JWT dans localStorage et l'injecte dans les headers tRPC.
 */
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "3m_candidate_token";
const CANDIDATE_KEY = "3m_candidate_info";
const EXPIRY_KEY = "3m_candidate_session_expires_at";

export interface CandidateInfo {
  id: number;
  fullName: string;
  email: string;
  destination?: string | null;
  dossierStatus?: string | null;
  emailVerified?: boolean;
}

/** Lit le token depuis localStorage (persistant) ou sessionStorage (session) */
function readToken(): string | null {
  try {
    const token = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    const expiresAt = Number(localStorage.getItem(EXPIRY_KEY) ?? sessionStorage.getItem(EXPIRY_KEY) ?? 0);
    if (expiresAt && expiresAt <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(CANDIDATE_KEY); localStorage.removeItem(EXPIRY_KEY);
      sessionStorage.removeItem(STORAGE_KEY); sessionStorage.removeItem(CANDIDATE_KEY); sessionStorage.removeItem(EXPIRY_KEY);
      return null;
    }
    return token;
  } catch { return null; }
}

function readCandidate(): CandidateInfo | null {
  try {
    const raw = localStorage.getItem(CANDIDATE_KEY) ?? sessionStorage.getItem(CANDIDATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function readSessionExpiry(): number | null {
  try {
    const expiry = Number(localStorage.getItem(EXPIRY_KEY) ?? sessionStorage.getItem(EXPIRY_KEY) ?? 0);
    return expiry > Date.now() ? expiry : null;
  } catch { return null; }
}

export function useCandidateAuth() {
  const [token, setToken] = useState<string | null>(readToken);
  const [candidate, setCandidate] = useState<CandidateInfo | null>(readCandidate);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(readSessionExpiry);

  /**
   * Appelé par Login.tsx qui gère lui-même l'écriture dans localStorage/sessionStorage
   * selon le choix "Se souvenir de moi". Ici on se contente de mettre à jour le state.
   */
  const login = useCallback((newToken: string, info: CandidateInfo) => {
    setToken(newToken);
    setCandidate(info);
    setSessionExpiresAt(readSessionExpiry());
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CANDIDATE_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(CANDIDATE_KEY);
    sessionStorage.removeItem(EXPIRY_KEY);
    setToken(null);
    setCandidate(null);
    setSessionExpiresAt(null);
  }, []);

  const isAuthenticated = !!token;

  return { token, candidate, isAuthenticated, login, logout, sessionExpiresAt, setSessionExpiresAt };
}

/** Récupère le token candidat depuis localStorage ou sessionStorage (pour les appels tRPC directs) */
export function getCandidateToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
  } catch { return null; }
}
