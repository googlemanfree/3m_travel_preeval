import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schema = readFileSync(new URL("../drizzle/schema.ts", import.meta.url), "utf8");
const router = readFileSync(new URL("./routers/flightBooking.ts", import.meta.url), "utf8");
const checkout = readFileSync(new URL("../client/src/pages/FlightBookingCheckout.tsx", import.meta.url), "utf8");
const agentDashboard = readFileSync(new URL("../client/src/pages/FlightAgentDashboard.tsx", import.meta.url), "utf8");
const scanUploader = readFileSync(new URL("../client/src/components/PassportScanUploader.tsx", import.meta.url), "utf8");
const departureCalendar = readFileSync(new URL("../client/src/components/FlightDepartureCalendar.tsx", import.meta.url), "utf8");


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

  it("calcule l’urgence à partir du départ, alerte les conseillers et filtre la file opérationnelle", () => {
    expect(router).toContain("getAutomaticFlightPriority");
    expect(router).toContain("hoursUntilDeparture <= 48");
    expect(router).toContain('to: "hello@3mtravelagency.com"');
    expect(router).toContain("assigned advisor notification failed");
    expect(agentDashboard).toContain("Filtrer par compagnie");
    expect(agentDashboard).toContain("Filtrer par trajet");
    expect(agentDashboard).toContain("Urgence départ");
    expect(agentDashboard).toContain("filteredRequests");
  });

  it("expose les départs en calendrier et alerte le client lors d’un changement réel de statut", () => {
    expect(departureCalendar).toContain("Calendrier des départs vols");
    expect(departureCalendar).toContain("départ(s) imminent(s)");
    expect(departureCalendar).toContain("onSelectRequest");
    expect(router).toContain("customerStatusLabels");
    expect(router).toContain("customer status notification failed");
    expect(router).toContain("unchanged: true");
    expect(agentDashboard).toContain("Ajouter une note interne");
    expect(agentDashboard).toContain("window.prompt");
  });

  it("présente les informations commerciales, voyageur, paiement et émission dans la fiche agent", () => {
    expect(agentDashboard).toContain("FlightRequestOverview");
    expect(agentDashboard).toContain("Vol et conditions tarifaires");
    expect(agentDashboard).toContain("Client et passager(s)");
    expect(agentDashboard).toContain("Traitement, paiement et émission");
    expect(agentDashboard).toContain("PNR / référence compagnie");
    expect(agentDashboard).toContain("Correspondance(s)");
  });
});
