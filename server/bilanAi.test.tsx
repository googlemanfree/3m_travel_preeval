// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BILAN_AI_RATE_PER_HOUR, askPerplexity, buildBilanAiMessages, cleanAiOutput, pseudonymizeBilan, resetAiSlots, takeAiSlot } from "./services/bilanAi";

(globalThis as any).React = React;
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const state = vi.hoisted(() => ({ queries: {} as Record<string, any>, calls: [] as Array<{ proc: string; input: any }>, result: null as any }));
vi.mock("@/lib/trpc", () => {
  const procedure = (path: string) => ({
    useQuery: () => ({ error: null, isLoading: false, ...(state.queries[path] ?? { data: undefined }) }),
    useMutation: (options?: { onSuccess?: (result: unknown) => void }) => ({ isPending: false, mutate: (input: unknown) => { state.calls.push({ proc: path, input }); options?.onSuccess?.(state.result); } }),
  });
  return { trpc: new Proxy({}, { get: (_t, router: string) => new Proxy({}, { get: (_p, name: string) => procedure(`${router}.${name}`) }) }) };
});
import { BilanAiAssistant } from "../client/src/components/BilanAiAssistant";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");
const MODES = [{ key: "correct", label: "Corriger" }, { key: "clarify", label: "Clarifier" }];
beforeEach(() => { resetAiSlots(); process.env.PERPLEXITY_API_KEY = "cle-de-test"; });
afterEach(() => { cleanup(); delete process.env.PERPLEXITY_API_KEY; state.queries = {}; state.calls = []; state.result = null; });

describe("assistant de relecture (Perplexity)", () => {
  it("le nom, le prénom, l'e-mail, le téléphone et les identifiants ne partent jamais ; les variables sont posées à la place", () => {
    const text = "Cher Monsieur Aïcha Diallo, aicha.diallo@example.test, +237 677 12 34 56, passeport AB1234567. Aïcha est comptable ; DIALLO a 5 ans d'expérience.";
    const out = pseudonymizeBilan(text, "Aïcha Diallo");
    expect(out).not.toMatch(/Aïcha|Diallo|DIALLO|@|677|AB1234567/i);
    expect(out).toContain("{{nom}}");
    expect(out).toContain("{{prenom}}");
    expect(out).toContain("[e-mail masqué]");
    expect(out).toContain("5 ans d'expérience");
    expect(pseudonymizeBilan("Texte sans nom.", null)).toBe("Texte sans nom.");
  });

  it("les consignes interdisent d'inventer, de promettre un résultat, d'utiliser des sources et de modifier la structure", () => {
    const messages = buildBilanAiMessages("shorten", "Texte {{nom}}");
    expect(messages[0].role).toBe("system");
    for (const rule of ["n'invente rien", "aucune promesse", "aucune source externe", "{{...}}", "UNIQUEMENT"]) expect(messages[0].content).toContain(rule);
    expect(messages[1].content).toContain("Raccourcis");
    expect(messages[1].content).toContain("Texte {{nom}}");
    expect(buildBilanAiMessages("english", "x")[1].content).toContain("anglais");
  });

  it("la réponse est nettoyée : renvois de sources, bloc de code et phrase d'introduction retirés", () => {
    expect(cleanAiOutput("Voici le texte révisé :\n\n```\n## Titre\nUn point[1] clair.[2]\n```")).toBe("## Titre\nUn point clair.");
    expect(cleanAiOutput("  Texte simple  ")).toBe("Texte simple");
  });

  it("20 propositions par heure et par administrateur ; la fenêtre se libère ; un autre administrateur n'est pas touché", () => {
    const now = 1_000_000;
    for (let index = 0; index < BILAN_AI_RATE_PER_HOUR; index += 1) expect(takeAiSlot(1, now)).toBe(true);
    expect(takeAiSlot(1, now + 1000)).toBe(false);
    expect(takeAiSlot(2, now + 1000)).toBe(true);
    expect(takeAiSlot(1, now + 3_700_000)).toBe(true);
  });

  it("appelle Perplexity avec la clé du serveur, sans recherche web ; réessaie sans ce paramètre s'il est refusé ; échoue proprement sinon", async () => {
    const ok = (content: string) => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content } }] }) }) as Response;
    const fetcher = vi.fn().mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({}) } as Response).mockResolvedValueOnce(ok("Texte révisé[1]"));
    const messages = buildBilanAiMessages("correct", "Texte à relire pour la correction orthographique.");
    expect(await askPerplexity(messages, { fetcher: fetcher as unknown as typeof fetch })).toBe("Texte révisé");
    const first = JSON.parse(fetcher.mock.calls[0][1].body);
    const second = JSON.parse(fetcher.mock.calls[1][1].body);
    expect(fetcher.mock.calls[0][0]).toBe("https://api.perplexity.ai/chat/completions");
    expect(fetcher.mock.calls[0][1].headers.Authorization).toBe("Bearer cle-de-test");
    expect(first.disable_search).toBe(true);
    expect(second.disable_search).toBeUndefined();
    expect(first.messages[1].content).not.toMatch(/@|\+\d{3}/);
    await expect(askPerplexity(messages, { fetcher: vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }) as unknown as typeof fetch })).rejects.toThrow(/500/);
    await expect(askPerplexity(messages, { fetcher: vi.fn().mockResolvedValue(ok("  ")) as unknown as typeof fetch })).rejects.toThrow(/vide/);
    delete process.env.PERPLEXITY_API_KEY;
    await expect(askPerplexity(messages)).rejects.toThrow(/manquante/);
  });

  it("côté serveur : session d'abord, clé absente = message clair, aucune écriture, aucune clé dans le code", () => {
    const router = read("server/routers/bilanAi.ts");
    expect(router.indexOf("await requireValidAdminSession(input.sessionToken)")).toBeGreaterThan(-1);
    expect((router.match(/await requireValidAdminSession\(input\.sessionToken\)/g) ?? []).length).toBe(2);
    expect(router).toContain("PERPLEXITY_API_KEY doit être ajoutée");
    expect(router).toContain("pseudonymizeBilan(input.text, input.fullName)");
    expect(router).not.toMatch(/db\.|getDb|insert\(|update\(/);
    const service = read("server/services/bilanAi.ts");
    expect(service).not.toMatch(/pplx-[A-Za-z0-9]/);
    expect(service).toContain("process.env.PERPLEXITY_API_KEY");
    expect(read("server/routers.ts")).toContain("bilanAi: bilanAiRouter");
    expect(read("client/src/components/EvaluationDeliveryEditor.tsx")).toContain("<BilanAiAssistant sessionToken={sessionToken} text={text}");
  });
});

describe("boutons de l'assistant", () => {
  const apply = vi.fn();
  it("sans clé côté serveur, une note explique et aucun bouton n'est proposé ; avant le chargement, rien n'apparaît", () => {
    render(<BilanAiAssistant sessionToken="t" text={"x".repeat(60)} onApply={apply} />);
    expect(screen.queryByTestId("bilan-ai")).toBeNull();
    cleanup();
    state.queries["bilanAi.status"] = { data: { available: false, modes: MODES } };
    render(<BilanAiAssistant sessionToken="t" text={"x".repeat(60)} onApply={apply} />);
    expect(screen.getByTestId("bilan-ai-off").textContent).toMatch(/Perplexity/);
    expect(screen.queryByTestId("bilan-ai-run")).toBeNull();
  });

  it("proposer demande au moins 30 caractères, envoie le nom pour qu'il soit masqué côté serveur ; remplacer demande confirmation et reste annulable ; ignorer ne change rien", () => {
    state.queries["bilanAi.status"] = { data: { available: true, modes: MODES } };
    state.result = { proposal: "Texte amélioré {{nom}}", warnings: ["Formulation à revoir : garanti"] };
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValue(true);
    const onApply = vi.fn();
    const { rerender } = render(<BilanAiAssistant sessionToken="t" text="trop court" fullName="Aïcha Diallo" onApply={onApply} />);
    expect((screen.getByTestId("bilan-ai-run") as HTMLButtonElement).disabled).toBe(true);
    const original = "Texte d'origine suffisamment long pour être relu par l'assistant.";
    rerender(<BilanAiAssistant sessionToken="t" text={original} fullName="Aïcha Diallo" onApply={onApply} />);
    fireEvent.change(screen.getByTestId("bilan-ai-mode"), { target: { value: "correct" } });
    fireEvent.click(screen.getByTestId("bilan-ai-run"));
    expect(state.calls).toEqual([{ proc: "bilanAi.improve", input: { sessionToken: "t", mode: "correct", text: original, fullName: "Aïcha Diallo" } }]);
    expect((screen.getByTestId("bilan-ai-proposal") as HTMLTextAreaElement).value).toBe("Texte amélioré {{nom}}");
    expect(screen.getByTestId("bilan-ai-warnings").textContent).toMatch(/garanti/);
    fireEvent.click(screen.getByTestId("bilan-ai-apply"));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(onApply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("bilan-ai-apply"));
    expect(onApply).toHaveBeenCalledWith("Texte amélioré {{nom}}");
    fireEvent.click(screen.getByTestId("bilan-ai-undo"));
    expect(onApply).toHaveBeenLastCalledWith(original);
    expect(screen.queryByTestId("bilan-ai-result")).toBeNull();
    fireEvent.click(screen.getByTestId("bilan-ai-run"));
    fireEvent.click(screen.getByTestId("bilan-ai-ignore"));
    expect(screen.queryByTestId("bilan-ai-result")).toBeNull();
  });
});
