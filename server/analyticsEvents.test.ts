// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { trackEvent } from "../client/src/lib/analytics";
import { ANALYTICS_CONSENT_KEY } from "../client/src/lib/analyticsConsent";

afterEach(() => {
  window.localStorage.clear();
  delete (window as any).gtag;
});

describe("événements de mesure d'audience", () => {
  it("n'envoie rien sans consentement, même si le script d'analyse est présent", () => {
    const gtag = vi.fn();
    (window as any).gtag = gtag;
    expect(trackEvent("country_guide_view", { country: "Canada" })).toBe(false);
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, "denied");
    expect(trackEvent("country_guide_view")).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
  });

  it("envoie l'événement avec le consentement et ne casse jamais la page sans script", () => {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, "granted");
    expect(trackEvent("country_guide_view")).toBe(false);
    const gtag = vi.fn();
    (window as any).gtag = gtag;
    expect(trackEvent("country_guide_view", { country: "Canada" })).toBe(true);
    expect(gtag).toHaveBeenCalledWith("event", "country_guide_view", { country: "Canada" });
  });
});
