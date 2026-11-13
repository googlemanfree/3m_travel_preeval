import { beforeEach, describe, expect, it, vi } from "vitest";
import { ensureEvisaIssuedPdfColumn, resetEvisaSchemaGuardForTests } from "./services/evisaSchemaGuard";

const connectionWith = (present: number) => ({
  execute: vi.fn(async (sql: string) => (/COUNT\(\*\)/.test(sql) ? [[{ n: present }], []] : [{}, []])),
});

describe("garde de la colonne evisa_requests.issuedPdfUrl", () => {
  beforeEach(() => {
    resetEvisaSchemaGuardForTests();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("ajoute la colonne quand elle manque", async () => {
    const connection = connectionWith(0);
    await ensureEvisaIssuedPdfColumn(connection);
    expect(connection.execute).toHaveBeenCalledWith("ALTER TABLE evisa_requests ADD COLUMN issuedPdfUrl TEXT NULL");
  });

  it("ne modifie rien quand la colonne existe déjà, et ne revérifie pas ensuite", async () => {
    const connection = connectionWith(1);
    await ensureEvisaIssuedPdfColumn(connection);
    await ensureEvisaIssuedPdfColumn(connection);
    expect(connection.execute).toHaveBeenCalledTimes(1);
    expect(connection.execute).not.toHaveBeenCalledWith(expect.stringContaining("ALTER TABLE"));
  });

  it("tolère une colonne ajoutée entre-temps par un autre processus", async () => {
    const connection = {
      execute: vi.fn(async (sql: string) => {
        if (/COUNT\(\*\)/.test(sql)) return [[{ n: 0 }], []];
        throw Object.assign(new Error("Duplicate column name"), { errno: 1060 });
      }),
    };
    await expect(ensureEvisaIssuedPdfColumn(connection)).resolves.toBeUndefined();
  });

  it("ne bloque jamais la requête d'origine si la vérification échoue (droits insuffisants)", async () => {
    const connection = { execute: vi.fn(async () => { throw new Error("ALTER command denied"); }) };
    await expect(ensureEvisaIssuedPdfColumn(connection)).resolves.toBeUndefined();
  });

  it("est appelé avant la lecture et avant l'écriture du PDF dans les routeurs", async () => {
    const { readFileSync } = await import("node:fs");
    const user = readFileSync("server/routers/evisaRouter.ts", "utf8");
    const admin = readFileSync("server/routers/evisaAdminRouter.ts", "utf8");
    expect(user.indexOf("await ensureEvisaIssuedPdfColumn(connection)")).toBeLessThan(user.indexOf("SELECT id, countryCode"));
    expect(user.lastIndexOf("await ensureEvisaIssuedPdfColumn(connection)")).toBeLessThan(user.indexOf("await storagePut(storageKey"));
    expect(admin.indexOf("await ensureEvisaIssuedPdfColumn(connection)")).toBeLessThan(admin.indexOf("await storagePut(storageKey"));
  });
});
