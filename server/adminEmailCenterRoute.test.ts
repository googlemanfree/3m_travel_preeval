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

  it("filtre les journaux par type et archive le scénario interne sans effacer son historique", () => {
    const admin = fs.readFileSync(path.join(root, "server/routers/admin.ts"), "utf8");
    const management = fs.readFileSync(path.join(root, "client/src/components/AdminEmailDeliveryManagement.tsx"), "utf8");
    const center = fs.readFileSync(path.join(root, "client/src/pages/AdminEmailCenter.tsx"), "utf8");
    expect(admin).toContain("classifyEmailDeliveryType");
    expect(admin).toContain("deliveryType");
    expect(admin).toContain("archiveEmailDeliveryDemo");
    expect(admin).toContain("ARCHIVÉ DÉMONSTRATION REMISE E-MAIL");
    expect(management).toContain("Tous les types de remise");
    expect(center).toContain("Archiver le dossier");
  });

  it("alerte le propriétaire en cas de défaillance SMTP sans répétition immédiate", () => {
    const monitoring = fs.readFileSync(path.join(root, "server/routers/monitoring.ts"), "utf8");
    expect(monitoring).toContain("notifySmtpFailureIfNeeded");
    expect(monitoring).toContain("SMTP_ALERT_COOLDOWN_MS");
    expect(monitoring).toContain("notifyOwner");
  });

  it("exporte les journaux filtrés et protège les relances groupées", () => {
    const admin = fs.readFileSync(path.join(root, "server/routers/admin.ts"), "utf8");
    const management = fs.readFileSync(path.join(root, "client/src/components/AdminEmailDeliveryManagement.tsx"), "utf8");
    expect(admin).toContain("lastSuccessfulByType");
    expect(admin).toContain("resendFailedEmailsBulk");
    expect(admin).toContain("max(25)");
    expect(admin).toContain("confirmed: z.literal(true)");
    expect(management).toContain("exportFilteredCsv");
    expect(management).toContain("Exporter CSV");
    expect(management).toContain("Dernières remises réussies par service");
    expect(management).toContain("Relancer la sélection");
  });

  it("expose les échecs du jour, les taux sur 30 jours et la sélection manuelle", () => {
    const admin = fs.readFileSync(path.join(root, "server/routers/admin.ts"), "utf8");
    const management = fs.readFileSync(path.join(root, "client/src/components/AdminEmailDeliveryManagement.tsx"), "utf8");
    expect(admin).toContain("dailyFailures");
    expect(admin).toContain("deliverySuccessRates30Days");
    expect(management).toContain("Échecs d’envoi aujourd’hui");
    expect(management).toContain("Taux de réussite par service · 30 jours");
    expect(management).toContain("selectedFailedLogIds");
    expect(management).toContain("Sélectionner tous les e-mails en échec affichés");
  });
});
