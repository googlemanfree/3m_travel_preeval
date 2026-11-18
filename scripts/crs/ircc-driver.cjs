/**
 * Pilote le calculateur OFFICIEL d'IRCC (« Vérifiez votre note », formulaire #crs-form de canada.ca) avec un navigateur automatisé.
 * Sert à confronter le calculateur de 3M TRAVEL AGENCY à l'outil officiel sur des profils réels. Lecture seule : aucune donnée n'est envoyée à IRCC
 * (le calcul se fait dans la page) ; aucun profil de client n'est jamais saisi ici, seulement des profils de test.
 *
 *   const { openOfficialCalculator } = require("./ircc-driver.cjs");
 *   const tool = await openOfficialCalculator();            // utilise HTTPS_PROXY si défini
 *   const result = await tool.score({ q1: "Never Married / Single", q3: "29 years of age", ... });
 *   await tool.close();
 */
const { chromium } = require("playwright");

const URL = "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score.html";
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function openOfficialCalculator() {
  const options = process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {};
  // Chromium préinstallé de l'environnement (sans effet ailleurs : on laisse Playwright choisir son propre navigateur).
  if (process.env.CRS_CHROMIUM_PATH) options.executablePath = process.env.CRS_CHROMIUM_PATH;
  const browser = await chromium.launch(options);
  const context = await browser.newContext({ viewport: { width: 1280, height: 1600 } });
  const page = await context.newPage();

  async function load() {
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 90000 });
        await page.waitForSelector("#crs-form select", { timeout: 60000 });
        // Les scripts de la page branchent l'affichage progressif des questions après le chargement : répondre trop tôt ne fait rien apparaître.
        await page.waitForLoadState("load", { timeout: 60000 }).catch(() => undefined);
        await wait(3000);
        return;
      } catch (error) {
        if (attempt === 4) throw error;
        await wait(1500 * attempt);
      }
    }
  }

  /** Choisit l'option dont le texte CONTIENT `text` (ou égal à `{ exact }`). Les questions apparaissent au fur et à mesure : on attend la liste. */
  async function choose(id, text, optional = false) {
    // Une question « optionnelle » n'est posée par l'outil officiel que selon les réponses précédentes : si elle n'apparaît pas, on la saute.
    const shown = await page.waitForSelector(`#${id}`, { state: "visible", timeout: optional ? 1800 : 20000 }).then(() => true, (error) => { if (optional) return false; throw error; });
    if (!shown) return false;
    const value = await page.$eval(`#${id}`, (select, wanted) => {
      const options = Array.from(select.options).filter((option) => option.value !== "badvalue");
      const norm = (value) => value.replace(/\s+/g, "").toLowerCase();
      const exact = options.find((option) => norm(option.text) === norm(wanted));
      return (exact || options.find((option) => norm(option.text).includes(norm(wanted))))?.value ?? null;
    }, text);
    if (value === null) {
      const available = await page.$eval(`#${id}`, (select) => Array.from(select.options).map((option) => option.text.trim()));
      throw new Error(`Option introuvable pour #${id} : « ${text} ». Disponibles : ${available.join(" | ")}`);
    }
    await page.selectOption(`#${id}`, value);
    await wait(250);
    return true;
  }

  async function readResult() {
    // Le résultat s'affiche dans #results sous forme de lignes « Libellé = valeur » ; #neg-results est un autre élément, masqué.
    await page.waitForFunction(() => /=\s*\d+/.test(document.querySelector("#results")?.innerText || ""), null, { timeout: 20000 }).catch(() => undefined);
    const text = await page.evaluate(() => (document.querySelector("#results")?.innerText || "").replace(/[ \t]+/g, " ").trim());
    const lines = {};
    for (const line of text.split(/\n+/)) {
      const match = line.match(/^(.*?)\s*=\s*(-?\d+)\s*$/);
      if (match) lines[match[1].trim()] = Number(match[2]);
    }
    return { text, lines };
  }

  return {
    page,
    /** `steps` : liste ordonnée de [id, texte de l'option, optionnelle?] ; l'ordre est celui du formulaire officiel (les questions suivantes apparaissent selon les réponses). */
    async score(steps) {
      await load();
      for (const [id, text, optional] of steps) await choose(id, text, Boolean(optional));
      await page.click('#crs-form button[type="submit"]');
      await wait(800);
      return readResult();
    },
    async close() { await browser.close(); },
  };
}

module.exports = { openOfficialCalculator };
