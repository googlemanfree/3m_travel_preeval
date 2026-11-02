// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

(globalThis as any).React = React;

if (!("IntersectionObserver" in globalThis)) {
  class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(globalThis, "IntersectionObserver", { configurable: true, writable: true, value: MockIntersectionObserver });
}

vi.mock("@/components/SocialShareButtons", () => ({ SocialShareButtons: () => null }));

import GuidePage from "@/pages/GuidePage";
import GuidesHub from "@/pages/GuidesHub";
import { GUIDES } from "@/data/guidesData";

afterEach(() => {
  cleanup();
  window.history.pushState({}, "", "/");
});

describe("page /guides", () => {
  it("liste les six guides avec un lien chacun et un seul titre de niveau 1", () => {
    render(<GuidesHub />);
    const list = screen.getByTestId("guides-list");
    for (const guide of GUIDES) expect(within(list).getAllByRole("link", { name: new RegExp(guide.title.slice(0, 20)) })[0].getAttribute("href")).toBe(`/guides/${guide.slug}`);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Guides pratiques mobilité | 3M TRAVEL AGENCY");
  });
});

describe("page /guides/:slug", () => {
  it("affiche le sommaire, les sections, la FAQ, les sources datées et des données structurées valides", () => {
    window.history.pushState({}, "", "/guides/legalisation-apostille-traduction");
    const { container } = render(<GuidePage />);
    const guide = GUIDES[0];
    const toc = screen.getByTestId("guide-toc");
    for (const section of guide.sections) {
      expect(within(toc).getByRole("link", { name: section.title }).getAttribute("href")).toBe(`#${section.id}`);
      expect(screen.getByTestId(`guide-section-${section.id}`).id).toBe(section.id);
    }
    for (const item of guide.faq) expect(screen.getByText(item.question)).toBeTruthy();
    expect(screen.getByTestId("guide-sources").textContent).toContain("consultée le 2026-10-17");
    const script = container.querySelector('script[type="application/ld+json"]');
    const data = JSON.parse(script!.textContent as string);
    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity).toHaveLength(guide.faq.length);
    expect(script!.textContent).not.toContain("<");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Légalisation, apostille et traduction | 3M TRAVEL AGENCY");
  });

  it("un guide inconnu affiche une page d'aide avec retour à la liste", () => {
    window.history.pushState({}, "", "/guides/inconnu");
    render(<GuidePage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Guide introuvable");
    expect(screen.getByRole("link", { name: "Voir tous les guides" }).getAttribute("href")).toBe("/guides");
  });
});
