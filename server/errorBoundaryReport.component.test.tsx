// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(globalThis as any).React = React;

import ErrorBoundary from "@/components/ErrorBoundary";
import {
  buildClientErrorReport,
  formatErrorDetails,
  makeErrorReference,
  resetSentReports,
  safePagePath,
  sendClientErrorReport,
} from "@/lib/clientErrorReport";

function Boom(): React.ReactElement {
  throw new Error("Cannot read properties of undefined (reading 'map')");
}

let beacons: Array<{ url: string; body: string }> = [];

beforeEach(() => {
  resetSentReports();
  beacons = [];
  window.history.pushState({}, "", "/admin/candidats?token=SECRET123#x");
  (navigator as any).sendBeacon = (url: string, blob: Blob) => {
    void blob.text().then(text => beacons.push({ url, body: text }));
    beacons.push({ url, body: "" });
    return true;
  };
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("référence et détails d'erreur", () => {
  it("la référence est stable, bien formée et sans signes ambigus", () => {
    const a = makeErrorReference("boom", "/admin", 1_000_000);
    expect(a).toMatch(/^ERR-[A-HJ-NP-Z2-9]{6}$/);
    expect(makeErrorReference("boom", "/admin", 1_000_000)).toBe(a);
    expect(makeErrorReference("autre", "/admin", 1_000_000)).not.toBe(a);
  });

  it("le chemin n'a ni domaine, ni requête, ni fragment", () => {
    expect(safePagePath("https://www.3mtravelagency.com/verify-email-link?token=abc#x")).toBe("/verify-email-link");
    expect(safePagePath("/mon-espace?section=documents")).toBe("/mon-espace");
  });

  it("le rapport garde un extrait de pile et le texte à copier cite référence, page et erreur", () => {
    const report = buildClientErrorReport(new Error("boom"), "\n    at Foo\n    at Bar", { href: "https://x.cm/a/b?token=1", userAgent: "UA" });
    expect(report.path).toBe("/a/b");
    const text = formatErrorDetails(report);
    expect(text).toContain(report.reference);
    expect(text).toContain("/a/b");
    expect(text).toContain("boom");
    expect(text).toContain("at Foo");
    expect(text).not.toContain("token");
  });

  it("n'envoie qu'une fois par référence et ne lève jamais d'exception", () => {
    const report = buildClientErrorReport(new Error("x"), "", { href: "/a" });
    expect(sendClientErrorReport(report)).toBe(true);
    expect(sendClientErrorReport(report)).toBe(false);
    (navigator as any).sendBeacon = () => { throw new Error("refusé"); };
    const other = buildClientErrorReport(new Error("y"), "", { href: "/b" });
    expect(() => sendClientErrorReport(other)).not.toThrow();
  });
});

describe("écran « Cette page n'a pas pu être chargée »", () => {
  it("affiche une référence, envoie le rapport sans jeton et propose de copier les détails", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<ErrorBoundary><Boom /></ErrorBoundary>);

    const code = screen.getByTestId("error-reference-code").textContent ?? "";
    expect(code).toMatch(/^ERR-[A-HJ-NP-Z2-9]{6}$/);
    await waitFor(() => expect(beacons.some(entry => entry.body.includes(code))).toBe(true));
    const sentBody = beacons.map(entry => entry.body).join("");
    expect(sentBody).toContain("/admin/candidats");
    expect(sentBody).not.toContain("SECRET123");

    fireEvent.click(screen.getByTestId("error-copy-details"));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(String(writeText.mock.calls[0][0])).toContain(code);
    await waitFor(() => expect(screen.getByTestId("error-copy-details").textContent).toContain("Détails copiés"));
  });

  it("le message WhatsApp transmet la référence et la page, jamais la requête de l'URL", () => {
    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    const code = screen.getByTestId("error-reference-code").textContent ?? "";
    const link = screen.getByText("WhatsApp Support").closest("a")!;
    const text = decodeURIComponent(link.getAttribute("href") ?? "");
    expect(text).toContain(code);
    expect(text).toContain("/admin/candidats");
    expect(text).not.toContain("SECRET123");
  });

  it("les boutons existants restent : réessayer et assistance", () => {
    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    expect(screen.getByText("Cette page n’a pas pu être chargée")).toBeTruthy();
    expect(screen.getByText("Réessayer la page")).toBeTruthy();
    expect(screen.getByText(/Assistance WhatsApp/)).toBeTruthy();
  });
});
