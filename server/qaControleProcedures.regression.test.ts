import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");

const procedures = read("client/src/data/procedures107Complete.ts");
const institutional = read("client/src/data/institutionalProcedureSources.ts");
const form = read("client/src/components/SimpleMultiProjectForm.tsx");
const home = read("client/src/pages/Home.tsx");
const countryDetail = read("client/src/pages/CountryDetailPage.tsx");
const flightsPage = read("client/src/pages/Flights.tsx");
const flightBooking = read("server/routers/flightBooking.ts");
const flightsRouter = read("server/routers/flights.ts");
const company = read("client/src/lib/companyContacts.ts");
const aureol = read("shared/aureolSiteKnowledge.ts");

describe("QA contrôle — procédures, évaluation, vols, marque", () => {
  it("France Visiteur : source officielle court séjour, date de vérif et passeport contextualisé", () => {
    expect(procedures).toContain("'france-visiteur'");
    expect(procedures).not.toContain("Processus simple");
    expect(procedures).toContain("Passeport valide ≥ 3 mois après la fin du séjour prévu");
    expect(procedures).toContain("Aucune procédure n’est « simple » par défaut");

    const franceVisiteurBlock = institutional.slice(
      institutional.indexOf('"procedureId": "france-visiteur"'),
      institutional.indexOf('"procedureId": "gabon-travail"'),
    );
    expect(franceVisiteurBlock).toContain("https://france-visas.gouv.fr/visa-de-court-sejour");
    expect(franceVisiteurBlock).toContain('"consultedOn": "2026-10-14"');
    expect(franceVisiteurBlock).not.toContain("sejour-touristique-de-plus-de-3-mois");

    const franceTravailBlock = institutional.slice(
      institutional.indexOf('"procedureId": "france-travail"'),
      institutional.indexOf('"procedureId": "france-visiteur"'),
    );
    expect(franceTravailBlock).toContain("https://france-visas.gouv.fr/activite-salariee");
    expect(franceTravailBlock).not.toContain("R49998");
    expect(franceTravailBlock).toContain('"consultedOn": "2026-10-14"');
  });

  it("affiche le lien exact et la date de vérification sur la fiche procédure", () => {
    expect(countryDetail).toContain('data-testid="procedure-official-source-link"');
    expect(countryDetail).toContain('data-testid="procedure-official-source-url"');
    expect(countryDetail).toContain("Source exacte : {institutionalSource.officialUrl}");
    expect(countryDetail).toContain('data-testid="procedure-source-verified-at"');
  });

  it("évaluation gratuite : formulaire court sans compte préalable", () => {
    expect(form).toContain('data-testid="evaluation-guest-start"');
    expect(form).toContain("Accessible sans compte.");
    expect(form).not.toContain("evaluation-account-gate");
    expect(form).not.toContain("Créez un compte ou connectez-vous avant de soumettre");
    expect(form).toContain('data-testid="evaluation-create-account-after-submit"');
    expect(home).toContain("sans compte pour démarrer");
    expect(aureol).toContain("formulaire court gratuit sans compte");
  });

  it("formules tarifaires : conditions écrites (éligibilité, remboursement, arrêt, exclusivité visa)", () => {
    expect(home).toContain("Prestations incluses listées avant engagement");
    expect(home).toContain("Arrêt du dossier : conditions de remboursement écrites");
    expect(home).toContain("Échéancier écrit avant le 1er règlement");
    expect(home).toContain("Distinct du produit « Permis Garanti » (CGU)");
    expect(home).toContain('href="/conditions-utilisation"');
  });

  it("moteur vols : recherche publique + demande réservation + alerte agence", () => {
    expect(flightsPage).toContain("searchFlights");
    expect(flightsRouter).toContain("searchFlights: publicProcedure");
    expect(flightBooking).toContain("createRequest: publicProcedure");
    expect(flightBooking).toContain("notifyAdmins");
    expect(existsSync(resolve(root, "server/flightFaresAreReal.test.ts"))).toBe(true);
    expect(existsSync(resolve(root, "server/flightBookingReliability.test.ts"))).toBe(true);
  });

  it("marque publique vs dénomination juridique et coordonnées canoniques", () => {
    expect(company).toContain('export const BRAND_PUBLIC_NAME = "3M TRAVEL AGENCY"');
    expect(company).toContain('legalName: "3M Travel Agency SARL"');
    expect(company).toContain("+237 698 104 832");
    expect(company).toContain("+1 672 897 2999");
    expect(company).toContain("hello@3mtravelagency.com");
    expect(company).toContain("Biyem-Assi, Montée Chapelle Obili");
    expect(company).toContain("Lun–ven : 08 h 00 – 20 h 00");
  });
});
