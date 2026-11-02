// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

(globalThis as any).React = React;

const state = vi.hoisted(() => ({ submit: vi.fn() }));

vi.mock("framer-motion", () => {
  const strip = ({ layout, initial, animate, exit, transition, whileHover, whileTap, ...rest }: Record<string, unknown>) => rest;
  const motion = new Proxy({}, { get: (_target, tag: string) => React.forwardRef((props: Record<string, unknown>, ref) => React.createElement(tag, { ...strip(props), ref })) });
  return { motion, AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>, useReducedMotion: () => true };
});
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } }));
vi.mock("react-easy-crop", () => ({ default: () => null }));
vi.mock("@/components/PremiumCoverImage", () => ({ PremiumCoverImage: () => null }));
vi.mock("@/lib/pageSeo", () => ({ setPageSeo: () => undefined }));
vi.mock("@/hooks/useCandidateAuth", () => ({ useCandidateAuth: () => ({ candidate: { fullName: "Awa Test", email: "awa@example.com", preferredDestinations: [] } }) }));
vi.mock("@/components/DestinationAutocomplete", () => ({
  DestinationAutocomplete: ({ id, value, onSelect }: { id?: string; value: string; onSelect: (country: string) => void }) => (
    <div>
      <input id={id} readOnly value={value} aria-label="Destination choisie" />
      {["Allemagne", "Canada", "France"].map((country) => <button key={country} type="button" onClick={() => onSelect(country)}>Choisir {country}</button>)}
    </div>
  ),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    evaluation: {
      submit: { useMutation: () => ({ mutate: state.submit, isPending: false, data: undefined, error: null }) },
      extractFromCV: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      inspectPdfPages: { useMutation: () => ({ mutateAsync: vi.fn() }) },
    },
  },
}));

import Evaluation from "@/pages/Evaluation";

const radio = (name: RegExp) => screen.getByRole("radio", { name });
const pick = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const sectionTitles = () => Array.from(document.querySelectorAll("[data-section] h2")).map((node) => node.textContent ?? "");

beforeEach(() => {
  state.submit.mockReset();
  try { localStorage.clear(); } catch { /* ignore */ }
});
afterEach(() => cleanup());

describe("évaluation — le formulaire se recompose à chaque choix", () => {
  it("Allemagne + formation professionnelle + soins infirmiers : des questions de formation, de santé et de langue allemande", () => {
    render(<Evaluation />);
    fireEvent.click(screen.getByRole("button", { name: "Choisir Allemagne" }));
    fireEvent.click(radio(/Étudier ou se former/));
    fireEvent.click(radio(/Formation professionnelle ou apprentissage/));
    expect(sectionTitles()).toContain("Formation initiale");
    expect(screen.getByLabelText(/Contrat ou promesse de formation/)).toBeTruthy();
    expect(screen.queryByLabelText(/Programme ou filière recherchée/)).toBeNull();
    expect(screen.queryByLabelText(/Formation en santé visée/)).toBeNull();

    fireEvent.change(screen.getByLabelText(/Dans quel domaine/), { target: { value: "sante" } });
    expect(sectionTitles()).toContain("Votre domaine : Santé et soins");
    expect(screen.getByLabelText(/Formation en santé visée/)).toBeTruthy();
    expect(screen.getByLabelText(/Niveau en allemand/)).toBeTruthy();
    const industry = screen.queryByLabelText(/Secteur d’activité/) as HTMLInputElement | null;
    expect(industry === null || industry.value === "Santé et soins").toBe(true);
    expect(screen.getByTestId("dynamic-summary").textContent).toMatch(/Allemagne/);
    expect(screen.getByTestId("dynamic-summary").textContent).toMatch(/Formation professionnelle ou apprentissage/);
    expect(screen.getByTestId("dynamic-announcement").textContent).toMatch(/Formulaire adapté à votre choix/);
  });

  it("changer de type de projet retire les sections qui ne s'appliquent plus", () => {
    render(<Evaluation />);
    fireEvent.click(screen.getByRole("button", { name: "Choisir Allemagne" }));
    fireEvent.click(radio(/Étudier ou se former/));
    fireEvent.click(radio(/Formation professionnelle ou apprentissage/));
    fireEvent.change(screen.getByLabelText(/Dans quel domaine/), { target: { value: "sante" } });
    expect(sectionTitles().length).toBeGreaterThanOrEqual(5);

    fireEvent.click(radio(/Séjour temporaire/));
    fireEvent.click(radio(/Visite familiale ou amicale/));
    const titles = sectionTitles();
    expect(titles).not.toContain("Formation initiale");
    expect(titles.some((title) => title.startsWith("Votre domaine"))).toBe(false);
    expect(titles.some((title) => title.startsWith("Langues"))).toBe(false);
    expect(screen.getByLabelText(/Lien avec la personne que vous visitez/)).toBeTruthy();
    expect(screen.queryByLabelText(/Dans quel domaine/)).toBeNull();
  });

  it("le même programme change de questions quand le pays change", () => {
    render(<Evaluation />);
    fireEvent.click(radio(/Étudier ou se former/));
    fireEvent.click(radio(/Visa étudiant long séjour/));
    fireEvent.click(screen.getByRole("button", { name: "Choisir Canada" }));
    expect(screen.getByLabelText(/Établissement ou DLI visé/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Choisir Allemagne" }));
    expect(screen.queryByLabelText(/Établissement ou DLI visé/)).toBeNull();
    expect(screen.getByLabelText(/Niveau en allemand/)).toBeTruthy();
  });

  it("une question de suivi apparaît seulement après la réponse qui la déclenche", () => {
    render(<Evaluation />);
    fireEvent.click(screen.getByRole("button", { name: "Choisir Canada" }));
    fireEvent.click(radio(/Travailler/));
    fireEvent.click(radio(/Permis de travail lié à un employeur/));
    expect(screen.queryByLabelText(/Employeur, poste et date de l’offre/)).toBeNull();
    pick(/Offre ou contrat de travail/, "signee");
    expect(screen.getByLabelText(/Employeur, poste et date de l’offre/)).toBeTruthy();
    pick(/Offre ou contrat de travail/, "aucune");
    expect(screen.queryByLabelText(/Employeur, poste et date de l’offre/)).toBeNull();
  });

  it("n'exige le CV que pour les programmes de travail qualifié", () => {
    render(<Evaluation />);
    fireEvent.click(radio(/Travailler/));
    fireEvent.click(radio(/Permis de travail lié à un employeur/));
    expect(screen.getByText(/CV \(obligatoire/)).toBeTruthy();
    fireEvent.click(radio(/Stage, alternance ou formation en entreprise/));
    expect(screen.getByText(/CV \(facultatif/)).toBeTruthy();
    expect(document.body.textContent).toMatch(/aide votre conseiller à préparer le dossier/);
  });

  it("affiche les pièces à préparer propres au programme et au domaine", () => {
    render(<Evaluation />);
    fireEvent.click(radio(/Travailler/));
    fireEvent.click(radio(/Stage, alternance ou formation en entreprise/));
    fireEvent.change(screen.getByLabelText(/Dans quel domaine/), { target: { value: "sante" } });
    const documents = screen.getByTestId("dynamic-documents").textContent ?? "";
    expect(documents).toMatch(/Contrat ou promesse de formation/);
    expect(documents).toMatch(/Diplôme de santé/);
    expect(documents).toMatch(/confirmée par un conseiller/);
  });

  it("exige un visa ou programme, puis les champs obligatoires propres à ce programme avant l'envoi", () => {
    render(<Evaluation />);
    fireEvent.change(screen.getByLabelText(/Téléphone/), { target: { value: "+237600000000" } });
    fireEvent.click(screen.getByRole("button", { name: "Choisir Allemagne" }));
    fireEvent.click(radio(/Étudier ou se former/));
    fireEvent.click(screen.getByRole("button", { name: "Envoyer mon évaluation" }));
    expect(document.body.textContent).toMatch(/choisir le visa ou programme/);
    expect(state.submit).not.toHaveBeenCalled();

    fireEvent.click(radio(/Formation professionnelle ou apprentissage/));
    fireEvent.click(screen.getByRole("button", { name: "Envoyer mon évaluation" }));
    expect(document.body.textContent).toMatch(/Type de formation/);
    expect(state.submit).not.toHaveBeenCalled();
  });

  it("envoie les réponses de colonnes, les détails du projet, le visa déduit et les métadonnées du formulaire", () => {
    render(<Evaluation />);
    fireEvent.change(screen.getByLabelText(/Téléphone/), { target: { value: "+237600000000" } });
    fireEvent.click(screen.getByRole("button", { name: "Choisir Allemagne" }));
    fireEvent.click(radio(/Étudier ou se former/));
    fireEvent.click(radio(/Formation professionnelle ou apprentissage/));
    fireEvent.change(screen.getByLabelText(/Dans quel domaine/), { target: { value: "sante" } });
    pick(/Dernier niveau d’études atteint/, "avant_bac");
    pick(/Niveau en allemand/, "a1_a2");
    pick(/Type de formation/, "apprentissage");
    fireEvent.change(screen.getByLabelText(/Métier ou formation visés/), { target: { value: "Soins infirmiers" } });
    pick(/Contrat ou promesse de formation d’un employeur/, "en_discussion");
    pick(/Formation en santé visée/, "soins_infirmiers");
    fireEvent.click(screen.getByRole("button", { name: "Envoyer mon évaluation" }));

    expect(state.submit).toHaveBeenCalledTimes(1);
    const payload = state.submit.mock.calls[0][0];
    expect(payload).toMatchObject({ projectType: "etudes", destinationCountry: "Allemagne", destinationCategory: "schengen", visaType: "schengen_etude", educationLevel: "avant_bac", industrySector: "Santé et soins" });
    expect(payload.projectDetails).toMatchObject({ programId: "etudes-professionnelle", programFamily: "study_vocational", domainId: "sante", trainingKind: "apprentissage", healthTrainingTrack: "soins_infirmiers", lang_de: "a1_a2", formSchemaVersion: "dynamic-form-v1" });
    expect(payload.projectDetails.offerStatus).toBeUndefined();
  });

  it("les réponses d'un programme abandonné ne sont pas envoyées", () => {
    render(<Evaluation />);
    fireEvent.change(screen.getByLabelText(/Téléphone/), { target: { value: "+237600000000" } });
    fireEvent.click(screen.getByRole("button", { name: "Choisir France" }));
    fireEvent.click(radio(/Séjour temporaire/));
    fireEvent.click(radio(/Court séjour touristique/));
    pick(/Votre statut/, "particulier");
    fireEvent.change(screen.getByLabelText(/Date de départ envisagée/), { target: { value: "2027-03-01" } });
    fireEvent.change(screen.getByLabelText(/Durée envisagée/), { target: { value: "14 jours" } });
    pick(/Hébergement prévu/, "hotel");
    // le candidat change d'avis : programme famille, puis revient au tourisme sans avoir rempli la famille
    fireEvent.click(radio(/Visite familiale ou amicale/));
    fireEvent.click(radio(/Court séjour touristique/));
    fireEvent.click(screen.getByRole("button", { name: "Envoyer mon évaluation" }));
    expect(state.submit).toHaveBeenCalledTimes(1);
    const details = state.submit.mock.calls[0][0].projectDetails;
    expect(details.programId).toBe("tourisme-tourisme");
    expect(details.hostRelation).toBeUndefined();
    expect(details.visitorStatus).toBe("particulier");
    expect(state.submit.mock.calls[0][0].visaType).toBe("schengen_tourisme");
  });

  it("changer de projet puis revenir rétablit les réponses déjà saisies", () => {
    render(<Evaluation />);
    fireEvent.click(screen.getByRole("button", { name: "Choisir Canada" }));
    fireEvent.click(radio(/Travailler/));
    fireEvent.click(radio(/Permis de travail lié à un employeur/));
    pick(/Offre ou contrat de travail/, "signee");
    fireEvent.change(screen.getByLabelText(/Employeur, poste et date de l’offre/), { target: { value: "Acme Soudure" } });
    fireEvent.click(radio(/Séjour temporaire/));
    expect(screen.queryByLabelText(/Employeur, poste et date de l’offre/)).toBeNull();
    fireEvent.click(radio(/Travailler/));
    fireEvent.click(radio(/Permis de travail lié à un employeur/));
    expect((screen.getByLabelText(/Offre ou contrat de travail/) as HTMLSelectElement).value).toBe("signee");
    expect((screen.getByLabelText(/Employeur, poste et date de l’offre/) as HTMLInputElement).value).toBe("Acme Soudure");
  });

  it("une validation refusée annonce l’erreur, marque le champ et y place le focus", async () => {
    render(<Evaluation />);
    fireEvent.click(screen.getByRole("button", { name: "Choisir Allemagne" }));
    fireEvent.click(radio(/Étudier ou se former/));
    fireEvent.change(screen.getByLabelText(/Téléphone/), { target: { value: "+237600000000" } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer mon évaluation" }));
    expect(screen.getByRole("alert").textContent).toMatch(/choisir le visa ou programme/);
    await waitFor(() => expect(document.activeElement?.id).toBe("dyn-program"));

    fireEvent.click(radio(/Formation professionnelle ou apprentissage/));
    fireEvent.click(screen.getByRole("button", { name: "Envoyer mon évaluation" }));
    await waitFor(() => expect(document.activeElement?.id).toBe("dyn-trainingKind"));
    expect(screen.getByLabelText(/Type de formation/).getAttribute("aria-invalid")).toBe("true");

    fireEvent.change(screen.getByLabelText(/Nom complet/), { target: { value: "A" } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer mon évaluation" }));
    await waitFor(() => expect(document.activeElement?.id).toBe("evaluation-full-name"));
    expect(screen.getByLabelText(/Nom complet/).getAttribute("aria-invalid")).toBe("true");
  });

  it("le domaine choisi revient quand le candidat revient à un programme qui en dépend", () => {
    render(<Evaluation />);
    fireEvent.click(screen.getByRole("button", { name: "Choisir Allemagne" }));
    fireEvent.click(radio(/Étudier ou se former/));
    fireEvent.click(radio(/Formation professionnelle ou apprentissage/));
    fireEvent.change(screen.getByLabelText(/Dans quel domaine/), { target: { value: "sante" } });
    fireEvent.click(radio(/Séjour temporaire/));
    fireEvent.click(radio(/Visite familiale ou amicale/));
    expect(sectionTitles().some((title) => title.startsWith("Votre domaine"))).toBe(false);
    fireEvent.click(radio(/Étudier ou se former/));
    fireEvent.click(radio(/Formation professionnelle ou apprentissage/));
    expect(sectionTitles()).toContain("Votre domaine : Santé et soins");
    expect((screen.getByLabelText(/Dans quel domaine/) as HTMLSelectElement).value).toBe("sante");
  });

  it("la progression a une étape par bloc affiché", () => {
    render(<Evaluation />);
    fireEvent.click(screen.getByRole("button", { name: "Choisir Allemagne" }));
    fireEvent.click(radio(/Étudier ou se former/));
    fireEvent.click(radio(/Formation professionnelle ou apprentissage/));
    const withTraining = within(screen.getByTestId("progress-steps")).getAllByText(/./).length;
    fireEvent.click(radio(/Séjour temporaire/));
    fireEvent.click(radio(/Court séjour touristique/));
    const withVisit = within(screen.getByTestId("progress-steps")).getAllByText(/./).length;
    expect(withTraining).toBeGreaterThan(withVisit);
  });
});
