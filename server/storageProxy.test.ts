import express from "express";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./_core/env", () => ({ ENV: { forgeApiUrl: "https://forge.test", forgeApiKey: "secret-key" } }));
import { contentDisposition, registerStorageProxy, safeDownloadName } from "./_core/storageProxy";
import { downloadHrefFor } from "../shared/storedFileUrl";

const realFetch = globalThis.fetch;
const forge = { presignStatuses: [] as number[], calls: 0, fileStatus: 200 };
const PDF = Buffer.from("%PDF-1.4 contenu du CV");

let server: ReturnType<ReturnType<typeof express>["listen"]>;
let base = "";

beforeAll(async () => {
  const app = express();
  registerStorageProxy(app);
  server = app.listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.startsWith("https://forge.test/v1/storage/presign/get")) {
      forge.calls += 1;
      const status = forge.presignStatuses.shift() ?? 200;
      if (status !== 200) return new Response("erreur du stockage", { status });
      return new Response(JSON.stringify({ url: "https://files.test/signed/cv.pdf?sig=abc" }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.startsWith("https://files.test/signed/")) return forge.fileStatus === 200 ? new Response(PDF, { status: 200, headers: { "content-type": "application/pdf", "content-length": String(PDF.length) } }) : new Response("absent", { status: forge.fileStatus });
    return realFetch(input as never, init);
  }) as typeof fetch;
});
afterAll(() => { globalThis.fetch = realFetch; server.close(); });
beforeEach(() => { forge.presignStatuses = []; forge.calls = 0; forge.fileStatus = 200; });

describe("accès aux fichiers déposés (CV, pièces)", () => {
  it("ouvrir : redirection vers un lien signé neuf, jamais mis en cache, à chaque ouverture", async () => {
    for (let i = 0; i < 3; i += 1) {
      const response = await fetch(`${base}/manus-storage/candidates/7/cv/mon-cv.pdf`, { redirect: "manual" });
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe("https://files.test/signed/cv.pdf?sig=abc");
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
    expect(forge.calls).toBe(3); // un lien signé demandé à chaque fois
  });

  it("une erreur passagère du stockage est retentée : le CV ne « disparaît » pas pour un raté", async () => {
    forge.presignStatuses = [502, 503];
    const response = await fetch(`${base}/manus-storage/candidates/7/cv/mon-cv.pdf`, { redirect: "manual" });
    expect(response.status).toBe(307);
    expect(forge.calls).toBe(3);
  });

  it("stockage durablement en panne : message clair (réessayer), jamais une page vide", async () => {
    forge.presignStatuses = [502, 502, 502];
    const response = await fetch(`${base}/manus-storage/candidates/7/cv/mon-cv.pdf`, { redirect: "manual" });
    expect(response.status).toBe(502);
    expect(await response.text()).toMatch(/Réessayez/);
  });

  it("fichier réellement absent : 404 expliqué, sans insister", async () => {
    forge.presignStatuses = [404];
    const response = await fetch(`${base}/manus-storage/candidates/7/cv/absent.pdf`, { redirect: "manual" });
    expect(response.status).toBe(404);
    expect(forge.calls).toBe(1);
    expect(await response.text()).toMatch(/n'a pas été supprimé/);
  });

  it("télécharger : le fichier est relayé avec son nom et en pièce jointe (l'attribut download d'un lien ne marche pas après une redirection)", async () => {
    const response = await fetch(`${base}/manus-storage/candidates/7/cv/mon-cv.pdf?download=1&name=${encodeURIComponent("CV Aïcha Nkolo.pdf")}`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain('attachment; filename="CV A_cha Nkolo.pdf"');
    expect(response.headers.get("content-disposition")).toContain("filename*=UTF-8''CV%20A%C3%AFcha%20Nkolo.pdf");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(Buffer.from(await response.arrayBuffer()).equals(PDF)).toBe(true);
    // et on peut le télécharger autant de fois qu'on veut
    const again = await fetch(`${base}/manus-storage/candidates/7/cv/mon-cv.pdf?download=1`);
    expect(Buffer.from(await again.arrayBuffer()).equals(PDF)).toBe(true);
  });

  it("téléchargement impossible côté stockage : erreur claire, pas de fichier vide", async () => {
    forge.fileStatus = 404;
    const response = await fetch(`${base}/manus-storage/candidates/7/cv/mon-cv.pdf?download=1`);
    expect(response.status).toBe(404);
    expect(response.headers.get("content-disposition")).toBeNull();
  });

  it("refuse une clé suspecte (remontée de répertoire, caractères de contrôle)", async () => {
    const traversal = await fetch(`${base}/manus-storage/candidates/..%2F..%2Fsecret`, { redirect: "manual" });
    expect(traversal.status).toBe(400);
    expect(forge.calls).toBe(0);
  });

  it("nom de fichier : jamais de chemin, de guillemet ni de caractère de contrôle", () => {
    expect(safeDownloadName('../../etc/pa"sswd\n.pdf', "k/x.pdf")).not.toMatch(/[\/"\n\\]/);
    expect(safeDownloadName("", "candidates/7/cv/mon-cv.pdf")).toBe("mon-cv.pdf");
    expect(safeDownloadName(undefined, "")).toBe("document");
    expect(contentDisposition("é.pdf")).toContain('filename="_.pdf"');
  });

  it("le lien de téléchargement des boutons passe par le serveur pour les fichiers du stockage, et reste inchangé pour une autre adresse", () => {
    expect(downloadHrefFor("/manus-storage/candidates/7/cv/a.pdf", "CV Aïcha.pdf")).toBe("/manus-storage/candidates/7/cv/a.pdf?download=1&name=CV%20A%C3%AFcha.pdf");
    expect(downloadHrefFor("/manus-storage/k/a.pdf")).toBe("/manus-storage/k/a.pdf?download=1");
    expect(downloadHrefFor("https://exemple.org/a.pdf", "a.pdf")).toBe("https://exemple.org/a.pdf");
    expect(downloadHrefFor(null)).toBe("");
  });
});

describe("service worker et fiche du dossier", () => {
  const read = (path: string) => readFileSync(resolve(__dirname, "..", path), "utf8");
  it("le service worker n'intercepte jamais les fichiers déposés et vide les anciens caches", () => {
    const sw = read("client/public/sw.js");
    expect(sw).toMatch(/pathname\.startsWith\('\/manus-storage\/'\)\) \{\s*return;\s*\}/);
    expect(sw).toContain("v61-fichiers-hors-cache");
  });
  it("les sources de documents de la fiche 360° ne renvoient plus une liste vide sur une erreur passagère", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("if (options.critical && !isMissingSchemaError(error)) throw error;");
    for (const label of ["agencyDossierDocuments", "requirements", "caseDocuments", "clientDocuments"]) expect(admin).toMatch(new RegExp(`"${label}", \\{ critical: true \\}`));
  });
  it("les boutons « Télécharger » utilisent le lien servi par le serveur", () => {
    for (const file of ["client/src/components/DocumentPreviewModal.tsx", "client/src/components/Candidate360Workspace.tsx", "client/src/components/DocumentsStatus.tsx", "client/src/components/AdminDocumentsManagement.tsx"]) expect(read(file)).toContain("downloadHrefFor(");
  });
});
