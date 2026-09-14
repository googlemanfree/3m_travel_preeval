import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("programme ambassadeur — améliorations de partage, inscription et statistiques", () => {
  const source = () => read("client/src/pages/AmbassadorProgram.tsx");

  it("construit et copie le lien complet avec le paramètre ref", () => {
    const content = source();
    expect(content).toContain("window.location.origin}/?ref=");
    expect(content).toContain("navigator.clipboard.writeText(referralLink)");
    expect(content).toContain("Copier le lien complet");
    expect(content).toContain("Lien copié");
  });

  it("expose un état de chargement accessible et un succès visible pour l’inscription", () => {
    const content = source();
    expect(content).toContain("registerMutation.isPending");
    expect(content).toContain("aria-busy={registerMutation.isPending}");
    expect(content).toContain("Loader2");
    expect(content).toContain("Inscription en cours…");
    expect(content).toContain('role="status"');
    expect(content).toContain("Votre lien personnel est prêt");
  });

  it("affiche uniquement les statistiques et le statut renvoyés par getStatsByCode", () => {
    const content = source();
    const router = read("server/routers/ambassador.ts");
    expect(content).toContain("trpc.ambassador.getStatsByCode.useQuery");
    expect(content).toContain("statsQuery.data?.totalReferrals");
    expect(content).toContain("statsQuery.data?.paidReferrals");
    expect(content).toContain("statsQuery.data ? `${statsQuery.data.totalCommissionXaf.toLocaleString('fr-FR')} XAF` : '—'");
    expect(content).toContain("statsQuery.data?.status");
    expect(router).toContain("totalReferrals: referredApplications.length");
    expect(router).toContain("paidReferrals: paidApplications.length");
    expect(router).toContain("totalCommissionXaf");
    expect(router).toContain("status: ambassador.status");
    expect(content).not.toContain("statsQuery.data ? statsQuery.data.commissionRateBps / 100 : 15");
  });
});
