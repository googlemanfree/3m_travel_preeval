// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";

(globalThis as any).React = React;

import FswGridCalculator from "@/components/FswGridCalculator";

const choose = (id: string, value: string) => fireEvent.change(document.getElementById(id) as HTMLSelectElement, { target: { value } });
const calculate = () => fireEvent.click(screen.getByTestId("fsw-calculate"));

function fill(overrides: Record<string, string> = {}) {
  const values: Record<string, string> = { "fsw-q1": "18", "fsw-q2": "bachelor_or_three_year", "fsw-q5": "3", "fsw-q6": "no", "fsw-q7": "no", "fsw-q8": "no", "fsw-q9": "no", "fsw-q10": "no", ...overrides };
  choose("fsw-q1", values["fsw-q1"]);
  choose("fsw-q2", values["fsw-q2"]);
  choose("fsw-first-test", "celpip");
  for (const ability of ["speaking", "listening", "reading", "writing"]) choose(`fsw-first-${ability}`, "1");
  choose("fsw-second-test", "none");
  for (const id of ["fsw-q5", "fsw-q6", "fsw-q7", "fsw-q8", "fsw-q9", "fsw-q10"]) choose(id, values[id]);
}

beforeEach(() => { window.localStorage.clear(); });
afterEach(cleanup);

describe("grille des 67 points (Programme des travailleurs qualifiés fédéral)", () => {
  it("30 ans, licence, CLB 9, 3 ans d'expérience = 68 / 100 : seuil atteint, avec la réserve habituelle", () => {
    render(<FswGridCalculator />);
    fill();
    calculate();
    expect(screen.getByTestId("fsw-total").textContent?.replace(/\s/g, "")).toBe("68/100");
    expect(screen.getByTestId("fsw-status").textContent).toMatch(/Seuil des 67 points atteint/);
    const tiles = within(screen.getByTestId("fsw-tiles"));
    for (const label of ["Langues", "Études", "Expérience", "Âge", "Emploi réservé", "Adaptabilité"]) expect(tiles.getByText(label)).toBeTruthy();
    expect(screen.getByTestId("fsw-disclaimer").textContent).toMatch(/ne confirme ni votre admissibilité/);
    expect(screen.getByTestId("fsw-evaluation-cta").textContent).toBe("Demander une évaluation de mon profil");
  });

  it("sous le seuil : indique le nombre de points manquants et des pistes chiffrées", () => {
    render(<FswGridCalculator />);
    fill({ "fsw-q1": "38", "fsw-q2": "two_year_postsecondary", "fsw-q5": "1" });
    calculate();
    expect(screen.getByTestId("fsw-total").textContent?.replace(/\s/g, "")).toBe("61/100"); // 16 langue + ... : 24 langue + 19 études + 9 expérience + 9 âge
    expect(screen.getByTestId("fsw-status").textContent).toMatch(/Il manque 6 points/);
    expect(screen.getByTestId("fsw-levers").textContent).toMatch(/\+\d+ point/);
  });

  it("une question laissée vide n'est jamais comptée comme « non » : elle est listée", () => {
    render(<FswGridCalculator />);
    fill();
    choose("fsw-q10", "");
    calculate();
    expect(screen.queryByTestId("fsw-results")).toBeNull();
    expect(screen.getByTestId("fsw-missing").textContent).toContain("Parent au Canada");
    expect(screen.getByTestId("fsw-remaining").textContent).toMatch(/Il reste 1 question/);
  });

  it("les questions sur le conjoint n'apparaissent que si le conjoint vous accompagne", () => {
    render(<FswGridCalculator />);
    expect(document.getElementById("fsw-q7a")).toBeNull();
    choose("fsw-q7", "yes");
    expect(document.getElementById("fsw-q7a")).not.toBeNull();
    choose("fsw-q7", "no");
    expect(document.getElementById("fsw-q7a")).toBeNull();
  });

  it("la langue sous CLB 7 est signalée comme exigence minimale non remplie même avec 67 points", () => {
    render(<FswGridCalculator />);
    fill({ "fsw-q2": "doctoral", "fsw-q6": "yes", "fsw-q9": "yes" });
    choose("fsw-first-writing", "4"); // CELPIP 6
    calculate();
    expect(screen.getByTestId("fsw-status").textContent).toMatch(/exigence minimale|Il manque/);
    expect(screen.getByTestId("fsw-status").textContent).toMatch(/CLB 7/);
  });

  it("reprend les réponses du calculateur CRS", () => {
    window.localStorage.setItem("3m-crs-official-answers-v1", JSON.stringify({ age: "29", education: "master_or_professional", firstTest: "ielts", firstBands: { speaking: "1", listening: "1", reading: "1", writing: "1" }, secondTest: "none", maritalStatus: "single" }));
    render(<FswGridCalculator />);
    fireEvent.click(screen.getByTestId("fsw-import-crs"));
    expect((document.getElementById("fsw-q1") as HTMLSelectElement).value).toBe("18");
    expect((document.getElementById("fsw-q2") as HTMLSelectElement).value).toBe("master_or_professional");
    expect((document.getElementById("fsw-first-test") as HTMLSelectElement).value).toBe("ielts");
    expect((document.getElementById("fsw-q7") as HTMLSelectElement).value).toBe("no");
  });
});
