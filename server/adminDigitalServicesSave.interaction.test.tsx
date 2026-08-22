// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

if (!HTMLElement.prototype.hasPointerCapture) {
  Object.defineProperties(HTMLElement.prototype, {
    hasPointerCapture: { value: () => false },
    setPointerCapture: { value: () => undefined },
    releasePointerCapture: { value: () => undefined },
    scrollIntoView: { value: () => undefined },
  });
}

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ digitalServices: { adminList: { invalidate: mocks.invalidate } } }),
    digitalServices: {
      adminList: {
        useQuery: () => ({
          data: [{
            id: 97,
            reference: "DGT-TEST-97",
            service: "web_platform",
            fullName: "Test administratif",
            email: "test@example.com",
            phone: "+237600000000",
            organization: null,
            message: "Demande de test interne suffisamment détaillée.",
            status: "new",
            adminNotes: null,
            createdAt: new Date("2026-08-22T10:00:00.000Z"),
            handledByAdminEmail: null,
            handledAt: null,
          }],
          isLoading: false,
          error: null,
        }),
      },
      updateRequest: { useMutation: () => ({ mutate: mocks.mutate, isPending: false }) },
    },
  },
}));

vi.mock("@/components/AdminDigitalContentEditor", () => ({ default: () => <div data-testid="digital-content-editor" /> }));

import AdminDigitalServices from "@/pages/AdminDigitalServices";

afterEach(() => {
  cleanup();
  mocks.mutate.mockReset();
  mocks.invalidate.mockReset();
  sessionStorage.clear();
});

describe("AdminDigitalServices — enregistrement groupé", () => {
  it("envoie le statut choisi et la note interne dans une seule mutation", async () => {
    sessionStorage.setItem("adminSessionToken", "session-test-3m");
    const user = userEvent.setup();
    render(<AdminDigitalServices />);

    await user.click(screen.getByRole("combobox", { name: "Statut de la demande 3M Digital" }));
    await user.click(await screen.findByRole("option", { name: "Contacté" }));
    await user.type(screen.getByLabelText("Notes internes"), "Test interne validé");
    await user.click(screen.getByRole("button", { name: /Enregistrer le traitement/i }));

    await waitFor(() => {
      expect(mocks.mutate).toHaveBeenCalledWith({
        sessionToken: "session-test-3m",
        requestId: 97,
        status: "contacted",
        adminNotes: "Test interne validé",
      });
    });
  });
});
