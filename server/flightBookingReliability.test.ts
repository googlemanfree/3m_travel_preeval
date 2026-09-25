import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildBookingConfirmationEmail } from "./services/flightBookingConfirmation";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");

describe("e-mail de confirmation d'une demande de réservation", () => {
  const base = { requestRef: "FB-2026-ABC123", fullName: "Aïcha Nkolo", origin: "Douala", destination: "Paris", airline: "Royal Air Maroc", departure: "2026-11-20" };

  it("donne la référence, le trajet et les prochaines étapes, sans rien promettre", () => {
    const { subject, html } = buildBookingConfirmationEmail(base);
    expect(subject).toContain("FB-2026-ABC123");
    for (const expected of ["FB-2026-ABC123", "Douala → Paris", "Royal Air Maroc", "2026-11-20", "Bonjour Aïcha Nkolo", "Aucun paiement n’est demandé", "n’est pas un billet", "indicatif"]) {
      expect(html, expected).toContain(expected);
    }
    expect(html).not.toMatch(/garanti(?!r)|billet émis|réservation confirmée|votre place est/i);
  });

  it("neutralise tout HTML et toute ligne supplémentaire venus du formulaire public", () => {
    const { html, subject } = buildBookingConfirmationEmail({ ...base, fullName: '<img src=x onerror="alert(1)">Test', airline: "<script>x</script>", requestRef: "REF\r\nBcc: victime@example.com" });
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;img");
    expect(subject).not.toMatch(/[\r\n]/);
    expect(subject).not.toContain("\n");
  });

  it("le lien WhatsApp est celui de l'agence et reprend la référence encodée", () => {
    const { html } = buildBookingConfirmationEmail(base);
    expect(html).toContain("https://wa.me/237698104832?text=");
    expect(html).toContain(encodeURIComponent("FB-2026-ABC123"));
    const other = buildBookingConfirmationEmail({ ...base, whatsappNumber: "+237 6 98 10 48 32" }).html;
    expect(other).toContain("https://wa.me/237698104832?");
  });

  it("borne la longueur des champs et salue sans nom", () => {
    const { html } = buildBookingConfirmationEmail({ ...base, fullName: "", airline: "A".repeat(500) });
    expect(html).toContain("Bonjour,");
    expect(html).not.toContain("A".repeat(200));
  });
});

describe("demande de réservation : plafond et garde d'état", () => {
  const source = read("server/routers/flightBooking.ts");
  const createRequest = source.slice(source.indexOf("createRequest: publicProcedure"), source.indexOf("getMyRequests: candidateProcedure"));

  it("le plafond s'applique avant toute écriture en base", () => {
    expect(source).toContain("const bookingRequestGuard = createSubmissionGuard({");
    const guardAt = createRequest.indexOf("bookingRequestGuard.assertAllowed(");
    expect(guardAt).toBeGreaterThan(-1);
    expect(guardAt).toBeLessThan(createRequest.indexOf("await getDb()"));
    expect(guardAt).toBeLessThan(createRequest.indexOf("db.insert(flightBookingRequests)"));
  });

  it("le client reçoit un e-mail de confirmation dont l'échec n'annule pas la demande", () => {
    expect(createRequest).toContain("buildBookingConfirmationEmail({");
    expect(createRequest).toContain("to: requester.email");
    expect(createRequest).toContain("confirmationEmailSent");
    const tryAt = createRequest.lastIndexOf("try {");
    expect(createRequest.indexOf("customer confirmation failed")).toBeGreaterThan(tryAt);
  });

  it("une réservation émise ou annulée ne peut plus être revalidée par le client", () => {
    const clientValidate = source.slice(source.indexOf("clientValidate: candidateProcedure"), source.indexOf("adminValidatePayment: publicProcedure"));
    expect(clientValidate).toContain('existing.status === "issued" || existing.status === "cancelled"');
    expect(clientValidate.indexOf('existing.status === "issued"')).toBeLessThan(clientValidate.indexOf("db.update(flightBookingRequests)"));
  });
});

describe("écrans de vols : aucune donnée inventée, provenance des tarifs visible", () => {
  const pages = ["client/src/pages/Billets.tsx", "client/src/pages/Flights.tsx", "client/src/pages/FlightBookingCheckout.tsx"];

  it("plus de fausse rareté, de bagages ou remboursement supposés, de taxes estimées, de PNR fictif ni de simulation", () => {
    for (const page of pages) {
      const text = read(page);
      for (const forbidden of ["Plus que", "Places restantes", "Simulation", "isSimulated", "gdsFareBasis", "gdsTaxesAndFees", "gdsBookingClass", "flight.pnrRef", "seatsLeft", "Modifiable / Remboursable", "Non remboursable", "45000", "specialMeal", "isSeatModalOpen"]) {
        expect(text, `${page} : ${forbidden}`).not.toContain(forbidden);
      }
    }
  });

  it("la page 3M Booking et /flights affichent l'heure de relevé, la source, la conversion et la confirmation par un conseiller", () => {
    for (const page of ["client/src/pages/Billets.tsx", "client/src/pages/Flights.tsx"]) {
      const text = read(page);
      expect(text, page).toContain('data-testid="fare-provenance"');
      expect(text, page).toContain("655,957");
      expect(text, page).toContain("confirmés par");
      expect(text, page).toContain("retrievedAt");
    }
  });

  it("le formulaire de demande est utilisable au doigt : clavier adapté, saisie automatique, libellés reliés, texte de 16 px, Échap", () => {
    const text = read("client/src/pages/Billets.tsx");
    for (const expected of ['type="tel" inputMode="tel" autoComplete="tel"', 'inputMode="email" autoComplete="email"', 'htmlFor="booking-email"', 'autoComplete="given-name"', 'event.key === "Escape"']) {
      expect(text, expected).toContain(expected);
    }
    const modal = text.slice(text.indexOf("function BookingRequestModal"), text.indexOf("function ReturnFlightModal"));
    expect(modal).not.toMatch(/px-3 py-2\.5 text-sm/); // 14 px : iOS zoomerait à la saisie
  });

  it("chaque option de retour affiche son total aller-retour, et la demande retient celui du retour choisi", () => {
    const text = read("client/src/pages/Billets.tsx");
    expect(text).toContain("Total aller-retour : {formatXAF(option.totalPrice)}");
    expect(text).toContain("const quotedTotalPrice = returnFlight?.totalPrice ?? flight.totalPrice;");
  });
});
