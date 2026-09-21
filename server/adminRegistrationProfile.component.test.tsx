// @vitest-environment jsdom
import React from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import AdminRegistrationProfile from "@/components/AdminRegistrationProfile";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

afterEach(cleanup);

describe("AdminRegistrationProfile — ce que l'équipe voit du projet déclaré", () => {
  const profile = {
    preferredDestinations: ["France", "Sénégal"],
    visaType: "Études",
    educationLevel: "Master",
    employmentStatus: null,
    languageLevel: "DELF B2",
    nationality: "Camerounaise",
  };

  it("affiche les pays précis avec leur drapeau, le pays principal et l'absence de guide", () => {
    const { container } = render(<AdminRegistrationProfile profile={profile} />);

    const list = within(screen.getByRole("list", { name: "Destinations déclarées" }));
    const items = list.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain("France");
    expect(items[0].textContent).toContain("Principale");
    expect(items[0].textContent).not.toContain("sans guide");
    expect(items[1].textContent).toContain("Sénégal");
    expect(items[1].textContent).toContain("sans guide");
    expect(screen.getByText("Destinations (la première est la principale)")).toBeTruthy();
    expect(container.querySelectorAll("img").length).toBe(2);
  });

  it("affiche le projet, les études, la langue et la nationalité, et signale ce qui manque", () => {
    render(<AdminRegistrationProfile profile={profile} />);

    expect(screen.getByText("Type de projet").nextElementSibling?.textContent).toBe("Études");
    expect(screen.getByText("Niveau d’études").nextElementSibling?.textContent).toBe("Master");
    expect(screen.getByText("Niveau de langue").nextElementSibling?.textContent).toBe("DELF B2");
    expect(screen.getByText("Nationalité").nextElementSibling?.textContent).toBe("Camerounaise");
    expect(screen.getByText("Situation professionnelle").nextElementSibling?.textContent).toBe("Non renseigné");
  });

  it("le dit clairement quand aucune destination précise n'a été déclarée (ancien compte)", () => {
    render(<AdminRegistrationProfile profile={{ preferredDestinations: [] }} />);
    expect(screen.getByText("Aucune destination précise déclarée.")).toBeTruthy();
  });

  it("n'affiche rien pour un dossier sans profil d'inscription", () => {
    const { container } = render(<AdminRegistrationProfile profile={null} />);
    expect(container.innerHTML).toBe("");
  });
});

describe("synchronisation inscription → back-office (câblage)", () => {
  it("la liste et la fiche des comptes montrent le pays précis et le projet déclaré, pas « À qualifier » en dur", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("destinationCountry: destinationLabelForStaff(candidate)");
    expect(admin).toContain("destinationCountry: destinationLabelForStaff(account)");
    expect(admin).toContain("projectType: candidate.visaType || \"À qualifier\"");
    expect(admin).toContain("projectType: account.visaType || \"À qualifier\"");
    expect(admin).toContain("preferredDestinations: candidates.preferredDestinations");
    expect(admin).toContain("registrationProfile: {");
    for (const field of ["preferredDestinations", "visaType", "educationLevel", "employmentStatus", "languageLevel", "nationality"]) {
      expect(admin).toMatch(new RegExp(`${field}: (account\\.${field}|parsePreferredDestinations\\(account\\.preferredDestinations\\))`));
    }
  });

  it("la fiche candidat de l'admin affiche le bloc du projet déclaré", () => {
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).toContain("<AdminRegistrationProfile profile={(candidate as any).registrationProfile} />");
  });
});
