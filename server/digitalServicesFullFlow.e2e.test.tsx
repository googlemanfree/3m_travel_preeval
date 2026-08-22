// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

if (!HTMLElement.prototype.hasPointerCapture) {
  Object.defineProperties(HTMLElement.prototype, {
    hasPointerCapture: { value: () => false },
    setPointerCapture: { value: () => undefined },
    releasePointerCapture: { value: () => undefined },
    scrollIntoView: { value: () => undefined },
  });
}

const state = vi.hoisted(() => ({
  requests: [] as Array<any>,
  nextId: 701,
  invalidate: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ digitalServices: { adminList: { invalidate: state.invalidate } } }),
    digitalServices: {
      getContent: { useQuery: () => ({ data: null }) },
      createRequest: {
        useMutation: (options: any) => ({
          isPending: false,
          mutate: (payload: any) => {
            const request = {
              id: state.nextId++, reference: "DGT-TEST-701", ...payload,
              organization: payload.organization ?? null, status: "new", adminNotes: null,
              handledByAdminEmail: null, handledAt: null, createdAt: new Date(), updatedAt: new Date(),
            };
            state.requests.push(request);
            options?.onSuccess?.({ reference: request.reference });
          },
        }),
      },
      adminList: { useQuery: () => ({ data: state.requests, isLoading: false, error: null }) },
      updateRequest: {
        useMutation: (options: any) => ({
          isPending: false,
          mutate: (payload: any) => {
            const request = state.requests.find((item) => item.id === payload.requestId);
            Object.assign(request, {
              status: payload.status,
              adminNotes: payload.adminNotes ?? null,
              handledByAdminEmail: "admin@3mtravelagency.com",
              handledAt: new Date(),
            });
            options?.onSuccess?.({ success: true });
          },
        }),
      },
    },
  },
}));

vi.mock("@/components/Footer", () => ({ default: () => <footer>Footer 3M</footer> }));
vi.mock("@/components/AdminDigitalContentEditor", () => ({ default: () => <div>Éditeur 3M Digital</div> }));
vi.mock("wouter", () => ({ Link: ({ children, href }: any) => <a href={href}>{children}</a> }));

import Community from "@/pages/Community";
import AdminDigitalServices from "@/pages/AdminDigitalServices";

afterEach(() => {
  cleanup();
  state.requests.length = 0;
  state.nextId = 701;
  state.invalidate.mockReset();
  sessionStorage.clear();
});

describe("3M Digital — flux UI complet", () => {
  it("crée une demande publique, la retrouve dans la file et enregistre statut et note", async () => {
    const user = userEvent.setup();
    render(<Community />);

    await user.type(screen.getByLabelText("Nom complet"), "Client test 3M");
    await user.type(screen.getByLabelText("Téléphone"), "+237690000000");
    await user.type(screen.getByLabelText("E-mail"), "client.test@example.com");
    await user.type(screen.getByLabelText("Votre besoin"), "Nous souhaitons cadrer une plateforme digitale et son accompagnement.");
    await user.click(screen.getByRole("button", { name: /Transmettre ma demande/i }));

    expect(state.requests).toHaveLength(1);
    expect(state.requests[0]).toMatchObject({ fullName: "Client test 3M", status: "new" });

    cleanup();
    sessionStorage.setItem("adminSessionToken", "session-e2e-3m");
    render(<AdminDigitalServices />);

    expect(screen.getAllByText("DGT-TEST-701")).toHaveLength(2);
    await user.click(screen.getByRole("combobox", { name: "Statut de la demande 3M Digital" }));
    await user.click(await screen.findByRole("option", { name: "Contacté" }));
    await user.type(screen.getByLabelText("Notes internes"), "Qualification 3M Digital validée.");
    await user.click(screen.getByRole("button", { name: /Enregistrer le traitement/i }));

    await waitFor(() => {
      expect(state.requests[0]).toMatchObject({
        status: "contacted",
        adminNotes: "Qualification 3M Digital validée.",
        handledByAdminEmail: "admin@3mtravelagency.com",
      });
      expect(state.requests[0].handledAt).toBeInstanceOf(Date);
    });
  });
});
