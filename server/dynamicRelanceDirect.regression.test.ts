import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fillAdminTemplate, templateForStage } from "../shared/adminOpsToolkit";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

vi.mock("./_core/llm", () => ({
  invokeLLM: async () => {
    throw new Error("LLM mock — fallback template");
  },
}));

describe("relances dynamiques — envoi direct espace + e-mail", () => {
  it("expose sendDynamicRelance côté serveur", () => {
    const router = read("server/routers/adminCandidateManagement.ts");
    expect(router).toContain("sendDynamicRelance");
    expect(router).toContain("composeDynamicRelance");
    expect(router).toContain("sendClientNotificationEmail");
    expect(router).toContain("clientSpaceContent");
    expect(router).toContain("type: \"admin_relance\"");
    expect(router).toContain("dynamic_relance_sent");
  });

  it("compose un message avec entête espace client (sans IA)", async () => {
    const { composeDynamicRelance } = await import("./services/dynamicRelance");
    const composed = await composeDynamicRelance({
      stage: "cv_missing",
      name: "Sara Tchoua",
      reference: "COMPTE-2026-62024",
      email: "sara@example.com",
      visaType: "Visa Travail",
      destination: "luxembourg",
      useAi: false,
    });
    expect(composed.subject.toLowerCase()).toContain("cv");
    expect(composed.body).toContain("Sara Tchoua");
    expect(composed.body).toContain("COMPTE-2026-62024");
    expect(composed.clientSpaceContent).toContain("3M TRAVEL AGENCY");
    expect(composed.clientSpaceContent).toContain("Relance —");
    expect(composed.clientSpaceContent).toContain("COMPTE-2026-62024");
    expect(composed.aiEnhanced).toBe(false);
  });

  it("templates enrichis destination / visa", () => {
    const filled = fillAdminTemplate(templateForStage("payment_pending", "travail"), {
      name: "Ydrick",
      reference: "COMPTE-4170001",
      destination: "Luxembourg",
      visaType: "Visa Travail",
    });
    expect(filled.body).toContain("Ydrick");
    expect(filled.body).toContain("Luxembourg");
    expect(filled.body).toContain("Visa Travail");
  });

  it("précompte + cockpit : envoi direct (plus de mailto seul)", () => {
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).toContain("sendDynamicRelance");
    expect(dashboard).toContain("Envoyer e-mail");
    expect(dashboard).toContain("predossier-relance-mail-");
    expect(dashboard).not.toContain("buildMailtoRelance");
    expect(dashboard).not.toContain("window.location.href = buildMailtoRelance");

    const cockpit = read("client/src/components/AdminCockpitControlBoard.tsx");
    expect(cockpit).toContain("sendDynamicRelance");
    expect(cockpit).toContain("cockpit-relance-mail");
    expect(cockpit).toContain("Envoyer e-mail");
    expect(cockpit).not.toContain("buildMailtoRelance");
  });

  it("service dynamique présent", () => {
    const service = read("server/services/dynamicRelance.ts");
    expect(service).toContain("composeDynamicRelance");
    expect(service).toContain("polishRelanceWithAi");
    expect(service).toContain("buildClientSpaceContent");
    expect(service).toContain("buildWhatsAppUrlFromBody");
  });
});
