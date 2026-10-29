// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { findForbiddenTerms } from "../shared/evaluationValidation";
import { BUDGET_LINES, computeBudget, formatTotals } from "../shared/budgetSimulator";
import { REVIEW_STALE_DAYS, SHARE_TEMPLATES, buildShareMessage, countryCodeFromName, groupQuestions, reviewState, shareLinks } from "../shared/contentKit";
import { brandedPrintDocument } from "../shared/printSections";
import { WORLD_COUNTRY_ROWS } from "../shared/worldCountries";
import { PUBLIC_PAGES, getIndexablePublicPaths } from "./publicPrerender";

(globalThis as any).React = React;
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock("@/lib/pageSeo", () => ({ setPageSeo: vi.fn() }));
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("@/components/ServicePageShell", () => ({ ServicePageShell: ({ children, notice }: { children: React.ReactNode; notice?: string }) => <main><p data-testid="notice">{notice}</p>{children}</main> }));

const state = vi.hoisted(() => ({ reviews: { data: undefined as any }, demand: { data: undefined as any }, updates: { data: [] as any[] }, publicUpdates: { data: [] as any[] }, mark: vi.fn() }));
vi.mock("@/lib/trpc", () => {
  const query = (get: () => unknown) => ({ useQuery: () => ({ ...(get() as object), error: null, isLoading: false }) });
  const mutation = (fn: ReturnType<typeof vi.fn>) => ({ useMutation: () => ({ mutate: fn, isPending: false }) });
  return {
    trpc: {
      useUtils: () => new Proxy({}, { get: () => new Proxy({}, { get: () => ({ invalidate: vi.fn() }) }) }),
      adminContent: {
        adminContentReviews: query(() => state.reviews), adminMarkReviewed: mutation(state.mark), adminClearReview: mutation(vi.fn()), adminDemand: query(() => state.demand),
        adminUpdates: query(() => state.updates), adminSaveUpdate: mutation(vi.fn()), adminSetUpdatePublished: mutation(vi.fn()), adminArchiveUpdate: mutation(vi.fn()), publicUpdates: query(() => state.publicUpdates),
      },
    },
  };
});

import { AdminContent } from "../client/src/components/AdminContent";
import BudgetSimulatorTool from "../client/src/pages/BudgetSimulatorTool";
import WhatsNew from "../client/src/pages/WhatsNew";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");
afterEach(() => { cleanup(); state.mark.mockReset(); state.reviews = { data: undefined }; state.demand = { data: undefined }; state.updates = { data: [] }; state.publicUpdates = { data: [] }; });

describe("contenu : calculs", () => {
  it("une page est « à relire » après 180 jours, « jamais relue » sans date", () => {
    const now = new Date("2026-11-01T00:00:00Z");
    expect(REVIEW_STALE_DAYS).toBe(180);
    expect(reviewState(null, now)).toBe("never");
    expect(reviewState("2026-09-01T00:00:00Z", now)).toBe("ok");
    expect(reviewState("2026-03-01T00:00:00Z", now)).toBe("stale");
  });

  it("les questions identiques (casse, accents, ponctuation) sont regroupées ; les trop courtes sont ignorées", () => {
    const groups = groupQuestions([{ question: "Quels documents pour le Canada ?" }, { question: "quels documents pour le canada" }, { question: "Quels documents pour le Canada!!" }, { question: "Combien de temps dure un visa étudiant" }, { question: "ok" }]);
    expect(groups[0]).toMatchObject({ count: 3 });
    expect(groups.length).toBe(2);
  });

  it("le nom d'un pays saisi par le candidat devient son code ; un nom inconnu reste inconnu", () => {
    expect(countryCodeFromName("canada", WORLD_COUNTRY_ROWS)).toBe("CA");
    expect(countryCodeFromName("  CANADA ", WORLD_COUNTRY_ROWS)).toBe("CA");
    expect(countryCodeFromName("Atlantide", WORLD_COUNTRY_ROWS)).toBeNull();
    expect(countryCodeFromName("", WORLD_COUNTRY_ROWS)).toBeNull();
  });

  it("messages à partager : aucune promesse, aucun chiffre, seulement des pages réelles de l'agence", () => {
    const paths = new Set(getIndexablePublicPaths());
    for (const template of SHARE_TEMPLATES) {
      const message = template.body("le Canada");
      expect(findForbiddenTerms(message), template.id).toEqual([]);
      expect(message.replace(/https:\/\/\S+/g, ""), template.id).not.toMatch(/\d/);
      const url = /https:\/\/www\.3mtravelagency\.com(\/\S*)/.exec(message);
      expect(url, template.id).toBeTruthy();
      const target = url![1].split("#")[0] || "/";
      expect(paths.has(target), `${template.id} : ${target}`).toBe(true);
    }
    const links = shareLinks(buildShareMessage("tool", "France"));
    expect(links.whatsapp.startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(links.facebook)).toContain("https://www.3mtravelagency.com/outils/parcours-mobilite");
  });
});

describe("simulateur de budget", () => {
  it("aucun montant n'est proposé par le site, et chaque ligne a une aide", () => {
    for (const line of BUDGET_LINES) { expect(line.help.length, line.id).toBeGreaterThan(15); expect(Object.keys(line)).toEqual(["id", "label", "help", "kind"]); }
    expect(BUDGET_LINES.filter((line) => line.kind === "monthly").length).toBe(1);
    expect(BUDGET_LINES.filter((line) => line.kind === "proof").length).toBe(1);
  });

  it("additionne devise par devise sans conversion, multiplie les frais mensuels, sépare les fonds à justifier", () => {
    const totals = computeBudget({ months: 4, entries: { visa: { amount: 100, currency: "eur" }, ticket: { amount: 600, currency: "EUR" }, translation: { amount: 50000, currency: "XAF" }, living: { amount: 800, currency: "EUR" }, funds: { amount: 10000, currency: "EUR" } } });
    expect(totals.spend).toEqual({ EUR: 3900, XAF: 50000 });
    expect(totals.proof).toEqual({ EUR: 10000 });
    expect(formatTotals(totals.spend)).toBe("3 900 EUR + 50 000 XAF");
    expect(formatTotals({})).toBe("—");
  });

  it("ignore les montants négatifs, vides ou sans devise valide, et borne les mois", () => {
    expect(computeBudget({ months: 3, entries: { visa: { amount: -5, currency: "EUR" }, ticket: { amount: 0, currency: "EUR" }, medical: { amount: 10, currency: "" }, language: { amount: Number.NaN, currency: "EUR" } } })).toEqual({ spend: {}, proof: {} });
    expect(computeBudget({ months: 9999, entries: { living: { amount: 10, currency: "EUR" } } }).spend).toEqual({ EUR: 600 });
    expect(computeBudget({ months: 0, entries: { living: { amount: 10, currency: "EUR" } } }).spend).toEqual({ EUR: 10 });
  });

  it("la page calcule le total saisi, l'annonce et propose l'impression", () => {
    render(<BudgetSimulatorTool />);
    expect(screen.getByTestId("notice").textContent).toMatch(/ne propose aucun montant/);
    fireEvent.change(screen.getByTestId("budget-amount-visa"), { target: { value: "150" } });
    fireEvent.change(screen.getByTestId("budget-amount-living"), { target: { value: "500" } });
    fireEvent.change(screen.getByTestId("budget-months"), { target: { value: "2" } });
    expect(screen.getByTestId("budget-spend").textContent).toBe("1 150 XAF");
    expect(screen.getByTestId("budget-proof").textContent).toBe("—");
    expect(screen.getByTestId("print-branded")).toBeTruthy();
  });
});

describe("impression sur papier à en-tête", () => {
  it("échappe tout le texte, garde l'en-tête de l'agence et la barre d'impression", () => {
    const html = brandedPrintDocument({ title: "Mon <b>budget</b>", intro: "Intro <script>alert(1)</script>", sections: [{ title: "Postes", rows: [{ label: "Visa & permis", value: "100 EUR" }], checks: [{ label: "Passeport", done: true }, { label: "Photo", done: false }], bullets: ["<img src=x onerror=alert(1)>"] }], note: "Note <i>prudente</i>" });
    expect(html).toContain("3M TRAVEL");
    expect(html).toContain("window.print()");
    expect(html).toContain("☑");
    expect(html).toContain("☐");
    expect(html).toContain("Visa &amp; permis");
    expect(html).not.toMatch(/<script>alert|<img src=x|<b>budget|<i>prudente/);
    expect((html.match(/<script>/g) ?? []).length).toBe(1);
  });

  it("les outils publics et les guides proposent l'impression", () => {
    for (const file of ["client/src/pages/MobilityOrientationTool.tsx", "client/src/pages/DocumentChecklistTool.tsx", "client/src/pages/GuidePage.tsx", "client/src/pages/BudgetSimulatorTool.tsx"]) expect(read(file), file).toContain("<PrintBrandedButton");
  });
});

describe("pages enregistrées partout où il faut", () => {
  it("routes, prérendu, plan du site et corps lisible sans JavaScript", () => {
    const app = read("client/src/App.tsx");
    expect(app).toContain('path={"/outils/budget-mobilite"} component={BudgetSimulatorTool}');
    expect(app).toContain('path={"/quoi-de-neuf"} component={WhatsNew}');
    for (const path of ["/outils/budget-mobilite", "/quoi-de-neuf"]) {
      const meta = PUBLIC_PAGES[path];
      expect(meta, path).toBeTruthy();
      expect(meta.title.length).toBeLessThanOrEqual(70);
      expect(meta.description.length).toBeGreaterThan(80);
      expect(meta.description.length).toBeLessThanOrEqual(200);
      expect(getIndexablePublicPaths()).toContain(path);
      expect(read("server/publicPrerender.ts")).toContain(`if (path === "${path}") {`);
      expect(read("client/src/pages/Sitemap.tsx")).toContain(`href: "${path}"`);
    }
  });
});

describe("gouvernance du contenu : serveur", () => {
  const router = read("server/routers/adminContent.ts");

  it("toute procédure d'administration vérifie la session ; une seule procédure publique, limitée aux entrées publiées", () => {
    const admin = Array.from(router.matchAll(/\n  (admin[A-Za-z]+): publicProcedure/g), (match) => match[1]);
    expect(admin.length).toBe(8);
    expect((router.match(/await requireValidAdminSession\(input\.sessionToken\)/g) ?? []).length).toBe(admin.length);
    const publicPart = router.slice(router.indexOf("publicUpdates: publicProcedure"));
    expect(publicPart).toContain("eq(contentUpdates.published, 1)");
    expect(publicPart).toContain("isNull(contentUpdates.archivedAt)");
    expect(publicPart).not.toMatch(/createdBy|email|candidate/i);
  });

  it("les questions sont affichées sans adresse e-mail, et seules les pages connues se marquent relues", () => {
    const demand = router.slice(router.indexOf("adminDemand"), router.indexOf("// ───────────── Quoi de neuf"));
    expect(demand).not.toMatch(/visitorEmail/);
    expect(router).toContain("const known = new Set(getIndexablePublicPaths())");
  });

  it("la migration 0094 ne crée que des tables ; le routeur et l'écran sont branchés", () => {
    const sql = read("drizzle/0094_content_governance.sql");
    expect((sql.match(/CREATE TABLE IF NOT EXISTS/g) ?? []).length).toBe(2);
    expect(sql).not.toMatch(/\b(?:DROP|ALTER|DELETE|UPDATE|TRUNCATE|INSERT)\b/i);
    expect(read("server/routers.ts")).toContain("adminContent: adminContentRouter");
    expect(read("client/src/pages/AdminDashboard.tsx")).toContain("<AdminContent sessionToken={sessionToken} />");
    expect(read("shared/adminOps.ts")).toContain("0093");
  });
});

describe("gouvernance du contenu : écrans", () => {
  it("fraîcheur : les pages jamais relues passent en premier et se marquent relues par lot", () => {
    state.reviews = { data: { total: 3, never: 1, stale: 1, items: [
      { path: "/faq", title: "Questions fréquentes", reviewedAt: null, reviewedBy: null, note: null, state: "never" },
      { path: "/pays", title: "Guides par pays", reviewedAt: "2026-01-01T00:00:00.000Z", reviewedBy: "Marie", note: null, state: "stale" },
      { path: "/contact", title: "Contact", reviewedAt: new Date().toISOString(), reviewedBy: "Marie", note: null, state: "ok" },
    ] } };
    render(<AdminContent sessionToken={"t".repeat(40)} />);
    expect(screen.getByTestId("review-/faq")).toBeTruthy();
    expect(screen.getByTestId("review-/pays")).toBeTruthy();
    expect(screen.queryByTestId("review-/contact")).toBeNull();
    fireEvent.click(screen.getByLabelText("Sélectionner /faq"));
    fireEvent.click(screen.getByTestId("review-mark"));
    expect(state.mark).toHaveBeenCalledWith({ sessionToken: "t".repeat(40), paths: ["/faq"], note: null });
  });

  it("demande réelle : questions regroupées et pays à rédiger en priorité", () => {
    state.demand = { data: { questionsSince: "2026-08-01T00:00:00.000Z", candidatesCounted: 120, questions: [{ question: "Quels documents pour le Canada ?", count: 7, unhelpful: 2, topPage: "/pays/canada" }], countries: [{ code: "LU", name: "Luxembourg", demand: 18, publishedPathways: [], needsWriting: true }, { code: "CA", name: "Canada", demand: 30, publishedPathways: ["work"], needsWriting: false }] } };
    render(<AdminContent sessionToken={"t".repeat(40)} />);
    fireEvent.click(screen.getByTestId("content-tab-demand"));
    expect(screen.getByTestId("content-demand").textContent).toMatch(/7× Quels documents pour le Canada/);
    expect(screen.getByTestId("demand-LU").textContent).toMatch(/À rédiger/);
    expect(screen.getByTestId("demand-CA").textContent).toMatch(/Publié : work/);
  });

  it("messages à partager : le message suit le modèle et la destination", () => {
    render(<AdminContent sessionToken={"t".repeat(40)} />);
    fireEvent.click(screen.getByTestId("content-tab-share"));
    fireEvent.change(screen.getByLabelText("Destination"), { target: { value: "Canada" } });
    expect((screen.getByTestId("share-message") as HTMLTextAreaElement).value).toContain("Canada");
    expect(screen.getByTestId("share-whatsapp").getAttribute("href")).toMatch(/^https:\/\/wa\.me\/\?text=/);
  });

  it("Quoi de neuf (public) : liste datée, ou message d'attente sans entrée", () => {
    render(<WhatsNew />);
    expect(screen.getByTestId("whats-new").textContent).toMatch(/Aucune mise à jour publiée/);
    cleanup();
    state.publicUpdates = { data: [{ id: 1, title: "Nouvelle liste de pièces", summary: "La liste de pièces a été revue.", pagePath: "/outils/liste-de-pieces", publishedAt: "2026-10-20T10:00:00.000Z" }] };
    render(<WhatsNew />);
    expect(screen.getByTestId("whats-new").textContent).toMatch(/Nouvelle liste de pièces/);
    expect(screen.getByText("Voir la page concernée").getAttribute("href")).toBe("/outils/liste-de-pieces");
  });
});
