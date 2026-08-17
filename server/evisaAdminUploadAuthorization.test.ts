import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

const requireValidAdminSession = vi.fn();
vi.mock("./routers/adminAuth", () => ({ requireValidAdminSession }));

const { evisaRouter } = await import("./routers/evisaRouter");

describe("adminUploadEvisaPdf", () => {
  it("rejette un jeton présent mais non valide avant toute lecture ou approbation de demande", async () => {
    requireValidAdminSession.mockRejectedValueOnce(new TRPCError({ code: "UNAUTHORIZED", message: "Session invalide" }));
    const caller = evisaRouter.createCaller({} as never);

    await expect(caller.adminUploadEvisaPdf({
      sessionToken: "jeton-falsifie",
      requestId: 42,
      fileName: "evisa.pdf",
      fileBase64: Buffer.from("%PDF-1.7\nDémonstration").toString("base64"),
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(requireValidAdminSession).toHaveBeenCalledWith("jeton-falsifie");
  });

  it("refuse un fichier non PDF même lorsqu’une session administrateur est valide", async () => {
    requireValidAdminSession.mockResolvedValueOnce({ id: 1, status: "active" });
    const caller = evisaRouter.createCaller({} as never);

    await expect(caller.adminUploadEvisaPdf({
      sessionToken: "session-admin-valide",
      requestId: 42,
      fileName: "document.pdf",
      fileBase64: Buffer.from("ceci n’est pas un PDF").toString("base64"),
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
