// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { buildIcs, candidateMessageStatus, clientText, dossierClientLabel, documentHelpFor, replyTimeSentence, workflowClientLabel } from "../shared/clientCase";
import { fetchWithRetry } from "../client/src/lib/resilientFetch";
import { deviceHash, deviceLabelFromUserAgent, douala, emailAllowed, getSessionCutoff, inQuietHours, recordLoginEvent, revokeAllSessions } from "./services/candidateSecurity";

(globalThis as any).React = React;
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));

const state = vi.hoisted(() => ({ queries: {} as Record<string, any>, calls: [] as Array<{ proc: string; input: any }>, logout: vi.fn() }));
vi.mock("@/hooks/useCandidateAuth", () => ({ useCandidateAuth: () => ({ logout: state.logout, candidate: { id: 1 }, isAuthenticated: true }) }));
vi.mock("@/lib/clientSpaceSync", () => ({ clientSpacePolling: () => ({}) }));
vi.mock("@/lib/trpc", () => {
  const procedure = (path: string) => ({
    useQuery: () => ({ error: null, isLoading: false, ...(state.queries[path] ?? { data: undefined }) }),
    useMutation: (options?: { onSuccess?: (result: unknown) => void }) => ({ isPending: false, mutate: (input: unknown) => { state.calls.push({ proc: path, input }); options?.onSuccess?.({ ok: true }); } }),
  });
  return { trpc: new Proxy({}, { get: (_t, router: string) => router === "useUtils" ? () => new Proxy({}, { get: () => new Proxy({}, { get: () => ({ invalidate: async () => undefined }) }) }) : new Proxy({}, { get: (_p, name: string) => procedure(`${router}.${name}`) }) }) };
});

import { ClientAccount } from "../client/src/components/ClientAccount";
import { ClientAgenda } from "../client/src/components/ClientAgenda";
import { ClientCaseHero } from "../client/src/components/ClientCaseHero";
import { ClientTimeline } from "../client/src/components/ClientTimeline";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");
afterEach(() => { cleanup(); state.queries = {}; state.calls = []; state.logout.mockReset(); });

describe("espace client : libellés et calculs", () => {
  it("l'état du dossier se lit en français et en anglais, sans promesse", () => {
    expect(dossierClientLabel("nouveau", "fr")).toMatch(/Pré-dossier/);
    expect(dossierClientLabel("nouveau", "en")).toMatch(/Pre-file/);
    expect(dossierClientLabel("inconnu", "fr")).toMatch(/Pré-dossier/);
    expect(workflowClientLabel("waiting_customer", "en")).toMatch(/waiting for something from you/);
    expect(workflowClientLabel("autre", "fr")).toBeNull();
    expect(clientText("en", "heroTitle")).toBe("Where is my file?");
    expect(clientText(null, "heroTitle")).toBe("Où en est mon dossier ?");
  });

  it("le délai de réponse n'est annoncé qu'à partir de 10 échanges mesurés ; avant, aucune promesse de délai", () => {
    expect(replyTimeSentence(5, 3, "fr")).not.toMatch(/\d/);
    expect(replyTimeSentence(null, 50, "fr")).not.toMatch(/\d/);
    expect(replyTimeSentence(5.4, 25, "fr")).toBe("Délai habituel de réponse sur les derniers échanges : environ 5 h.");
    expect(replyTimeSentence(72, 25, "fr")).toMatch(/environ 3 jours/);
    expect(replyTimeSentence(5, 25, "en")).toBe("Usual reply time over recent exchanges: about 5 h.");
  });

  it("un message du candidat est « envoyé », « lu par l'équipe » ou « répondu » ; ceux de l'équipe n'ont pas d'état", () => {
    const all = [
      { senderRole: "candidate", isRead: true, createdAt: "2026-11-01T08:00:00Z" },
      { senderRole: "advisor", isRead: true, createdAt: "2026-11-01T09:00:00Z" },
      { senderRole: "candidate", isRead: true, createdAt: "2026-11-02T08:00:00Z" },
      { senderRole: "candidate", isRead: false, createdAt: "2026-11-03T08:00:00Z" },
    ];
    expect(candidateMessageStatus(all[0], all)).toBe("answered");
    expect(candidateMessageStatus(all[2], all)).toBe("read");
    expect(candidateMessageStatus(all[3], all)).toBe("sent");
    expect(candidateMessageStatus(all[1], all)).toBeNull();
    expect(candidateMessageStatus({}, all)).toBeNull();
  });

  it("le fichier .ics est valide, échappé, daté, avec rappel, et ignore une date illisible", () => {
    const ics = buildIcs([
      { uid: "slot-1", title: "Rendez-vous, point; dossier\nligne 2", description: "https://meet.google.com/abc", start: "2026-11-10T09:00:00.000Z", durationMin: 45 },
      { uid: "pay-2", title: "Échéance : acompte", start: "2026-11-15", allDay: true },
      { uid: "bad", title: "Cassé", start: "pas une date" },
    ], new Date("2026-11-01T00:00:00Z"));
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect((ics.match(/BEGIN:VEVENT/g) ?? []).length).toBe(2);
    expect(ics).toContain("DTSTART:20261110T090000Z");
    expect(ics).toContain("DTEND:20261110T094500Z");
    expect(ics).toContain("DTSTART;VALUE=DATE:20261115");
    expect(ics).toContain("DTEND;VALUE=DATE:20261116");
    expect(ics).toContain("SUMMARY:Rendez-vous\\, point\\; dossier\\nligne 2");
    expect(ics).toContain("BEGIN:VALARM");
    expect(ics).not.toContain("Cassé");
    for (const line of ics.split("\r\n")) expect(line.length).toBeLessThanOrEqual(75);
  });

  it("l'aide par pièce : la photo d'identité n'est pas confondue avec le passeport, le relevé bancaire avec le relevé de notes", () => {
    expect(documentHelpFor("Photo d'identité récente", "fr").why).toMatch(/identifier la personne/);
    expect(documentHelpFor("Passeport — page d'identité", "fr").why).toMatch(/identité, votre nationalité/);
    expect(documentHelpFor("Relevé bancaire des trois derniers mois", "fr").why).toMatch(/financer votre séjour/);
    expect(documentHelpFor("Relevé de notes de la licence", "fr").why).toMatch(/niveau d'études/);
    expect(documentHelpFor("Lettre d'invitation", "fr").why).toMatch(/Votre conseiller en a besoin/);
    expect(documentHelpFor("Passport", "en").good[0]).toMatch(/identity page/);
    for (const label of ["Passeport", "Photo", "Diplôme", "CV", "Acte de naissance", "Preuve de fonds", "Assurance voyage", "Casier judiciaire", "Autre"]) {
      const help = documentHelpFor(label, "fr");
      expect(help.good.length, label).toBeGreaterThan(0);
      expect(help.refused.length, label).toBeGreaterThan(0);
    }
  });
});

describe("envoi de pièces sur réseau instable", () => {
  const response = (status: number) => ({ status, ok: status < 400 }) as Response;
  const fast = { sleep: async () => undefined, isOnline: () => true };

  it("reprend un envoi après une réponse « serveur indisponible » puis réussit", async () => {
    const send = vi.fn().mockResolvedValueOnce(response(503)).mockResolvedValueOnce(response(200));
    const notes: string[] = [];
    const result = await fetchWithRetry(send, { ...fast, onRetry: (attempt, total, reason) => notes.push(`${attempt}/${total}:${reason}`) });
    expect(result.status).toBe(200);
    expect(send).toHaveBeenCalledTimes(2);
    expect(notes).toEqual(["1/3:server"]);
  });

  it("reprend après une coupure de connexion, jusqu'à trois fois, puis signale l'échec", async () => {
    const failing = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(fetchWithRetry(failing, fast)).rejects.toThrow(/Failed to fetch/);
    expect(failing).toHaveBeenCalledTimes(4);
    const recovering = vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch")).mockRejectedValueOnce(new TypeError("Failed to fetch")).mockResolvedValueOnce(response(200));
    expect((await fetchWithRetry(recovering, fast)).status).toBe(200);
  });

  it("ne rejoue jamais un refus du serveur (fichier invalide, session expirée)", async () => {
    for (const status of [400, 401, 403, 413, 422]) {
      const send = vi.fn().mockResolvedValue(response(status));
      expect((await fetchWithRetry(send, fast)).status).toBe(status);
      expect(send).toHaveBeenCalledTimes(1);
    }
  });

  it("hors ligne, attend le retour de la connexion au lieu d'échouer", async () => {
    let online = false;
    const send = vi.fn().mockResolvedValue(response(200));
    const notes: string[] = [];
    const result = await fetchWithRetry(send, { sleep: async () => undefined, isOnline: () => online, waitForOnline: async () => { online = true; }, onRetry: (_a, _t, reason) => notes.push(reason) });
    expect(result.status).toBe(200);
    expect(notes).toEqual(["offline"]);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("le téléverseur utilise la reprise automatique et affiche l'aide par pièce ; la messagerie ne promet plus de délai fixe", () => {
    const uploader = read("client/src/components/DocumentUploader.tsx");
    expect(uploader).toContain("fetchWithRetry(() => fetch(\"/api/candidate/upload\"");
    expect(uploader).toContain('data-testid="document-help"');
    const messages = read("client/src/components/ClientMessagesPanel.tsx");
    expect(messages).not.toContain("sous 24 heures ouvrées");
    expect(messages).toContain("replyTimeSentence(");
    expect(messages).toContain('data-testid="message-status"');
    expect(messages).toContain('data-testid="messages-search"');
  });
});

/** Fausse base : chaque lecture rend la réponse suivante ; les écritures sont enregistrées. */
function fakeDb(reads: unknown[][]) {
  const writes: Array<{ kind: "insert" | "update"; values: any }> = [];
  const chain: any = { from: () => chain, where: () => chain, orderBy: () => chain, limit: async () => reads.shift() ?? [] };
  return {
    writes,
    db: { select: () => chain, insert: () => ({ values: async (values: any) => { writes.push({ kind: "insert", values }); } }), update: () => ({ set: (values: any) => ({ where: async () => { writes.push({ kind: "update", values }); } }) }) } as any,
  };
}

describe("sécurité du compte et préférences", () => {
  it("reconnaît l'appareil sans empreinte invasive", () => {
    expect(deviceLabelFromUserAgent("Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36")).toBe("Chrome sur Android");
    expect(deviceLabelFromUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit Version/17 Safari/604.1")).toBe("Safari sur iOS");
    expect(deviceLabelFromUserAgent("Mozilla/5.0 (Windows NT 10.0) Gecko/20100101 Firefox/121.0")).toBe("Firefox sur Windows");
    expect(deviceLabelFromUserAgent(undefined)).toBe("Navigateur sur appareil inconnu");
    expect(deviceHash("Chrome sur Android", "fr-FR")).toBe(deviceHash("Chrome sur Android", "fr-FR"));
    expect(deviceHash("Chrome sur Android", "fr-FR")).not.toBe(deviceHash("Safari sur iOS", "fr-FR"));
  });

  it("heures de silence : plage de jour, plage qui passe minuit, plage vide ; heure du Cameroun", () => {
    expect(inQuietHours(22, 6, 23)).toBe(true);
    expect(inQuietHours(22, 6, 3)).toBe(true);
    expect(inQuietHours(22, 6, 12)).toBe(false);
    expect(inQuietHours(13, 15, 14)).toBe(true);
    expect(inQuietHours(13, 15, 15)).toBe(false);
    expect(inQuietHours(8, 8, 8)).toBe(false);
    expect(inQuietHours(null, 6, 3)).toBe(false);
    expect(douala(new Date("2026-11-01T23:30:00Z"))).toBe(0);
    expect(douala(new Date("2026-11-01T11:00:00Z"))).toBe(12);
  });

  it("« me déconnecter partout » enregistre une date limite ; elle se relit et se met à jour", async () => {
    const fresh = fakeDb([[]]);
    await revokeAllSessions(fresh.db, 9, new Date("2026-11-01T10:00:00Z"));
    expect(fresh.writes).toEqual([{ kind: "insert", values: { settingKey: "candidate_session_cutoff:9", settingValue: String(Math.floor(Date.parse("2026-11-01T10:00:00Z") / 1000)) } }]);
    const existing = fakeDb([[{ id: 4 }]]);
    await revokeAllSessions(existing.db, 9, new Date("2026-11-02T10:00:00Z"));
    expect(existing.writes[0].kind).toBe("update");
    expect(await getSessionCutoff(fakeDb([[{ settingValue: "1790000000" }]]).db, 9)).toBe(1790000000);
    expect(await getSessionCutoff(fakeDb([[]]).db, 9)).toBeNull();
    expect(await getSessionCutoff(fakeDb([[{ settingValue: "abc" }]]).db, 9)).toBeNull();
  });

  it("la date limite refuse tout jeton émis avant elle, et rien d'autre", () => {
    const candidate = read("server/routers/candidate.ts");
    expect(candidate).toContain("issuedAt < cutoff");
    expect(candidate).toContain("recordLoginEvent(db, candidate.id");
    expect(candidate.slice(candidate.indexOf("recordLoginEvent(db, candidate.id") - 80, candidate.indexOf("recordLoginEvent(db, candidate.id") + 20)).toContain("try {");
  });

  it("une connexion depuis un nouvel appareil prévient le candidat ; le premier appareil ou le même appareil, non", async () => {
    const req = { headers: { "user-agent": "Mozilla/5.0 (Linux; Android 13) Chrome/120.0 Mobile Safari/537.36", "accept-language": "fr-FR" } };
    const own = deviceHash("Chrome sur Android", "fr-FR");
    const first = fakeDb([[]]);
    expect((await recordLoginEvent(first.db, 3, req)).newDevice).toBe(false);
    expect(first.writes.filter((write) => write.values.type === "new_device_login")).toHaveLength(0);
    const same = fakeDb([[{ deviceHash: own }]]);
    expect((await recordLoginEvent(same.db, 3, req)).newDevice).toBe(false);
    const other = fakeDb([[{ deviceHash: deviceHash("Safari sur iOS", "fr-FR") }]]);
    expect((await recordLoginEvent(other.db, 3, req)).newDevice).toBe(true);
    expect(other.writes.find((write) => write.values.type === "new_device_login")?.values).toMatchObject({ candidateId: 3, title: "Nouvelle connexion à votre espace" });
  });

  it("l'e-mail non indispensable respecte le refus et les heures de silence ; sans préférence ou en cas d'erreur, il part comme avant", async () => {
    expect(await emailAllowed(fakeDb([[]]).db, 1)).toBe(true);
    expect(await emailAllowed(fakeDb([[{ emailEnabled: 0, quietFrom: null, quietTo: null }]]).db, 1)).toBe(false);
    expect(await emailAllowed(fakeDb([[{ emailEnabled: 1, quietFrom: 22, quietTo: 6 }]]).db, 1, new Date("2026-11-01T23:30:00Z"))).toBe(false);
    expect(await emailAllowed(fakeDb([[{ emailEnabled: 1, quietFrom: 22, quietTo: 6 }]]).db, 1, new Date("2026-11-01T11:00:00Z"))).toBe(true);
    expect(await emailAllowed({ select: () => { throw new Error("table absente"); } } as any, 1)).toBe(true);
  });

  it("toutes les procédures de l'espace client exigent un candidat connecté, et les envois non indispensables passent par les préférences", () => {
    const router = read("server/routers/clientSpace.ts");
    const names = Array.from(router.matchAll(/\n  ([A-Za-z]+): candidateProcedure/g), (match) => match[1]);
    expect(names).toEqual(["myCaseOverview", "myTimeline", "replyTime", "myPreferences", "savePreferences", "securityOverview", "logoutEverywhere"]);
    expect(router).not.toMatch(/publicProcedure/);
    expect(router).toContain("revokeAllSessions(db, ctx.candidate.id)");
    expect(read("server/routers/remoteSupport.ts")).toContain("emailAllowed(db, candidate.id)");
    expect(read("server/routers/adminOps.ts")).toContain("emailAllowed(db, candidate.id)");
    expect(read("server/routers/remoteSupport.ts")).toContain("whatsappAllowed: !refusedWhatsapp.has(person.id)");
  });

  it("la migration 0095 ne crée que des tables ; le routeur et les écrans sont branchés dans l'ordre voulu", () => {
    const sql = read("drizzle/0095_client_space.sql");
    expect((sql.match(/CREATE TABLE IF NOT EXISTS/g) ?? []).length).toBe(2);
    expect(sql.replace(/ON UPDATE CURRENT_TIMESTAMP/g, "")).not.toMatch(/\b(?:DROP|ALTER|DELETE|UPDATE|TRUNCATE|INSERT)\b/i);
    expect(sql).toContain("whatsapp_opt_in TINYINT(1) NULL DEFAULT NULL");
    expect(read("server/routers.ts")).toContain("clientSpace: clientSpaceRouter");
    const space = read("client/src/pages/EvaluationSpace.tsx");
    const order = ["<ClientCaseHero", "<ClientRemoteSupport", "<ClientAgenda", "<ClientTimeline", "<ClientAccount"].map((tag) => space.indexOf(tag));
    expect(order.every((position) => position > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
});

describe("espace client : écrans", () => {
  const hero = (over: Record<string, unknown> = {}) => ({ data: { language: "fr", dossierLabel: "Dossier ouvert : collecte et contrôle de vos pièces.", teamDoing: "Votre conseiller contrôle les pièces que vous avez envoyées.", lastTeamActivityAt: "2026-10-30T10:00:00.000Z", myTurn: [{ kind: "documents", text: "Renvoyer 2 pièce(s) à remplacer." }], nextAppointmentAt: null, ...over } });

  it("« Où en est mon dossier ? » montre l'état, ce qui reste à faire de mon côté et ce que fait l'équipe", () => {
    state.queries["clientSpace.myCaseOverview"] = hero();
    render(<ClientCaseHero />);
    expect(screen.getByTestId("case-hero-state").textContent).toMatch(/collecte et contrôle/);
    expect(screen.getByTestId("case-hero-my-turn").textContent).toMatch(/Renvoyer 2 pièce/);
    expect(screen.getByTestId("case-hero-team").textContent).toMatch(/contrôle les pièces/);
    cleanup();
    state.queries["clientSpace.myCaseOverview"] = hero({ language: "en", myTurn: [], teamDoing: null, lastTeamActivityAt: null });
    render(<ClientCaseHero />);
    expect(screen.getByTestId("client-case-hero").textContent).toMatch(/Where is my file\?/);
    expect(screen.getByTestId("case-hero-my-turn").textContent).toMatch(/Nothing to do on your side/);
  });

  it("l'agenda réunit rendez-vous, échéances et date de l'étape ; il propose le .ics seulement s'il y a quelque chose", () => {
    const future = new Date(Date.now() + 72 * 3600_000).toISOString();
    state.queries["remoteSupport.myOverview"] = { data: { nextStep: { text: "Envoyez le passeport", dueOn: "2099-01-05" }, myBookings: [{ id: 1, startsAt: future, durationMin: 30, channel: "video", topic: null, status: "booked", joinUrl: "https://meet.google.com/abc", canCancel: true }], openSlots: [], acknowledgements: [] } };
    state.queries["adminOps.myPaymentPlan"] = { data: { summary: {}, items: [{ id: 7, label: "Acompte", amount: 50000, currency: "XAF", dueOn: "2099-02-01", status: "pending", paidOn: null, overdue: false }, { id: 8, label: "Déjà payé", amount: 1000, currency: "XAF", dueOn: "2099-02-02", status: "paid", paidOn: "2099-01-01", overdue: false }] } };
    state.queries["clientSpace.myPreferences"] = { data: { language: "fr", emailEnabled: true, whatsappOptIn: null, quietFrom: null, quietTo: null } };
    render(<ClientAgenda />);
    expect(screen.getByTestId("agenda-slot-1")).toBeTruthy();
    expect(screen.getByTestId("agenda-pay-7").textContent).toMatch(/Acompte/);
    expect(screen.getByTestId("agenda-next-step")).toBeTruthy();
    expect(screen.queryByTestId("agenda-pay-8")).toBeNull();
    expect(screen.getByTestId("agenda-download")).toBeTruthy();
    cleanup();
    state.queries["remoteSupport.myOverview"] = { data: { nextStep: null, myBookings: [], openSlots: [], acknowledgements: [] } };
    state.queries["adminOps.myPaymentPlan"] = { data: null };
    render(<ClientAgenda />);
    expect(screen.getByTestId("agenda-empty")).toBeTruthy();
    expect(screen.queryByTestId("agenda-download")).toBeNull();
  });

  it("le journal liste les événements datés et propose l'impression sur papier à en-tête", () => {
    state.queries["clientSpace.myTimeline"] = { data: { language: "fr", fullName: "Aïcha Diallo", reference: "COMPTE-00009", events: [{ at: "2026-10-30T10:00:00.000Z", kind: "document", title: "Pièce validée : passeport.pdf", detail: null }, { at: "2026-10-20T10:00:00.000Z", kind: "document", title: "Pièce à renvoyer : photo.jpg", detail: "Photo floue" }] } };
    render(<ClientTimeline />);
    expect(screen.getAllByTestId("timeline-event")).toHaveLength(2);
    expect(screen.getByText("Photo floue")).toBeTruthy();
    expect(screen.getByTestId("print-branded")).toBeTruthy();
  });

  it("Mon compte : enregistre la langue, l'e-mail, WhatsApp et les heures de silence ; refuse une plage incomplète ; déconnecte partout après confirmation", async () => {
    state.queries["clientSpace.myPreferences"] = { data: { language: "fr", emailEnabled: true, whatsappOptIn: null, quietFrom: null, quietTo: null } };
    state.queries["clientSpace.securityOverview"] = { data: { lastLoginAt: null, logins: [{ label: "Chrome sur Android", at: "2026-11-01T09:00:00.000Z" }] } };
    render(<ClientAccount />);
    fireEvent.click(screen.getByText("Mon compte"));
    expect(screen.getByTestId("account-security").textContent).toMatch(/Chrome sur Android/);
    fireEvent.change(screen.getByTestId("account-language"), { target: { value: "en" } });
    fireEvent.click(screen.getByTestId("account-email"));
    fireEvent.change(screen.getByTestId("account-whatsapp"), { target: { value: "no" } });
    fireEvent.change(screen.getByTestId("account-quiet-from"), { target: { value: "22" } });
    expect((screen.getByTestId("account-save") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByTestId("account-quiet-to"), { target: { value: "6" } });
    fireEvent.click(screen.getByTestId("account-save"));
    expect(state.calls.find((call) => call.proc === "clientSpace.savePreferences")?.input).toEqual({ language: "en", emailEnabled: false, whatsappOptIn: false, quietFrom: 22, quietTo: 6 });
    vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    fireEvent.click(screen.getByTestId("account-logout-all"));
    expect(state.calls.some((call) => call.proc === "clientSpace.logoutEverywhere")).toBe(false);
    fireEvent.click(screen.getByTestId("account-logout-all"));
    await waitFor(() => expect(state.logout).toHaveBeenCalledTimes(1));
    expect(state.calls.some((call) => call.proc === "clientSpace.logoutEverywhere")).toBe(true);
  });
});
