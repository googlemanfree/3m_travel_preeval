import { describe, expect, it } from "vitest";
import { COMPANY_PROFILE } from "../client/src/lib/companyContacts";
import {
  PARTNERSHIP_TERMS_LIMITS,
  addMonths,
  formatCommissionRate,
  isPartnershipCommissionActive,
  normalizeWebsite,
  partnershipReference,
  partnershipSigningState,
  partnershipTermsProblem,
} from "../shared/partnershipProgram";
import {
  PARTNERSHIP_PROTOCOL_TITLES,
  PARTNERSHIP_PROTOCOL_VERSION,
  PARTNERSHIP_SIGNING_DECLARATIONS,
  buildPartnershipProtocolText,
  type PartnershipProtocolVariables,
} from "../shared/partnershipProtocolContent";
import { buildPartnershipProtocolPreview, createPartnershipProtocolPdf, partnershipProvider, protocolFingerprint } from "./services/partnershipProtocol";

const base = (kind: "travel_agency" | "individual"): PartnershipProtocolVariables => ({
  kind,
  reference: "PAR-2026-0042",
  issuedAt: new Date("2026-11-07T10:00:00Z"),
  provider: partnershipProvider(),
  partner: kind === "travel_agency"
    ? { displayName: "Teranga Voyages", representativeName: "Awa Ndiaye", representativeRole: "Gérante", legalRegistration: "SN-DKR-2019-B-1234", taxId: "NINEA 0012345", licenceNumber: "LIC-77", country: "Sénégal", city: "Dakar", email: "awa@teranga.test", phone: "+221 77 000 00 00" }
    : { displayName: "Marc Tchoua", representativeName: "Marc Tchoua", country: "Cameroun", city: "Douala", email: "marc@example.com" },
  terms: { commissionRateBps: 1500, termMonths: 12, attributionMonths: 12, paymentDelayDays: 30, territory: "Afrique de l’Ouest" },
});

describe("règles du programme de partenariat", () => {
  it("formate les taux et construit des références lisibles", () => {
    expect(formatCommissionRate(1500)).toBe("15 %");
    expect(formatCommissionRate(1250)).toBe("12,5 %");
    expect(formatCommissionRate(100)).toBe("1 %");
    expect(partnershipReference(7, new Date("2026-11-07T00:00:00Z"))).toBe("PAR-2026-0007");
    expect(partnershipReference(12345, "2027-01-02T00:00:00Z")).toBe("PAR-2027-12345");
  });

  it("borne les conditions négociées et exige un territoire", () => {
    const ok = { commissionRateBps: 1500, termMonths: 12, attributionMonths: 12, paymentDelayDays: 30, territory: "Cameroun" };
    expect(partnershipTermsProblem(ok)).toBeNull();
    expect(partnershipTermsProblem({ ...ok, commissionRateBps: PARTNERSHIP_TERMS_LIMITS.commissionBps.max + 1 })).toMatch(/taux/i);
    expect(partnershipTermsProblem({ ...ok, commissionRateBps: 99 })).toMatch(/taux/i);
    expect(partnershipTermsProblem({ ...ok, commissionRateBps: 12.5 as number })).toMatch(/taux/i);
    expect(partnershipTermsProblem({ ...ok, termMonths: 3 })).toMatch(/durée/i);
    expect(partnershipTermsProblem({ ...ok, attributionMonths: 40 })).toMatch(/attribution/i);
    expect(partnershipTermsProblem({ ...ok, paymentDelayDays: 1 })).toMatch(/versement/i);
    expect(partnershipTermsProblem({ ...ok, territory: " " })).toMatch(/territoire/i);
  });

  it("ajoute des mois sans déborder sur le mois suivant", () => {
    expect(addMonths(new Date("2026-01-31T00:00:00Z"), 1).toISOString().slice(0, 10)).toBe("2026-02-28");
    expect(addMonths(new Date("2026-11-07T00:00:00Z"), 12).toISOString().slice(0, 10)).toBe("2027-11-07");
  });

  it("ne rend un protocole signable que s'il est émis, non expiré et non signé", () => {
    const now = new Date("2026-11-07T12:00:00Z");
    const future = new Date("2026-11-20T12:00:00Z");
    expect(partnershipSigningState({ status: "protocol_issued", signTokenExpiresAt: future }, now)).toBe("ready");
    expect(partnershipSigningState({ status: "protocol_issued", signTokenExpiresAt: new Date("2026-11-01T00:00:00Z") }, now)).toBe("expired");
    expect(partnershipSigningState({ status: "protocol_issued", signTokenExpiresAt: null }, now)).toBe("expired");
    expect(partnershipSigningState({ status: "submitted", signTokenExpiresAt: future }, now)).toBe("unavailable");
    expect(partnershipSigningState({ status: "partner_signed", signTokenExpiresAt: future, partnerSignedAt: now }, now)).toBe("signed");
  });

  it("aucune commission n'est active avant la contresignature", () => {
    for (const status of ["submitted", "in_review", "protocol_issued", "partner_signed", "rejected", "suspended"]) expect(isPartnershipCommissionActive(status)).toBe(false);
    expect(isPartnershipCommissionActive("active")).toBe(true);
  });

  it("normalise l'adresse de site et refuse les schémas dangereux", () => {
    expect(normalizeWebsite("teranga.sn")).toBe("https://teranga.sn");
    expect(normalizeWebsite("javascript:alert(1)")).toBe("");
    expect(normalizeWebsite("pas un site")).toBe("");
    expect(normalizeWebsite("")).toBe("");
  });
});

describe.each([["travel_agency"], ["individual"]] as const)("protocole d'accord — %s", (kind) => {
  const text = buildPartnershipProtocolText(base(kind));

  it("reprend l'identité légale de 3M telle que publiée, et celle du partenaire", () => {
    expect(text).toContain(COMPANY_PROFILE.legalName);
    expect(text).toContain(COMPANY_PROFILE.legalIdentifiers.registration);
    expect(text).toContain(COMPANY_PROFILE.legalIdentifiers.taxpayerId);
    expect(text.replace(/ /g, " ")).toContain(COMPANY_PROFILE.shareCapital);
    expect(text).toContain(COMPANY_PROFILE.founder.name);
    expect(text).toContain(kind === "travel_agency" ? "Teranga Voyages" : "Marc Tchoua");
    expect(text).not.toMatch(/3M Travel Agency SARL|M112417203369H|CM-NSI/);
  });

  it("comporte les 17 articles et les deux annexes, dans l'ordre", () => {
    const headings = text.split(/\n\n/).filter((block) => /^(Article \d+|Annexe \d+) — /.test(block));
    expect(headings).toHaveLength(19);
    expect(headings[0]).toMatch(/^Article 1 — Objet/);
    expect(headings[16]).toMatch(/^Article 17 — Acceptation/);
    expect(headings[17]).toMatch(/^Annexe 1 — Conditions particulières/);
    expect(headings[18]).toMatch(/^Annexe 2 — Charte/);
  });

  it("écrit les conditions négociées, jamais de variable non remplacée", () => {
    expect(text).toContain("égale à 15 % des Frais d’accompagnement effectivement encaissés");
    expect(text).toContain("dure 12 mois");
    expect(text).toContain("dans les 30 jours qui suivent");
    expect(text).toContain("Afrique de l’Ouest");
    expect(text).toContain("PAR-2026-0042");
    expect(text).toContain(PARTNERSHIP_PROTOCOL_VERSION);
    expect(text).not.toMatch(/undefined|NaN|\[object|\$\{|\{\{/);
  });

  it("protège le client et 3M : aucune garantie de résultat, aucun encaissement, commission après paiement validé", () => {
    expect(text).toMatch(/aucun pouvoir d’engager 3M/);
    expect(text).toMatch(/ne garantir ni l’obtention d’un visa/);
    expect(text).toMatch(/ne jamais demander ni encaisser de somme au nom de 3M/);
    expect(text).toMatch(/La commission naît au Paiement validé du client/);
    expect(text).toMatch(/ne produit ses effets, et aucune commission n’est due, qu’après la contresignature de 3M/);
    expect(text).toMatch(/corruption/);
    expect(text).toMatch(/soixante-douze \(72\) heures/);
  });

  it("n'affiche jamais « partenaire officiel » sans autorisation écrite", () => {
    expect(text).toMatch(/Il ne se présente pas comme « partenaire officiel » de 3M/);
  });

  it("adapte le statut du partenaire à son profil", () => {
    if (kind === "travel_agency") {
      expect(text).toMatch(/entreprise autonome/);
      expect(text).toMatch(/SN-DKR-2019-B-1234/);
      expect(text).not.toMatch(/n’est ni salarié, ni agent/);
    } else {
      expect(text).toMatch(/personne physique majeure/);
      expect(text).toMatch(/n’est ni salarié, ni agent, ni mandataire/);
      expect(text).not.toMatch(/entreprise autonome/);
    }
  });
});

describe("aperçu public du modèle", () => {
  it("laisse les parties et les conditions entre crochets, sans engager personne", () => {
    const preview = buildPartnershipProtocolPreview("travel_agency");
    expect(preview).toContain("[Raison sociale de l’agence]");
    expect(preview).toContain("[taux fixé à l’émission]");
    expect(preview).toContain("PAR-AAAA-NNNN");
    expect(preview).not.toMatch(/undefined|NaN|0 %|0 mois/);
  });
});

describe("empreinte et PDF", () => {
  it("l'empreinte change dès qu'un mot change", () => {
    const text = buildPartnershipProtocolText(base("individual"));
    expect(protocolFingerprint(text)).toMatch(/^[0-9a-f]{64}$/);
    expect(protocolFingerprint(text)).toBe(protocolFingerprint(text));
    expect(protocolFingerprint(text)).not.toBe(protocolFingerprint(text.replace("15 %", "25 %")));
  });

  it("produit un PDF multi-pages, plus lourd une fois signé par les deux parties", async () => {
    const text = buildPartnershipProtocolText(base("travel_agency"));
    const fingerprint = protocolFingerprint(text);
    const common = { kind: "travel_agency" as const, reference: "PAR-2026-0042", partnerName: "Teranga Voyages", protocolText: text, fingerprint };
    const blank = await createPartnershipProtocolPdf(common);
    const signed = await createPartnershipProtocolPdf({
      ...common,
      partnerSignature: { name: "Awa Ndiaye", signedAt: new Date("2026-11-08T09:00:00Z"), ipAddress: "10.0.0.1" },
      countersignature: { name: "admin@3mtravelagency.com", signedAt: new Date("2026-11-09T09:00:00Z") },
    });
    expect(blank.subarray(0, 5).toString()).toBe("%PDF-");
    const pages = (pdf: Buffer) => (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    expect(pages(blank)).toBeGreaterThanOrEqual(5);
    expect(pages(signed)).toBeGreaterThanOrEqual(pages(blank));
    expect(signed.length).not.toBe(blank.length);
  });

  it("le titre du document correspond au profil", () => {
    expect(PARTNERSHIP_PROTOCOL_TITLES.travel_agency).toMatch(/agence de voyage/);
    expect(PARTNERSHIP_PROTOCOL_TITLES.individual).toMatch(/apporteur d’affaires/);
    expect(PARTNERSHIP_SIGNING_DECLARATIONS).toHaveLength(3);
  });
});
