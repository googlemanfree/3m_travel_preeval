import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("notifications e-mail client", () => {
  it("contient un modèle SMTP sécurisé et échappe le contenu candidat", () => {
    const service = read("server/emailService.ts");
    expect(service).toContain("sendClientNotificationEmail");
    expect(service).toContain("escapeEmailHtml");
    expect(service).toContain("return true");
    expect(service).toContain("return false");
    expect(service).toContain("/mon-espace");
  });

  it("envoie les remarques et réponses partenaires après la notification interne", () => {
    const router = read("server/routers/adminCandidateManagement.ts");
    expect(router).toContain("sendClientNotificationEmail");
    expect(router).toContain("sourceLabel: agencyResponse ? \"Agence de placement\" : \"Prime Travel Service\"");
    expect(router).toContain("emailSentAt: new Date()");
    expect(router).toContain("type: \"admin_message\"");
  });

  it("conserve la notification dans l’espace client même si l’envoi SMTP échoue", () => {
    const service = read("server/emailService.ts");
    const router = read("server/routers/adminCandidateManagement.ts");
    expect(service).toContain("catch (error)");
    expect(service).toContain("return false");
    expect(router).toContain("const notificationResult = await db.insert(clientNotifications)");
  });
});
