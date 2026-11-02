import { describe, expect, it } from "vitest";
import { sortPayments } from "../shared/paymentSort";

const rows = [
  { id: 3, fullName: "Éric Zola", paymentStatus: "SUCCESS", amount: 65000, confirmedAmount: 100000 },
  { id: 2, fullName: "Alice Biya", paymentStatus: "PENDING", amount: 65000 },
  { id: 5, fullName: "alain Nkou", paymentStatus: "PENDING", amount: 40000 },
  { id: 4, fullName: "Zoé Mba", paymentStatus: "FAILED", amount: 65000 },
];
const ids = (mode: Parameters<typeof sortPayments>[1]) => sortPayments(rows, mode).map((row) => row.id);

describe("tri des paiements", () => {
  it("plus récents / plus anciens", () => {
    expect(ids("recent")).toEqual([5, 4, 3, 2]);
    expect(ids("oldest")).toEqual([2, 3, 4, 5]);
  });

  it("à traiter d'abord : en attente (le plus ancien en tête), puis échoués, puis payés", () => {
    expect(ids("pending_first")).toEqual([2, 5, 4, 3]);
  });

  it("nom sans tenir compte des accents ni de la casse", () => {
    // « alain » précède « Alice » (a-l-a avant a-l-i), « Éric » compte comme un E.
    expect(ids("name")).toEqual([5, 2, 3, 4]);
  });

  it("montant : le montant confirmé l'emporte sur le montant attendu", () => {
    expect(ids("amount_desc")).toEqual([3, 4, 2, 5]);
  });

  it("ne modifie pas la liste d'origine", () => {
    const before = rows.map((row) => row.id);
    sortPayments(rows, "name");
    expect(rows.map((row) => row.id)).toEqual(before);
  });
});
