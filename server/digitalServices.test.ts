import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const source = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("service 3M Digital", () => {
  it("persiste des demandes typées et traçables sans donnée sensible inutile", () => {
    const schema = source("drizzle/schema.ts");
    expect(schema).toContain('digitalServiceRequests = mysqlTable("digital_service_requests"');
    expect(schema).toContain('reference: varchar("reference"');
    expect(schema).toContain('service: mysqlEnum("service"');
    expect(schema).toContain('status: mysqlEnum("status"');
    expect(schema).toContain('adminNotes: text("adminNotes")');
  });

  it("protège le traitement administrateur et maintient une création publique validée", () => {
    const router = source("server/routers/digitalServices.ts");
    expect(router).toContain("createRequest: publicProcedure.input(requestSchema)");
    expect(router).toContain("adminList: publicProcedure.input");
    expect(router).toContain("updateRequest: publicProcedure.input");
    expect(router.match(/await requireValidAdminSession\(/g) ?? []).toHaveLength(4);
    expect(router).toContain("adminNotifications");
  });

  it("expose la sous-page de service, son formulaire et son écran administrateur", () => {
    const page = source("client/src/pages/Community.tsx");
    const adminPage = source("client/src/pages/AdminDigitalServices.tsx");
    const app = source("client/src/App.tsx");
    expect(page).toContain("Service 3M Digital");
    expect(page).toContain("trpc.digitalServices.createRequest.useMutation");
    expect(page).toContain('aria-label="Demande de service 3M Digital"');
    expect(adminPage).toContain("trpc.digitalServices.adminList.useQuery");
    expect(adminPage).toContain("trpc.digitalServices.updateRequest.useMutation");
    expect(app).toContain('path={"/3m-digital"} component={Community}');
    expect(app).toContain('path={"/admin/digital-services"}');
  });
});
