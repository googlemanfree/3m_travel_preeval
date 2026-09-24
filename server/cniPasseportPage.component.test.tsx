// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({
  calls: [] as any[],
  outcome: "success" as "success" | "error",
  toast: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    contact: {
      sendContactEmail: {
        useMutation: (handlers: { onSuccess?: () => void; onError?: (error: { message: string }) => void }) => ({
          isPending: false,
          mutate: (variables: any) => {
            state.calls.push(variables);
            if (state.outcome === "success") handlers.onSuccess?.();
            else handlers.onError?.({ message: "Trop de demandes envoyées depuis votre connexion. Réessayez dans 12 minutes." });
          },
        }),
      },
    },
  },
}));
vi.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: state.toast }) }));
vi.mock("@/components/SocialShareButtons", () => ({ SocialShareButtons: () => null }));

import CniPasseport, { CNI_PASSPORT_REQUEST_TYPES } from "@/pages/CniPasseport";
import { initialTourismServices } from "@/lib/tourismService";

beforeEach(() => {
  state.calls = [];
  state.outcome = "success";
  state.toast.mockClear();
});
afterEach(cleanup);

describe("page CNI & passeport", () => {
  it("explique les étapes, ne promet ni prix ni délai, et propose le formulaire", () => {
    const { container } = render(<CniPasseport />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(/CNI et passeport/);
    expect(screen.getAllByText(/relèvent de l’administration/).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Faire ma demande" })).toBeTruthy();
    // Aucun montant ni délai chiffré inventé.
    expect(container.textContent).not.toMatch(/\d\s?(FCFA|XAF|€|jours?|semaines?)/i);
    expect(container.querySelector("#demande")).not.toBeNull();
  });

  it("envoie la demande au formulaire de contact avec un objet et un message complets", async () => {
    const user = userEvent.setup();
    render(<CniPasseport />);
    await user.type(screen.getByLabelText("Nom complet"), "Aïcha Nkolo");
    await user.type(screen.getByLabelText("Adresse e-mail"), "aicha@example.com");
    await user.type(screen.getByLabelText("Téléphone / WhatsApp"), "+237698104832");
    await user.type(screen.getByLabelText("Ville"), "Douala");
    await user.selectOptions(screen.getByLabelText("Votre demande"), "Passeport — renouvellement");
    await user.type(screen.getByLabelText("Précisions (facultatif)"), "Mon passeport expire le mois prochain.");
    await user.click(screen.getByRole("button", { name: "Envoyer ma demande" }));

    expect(state.calls).toHaveLength(1);
    const sent = state.calls[0];
    expect(sent).toMatchObject({ name: "Aïcha Nkolo", email: "aicha@example.com", phone: "+237698104832", subject: "Demande CNI & passeport — Passeport — renouvellement" });
    expect(sent.message).toContain("Type de demande : Passeport — renouvellement");
    expect(sent.message).toContain("Ville : Douala");
    expect(sent.message).toContain("Mon passeport expire le mois prochain.");
    expect(sent.message.length).toBeGreaterThanOrEqual(10); // minimum exigé par le serveur
  });

  it("confirme l'envoi et propose WhatsApp ensuite", async () => {
    const user = userEvent.setup();
    render(<CniPasseport />);
    await user.type(screen.getByLabelText("Nom complet"), "Jean Dupont");
    await user.type(screen.getByLabelText("Adresse e-mail"), "jean@example.com");
    await user.click(screen.getByRole("button", { name: "Envoyer ma demande" }));
    expect((await screen.findByRole("status")).textContent).toContain("Votre demande a bien été envoyée");
    const link = screen.getByRole("link", { name: /WhatsApp/ }) as HTMLAnchorElement;
    expect(link.href).toContain("wa.me/237698104832");
    expect(link.rel).toContain("noopener");
  });

  it("affiche le message du serveur quand l'envoi est refusé (limite atteinte) et laisse le formulaire", async () => {
    state.outcome = "error";
    const user = userEvent.setup();
    render(<CniPasseport />);
    await user.type(screen.getByLabelText("Nom complet"), "Jean Dupont");
    await user.type(screen.getByLabelText("Adresse e-mail"), "jean@example.com");
    await user.click(screen.getByRole("button", { name: "Envoyer ma demande" }));
    await waitFor(() => expect(state.toast).toHaveBeenCalled());
    expect(state.toast.mock.calls[0][0]).toMatchObject({ title: "Envoi impossible", description: expect.stringContaining("Réessayez dans 12 minutes"), variant: "destructive" });
    expect(screen.getByRole("button", { name: "Envoyer ma demande" })).toBeTruthy();
    expect(screen.queryByText("Votre demande a bien été envoyée.")).toBeNull();
  });

  it("propose toutes les situations attendues (première demande, renouvellement, perte ou vol, autre)", () => {
    render(<CniPasseport />);
    const options = Array.from((screen.getByLabelText("Votre demande") as HTMLSelectElement).options).map((option) => option.value);
    expect(options).toEqual([...CNI_PASSPORT_REQUEST_TYPES]);
    for (const attendu of ["première demande", "renouvellement", "perte ou vol"]) expect(options.some((option) => option.includes(attendu)), attendu).toBe(true);
  });
});

describe("présélection du service sur /tourisme", () => {
  it("lit ?service=vehicle ou ?service=hotel et retombe sur l'hôtel sinon", () => {
    expect(initialTourismServices("?service=vehicle")).toEqual(["vehicle"]);
    expect(initialTourismServices("?service=hotel")).toEqual(["hotel"]);
    expect(initialTourismServices("")).toEqual(["hotel"]);
    expect(initialTourismServices("?service=pack")).toEqual(["hotel"]); // un pack se choisit sur la page
    expect(initialTourismServices("?service=<script>")).toEqual(["hotel"]);
    expect(initialTourismServices("?autre=vehicle")).toEqual(["hotel"]);
  });

  it("est utilisée par la page Tourisme", () => {
    const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/Tourism.tsx"), "utf8");
    expect(source).toContain("initialTourismServices(");
  });
});

describe("routes et limites de la nouvelle page", () => {
  const read = (path: string) => readFileSync(resolve(import.meta.dirname, path), "utf8");

  it("est déclarée côté client et côté serveur (sinon 404 en production)", () => {
    expect(read("../client/src/App.tsx")).toContain('<Route path={"/cni-passeport"} component={CniPasseport} />');
    expect(read("publicPrerender.ts")).toContain('"/cni-passeport":');
  });

  it("le formulaire de contact qu'elle utilise est protégé par la limite de débit, avant la base", () => {
    const source = read("routers/contact.ts");
    const start = source.indexOf("  sendContactEmail: publicProcedure");
    const body = source.slice(start, start + 500);
    expect(body).toContain("contactSubmissionGuard.assertAllowed(ctx?.req, input.email)");
    expect(body.indexOf("contactSubmissionGuard")).toBeLessThan(body.indexOf("await getDb()"));
  });
});
