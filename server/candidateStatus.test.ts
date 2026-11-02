import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ACTIVATED_STATUSES, PRE_DOSSIER_STATUSES, isActivatedStatus, isPreDossierStatus } from "../shared/candidateStatus";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");

describe("un compte « evaluation » n'est ni activé ni payé", () => {
  it("nouveau et evaluation sont des pré-dossiers ; seuls documents, traitement, soumis, approuvé et refusé sont des dossiers activés", () => {
    expect([...PRE_DOSSIER_STATUSES]).toEqual(["nouveau", "evaluation"]);
    expect([...ACTIVATED_STATUSES]).toEqual(["documents", "traitement", "soumis", "approuve", "refuse"]);
    for (const status of ["nouveau", "evaluation", "", null, undefined, " Evaluation "]) {
      expect(isPreDossierStatus(status), String(status)).toBe(true);
      expect(isActivatedStatus(status), String(status)).toBe(false);
    }
    for (const status of ACTIVATED_STATUSES) {
      expect(isActivatedStatus(status), status).toBe(true);
      expect(isPreDossierStatus(status), status).toBe(false);
    }
    expect(isActivatedStatus("statut-inconnu")).toBe(false);
    expect(isPreDossierStatus("statut-inconnu")).toBe(false);
  });

  it("aucun contrôle serveur ne lit plus « différent de nouveau » comme « activé » (tout candidat qui dépose son CV passe à « evaluation »)", () => {
    const folders = ["server/routers", "server/services"];
    const offenders: string[] = [];
    for (const folder of folders) {
      for (const name of readdirSync(resolve(process.cwd(), folder)).filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))) {
        const lines = read(`${folder}/${name}`).split("\n");
        lines.forEach((line, index) => {
          if (/dossierStatus\s*!==\s*"nouveau"/.test(line)) offenders.push(`${folder}/${name}:${index + 1}`);
        });
      }
    }
    // Seules exceptions : « le candidat a-t-il un dossier suivi ? » (candidate.ts), qui inclut volontairement le stade évaluation.
    const allowed = offenders.filter((item) => item.startsWith("server/routers/candidate.ts"));
    expect(offenders.filter((item) => !allowed.includes(item))).toEqual([]);
    expect(allowed.length).toBeLessThanOrEqual(2);
    const candidate = read("server/routers/candidate.ts");
    for (const item of allowed) {
      const line = Number(item.split(":")[1]);
      expect(candidate.split("\n").slice(line - 3, line).join("\n")).toContain("candidateHasTrackedDossier");
    }
  });

  it("les écrans et contrôles qui décident « activé » ou « payé » passent par la règle commune", () => {
    expect(read("server/routers/adminCandidateManagement.ts")).toContain("const paymentConfirmed = isActivatedStatus(account.dossierStatus) || openingPaidIds.has(account.id);");
    expect(read("server/routers/adminCandidateManagement.ts")).toContain("dossierActivated: isActivatedStatus(account.dossierStatus) || activeEmails.has(emailKey),");
    expect(read("server/routers/admin.ts")).toContain("const dossierActivated = isActivatedStatus(account.dossierStatus) || Boolean(linkedAgencyDossierId);");
    expect(read("server/routers/candidate.ts")).toContain("hasAgencyDossier: isActivatedStatus(ctx.candidate.dossierStatus),");
    expect(read("server/services/autoActivatePreDossier.ts")).toContain("isActivatedStatus(candidate.dossierStatus)");
    expect(read("server/services/deactivateDossier.ts")).toContain("isPreDossierStatus(candidate.dossierStatus)");
    // L'écran de traitement d'un compte : un compte « evaluation » reste un pré-dossier (bilan à préparer, ouverture à confirmer), jamais « déjà activé ».
    expect(read("client/src/pages/AdminDashboard.tsx")).toContain("isPreDossierStatus(candidate?.internalStatus) ? (");
  });
});
