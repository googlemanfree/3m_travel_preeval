import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { EXCERPT_LENGTH, buildCandidateMessageAlert, candidateMessageExcerpt } from "./services/candidateMessageAlert";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");

describe("alerte de l'administration à chaque message du candidat", () => {
  it("nomme l'auteur et sa référence, avec un extrait d'une ligne", () => {
    const alert = buildCandidateMessageAlert({ candidateId: 12, fullName: "Aïcha  Nkolo", content: "Bonjour,\n\nje n'arrive pas à envoyer mon passeport.", hasAttachment: false });
    expect(alert.type).toBe("new_contact_message");
    expect(alert.title).toBe("Nouveau message de Aïcha Nkolo");
    expect(alert.message).toBe("COMPTE-00012 — Bonjour, je n'arrive pas à envoyer mon passeport.");
    expect(alert.targetAdminType).toBe("accompagnement");
  });

  it("borne l'extrait et signale une pièce jointe", () => {
    const long = candidateMessageExcerpt("x".repeat(500), false);
    expect(long.length).toBeLessThanOrEqual(EXCERPT_LENGTH);
    expect(long.endsWith("…")).toBe(true);
    expect(candidateMessageExcerpt("Voici mon acte", true)).toBe("Voici mon acte (+ pièce jointe)");
    expect(candidateMessageExcerpt("Pièce jointe envoyée.", true)).toBe("Pièce jointe envoyée.");
    expect(candidateMessageExcerpt("   ", false)).toBe("(message vide)");
  });

  it("un nom vide retombe sur la référence", () => {
    expect(buildCandidateMessageAlert({ candidateId: 3, fullName: "  ", content: "x", hasAttachment: false }).title).toBe("Nouveau message de COMPTE-00003");
  });
});

describe("procédure sendMessage du candidat", () => {
  const source = read("server/routers/candidate.ts");
  const send = source.slice(source.indexOf("sendMessage: candidateProcedure"), source.indexOf("unreadCount: candidateProcedure"));

  it("le plafond s'applique avant toute lecture ou écriture en base", () => {
    expect(send.indexOf("candidateMessageGuard.assertAllowed(")).toBeGreaterThan(-1);
    expect(send.indexOf("candidateMessageGuard.assertAllowed(")).toBeLessThan(send.indexOf("await getDb()"));
    expect(source).toContain("const candidateMessageGuard = createSubmissionGuard({");
  });

  it("l'alerte part après l'enregistrement du message", () => {
    expect(send.indexOf("db.insert(candidateMessages)")).toBeGreaterThan(-1);
    expect(send.indexOf("notifyAdmins(buildCandidateMessageAlert(")).toBeGreaterThan(send.indexOf("db.insert(candidateMessages)"));
  });
});
