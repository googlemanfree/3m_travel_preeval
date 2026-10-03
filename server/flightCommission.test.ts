import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { commissionPercentToMultiplier, flightsRouter } from "./routers/flights";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8");

describe("commission agence : conversion pourcentage → multiplicateur", () => {
  it("0 % ou une valeur illisible ne change pas le tarif", () => {
    expect(commissionPercentToMultiplier(0)).toBe(1);
    expect(commissionPercentToMultiplier("0")).toBe(1);
    expect(commissionPercentToMultiplier(undefined)).toBe(1);
    expect(commissionPercentToMultiplier(null)).toBe(1);
    expect(commissionPercentToMultiplier("")).toBe(1);
    expect(commissionPercentToMultiplier("abc")).toBe(1);
    expect(commissionPercentToMultiplier(Number.NaN)).toBe(1);
  });

  it("une commission enregistrée par l'admin est ajoutée au tarif fournisseur", () => {
    expect(commissionPercentToMultiplier(8)).toBe(1.08);
    expect(commissionPercentToMultiplier("8")).toBe(1.08);
    expect(commissionPercentToMultiplier(12.5)).toBeCloseTo(1.125);
  });

  it("jamais négative, jamais au-delà de 50 % (plafond du formulaire admin)", () => {
    expect(commissionPercentToMultiplier(-10)).toBe(1);
    expect(commissionPercentToMultiplier(500)).toBe(1.5);
  });
});

describe("commission agence : sans réglage enregistré, le tarif reste exactement celui du fournisseur", () => {
  // Cet environnement de test n'a pas de base de données : resolveActiveCommissionMultiplier() doit alors
  // renvoyer 1 (aucune marge), pas la suggestion à 8 % affichée dans le formulaire admin avant tout enregistrement.
  it("getCommission indique que rien n'est enregistré (« saved: false ») sans imposer 8 % pour autant", async () => {
    vi.resetModules();
    vi.doMock("./db", () => ({ getDb: async () => undefined }));
    const { flightsRouter: isolatedRouter } = await import("./routers/flights");
    const result = await isolatedRouter.createCaller({} as never).getCommission();
    expect(result.saved).toBe(false);
    expect(result.commissionPercent).toBe(8);
    vi.doUnmock("./db");
    vi.resetModules();
  });
});

describe("commission agence : câblage réel jusqu'au tarif affiché", () => {
  const source = read("server/routers/flights.ts").replace(/\r\n/g, "\n");

  it("le tarif affiché applique bien le multiplicateur de commission, une seule fois, au même endroit que la conversion FCFA", () => {
    expect(source).toContain("const totalPriceXaf = Math.round(sourcePrice * XAF_PER_EUR * params.commissionMultiplier);");
  });

  it("les quatre points d'entrée qui affichent un tarif réel (recherche aller, recherche retour, revérification, meilleures offres) résolvent la vraie commission, jamais une valeur devinée", () => {
    const occurrences = source.split("resolveActiveCommissionMultiplier()").length - 1;
    // 1 pour "resolveActiveCommissionMultiplier(): Promise<number> {" (sa propre déclaration) + 4 sites d'appel réels.
    expect(occurrences).toBe(5);
    expect(source).toContain('idPrefix: "SA",\n          commissionMultiplier: await resolveActiveCommissionMultiplier(),');
    expect(source).toContain('idPrefix: "SA-RET",\n        commissionMultiplier: await resolveActiveCommissionMultiplier(),');
    expect(source).toContain("resolveActiveCommissionMultiplier(),\n  ]);\n  if (!response.ok) return null;");
    expect(source).toContain("resolveActiveCommissionMultiplier(),\n    ]);\n    if (!response.ok) return { status: \"unavailable\"");
  });

  it("resolveActiveCommissionMultiplier n'invente jamais un pourcentage : 1 sans base de données, sans ligne enregistrée, ou si la lecture échoue", () => {
    expect(source).toContain("async function resolveActiveCommissionMultiplier(): Promise<number> {\n  try {\n    const db = await getDb();\n    if (!db) return 1;");
    expect(source).toContain("if (rows.length === 0) return 1;");
    // Un incident de connexion (DB en panne, latence) ne doit jamais faire disparaître le tarif fournisseur :
    // repli sur 1 (aucune marge), jamais un pourcentage deviné.
    const body = source.slice(source.indexOf("async function resolveActiveCommissionMultiplier"), source.indexOf("resolveLegAirline"));
    expect(body).toContain("} catch (error) {");
    expect(body.match(/return 1;/g)?.length).toBe(3);
  });
});

describe("commission agence : résiste à une panne de connexion réelle (pas seulement à l'absence de base)", () => {
  it("getCommission répond quand même, jamais un pourcentage inventé, si la requête échoue en cours de route", async () => {
    vi.resetModules();
    vi.doMock("./db", () => ({ getDb: async () => ({ select: () => ({ from: () => ({ where: async () => { throw new Error("connect ECONNREFUSED 127.0.0.1:3306"); } }) }) }) }));
    const { flightsRouter: freshRouter } = await import("./routers/flights");
    const result = await freshRouter.createCaller({} as never).getCommission();
    expect(result).toEqual({ commissionPercent: 8, saved: false });
    vi.doUnmock("./db");
    vi.resetModules();
  });
});

describe("page admin : le statut de la commission est honnête (jamais « appliquée » quand elle ne l'est pas)", () => {
  const admin = read("client/src/pages/AdminDashboard.tsx").replace(/\r\n/g, "\n");

  it("affiche un message distinct selon que la commission est réellement enregistrée ou non", () => {
    expect(admin).toContain("data?.saved ? (");
    expect(admin).toContain("Commission active : {data.commissionPercent}%");
    expect(admin).toContain("Aucune commission enregistrée pour l'instant");
  });
});
