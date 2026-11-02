// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderBilanFragment, styleBilanHtml, toBilanHtml } from "../shared/bilanContent";
import { DECISION_DISCLAIMER, DECLINE_REASONS, WHY_OPEN_NOW } from "../shared/evaluationDecision";
import { inspectBilan } from "../shared/bilanContent";

(globalThis as any).React = React;
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

const state = vi.hoisted(() => ({ queries: {} as Record<string, any>, calls: [] as Array<{ proc: string; input: any }> }));
vi.mock("@/lib/clientSpaceSync", () => ({ clientSpacePolling: () => ({}) }));
vi.mock("@/lib/trpc", () => {
  const procedure = (path: string) => ({
    useQuery: () => ({ error: null, isLoading: false, ...(state.queries[path] ?? { data: undefined }) }),
    useMutation: (options?: { onSuccess?: (result: unknown) => void }) => ({ isPending: false, mutate: (input?: unknown) => { state.calls.push({ proc: path, input }); options?.onSuccess?.({ ok: true }); } }),
  });
  return { trpc: new Proxy({}, { get: (_t, router: string) => router === "useUtils" ? () => new Proxy({}, { get: () => new Proxy({}, { get: () => ({ invalidate: async () => undefined }) }) }) : new Proxy({}, { get: (_p, name: string) => procedure(`${router}.${name}`) }) }) };
});

import { ClientBilanDecision } from "../client/src/components/ClientBilanDecision";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");
afterEach(() => { cleanup(); state.queries = {}; state.calls = []; });
const decision = (data: Record<string, unknown>) => { state.queries["evaluationDecision.myDecision"] = { data }; };

describe("réponse du candidat à son bilan : « Je valide et j'ouvre mon dossier »", () => {
  it("rien n'est proposé tant que le bilan n'est pas envoyé", () => {
    decision({ sent: false, decision: null, reason: null, at: null, opening: false });
    render(<ClientBilanDecision />);
    expect(screen.queryByTestId("bilan-decision")).toBeNull();
    expect(screen.queryByTestId("bilan-accept")).toBeNull();
  });

  it("le bilan envoyé propose deux boutons et les vraies raisons d'ouvrir son dossier, sans promesse de résultat ni montant fixe", () => {
    decision({ sent: true, decision: null, reason: null, at: null, opening: false });
    render(<ClientBilanDecision />);
    expect(screen.getByTestId("bilan-accept").textContent).toMatch(/Je valide et j'ouvre mon dossier/);
    expect(screen.getByTestId("bilan-decline-open").textContent).toMatch(/Je ne valide pas/);
    expect(screen.getAllByRole("listitem")).toHaveLength(WHY_OPEN_NOW.length);
    const text = screen.getByTestId("bilan-decision").textContent ?? "";
    expect(text).toContain(DECISION_DISCLAIMER);
    expect(text).not.toMatch(/\d[\d\s]*\s?(?:XAF|FCFA|€)/i);
    expect(inspectBilan(toBilanHtml(`${WHY_OPEN_NOW.map((item) => `${item.title}. ${item.text}`).join(" ")} ${DECISION_DISCLAIMER}`)).forbiddenTerms).toEqual([]);
    expect(text).not.toMatch(/dernière chance|offre limitée|plus que \d|places? restantes?/i);
  });

  it("« Je valide et j'ouvre mon dossier » appelle la validation une seule fois", () => {
    decision({ sent: true, decision: null, reason: null, at: null, opening: false });
    render(<ClientBilanDecision />);
    fireEvent.click(screen.getByTestId("bilan-accept"));
    expect(state.calls.filter((call) => call.proc === "evaluationDecision.accept")).toHaveLength(1);
    expect(state.calls.some((call) => call.proc === "evaluationDecision.decline")).toBe(false);
  });

  it("« Je ne valide pas » demande un motif, l'envoie avec le mot facultatif, et se referme sur Annuler", async () => {
    decision({ sent: true, decision: null, reason: null, at: null, opening: false });
    render(<ClientBilanDecision />);
    fireEvent.click(screen.getByTestId("bilan-decline-open"));
    expect((screen.getByTestId("bilan-decline-send") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByTestId("bilan-decline-reason"), { target: { value: "price" } });
    fireEvent.change(screen.getByTestId("bilan-decline-comment"), { target: { value: "  Pouvez-vous me rappeler ?  " } });
    fireEvent.click(screen.getByTestId("bilan-decline-send"));
    await waitFor(() => expect(state.calls.filter((call) => call.proc === "evaluationDecision.decline")).toHaveLength(1));
    expect(state.calls.find((call) => call.proc === "evaluationDecision.decline")?.input).toEqual({ reason: "price", comment: "Pouvez-vous me rappeler ?" });
    expect(screen.queryByTestId("bilan-decline-form")).toBeNull();
    fireEvent.click(screen.getByTestId("bilan-decline-open"));
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(screen.queryByTestId("bilan-decline-form")).toBeNull();
    expect(Object.keys(DECLINE_REASONS)).toContain("price");
  });

  it("après un refus, le candidat peut encore valider ; après une validation, il n'y a plus rien à décider", () => {
    decision({ sent: true, decision: "declined", reason: "thinking", at: "2026-10-30T08:00:00.000Z", opening: false });
    render(<ClientBilanDecision />);
    expect(screen.getByTestId("bilan-decision-declined").textContent).toMatch(/J'ai besoin de réfléchir/);
    expect(screen.getByTestId("bilan-accept")).toBeTruthy();
    cleanup();
    decision({ sent: true, decision: "accepted", reason: null, at: "2026-10-30T09:00:00.000Z", opening: true });
    render(<ClientBilanDecision />);
    expect(screen.getByTestId("bilan-decision-accepted").textContent).toMatch(/l'ouverture de votre dossier est demandée/);
    expect(screen.queryByTestId("bilan-accept")).toBeNull();
  });
});

describe("garde-fous du parcours après bilan", () => {
  const router = read("server/routers/evaluationDecision.ts");

  it("toutes les procédures exigent un candidat connecté ; valider réutilise confirmation + demande d'ouverture, sans toucher au paiement", () => {
    expect(Array.from(router.matchAll(/\n  ([A-Za-z]+): candidateProcedure/g), (match) => match[1])).toEqual(["myDecision", "accept", "decline"]);
    expect(router).not.toMatch(/publicProcedure/);
    expect(router).toContain("caller.confirmEvaluationReceipt()");
    expect(router).toContain("caller.requestDossierActivation()");
    expect(router).not.toMatch(/paymentStatus|dossierStatus:/);
    expect(router).toContain("L'ouverture de votre dossier est déjà demandée");
    expect(router).toContain('title: "Bilan validé : ouverture de dossier demandée"');
    expect(router).toContain('title: "Bilan non validé : à rappeler"');
    expect(read("server/routers.ts")).toContain("evaluationDecision: evaluationDecisionRouter");
    expect(read("client/src/components/SentBilanViewer.tsx")).toContain("<ClientBilanDecision enabled={enabled} />");
  });

  it("l'envoi du bilan prévient toujours l'administration et passe le dossier à l'étape suivante", () => {
    const source = read("server/routers/unifiedRequests.ts");
    const send = source.slice(source.indexOf("sendEvaluationNow: publicProcedure"));
    expect(send).toContain('title: "Évaluation effectuée : bilan envoyé"');
    expect(send).toContain('workflowStatus: "waiting_customer"');
    expect(send).toContain('actionType: "next_step_auto"');
    expect(send.indexOf("Évaluation effectuée : bilan envoyé")).toBeGreaterThan(send.indexOf('evaluationDeliveryStatus: "sent"'));
  });

  it("l'e-mail du bilan est à l'identité de l'agence, avec un bouton vers l'espace client et une mention de non-garantie", () => {
    const source = read("server/routers/unifiedRequests.ts");
    const send = source.slice(source.indexOf("sendEvaluationNow: publicProcedure"));
    expect(send).toContain("renderBrandedEmailHtml({");
    expect(send).toContain('cta: { label: "Je valide et j’ouvre mon dossier", url: candidateSpaceUrl }');
    expect(send).toContain("ne garantit aucune décision des autorités");
    expect(send).toContain("Espace client sécurisé");
  });
});

describe("présentation du bilan : lisible, structurée, professionnelle", () => {
  it("texte justifié, police professionnelle, gras marqué et titres soulignés, dans l'espace client comme dans l'e-mail", () => {
    const html = styleBilanHtml(toBilanHtml("## Vos atouts\n\nUn profil **solide** et cohérent avec le projet.\n\n- Anglais courant\n- Expérience de cinq ans"));
    expect(html).toMatch(/<p[^>]*text-align:justify/);
    expect(html).toMatch(/<ul[^>]*text-align:justify/);
    expect(html).toContain("Segoe UI");
    expect(html).toMatch(/<strong[^>]*font-weight:700;color:#17375e/);
    expect(html).toMatch(/<h2[^>]*border-bottom:2px solid/);
    const fragment = renderBilanFragment({ html: toBilanHtml("Bonjour"), title: "Évaluation", candidateName: "Aïcha Diallo" });
    expect(fragment).toContain("text-align:justify");
  });

  it("un paragraphe centré du modèle reste centré (l'alignement choisi l'emporte sur le justifié)", () => {
    const html = styleBilanHtml('<p data-a="center">Étape 1 → Étape 2</p>');
    expect(html.lastIndexOf("text-align:center")).toBeGreaterThan(html.lastIndexOf("text-align:justify"));
  });
});
