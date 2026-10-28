import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");

describe("boîte de réception des opportunités (administration)", () => {
  const router = read("server/routers/opportunitiesInbox.ts");

  it("exige une session d'administration et ne renvoie que des compteurs", () => {
    expect(router).toContain("requireValidAdminSession(input.sessionToken)");
    expect(router).not.toMatch(/candidateName|fullName|email|phone/);
  });

  it("compte ce qui attend une action, et une table non migrée donne null au lieu de faire échouer le tableau de bord", () => {
    expect(router).toContain('eq(studyApplications.status, "submitted_to_agency")');
    expect(router).toContain('eq(jobOffers.status, "in_moderation")');
    expect(router).toContain('eq(jobApplications.status, "submitted")');
    expect(router).toContain('eq(jobOfferReports.status, "open")');
    expect(router).toContain('eq(stayRequests.status, "requested")');
    expect(router).toMatch(/catch \{\s*return null;/);
  });

  it("est branché, et la pastille n'apparaît que sur les trois onglets concernés, masquée à zéro", () => {
    expect(read("server/routers.ts")).toContain("opportunitiesInbox: opportunitiesInboxRouter");
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).toContain("if (!count) return null;");
    for (const field of ["data?.study", "data?.jobs", "data?.stay"]) expect(dashboard, field).toContain(`opportunitiesInbox.${field}`);
    expect(dashboard).toContain("{ enabled: Boolean(sessionToken), refetchInterval: 60_000, retry: false }");
  });
});
