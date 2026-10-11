// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

(globalThis as any).React = React;

const remindMutate = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      adminCandidateManagement: {
        getPaymentReceiptA5Html: { fetch: vi.fn() },
      },
    }),
    adminCandidateManagement: {
      contractsReceiptsDesk: {
        useQuery: () => ({
          data: {
            counts: { awaitingProtocol: 1, receiptPending: 0, protocolPending: 1, complete: 0 },
            pipeline: [
              {
                candidateId: "online_42",
                dossierNumber: "3M-2026-0042",
                workingReference: "3M-2026-0042",
                formerAccountReference: null,
                fullName: "Nadia Mbarga",
                email: "nadia@example.com",
                paymentConfirmed: true,
                receiptAvailable: true,
                protocolSigned: false,
                stage: "protocol_pending",
              },
              {
                candidateId: "agency_7",
                dossierNumber: "3M-AGN-0007",
                workingReference: "3M-AGN-0007",
                formerAccountReference: null,
                fullName: "Walk-in Agence",
                email: "walkin@example.com",
                paymentConfirmed: true,
                receiptAvailable: true,
                protocolSigned: false,
                stage: "protocol_pending",
              },
            ],
            recentAudit: [],
          },
          isLoading: false,
          isError: false,
          isFetching: false,
          refetch: vi.fn(),
        }),
      },
      approvePaymentReceipt: { useMutation: () => ({ mutate: vi.fn(), isPending: false, variables: undefined }) },
      sendPaymentReceiptForCandidate: { useMutation: () => ({ mutate: vi.fn(), isPending: false, variables: undefined }) },
      resendClientAccessLink: { useMutation: () => ({ mutate: vi.fn(), isPending: false, variables: undefined }) },
      resendAgreementSignatureReminder: {
        useMutation: () => ({ mutate: remindMutate, isPending: false, variables: undefined }),
      },
    },
  },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import AdminContractsReceiptsDesk from "@/components/AdminContractsReceiptsDesk";

describe("AdminContractsReceiptsDesk — relance protocole", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("affiche Relancer pour online et agency en protocol_pending", async () => {
    const user = userEvent.setup();
    render(<AdminContractsReceiptsDesk sessionToken="session-admin" />);

    expect(screen.getByTestId("protocol-remind-online_42")).toBeTruthy();
    expect(screen.getByTestId("protocol-remind-agency_7")).toBeTruthy();

    await user.click(screen.getByTestId("protocol-remind-online_42"));
    expect(remindMutate).toHaveBeenCalledWith({
      sessionToken: "session-admin",
      candidateId: "online_42",
    });

    await user.click(screen.getByTestId("protocol-remind-agency_7"));
    expect(remindMutate).toHaveBeenCalledWith({
      sessionToken: "session-admin",
      candidateId: "agency_7",
    });
  });
});
