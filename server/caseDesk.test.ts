import { describe, expect, it } from "vitest";
import {
  DEPOSIT_MAX_BYTES,
  assertDecisionComment,
  checkDepositUpload,
  depositStorageKey,
  requirementNotification,
  resolveReceivedAt,
  statusAfterDeposit,
} from "./services/caseDesk";

const b64 = (bytes: number[] | Buffer) => Buffer.from(bytes).toString("base64");
const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a];
const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

describe("contrôle du fichier remis en agence", () => {
  it("accepte un PDF, un JPG et un PNG d'après le contenu, avec ou sans préfixe « data: »", () => {
    for (const [bytes, mime] of [[PDF, "application/pdf"], [JPEG, "image/jpeg"], [PNG, "image/png"]] as const) {
      const checked = checkDepositUpload({ fileName: "scan.dat", base64: b64(bytes) });
      expect(checked.ok && checked.mime).toBe(mime);
    }
    expect(checkDepositUpload({ fileName: "a.pdf", base64: `data:application/pdf;base64,${b64(PDF)}` }).ok).toBe(true);
  });

  it("refuse un contenu inconnu, un fichier vide, du texte non base64 et un fichier trop gros", () => {
    expect(checkDepositUpload({ fileName: "x.pdf", base64: b64(Buffer.from("MZ exécutable")) })).toMatchObject({ ok: false, message: expect.stringMatching(/Format non accepté/) });
    expect(checkDepositUpload({ fileName: "x.pdf", base64: "" })).toMatchObject({ ok: false });
    expect(checkDepositUpload({ fileName: "x.pdf", base64: "***pas du base64***" })).toMatchObject({ ok: false, message: expect.stringMatching(/pas lisible/) });
    const big = Buffer.concat([Buffer.from(PDF), Buffer.alloc(DEPOSIT_MAX_BYTES)]);
    expect(checkDepositUpload({ fileName: "x.pdf", base64: b64(big) })).toMatchObject({ ok: false, message: expect.stringMatching(/8 Mo/) });
  });

  it("le type déclaré par le nom ne compte pas : un exécutable nommé .pdf est refusé", () => {
    expect(checkDepositUpload({ fileName: "facture.pdf", base64: b64([0x4d, 0x5a, 0x90, 0x00, 0x03]) }).ok).toBe(false);
  });

  it("nettoie le nom du fichier (aucun chemin) et la clé de stockage n'en dépend pas pour la structure", () => {
    const checked = checkDepositUpload({ fileName: "../../etc/passwd é.pdf", base64: b64(PDF) });
    expect(checked.ok && checked.fileName).not.toMatch(/[\\/]|\.\./);
    const key = depositStorageKey({ caseId: 12, requirementId: 5, fileName: "passeport.pdf", now: new Date("2026-09-25T10:00:00Z") });
    expect(key).toMatch(/^case-documents\/12\/req-5\/2026-09-25-[0-9a-f]{16}-passeport\.pdf$/);
    expect(depositStorageKey({ caseId: 12, requirementId: null, fileName: "a.pdf" })).toContain("/libre/");
    expect(depositStorageKey({ caseId: 1, requirementId: 1, fileName: "a.pdf" })).not.toBe(depositStorageKey({ caseId: 1, requirementId: 1, fileName: "a.pdf" }));
  });
});

describe("décision sur une pièce", () => {
  it("un refus exige un commentaire utile ; les autres décisions non", () => {
    expect(() => assertDecisionComment("rejected", "")).toThrow(/corriger/);
    expect(() => assertDecisionComment("rejected", "abc")).toThrow();
    expect(assertDecisionComment("rejected", "  Photo floue :   scannez les deux pages. ")).toBe("Photo floue : scannez les deux pages.");
    expect(assertDecisionComment("approved", "")).toBeNull();
    expect(assertDecisionComment("waived", undefined)).toBeNull();
  });

  it("refuse une donnée sensible dans un commentaire visible du candidat", () => {
    expect(() => assertDecisionComment("rejected", "Votre numéro de passeport CE1234567 est illisible")).toThrow();
    expect(() => assertDecisionComment("approved", "IBAN FR7630006000011234567890189")).toThrow();
  });

  it("borne le commentaire à 1000 caractères", () => {
    expect(assertDecisionComment("approved", "a".repeat(1500))).toHaveLength(1000);
  });

  it("le dépôt est validé tout de suite seulement si l'équipe l'a contrôlé sur place", () => {
    expect(statusAfterDeposit(true)).toBe("approved");
    expect(statusAfterDeposit(false)).toBe("received");
  });
});

describe("messages au candidat", () => {
  it("existent pour chaque cas, en français, factuels et sans promesse", () => {
    const kinds = ["deposited", "deposited_validated", "approved", "rejected", "waived", "pending"] as const;
    for (const kind of kinds) {
      const note = requirementNotification({ kind, documentType: "Passeport", comment: kind === "rejected" ? "Scannez les deux pages." : null });
      expect(note.title, kind).toContain("Passeport");
      expect(note.body, kind).toContain("Passeport");
      expect(`${note.title} ${note.body}`, kind).not.toMatch(/garanti|assuré|visa obtenu/i);
      expect(note.type.length).toBeGreaterThan(3);
    }
    expect(requirementNotification({ kind: "rejected", documentType: "CV", comment: "Ajoutez vos dates." }).body).toContain("Ajoutez vos dates.");
    expect(requirementNotification({ kind: "deposited", documentType: "CV" }).title).toBe("Document reçu en agence : CV");
  });

  it("les types de notification reprennent ceux déjà annoncés par l'espace client (validée / à corriger)", () => {
    expect(requirementNotification({ kind: "approved", documentType: "CV" }).type).toBe("document_approved");
    expect(requirementNotification({ kind: "rejected", documentType: "CV", comment: "Ajoutez vos dates." }).type).toBe("document_rejected");
  });
});

describe("date de remise", () => {
  const now = new Date("2026-09-25T10:00:00Z");
  it("garde une date plausible, sinon aujourd'hui", () => {
    expect(resolveReceivedAt("2026-09-20", now).toISOString().slice(0, 10)).toBe("2026-09-20");
    expect(resolveReceivedAt("2026-12-31", now)).toBe(now); // futur
    expect(resolveReceivedAt("2020-01-01", now)).toBe(now); // trop ancien
    expect(resolveReceivedAt("pas une date", now)).toBe(now);
    expect(resolveReceivedAt(undefined, now)).toBe(now);
    expect(resolveReceivedAt("2026-13-45", now)).toBe(now);
  });
});
