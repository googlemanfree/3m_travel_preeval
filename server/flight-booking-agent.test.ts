import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schema = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");
const router = readFileSync(new URL("./routers/flightBooking.ts", import.meta.url), "utf8");
const checkout = readFileSync(new URL("../client/src/pages/FlightBookingCheckout.tsx", import.meta.url), "utf8");
const agentDashboard = readFileSync(new URL("../client/src/pages/FlightAgentDashboard.tsx", import.meta.url), "utf8");
const scanUploader = readFileSync(new URL("../client/src/components/PassportScanUploader.tsx", import.meta.url), "utf8");


describe("flight booking agent workflow", () => {
  it("déclare les tables de scan, demandes et historique", () => {
    expect(schema).toContain("passportScanRequests");
    expect(schema).toContain("flightBookingRequests");
    expect(schema).toContain("flightBookingRequestHistory");
    expect(schema).toContain('"pending_review"');
  });

  it("protège le scan candidat et les actions agent, tout en acceptant une demande invitée contrôlée", () => {
    expect(router).toContain("scanPassport: candidateProcedure");
    expect(router).toContain("createRequest: publicProcedure");
    expect(router).toContain("resolveBookingRequester");
    expect(schema).toContain('candidateId: int("candidateId"),');
    expect(router).toContain("requireValidAdminSession");
    expect(router).toContain("getQueueSummary");
    expect(router).toContain("assignRequest");
    expect(router).toContain("updateStatus");
    expect(router).toContain("updatePriority");
    expect(router).toContain("priority: z.enum");
    expect(router).toContain("getScan");
  });

  it("contrôle le fichier et oblige la vérification manuelle du préremplissage", () => {
    expect(router).toContain("MAX_SCAN_BYTES");
    expect(router).toContain("hasValidImageSignature");
    expect(scanUploader).toContain("Vérifiez chaque champ avant de continuer");
    expect(scanUploader).toContain("Traitement sécurisé côté serveur");
    expect(checkout).toContain("PassportScanUploader");
    expect(checkout).toContain("passportScanId");
  });

  it("expose les opérations utiles aux agents sans supprimer la validation tarifaire", () => {
    expect(agentDashboard).toContain("Tableau de bord agents");
    expect(agentDashboard).toContain("Affecter");
    expect(agentDashboard).toContain("Statut opérationnel");
    expect(agentDashboard).toContain("Filtrer par priorité");
    expect(agentDashboard).toContain("exportCsv");
    expect(agentDashboard).toContain("CSV");
    expect(checkout).toContain("Le tarif et la disponibilité seront revalidés par un agent");
  });
});
