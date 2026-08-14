import { describe, it, expect } from "vitest";

describe("Executive Analytics Dashboard by Destination", () => {
  it("aggregates dossier volume by destination correctly", () => {
    const rawApplications = [
      { id: 1, destination: "Canada", status: "en_cours" },
      { id: 2, destination: "Canada", status: "valide" },
      { id: 3, destination: "Schengen", status: "en_attente" },
      { id: 4, destination: "États-Unis", status: "en_cours" },
    ];

    const volumeByDestination = rawApplications.reduce((acc: Record<string, number>, app) => {
      acc[app.destination] = (acc[app.destination] || 0) + 1;
      return acc;
    }, {});

    expect(volumeByDestination["Canada"]).toBe(2);
    expect(volumeByDestination["Schengen"]).toBe(1);
    expect(volumeByDestination["États-Unis"]).toBe(1);
  });
});
