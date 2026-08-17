import { describe, expect, it } from "vitest";
import { evisasDatabaseComplete } from "../client/src/data/evisasDatabaseComplete";
import { buildEvisaMessageTemplate } from "../client/src/lib/evisaMessageTemplate";

describe("modèle de message e‑Visa administrateur", () => {
  it("insère le portail officiel, les exigences et le lien de procédure de la destination sélectionnée", () => {
    const destination = evisasDatabaseComplete.find((item) => item.id === "togo");
    expect(destination).toBeDefined();
    const content = buildEvisaMessageTemplate(destination!, "https://www.3mtravelagency.com/");
    expect(content).toContain("https://voyage.gouv.tg/");
    expect(content).toContain(destination!.docs);
    expect(content).toContain("/evisas/request?destination=togo");
    expect(content).toContain(destination!.officialVerifiedAt!);
  });
});
