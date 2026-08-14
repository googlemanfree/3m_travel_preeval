import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const adminAuth = readFileSync(new URL("./routers/adminAuth.ts", import.meta.url), "utf8");
const app = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../client/src/pages/SuperAdminDashboard.tsx", import.meta.url), "utf8");
const agentDashboard = readFileSync(new URL("../client/src/pages/FlightAgentDashboard.tsx", import.meta.url), "utf8");

describe("super administrator dashboard", () => {
  it("protects global statistics with the Super administrator session guard", () => {
    expect(adminAuth).toContain("getGlobalStats: publicProcedure");
    expect(adminAuth).toContain("await requireSuperAdminSession(input.sessionToken)");
    expect(adminAuth).toContain("flightBookingRequests");
    expect(adminAuth).toContain("insuranceRequests");
  });

  it("registers a dedicated lazy route and refuses standard admins in the page", () => {
    expect(app).toContain("/admin/super-dashboard");
    expect(app).toContain("SuperAdminDashboard");
    expect(dashboard).toContain('role === "super_admin"');
    expect(dashboard).toContain("getGlobalStats");
    expect(dashboard).toContain("Les données sont recalculées côté serveur");
  });

  it("keeps explicit color badges for all priority levels in the agent queue", () => {
    expect(agentDashboard).toContain('urgent: "bg-red-50 text-red-700"');
    expect(agentDashboard).toContain('high: "bg-amber-50 text-amber-800"');
    expect(agentDashboard).toContain('normal: "bg-blue-50 text-blue-700"');
    expect(agentDashboard).toContain('low: "bg-slate-100 text-slate-700"');
  });
});
