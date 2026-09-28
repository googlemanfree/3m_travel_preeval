import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { amountFromFlightData, ownershipRefusal } from "./routers/cinetpayFlightPayment";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");

describe("paiement en ligne des vols : propriétaire et statut", () => {
  const request = { candidateEmail: "aicha@example.com", status: "pending_review" };

  it("refuse un e-mail qui n'est pas celui de la réservation", () => {
    expect(ownershipRefusal(request, "quelquun-dautre@example.com")).toMatch(/non autorisé/i);
  });

  it("accepte l'e-mail exact, insensible à la casse", () => {
    expect(ownershipRefusal(request, "AICHA@EXAMPLE.COM")).toBeNull();
  });

  it("refuse un billet déjà émis ou une réservation annulée, même avec le bon e-mail", () => {
    expect(ownershipRefusal({ ...request, status: "issued" }, request.candidateEmail)).toMatch(/déjà émis/i);
    expect(ownershipRefusal({ ...request, status: "cancelled" }, request.candidateEmail)).toMatch(/annulée/i);
  });

  it("un statut normal (en cours de traitement) ne bloque rien", () => {
    for (const status of ["pending_review", "assigned", "needs_info", "revalidated", "awaiting_payment"]) {
      expect(ownershipRefusal({ ...request, status }, request.candidateEmail), status).toBeNull();
    }
  });
});

describe("paiement en ligne des vols : montant réellement relevé, jamais recalculé", () => {
  it("reprend le tarif aller-retour si un retour a été choisi, sinon le tarif de l'aller", () => {
    expect(amountFromFlightData({ totalPrice: 60000, quotedTotalPrice: 457020 })).toBe(457020);
    expect(amountFromFlightData({ totalPrice: 60000 })).toBe(60000);
  });

  it("arrondit sans jamais inventer un montant quand rien d'exploitable n'est fourni", () => {
    expect(amountFromFlightData({ totalPrice: 60000.4 })).toBe(60000);
    for (const bad of [null, undefined, {}, { totalPrice: 0 }, { totalPrice: -5 }, { totalPrice: "60000" }, { quotedTotalPrice: Number.NaN }]) {
      expect(amountFromFlightData(bad), JSON.stringify(bad)).toBeNull();
    }
  });
});

describe("paiement en ligne des vols : câblage réel (déclaratif ↔ en ligne, jamais l'émission automatique)", () => {
  const source = read("server/routers/cinetpayFlightPayment.ts");

  it("ne pose jamais le statut « issued » depuis la confirmation de paiement : l'émission reste une action admin séparée", () => {
    expect(source).not.toContain("status: \"issued\"");
    expect(source).toContain('"awaiting_payment"');
  });

  it("un montant CinetPay qui ne correspond pas à celui relevé n'est jamais accepté silencieusement", () => {
    expect(source).toContain("const amountMatches = verification.amount === undefined || verification.amount === existing.onlinePaymentAmount;");
    expect(source).toContain("if (!verification.accepted || !amountMatches) return { success: true, status: \"PENDING\" as const };");
  });

  it("une transaction déjà réglée n'appelle jamais une seconde fois le fournisseur", () => {
    expect(source).toContain('if (existing.onlinePaymentStatus === "SUCCESS") return { success: true, status: "SUCCESS" as const };');
  });

  it("le router est bien enregistré", () => {
    const routers = read("server/routers.ts");
    expect(routers).toContain('import { cinetpayFlightPaymentRouter } from "./routers/cinetpayFlightPayment";');
    expect(routers).toContain("cinetpayFlightPayment: cinetpayFlightPaymentRouter,");
  });

  it("la migration ajoute des colonnes indépendantes de la déclaration manuelle existante (paymentMethod / paymentTransactionId), jamais un remplacement", () => {
    const migration = read("drizzle/0073_flight_online_payment.sql");
    expect(migration).toContain("ALTER TABLE flight_booking_requests");
    for (const column of ["onlinePaymentStatus", "onlinePaymentTransactionId", "onlinePaymentAmount", "onlinePaymentCurrency", "onlinePaymentMethod", "onlinePaymentDate"]) {
      expect(migration, column).toContain(column);
    }
    const schema = read("drizzle/schema.ts");
    expect(schema).toContain('paymentMethod: varchar("paymentMethod", { length: 50 }),');
    expect(schema).toContain('onlinePaymentStatus: mysqlEnum("onlinePaymentStatus", ["PENDING", "SUCCESS", "FAILED"]),');
  });
});

describe("page de paiement en ligne des vols : intégration site", () => {
  it("la route est déclarée avant la route générique /payment/:dossierNumber (même préfixe)", () => {
    const app = read("client/src/App.tsx");
    const flightRoute = app.indexOf('path={"/payment/flight/:requestId"}');
    const dossierRoute = app.indexOf('path={"/payment/:dossierNumber"}');
    expect(flightRoute).toBeGreaterThan(-1);
    expect(dossierRoute).toBeGreaterThan(-1);
    expect(flightRoute).toBeLessThan(dossierRoute);
  });

  it("le SDK CinetPay n'est déclaré nulle part dans index.html : la page doit le charger elle-même", () => {
    const html = read("client/index.html");
    expect(html).not.toMatch(/cinetpay/i);
    const page = read("client/src/pages/CinetPayFlightPayment.tsx");
    expect(page).toContain("cdn.cinetpay.com/seamless/main.js");
    expect(page).toContain("document.head.appendChild(script)");
  });

  it("le paiement n'est confirmé côté client qu'après la revérification serveur, jamais sur le seul retour de CinetPay", () => {
    const page = read("client/src/pages/CinetPayFlightPayment.tsx");
    const waitResponseIndex = page.indexOf("CinetPay.waitResponse");
    const verifyCallIndex = page.indexOf("verifyQuery.refetch()");
    const setSuccessIndex = page.indexOf('setStatus("success")');
    expect(waitResponseIndex).toBeGreaterThan(-1);
    expect(verifyCallIndex).toBeGreaterThan(waitResponseIndex);
    expect(setSuccessIndex).toBeGreaterThan(verifyCallIndex);
  });

  it("le repli (virement, dépôt, agence) reste disponible sur la page en ligne", () => {
    expect(read("client/src/pages/CinetPayFlightPayment.tsx")).toContain("PaymentFallbackPanel");
  });

  it("l'espace client ne propose le paiement en ligne que si un e-mail candidat est connu, sans jamais remplacer les autres moyens", () => {
    const card = read("client/src/components/MyFlightRequestsCard.tsx");
    expect(card).toContain('candidate?.email && (');
    expect(card).toContain('data-testid="pay-flight-online-link"');
    expect(card).toContain('data-testid="pay-flight-link"');
    expect(card).toContain("/payment/flight/${request.id}?email=");
    expect(card).toContain("/paiement?ref=${encodeURIComponent(request.requestRef)}&type=vol");
  });
});
