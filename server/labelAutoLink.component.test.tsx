// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Label } from "../client/src/components/ui/label";
import { Input } from "../client/src/components/ui/input";

(globalThis as any).React = React;

afterEach(() => cleanup());

describe("Label : relie automatiquement l'étiquette au champ qui la suit", () => {
  it("relie `<Label/><Input/>` : le champ obtient son nom accessible", () => {
    render(<div><Label>Nom complet *</Label><Input /></div>);
    expect(screen.getByLabelText("Nom complet *")).toBeTruthy();
  });

  it("relie aussi un champ placé dans un conteneur frère, et un select natif", () => {
    render(<div><div><Label>Ville</Label><div className="mt-2"><Input /></div></div><div><Label>Pays</Label><select><option>A</option></select></div></div>);
    expect(screen.getByLabelText("Ville").tagName).toBe("INPUT");
    expect(screen.getByLabelText("Pays").tagName).toBe("SELECT");
  });

  it("respecte un htmlFor explicite et un aria-label existant, sans les écraser", () => {
    render(<div><Label htmlFor="mon-champ">Explicite</Label><Input id="mon-champ" /><Label>Autre</Label><Input aria-label="Nom propre" /></div>);
    expect(screen.getByLabelText("Explicite").id).toBe("mon-champ");
    expect(screen.getByLabelText("Nom propre").getAttribute("aria-label")).toBe("Nom propre");
    expect(screen.queryByLabelText("Autre")).toBeNull();
  });

  it("ne relie pas une étiquette à un champ trop éloigné ni à une case à cocher", () => {
    render(<div><Label>Titre seul</Label><p>a</p><p>b</p><p>c</p><Input /><Label>Case</Label><input type="checkbox" /></div>);
    expect(screen.queryByLabelText("Titre seul")).toBeNull();
    expect(screen.queryByLabelText("Case")).toBeNull();
  });
});
