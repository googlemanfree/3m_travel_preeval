import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { LEGACY_PUBLIC_REDIRECTS } from "./legacyPublicRedirects";

describe("routes publiques historiques", () => {
  const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
  const flightsSource = readFileSync(resolve(process.cwd(), "client/src/pages/Flights.tsx"), "utf8");

  it("une seule page de vols : les anciennes adresses 3M Booking et Billets renvoient vers /flights", () => {
    expect(appSource).toContain('<Route path={"/3m-booking"}>{() => <Redirect to="/flights#3m-booking" />}</Route>');
    expect(appSource).toContain('<Route path={"/billets"}>{() => <Redirect to="/flights" />}</Route>');
    // Le serveur répond 301 (sans quoi l'hébergeur affiche un écran de maintenance) et l'ancien composant n'existe plus.
    expect(LEGACY_PUBLIC_REDIRECTS["/billets"]).toBe("/flights");
    expect(LEGACY_PUBLIC_REDIRECTS["/3m-booking"]).toBe("/flights#3m-booking");
    expect(existsSync(resolve(process.cwd(), "client/src/pages/Billets.tsx"))).toBe(false);
  });

  it("préserve les accès historiques à l’assurance et à la connexion candidat", () => {
    expect(appSource).toContain('<Route path={"/insurance"}>{() => <Redirect to="/assurance" />}</Route>');
    expect(appSource).toContain('<Route path={"/candidate/login"}>{() => <Redirect to="/login" />}</Route>');
  });

  it("ne duplique pas le pied de page sur /flights (footer global App uniquement)", () => {
    expect(flightsSource).not.toContain("<Footer");
    expect(flightsSource).not.toContain('import Footer from');
    expect(appSource).toContain("{showPublicFooter && <FooterLegal />}");
  });
});

