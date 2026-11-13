import { beforeEach, describe, expect, it, vi } from "vitest";

const sonner = vi.hoisted(() => {
  const fn: any = vi.fn(() => "id-default");
  fn.error = vi.fn(() => "id-error");
  fn.dismiss = vi.fn();
  return fn;
});

vi.mock("sonner", () => ({ toast: sonner }));

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { toast, useToast } from "../client/src/components/ui/use-toast";

describe("useToast : les notifications doivent réellement s'afficher", () => {
  beforeEach(() => vi.clearAllMocks());

  it("délègue à sonner, le seul système de notifications monté dans l'application", () => {
    const app = readFileSync(resolve(import.meta.dirname, "../client/src/App.tsx"), "utf8");
    expect(app).toContain('from "@/components/ui/sonner"');
    expect(app).not.toContain('from "@/components/ui/toaster"');

    toast({ title: "Demande reçue", description: "Référence TRM-1" });
    expect(sonner).toHaveBeenCalledWith("Demande reçue", expect.objectContaining({ description: "Référence TRM-1" }));
  });

  it("affiche les erreurs (variant destructive) comme des erreurs", () => {
    useToast().toast({ title: "Téléphone requis", description: "Ajoutez un numéro", variant: "destructive" });
    expect(sonner.error).toHaveBeenCalledWith("Téléphone requis", expect.objectContaining({ description: "Ajoutez un numéro" }));
  });

  it("utilise la description comme message quand il n'y a pas de titre", () => {
    toast({ description: "Copié" });
    expect(sonner).toHaveBeenCalledWith("Copié", expect.objectContaining({ description: undefined }));
  });
});

describe("demande 3M Booking : retour après inscription", () => {
  it("passe le paramètre `from` lu par la page d'inscription (et non `returnTo`)", () => {
    const booking = readFileSync(resolve(import.meta.dirname, "../client/src/components/ThreeMBookingExperience.tsx"), "utf8");
    const register = readFileSync(resolve(import.meta.dirname, "../client/src/pages/Register.tsx"), "utf8");
    expect(register).toContain('params.get("from")');
    expect(booking).toContain("/register?from=");
    expect(booking).not.toContain("returnTo=");
  });
});
