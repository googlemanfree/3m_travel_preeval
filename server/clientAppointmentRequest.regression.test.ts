import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (relativePath: string) => readFileSync(resolve(root, relativePath), "utf8");

describe("demande de rendez-vous client", () => {
  it("dérive l’identité et la référence de dossier de la session serveur", () => {
    const router = read("server/routers/candidate.ts");
    const block = router.slice(router.indexOf("requestBilanAppointment:"), router.indexOf("getClientDashboardSummary:"));

    expect(block).toContain("ctx.candidate.id");
    expect(block).toContain("candidate as any).dossierNumber");
    expect(block).not.toContain("candidateEmail: z.string");
    expect(block).not.toContain("dossierNumber: z.string");
    expect(block).toContain("pending_agency_confirmation");
  });

  it("propose une demande client accessible sans présenter une réservation automatique", () => {
    const component = read("client/src/components/ClientAppointmentRequest.tsx");
    const workspace = read("client/src/pages/EvaluationSpace.tsx");

    expect(component).toContain("Confirmation humaine");
    expect(component).toContain("Aucun rendez-vous n’est réservé automatiquement");
    expect(component).toContain('trpc.candidate.requestBilanAppointment.useMutation');
    expect(workspace).toContain("<ClientAppointmentRequest");
    expect(workspace).toContain("onRequested={handleManualRefresh}");
  });
});
