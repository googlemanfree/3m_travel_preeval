import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  rows: new Map<unknown, any[]>(),
  inserts: [] as Array<{ table: unknown; values: any }>,
  updates: [] as Array<{ table: unknown; values: any }>,
}));

vi.mock("./db", () => ({
  getDb: async () => {
    const chain = (rows: any[]) => {
      const c: any = { where: () => c, limit: () => c, orderBy: () => c, then: (resolve: (value: any[]) => unknown) => resolve(rows) };
      return c;
    };
    return {
      select: () => ({ from: (table: unknown) => chain(state.rows.get(table) ?? []) }),
      insert: (table: unknown) => ({ values: async (values: any) => { state.inserts.push({ table, values }); return [{ insertId: 91 }]; } }),
      update: (table: unknown) => ({ set: (values: any) => ({ where: async () => { state.updates.push({ table, values }); return [{ affectedRows: 1 }]; } }) }),
    };
  },
}));
vi.mock("./routers/adminAuth", () => ({ requireValidAdminSession: async () => ({ id: 1, email: "agent@3mtravelagency.com" }) }));

import { customerReviews } from "../drizzle/schema";
import { customerReviewRouter } from "./routers/customerReview";
import {
  ADMIN_ENTRY_NOTE_PREFIX,
  appendAdminNote,
  buildAdminEntryNotes,
  consentDateError,
  isAdminEntered,
  isPlaceholderEmail,
  placeholderEmail,
} from "./services/adminTestimonials";

const token = "t".repeat(40);
const caller = () => customerReviewRouter.createCaller({ req: { headers: {} }, res: {} } as any);
const today = new Date().toISOString().slice(0, 10);

const valid = {
  sessionToken: token,
  fullName: "Aïcha Nkolo",
  email: "aicha@example.com",
  destinationCountry: "Canada",
  serviceType: "Visa études",
  rating: 5,
  reviewText: "Un accompagnement clair du début à la fin, merci à toute l’équipe.",
  consentToPublish: true as const,
  attestation: true as const,
  consentChannel: "whatsapp" as const,
  consentDate: today,
  consentProof: "Capture WhatsApp du jour enregistrée dans le dossier du client",
  dossierReference: "3M-2026-0012",
  displayNameChoice: "first_name_only" as const,
};

const reviewRow = { id: 7, fullName: "Aïcha Nkolo", email: "aicha@example.com", destinationCountry: "Canada", serviceType: "Visa études", rating: 5, reviewText: "Texte d’origine du client.", consentToPublish: true, displayNameChoice: "first_name_only", status: "approved", adminNotes: `${ADMIN_ENTRY_NOTE_PREFIX}\nCanal de l’accord : Message WhatsApp · Date : ${today}`, createdAt: new Date("2026-10-01T10:00:00Z") };

beforeEach(() => {
  state.rows = new Map([[customerReviews, []]]);
  state.inserts = [];
  state.updates = [];
});

describe("outil admin : saisie d'un témoignage client", () => {
  it("par défaut : enregistré « à valider », avec la preuve de l'accord conservée dans les notes", async () => {
    const result = await caller().createByAdmin(valid);
    expect(result).toMatchObject({ success: true, published: false });
    const row = state.inserts[0].values;
    expect(row).toMatchObject({ status: "pending_review", consentToPublish: true, email: "aicha@example.com", rating: 5 });
    expect(row.reviewedAt).toBeUndefined();
    expect(row.adminNotes).toContain(ADMIN_ENTRY_NOTE_PREFIX);
    expect(row.adminNotes).toContain("Message WhatsApp");
    expect(row.adminNotes).toContain("Capture WhatsApp du jour");
    expect(row.adminNotes).toContain("3M-2026-0012");
    expect(row.adminNotes).toContain("agent@3mtravelagency.com");
  });

  it("« Publier maintenant » : publié tout de suite, avec l'administrateur et la date de validation", async () => {
    const result = await caller().createByAdmin({ ...valid, publishNow: true });
    expect(result).toMatchObject({ success: true, published: true, message: "Témoignage publié." });
    const row = state.inserts[0].values;
    expect(row.status).toBe("approved");
    expect(row.reviewedByAdminEmail).toBe("agent@3mtravelagency.com");
    expect(row.reviewedAt).toBeInstanceOf(Date);
    expect(row.adminNotes).toContain("publié à la saisie");
  });

  it("sans e-mail : une adresse factice non routable est stockée (aucun envoi possible)", async () => {
    await caller().createByAdmin({ ...valid, email: "" });
    const email = state.inserts[0].values.email as string;
    expect(email).toMatch(/^temoignage-[0-9a-f]{12}@temoignage\.invalid$/);
    expect(isPlaceholderEmail(email)).toBe(true);
  });

  it("refuse sans l'accord du client, sans l'attestation d'authenticité ou sans preuve suffisante", async () => {
    await expect(caller().createByAdmin({ ...valid, consentToPublish: false as never })).rejects.toThrow();
    await expect(caller().createByAdmin({ ...valid, attestation: false as never })).rejects.toThrow();
    await expect(caller().createByAdmin({ ...valid, consentProof: "oui" })).rejects.toThrow();
    await expect(caller().createByAdmin({ ...valid, consentChannel: "telepathie" as never })).rejects.toThrow();
    expect(state.inserts).toEqual([]);
  });

  it("refuse une date d'accord invalide ou dans le futur", async () => {
    const future = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    await expect(caller().createByAdmin({ ...valid, consentDate: future })).rejects.toThrow(/futur/);
    await expect(caller().createByAdmin({ ...valid, consentDate: "12/10/2026" })).rejects.toThrow(/AAAA-MM-JJ/);
    await expect(caller().createByAdmin({ ...valid, consentDate: "2026-02-31" })).rejects.toThrow(/n’existe pas/);
    expect(state.inserts).toEqual([]);
  });

  it("refuse un témoignage déjà enregistré (même texte)", async () => {
    state.rows.set(customerReviews, [{ id: 3 }]);
    await expect(caller().createByAdmin(valid)).rejects.toThrow(/déjà enregistré/);
    expect(state.inserts).toEqual([]);
  });
});

describe("outil admin : correction et retrait", () => {
  beforeEach(() => state.rows.set(customerReviews, [reviewRow]));

  it("correction : seuls les champs modifiés sont écrits, le motif est ajouté à l'historique sans rien perdre", async () => {
    const result = await caller().updateByAdmin({ sessionToken: token, reviewId: 7, reviewText: "Texte d’origine du client (faute corrigée).", destinationCountry: "Canada", reason: "faute d’orthographe corrigée" });
    expect(result).toEqual({ success: true, changed: true });
    const values = state.updates[0].values;
    expect(values.reviewText).toBe("Texte d’origine du client (faute corrigée).");
    expect(values).not.toHaveProperty("destinationCountry"); // inchangé
    expect(values.adminNotes).toContain(ADMIN_ENTRY_NOTE_PREFIX);
    expect(values.adminNotes).toContain("faute d’orthographe corrigée");
    expect(values.adminNotes).toContain("reviewText");
  });

  it("correction sans changement : rien n'est écrit", async () => {
    const result = await caller().updateByAdmin({ sessionToken: token, reviewId: 7, reviewText: reviewRow.reviewText, reason: "aucun changement réel" });
    expect(result).toEqual({ success: true, changed: false });
    expect(state.updates).toEqual([]);
  });

  it("correction : motif obligatoire", async () => {
    await expect(caller().updateByAdmin({ sessionToken: token, reviewId: 7, reviewText: "Un autre texte suffisamment long.", reason: "ok" })).rejects.toThrow();
    expect(state.updates).toEqual([]);
  });

  it("retrait : l'accord de publication est retiré (l'avis disparaît du site), la preuve et l'historique restent", async () => {
    const result = await caller().withdrawReview({ sessionToken: token, reviewId: 7, reason: "le client a retiré son accord" });
    expect(result).toEqual({ success: true });
    const values = state.updates[0].values;
    expect(values).toMatchObject({ status: "rejected", consentToPublish: false });
    expect(values.adminNotes).toContain(ADMIN_ENTRY_NOTE_PREFIX);
    expect(values.adminNotes).toContain("Retiré de la publication");
    expect(values.adminNotes).toContain("le client a retiré son accord");
  });

  it("avis introuvable : NOT_FOUND", async () => {
    state.rows.set(customerReviews, []);
    await expect(caller().withdrawReview({ sessionToken: token, reviewId: 99, reason: "inconnu" })).rejects.toThrow(/non trouvé/);
    await expect(caller().updateByAdmin({ sessionToken: token, reviewId: 99, reviewText: "Un texte suffisamment long.", reason: "essai de correction" })).rejects.toThrow(/non trouvé/);
  });

  it("la liste admin signale les saisies de l'administration et le nom tel qu'il sera affiché", async () => {
    const list = await caller().listForAdmin({ sessionToken: token });
    expect(list[0]).toMatchObject({ adminEntered: true, displayName: "Aïcha" });
  });
});

describe("outil admin : fonctions pures", () => {
  it("date d'accord : valide, passée ou du jour", () => {
    expect(consentDateError("2026-10-12", new Date("2026-10-13T08:00:00Z"))).toBeNull();
    expect(consentDateError("2026-10-13", new Date("2026-10-13T08:00:00Z"))).toBeNull();
    expect(consentDateError("2027-01-01", new Date("2026-10-13T08:00:00Z"))).toMatch(/futur/);
    expect(consentDateError("abc")).toMatch(/format/);
  });

  it("notes : toutes les lignes de preuve sont présentes et reconnaissables", () => {
    const notes = buildAdminEntryNotes({ channel: "sms", consentDate: "2026-10-12", proof: "SMS archivé dans le dossier", adminEmail: "a@b.c", publishNow: false });
    expect(isAdminEntered(notes)).toBe(true);
    expect(notes).toContain("SMS");
    expect(notes).toContain("Dossier : non renseigné");
    expect(notes).toContain("enregistré pour validation");
    expect(isAdminEntered("Autre note")).toBe(false);
    expect(appendAdminNote(null, "ligne")).toBe("ligne");
    expect(appendAdminNote("a", "b")).toBe("a\nb");
    expect(placeholderEmail("abc123")).toBe("temoignage-abc123@temoignage.invalid");
  });
});

describe("outil admin : garde-fous du code", () => {
  it("le routeur n'a aucun chemin qui fabrique un témoignage sans preuve : preuve, attestation et accord sont des champs obligatoires", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("server/routers/customerReview.ts", "utf8").replace(/\r/g, "");
    const block = source.slice(source.indexOf("createByAdmin: publicProcedure"), source.indexOf("listApproved"));
    expect(block).toContain("consentToPublish: z.literal(true)");
    expect(block).toContain("attestation: z.literal(true)");
    expect(block).toContain("consentProof: z.string().trim().min(10)");
    expect(block).toContain("requireValidAdminSession(input.sessionToken)");
    // la liste publique ne montre que les avis publiés ET consentis (le retrait coupe le consentement)
    const listApproved = source.slice(source.indexOf("listApproved: publicProcedure"), source.indexOf("translateApproved"));
    expect(listApproved).toContain('eq(customerReviews.status, "approved")');
    expect(listApproved).toContain("eq(customerReviews.consentToPublish, true)");
  });
});
