import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { describeDbError, describeDbErrorParts } from "./utils/dbError";

const root = resolve(import.meta.dirname, "..");

/** Forme réelle d'une erreur Drizzle : message « Failed query » avec valeurs, erreur mysql2 d'origine dans `cause`. */
function drizzleError(sql: string, cause: Record<string, unknown>) {
  const error = new Error(`Failed query: ${sql}\nparams: awa.diop@example.com,COMPTE-00012`) as Error & { cause?: unknown };
  error.cause = Object.assign(new Error("Table 'prod.customer_reviews' doesn't exist"), cause);
  return error;
}

describe("journal des erreurs de base de données", () => {
  it("donne le code MySQL, l'errno, le SQLSTATE et la table, sans jamais reprendre les valeurs de la requête", () => {
    const error = drizzleError("select `id` from `customer_reviews` where `status` = ?", { code: "ER_NO_SUCH_TABLE", errno: 1146, sqlState: "42S02" });
    expect(describeDbError(error)).toBe("ER_NO_SUCH_TABLE (errno 1146, SQLSTATE 42S02) sur la table customer_reviews");
    expect(describeDbError(error)).not.toContain("awa.diop");
  });

  it("reconnaît un refus d'accès sans citer l'utilisateur ni l'hôte du message", () => {
    const cause = Object.assign(new Error("Access denied for user 'app'@'10.0.0.5' (using password: YES)"), { code: "ER_ACCESS_DENIED_ERROR", errno: 1045, sqlState: "28000" });
    const text = describeDbError(cause);
    expect(text).toBe("ER_ACCESS_DENIED_ERROR (errno 1045, SQLSTATE 28000)");
    expect(text).not.toMatch(/app|10\.0\.0\.5|password/);
  });

  it("retrouve la table d'un UPDATE et reste lisible sans erreur mysql2", () => {
    expect(describeDbErrorParts(drizzleError("update `evaluation_comments` set `dossierNumber` = ? where `dossierNumber` = ?", {})).table).toBe("evaluation_comments");
    expect(describeDbError(new TypeError("boom"))).toBe("TypeError");
    expect(describeDbError(null)).toBe("erreur inconnue");
  });

  it("les deux filets journalisent par ce descripteur, pas par le message brut", () => {
    const guard = readFileSync(resolve(root, "server/services/activationGuard.ts"), "utf8");
    expect(guard).toContain('"[reference-guard] correction impossible :", describeDbError(error)');
    expect(guard).toContain('"[activation-guard] contrôle impossible :", describeDbError(error)');
  });

  it("la migration des avis clients est idempotente et couvre toutes les colonnes du schéma", () => {
    const sql = readFileSync(resolve(root, "drizzle/0096_customer_reviews.sql"), "utf8");
    const schema = readFileSync(resolve(root, "drizzle/schema.ts"), "utf8");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS customer_reviews");
    const block = schema.slice(schema.indexOf('mysqlTable("customer_reviews"'), schema.indexOf("export type CustomerReview "));
    const columns = Array.from(block.matchAll(/^\s+\w+: \w+\("(\w+)"/gm)).map((match) => match[1]);
    expect(columns.length).toBeGreaterThanOrEqual(14);
    for (const column of columns) expect(sql, column).toContain(column);
  });
});
