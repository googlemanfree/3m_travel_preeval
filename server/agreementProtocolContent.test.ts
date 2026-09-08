import { describe, expect, it } from "vitest";
import {
  AGREEMENT_PROTOCOL_VERSION,
  INITIAL_AGREEMENT_PROTOCOL,
  SECOND_AGREEMENT_PROTOCOL_TEMPLATE,
  buildAgreementProtocolText,
  buildSecondAgreementProtocolText,
} from "../shared/agreementProtocolContent";

describe("agreement protocol content", () => {
  it("contains a detailed, transparent initial protocol", () => {
    expect(INITIAL_AGREEMENT_PROTOCOL.length).toBeGreaterThan(3500);
    expect(INITIAL_AGREEMENT_PROTOCOL).toContain("La signature est autorisée uniquement après confirmation du paiement");
    expect(INITIAL_AGREEMENT_PROTOCOL).toContain("ne garantit aucun résultat");
    expect(INITIAL_AGREEMENT_PROTOCOL).toContain("second protocole distinct");
    expect(INITIAL_AGREEMENT_PROTOCOL).toContain("frais officiels");
  });

  it("builds stable dossier context without altering the legal safeguards", () => {
    const text = buildAgreementProtocolText("Luxembourg", "Travail");
    expect(text).toContain("Destination envisagée : Luxembourg.");
    expect(text).toContain("Formule ou prestation envisagée : Travail.");
    expect(text).toContain("ne garantit aucun résultat");
  });

  it("defines a separate second protocol by destination, visa type and formula", () => {
    expect(SECOND_AGREEMENT_PROTOCOL_TEMPLATE).toContain("second protocole spécifique");
    const text = buildSecondAgreementProtocolText("Canada", "Travail", "Accompagnement complet");
    expect(text).toContain("Destination : Canada.");
    expect(text).toContain("Type de procédure : Travail.");
    expect(text).toContain("Formule choisie : Accompagnement complet.");
    expect(text).toContain("ne sera ni automatique ni rétroactif");
  });

  it("exposes a version for admin and delivery traceability", () => {
    expect(AGREEMENT_PROTOCOL_VERSION).toMatch(/^2026-09-08-v2$/);
  });
});
