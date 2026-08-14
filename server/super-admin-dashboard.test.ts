import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const adminAuth = readFileSync(new URL("./routers/adminAuth.ts", import.meta.url), "utf8");
const app = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../client/src/pages/SuperAdminDashboard.tsx", import.meta.url), "utf8");
const agentDashboard = readFileSync(new URL("../client/src/pages/FlightAgentDashboard.tsx", import.meta.url), "utf8");

describe("tableau global administrateur", () => {
  it("protège les statistiques globales avec la session admin serveur", () => {
    expect(adminAuth).toContain("getGlobalStats: publicProcedure");
    expect(adminAuth).toContain("await requireSuperAdminSession(input.sessionToken)");
    expect(adminAuth).toContain("flightBookingRequests");
    expect(adminAuth).toContain("insuranceRequests");
  });

  it("enregistre une route dédiée accessible au rôle admin commun", () => {
    expect(app).toContain("/admin/super-dashboard");
    expect(app).toContain("SuperAdminDashboard");
    expect(dashboard).not.toContain('role === "super_admin"');
    expect(dashboard).toContain("meQuery.data?.authenticated === true");
    expect(dashboard).toContain("getGlobalStats");
    expect(dashboard).toContain("Les données sont recalculées côté serveur");
  });

  it("conserve les badges de priorité explicites dans la file des agents", () => {
    expect(agentDashboard).toContain('urgent: "bg-red-50 text-red-700"');
    expect(agentDashboard).toContain('high: "bg-amber-50 text-amber-800"');
    expect(agentDashboard).toContain('normal: "bg-blue-50 text-blue-700"');
    expect(agentDashboard).toContain('low: "bg-slate-100 text-slate-700"');
  });
});
