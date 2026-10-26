import { describe, expect, it } from "vitest";
import { normalizeResendSender } from "./_core/email";

describe("configuration Resend", () => {
  it("utilise l’adresse officielle même si l’environnement contient encore l’ancien format", () => {
    expect(normalizeResendSender(process.env.RESEND_FROM_EMAIL)).toBe("hello@3mtravelagency.com");
    expect(normalizeResendSender("mailto:hello@3mtravelagency.click")).toBe("hello@3mtravelagency.com");
  });
});

import { OFFICIAL_SENDER_ADDRESS, resolveOfficialSender } from "./_core/email";

describe("expéditeur officiel des e-mails", () => {
  it("tout message part de hello@3mtravelagency.com sous le nom de l'agence", () => {
    expect(resolveOfficialSender(undefined)).toEqual({ address: OFFICIAL_SENDER_ADDRESS, from: '"3M TRAVEL AGENCY" <hello@3mtravelagency.com>', overridden: false });
    expect(resolveOfficialSender("hello@3mtravelagency.com").overridden).toBe(false);
  });
  it("remplace Gmail, Resend et les anciens domaines par l'adresse officielle", () => {
    for (const bad of ["3mtravelandservices@gmail.com", "onboarding@resend.dev", "hello@3mtravelagency.click", "Équipe <contact@autre-domaine.com>", "hello@evil3mtravelagency.com"]) {
      const r = resolveOfficialSender(bad);
      expect(r.address).toBe("hello@3mtravelagency.com");
      expect(r.overridden).toBe(true);
    }
  });
  it("accepte une autre boîte du domaine de l'agence, y compris au format « Nom <adresse> »", () => {
    expect(resolveOfficialSender("billetterie@3mtravelagency.com").address).toBe("billetterie@3mtravelagency.com");
    expect(resolveOfficialSender("3M Billetterie <Billetterie@3mtravelagency.com>").address).toBe("billetterie@3mtravelagency.com");
  });
});
