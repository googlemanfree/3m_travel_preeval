import { readFileSync, writeFileSync } from "node:fs";

const path = "/home/ubuntu/3m_travel_preeval/client/src/pages/Home.tsx";
const source = readFileSync(path, "utf8");
const startMarker = "      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}";
const endMarker = "      {/* ─── CARROUSEL VISAS ACCORDÉS (Preuve Sociale) ────────────────────────── */}";
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);

if (start < 0 || end < 0 || end <= start) {
  throw new Error("Les marqueurs du footer d’accueil sont introuvables ; aucune modification n’a été appliquée.");
}

const consolidated = `${source.slice(0, start)}      {/* Footer partagé unique : FooterLegal */}\n${source.slice(end)}`;
writeFileSync(path, consolidated, "utf8");
