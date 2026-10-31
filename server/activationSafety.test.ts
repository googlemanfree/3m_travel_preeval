import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_OPENING_FEE_XAF, WORK_VISA_OPENING_FEE_XAF, isValidOpeningFee, proposedOpeningFee } from "../shared/openingFee";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8").replace(/\r\n/g, "\n");

describe("frais d'ouverture proposés selon le visa", () => {
  it("visa travail, tous pays : 100 000 XAF proposés ; les autres visas gardent la valeur par défaut", () => {
    expect(WORK_VISA_OPENING_FEE_XAF).toBe(100000);
    for (const visa of ["travail", "Travail", "work", "Visa de travail", "emploi qualifié", "work permit"]) expect(proposedOpeningFee(visa), visa).toBe(100000);
    for (const visa of ["Études", "étude", "tourisme", "visite", "regroupement familial", "family", "", null, undefined]) expect(proposedOpeningFee(visa as string | null | undefined), String(visa)).toBe(DEFAULT_OPENING_FEE_XAF);
    expect(isValidOpeningFee(WORK_VISA_OPENING_FEE_XAF)).toBe(true);
  });

  it("la création de dossier et le webhook de paiement utilisent le montant proposé, plus un 65 000 codé en dur", () => {
    const application = read("server/routers/application.ts");
    expect(application).toContain("paymentAmount: proposedOpeningFee(input.visaType)");
    expect(application).not.toMatch(/DEFAULT_OPENING_FEE_XAF/);
    const webhook = read("server/routers/cinetpayWebhook.ts");
    expect(webhook).not.toMatch(/\?\? 65000/);
    expect(webhook).toContain("proposedOpeningFee(application.visaType)");
  });
});

describe("aucune activation sans preuve de paiement", () => {
  it("l'activation automatique du pilotage exige la preuve avant toute écriture", () => {
    const service = read("server/services/autoActivatePreDossier.ts");
    const guard = service.indexOf("getOpeningPaymentEvidence(db");
    expect(guard).toBeGreaterThan(0);
    expect(guard).toBeLessThan(service.indexOf("db.insert(agencyDossiers)"));
    expect(guard).toBeLessThan(service.indexOf('initialPaymentStatus: "paid"'));
    expect(service).toContain("paiement_non_justifie");
  });

  it("l'activation manuelle et l'écran d'activation exigent la preuve jointe ; une référence seule ne suffit plus", () => {
    const router = read("server/routers/adminCandidateManagement.ts");
    expect(router).toContain("!openingPayment?.proofFileUrl?.trim() && !(await isOpeningPaymentValidated(db, candidate))");
    expect(router).toContain("Boolean(openingPayment?.proofFileUrl?.trim()) || (await isOpeningPaymentValidated(db, candidate))");
    expect(router).toContain("une simple référence ne suffit plus pour ouvrir un dossier");
  });

  it("déposer une pièce ou déclarer une ancienne évaluation n'ouvre plus le dossier", () => {
    expect(read("server/routers/candidateUpload.ts")).not.toContain('candidate.dossierStatus === "nouveau" || candidate.dossierStatus === "evaluation"');
    const candidate = read("server/routers/candidate.ts");
    expect(candidate).toContain('dossierStatus: "nouveau" as const,\n              evaluationDeclarationStatus: "validated" as const,');
  });

  it("la preuve ne vient que de sources contrôlées : fichier de preuve, paiement en ligne validé, paiement agence confirmé au journal", () => {
    const evidence = read("server/services/openingPaymentEvidence.ts");
    expect(evidence).toContain('"proof_file"');
    expect(evidence).toContain("paymentValidatedBy");
    expect(evidence).toContain('eq(paymentAuditLogs.action, "confirmed")');
    expect(evidence).toContain("agencyPaidWithoutLog: true");
  });
});

describe("désactivation, retour en pré-compte et annulations", () => {
  const service = read("server/services/deactivateDossier.ts");
  const router = read("server/routers/activationSafety.ts");

  it("désactiver ne supprime rien : le compte repasse à « nouveau » et l'état précédent est conservé pour l'annuler", () => {
    expect(service).toContain('dossierStatus: "nouveau", activeDossierNumber: null, activeDossierSetAt: null');
    expect(service).not.toMatch(/db\.delete\((candidates|agencyDossiers)\)/);
    expect(service).toContain("saveSnapshot(db");
    expect(service).toContain('action: "dossier_deactivated"');
    expect(service).toContain('action: "dossier_reactivated"');
  });

  it("la réactivation est impossible sans preuve de paiement", () => {
    const reactivate = service.slice(service.indexOf("export async function reactivateCandidateDossier"));
    expect(reactivate.indexOf("getOpeningPaymentEvidence")).toBeGreaterThan(0);
    expect(reactivate.indexOf("getOpeningPaymentEvidence")).toBeLessThan(reactivate.indexOf("db.update(candidates)"));
    expect(reactivate).toContain('"preuve_manquante"');
  });

  it("la désactivation en masse exige un super administrateur, une phrase de confirmation et revérifie chaque compte", () => {
    expect(router).toContain("requireSuperAdminSession(input.sessionToken)");
    expect(router).toContain('confirmation: z.literal("DESACTIVER")');
    expect(router).toContain("scanActivationsWithoutProof(db, 1000)");
    expect(router).toContain("allowed.has(candidateId)");
  });

  it("supprimer un compte activé le fait basculer en pré-compte ; supprimer son dossier aussi si plus aucun dossier ne reste", () => {
    const admin = read("server/routers/admin.ts");
    expect(admin).toContain('if (isActivatedStatus(record.dossierStatus)) {\n          const reverted = await deactivateCandidateDossier(');
    expect(admin).toContain("revertToPreAccountAfterDossierRemoval(db, { email: record.email");
    expect((admin.match(/revertToPreAccountAfterDossierRemoval\(db/g) ?? []).length).toBe(2);
  });

  it("le routeur est branché, a un onglet d'administration, et aucun nom de procédure n'est réservé", () => {
    expect(read("server/routers.ts")).toContain("activationSafety: activationSafetyRouter");
    expect(read("client/src/pages/AdminDashboard.tsx")).toContain('<AdminActivationSafety sessionToken={sessionToken} />');
    const names = Array.from(router.matchAll(/\n  ([A-Za-z]+): publicProcedure/g), (match) => match[1]);
    expect(names).toEqual(["status", "scan", "searchActive", "deactivate", "requests", "decideRequest", "deactivateMany", "reactivate"]);
  });

  it("expose un état agrégé du contrôle sans SQL ni données personnelles dans l'interface", () => {
    expect(read("server/routers/activationSafety.ts")).toContain("getActivationGuardStatus()");
    expect(read("server/services/activationGuard.ts")).toContain("Le contrôle automatique n'a pas pu interroger la base de données.");
    const panel = read("client/src/components/AdminActivationSafety.tsx");
    expect(panel).toContain('data-testid="activation-guard-status"');
    expect(panel).toContain("Supervision automatique");
  });

  it("protège le contrôle périodique contre une connexion MySQL inactive", () => {
    expect(read("server/db.ts")).toContain("enableKeepAlive: true");
    expect(read("server/db.ts")).toContain("supportBigNumbers: true");
    expect(read("server/services/deactivateDossier.ts")).toContain("Laisser le pool reprendre une connexion");
  });
});
