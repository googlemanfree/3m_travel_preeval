import { describe, expect, it } from "vitest";
import { evisasDatabaseComplete } from "../client/src/data/evisasDatabaseComplete";

describe("catalogue e‑Visa complété", () => {
  it("inclut toutes les destinations ajoutées avec un avertissement de vérification officielle", () => {
    const ids = [
      "cote-divoire", "malawi", "zambie", "zimbabwe", "mozambique", "madagascar", "seychelles",
      "vietnam", "laos", "qatar", "ouzbekistan", "indonesie", "bolivie", "suriname", "papouasie-nouvelle-guinee",
    ];
    const verificationFirstIds = ids.filter((id) => id !== "vietnam");
    for (const id of ids) {
      const destination = evisasDatabaseComplete.find((entry) => entry.id === id);
      expect(destination, `destination manquante : ${id}`).toBeDefined();
    }
    for (const id of verificationFirstIds) {
      const destination = evisasDatabaseComplete.find((entry) => entry.id === id);
      expect(destination?.note).toContain("Vérification obligatoire");
      expect(destination?.fee).toContain("À confirmer");
    }
  });
});
