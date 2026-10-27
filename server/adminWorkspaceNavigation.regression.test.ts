import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "client/src/pages/AdminDashboard.tsx"), "utf8").replace(/\r\n/g, "\n");
const indexOfTabs = source.indexOf('<Tabs value={activeAdminTab}');
const beforeTabs = source.slice(source.indexOf("const stats ="), indexOfTabs);

/** Contenu d'une section : de son ouverture à la prochaine ouverture de section. */
function tabContent(value: string) {
  const start = source.indexOf(`<TabsContent value="${value}"`);
  expect(start, `onglet ${value}`).toBeGreaterThan(0);
  const next = source.indexOf("<TabsContent value=", start + 10);
  return source.slice(start, next < 0 ? undefined : next);
}

describe("poste de pilotage admin : un clic sur une section affiche son contenu tout de suite", () => {
  it("aucun gros panneau ne précède plus les sections : on ne descend plus pour voir les dossiers", () => {
    for (const heavy of [
      "AdminPlacementPipeline sessionToken",
      "AdminPartnerModule sessionToken",
      "AdminCvthequeReview sessionToken",
      "AdminEvaluationJourneyBoard sessionToken",
      "AdminEvaluationFormEditor sessionToken",
      "AdminCountryCatalog sessionToken",
      "AdminRecruitmentInbox sessionToken",
      "AdminPrivacyCenter sessionToken",
      'aria-label="Supervision des remises SMTP"',
      'aria-label="File de priorités manuelle"',
      'aria-label="Échéances de traitement par conseiller"',
      "Répartition des candidats par pays",
    ]) {
      expect(beforeTabs, heavy).not.toContain(heavy);
    }
    // Reste au-dessus des sections : l'indicateur compact et la bannière du planificateur.
    expect(beforeTabs).toContain("Total");
  });

  it("chaque panneau déplacé vit dans la section qui lui correspond", () => {
    const pilotage = tabContent("pilotage");
    expect(pilotage).toContain('aria-label="File de priorités manuelle"');
    expect(pilotage).toContain('aria-label="Échéances de traitement par conseiller"');
    const partners = tabContent("partners");
    for (const panel of ["AdminPlacementPipeline", "AdminPartnerModule", "AdminCvthequeReview", "AdminRecruitmentInbox"]) expect(partners).toContain(panel);
    const config = tabContent("evaluation-config");
    for (const panel of ["AdminEvaluationJourneyBoard", "AdminEvaluationFormEditor", "AdminCountryCatalog"]) expect(config).toContain(panel);
    expect(tabContent("privacy")).toContain("AdminPrivacyCenter");
    expect(tabContent("emails")).toContain('aria-label="Supervision des remises SMTP"');
    expect(tabContent("destination-analytics")).toContain("Répartition des candidats par pays");
  });

  it("les nouvelles sections ont leur bouton de navigation et leur libellé", () => {
    for (const tab of ["partners", "evaluation-config", "privacy"]) {
      expect(source).toContain(`<TabsTrigger value="${tab}"`);
      expect(source).toMatch(new RegExp(`"?${tab}"?: "[^"]+"`));
    }
  });

  it("un changement de section mémorise l'onglet, met le lien à jour et amène le contenu sous l'en-tête", () => {
    expect(source).toContain("const setActiveAdminTab = useCallback((tab: string) => {");
    expect(source).toContain("rememberAdminTab(tab);");
    expect(source).toContain('getElementById("admin-workspace")');
    expect(source).toContain('id="admin-workspace" className="mb-4 flex scroll-mt-44');
    expect(source).toContain('window.localStorage.setItem(ADMIN_TAB_STORAGE_KEY, tab);');
    expect(source).toContain('url.searchParams.set("tab", tab);');
  });

  it("n'ouvre jamais seul une section dépendant des droits (taux de change, planificateur)", () => {
    expect(source).toContain('new Set(["rates", "scheduler"])');
    expect(source).toContain("!ADMIN_TAB_NOT_RESTORED.has(stored)");
  });
});
