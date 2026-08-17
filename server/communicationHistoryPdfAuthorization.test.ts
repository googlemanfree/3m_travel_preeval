import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("export PDF de communications administrateur", () => {
  it("exige une session administrateur valide et inscrit l’export au journal du dossier", () => {
    const source = readFileSync(resolve(process.cwd(), "server/routers/admin.ts"), "utf8");
    const start = source.indexOf("recordCandidate360CommunicationExport:");
    const block = source.slice(start, source.indexOf("}),\n});", start));
    expect(block).toContain("requireValidAdminSession(input.sessionToken)");
    expect(block).toContain("caseActivityLogs");
    expect(block).toContain("communications_pdf_exported");
  });
});
