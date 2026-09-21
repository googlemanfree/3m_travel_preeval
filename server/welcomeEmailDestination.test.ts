import { beforeEach, describe, expect, it, vi } from "vitest";

const sent = vi.hoisted(() => [] as Array<{ to: string; subject: string; html: string }>);

vi.mock("./_core/email", () => ({
  sendEmail: vi.fn(async (message: { to: string; subject: string; html: string }) => {
    sent.push(message);
    return true;
  }),
}));
vi.mock("./db", () => ({ getDb: vi.fn(async () => null) }));

import { sendWelcomeEmail } from "./emailService";

describe("e-mail de bienvenue — destination", () => {
  beforeEach(() => {
    sent.length = 0;
  });

  it("nomme le pays choisi (avec son drapeau) plutôt qu'une catégorie large", async () => {
    await sendWelcomeEmail("aicha@example.test", "Aïcha", "France");
    expect(sent[0].subject).toContain("🇫🇷 France");
    expect(sent[0].subject).not.toContain("Schengen");
    expect(sent[0].html).toContain("🇫🇷 France");
  });

  it("nomme aussi un pays qui n'avait pas de libellé dédié, même saisi en minuscules", async () => {
    await sendWelcomeEmail("aicha@example.test", "Aïcha", "sénégal");
    expect(sent[0].subject).toContain("🇸🇳 Sénégal");
    expect(sent[0].subject).not.toContain("International");
  });

  it("garde les libellés historiques pour les catégories larges des anciens comptes", async () => {
    await sendWelcomeEmail("aicha@example.test", "Aïcha", "europe");
    expect(sent[0].subject).toContain("Europe Schengen");
    await sendWelcomeEmail("aicha@example.test", "Aïcha", "autre");
    expect(sent[1].subject).toContain("International");
  });

  it("échappe le nom du candidat", async () => {
    await sendWelcomeEmail("aicha@example.test", "<script>alert(1)</script>", "Canada");
    expect(sent[0].html).not.toContain("<script>alert(1)</script>");
  });
});
