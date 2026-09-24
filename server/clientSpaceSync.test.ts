import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLIENT_SPACE_MAX_ANNOUNCEMENTS,
  CLIENT_SPACE_POLL_MS,
  buildClientSpaceSnapshot,
  clientSpacePolling,
  diffClientSpace,
  humanizeStatus,
  limitAnnouncements,
  mergeClientSpaceSnapshots,
  type ClientSpaceSnapshot,
} from "../client/src/lib/clientSpaceSync";

const evaluation = (stage: string) => ({ view: { stage } });
const caseData = (overrides: { status?: string; requirements?: Array<Record<string, unknown>>; notifications?: Array<Record<string, unknown>> } = {}) => ({
  cases: [{ id: 5, caseNumber: "3M-2026-005", currentStatus: overrides.status ?? "nouveau", requirements: overrides.requirements ?? [{ id: 11, documentType: "acte_de_naissance", status: "pending" }] }],
  notifications: overrides.notifications ?? [],
});
const snap = (input: Parameters<typeof buildClientSpaceSnapshot>[0]) => buildClientSpaceSnapshot(input);

describe("rafraîchissement automatique", () => {
  it("interroge le serveur régulièrement, seulement onglet visible, et au retour sur l'onglet", () => {
    expect(clientSpacePolling()).toEqual({ refetchInterval: CLIENT_SPACE_POLL_MS, refetchIntervalInBackground: false, refetchOnWindowFocus: true, refetchOnReconnect: true });
    expect(clientSpacePolling(60_000).refetchInterval).toBe(60_000);
    expect(CLIENT_SPACE_POLL_MS).toBeGreaterThanOrEqual(15_000); // borne la charge serveur
  });
});

describe("instantané des données du candidat", () => {
  it("ne lève jamais sur des données inattendues et laisse les facettes absentes indéfinies", () => {
    expect(snap({})).toEqual({});
    expect(() => snap({ evaluation: "x", cases: { cases: "x", notifications: 4 }, insurance: { a: 1 }, evisa: { data: "x" } })).not.toThrow();
    expect(snap({ evaluation: { view: { stage: "inconnu" } } }).evaluationStage).toBeUndefined();
    expect(snap({ insurance: { a: 1 } }).insurance).toBeUndefined();
  });

  it("lit les dossiers, pièces, notifications, assurances et e-Visa", () => {
    const value = snap({
      evaluation: evaluation("pending"),
      cases: caseData({ notifications: [{ id: 1, caseId: 5, title: "Pièce reçue", body: "Merci", isRead: false, isArchived: false }] }),
      insurance: [{ id: 3, reference: "ASS-3", status: "pending", couponFileName: null, attestationFileName: "a.pdf" }],
      evisa: { data: [{ id: 9, countryName: "Kenya", status: "pending", issuedPdfUrl: null }] },
    });
    expect(value.evaluationStage).toBe("pending");
    expect(value.cases).toEqual({ "5": { status: "nouveau", label: "3M-2026-005" } });
    expect(value.requirements?.["11"]).toEqual({ status: "pending", label: "Acte de naissance", caseId: "5" });
    expect(value.notifications?.["1"]).toEqual({ title: "Pièce reçue", body: "Merci", caseId: "5", unread: true });
    expect(value.insurance?.["3"]).toEqual({ status: "pending", label: "ASS-3", coupon: false, attestation: true });
    expect(value.evisa?.["9"]).toEqual({ status: "pending", label: "Kenya", issued: false });
  });

  it("humanise un statut technique", () => {
    expect(humanizeStatus("en_cours_de_traitement")).toBe("En cours de traitement");
    expect(humanizeStatus("")).toBe("");
  });
});

describe("ce qui est annoncé au candidat", () => {
  it("rien à la première lecture (référence), rien quand rien ne change", () => {
    const first = snap({ evaluation: evaluation("pending"), cases: caseData() });
    expect(diffClientSpace(null, first)).toEqual([]);
    expect(diffClientSpace(first, snap({ evaluation: evaluation("pending"), cases: caseData() }))).toEqual([]);
  });

  it("annonce la publication de l'évaluation et une demande de complément, pas le simple passage à « en attente »", () => {
    const before = snap({ evaluation: evaluation("pending") });
    expect(diffClientSpace(before, snap({ evaluation: evaluation("published") })).map((c) => c.id)).toEqual(["evaluation-published"]);
    expect(diffClientSpace(before, snap({ evaluation: evaluation("info_requested") })).map((c) => c.id)).toEqual(["evaluation-info"]);
    expect(diffClientSpace(snap({ evaluation: evaluation("not_started") }), snap({ evaluation: evaluation("pending") }))).toEqual([]);
  });

  it("annonce le changement d'état d'un dossier et l'ouverture d'un nouveau dossier", () => {
    const before = snap({ cases: caseData({ status: "nouveau" }) });
    const changed = diffClientSpace(before, snap({ cases: caseData({ status: "en_traitement" }) }));
    expect(changed).toHaveLength(1);
    expect(changed[0].title).toContain("3M-2026-005");
    expect(changed[0].description).toBe("Nouvel état : En traitement.");
    const opened = diffClientSpace(snap({ cases: { cases: [], notifications: [] } }), snap({ cases: caseData() }));
    expect(opened.map((c) => c.id)).toEqual(["case-new-5"]);
  });

  it("annonce une pièce validée (succès) ou à corriger (avertissement), pas les autres transitions", () => {
    const before = snap({ cases: caseData({ requirements: [{ id: 11, documentType: "passeport", status: "received" }, { id: 12, documentType: "photo", status: "pending" }] }) });
    const after = snap({ cases: caseData({ requirements: [{ id: 11, documentType: "passeport", status: "approved" }, { id: 12, documentType: "photo", status: "rejected" }] }) });
    const changes = diffClientSpace(before, after);
    expect(changes.map((c) => [c.title, c.tone])).toEqual([["Pièce validée : Passeport", "success"], ["Pièce à corriger : Photo", "warning"]]);
    const onlyReceived = snap({ cases: caseData({ requirements: [{ id: 11, documentType: "passeport", status: "received" }] }) });
    expect(diffClientSpace(snap({ cases: caseData({ requirements: [{ id: 11, documentType: "passeport", status: "pending" }] }) }), onlyReceived)).toEqual([]);
  });

  it("un message de l'équipe est annoncé et remplace l'annonce générique du même dossier", () => {
    const before = snap({ cases: caseData({ status: "nouveau" }) });
    const after = snap({ cases: caseData({ status: "en_traitement", notifications: [{ id: 7, caseId: 5, title: "Votre dossier avance", body: "Nous avons commencé l'analyse.", isRead: false }] }) });
    const changes = diffClientSpace(before, after);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ id: "notification-7", title: "Votre dossier avance", description: "Nous avons commencé l'analyse." });
  });

  it("ne réannonce pas une notification déjà connue, même remise « non lue » par le candidat", () => {
    const read = snap({ cases: caseData({ notifications: [{ id: 7, caseId: 5, title: "T", body: "B", isRead: true }] }) });
    const unreadAgain = snap({ cases: caseData({ notifications: [{ id: 7, caseId: 5, title: "T", body: "B", isRead: false }] }) });
    expect(diffClientSpace(read, unreadAgain)).toEqual([]);
    const archivedNew = snap({ cases: caseData({ notifications: [{ id: 8, caseId: null, title: "Vieille", body: "", isRead: false, isArchived: true }] }) });
    expect(diffClientSpace(read, archivedNew)).toEqual([]);
  });

  it("annonce coupon, attestation et statut d'assurance", () => {
    const item = (extra: Record<string, unknown>) => [{ id: 3, reference: "ASS-3", status: "pending", couponFileName: null, attestationFileName: null, ...extra }];
    const before = snap({ insurance: item({}) });
    expect(diffClientSpace(before, snap({ insurance: item({ couponFileName: "c.pdf" }) }))[0].title).toContain("coupon");
    expect(diffClientSpace(before, snap({ insurance: item({ attestationFileName: "a.pdf" }) }))[0].title).toContain("attestation");
    expect(diffClientSpace(before, snap({ insurance: item({ status: "paid" }) }))[0].description).toBe("Nouvel état : Paid.");
  });

  it("annonce un e-Visa disponible, refusé ou en évolution", () => {
    const item = (extra: Record<string, unknown>) => ({ data: [{ id: 9, countryName: "Kenya", status: "pending", issuedPdfUrl: null, ...extra }] });
    const before = snap({ evisa: item({}) });
    expect(diffClientSpace(before, snap({ evisa: item({ status: "approved", issuedPdfUrl: "https://x/f.pdf" }) }))[0]).toMatchObject({ tone: "success", title: "Votre e-Visa Kenya est disponible" });
    expect(diffClientSpace(before, snap({ evisa: item({ status: "rejected" }) }))[0].tone).toBe("warning");
    expect(diffClientSpace(before, snap({ evisa: item({ status: "processing" }) }))[0].description).toBe("Nouvel état : Processing.");
  });

  it("une facette pas encore chargée n'est pas comparée, et la fusion garde ce qui est déjà connu", () => {
    const partial: ClientSpaceSnapshot = snap({ evaluation: evaluation("pending") });
    const merged = mergeClientSpaceSnapshots(partial, snap({ cases: caseData() }));
    expect(merged.evaluationStage).toBe("pending");
    expect(merged.cases).toBeDefined();
    expect(diffClientSpace(partial, snap({ evaluation: evaluation("pending"), cases: caseData({ status: "en_traitement" }) }))).toEqual([]);
    expect(mergeClientSpaceSnapshots(merged, {}).cases).toEqual(merged.cases);
  });

  it("limite le nombre d'annonces puis résume le reste", () => {
    const many = Array.from({ length: 7 }, (_, index) => ({ id: `n${index}`, tone: "info" as const, title: `T${index}` }));
    const limited = limitAnnouncements(many);
    expect(limited).toHaveLength(CLIENT_SPACE_MAX_ANNOUNCEMENTS + 1);
    expect(limited[limited.length - 1].title).toBe("4 autres mises à jour");
    expect(limitAnnouncements(many.slice(0, 3))).toHaveLength(3);
    expect(limitAnnouncements(many.slice(0, 4)).pop()?.title).toBe("1 autre mise à jour");
  });
});

describe("page « espace client » : branchement", () => {
  const page = readFileSync(resolve(import.meta.dirname, "../client/src/pages/EvaluationSpace.tsx"), "utf8").replace(/\r\n/g, "\n");

  it("toutes les requêtes que l'administrateur fait évoluer utilisent le rafraîchissement automatique", () => {
    expect(page.match(/\.\.\.clientSpacePolling\(/g)?.length).toBe(6); // résumé, évaluation, e-Visa, dossiers, assurances, précisions
    expect(page).not.toMatch(/refetchOnWindowFocus: false/);
    expect(page).not.toContain("refetchInterval: 30_000");
  });

  it("annonce les changements sans rien annoncer à la première lecture", () => {
    expect(page).toContain("diffClientSpace(previousSpaceSnapshot.current, next)");
    expect(page).toContain("limitAnnouncements(changes)");
    expect(page).toContain("const previousSpaceSnapshot = useRef<ClientSpaceSnapshot | null>(null);");
  });

  it("l'heure « Mise à jour à » suit la dernière lecture réussie", () => {
    expect(page).toContain("dataUpdatedAt: dashboardUpdatedAt");
    expect(page).toContain("dataUpdatedAt: caseTrackingUpdatedAt");
    expect(page).toContain("setLastSyncedAt(lastDataUpdate)");
  });
});
