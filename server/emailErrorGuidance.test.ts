import { describe, expect, it } from "vitest";
import { getEmailErrorGuidance, getEmailErrorTitle } from "../client/src/lib/emailErrorGuidance";

describe("email error guidance", () => {
  it("explique une adresse destinataire invalide", () => {
    const error = "Invalid `to` field: recipient address is invalid";
    expect(getEmailErrorTitle(error)).toBe("Adresse destinataire invalide");
    expect(getEmailErrorGuidance(error)).toContain("Corrigez-la dans son dossier");
  });

  it("explique un domaine Resend non vérifié", () => {
    const error = "The sending domain is not verified";
    expect(getEmailErrorTitle(error)).toBe("Domaine d’envoi non vérifié");
    expect(getEmailErrorGuidance(error)).toContain("SPF/DKIM");
  });

  it("ne révèle pas de secret dans la recommandation de configuration", () => {
    const error = "Unauthorized: invalid API key";
    expect(getEmailErrorTitle(error)).toBe("Configuration Resend invalide");
    expect(getEmailErrorGuidance(error)).toContain("RESEND_API_KEY");
    expect(getEmailErrorGuidance(error)).toContain("jamais la clé dans le navigateur");
  });
});
