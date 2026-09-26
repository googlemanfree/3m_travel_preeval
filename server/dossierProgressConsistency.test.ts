import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getEnrichedCandidateJourney, journeyStepIndex } from "../shared/candidateJourneyCatalog";
import {
  ADMIN_STAGE_TO_AGENCY_STATUS,
  ADMIN_STAGE_TO_ONLINE_STATUS,
  CLIENT_DOSSIER_STATUS_LABELS,
  clientStatusLabel,
  describeDossierProgress,
  progressText,
} from "../shared/dossierProgress";
import { buildProcedureUpdateEmail } from "./services/procedureProgressEmail";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");
const journey = getEnrichedCandidateJourney("Canada", "Permis d'études", "Permis d'études");
const idx = (status: string, milestones = {}) => journeyStepIndex(journey, status, "validated", milestones);

describe("étape affichée dans l'espace client selon le statut", () => {
  it("un paiement confirmé ne ramène jamais un dossier avancé à l'étape des pièces (bug : espace client figé à l'étape 7)", () => {
    const paid = { paymentConfirmed: true };
    expect(idx("soumis_agences", paid)).toBe(idx("soumis_agences"));
    expect(idx("contrat_obtenu", paid)).toBe(idx("contrat_obtenu"));
    expect(idx("visa_approuve", paid)).toBe(idx("visa_approuve"));
    expect(idx("approuve", paid)).toBe(journey.steps.length - 1);
    expect(idx("visa_approuve", paid)).toBeGreaterThan(idx("en_attente_documents", paid));
  });

  it("pièces attendues = étape des pièces ; pièces reçues = étape suivante (contrôle du profil), payé ou non", () => {
    for (const paid of [{}, { paymentConfirmed: true }]) {
      expect(journey.steps[idx("en_attente_documents", paid)].id).toBe("supporting_documents");
      expect(journey.steps[idx("documents_requis", paid)].id).toBe("supporting_documents");
      expect(journey.steps[idx("documents_recus", paid)].id).toBe("profile_processing");
    }
  });

  it("l'ordre des étapes suit l'ordre des statuts du dossier", () => {
    const order = ["nouveau", "bilan_envoye", "en_attente_paiement", "paye", "en_attente_documents", "documents_recus", "soumis_agences", "contrat_obtenu", "visa_approuve"];
    const indexes = order.map((status) => idx(status));
    expect([...indexes].sort((a, b) => a - b)).toEqual(indexes);
  });
});

describe("avancement décrit au client : une seule source", () => {
  it("donne « étape N sur M », le libellé du parcours et l'étape suivante", () => {
    const progress = describeDossierProgress({ destination: "Canada", visaType: "Permis d'études", dossierStatus: "en_attente_documents" });
    expect(progress).toMatchObject({ stepNumber: 7, stepCount: journey.steps.length, stepLabel: "Pièces justificatives de la procédure", nextStepLabel: "Traitement du profil après pièces", refused: false, statusLabel: "Documents à compléter" });
    expect(progress.percent).toBe(Math.round((6 / journey.steps.length) * 100));
  });

  it("l'étape décrite est exactement celle de l'espace client (même fonction journeyStepIndex)", () => {
    for (const status of Object.keys(CLIENT_DOSSIER_STATUS_LABELS).filter((s) => s !== "refuse")) {
      const progress = describeDossierProgress({ destination: "Canada", visaType: "Permis d'études", dossierStatus: status, milestones: { paymentConfirmed: true } });
      expect(progress.stepNumber, status).toBe(journeyStepIndex(journey, status, "validated", { paymentConfirmed: true }) + 1);
    }
  });

  it("un dossier refusé n'annonce aucune étape en cours", () => {
    const progress = describeDossierProgress({ destination: "Canada", visaType: "Permis d'études", dossierStatus: "refuse" });
    expect(progress).toMatchObject({ refused: true, stepNumber: null, statusLabel: "Décision défavorable" });
    expect(progressText(progress)).not.toMatch(/Étape \d/);
  });

  it("libellés clients : tous les statuts internes connus, jamais de vocabulaire administrateur", () => {
    for (const status of [...Object.values(ADMIN_STAGE_TO_ONLINE_STATUS), ...Object.values(ADMIN_STAGE_TO_AGENCY_STATUS)]) {
      expect(CLIENT_DOSSIER_STATUS_LABELS[status], status).toBeTruthy();
    }
    expect(clientStatusLabel("inconnu")).toBe("Suivi en cours");
    expect(clientStatusLabel(null)).toBe("Suivi en cours");
    for (const label of Object.values(CLIENT_DOSSIER_STATUS_LABELS)) expect(label).not.toMatch(/48h|Consulaire Disponible|Collecte/);
  });

  it("texte des notifications : même formulation que l'e-mail", () => {
    const progress = describeDossierProgress({ destination: "Canada", visaType: "Permis d'études", dossierStatus: "soumis_agences" });
    const email = buildProcedureUpdateEmail({ fullName: "Aïcha", folderCode: "3M-2026-1", progress, siteUrl: "https://site.example" });
    expect(progressText(progress)).toContain(`Étape ${progress.stepNumber} sur ${progress.stepCount} : ${progress.stepLabel}`);
    expect(email.html).toContain(`Étape ${progress.stepNumber} sur ${progress.stepCount} :`);
    expect(email.html).toContain(progress.stepLabel!);
    expect(email.html).toContain(progress.statusLabel);
  });
});

describe("e-mail de mise à jour de dossier", () => {
  const progress = describeDossierProgress({ destination: "Allemagne", visaType: "Formation", dossierStatus: "en_attente_documents" });

  it("renvoie vers l'espace client et rappelle que les étapes sont indicatives", () => {
    const { subject, html } = buildProcedureUpdateEmail({ fullName: "Paul", folderCode: "3M-2026-2", progress, siteUrl: "https://site.example/" });
    expect(subject).toContain("3M-2026-2");
    expect(html).toContain("https://site.example/mon-espace");
    expect(html).toContain("indicatives");
    expect(html).toContain("Étape suivante");
  });

  it("neutralise le HTML et les retours à la ligne venus des données saisies", () => {
    const { subject, html } = buildProcedureUpdateEmail({ fullName: "<img src=x onerror=1>", folderCode: "REF\r\nBcc: x@y.z", progress, siteUrl: "https://site.example", note: "<script>x</script>\nligne 2" });
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("<br/>ligne 2");
    expect(subject).not.toMatch(/[\r\n]/);
  });

  it("dossier refusé : statut affiché, aucune étape ni barre de progression", () => {
    const refused = describeDossierProgress({ destination: "Canada", visaType: "Permis d'études", dossierStatus: "refuse" });
    const { html } = buildProcedureUpdateEmail({ fullName: "Paul", folderCode: "3M-2026-3", progress: refused, siteUrl: "https://site.example" });
    expect(html).toContain("Décision défavorable");
    expect(html).not.toContain("Étape ");
  });
});

describe("les courriers et l'espace client utilisent la source unique", () => {
  it("les deux e-mails de changement d'étape et la notification passent par shared/dossierProgress", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("buildProcedureUpdateEmail(");
    expect(admin.match(/buildProcedureUpdateEmail\(/g)!.length).toBeGreaterThanOrEqual(2);
    expect(admin).not.toContain("vient d'être mis à jour");
    expect(admin).not.toContain("Une correction administrative a été appliquée au suivi de votre dossier <strong>");
    const management = read("server/routers/adminCandidateManagement.ts");
    expect(management).toContain("progressText(progress)");
    expect(management).not.toContain("Dossier soumis aux autorités");
    expect(management).not.toContain("Dossier en cours de traitement");
  });

  it("l'espace client n'a plus sa propre table de libellés", () => {
    const space = read("client/src/pages/EvaluationSpace.tsx");
    expect(space).toContain("clientStatusLabel(cProfile.dossierStatus)");
    expect(space).not.toContain("const dossierStatusLabel");
  });
});
