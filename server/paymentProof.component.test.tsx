// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({ authenticated: true, proofs: undefined as any, loading: false, rows: [] as any[] }));

vi.mock("@/hooks/useCandidateAuth", () => ({ getCandidateToken: () => "token-test", useCandidateAuth: () => ({ isAuthenticated: state.authenticated }) }));
vi.mock("@/lib/trpc", () => ({ trpc: { paymentProofs: { listForAdmin: { useQuery: () => ({ data: state.proofs, isLoading: state.loading }) } } } }));
vi.mock("./db", () => ({
  getDb: async () => ({
    select: () => ({ from: () => { const chain: any = { leftJoin: () => chain, where: () => chain, orderBy: () => chain, limit: async () => state.rows }; return chain; } }),
  }),
}));
vi.mock("./storage", () => ({ storageGetSignedUrl: async (key: string) => `https://signed.example/${key}` }));
vi.mock("./routers/adminAuth", () => ({ requireValidAdminSession: async () => ({ email: "agent@3mtravelagency.com" }) }));

import PaymentProofUpload from "@/components/PaymentProofUpload";
import AdminPaymentProofBadge from "@/components/AdminPaymentProofBadge";
import { categoryForRequirement } from "@/lib/candidateUpload";
import { PROOF_NAME_PREFIX, isProofFor, proofKey, proofLabel } from "@shared/paymentProof";
import { buildStoredDocumentName, inferCandidateFileType, sanitizeRequirementLabel } from "./routers/candidateUpload";
import { paymentProofsRouter } from "./routers/paymentProofs";

const read = (path: string) => readFileSync(resolve(import.meta.dirname, "..", path), "utf8").replace(/\r\n/g, "\n");
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  state.authenticated = true;
  state.proofs = undefined;
  state.loading = false;
  state.rows = [];
  fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({}) }));
  (globalThis as any).fetch = fetchMock;
});
afterEach(cleanup);

describe("nom de la preuve : le lien entre le fichier et la référence", () => {
  it("la clé partagée est exactement celle que le serveur applique à l'intitulé", () => {
    for (const reference of ["3M-2026-0012", "FB-2026-ABC123", "3M-AGN-0004", "Réf éàç 9"]) {
      expect(proofKey(reference)).toBe(sanitizeRequirementLabel(proofLabel(reference)));
      expect(buildStoredDocumentName(proofLabel(reference), "capture.jpg").startsWith(PROOF_NAME_PREFIX)).toBe(true);
    }
  });

  it("une preuve n'est reconnue que pour sa référence (pas de faux rapprochement sur un préfixe)", () => {
    const stored = buildStoredDocumentName(proofLabel("3M-2026-0012"), "capture.jpg");
    expect(isProofFor(stored, "3M-2026-0012")).toBe(true);
    expect(isProofFor(stored, "3M-2026-001")).toBe(false);
    expect(isProofFor(buildStoredDocumentName(proofLabel("3M-2026-00123"), "x.pdf"), "3M-2026-0012")).toBe(false);
    expect(isProofFor(null, "3M-2026-0012")).toBe(false);
    expect(isProofFor("passeport.pdf", "3M-2026-0012")).toBe(false);
  });

  it("catégorie « payment_proof » côté client et serveur, enregistrée comme justificatif de paiement", () => {
    expect(categoryForRequirement(proofLabel("3M-2026-0012"))).toBe("payment_proof");
    expect(read("server/routers/candidateUpload.ts")).toContain('payment_proof: "payment_proof"');
    expect(inferCandidateFileType("payment_proof", "capture.jpg")).toBe("justificatif_paiement");
    expect(inferCandidateFileType("passport", "p.pdf")).toBe("passeport");
  });

  it("l'arrivée d'une preuve alerte l'administration (cloche) sans jamais valider le paiement", () => {
    const upload = read("server/routers/candidateUpload.ts");
    const block = upload.slice(upload.indexOf('if (documentType === "payment_proof")'), upload.indexOf("await notifyDocumentSubmission({"));
    expect(block).toContain("notifyAdmins(");
    expect(block).toContain('title: "Preuve de paiement reçue"');
    expect(block).not.toMatch(/paymentStatus|initialPaymentStatus|SUCCESS|paid/);
  });
});

describe("envoyer la preuve depuis son espace", () => {
  it("connecté : le fichier part avec la catégorie et l'intitulé « Preuve de paiement <référence> »", async () => {
    render(<PaymentProofUpload reference="3M-2026-0012" />);
    expect(screen.getByTestId("payment-proof-upload").textContent).toContain("3M-2026-0012");
    expect(screen.getByTestId("payment-proof-upload").textContent).toContain("Le paiement n’est pris en compte qu’après cette confirmation");
    const file = new File([new Uint8Array(400)], "capture.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByTestId("quick-upload-file"), { target: { files: [file] } });
    await waitFor(() => expect(screen.getByTestId("requirement-quick-upload").getAttribute("data-state")).toBe("done"));
    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(body.get("fileType")).toBe("payment_proof");
    expect(body.get("requirementLabel")).toBe("Preuve de paiement 3M-2026-0012");
    expect(screen.getByRole("status").textContent).toContain("Preuve envoyée");
  });

  it("non connecté : lien de connexion et WhatsApp avec la référence, aucun envoi possible", () => {
    state.authenticated = false;
    render(<PaymentProofUpload reference="FB-2026-ABC123" />);
    expect(screen.queryByTestId("quick-upload-file")).toBeNull();
    expect((screen.getByText("Connectez-vous") as HTMLAnchorElement).getAttribute("href")).toBe("/login");
    const whatsapp = screen.getByTestId("proof-whatsapp") as HTMLAnchorElement;
    expect(whatsapp.href).toContain("https://wa.me/237698104832?text=");
    expect(decodeURIComponent(whatsapp.href)).toContain("FB-2026-ABC123");
  });

  it("sans référence : rien", () => {
    render(<PaymentProofUpload reference="" />);
    expect(screen.queryByTestId("payment-proof-upload")).toBeNull();
  });
});

describe("l'administration retrouve la preuve à côté du paiement", () => {
  const proof = (id: number, reference: string, overrides: Record<string, unknown> = {}) => ({ id, candidateId: 7, candidateEmail: "a@example.com", fullName: "Aïcha", fileName: buildStoredDocumentName(proofLabel(reference), "capture.jpg"), mimeType: "image/jpeg", uploadedAt: "2026-09-26T10:00:00.000Z", url: `https://signed.example/${id}`, ...overrides });

  it("affiche un lien par preuve de la bonne référence, jamais celles des autres dossiers", () => {
    state.proofs = { count: 3, items: [proof(1, "3M-2026-0012"), proof(2, "3M-2026-0013"), proof(3, "3M-2026-0012")] };
    render(<AdminPaymentProofBadge sessionToken="t" reference="3M-2026-0012" />);
    const links = screen.getAllByTestId("proof-link") as HTMLAnchorElement[];
    expect(links).toHaveLength(2);
    expect(links.map((link) => link.href)).toEqual(["https://signed.example/1", "https://signed.example/3"]);
    expect(links[0].rel).toContain("noopener");
    expect(links[0].textContent).toContain("Preuve reçue");
  });

  it("aucune preuve : le dit ; lien indisponible : le dit sans lien cassé ; chargement : rien", () => {
    state.proofs = { count: 0, items: [] };
    const first = render(<AdminPaymentProofBadge sessionToken="t" reference="3M-2026-0012" />);
    expect(screen.getByTestId("proof-none").textContent).toContain("Aucune preuve reçue");
    first.unmount();
    state.proofs = { count: 1, items: [proof(1, "3M-2026-0012", { url: null })] };
    const second = render(<AdminPaymentProofBadge sessionToken="t" reference="3M-2026-0012" />);
    expect(screen.queryByTestId("proof-link")).toBeNull();
    expect(screen.getByTestId("proof-list").textContent).toContain("lien indisponible");
    second.unmount();
    state.loading = true;
    const third = render(<AdminPaymentProofBadge sessionToken="t" reference="3M-2026-0012" />);
    expect(third.container.textContent).toBe("");
  });

  it("la liste admin renvoie les preuves avec un lien signé, exige une session admin, et est enregistrée", async () => {
    state.rows = [{ id: 1, candidateId: 7, fileName: "Preuve_de_paiement_3M_2026_0012--capture.jpg", fileKey: "candidates/7/payment_proof/x-capture.jpg", uploadedAt: new Date("2026-09-26T10:00:00Z"), mimeType: "image/jpeg", email: "a@example.com", fullName: "Aïcha Nkolo" }];
    const result = await paymentProofsRouter.createCaller({ req: { headers: {} } } as any).listForAdmin({ sessionToken: "t" });
    expect(result.count).toBe(1);
    expect(result.items[0]).toMatchObject({ candidateEmail: "a@example.com", url: "https://signed.example/candidates/7/payment_proof/x-capture.jpg" });
    const source = read("server/routers/paymentProofs.ts");
    expect(source.indexOf("requireValidAdminSession(input.sessionToken)")).toBeLessThan(source.indexOf("await getDb()"));
    expect(read("server/routers.ts")).toContain("paymentProofs: paymentProofsRouter");
  });
});

describe("branchement", () => {
  it("la preuve se propose sur la carte de dossier, les réservations à régler et la page /paiement ; le badge dans les deux tableaux admin", () => {
    expect(read("client/src/components/DossierPaymentCard.tsx")).toContain("<PaymentProofUpload reference={dossierNumber}");
    const flights = read("client/src/components/MyFlightRequestsCard.tsx");
    expect(flights).toContain("flightPaymentExpected(request.status) && <PaymentProofUpload reference={request.requestRef}");
    expect(read("client/src/pages/Paiement.tsx")).toContain("{reference && <PaymentProofUpload reference={reference}");
    expect(read("client/src/components/AdminPaymentManagement.tsx")).toContain("<AdminPaymentProofBadge sessionToken={sessionToken} reference={payment.dossierNumber}");
    expect(read("client/src/components/AdminReservationPayments.tsx")).toContain("<AdminPaymentProofBadge sessionToken={sessionToken} reference={p.requestRef}");
  });
});
