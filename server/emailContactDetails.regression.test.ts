import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

// Le vrai numéro WhatsApp de l'agence (COMPANY_CONTACTS.yaounde) est 237698104832.
// 237620996045 est un numéro d'appel distinct (phoneDisplay) : jamais un lien wa.me valide.
const FILES_WITH_WHATSAPP_LINKS = [
  "server/emailService.ts",
  "server/routers/admin.ts",
  "server/routers/flights.ts",
  "client/src/pages/PaymentFailed.tsx",
  "client/src/pages/PaymentSuccess.tsx",
  "client/src/pages/PrimeJourney.tsx",
];

describe("liens WhatsApp des e-mails et pages client", () => {
  it.each(FILES_WITH_WHATSAPP_LINKS)("%s ne pointe jamais wa.me vers le numéro d'appel au lieu du vrai numéro WhatsApp", (path) => {
    const source = read(path);
    expect(source).not.toContain("wa.me/237620996045");
  });

  it("server/emailService.ts référence bien le vrai numéro WhatsApp de l'agence", () => {
    expect(read("server/emailService.ts")).toContain("wa.me/237698104832");
  });
});

describe("mentions de copyright dans les e-mails transactionnels", () => {
  const FILES_WITH_COPYRIGHT = ["server/emailService.ts", "server/routers/admin.ts", "server/routers/candidate-new.ts", "server/routers/flights.ts"];

  it.each(FILES_WITH_COPYRIGHT)("%s n'affiche plus l'année 2024 figée en dur et utilise l'année courante", (path) => {
    const source = read(path);
    expect(source).not.toContain("© 2024");
    expect(source).toContain("new Date().getFullYear()");
  });
});
