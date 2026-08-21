import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("sessions de 24 heures", () => {
  it("aligne les jetons candidat et administrateur alternatifs sur 24 heures", () => {
    expect(read("server/routers/candidate.ts")).toContain('const JWT_EXPIRES = "24h"');
    expect(read("server/routers/candidateAuthOTP.ts")).toContain('const JWT_EXPIRES = "24h"');
    expect(read("server/routers/adminAuth-new.ts")).toContain('const JWT_EXPIRES = "24h"');
    expect(read("server/routers/adminAuth.ts")).toContain("24 * 60 * 60 * 1000");
  });

  it("conserve la session candidat dans le navigateur avec une échéance explicite", () => {
    const login = read("client/src/pages/Login.tsx");
    const auth = read("client/src/hooks/useCandidateAuth.ts");
    expect(login).toContain('3m_candidate_session_expires_at');
    expect(auth).toContain('const EXPIRY_KEY = "3m_candidate_session_expires_at"');
    expect(auth).toContain("expiresAt <= Date.now()");
  });

  it("expose des raccourcis internes sans dépendre de l’historique du navigateur", () => {
    const dashboard = read("client/src/pages/ClientDashboard.tsx");
    expect(dashboard).toContain("Étape suivante");
    expect(dashboard).toContain("setActiveTab(\"overview\")");
    expect(dashboard).toContain("setActiveTab(\"messages\")");
  });

  it("trace les renouvellements et permet une révocation globale sécurisée aux administrateurs", () => {
    const schema = read("drizzle/schema.ts");
    const auth = read("server/routers/adminAuth.ts");
    const settings = read("client/src/pages/AdminEmailSettings.tsx");

    expect(schema).toContain('admin_session_events');
    expect(auth).toContain("getSessionHistory");
    expect(auth).toContain("revokeAllSessions");
    expect(settings).toContain("Révoquer toutes mes sessions");
  });
});
