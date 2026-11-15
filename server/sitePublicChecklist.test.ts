import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ inserts: [] as unknown[], emails: [] as unknown[] }));
vi.mock("./db", () => ({ getDb: async () => ({ insert: () => ({ values: async (row: unknown) => { state.inserts.push(row); } }) }) }));
vi.mock("./_core/email", () => ({ sendEmail: async (mail: unknown) => { state.emails.push(mail); } }));
vi.mock("./routers/adminAuth", () => ({ requireValidAdminSession: async () => ({ email: "admin@example.test" }) }));

const root = resolve(__dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("formulaire de contact : piège à robots", () => {
  beforeEach(() => { state.inserts.length = 0; state.emails.length = 0; });
  const valid = { name: "Awa Ndiaye", email: "awa@example.org", subject: "Visa études", message: "Bonjour, je souhaite des informations sur mon dossier." };

  it("un champ piège rempli ne déclenche ni enregistrement ni e-mail, et reçoit la réponse d'un succès", async () => {
    const { contactRouter, CONTACT_SUCCESS_MESSAGE } = await import("./routers/contact");
    const caller = contactRouter.createCaller({ req: { headers: {}, socket: {} }, res: {} } as never);
    const result = await caller.sendContactEmail({ ...valid, website: "http://spam.example" });
    expect(result).toEqual({ success: true, message: CONTACT_SUCCESS_MESSAGE });
    expect(state.inserts).toHaveLength(0);
    expect(state.emails).toHaveLength(0);
  });

  it("un visiteur réel (champ piège vide) est enregistré et reçoit ses e-mails", async () => {
    const { contactRouter } = await import("./routers/contact");
    const caller = contactRouter.createCaller({ req: { headers: { "x-forwarded-for": "198.51.100.77" }, socket: {} }, res: {} } as never);
    const result = await caller.sendContactEmail({ ...valid, email: `reel${Date.now()}@example.org`, website: "" });
    expect(result.success).toBe(true);
    expect(state.inserts).toHaveLength(1);
    expect(state.emails.length).toBeGreaterThanOrEqual(1);
  });

  it("le champ est invisible et inaccessible pour un visiteur (hors écran, ignoré au clavier, caché aux lecteurs d'écran)", () => {
    const form = read("client/src/pages/Contact.tsx");
    const block = form.slice(form.indexOf('data-testid="contact-honeypot"') - 160, form.indexOf('data-testid="contact-honeypot"') + 500);
    expect(block).toContain('aria-hidden="true"');
    expect(block).toContain("tabIndex={-1}");
    expect(block).toContain('autoComplete="off"');
    expect(block).toContain("-10000px");
    expect(form).toContain("website: honeypot");
  });
});

describe("pages légales : liens reconnaissables sans la couleur seule", () => {
  for (const page of ["PolitiqueConfidentialite", "ConditionsUtilisation", "MentionsLegales"]) {
    it(`${page} : aucun lien souligné seulement au survol`, () => {
      const source = read(`client/src/pages/${page}.tsx`);
      expect(source).not.toMatch(/(?<!no-)hover:underline/);
      expect(source).toContain("underline underline-offset-2");
    });
  }
});

describe("bandeau cookies : compact sur téléphone", () => {
  it("texte réduit et marges resserrées en dessous de 640 px, taille habituelle au-delà", () => {
    const source = read("client/src/components/CookieConsent.tsx");
    expect(source).toContain("text-xs leading-5");
    expect(source).toContain("sm:text-sm sm:leading-6");
    expect(source).toContain("py-3");
    expect(source).toContain('data-testid="cookie-accept"');
    expect(source).toContain('data-testid="cookie-refuse"');
  });
});

describe("images de la page publique : poids plafonné", () => {
  const jpgs = (dir: string) => readdirSync(resolve(root, dir)).filter((name) => /\.jpe?g$/i.test(name)).map((name) => ({ name, size: statSync(resolve(root, dir, name)).size }));
  for (const dir of ["client/public/photos-canada", "client/public/proof-photos", "client/public/team"]) {
    it(`${dir} : aucun JPG de plus de 330 Ko`, () => {
      const tooBig = jpgs(dir).filter((file) => file.size > 330_000);
      expect(tooBig).toEqual([]);
    });
  }
});
