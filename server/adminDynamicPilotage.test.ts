import { describe, expect, it } from "vitest";
import {
  buildAdminDynamicPilotageContext,
  detectAdminProcedureKind,
  determineDynamicCandidate360NextAction,
  resolveOfficialSourcesForAdmin,
} from "../shared/adminDynamicPilotage";
import { buildCountryProcedureDocumentChecklist } from "../shared/countryProcedureChecklist";

describe("pilotage admin dynamique pays + visa", () => {
  it("détecte e‑visa distinctement du travail ou du visiteur papier", () => {
    expect(detectAdminProcedureKind("e-Visa", "Australie Subclass 600")).toBe("evisa");
    expect(detectAdminProcedureKind("Travail", "Permis de travail")).toBe("work");
    expect(detectAdminProcedureKind("Visiteur", "Schengen")).toBe("visitor");
  });

  it("adapte la prochaine action au pays et au type (pas un modèle France figé)", () => {
    const italy = determineDynamicCandidate360NextAction({
      workflowStatus: "new",
      paymentStatus: "SUCCESS",
      pendingDocuments: 0,
      openTasks: 0,
      destination: "Italie",
      visaType: "Visiteur",
    });
    expect(italy.label).toMatch(/Italie/i);
    expect(italy.description.toLowerCase()).not.toContain("france");

    const australia = determineDynamicCandidate360NextAction({
      workflowStatus: "processing",
      paymentStatus: "SUCCESS",
      pendingDocuments: 0,
      openTasks: 0,
      destination: "Australie",
      visaType: "e-Visa",
      procedureLabel: "Autorisation électronique",
    });
    expect(australia.key).toBe("partner");
    expect(australia.label.toLowerCase()).toMatch(/e[‑-]visa|australie/);

    const canadaWork = determineDynamicCandidate360NextAction({
      workflowStatus: "documents_review",
      paymentStatus: "SUCCESS",
      pendingDocuments: 0,
      openTasks: 0,
      destination: "Canada",
      visaType: "Travail",
    });
    expect(canadaWork.label).toMatch(/Canada|emploi/i);
    expect(canadaWork.description.toLowerCase()).not.toContain("france");
  });

  it("expose des sources officielles par pays pour rassurer le conseiller", () => {
    const france = resolveOfficialSourcesForAdmin("France", "Visiteur");
    expect(france.length).toBeGreaterThan(0);
    expect(france.some((source) => /france|france-visas|diplomatie/i.test(`${source.label} ${source.url}`))).toBe(true);

    const lux = resolveOfficialSourcesForAdmin("Luxembourg", "Travail");
    expect(lux.some((source) => /adem|guichet|luxembourg/i.test(`${source.label} ${source.url}`))).toBe(true);
  });

  it("construit un contexte 360° cohérent (parcours + checklist key)", () => {
    const ctx = buildAdminDynamicPilotageContext({
      destination: "Australie",
      visaType: "e-Visa",
      procedureLabel: "e-Visa touristique",
      workflowStatus: "processing",
      paymentStatus: "SUCCESS",
      pendingDocuments: 0,
      openTasks: 0,
      currentStepIndex: 1,
    });
    expect(ctx.procedureKind).toBe("evisa");
    expect(ctx.country.toLowerCase()).toContain("australie");
    expect(ctx.officialSources.length).toBeGreaterThan(0);
    expect(ctx.nextAction.description.toLowerCase()).not.toContain("france");
  });

  it("enrichit la checklist documentaire pour France / Italie / Australie", () => {
    expect(buildCountryProcedureDocumentChecklist({ destination: "France", procedureType: "Visiteur" }).documents.length).toBeGreaterThan(2);
    expect(buildCountryProcedureDocumentChecklist({ destination: "Italie", procedureType: "Travail" }).documents.some((d) => /assurance|passeport|cv/i.test(d.documentType))).toBe(true);
    expect(buildCountryProcedureDocumentChecklist({ destination: "Australie", procedureType: "e-Visa" }).documents.some((d) => /e.?visa|assurance|reservation|passeport/i.test(d.documentType))).toBe(true);
  });
});
