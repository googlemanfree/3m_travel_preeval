// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const { state } = vi.hoisted(() => ({ state: { data: undefined as any, navigated: [] as string[], location: "/admin" } }));

vi.mock("@/lib/trpc", () => ({
  trpc: { adminAuth: { twoFactorStatus: { useQuery: () => ({ data: state.data }) } } },
}));
vi.mock("wouter", () => ({ useLocation: () => [state.location, (to: string) => state.navigated.push(to)] }));

import AdminTwoFactorNotice from "@/components/AdminTwoFactorNotice";

(globalThis as { React?: typeof React }).React = React;
beforeEach(() => { state.data = undefined; state.navigated = []; state.location = "/admin"; sessionStorage.clear(); });
afterEach(cleanup);

describe("rappel de double authentification pour les administrateurs", () => {
  it("s'affiche quand la double authentification n'est pas activée et mène à la page de sécurité", () => {
    state.data = { enabled: false, enrolledAt: null };
    render(<AdminTwoFactorNotice sessionToken="jeton" />);
    expect(screen.getByTestId("admin-2fa-notice")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Activer maintenant/ }));
    expect(state.navigated).toEqual(["/admin/securite"]);
  });

  it("ne s'affiche pas quand elle est activée, ni tant que l'état est inconnu", () => {
    state.data = { enabled: true, enrolledAt: new Date() };
    const { rerender } = render(<AdminTwoFactorNotice sessionToken="jeton" />);
    expect(screen.queryByTestId("admin-2fa-notice")).toBeNull();
    state.data = undefined;
    rerender(<AdminTwoFactorNotice sessionToken="jeton" />);
    expect(screen.queryByTestId("admin-2fa-notice")).toBeNull();
  });

  it("ne s'affiche pas sur la page d'activation elle-même", () => {
    state.data = { enabled: false, enrolledAt: null };
    state.location = "/admin/securite";
    render(<AdminTwoFactorNotice sessionToken="jeton" />);
    expect(screen.queryByTestId("admin-2fa-notice")).toBeNull();
  });

  it("se ferme pour la session en cours seulement", () => {
    state.data = { enabled: false, enrolledAt: null };
    render(<AdminTwoFactorNotice sessionToken="jeton" />);
    fireEvent.click(screen.getByRole("button", { name: /Fermer ce rappel/ }));
    expect(screen.queryByTestId("admin-2fa-notice")).toBeNull();
    expect(sessionStorage.getItem("adminTwoFactorNoticeDismissed")).toBe("1");
  });
});
