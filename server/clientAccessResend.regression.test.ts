import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildClientAccessLinkWhatsApp } from "./whatsappService";
import { buildSetPasswordAccessUrl } from "./services/ensureAgencyClientAccess";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("renvoi lien d’accès espace client", () => {
  it("construit le message WhatsApp d’accès", () => {
    const url = buildSetPasswordAccessUrl("tokentest", "3M-AGN-0009");
    const message = buildClientAccessLinkWhatsApp({
      candidateName: "Paul",
      dossierNumber: "3M-AGN-0009",
      accessUrl: url,
    });
    expect(message).toContain("Paul");
    expect(message).toContain("3M-AGN-0009");
    expect(message).toContain("tokentest");
    expect(message).toContain("48 heures");
  });

  it("expose la mutation admin et le CTA bureau / fiche 360", () => {
    const management = read("server/routers/adminCandidateManagement.ts");
    expect(management).toContain("resendClientAccessLink");
    expect(management).toContain("issueClientAccessLinkResend");
    expect(management).toContain("/^(account|online|agency)_\\d+$/");

    const service = read("server/services/resendClientAccessLink.ts");
    expect(service).toContain("client_access_link_resent");
    expect(service).toContain("notifyClientAccessLinkWhatsApp");
    expect(service).toContain("60_000");

    const desk = read("client/src/components/AdminContractsReceiptsDesk.tsx");
    expect(desk).toContain("resendClientAccessLink");
    expect(desk).toContain("client-access-resend-");
    expect(desk).toContain("Accès");

    const workspace = read("client/src/components/Candidate360Workspace.tsx");
    expect(workspace).toContain("resendClientAccessLink");
    expect(workspace).toContain("resend-client-access-link");
    expect(workspace).toContain("Renvoyer l’accès");
  });

  it("réutilise l’e-mail d’invite partagé avec l’import agence", () => {
    const email = read("server/services/clientAccessInviteEmail.ts");
    expect(email).toContain("Activer mon espace client");
    expect(email).toContain("Ouvrir mon espace client");
    expect(read("server/services/ensureAgencyClientAccess.ts")).toContain("sendClientAccessInviteEmail");
    expect(read("server/services/clientWhatsAppNotify.ts")).toContain("notifyClientAccessLinkWhatsApp");
  });
});
