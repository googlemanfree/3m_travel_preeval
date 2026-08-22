import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("routes publiques historiques", () => {
  const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

  it("monte directement la page 3M Booking au lieu de laisser un écran de transition vide", () => {
    expect(appSource).toContain('<Route path={"/3m-booking"} component={Billets} />');
  });

  it("préserve les accès historiques à l’assurance et à la connexion candidat", () => {
    expect(appSource).toContain('<Route path={"/insurance"}>{() => <Redirect to="/assurance" />}</Route>');
    expect(appSource).toContain('<Route path={"/candidate/login"}>{() => <Redirect to="/login" />}</Route>');
  });
});
