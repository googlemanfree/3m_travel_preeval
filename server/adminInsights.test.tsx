// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { inspectBilan, toBilanHtml } from "../shared/bilanContent";
import { BILAN_VARIABLE_NAMES, bilanVariablesFrom, buildScoreText, formatAmount, resolveBilanVariables, scoreTotals, STANDARD_SCORE_CRITERIA } from "../shared/bilanVariables";
import { buildWeeklyReportText, computeNps, conversionRates, emailTypoSuggestion, findQualityIssues, phoneIssue, scoreOfferMatch } from "../shared/adminInsights";
import { parsePdfBlocks } from "./services/bilanPdfRichText";

(globalThis as any).React = React;
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

const state = vi.hoisted(() => ({ today: { data: undefined as any }, proofs: { data: [] as any[] }, validate: vi.fn() }));
vi.mock("@/lib/trpc", () => {
  const query = (get: () => unknown) => ({ useQuery: () => ({ ...(get() as object), error: null, isLoading: false }) });
  const mutation = (fn: ReturnType<typeof vi.fn>) => ({ useMutation: () => ({ mutate: fn, isPending: false }) });
  return {
    trpc: {
      useUtils: () => new Proxy({}, { get: () => new Proxy({}, { get: () => ({ invalidate: vi.fn() }) }) }),
      remoteSupport: { adminHandover: query(() => ({ data: undefined })) },
      adminInsights: {
        adminToday: query(() => state.today), adminProofQueue: query(() => state.proofs), adminValidateProof: mutation(state.validate),
        adminFunnel: query(() => ({ data: undefined })), adminSendWeeklyReport: mutation(vi.fn()), adminDataQuality: query(() => ({ data: undefined })),
        adminResponseTimes: query(() => ({ data: undefined })), adminSatisfaction: query(() => ({ data: undefined })), adminMatchableOffers: query(() => ({ data: [] })), adminMatchOffer: query(() => ({ data: undefined })),
      },
    },
  };
});

import { AdminInsights } from "../client/src/components/AdminInsights";
import { BilanPasteEditor } from "../client/src/components/BilanPasteEditor";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");
const model = readFileSync(resolve(process.cwd(), "server/fixtures/bilanModele.txt"), "utf8");
afterEach(() => { cleanup(); state.validate.mockReset(); state.today = { data: undefined }; state.proofs = { data: [] }; });

describe("bilan : variables du dossier", () => {
  const values = bilanVariablesFrom({ fullName: "Olivier NOUBISSI", dossierNumber: "3M-AGN-0034", destination: "Luxembourg", visaLabel: "Visa travail", paymentAmount: null, score: 61, now: new Date("2026-11-02T10:00:00Z") });

  it("remplace les variables par les données du dossier ; le montant est celui du profil, jamais 0", () => {
    expect(values.montant).toBe("100 000");
    expect(bilanVariablesFrom({ fullName: "A B", visaLabel: "Visa études" }).montant).toBe("65 000");
    expect(bilanVariablesFrom({ fullName: "A B", visaLabel: "Visa travail", paymentAmount: 120000 }).montant).toBe("120 000");
    expect(bilanVariablesFrom({ fullName: "A B", visaLabel: "Visa travail", paymentAmount: 0 }).montant).toBe("100 000");
    expect(resolveBilanVariables("Bonjour {{prenom}} — {{ Montant }} XAF — {{score}} — dossier {{reference}}", values)).toBe("Bonjour Olivier — 100 000 XAF — 61 / 100 — dossier 3M-AGN-0034");
  });

  it("une variable inconnue ou sans valeur reste visible, et les valeurs sont échappées", () => {
    expect(resolveBilanVariables("{{inconnue}} {{reference}}", bilanVariablesFrom({ fullName: "A B", dossierNumber: "EVAL-DRAFT-9" }))).toBe("{{inconnue}} {{reference}}");
    expect(resolveBilanVariables("{{nom}}", { nom: '<img src=x onerror=alert(1)>"' })).toBe("&lt;img src=x onerror=alert(1)&gt;&quot;");
    expect(formatAmount(1234567)).toBe("1 234 567");
  });

  it("une variable non remplacée bloque la validation comme une zone à compléter ; remplacée, plus rien ne bloque", () => {
    const html = toBilanHtml("Frais d'ouverture : {{montant}} XAF, non remboursables.\n\nMerci {{prenom}}.");
    expect(inspectBilan(html).placeholders).toEqual(["{{montant}}", "{{prenom}}"]);
    expect(inspectBilan(resolveBilanVariables(html, values)).placeholders).toEqual([]);
    expect(BILAN_VARIABLE_NAMES).toContain("montant");
  });

  it("le générateur de scores produit le tableau du modèle avec la note globale calculée", () => {
    const rows = STANDARD_SCORE_CRITERIA.map((criterion, index) => ({ label: criterion.label, score: [11, 17, 10, 8, 4, 5, 6, 0][index], max: criterion.max }));
    expect(scoreTotals(rows)).toEqual({ total: 61, max: 100 });
    expect(scoreTotals([{ label: "x", score: 99, max: 15 }, { label: "y", score: -4, max: 5 }])).toEqual({ total: 15, max: 20 });
    const html = toBilanHtml(buildScoreText(rows));
    expect(html).toContain('<td data-a="right"><strong>11 / 15</strong></td>');
    expect(html).toContain("<strong>NOTE GLOBALE</strong>");
    expect(html).toContain("<strong>61 / 100</strong>");
  });

  it("le PDF reprend le bilan du modèle sans balise résiduelle (tableaux, titres, listes)", () => {
    const html = resolveBilanVariables(toBilanHtml(model).replace("[À CONFIRMER]", "{{montant}}"), values);
    const blocks = parsePdfBlocks(html);
    expect(blocks.some((block) => block.kind === "heading")).toBe(true);
    expect(blocks.some((block) => block.kind === "table")).toBe(true);
    expect(JSON.stringify(blocks)).not.toMatch(/<\/?[a-z]|data-[a-z]=|100 000 XAF.*\{\{/);
    expect(JSON.stringify(blocks)).toContain("100 000");
  });

  it("la livraison (e-mail, espace candidat, PDF) et la validation résolvent les variables", () => {
    expect(read("server/evaluationService.ts")).toContain("resolveBilanVariables(adminDraft.bilanHtml");
    expect(read("server/evaluationBilanPdfService.ts")).toContain("resolveBilanVariables(draft.bilanHtml");
    expect(read("server/routers/unifiedRequests.ts")).toContain("resolveBilanVariables(freeBilan");
    expect(read("server/routers/unifiedRequests.ts")).toContain("inspectBilan(resolvedBilan)");
  });
});

describe("pilotage avancé : calculs", () => {
  it("détecte téléphones et e-mails douteux", () => {
    expect(phoneIssue("")).toBe("missing");
    expect(phoneIssue("Non renseigné")).toBe("missing");
    expect(phoneIssue("123")).toBe("invalid");
    expect(phoneIssue("1111111111")).toBe("invalid");
    expect(phoneIssue("+237 698 104 832")).toBeNull();
    expect(emailTypoSuggestion("aicha@gmial.com")).toBe("aicha@gmail.com");
    expect(emailTypoSuggestion("aicha@gmail.com")).toBeNull();
  });

  it("repère doublons de téléphone et d'identité, et dossiers actifs sans destination", () => {
    const base = { email: "x@example.test", phone: "+237 698 104 832", dateOfBirth: "1990-01-01", destination: "canada", preferredDestinations: '["Canada"]', dossierStatus: "nouveau" };
    const issues = findQualityIssues([
      { ...base, id: 1, fullName: "Aïcha Diallo" },
      { ...base, id: 2, fullName: "DIALLO Aicha" },
      { ...base, id: 3, fullName: "Autre Personne", phone: "+237 600 000 123", dateOfBirth: "1985-05-05" },
      { ...base, id: 4, fullName: "Sans Destination", phone: "", destination: "autre", preferredDestinations: "[]", dossierStatus: "documents", dateOfBirth: null },
    ]);
    const codes = (code: string) => issues.filter((issue) => issue.code === code).map((issue) => issue.candidateId).sort();
    expect(codes("duplicate_phone")).toEqual([1, 2]);
    expect(codes("duplicate_identity")).toEqual([1, 2]);
    expect(codes("active_without_destination")).toEqual([4]);
    expect(codes("phone_missing")).toEqual([4]);
  });

  it("taux de passage, indice de recommandation et rapport hebdomadaire", () => {
    expect(conversionRates([{ key: "a", label: "A", count: 100 }, { key: "b", label: "B", count: 40 }, { key: "c", label: "C", count: 0 }])).toEqual([null, 40, 0]);
    expect(conversionRates([{ key: "a", label: "A", count: 0 }, { key: "b", label: "B", count: 5 }])).toEqual([null, null]);
    expect(computeNps([10, 9, 8, 6, 3])).toBe(0);
    expect(computeNps([10, 10, 9])).toBe(100);
    expect(computeNps([])).toBeNull();
    const text = buildWeeklyReportText({ generatedOn: new Date("2026-11-02T10:00:00Z"), funnel: { days: 7, stages: [{ key: "accounts", label: "Nouveaux comptes", count: 20 }, { key: "payments", label: "Paiements confirmés", count: 5 }], sources: [{ source: "facebook", accounts: 12 }], destinations: [] }, blocked: 3, openRequests: 40, waitingUrgent: 2, proofsToCheck: 4, activationsWithoutProof: 1, satisfaction: { responses: 0, nps: null } });
    expect(text).toContain("Paiements confirmés : 5 (25 % de l'étape précédente)");
    expect(text).toContain("Facebook 12");
    expect(text).toContain("Dossiers activés sans preuve de paiement : 1");
    expect(text).toContain("Aucune réponse sur la période");
  });

  it("le rapprochement classe les profils sur la destination, le métier, l'expérience et les langues exigées", () => {
    const offer = { countryName: "Luxembourg", title: "Comptable général", description: "Comptabilité fournisseurs, clôtures mensuelles, reporting financier.", experienceMinYears: 3, languages: [{ lang: "Français", required: true }] };
    const good = scoreOfferMatch(offer, { profileCode: "P1", summary: "Comptable avec 4 ans d'expérience en comptabilité générale et reporting financier", targetDestination: "Luxembourg", sector: "Comptabilité et finance", yearsExperience: "4 ans", languagesSummary: "Français courant, anglais B1" });
    const weak = scoreOfferMatch(offer, { profileCode: "P2", summary: "Soudeur industriel", targetDestination: "Canada", sector: "Industrie", yearsExperience: "1 an", languagesSummary: "Anglais" });
    expect(good.score).toBeGreaterThanOrEqual(80);
    expect(weak.score).toBeLessThan(30);
    expect(weak.blockers.join(" ")).toMatch(/Destination visée : Canada/);
    expect(weak.blockers.join(" ")).toMatch(/Langues à vérifier : Français/);
  });
});

describe("pilotage avancé : serveur", () => {
  const router = read("server/routers/adminInsights.ts");

  it("toute procédure d'administration vérifie la session ; les procédures candidat passent par candidateProcedure", () => {
    const adminNames = Array.from(router.matchAll(/\n  (admin[A-Za-z]+): publicProcedure/g), (match) => match[1]);
    expect(adminNames.length).toBe(10);
    expect((router.match(/await requireValidAdminSession\(input\.sessionToken\)/g) ?? []).length).toBe(adminNames.length);
    expect(Array.from(router.matchAll(/\n  ([A-Za-z]+): candidateProcedure/g), (match) => match[1])).toEqual(["mySatisfactionPrompt", "answerSatisfaction"]);
  });

  it("valider une preuve : pré-compte seulement, une fois, avec motif obligatoire en cas d'écart de montant, et tout est journalisé", () => {
    const validate = router.slice(router.indexOf("adminValidateProof"), router.indexOf("adminFunnel"));
    expect(validate).toContain('candidate.dossierStatus !== "nouveau"');
    expect(validate).toContain("Le paiement de ce compte est déjà confirmé");
    expect(validate).toContain("input.confirmedAmount !== expected && (input.reason ?? \"\").length < 5");
    expect(validate).toContain("paymentAuditLogs");
    expect(validate).toContain("recordPrivacyEvent");
    expect(validate).toContain("file.fileName.startsWith(PROOF_NAME_PREFIX)");
  });

  it("le rapport hebdomadaire n'est envoyé qu'à l'administrateur connecté", () => {
    const send = router.slice(router.indexOf("adminSendWeeklyReport"), router.indexOf("adminDataQuality"));
    expect(send).toContain("to: admin.email");
    expect((send.match(/to:/g) ?? []).length).toBe(1);
  });

  it("la satisfaction n'accepte que les étapes réellement vécues, une seule réponse par étape, et n'est jamais publiée", () => {
    expect(router).toContain('eq(remoteSlots.status, "done")');
    expect(router).toContain("ER_DUP_ENTRY");
    expect(router).not.toMatch(/customerReviews|testimonial/i);
  });

  it("le rapprochement n'utilise que des fiches approuvées et consenties, sans nom, e-mail ni téléphone", () => {
    const match = router.slice(router.indexOf("adminMatchOffer"));
    expect(match).toContain('eq(placementCandidateProfiles.summaryStatus, "approved")');
    expect(match).toContain('eq(candidatePlacementConsents.status, "granted")');
    expect(match).not.toMatch(/candidates\.(?:email|phone|fullName)|fullName|email/);
  });

  it("la migration 0092 ne crée que des tables ; le routeur et l'écran sont branchés", () => {
    const sql = read("drizzle/0092_admin_insights.sql");
    expect((sql.match(/CREATE TABLE IF NOT EXISTS/g) ?? []).length).toBe(2);
    expect(sql).not.toMatch(/\b(?:DROP|ALTER|DELETE|UPDATE|TRUNCATE|INSERT)\b/i);
    expect(read("server/routers.ts")).toContain("adminInsights: adminInsightsRouter");
    expect(read("client/src/pages/AdminDashboard.tsx")).toContain("<AdminInsights sessionToken={sessionToken} />");
  });

  it("double validation : un administrateur ordinaire dépose une demande, seul le super administrateur la décide", () => {
    const safety = read("server/routers/activationSafety.ts");
    expect(safety).toContain("if (!isSuperAdminEmail(admin.email))");
    expect(safety).toContain("sensitiveActionRequests");
    const decide = safety.slice(safety.indexOf("decideRequest"));
    expect(decide).toContain("requireSuperAdminSession(input.sessionToken)");
    expect(decide.indexOf("requireSuperAdminSession")).toBeLessThan(decide.indexOf("deactivateCandidateDossier"));
  });
});

describe("pilotage avancé : écrans", () => {
  it("« Ma journée » affiche les compteurs, les rendez-vous et prépare un rendez-vous", () => {
    state.today = { data: { appointments: [{ id: 5, startsAt: new Date(Date.now() + 3600_000).toISOString(), channel: "video", candidateId: 9, candidateName: "Aïcha Diallo" }], actions: [{ id: 1, candidateId: 9, candidateName: "Aïcha Diallo", action: "Relancer pour le passeport", dueOn: "2026-10-01", overdue: true }], counters: { waitingUrgent: 2, proofsToCheck: 3, declinedAcknowledgements: 0, sensitiveRequests: 1 } } };
    render(<AdminInsights sessionToken={"t".repeat(40)} />);
    expect(screen.getByTestId("insights-today").textContent).toMatch(/Messages urgents sans réponse/);
    expect(screen.getByTestId("today-slot-5").textContent).toMatch(/Aïcha Diallo/);
    expect(screen.getByText("Préparer le rendez-vous")).toBeTruthy();
    expect(screen.getByText("En retard")).toBeTruthy();
    for (const id of ["proofs", "funnel", "quality", "delays", "matching"]) expect(screen.getByTestId(`insights-tab-${id}`)).toBeTruthy();
  });

  it("file des preuves : un montant différent de l'attendu exige un motif avant de valider", () => {
    state.proofs = { data: [{ fileId: 12, candidateId: 4, fullName: "Aïcha Diallo", email: "a@example.test", dossierStatus: "nouveau", fileName: "Preuve_de_paiement_X", mimeType: "image/jpeg", uploadedAt: new Date().toISOString(), ageDays: 3, expectedAmount: 100000, alreadyActive: false, duplicateOf: [], url: "https://exemple.test/p.jpg" }] };
    render(<AdminInsights sessionToken={"t".repeat(40)} />);
    fireEvent.click(screen.getByTestId("insights-tab-proofs"));
    const button = screen.getByTestId("proof-validate-12") as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    fireEvent.change(screen.getByLabelText("Montant reçu (XAF)"), { target: { value: "90000" } });
    expect((screen.getByTestId("proof-validate-12") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Motif de l'écart"), { target: { value: "Frais de transfert déduits" } });
    expect((screen.getByTestId("proof-validate-12") as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(screen.getByTestId("proof-validate-12"));
    expect(state.validate).toHaveBeenCalledWith({ sessionToken: "t".repeat(40), fileId: 12, confirmedAmount: 90000, reason: "Frais de transfert déduits" });
  });

  it("l'éditeur de bilan propose les variables et le générateur de scores, et ne signale pas une variable que le dossier sait remplir", () => {
    const html = toBilanHtml("Frais : {{montant}} XAF.");
    const { unmount } = render(<BilanPasteEditor value={html} onChange={() => {}} variables={bilanVariablesFrom({ fullName: "A B", visaLabel: "Visa travail" })} />);
    expect(screen.queryByTestId("bilan-placeholders")).toBeNull();
    unmount();
    render(<BilanPasteEditor value={html} onChange={() => {}} variables={{}} />);
    expect(screen.getByTestId("bilan-placeholders").textContent).toMatch(/\{\{montant\}\}/);
    fireEvent.click(screen.getByRole("button", { name: /^Variables du dossier/ }));
    expect(screen.getByTestId("bilan-var-montant")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Générer un tableau de scores" }));
    expect(screen.getByTestId("bilan-score-total").textContent).toBe("Note globale : 0 / 100");
    fireEvent.change(screen.getByLabelText("Note du critère 1"), { target: { value: "11" } });
    expect(screen.getByTestId("bilan-score-total").textContent).toBe("Note globale : 11 / 100");
    expect(screen.getByTestId("bilan-score-insert")).toBeTruthy();
  });
});
