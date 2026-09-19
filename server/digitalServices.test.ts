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
    expect(schema).toContain('pricingJson: text("pricingJson").notNull()');
  });

  it("protège le traitement administrateur et maintient une création publique validée", () => {
    const router = source("server/routers/digitalServices.ts");
    expect(router).toContain("createRequest: publicProcedure.input(requestSchema)");
    expect(router).toContain("adminList: publicProcedure.input");
    expect(router).toContain("updateRequest: publicProcedure.input");
    expect(router).toContain("resolveDigitalAdminSession");
    expect(router).toContain("adminNotifications");
    expect(router).toContain("pricingJson: z.string()");
  });

  it("expose la sous-page de service, son formulaire et son écran administrateur", () => {
    const page = source("client/src/pages/Community.tsx");
    const adminPage = source("client/src/pages/AdminDigitalServices.tsx");
    const app = source("client/src/App.tsx");
    expect(page).toContain("Service 3M Digital");
    expect(page).toContain("trpc.digitalServices.createRequest.useMutation");
    expect(page).toContain('aria-label="Demande de service 3M Digital"');
    expect(page).toContain('id="tarifs"');
    expect(page).toContain("Repères de cadrage");
    expect(page).toContain("ne constituent ni une offre ferme ni un paiement automatique");
    expect(adminPage).toContain("trpc.digitalServices.adminList.useQuery");
    expect(adminPage).toContain("trpc.digitalServices.updateRequest.useMutation");
    expect(app).toContain('path={"/3m-digital"} component={Community}');
    expect(app).toContain('path={"/admin/digital-services"}');
  });

  it("compte les demandes « nouvelles » derrière une session admin et l'affiche dans le poste administratif", () => {
    const router = source("server/routers/digitalServices.ts");
    const dashboard = source("client/src/pages/AdminDashboard.tsx");
    const countProcedure = router.slice(router.indexOf("adminCountNew:"), router.indexOf("adminList:"));
    expect(countProcedure).toContain("resolveDigitalAdminSession(ctx.req.headers.cookie, input.sessionToken)");
    expect(countProcedure).toContain('eq(digitalServiceRequests.status, "new")');
    expect(dashboard).toContain("trpc.digitalServices.adminCountNew.useQuery");
    expect(dashboard).toContain("digitalNewCount > 0");
  });

  it("exporte en CSV les demandes filtrées avec BOM UTF-8 et échappement des guillemets", () => {
    const adminPage = source("client/src/pages/AdminDigitalServices.tsx");
    expect(adminPage).toContain("downloadCSV(filteredRequests");
    expect(adminPage).toContain("text/csv;charset=utf-8;");
    expect(adminPage).toContain("replace(/\"/g, '\"\"')");
    expect(adminPage).toContain("URL.revokeObjectURL(url)");
  });

  it("notifie l'équipe et confirme au client par e-mail sans faire échouer la demande si l'envoi échoue", () => {
    const router = source("server/routers/digitalServices.ts");
    const create = router.slice(router.indexOf("createRequest:"), router.indexOf("adminCountNew:"));
    expect(create.match(/await sendEmail\(/g)).toHaveLength(2);
    expect(create).toContain("digital_services.team_notification_failed");
    expect(create).toContain("digital_services.candidate_confirmation_failed");
    expect(create.indexOf("await db.insert(digitalServiceRequests)")).toBeLessThan(create.indexOf("await sendEmail("));
    expect(create).toContain("esc(input.message)");
    expect(create).toContain("return { reference };");
  });
});
