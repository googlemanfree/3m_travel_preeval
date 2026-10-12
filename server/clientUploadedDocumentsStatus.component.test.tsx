// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ClientUploadedDocumentsStatus from "@/components/ClientUploadedDocumentsStatus";

(globalThis as any).React = React;
afterEach(cleanup);

describe("ClientUploadedDocumentsStatus", () => {
  it("affiche un statut explicite pour chaque document déposé", () => {
    render(<ClientUploadedDocumentsStatus documents={[
      { id: 1, fileName: "passeport.pdf", fileType: "passeport", status: "verified" },
      { id: 2, fileName: "diplome.pdf", fileType: "diplome", status: "uploaded" },
      { id: 3, fileName: "contrat.pdf", fileType: "autre", status: "rejected" },
    ]} />);
    const panel = screen.getByTestId("client-uploaded-documents-status");
    expect(panel.textContent).toContain("passeport.pdf");
    expect(panel.textContent).toContain("Validé");
    expect(panel.textContent).toContain("En vérification");
    expect(panel.textContent).toContain("À corriger");
  });

  it("ne rend rien lorsqu’aucun document n’est déposé", () => {
    const { container } = render(<ClientUploadedDocumentsStatus documents={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
