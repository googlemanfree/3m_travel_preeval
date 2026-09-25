// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

(globalThis as any).React = React;

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import ReviewInvitationPanel from "@/components/ReviewInvitationPanel";
import {
  REVIEW_FORM_ANCHOR,
  REVIEW_PAGE_URL,
  REVIEW_SERVICE_OPTIONS,
  buildReviewInviteMessage,
  buildReviewInviteUrl,
  buildReviewInviteWhatsAppUrl,
  parseReviewInviteParams,
} from "@/lib/reviewInvitation";

afterEach(cleanup);

const source = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");

describe("lien d'invitation", () => {
  it("construit un lien vers la section du formulaire, avec service et pays encodés", () => {
    expect(buildReviewInviteUrl({})).toBe(`${REVIEW_PAGE_URL}#${REVIEW_FORM_ANCHOR}`);
    expect(buildReviewInviteUrl({ serviceType: "Visa Études", destinationCountry: "Côte d’Ivoire" })).toBe(`${REVIEW_PAGE_URL}?service=Visa+%C3%89tudes&destination=C%C3%B4te+d%E2%80%99Ivoire#${REVIEW_FORM_ANCHOR}`);
  });

  it("ignore un service inconnu et nettoie le pays", () => {
    expect(buildReviewInviteUrl({ serviceType: "Service inventé", destinationCountry: "  Canada\u0000  " })).toBe(`${REVIEW_PAGE_URL}?destination=Canada#${REVIEW_FORM_ANCHOR}`);
  });

  it("le formulaire relit prudemment les paramètres : service connu seulement, pays borné, rien d'autre", () => {
    expect(parseReviewInviteParams("?service=Visa+Travail&destination=Canada")).toEqual({ serviceType: "Visa Travail", destinationCountry: "Canada" });
    expect(parseReviewInviteParams("service=E-Visa")).toEqual({ serviceType: "E-Visa" });
    expect(parseReviewInviteParams("?service=<script>&destination=")).toEqual({});
    expect(parseReviewInviteParams("?email=a@b.cm&name=Aicha&rating=1&consent=1")).toEqual({});
    expect(parseReviewInviteParams(`?destination=${"x".repeat(300)}`).destinationCountry).toHaveLength(100);
    expect(parseReviewInviteParams("")).toEqual({});
    // aller-retour : ce que l'équipe génère est exactement ce que le formulaire reprend
    for (const service of REVIEW_SERVICE_OPTIONS) {
      const url = new URL(buildReviewInviteUrl({ serviceType: service, destinationCountry: "France" }));
      expect(parseReviewInviteParams(url.search)).toEqual({ serviceType: service, destinationCountry: "France" });
    }
  });
});

describe("message d'invitation", () => {
  it("est neutre (avis positif ou critique), annonce l'accord de publication, et contient le lien", () => {
    const message = buildReviewInviteMessage({ firstName: "Aïcha", url: "https://exemple/avis" });
    expect(message.startsWith("Bonjour Aïcha,")).toBe(true);
    expect(message).toContain("positif ou critique");
    expect(message).toContain("n’est publié qu’avec votre accord");
    expect(message).toContain("https://exemple/avis");
    expect(message).not.toMatch(/5 étoiles|cinq étoiles|note maximale|garanti/i);
    expect(buildReviewInviteMessage({ url: "u" }).startsWith("Bonjour,")).toBe(true);
  });

  it("le lien WhatsApp vise le numéro valide, sinon laisse choisir le contact", () => {
    const message = "Bonjour";
    expect(buildReviewInviteWhatsAppUrl({ phone: "+237 6 98 10 48 32", message })).toBe("https://wa.me/237698104832?text=Bonjour");
    expect(buildReviewInviteWhatsAppUrl({ phone: "12", message })).toBe("https://wa.me/?text=Bonjour");
    expect(buildReviewInviteWhatsAppUrl({ phone: "abc", message })).toBe("https://wa.me/?text=Bonjour");
    expect(buildReviewInviteWhatsAppUrl({ message })).toBe("https://wa.me/?text=Bonjour");
  });
});

describe("panneau administrateur", () => {
  it("met à jour le message et le lien WhatsApp avec les champs, sans rien envoyer", () => {
    render(<ReviewInvitationPanel />);
    const message = () => (screen.getByLabelText(/Message à envoyer/) as HTMLTextAreaElement).value;
    const whatsapp = () => (screen.getByRole("link", { name: /Ouvrir WhatsApp/ }) as HTMLAnchorElement).href;
    expect(message().startsWith("Bonjour,")).toBe(true);

    fireEvent.change(screen.getByLabelText(/Prénom du client/), { target: { value: "Aïcha" } });
    fireEvent.change(screen.getByLabelText(/Numéro WhatsApp/), { target: { value: "237 698 104 832" } });
    fireEvent.change(screen.getByLabelText(/Service concerné/), { target: { value: "Visa Visiteur" } });
    fireEvent.change(screen.getByLabelText(/Pays de destination/), { target: { value: "France" } });

    expect(message().startsWith("Bonjour Aïcha,")).toBe(true);
    expect(message()).toContain("service=Visa+Visiteur&destination=France");
    expect(whatsapp().startsWith("https://wa.me/237698104832?text=")).toBe(true);
    expect((screen.getByRole("link", { name: /Ouvrir WhatsApp/ }) as HTMLAnchorElement).target).toBe("_blank");
  });

  it("rappelle de ne pas trier les clients invités, et propose de copier le message", () => {
    render(<ReviewInvitationPanel />);
    expect(screen.getByText(/ne triez pas/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Copier le message/ })).toBeTruthy();
  });
});

describe("branchements", () => {
  it("le formulaire public préremplit depuis le lien et la page d'administration affiche le panneau", () => {
    expect(source("client/src/pages/SubmitReview.tsx")).toContain("parseReviewInviteParams(");
    expect(source("client/src/pages/AdminCustomerReviews.tsx")).toContain("<ReviewInvitationPanel />");
  });

  it("l'ancre du lien existe bien sur la page /avis", () => {
    expect(source("client/src/pages/Avis.tsx")).toContain(`id="${REVIEW_FORM_ANCHOR}"`);
  });
});
