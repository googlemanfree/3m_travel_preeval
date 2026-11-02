import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DOCUMENT_REJECTION_REASONS,
  DOCUMENT_REJECTION_REASON_MAX_LENGTH,
  composeRejectionComment,
  countRejectionReasons,
  parseRejectionReason,
} from "../shared/documentRejectionReasons";

describe("motifs standard de renvoi d'une pièce", () => {
  it("chaque motif a un code unique, un intitulé court et une consigne exploitable (sans promesse de résultat)", () => {
    const codes = DOCUMENT_REJECTION_REASONS.map((item) => item.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const reason of DOCUMENT_REJECTION_REASONS) {
      expect(reason.label.length).toBeGreaterThan(5);
      expect(reason.label).not.toContain(":");
      expect(reason.instruction.length).toBeGreaterThan(20);
      expect(`${reason.label} ${reason.instruction}`).not.toMatch(/garanti|assur[ée]|visa accord/i);
    }
  });

  it("le commentaire commence par l'intitulé, puis la précision libre ; sans motif, il reste libre", () => {
    const comment = composeRejectionComment("illisible", "Le tampon est effacé.");
    expect(comment.startsWith("Document illisible : ")).toBe(true);
    expect(comment.endsWith("Le tampon est effacé.")).toBe(true);
    expect(composeRejectionComment(null, "  Merci de renvoyer la page 2.  ")).toBe("Merci de renvoyer la page 2.");
    expect(composeRejectionComment("expire")).toBe(`Document expiré : ${DOCUMENT_REJECTION_REASONS.find((item) => item.code === "expire")!.instruction}`);
  });

  it("le commentaire ne dépasse jamais la limite acceptée par le serveur", () => {
    expect(composeRejectionComment("illisible", "x".repeat(5000)).length).toBe(DOCUMENT_REJECTION_REASON_MAX_LENGTH);
  });

  it("retrouve le motif standard d'un commentaire enregistré, et classe le reste en « libre »", () => {
    expect(parseRejectionReason(composeRejectionComment("mauvais_document", "Voir page 3."))).toBe("mauvais_document");
    expect(parseRejectionReason("Merci de renvoyer la page 2.")).toBeNull();
    expect(parseRejectionReason("")).toBeNull();
    expect(parseRejectionReason(null)).toBeNull();

    const counts = countRejectionReasons([
      composeRejectionComment("illisible"),
      composeRejectionComment("illisible", "Page 1."),
      composeRejectionComment("expire"),
      "Commentaire libre ancien",
      "",
      null,
    ]);
    expect(counts.illisible).toBe(2);
    expect(counts.expire).toBe(1);
    expect(counts.libre).toBe(1);
    expect(counts.doublon).toBe(0);
  });

  it("l'écran de renvoi propose les motifs et reste compatible avec le serveur (commentaire libre accepté)", () => {
    const source = readFileSync(resolve(import.meta.dirname, "..", "client/src/components/AdminDocumentsManagement.tsx"), "utf8").replace(/\r/g, "");
    expect(source).toContain('data-testid="rejection-reason-presets"');
    expect(source).toContain("DOCUMENT_REJECTION_REASONS.map((reason)");
    expect(source).toContain("composeRejectionComment(code)");
    // L'envoi ne change pas : toujours le commentaire (modifiable) saisi ou composé.
    expect(source).toContain("comment: rejectionReason,");
  });
});
