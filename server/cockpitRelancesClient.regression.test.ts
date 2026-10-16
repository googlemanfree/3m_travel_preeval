import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ADMIN_MESSAGE_TEMPLATES,
  buildMailtoRelance,
  buildWhatsAppRelance,
  fillAdminTemplate,
  templateForStage,
} from "../shared/adminOpsToolkit";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("cockpit — relances client e-mail / WhatsApp + confirmation admin", () => {
  it("prépare des messages prêts pour e-mail non confirmé et paiement", () => {
    const emailTpl = templateForStage("email_unverified");
    const filled = fillAdminTemplate(emailTpl, { name: "Arthur", reference: "COMPTE-2760001" });
    expect(filled.subject).toContain("COMPTE-2760001");
    expect(filled.body).toContain("Arthur");
    expect(filled.body.toLowerCase()).toContain("spam");
    expect(filled.body).toContain("https://www.3mtravelagency.com/login");

    const payTpl = templateForStage("payment_pending");
    const payFilled = fillAdminTemplate(payTpl, { name: "Germain", reference: "COMPTE-5850001" });
    expect(payFilled.body).toContain("https://www.3mtravelagency.com/mon-espace");

    const mailto = buildMailtoRelance({
      email: "arthur@example.com",
      name: "Arthur",
      reference: "COMPTE-2760001",
      stage: "email_unverified",
    });
    expect(mailto.startsWith("mailto:")).toBe(true);
    expect(mailto).toContain(encodeURIComponent("arthur@example.com"));

    const wa = buildWhatsAppRelance({
      phone: "698104832",
      name: "Arthur",
      reference: "COMPTE-2760001",
      stage: "email_unverified",
    });
    expect(wa).toContain("https://wa.me/237698104832");
    expect(ADMIN_MESSAGE_TEMPLATES.some((row) => row.id === "email_unverified")).toBe(true);
  });

  it("expose téléphone + candidateId et boutons relance / confirmer sur le cockpit", () => {
    const router = read("server/routers/adminCandidateManagement.ts");
    expect(router).toContain("phone: candidates.phone");
    expect(router).toContain("whatsappNumber: applications.whatsappNumber");
    expect(router).toContain("candidateId: account.id");
    expect(router).toContain("phone: account.phone");

    const cockpit = read("client/src/components/AdminCockpitControlBoard.tsx");
    expect(cockpit).toContain("sendDynamicRelance");
    expect(cockpit).toContain("Envoyer e-mail");
    expect(cockpit).toContain("cockpit-relance-mail");
    expect(cockpit).toContain("cockpit-relance-whatsapp");
    expect(cockpit).toContain("cockpit-force-confirm-email");
    expect(cockpit).toContain("cockpit-resend-confirm-link");
    expect(cockpit).toContain("forceConfirmEmail");
    expect(cockpit).toContain("adminActivation.resend");
    expect(cockpit).not.toContain("buildMailtoRelance");
  });

  it("garde forceConfirmEmail côté activation admin", () => {
    const activation = read("server/routers/adminActivation.ts");
    expect(activation).toContain("forceConfirmEmail");
    expect(activation).toContain("emailVerified: true");
    expect(activation).toContain("reason");
  });
});
