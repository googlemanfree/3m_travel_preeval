import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./_core/email", () => ({ sendEmail: vi.fn(async () => {}) }));

import { sendEmail } from "./_core/email";
import { QUOTA_ALERT_COOLDOWN_MS, buildQuotaAlertEmail, maybeAlertQuotaExhausted, resetQuotaAlertState, shouldSendQuotaAlert } from "./services/flightQuotaAlert";

const sendEmailMock = vi.mocked(sendEmail);

afterEach(() => {
  sendEmailMock.mockClear();
  resetQuotaAlertState();
});

describe("décision d'alerte : une seule par fenêtre de recul", () => {
  it("part quand aucune alerte n'a jamais été envoyée", () => {
    expect(shouldSendQuotaAlert(null, Date.now())).toBe(true);
  });

  it("ne repart pas avant la fin de la fenêtre, puis repart après", () => {
    const now = 1_000_000_000_000;
    const lastAlertAt = now - QUOTA_ALERT_COOLDOWN_MS + 1_000;
    expect(shouldSendQuotaAlert(lastAlertAt, now)).toBe(false);
    expect(shouldSendQuotaAlert(lastAlertAt, now + 1_000)).toBe(true);
  });
});

describe("contenu de l'e-mail d'alerte", () => {
  it("nomme le fournisseur, l'heure et le détail réel de l'échec, sans promesse de délai de réparation", () => {
    const { subject, html } = buildQuotaAlertEmail({ provider: "SearchAPI.io", detail: "SearchAPI.io a répondu 429 — quota exceeded", occurredAt: new Date("2026-09-27T06:12:00Z") });
    expect(subject).toContain("SearchAPI.io");
    expect(subject).toContain("Quota");
    expect(html).toContain("SearchAPI.io a répondu 429");
    expect(html).toContain("2026-09-27 06:12");
    expect(html).toContain("aucun tarif inventé");
    expect(html).toContain("secours SerpApi");
    expect(html).not.toMatch(/résolu (automatiquement|sous)|garanti/i);
  });

  it("neutralise le HTML d'un détail de fournisseur imprévisible", () => {
    const { html } = buildQuotaAlertEmail({ provider: "SearchAPI.io", detail: '<img src=x onerror="alert(1)">', occurredAt: new Date() });
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});

describe("envoi effectif : au plus un e-mail par fenêtre, jamais bloquant", () => {
  it("le premier appel envoie, les suivants dans la fenêtre n'envoient rien", () => {
    let clock = 1_000_000_000_000;
    const now = () => clock;
    maybeAlertQuotaExhausted("SearchAPI.io", "429", { now });
    maybeAlertQuotaExhausted("SearchAPI.io", "429", { now });
    clock += QUOTA_ALERT_COOLDOWN_MS - 1;
    maybeAlertQuotaExhausted("SearchAPI.io", "429", { now });
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(sendEmailMock.mock.calls[0][0]).toMatchObject({ to: "hello@3mtravelagency.com" });
  });

  it("un nouvel e-mail repart une fois la fenêtre passée", () => {
    let clock = 1_000_000_000_000;
    const now = () => clock;
    maybeAlertQuotaExhausted("SearchAPI.io", "429", { now });
    clock += QUOTA_ALERT_COOLDOWN_MS + 1;
    maybeAlertQuotaExhausted("SearchAPI.io", "429", { now });
    expect(sendEmailMock).toHaveBeenCalledTimes(2);
  });

  it("un échec d'envoi ne fait pas planter l'appelant (recherche du visiteur jamais bloquée)", async () => {
    sendEmailMock.mockRejectedValueOnce(new Error("SMTP indisponible"));
    expect(() => maybeAlertQuotaExhausted("SearchAPI.io", "429")).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
});

describe("branchement : uniquement sur un vrai 429, jamais pour une panne réseau ordinaire", () => {
  const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), "utf8").split(String.fromCharCode(13)).join("");

  it("l'alerte est déclenchée seulement quand le fournisseur répond 429", () => {
    const router = read("server/routers/flights.ts");
    expect(router).toContain("maybeAlertQuotaExhausted");
    expect(router).toContain("if (res.status === 429) maybeAlertQuotaExhausted(providerName, message);");
  });
});
