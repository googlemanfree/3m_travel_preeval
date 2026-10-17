import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as campaign from "../client/src/data/contentCampaign";
import * as campaignDocs from "../client/src/data/contentCampaignDocs";
import * as campaignPartners from "../client/src/data/contentCampaignPartners";
import * as campaignEvisa from "../client/src/data/contentCampaignEvisa";
import * as campaignTranslation from "../client/src/data/contentCampaignTranslation";
import { evisasDatabaseComplete } from "../client/src/data/evisasDatabaseComplete";
import { composePublicPrerender, getIndexablePublicPaths, PUBLIC_PAGES } from "./publicPrerender";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");

const NUMBERS = /\d+\s?(%|€|\$|FCFA|F CFA|h\b|heures?|jours?|semaines?|mois)/i;
const PROMISES = /garanti(?!r)|100\s?%|sans risque|assur[ée]s? de réussir|à coup sûr/i;

type Item = { question?: string; answer?: string; title?: string; text?: string };

/** Tous les textes de la campagne (tout tableau exporté de chaînes ou d'objets {question,answer}/{title,text}). */
function collectTexts(): string[] {
  const texts: string[] = [];
  const visit = (value: unknown) => {
    if (typeof value === "string") texts.push(value);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object") Object.values(value as Record<string, unknown>).forEach(visit);
  };
  Object.values(campaign).forEach(visit);
  Object.values(campaignDocs).forEach(visit);
  Object.values(campaignPartners).forEach(visit);
  [campaignEvisa.EVISA_COUNTRY_CHECKS, campaignEvisa.EVISA_COUNTRY_ERRORS, campaignEvisa.EVISA_COUNTRY_REFUSAL_STEPS].forEach(visit);
  Object.values(campaignTranslation).forEach(visit);
  return texts;
}

describe("campagne de contenu : soutenue mais honnête", () => {
  it("aucun prix ni délai chiffré, aucune promesse de résultat, aucun ancien nom de marque", () => {
    const texts = collectTexts();
    expect(texts.length).toBeGreaterThan(100);
    for (const text of texts) {
      expect(text, text).not.toMatch(NUMBERS);
      expect(text, text).not.toMatch(PROMISES);
      expect(text, text).not.toMatch(/Prime Travel/i);
    }
  });

  it("la FAQ générale couvre sept thèmes, avec de vraies réponses, toutes différentes", () => {
    expect(campaign.FAQ_GENERAL_GROUPS.map((group) => group.id)).toEqual(["demarrer", "frais", "documents", "delais", "securite", "visas", "reclamations"]);
    expect(campaign.FAQ_GENERAL_ITEMS.length).toBeGreaterThanOrEqual(30);
    const questions = campaign.FAQ_GENERAL_ITEMS.map((item) => item.question);
    expect(new Set(questions).size).toBe(questions.length);
    for (const item of campaign.FAQ_GENERAL_ITEMS as Required<Pick<Item, "question" | "answer">>[]) {
      expect(item.question.trim().endsWith("?"), item.question).toBe(true);
      expect(item.answer.length, item.question).toBeGreaterThan(90);
    }
  });

  it("les engagements sensibles sont tenus dans la FAQ : frais confirmés par écrit, aucune garantie de visa, aucun mot de passe demandé", () => {
    const all = campaign.FAQ_GENERAL_ITEMS.map((item) => `${item.question} ${item.answer}`).join("\n");
    expect(all).toContain("confirmé par écrit");
    expect(all).toMatch(/décision appartient aux autorités/i);
    expect(all).toMatch(/Jamais\. 3M TRAVEL AGENCY ne demande ni mot de passe/);
    expect(all).not.toMatch(/65[\s .]?000/);
  });

  it("le guide « vérifier une agence » : signaux, vérifications, engagements, conduite à tenir", () => {
    expect(campaign.AGENCY_RED_FLAGS.length).toBeGreaterThanOrEqual(8);
    expect(campaign.AGENCY_CHECKS.length).toBe(6);
    expect(campaign.AGENCY_3M_DOES.length).toBeGreaterThanOrEqual(6);
    expect(campaign.AGENCY_IF_SCAMMED.length).toBeGreaterThanOrEqual(5);
    expect(campaign.AGENCY_CHECK_FAQ.length).toBeGreaterThanOrEqual(4);
    expect(campaign.AGENCY_RED_FLAGS.map((flag) => flag.title).join(" ")).toMatch(/assurés/);
  });
});

describe("campagne de contenu : pages enregistrées partout où il faut", () => {
  it("routes, prérendu serveur et plan du site", () => {
    const app = read("client/src/App.tsx");
    expect(app).toContain('<Route path={"/faq"} component={Faq} />');
    expect(app).toContain('<Route path={"/verifier-une-agence"} component={VerifierAgence} />');
    expect(PUBLIC_PAGES["/faq"]?.title).toContain("Questions fréquentes");
    expect(PUBLIC_PAGES["/verifier-une-agence"]?.title).toContain("Vérifier une agence");
    const indexable = getIndexablePublicPaths();
    expect(indexable).toContain("/faq");
    expect(indexable).toContain("/verifier-une-agence");
    const sitemapPage = read("client/src/pages/Sitemap.tsx");
    expect(sitemapPage).toContain('href: "/faq"');
    expect(sitemapPage).toContain('href: "/verifier-une-agence"');
  });

  it("le HTML prérendu (lu sans JavaScript) contient les questions et les signaux d'alerte", () => {
    const template = "<!doctype html><html><head><title>x</title></head><body><div id=\"root\"><!--prerender-app--></div></body></html>";
    const faqPage = composePublicPrerender(template, "/faq");
    expect(faqPage.status).toBe(200);
    const faq = faqPage.html;
    expect(faq).toContain("Faut-il créer un compte pour commencer ?");
    expect(faq).toContain("Quels moyens de paiement sont acceptés ?");
    expect(faq).toContain("<h1>Questions fréquentes</h1>");
    const agencyPage = composePublicPrerender(template, "/verifier-une-agence");
    expect(agencyPage.status).toBe(200);
    const agency = agencyPage.html;
    expect(agency).toContain("Les signaux d’alerte");
    expect(agency).toContain("Un visa, un emploi ou une admission « assurés »");
  });
});

describe("campagne de contenu, lot 2 : documents, paiement, CNI, accessibilité, état du service", () => {
  it("les contenus du lot sont complets et bilingues là où il le faut", () => {
    expect(campaignDocs.DOC_FAMILIES.length).toBe(6);
    expect(campaignDocs.DOC_FORMAT_RULES.length).toBeGreaterThanOrEqual(5);
    expect(campaignDocs.DOC_FORMALITIES.length).toBe(3);
    expect(campaignDocs.DOC_FAQ.length).toBeGreaterThanOrEqual(4);
    expect(campaignDocs.PAY_STEPS.length).toBeGreaterThanOrEqual(4);
    expect(campaignDocs.PAY_FAQ.length).toBeGreaterThanOrEqual(4);
    expect(campaignDocs.CNI_BEFORE_CHECKLIST.length).toBe(5);
    expect(campaignDocs.CNI_LOST_STEPS.length).toBe(3);
    expect(campaignDocs.ACCESSIBILITY_STATEMENT.length).toBeGreaterThanOrEqual(5);
    for (const block of campaignDocs.ACCESSIBILITY_STATEMENT) {
      for (const lang of ["fr", "en"] as const) {
        expect(block.title[lang].length).toBeGreaterThan(3);
        expect(block.text[lang].length).toBeGreaterThan(40);
      }
    }
  });

  it("la déclaration d'accessibilité ne prétend pas à une conformité non auditée", () => {
    const text = campaignDocs.ACCESSIBILITY_STATEMENT.flatMap((block) => [block.text.fr, block.text.en]).join("\n");
    expect(text).not.toMatch(/entièrement conforme|fully compliant|site (est )?certifié|is certified/i);
    expect(text).toMatch(/pas fait l’objet d’une certification externe/);
    expect(text).toMatch(/not undergone external certification/);
  });

  it("les pages sont branchées sur les nouveaux contenus", () => {
    expect(read("client/src/pages/DocumentCompliancePage.tsx")).toContain('testId="compliance-faq"');
    expect(read("client/src/pages/Paiement.tsx")).toContain('testId="pay-steps"');
    expect(read("client/src/pages/CniPasseport.tsx")).toContain('testId="cni-lost"');
    expect(read("client/src/pages/Accessibility.tsx")).toContain("ACCESSIBILITY_STATEMENT");
    expect(read("server/_core/index.ts")).toContain("registerPublicHealthRoute(app);");
  });
});

describe("campagne de contenu, lot 3 : employeurs, agences de placement, ambassadeurs", () => {
  it("les contenus sont complets et ne publient ni délai de vérification ni barème de commission", () => {
    expect(campaignPartners.EMPLOYER_HOW_STEPS.length).toBe(5);
    expect(campaignPartners.EMPLOYER_VISIBLE.length).toBeGreaterThanOrEqual(5);
    expect(campaignPartners.EMPLOYER_HIDDEN.length).toBeGreaterThanOrEqual(4);
    expect(campaignPartners.EMPLOYER_COMMITMENTS.length).toBe(4);
    expect(campaignPartners.EMPLOYER_FAQ.length).toBeGreaterThanOrEqual(6);
    expect(campaignPartners.AGENCY_PARTNER_STEPS.length).toBe(4);
    expect(campaignPartners.AGENCY_PARTNER_FAQ.length).toBeGreaterThanOrEqual(5);
    expect(campaignPartners.AMBASSADOR_HOW_STEPS.length).toBe(4);
    expect(campaignPartners.AMBASSADOR_NEVER_SAY.length).toBeGreaterThanOrEqual(5);
    expect(campaignPartners.AMBASSADOR_FAQ.length).toBeGreaterThanOrEqual(7);
    const faq = [...campaignPartners.EMPLOYER_FAQ, ...campaignPartners.AGENCY_PARTNER_FAQ, ...campaignPartners.AMBASSADOR_FAQ];
    for (const item of faq) {
      expect(item.question.trim().endsWith("?"), item.question).toBe(true);
      expect(item.answer.length, item.question).toBeGreaterThan(90);
    }
    expect(new Set(faq.map((item) => item.question)).size).toBe(faq.length);
  });

  it("les règles de protection des candidats et des ambassadeurs sont écrites", () => {
    const hidden = campaignPartners.EMPLOYER_HIDDEN.join(" ");
    expect(hidden).toMatch(/téléphone/);
    expect(hidden).toMatch(/pièces d’identité/);
    expect(campaignPartners.AMBASSADOR_NEVER_SAY.join(" ")).toMatch(/assuré/);
    expect(campaignPartners.AMBASSADOR_YOU_CAN_SAY.join(" ")).toMatch(/confirmés par écrit avant tout paiement/);
    expect(campaignPartners.AMBASSADOR_FAQ.map((item) => item.answer).join(" ")).toMatch(/aucun champ de paiement/);
  });

  it("les trois pages sont branchées sur les nouveaux contenus", () => {
    expect(read("client/src/pages/EmployerPortal.tsx")).toContain('testId="employer-faq"');
    expect(read("client/src/pages/PlacementPartnerPortal.tsx")).toContain('testId="agency-faq"');
    expect(read("client/src/pages/AmbassadorProgram.tsx")).toContain('testId="ambassador-faq"');
  });
});

describe("campagne de contenu, lot 4 : fiche e-Visa par pays", () => {
  it("chaque pays reçoit six questions distinctes, sans promesse, et sans valeur « à confirmer » présentée comme un fait", () => {
    expect(evisasDatabaseComplete.length).toBeGreaterThan(15);
    for (const destination of evisasDatabaseComplete) {
      const faq = campaignEvisa.buildEvisaCountryFaq(destination);
      expect(faq, destination.id).toHaveLength(6);
      expect(new Set(faq.map((item) => item.question)).size, destination.id).toBe(6);
      for (const item of faq) {
        expect(item.question, destination.id).toContain(destination.country);
        expect(item.answer.length, item.question).toBeGreaterThan(90);
        expect(item.answer, item.question).not.toMatch(PROMISES);
        expect(item.answer, item.question).not.toMatch(/«\s*à confirmer/i);
      }
      const delayAnswer = faq[0].answer;
      expect(delayAnswer, destination.id).toMatch(/indicatif|n’est pas publié/);
    }
  });

  it("une valeur confirmée est citée comme indicative, une valeur absente n'est jamais inventée", () => {
    const base = { country: "Pays-test", docs: "Passeport valide, photographie.", delay: "À confirmer par le portail officiel", fee: "À confirmer par le portail officiel", duration: "À confirmer" };
    const unknown = campaignEvisa.buildEvisaCountryFaq(base);
    expect(unknown[0].answer).toContain("n’est pas publié ici");
    expect(unknown[1].answer).toContain("ne sont pas publiés ici");
    expect(unknown[0].answer).toContain("n’a pas fait l’objet d’une vérification récente");
    const known = campaignEvisa.buildEvisaCountryFaq({ ...base, delay: "3 jours", fee: "50 USD", duration: "30 jours", officialPortalLabel: "Portail test", officialVerifiedAt: "2026-09-01" });
    expect(known[0].answer).toContain("« 3 jours »");
    expect(known[0].answer).toContain("indicatif");
    expect(known[0].answer).toContain("2026-09-01");
    expect(known[1].answer).toContain("seul le montant affiché par le portail officiel");
  });

  it("la page de détail annonce un délai et des frais indicatifs et ne promet plus un format « 100 % »", () => {
    const page = read("client/src/pages/EvisaDetailPage.tsx");
    expect(page).toContain("Délai indicatif");
    expect(page).toContain("Frais indicatifs");
    expect(page).toContain('data-testid="evisa-indicative-note"');
    expect(page).not.toContain("Frais officiels");
    expect(page).not.toContain("100% Numérique");
    expect(page).toContain("setPageSeo");
    expect(page).toContain('testId="evisa-country-faq"');
  });
});

describe("campagne de contenu, lot 5 : commande de traduction", () => {
  it("chaque type de document du formulaire a un libellé français, et la FAQ ne promet ni délai ni statut", () => {
    const page = read("client/src/pages/TranslationOrder.tsx");
    const typesBlock = page.slice(page.indexOf("const documentTypes = ["), page.indexOf("];", page.indexOf("const documentTypes = [")));
    const types = Array.from(typesBlock.matchAll(/"([a-z_]+)"/g)).map((match) => match[1]);
    expect(types.length).toBe(12);
    for (const type of types) expect(campaignTranslation.TRANSLATION_DOCUMENT_LABELS[type], type).toBeTruthy();
    expect(page).toContain("TRANSLATION_DOCUMENT_LABELS[type]");
    expect(campaignTranslation.TRANSLATION_FAQ.length).toBeGreaterThanOrEqual(7);
    const answers = campaignTranslation.TRANSLATION_FAQ.map((item) => item.answer).join("\n");
    expect(answers).toMatch(/confirmé par écrit/);
    expect(answers).toMatch(/Non\. Vous envoyez la demande/);
    for (const item of campaignTranslation.TRANSLATION_FAQ) expect(item.question.trim().endsWith("?"), item.question).toBe(true);
  });

  it("la page n'affirme plus une certification qu'elle ne peut pas prouver et explique le paiement", () => {
    const page = read("client/src/pages/TranslationOrder.tsx");
    expect(page).not.toContain("Traduction Certifiée");
    expect(page).toContain('data-testid="translation-price-note"');
    expect(page).toContain("setPageSeo");
    expect(page).toContain('testId="translation-faq"');
    expect(page).toContain("Math.max(1, parseInt(e.target.value) || 1)");
  });
});

describe("campagne de contenu : structure des pages d'annuaire", () => {
  it("/evisas : titres de niveau 2, guide pas à pas, FAQ, et plus de mention « officiel » trompeuse", () => {
    const page = read("client/src/pages/EvisasAdvanced.tsx");
    expect(page).toContain('<h2 className="sr-only">Rechercher une destination e-Visa</h2>');
    expect(page).toContain('data-testid="evisas-directory-title"');
    expect(page).toContain("EVISA_HOW_STEPS");
    expect(page).toContain("EVISA_BEFORE_YOU_APPLY");
    expect(page).toContain('testId="evisas-faq"');
    expect(page).not.toContain("Annuaire Officiel");
    expect(campaign.EVISA_HOW_STEPS).toHaveLength(4);
    expect(campaign.EVISA_HUB_FAQ.length).toBeGreaterThanOrEqual(5);
  });

  it("/fiches : titres de niveau 2 pour les filtres et les résultats", () => {
    const page = read("client/src/pages/Fiches.tsx");
    expect(page).toContain('<h2 className="sr-only">Rechercher et filtrer les fiches</h2>');
    expect(page).toContain('data-testid="fiches-results-title"');
  });
});
