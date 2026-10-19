// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: null, loading: false }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    candidate: {
      getProfile: { useQuery: () => ({ data: null, isLoading: false }) },
      updateProfile: { useMutation: () => ({ mutate: vi.fn() }) },
    },
  },
}));

import { frenchEquivalentOfEnglishPath, isEnglishSitePath, LanguageProvider, useLanguage } from "@/contexts/LanguageContext";

function Probe() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div>
      <span data-testid="lang">{language}</span>
      <span data-testid="label">{t("Accueil", "Home")}</span>
      <button type="button" onClick={() => setLanguage("fr")}>fr</button>
      <button type="button" onClick={() => setLanguage("en")}>en</button>
    </div>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  document.cookie = "3m_travel_lang=; Max-Age=0; Path=/";
});
afterEach(() => cleanup());

describe("pages anglaises /en : l'interface est anglaise", () => {
  it("détecte les adresses anglaises et leur équivalent français", () => {
    expect(isEnglishSitePath("/en")).toBe(true);
    expect(isEnglishSitePath("/en/faq")).toBe(true);
    expect(isEnglishSitePath("/enquete")).toBe(false);
    expect(isEnglishSitePath("/evisa/kenya")).toBe(false);
    expect(frenchEquivalentOfEnglishPath("/en")).toBe("/");
    expect(frenchEquivalentOfEnglishPath("/en/faq")).toBe("/faq");
    expect(frenchEquivalentOfEnglishPath("/en/verify-an-agency")).toBe("/verifier-une-agence");
    expect(frenchEquivalentOfEnglishPath("/en/procedures/canada-work")).toBe("/procedures");
  });

  it("sur /en/faq : anglais et <html lang=en> même si le visiteur est en français par défaut", () => {
    window.history.pushState({}, "", "/en/faq");
    render(<LanguageProvider><Probe /></LanguageProvider>);
    expect(screen.getByTestId("lang").textContent).toBe("en");
    expect(screen.getByTestId("label").textContent).toBe("Home");
    expect(document.documentElement.getAttribute("lang")).toBe("en");
  });

  it("sur une page française : français par défaut (rien ne change)", () => {
    window.history.pushState({}, "", "/faq");
    render(<LanguageProvider><Probe /></LanguageProvider>);
    expect(screen.getByTestId("lang").textContent).toBe("fr");
    expect(screen.getByTestId("label").textContent).toBe("Accueil");
    expect(document.documentElement.getAttribute("lang")).toBe("fr");
  });

  it("choisir « fr » depuis /en/faq mène à /faq", () => {
    window.history.pushState({}, "", "/en/faq");
    render(<LanguageProvider><Probe /></LanguageProvider>);
    act(() => screen.getByText("fr").click());
    expect(window.location.pathname).toBe("/faq");
    expect(screen.getByTestId("lang").textContent).toBe("fr");
  });
});
