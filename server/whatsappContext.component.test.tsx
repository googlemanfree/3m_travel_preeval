// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

import { FloatingActionMenu } from "@/components/FloatingActionMenu";
import { DEFAULT_WHATSAPP_MESSAGE, cleanPageTitle, whatsAppMessageForPage } from "@/lib/whatsappContext";

afterEach(() => {
  cleanup();
  window.history.pushState({}, "", "/");
  document.title = "";
});

const textOf = (url: string) => new URL(url).searchParams.get("text") ?? "";

describe("message WhatsApp selon la page", () => {
  it("garde le message d'origine hors des pages connues", () => {
    expect(whatsAppMessageForPage({ pathname: "/" })).toBe(DEFAULT_WHATSAPP_MESSAGE);
    expect(whatsAppMessageForPage({ pathname: "/une-page-inconnue" })).toBe(DEFAULT_WHATSAPP_MESSAGE);
    expect(whatsAppMessageForPage({ pathname: "" })).toBe(DEFAULT_WHATSAPP_MESSAGE);
  });

  it("nomme la procédure consultée d'après le titre de la page, sans marque ni « à Yaoundé »", () => {
    const message = whatsAppMessageForPage({ pathname: "/procedures/suede-etudes", pageTitle: "Visa Suède — Études à Yaoundé | 3M Travel & Services" });
    expect(message).toBe("Bonjour, je consulte la procédure « Visa Suède — Études » sur votre site et j’aimerais parler à un conseiller.");
    expect(whatsAppMessageForPage({ pathname: "/procedures/suede-etudes", pageTitle: "" })).toMatch(/une procédure de visa/);
    expect(whatsAppMessageForPage({ pathname: "/procedures/comparaison", pageTitle: "Comparaison" })).toBe(DEFAULT_WHATSAPP_MESSAGE);
  });

  it("adapte le message aux services (vols, assurance, e-Visa, CNI, tourisme…)", () => {
    expect(whatsAppMessageForPage({ pathname: "/flights" })).toMatch(/réserver un vol/);
    expect(whatsAppMessageForPage({ pathname: "/vols" })).toMatch(/réserver un vol/);
    expect(whatsAppMessageForPage({ pathname: "/assurance" })).toMatch(/assurance voyage/);
    expect(whatsAppMessageForPage({ pathname: "/cni-passeport" })).toMatch(/CNI ou de passeport/);
    expect(whatsAppMessageForPage({ pathname: "/tourisme" })).toMatch(/séjour, un hôtel/);
    expect(whatsAppMessageForPage({ pathname: "/evisas" })).toMatch(/e-Visa/);
    expect(whatsAppMessageForPage({ pathname: "/evisa/kenya", pageTitle: "e-Visa Kenya | 3M Travel" })).toMatch(/« e-Visa Kenya »/);
    expect(whatsAppMessageForPage({ pathname: "/canada?x=1#a" })).toMatch(/Canada/);
  });

  it("nettoie le titre : caractères de contrôle, longueur bornée, aucune donnée injectée", () => {
    expect(cleanPageTitle("  Visa\u0000 Chine\u0007   travail | Marque")).toBe("Visa Chine travail");
    expect(cleanPageTitle(null)).toBe("");
    const long = cleanPageTitle(`${"a".repeat(200)} | x`);
    expect(long.length).toBeLessThanOrEqual(80);
    expect(long.endsWith("…")).toBe(true);
  });

  it("aucun message ne contient de chiffre personnel, d'adresse e-mail ni de promesse", () => {
    const pages = ["/", "/flights", "/assurance", "/procedures/suede-etudes", "/evisa/kenya", "/cni-passeport", "/tourisme", "/tarifs", "/canada", "/schengen", "/etudes", "/formation", "/3m-digital", "/evisas"];
    for (const pathname of pages) {
      const message = whatsAppMessageForPage({ pathname, pageTitle: "Titre de page" });
      expect(message, pathname).not.toMatch(/@|\d{4,}|garanti|assuré/i);
      expect(message.length, pathname).toBeLessThanOrEqual(200);
    }
  });
});

describe("bouton WhatsApp flottant", () => {
  it("préremplit le message de la page au clic, même si le titre a changé après le rendu", () => {
    window.history.pushState({}, "", "/procedures/suede-etudes");
    document.title = "Visa Suède — Études à Yaoundé | 3M Travel & Services";
    render(<FloatingActionMenu />);
    const link = screen.getByRole("link", { name: "Contacter 3M Travel sur WhatsApp" }) as HTMLAnchorElement;
    document.title = "Visa Allemagne — Travail à Yaoundé | 3M Travel & Services";
    fireEvent.click(link);
    expect(link.href.startsWith("https://wa.me/237698104832?text=")).toBe(true);
    expect(textOf(link.href)).toBe("Bonjour, je consulte la procédure « Visa Allemagne — Travail » sur votre site et j’aimerais parler à un conseiller.");
    expect(link.target).toBe("_blank");
    expect(link.rel).toContain("noopener");
  });

  it("met aussi le lien à jour au focus (clavier) et après la pose du titre", async () => {
    window.history.pushState({}, "", "/flights");
    render(<FloatingActionMenu />);
    const link = screen.getByRole("link", { name: "Contacter 3M Travel sur WhatsApp" }) as HTMLAnchorElement;
    expect(textOf(link.href)).toBe(DEFAULT_WHATSAPP_MESSAGE);
    fireEvent.focus(link);
    expect(textOf(link.href)).toMatch(/réserver un vol/);
    window.history.pushState({}, "", "/assurance");
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 450)); });
    fireEvent.focus(link);
    expect(textOf(link.href)).toMatch(/assurance voyage/);
  });
});
