import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8").replace(/\r/g, "");

// Le lien « définir mon mot de passe » (jeton à usage unique) donne la main sur le compte d'un client :
// il part au client par e-mail / WhatsApp et n'est JAMAIS renvoyé dans une réponse d'API à l'administrateur
// (il finirait dans les outils réseau, journaux, captures d'écran et messageries).
describe("renvoi d'accès client : le lien secret ne revient pas à l'administrateur", () => {
  const service = read("server/services/resendClientAccessLink.ts");

  it("le résultat du renvoi ne contient ni lien de mot de passe ni jeton", () => {
    const typeBlock = service.slice(service.indexOf("export type ResendClientAccessResult"), service.indexOf("};", service.indexOf("export type ResendClientAccessResult")));
    expect(typeBlock).not.toMatch(/setPasswordUrl|rawToken|token/i);
    const finalReturn = service.slice(service.lastIndexOf("return {\n    success: true"));
    expect(finalReturn).not.toMatch(/setPasswordUrl|rawToken|tokenHash/);
  });

  it("le lien reste utilisé pour l'e-mail et WhatsApp du client", () => {
    expect(service).toContain("setPasswordUrl,\n      isResend: true");
    expect(service).toContain("accessUrl: setPasswordUrl");
  });

  it("l'import d'un dossier agence répond avec le lien de connexion public, pas avec le lien de mot de passe", () => {
    const admin = read("server/routers/admin.ts");
    const response = admin.slice(admin.indexOf("          clientInviteSent,\n"), admin.indexOf("whatsappSent,", admin.indexOf("          clientInviteSent,\n")));
    expect(response).toContain("clientAccessUrl: buildCandidateSpaceAccessUrl(folderCode)");
    expect(response).not.toContain("setPasswordUrl");
  });

  it("aucun écran d'administration n'attend ce lien dans la réponse", () => {
    for (const file of ["client/src/components/AdminContractsReceiptsDesk.tsx", "client/src/components/Candidate360Workspace.tsx"]) {
      expect(read(file), file).not.toContain("setPasswordUrl");
    }
  });
});
