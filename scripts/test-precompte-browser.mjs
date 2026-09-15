import { chromium } from "@playwright/test";
import fs from "node:fs";

const baseUrl = "https://3000-ige8kutl0fz4q24gdzeis-7cd77fc7.us1.manus.computer";
const token = fs.readFileSync("/home/ubuntu/test-assets/precompte-token.txt", "utf8").trim();
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const context = await browser.newContext();
await context.addInitScript(({ candidateToken }) => {
  localStorage.setItem("3m_candidate_token", candidateToken);
  const candidateInfo = { id: 1890001, fullName: "QA Précompte Sans Dossier 20260914", email: "aureoldonfack+precompte-20260914@gmail.com", destination: "autre", dossierStatus: "nouveau" };
  const expiry = String(Date.now() + 60 * 60 * 1000);
  localStorage.setItem("3m_candidate_token", candidateToken);
  localStorage.setItem("3m_candidate_info", JSON.stringify(candidateInfo));
  localStorage.setItem("3m_candidate_session_expires_at", expiry);
  sessionStorage.setItem("3m_candidate_token", candidateToken);
  sessionStorage.setItem("3m_candidate_info", JSON.stringify(candidateInfo));
  sessionStorage.setItem("3m_candidate_session_expires_at", expiry);
}, { candidateToken: token });
const page = await context.newPage();
await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
const profileProbe = await page.evaluate(async (candidateToken) => {
  const response = await fetch("/api/trpc/candidate.getProfile?batch=1", {
    headers: { Authorization: `Bearer ${candidateToken}` },
  });
  return { status: response.status, body: await response.text() };
}, token);
console.log(JSON.stringify({ profileProbe }, null, 2));
await page.goto(`${baseUrl}/mon-espace?section=dossier&cachebust=precompte-1890001`, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const agreementTab = page.getByRole("tab", { name: /Documents à signer/i });
if (await agreementTab.count()) await agreementTab.click();
await page.waitForTimeout(400);
const bodyText = await page.locator("body").innerText();
const hasNoActiveDossier = bodyText.includes("Pas encore de dossier actif");
const hasSignatureButton = bodyText.includes("Signer le protocole d’accord");
const hasPrecompteIdentity = bodyText.includes("QA Précompte Sans Dossier 20260914");
await page.screenshot({ path: "/home/ubuntu/test-assets/precompte-browser.png", fullPage: true });
console.log(JSON.stringify({
  url: page.url(),
  hasPrecompteIdentity,
  hasNoActiveDossier,
  hasSignatureButton,
  excerpt: (() => { const lines = bodyText.split("\\n"); return lines.map((line, index) => ({ line, index })).filter(({ line }) => /dossier actif|protocole|signature|QA Précompte/i.test(line)).flatMap(({ index }) => lines.slice(Math.max(0, index - 2), index + 4)).slice(0, 40); })(),
}, null, 2));
await browser.close();
if (!hasNoActiveDossier || hasSignatureButton) process.exit(2);
