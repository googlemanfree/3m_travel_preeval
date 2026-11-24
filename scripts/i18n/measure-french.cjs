/**
 * Mesure le français encore visible quand le site est en anglais : ouvre des pages avec la langue anglaise choisie et compte les textes
 * qui ressemblent encore à du français. Sert à suivre l'avancement de la traduction (docs/TRADUCTION_ANGLAIS.md).
 *
 *   node scripts/i18n/measure-french.cjs https://www.3mtravelagency.com /tarifs /services /faq   (adresses relatives à la base)
 *   node scripts/i18n/measure-french.cjs --sitemap https://www.3mtravelagency.com                (toutes les pages du plan du site)
 *
 * Variables : CRS_CHROMIUM_PATH (navigateur à utiliser), HTTPS_PROXY, WAIT_MS (attente après chargement, 3500 par défaut ; 9000 sur un serveur de développement à froid). Sortie : mots visibles, mots français, pourcentage, et les premiers textes restants.
 */
const { chromium } = require("playwright");
const FR = /\b(le|la|les|des|du|de la|un|une|et|pour|vous|votre|vos|nous|notre|avec|dans|sur|est|sont|pas|ou|au|aux|ce|cette|ces|que|qui|à|ne|plus|par|sans|être|avoir|d’|l’|qu’|n’)\b/gi;
const EN = /\b(the|and|for|you|your|our|with|in|on|is|are|not|or|to|of|that|this|these|which|by|without|be|have|from|an|a|it|we)\b/gi;

async function main() {
  const args = process.argv.slice(2);
  const sitemap = args[0] === "--sitemap";
  const base = (sitemap ? args[1] : args[0]).replace(/\/$/, "");
  let paths = sitemap ? [] : args.slice(1);
  const options = { headless: true };
  if (process.env.CRS_CHROMIUM_PATH) options.executablePath = process.env.CRS_CHROMIUM_PATH;
  if (process.env.HTTPS_PROXY) options.proxy = { server: process.env.HTTPS_PROXY, bypass: "127.0.0.1,localhost" };
  const browser = await chromium.launch(options);
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => { try { localStorage.setItem("3m_travel_lang", "en"); localStorage.setItem("3m_travel_lang_manual", "1"); } catch { /* ignoré */ } });
  const page = await context.newPage();
  if (sitemap) {
    await page.goto(`${base}/sitemap.xml`);
    paths = (await page.content()).match(/<loc>[^<]+/g)?.map((entry) => entry.slice(5).replace(base, "")).filter((path) => !/^\/en(\/|$)/.test(path)) ?? [];
  }
  let words = 0, french = 0; const remaining = new Map();
  for (const path of paths) {
    await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(Number(process.env.WAIT_MS || 3500));
    // texte réellement visible, ligne par ligne (même rendu que ce que lit le visiteur)
    const nodes = await page.evaluate(() => document.body.innerText.split("\n").map((line) => line.replace(/\s+/g, " ").trim()).filter((line) => line.length >= 12));
    for (const text of nodes) {
      const count = text.split(" ").length; words += count;
      const f = (text.match(FR) || []).length, e = (text.match(EN) || []).length;
      if ((f >= 2 && f > e) || (/[éèêàùçôîïâû]/i.test(text) && f >= 1 && e === 0)) { french += count; remaining.set(text, (remaining.get(text) ?? 0) + 1); }
    }
  }
  await browser.close();
  console.log(`${paths.length} page(s) : ${words} mots visibles, ${french} mots encore en français (${Math.round((french / Math.max(1, words)) * 100)} %).`);
  console.log([...remaining.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([text, n]) => `${n}× ${text.slice(0, 100)}`).join("\n"));
}
main().catch((error) => { console.error(error); process.exit(1); });
