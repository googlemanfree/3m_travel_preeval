import { describe, expect, it } from "vitest";
import { CHECKLISTS, DOCUMENT_STATUS_LABELS, checklistSummary, computeChecklist, daysUntil, type ChecklistDocument } from "../shared/documentChecklist";

const NOW = new Date("2026-11-13T10:00:00Z");
const doc = (over: Partial<ChecklistDocument> & { documentType: string }): ChecklistDocument => ({ id: 1, name: "f.pdf", uploadedAt: new Date("2026-11-01"), intake: { status: "lisible", expiresOn: null, verification: "non_verifie", verificationNote: null, duplicateOf: null }, ...over });
const byId = (items: ReturnType<typeof computeChecklist>, id: string) => items.find((item) => item.id === id)!;

describe("liste de pièces par projet", () => {
  it("chaque projet a une liste, avec un libellé de statut français", () => {
    for (const items of Object.values(CHECKLISTS)) expect(items.length).toBeGreaterThan(0);
    expect(Object.values(DOCUMENT_STATUS_LABELS).every(Boolean)).toBe(true);
    expect(CHECKLISTS.travail.some((item) => item.id === "cv" && item.required)).toBe(true);
  });
  it("aucune pièce : tout est « à fournir »", () => {
    expect(computeChecklist("travail", [], NOW).every((item) => item.status === "a_fournir")).toBe(true);
  });
  it("une pièce lisible est « lisible », jamais « vérifiée » sans action de l'agence", () => {
    const items = computeChecklist("travail", [doc({ documentType: "cv" })], NOW);
    expect(byId(items, "cv").status).toBe("lisible");
    const verified = computeChecklist("travail", [doc({ documentType: "cv", intake: { status: "lisible", expiresOn: null, verification: "verifie", verificationNote: null, duplicateOf: null } })], NOW);
    expect(byId(verified, "cv").status).toBe("verifie");
  });
  it("une pièce sans contrôle (déposée avant la fonction) est « reçue »", () => {
    expect(byId(computeChecklist("travail", [doc({ documentType: "cv", intake: null })], NOW), "cv").status).toBe("recu");
  });
  it("une pièce à lire mais non lisible est « à mettre à jour » avec la raison, une pièce sans lecture requise reste reçue", () => {
    const unreadable = { status: "texte_absent" as const, expiresOn: null, verification: "non_verifie" as const, verificationNote: null, duplicateOf: null };
    const items = computeChecklist("travail", [doc({ documentType: "cv", intake: unreadable }), doc({ id: 2, documentType: "passport", intake: unreadable })], NOW);
    expect(byId(items, "cv")).toMatchObject({ status: "a_mettre_a_jour" });
    expect(byId(items, "cv").reason).toMatch(/texte est sélectionnable/);
    expect(byId(items, "passeport").status).toBe("recu");
  });
  it("un fichier invalide est toujours à redéposer", () => {
    const items = computeChecklist("travail", [doc({ documentType: "passport", intake: { status: "invalide", expiresOn: null, verification: "non_verifie", verificationNote: null, duplicateOf: null } })], NOW);
    expect(byId(items, "passeport")).toMatchObject({ status: "a_mettre_a_jour", reason: expect.stringMatching(/illisible ou abîmé/) });
  });
  it("passeport expiré ou qui expire dans 60 jours : à mettre à jour ; sinon la date n'a pas d'effet", () => {
    const withExpiry = (expiresOn: string) => computeChecklist("travail", [doc({ documentType: "passport", intake: { status: "lisible", expiresOn, verification: "non_verifie", verificationNote: null, duplicateOf: null } })], NOW);
    expect(byId(withExpiry("2026-10-01"), "passeport")).toMatchObject({ status: "a_mettre_a_jour", reason: "Expiré depuis le 2026-10-01" });
    expect(byId(withExpiry("2027-01-05"), "passeport").reason).toMatch(/Expire le 2027-01-05 \(dans 53 jour\(s\)\)/);
    expect(byId(withExpiry("2028-01-05"), "passeport").status).toBe("lisible");
    expect(daysUntil("2026-11-14", NOW)).toBe(1);
  });
  it("le remplacement demandé par l'agence prime, avec son motif", () => {
    const items = computeChecklist("travail", [doc({ documentType: "diploma", intake: { status: "lisible", expiresOn: null, verification: "a_remplacer", verificationNote: "Page de garde manquante", duplicateOf: null } })], NOW);
    expect(byId(items, "diplome")).toMatchObject({ status: "a_mettre_a_jour", reason: "Page de garde manquante" });
  });
  it("seule la pièce la plus récente d'un type compte (versions)", () => {
    const old = doc({ id: 1, documentType: "cv", uploadedAt: new Date("2026-10-01"), intake: { status: "texte_absent", expiresOn: null, verification: "non_verifie", verificationNote: null, duplicateOf: null } });
    const recent = doc({ id: 2, documentType: "cv", uploadedAt: new Date("2026-11-10") });
    const item = byId(computeChecklist("travail", [old, recent], NOW), "cv");
    expect(item).toMatchObject({ status: "lisible", documentId: 2 });
  });
  it("un doublon est signalé", () => {
    const items = computeChecklist("travail", [doc({ documentType: "cv", intake: { status: "lisible", expiresOn: null, verification: "non_verifie", verificationNote: null, duplicateOf: 5 } })], NOW);
    expect(byId(items, "cv").duplicate).toBe(true);
    expect(checklistSummary(items).duplicates).toBe(1);
  });
  it("le résumé compte les pièces manquantes, à mettre à jour, et la complétude des pièces obligatoires", () => {
    const empty = checklistSummary(computeChecklist("tourisme", [], NOW));
    expect(empty).toMatchObject({ missing: 1, complete: false });
    const full = checklistSummary(computeChecklist("tourisme", [doc({ documentType: "passport" })], NOW));
    expect(full).toMatchObject({ missing: 0, toUpdate: 0, complete: true });
  });
});
