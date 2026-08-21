import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("Centre e-mail administrateur", () => {
  it("protège la route directe du suivi e-mail", () => {
    const app = fs.readFileSync(path.join(root, "client/src/App.tsx"), "utf8");
    expect(app).toContain('path={"/admin/emails"}');
    expect(app).toContain("<AdminEmailCenter />");
    expect(app).toContain("<AdminGuard message=\"Accès réservé aux administrateurs.\">");
  });

  it("expose un état SMTP non secret uniquement au back-office", () => {
    const email = fs.readFileSync(path.join(root, "server/_core/email.ts"), "utf8");
    const monitoring = fs.readFileSync(path.join(root, "server/routers/monitoring.ts"), "utf8");
    const status = fs.readFileSync(path.join(root, "client/src/components/AdminSystemStatus.tsx"), "utf8");
    expect(email).toContain("getSmtpHealth");
    expect(monitoring).toContain("getSmtpHealth");
    expect(status).toContain("Messagerie SMTP");
    expect(status).not.toContain("SMTP_PASS");
  });

  it("isole le scénario de remise e-mail de toute fiche client réelle", () => {
    const admin = fs.readFileSync(path.join(root, "server/routers/admin.ts"), "utf8");
    expect(admin).toContain("EMAIL_DELIVERY_DEMO_NOTE");
    expect(admin).toContain("prepareEmailDeliveryDemo");
    expect(admin).toContain("sendEmailDeliveryDemo");
    expect(admin).toContain("Ne pas utiliser pour un client");
  });
});
