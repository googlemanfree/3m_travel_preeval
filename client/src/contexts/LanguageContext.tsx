import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { normalizeLanguage, type SupportedLanguage } from "@shared/languagePreference";

type Language = SupportedLanguage;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (frText: string, enText: string) => string;
}

const LANGUAGE_STORAGE_KEY = "3m_travel_lang";
const LANGUAGE_COOKIE_KEY = "3m_travel_lang";
const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const LANGUAGE_MANUAL_STORAGE_KEY = "3m_travel_lang_manual";

const LanguageContext = createContext<LanguageContextType>({
  language: "fr",
  setLanguage: () => {},
  t: (fr) => fr,
});

function readCookieLanguage(): Language | null {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LANGUAGE_COOKIE_KEY}=`));
  if (!cookie) return null;
  const value = decodeURIComponent(cookie.slice(LANGUAGE_COOKIE_KEY.length + 1));
  return value === "fr" || value === "en" ? value : null;
}

function readStoredLanguage(): { language: Language | null; explicit: boolean } {
  let language: Language | null = null;
  let explicit = false;
  try {
    const local = typeof window !== "undefined" ? window.localStorage.getItem(LANGUAGE_STORAGE_KEY) : null;
    if (local === "fr" || local === "en") language = local;
    explicit = window.localStorage.getItem(LANGUAGE_MANUAL_STORAGE_KEY) === "1";
  } catch {
    // localStorage peut être indisponible en navigation privée.
  }
  return { language: language ?? readCookieLanguage(), explicit };
}

function detectBrowserLanguage(): Language {
  if (typeof navigator === "undefined") return "fr";
  const values = [navigator.language, ...(navigator.languages ?? [])];
  return values.some((value) => value?.toLowerCase().startsWith("en")) ? "en" : "fr";
}

function hasCandidateSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(
      window.localStorage.getItem("3m_candidate_token") ||
      window.sessionStorage.getItem("3m_candidate_token")
    );
  } catch {
    return false;
  }
}

function persistClientLanguage(language: Language, explicit = false) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Le cookie reste disponible si localStorage est bloqué.
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${LANGUAGE_COOKIE_KEY}=${encodeURIComponent(language)}; Max-Age=${LANGUAGE_COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  if (explicit) {
    try {
      window.localStorage.setItem(LANGUAGE_MANUAL_STORAGE_KEY, "1");
    } catch {
      // Le cookie et le profil restent les sources de persistance disponibles.
    }
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const initialStored = useMemo(() => readStoredLanguage(), []);
  const [language, setLanguageState] = useState<Language>(initialStored.language ?? detectBrowserLanguage());
  const [hasExplicitPreference, setHasExplicitPreference] = useState(initialStored.explicit);
  const { user, loading: authLoading } = useAuth();
  const canSyncProfile = Boolean(user) || hasCandidateSession();
  const profileQuery = trpc.candidate.getProfile.useQuery(undefined, {
    enabled: canSyncProfile,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const updateProfile = trpc.candidate.updateProfile.useMutation({
    onError: (error) => {
      console.warn("[LanguagePreference] Impossible de synchroniser la langue du profil:", error.message);
    },
  });

  useEffect(() => {
    document.documentElement.setAttribute("lang", language);
  }, [language]);

  useEffect(() => {
    if (hasExplicitPreference || authLoading || profileQuery.isLoading) return;

    const profileLanguage = profileQuery.data?.preferredLanguage;
    if (profileLanguage === "fr" || profileLanguage === "en") {
      setLanguageState(profileLanguage);
      setHasExplicitPreference(true);
      persistClientLanguage(profileLanguage);
      return;
    }

    // La détection navigateur devient la préférence locale seulement après
    // avoir vérifié qu'aucune préférence serveur explicite n'existe.
    persistClientLanguage(language, false);
  }, [authLoading, hasExplicitPreference, language, profileQuery.data?.preferredLanguage, profileQuery.isLoading]);

  const setLanguage = (nextLanguage: Language) => {
    const normalized = normalizeLanguage(nextLanguage);
    setLanguageState(normalized);
    setHasExplicitPreference(true);
    persistClientLanguage(normalized, true);

    if (canSyncProfile) {
      updateProfile.mutate({ preferredLanguage: normalized });
    }
  };

  const t = (frText: string, enText: string) => (language === "en" ? enText : frText);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
