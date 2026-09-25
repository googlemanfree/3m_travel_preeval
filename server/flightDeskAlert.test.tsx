// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

(globalThis as any).React = React;

import { DEFAULT_DESK_WHATSAPP, buildDeskAlertText, extractDeskAlertData, normalizeWhatsAppNumber, whatsAppLink } from "../shared/flightDeskAlert";
import { buildDeskAlertEmail, resolveDeskRecipients, resolveDeskWhatsApp } from "./services/flightDeskAlert";
import { FlightDeskActions } from "@/components/FlightDeskActions";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");

const flightData = {
  airline: { name: "Royal Air Maroc" },
  flightNumber: "AT 280",
  originCity: "Douala",
  destinationCity: "Paris",
  departureDate: "2026-11-20",
  departureTime: "05:25",
  arrivalTime: "18:40",
  stops: 1,
  cabinClass: "ECONOMY",
  currency: "XAF",
  totalPrice: 440_000,
  quotedTotalPrice: 440_100,
  returnFlight: { airline: { name: "Royal Air Maroc" }, flightNumber: "AT 789", originCity: "Paris", destinationCity: "Douala", departureDate: "2026-12-05", departureTime: "17:35", arrivalTime: "23:50", stops: 1 },
};
const passengerData = [{ fullName: "Aïcha Nkolo", email: "aicha@example.com", phone: "6 98 10 48 32", comment: "Bagage en soute souhaité", travelers: 2 }];
const request = { requestRef: "FB-2026-ABC123", priority: "urgent", flightData, passengerData, candidateEmail: "aicha@example.com" };
const data = extractDeskAlertData({ ...request, requesterEmail: request.candidateEmail });

afterEach(cleanup);

describe("données de la demande pour le comptoir", () => {
  it("extrait client, voyage, retour et tarif retenu (celui du retour choisi), sans rien inventer", () => {
    expect(data).toMatchObject({ requestRef: "FB-2026-ABC123", priority: "URGENTE", passengerName: "Aïcha Nkolo", passengerPhone: "6 98 10 48 32", travelers: 2, cabin: "Économique", quotedTotalPrice: 440_100, currency: "XAF" });
    expect(data.outbound).toMatchObject({ airline: "Royal Air Maroc", flightNumber: "AT 280", route: "Douala → Paris", date: "2026-11-20", stops: 1 });
    expect(data.inbound).toMatchObject({ flightNumber: "AT 789", route: "Paris → Douala" });
  });

  it("un champ absent reste « à confirmer » : jamais une valeur supposée", () => {
    const sparse = extractDeskAlertData({ requestRef: "R1", flightData: {}, passengerData: [], requesterEmail: "x@y.com" });
    expect(sparse).toMatchObject({ passengerName: "Nom à confirmer", passengerPhone: null, travelers: null, cabin: null, inbound: null, quotedTotalPrice: null, priority: "Normale" });
    expect(sparse.outbound.airline).toBe("Compagnie à confirmer");
    expect(buildDeskAlertText(sparse)).toContain("Tarif relevé : à confirmer");
    expect(() => extractDeskAlertData({ requestRef: "R", flightData: "x", passengerData: 4, requesterEmail: "" })).not.toThrow();
  });

  it("le résumé contient tout ce qu'il faut pour réserver et interdit l'émission avant paiement", () => {
    const summary = buildDeskAlertText(data);
    for (const expected of ["Réf FB-2026-ABC123", "Priorité : URGENTE", "Aïcha Nkolo", "6 98 10 48 32", "aicha@example.com", "ALLER : Royal Air Maroc AT 280", "RETOUR : Royal Air Maroc AT 789", "440", "revalider", "PNR", "Aucune émission avant paiement validé", "Bagage en soute souhaité"]) {
      expect(summary, expected).toContain(expected);
    }
    expect(summary.length).toBeLessThanOrEqual(1600);
  });
});

describe("numéros WhatsApp et liens", () => {
  it("normalise les numéros camerounais et internationaux, refuse les invalides", () => {
    expect(normalizeWhatsAppNumber("6 98 10 48 32")).toBe("237698104832");
    expect(normalizeWhatsAppNumber("+237 698 104 832")).toBe("237698104832");
    expect(normalizeWhatsAppNumber("00237698104832")).toBe("237698104832");
    expect(normalizeWhatsAppNumber("+1 672 897 2999")).toBe("16728972999");
    for (const invalid of ["", "abc", "123", null, undefined, "1234567890123456789"]) expect(normalizeWhatsAppNumber(invalid as never), String(invalid)).toBeNull();
  });

  it("le lien wa.me encode le message", () => {
    const link = whatsAppLink("6 98 10 48 32", "Bonjour & merci\nà bientôt");
    expect(link.startsWith("https://wa.me/237698104832?text=")).toBe(true);
    expect(decodeURIComponent(link.split("?text=")[1])).toBe("Bonjour & merci\nà bientôt");
  });
});

describe("e-mail d'alerte au comptoir", () => {
  const email = buildDeskAlertEmail(data, { adminUrl: "https://www.3mtravelagency.com/admin", deskWhatsApp: DEFAULT_DESK_WHATSAPP });

  it("signale l'urgence dans l'objet et donne la référence, le trajet et la date", () => {
    expect(email.subject).toBe("[URGENT] [3M Travel] Réservation vol FB-2026-ABC123 — Douala → Paris — 2026-11-20");
    expect(email.html).toContain("réservation réelle (option) en attente de l’émission");
    expect(email.html).toContain("uniquement après paiement validé");
    expect(email.html).toContain("à revalider auprès de la compagnie");
  });

  it("propose les trois actions : écrire au client, transmettre au comptoir, ouvrir la file", () => {
    expect(email.html).toContain("https://wa.me/237698104832?text=");
    expect(email.html).toContain("Écrire au client sur WhatsApp");
    expect(email.html).toContain("Transmettre au comptoir par WhatsApp");
    expect(email.html).toContain('href="https://www.3mtravelagency.com/admin"');
    const withoutPhone = buildDeskAlertEmail({ ...data, passengerPhone: null }, { adminUrl: "https://x/admin", deskWhatsApp: DEFAULT_DESK_WHATSAPP });
    expect(withoutPhone.html).not.toContain("Écrire au client sur WhatsApp");
  });

  it("neutralise le HTML et les sauts de ligne venus du formulaire public", () => {
    const hostile = extractDeskAlertData({ requestRef: "REF\r\nBcc: x@y.com", flightData: { ...flightData, airline: { name: "<script>alert(1)</script>" } }, passengerData: [{ ...passengerData[0], fullName: '<img src=x onerror="a()">' }], requesterEmail: "a@b.com" });
    const mail = buildDeskAlertEmail(hostile, { adminUrl: "https://x/admin", deskWhatsApp: DEFAULT_DESK_WHATSAPP });
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).not.toContain("<img");
    expect(mail.subject).not.toMatch(/[\r\n]/);
  });

  it("destinataires : FLIGHT_DESK_EMAILS (adresses valides, sans doublon) sinon l'agence ; WhatsApp du comptoir configurable", () => {
    expect(resolveDeskRecipients({ FLIGHT_DESK_EMAILS: "a@x.com, b@x.com; a@x.com, pas-une-adresse" })).toEqual(["a@x.com", "b@x.com"]);
    expect(resolveDeskRecipients({})).toEqual(["hello@3mtravelagency.com"]);
    expect(resolveDeskRecipients({ FLIGHT_DESK_EMAILS: "invalide" })).toEqual(["hello@3mtravelagency.com"]);
    expect(resolveDeskWhatsApp({ FLIGHT_DESK_WHATSAPP: "+237 6 77 88 99 00" })).toBe("237677889900");
    expect(resolveDeskWhatsApp({})).toBe(DEFAULT_DESK_WHATSAPP);
  });
});

describe("signalement à la création de la demande", () => {
  const source = read("server/routers/flightBooking.ts");
  const createRequest = source.slice(source.indexOf("createRequest: publicProcedure"), source.indexOf("getMyRequests: candidateProcedure"));

  it("la cloche d'administration est alertée AVANT l'e-mail, et une panne d'e-mail n'annule pas la demande", () => {
    const notifyAt = createRequest.indexOf("await notifyAdmins({");
    const emailAt = createRequest.indexOf("buildDeskAlertEmail(");
    expect(notifyAt).toBeGreaterThan(-1);
    expect(notifyAt).toBeLessThan(emailAt);
    expect(createRequest).toContain('relatedId: requestRef');
    expect(createRequest).toContain("desk notification failed");
    expect(createRequest).not.toContain('to: "hello@3mtravelagency.com"');
    expect(createRequest).toContain("resolveDeskRecipients(process.env)");
  });
});

describe("tableau de bord : réservation à effectuer", () => {
  it("affiche le résumé, copie dans le presse-papiers et propose les deux liens WhatsApp", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<FlightDeskActions request={request} />);
    const section = screen.getByTestId("desk-actions");
    expect(section.textContent).toContain("Réf FB-2026-ABC123");
    expect(section.textContent).toContain("Aucune émission avant paiement validé");
    fireEvent.click(screen.getByRole("button", { name: /Copier le résumé/ }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(buildDeskAlertText(data)));
    const links = screen.getAllByRole("link").map((link) => link.getAttribute("href") ?? "");
    expect(links.some((href) => href.startsWith("https://wa.me/237698104832?text="))).toBe(true);
    expect(links).toHaveLength(2);
    expect(screen.getAllByRole("link").every((link) => (link.getAttribute("rel") ?? "").includes("noopener"))).toBe(true);
  });

  it("sans numéro du client, pas de bouton « Écrire au client »", () => {
    render(<FlightDeskActions request={{ ...request, passengerData: [{ ...passengerData[0], phone: "" }] }} />);
    expect(screen.queryByText(/Écrire au client/)).toBeNull();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("est branché dans le détail d'une demande du tableau de bord", () => {
    const dashboard = read("client/src/pages/FlightAgentDashboard.tsx");
    expect(dashboard).toContain('import { FlightDeskActions } from "@/components/FlightDeskActions";');
    expect(dashboard).toContain("<FlightDeskActions request={request} />");
  });
});
