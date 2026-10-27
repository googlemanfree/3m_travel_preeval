// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";

(globalThis as any).React = React;

import ServiceStatus from "@/pages/ServiceStatus";

const respond = (status: number, body: unknown) => Promise.resolve({ status, ok: status < 400, json: async () => body } as Response);

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("page /etat-du-service : contrôle réel de disponibilité", () => {
  it("affiche « opérationnel » quand le serveur répond ok, et interroge /api/public/health", async () => {
    const fetchMock = vi.fn(() => respond(200, { status: "ok", database: "ok", checkedAt: "2026-10-17T10:30:00.000Z" }));
    vi.stubGlobal("fetch", fetchMock);
    render(<ServiceStatus />);
    expect(screen.getByTestId("status-badge").textContent).toMatch(/en cours/i);
    await waitFor(() => expect(screen.getByTestId("status-badge").textContent).toMatch(/opérationnel/i));
    expect((fetchMock.mock.calls[0] as unknown[])[0]).toBe("/api/public/health");
    expect(screen.getByTestId("status-checked-at").textContent).not.toMatch(/—/);
  });

  it("signale un service dégradé quand la base ne répond pas (503)", async () => {
    vi.stubGlobal("fetch", vi.fn(() => respond(503, { status: "degraded", database: "down", checkedAt: "2026-10-17T10:30:00.000Z" })));
    render(<ServiceStatus />);
    await waitFor(() => expect(screen.getByTestId("status-badge").textContent).not.toMatch(/opérationnel|en cours/i));
    expect(screen.getByTestId("status-badge").textContent).toMatch(/perturb|dégrad|incident|indisponible/i);
  });

  it("n'affirme jamais « opérationnel » quand le contrôle lui-même est injoignable, et permet de revérifier", async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error("network")).mockImplementation(() => respond(200, { status: "ok", database: "ok", checkedAt: "2026-10-17T10:31:00.000Z" }));
    vi.stubGlobal("fetch", fetchMock);
    render(<ServiceStatus />);
    await waitFor(() => expect(screen.getByTestId("status-badge").textContent).not.toMatch(/en cours/i));
    expect(screen.getByTestId("status-badge").textContent).not.toMatch(/opérationnel/i);
    fireEvent.click(screen.getByTestId("status-recheck"));
    await waitFor(() => expect(screen.getByTestId("status-badge").textContent).toMatch(/opérationnel/i));
    expect(fetchMock.mock.calls.filter(([input]) => input === "/api/public/health")).toHaveLength(2);
  });

  it("explique ce que couvre la page et que faire si un service ne répond pas", async () => {
    vi.stubGlobal("fetch", vi.fn(() => respond(200, { status: "ok", database: "ok", checkedAt: "2026-10-17T10:30:00.000Z" })));
    render(<ServiceStatus />);
    const guidance = screen.getByTestId("status-guidance");
    expect(guidance.textContent).toMatch(/ne remplace pas/i);
    expect(guidance.textContent).toMatch(/WhatsApp/);
    await waitFor(() => expect(screen.getByTestId("status-badge").textContent).toMatch(/opérationnel/i));
  });
});
