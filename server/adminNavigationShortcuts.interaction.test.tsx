// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AdminNavigationShortcuts } from "../client/src/components/AdminNavigationShortcuts";

describe("AdminNavigationShortcuts — interactions HD", () => {
  afterEach(cleanup);

  it("déclenche réellement Actualiser, Retour et Dossiers", () => {
    const onRefresh = vi.fn();
    const onBack = vi.fn();
    const onDossiers = vi.fn();

    render(<AdminNavigationShortcuts onRefresh={onRefresh} onBack={onBack} onDossiers={onDossiers} isRefreshing={false} isRefreshDisabled={false} canGoBack />);

    fireEvent.click(screen.getByRole("button", { name: /Actualiser manuellement/i }));
    fireEvent.click(screen.getByRole("button", { name: /Retour/i }));
    fireEvent.click(screen.getByRole("button", { name: /Dossiers/i }));

    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onDossiers).toHaveBeenCalledTimes(1);
  });

  it("désactive uniquement les actions indisponibles sans masquer les contrôles", () => {
    render(<AdminNavigationShortcuts onRefresh={vi.fn()} onBack={vi.fn()} onDossiers={vi.fn()} isRefreshing isRefreshDisabled canGoBack={false} />);

    expect(screen.getByRole("button", { name: /Actualiser manuellement/i }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: /Retour/i }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: /Dossiers/i }).hasAttribute("disabled")).toBe(false);
  });
});
