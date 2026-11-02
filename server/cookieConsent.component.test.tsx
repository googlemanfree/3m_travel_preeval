// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

import CookieConsent from "@/components/CookieConsent";
import { ANALYTICS_CONSENT_KEY, openCookieSettings, readAnalyticsConsent } from "@/lib/analyticsConsent";

const root = resolve(import.meta.dirname, "..");

beforeEach(() => {
  window.localStorage.clear();
  window.history.pushState({}, "", "/");
  (window as any).__load3mAnalytics = vi.fn();
});

afterEach(() => {
  cleanup();
  delete (window as any).__load3mAnalytics;
});

describe("bandeau de consentement aux cookies de mesure d'audience", () => {
  it("s'affiche à la première visite et ne charge aucune mesure d'audience", () => {
    render(<CookieConsent />);
    expect(screen.getByTestId("cookie-consent")).toBeTruthy();
    expect(screen.getByRole("dialog").getAttribute("aria-labelledby")).toBe("cookie-consent-title");
    expect((window as any).__load3mAnalytics).not.toHaveBeenCalled();
    expect(readAnalyticsConsent()).toBeNull();
  });

  it("« Accepter » mémorise le choix et charge la mesure d'audience une fois", () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByTestId("cookie-accept"));
    expect(window.localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe("granted");
    expect((window as any).__load3mAnalytics).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("cookie-consent")).toBeNull();
  });

  it("« Refuser » mémorise le refus, ne charge rien et désactive Google Analytics", () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByTestId("cookie-refuse"));
    expect(window.localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe("denied");
    expect((window as any).__load3mAnalytics).not.toHaveBeenCalled();
    expect((window as any)["ga-disable-G-4HBHHH37VL"]).toBe(true);
    expect(screen.queryByTestId("cookie-consent")).toBeNull();
  });

  it("ne réapparaît pas une fois le choix fait, sauf si le visiteur le rouvre depuis la politique de confidentialité", () => {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, "denied");
    render(<CookieConsent />);
    expect(screen.queryByTestId("cookie-consent")).toBeNull();
    fireEvent.click(document.body); // aucune réouverture involontaire
    act(() => openCookieSettings());
    expect(screen.getByTestId("cookie-consent")).toBeTruthy();
  });

  it("n'apparaît pas dans l'espace administrateur", () => {
    window.history.pushState({}, "", "/admin");
    render(<CookieConsent />);
    expect(screen.queryByTestId("cookie-consent")).toBeNull();
  });
});

describe("index.html : aucune mesure d'audience avant consentement", () => {
  const html = readFileSync(resolve(root, "client/index.html"), "utf8");

  it("le chargement de Google Analytics et d'Umami est conditionné au consentement « granted »", () => {
    expect(html).toContain("window.__load3mAnalytics = function");
    expect(html).toContain("localStorage.getItem('3m-analytics-consent')");
    expect(html).toMatch(/if \(consent !== 'granted'\) return;/);
    // Les scripts tiers ne sont créés qu'à l'intérieur de la fonction de chargement.
    const afterLoader = html.slice(html.indexOf("window.__load3mAnalytics = function"));
    expect(afterLoader.indexOf("googletagmanager.com/gtag/js")).toBeGreaterThan(0);
    const beforeLoader = html.slice(0, html.indexOf("window.__load3mAnalytics = function"));
    expect(beforeLoader).not.toContain("googletagmanager.com/gtag/js");
    expect(beforeLoader).not.toContain("/umami");
  });

  it("la politique de confidentialité décrit les cookies de mesure et permet de modifier le choix", () => {
    const policy = readFileSync(resolve(root, "client/src/pages/PolitiqueConfidentialite.tsx"), "utf8");
    expect(policy).toContain('data-testid="cookies-analytics-policy"');
    expect(policy).toContain("openCookieSettings");
    expect(policy).toContain('id="cookies"');
    expect(readFileSync(resolve(root, "client/src/App.tsx"), "utf8")).toContain("<CookieConsent />");
  });
});
