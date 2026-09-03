import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const adminRouter = readFileSync(resolve(root, "server/routers/candidate-new.ts"), "utf8");
const applicationRouter = readFileSync(resolve(root, "server/routers/application.ts"), "utf8");
const adminForm = readFileSync(resolve(root, "client/src/pages/AdminDashboard.tsx"), "utf8");
const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
const schema = readFileSync(resolve(root, "drizzle/schema.ts"), "utf8");

describe("pilotage unifié agence/en ligne et route primaire", () => {
  it("expose les champs opérationnels du pré-dossier agence", () => {
    expect(adminRouter).toContain("documentsReceived: z.string().max(10000).optional()");
    expect(adminRouter).toContain("initialPaymentStatus: z.enum([\"unknown\", \"pending\", \"paid\"])");
    expect(adminRouter).toContain("assignedToAdmin: z.string().email().optional()");
    expect(adminRouter).toContain("depositDate: z.coerce.date().optional()");
    expect(adminForm).toContain('id="documentsReceived"');
    expect(adminForm).toContain('id="initialPaymentStatus"');
    expect(adminForm).toContain('id="assignedToAdmin"');
    expect(adminForm).toContain('id="depositDate"');
    expect(schema).toContain('initialPaymentStatus: mysqlEnum("initialPaymentStatus", ["unknown", "pending", "paid"])');
    expect(schema).toContain('depositDate: timestamp("depositDate")');
  });

  it("réutilise la case agence lors d’une inscription en ligne avec le même email", () => {
    expect(applicationRouter).toContain("ilike(agencyDossiers.email, input.email.trim())");
    expect(applicationRouter).toContain("legacyAgencyDossierId, linkedAgencyDossier.id");
    expect(applicationRouter).toContain("legacyApplicationId: newApp.id");
    expect(applicationRouter).toContain("if (existingAgencyCase)");
  });

  it("retourne la page 404 pour l’ancien chemin evaluation-primaire", () => {
    expect(app).toContain('<Route path={"/evaluation-primaire"} component={NotFound} />');
    expect(app).not.toContain('<Route path={"/evaluation-primaire"}>{() => <Redirect');
  });
});
