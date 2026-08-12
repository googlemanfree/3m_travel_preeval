import { describe, expect, it } from "vitest";
import { caseTrackingRouter } from "./routers/caseTracking";

describe("caseTrackingRouter", () => {
  it("refuse la liste de dossiers sans session candidate", async () => {
    const caller = caseTrackingRouter.createCaller({ candidate: null } as any);
    await expect(caller.getMyCases()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("refuse le téléchargement d’un document sans session candidate", async () => {
    const caller = caseTrackingRouter.createCaller({ candidate: null } as any);
    await expect(caller.downloadMyDocument({ documentId: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
