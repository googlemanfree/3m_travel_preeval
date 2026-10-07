import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/AdminDashboard.tsx"), "utf8");

describe("AdminDashboard — un seul <TabsContent> par valeur d'onglet", () => {
  it("l'onglet « Réservations vols » n'a plus deux <TabsContent value=\"flights\"> empilés l'un sur l'autre", () => {
    const matches = source.match(/<TabsContent value="flights"/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it("le contenu fusionné garde la file de demandes, la supervision technique et les réglages de commission, dans un seul bloc", () => {
    const start = source.indexOf('<TabsContent value="flights"');
    const end = source.indexOf("</TabsContent>", start);
    const flightsTab = source.slice(start, end);
    expect(flightsTab).toContain("<FlightAgentDashboard />");
    expect(flightsTab).toContain("<SearchApiMonitoring />");
    expect(flightsTab).toContain("<FlightCommissionSettings />");
    // Les deux sous-sections restent visuellement distinctes plutôt que juste empilées sans titre.
    expect(flightsTab).toContain("Supervision technique");
  });

  it("garde-fou général : aucune autre valeur d'onglet n'est déclarée en double dans ce fichier", () => {
    const values = Array.from(source.matchAll(/<TabsContent value="([^"]+)"/g), (match) => match[1]);
    const counts = new Map<string, number>();
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
    const duplicated = [...counts.entries()].filter(([, count]) => count > 1);
    expect(duplicated).toEqual([]);
  });
});
