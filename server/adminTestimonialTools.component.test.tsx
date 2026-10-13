// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

type Handlers = { onSuccess?: (result: any) => unknown; onError?: (error: any) => unknown };

const { state } = vi.hoisted(() => ({
  state: {
    created: [] as any[],
    updated: [] as any[],
    withdrawn: [] as any[],
    toast: { success: vi.fn(), error: vi.fn() },
  },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    customerReview: {
      createByAdmin: { useMutation: (handlers: Handlers) => ({ isPending: false, mutate: (variables: any) => { state.created.push(variables); handlers.onSuccess?.({ success: true, published: variables.publishNow, message: variables.publishNow ? "Témoignage publié." : "Avis enregistré en attente de validation." }); } }) },
      updateByAdmin: { useMutation: (handlers: Handlers) => ({ isPending: false, mutate: (variables: any) => { state.updated.push(variables); handlers.onSuccess?.({ success: true, changed: true }); } }) },
      withdrawReview: { useMutation: (handlers: Handlers) => ({ isPending: false, mutate: (variables: any) => { state.withdrawn.push(variables); handlers.onSuccess?.({ success: true }); } }) },
    },
  },
}));
vi.mock("sonner", () => ({ toast: state.toast }));

import { ReviewRowTools, TestimonialComposer, publicDisplayName } from "@/components/AdminTestimonialTools";

const open = () => fireEvent.click(screen.getByRole("button", { name: /Ajouter un témoignage/ }));
const field = (label: RegExp) => screen.getByLabelText(label) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function fillValid() {
  fireEvent.change(field(/Nom du client/), { target: { value: "Aïcha Nkolo" } });
  fireEvent.change(field(/Pays de destination/), { target: { value: "Canada" } });
  fireEvent.change(field(/Service concerné/), { target: { value: "Visa études" } });
  fireEvent.change(field(/Témoignage \(tel que donné/), { target: { value: "Un accompagnement clair du début à la fin, merci." } });
  fireEvent.change(field(/Élément conservé qui le prouve/), { target: { value: "Capture WhatsApp enregistrée dans le dossier" } });
  fireEvent.click(field(/Le client a donné son accord/));
  fireEvent.click(field(/J’atteste que ce témoignage/));
}

beforeEach(() => {
  state.created.length = 0;
  state.updated.length = 0;
  state.withdrawn.length = 0;
  state.toast.success.mockClear();
  state.toast.error.mockClear();
});
afterEach(() => cleanup());

describe("outil admin : saisie d'un témoignage client", () => {
  it("le formulaire est fermé par défaut ; une fois ouvert, aucune action n'est possible sans preuve ni confirmations", () => {
    render(<TestimonialComposer sessionToken="tok" onSaved={vi.fn()} />);
    expect(screen.queryByTestId("testimonial-publish-now")).toBeNull();
    open();
    expect((screen.getByTestId("testimonial-publish-now") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByTestId("testimonial-save-pending") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(field(/Nom du client/), { target: { value: "Aïcha Nkolo" } });
    fireEvent.change(field(/Témoignage \(tel que donné/), { target: { value: "Un accompagnement clair du début à la fin, merci." } });
    expect((screen.getByTestId("testimonial-publish-now") as HTMLButtonElement).disabled).toBe(true); // preuve et cases manquantes
    fireEvent.change(field(/Élément conservé qui le prouve/), { target: { value: "Capture WhatsApp enregistrée dans le dossier" } });
    fireEvent.click(field(/Le client a donné son accord/));
    expect((screen.getByTestId("testimonial-publish-now") as HTMLButtonElement).disabled).toBe(true); // attestation manquante
    fireEvent.click(field(/J’atteste que ce témoignage/));
    expect((screen.getByTestId("testimonial-publish-now") as HTMLButtonElement).disabled).toBe(false);
  });

  it("l'aperçu montre le nom tel que le public le verra et suit le choix du nom affiché", () => {
    render(<TestimonialComposer sessionToken="tok" onSaved={vi.fn()} />);
    open();
    fillValid();
    const preview = screen.getByTestId("testimonial-preview");
    expect(preview.textContent).toContain("Aïcha · Canada · Visa études");
    expect(preview.textContent).not.toContain("Nkolo");
    fireEvent.change(field(/Nom affiché au public/), { target: { value: "initials" } });
    expect(screen.getByTestId("testimonial-preview").textContent).toContain("A. N.");
    fireEvent.change(field(/Nom affiché au public/), { target: { value: "full_name" } });
    expect(screen.getByTestId("testimonial-preview").textContent).toContain("Aïcha Nkolo");
    expect(publicDisplayName("", "first_name_only")).toBe("Nom du client");
  });

  it("« Publier maintenant » envoie la preuve, l'attestation et publishNow=true ; le formulaire se referme et la liste est rechargée", () => {
    const onSaved = vi.fn();
    render(<TestimonialComposer sessionToken="tok" onSaved={onSaved} />);
    open();
    fillValid();
    fireEvent.click(screen.getByTestId("testimonial-publish-now"));
    expect(state.created).toHaveLength(1);
    expect(state.created[0]).toMatchObject({
      sessionToken: "tok",
      fullName: "Aïcha Nkolo",
      destinationCountry: "Canada",
      serviceType: "Visa études",
      rating: 5,
      consentToPublish: true,
      attestation: true,
      consentChannel: "whatsapp",
      consentProof: "Capture WhatsApp enregistrée dans le dossier",
      publishNow: true,
      displayNameChoice: "first_name_only",
    });
    expect(state.created[0].consentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(state.toast.success).toHaveBeenCalledWith("Témoignage publié.");
    expect(onSaved).toHaveBeenCalled();
    expect(screen.queryByTestId("testimonial-publish-now")).toBeNull();
  });

  it("« Enregistrer pour validation » n'active pas la publication immédiate", () => {
    render(<TestimonialComposer sessionToken="tok" onSaved={vi.fn()} />);
    open();
    fillValid();
    fireEvent.click(screen.getByTestId("testimonial-save-pending"));
    expect(state.created[0].publishNow).toBe(false);
    expect(state.toast.success).toHaveBeenCalledWith("Avis enregistré en attente de validation.");
  });
});

describe("outil admin : corriger ou retirer un témoignage", () => {
  const review = { id: 7, status: "approved", reviewText: "Texte d’origine du client.", destinationCountry: "Canada", serviceType: "Visa études", displayNameChoice: "first_name_only" as const };

  it("correction : le motif est obligatoire avant d'enregistrer", () => {
    const onChanged = vi.fn();
    render(<ReviewRowTools sessionToken="tok" review={review} onChanged={onChanged} />);
    fireEvent.click(screen.getByTestId("review-edit-7"));
    fireEvent.change(field(/^Témoignage/), { target: { value: "Texte d’origine du client (faute corrigée)." } });
    const save = screen.getByTestId("review-edit-save-7") as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    fireEvent.change(field(/Motif de la correction/), { target: { value: "faute d’orthographe corrigée" } });
    expect(save.disabled).toBe(false);
    fireEvent.click(save);
    expect(state.updated[0]).toMatchObject({ sessionToken: "tok", reviewId: 7, reviewText: "Texte d’origine du client (faute corrigée).", reason: "faute d’orthographe corrigée" });
    expect(onChanged).toHaveBeenCalled();
  });

  it("retrait : proposé seulement pour un avis publié, motif obligatoire, puis confirmation", () => {
    const { unmount } = render(<ReviewRowTools sessionToken="tok" review={{ ...review, status: "pending_review" }} onChanged={vi.fn()} />);
    expect(screen.queryByTestId("review-withdraw-7")).toBeNull();
    unmount();
    const onChanged = vi.fn();
    render(<ReviewRowTools sessionToken="tok" review={review} onChanged={onChanged} />);
    fireEvent.click(screen.getByTestId("review-withdraw-7"));
    const confirm = screen.getByTestId("review-withdraw-confirm-7") as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    fireEvent.change(field(/Motif du retrait/), { target: { value: "le client a retiré son accord" } });
    fireEvent.click(confirm);
    expect(state.withdrawn).toEqual([{ sessionToken: "tok", reviewId: 7, reason: "le client a retiré son accord" }]);
    expect(state.toast.success).toHaveBeenCalledWith("Témoignage retiré de la publication.");
    expect(onChanged).toHaveBeenCalled();
  });
});
