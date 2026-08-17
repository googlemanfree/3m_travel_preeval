import { describe, expect, it } from "vitest";
import { evisasDatabaseComplete } from "./evisasDatabaseComplete";

describe("catalogue e‑Visa complété", () => {
  it("inclut toutes les destinations ajoutées avec un avertissement de vérification officielle", () => {
    const ids = [
      "cote-divoire", "malawi", "zambie", "zimbabwe", "mozambique", "madagascar", "seychelles",
      "vietnam", "laos", "qatar", "ouzbekistan", "indonesie", "bolivie", "suriname", "papouasie-nouvelle-guinee",
    ];
    for (const id of ids) {
      const destination = evisasDatabaseComplete.find((entry) => entry.id === id);
      expect(destination, `destination manquante : ${id}`).toBeDefined();
      expect(destination?.note).toContain("Vérification obligatoire");
      expect(destination?.fee).toContain("À confirmer");
    }
  });
});
