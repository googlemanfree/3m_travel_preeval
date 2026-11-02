/** Outils d'administration : calculs purs (statistiques de résultats, répartition des dossiers, échéancier). */

export const BILAN_TEMPLATE_PROFILES = ["travail", "etudes", "tourisme", "famille", "autre"] as const;
export type BilanTemplateProfile = (typeof BILAN_TEMPLATE_PROFILES)[number];
export const BILAN_TEMPLATE_PROFILE_LABELS: Record<BilanTemplateProfile, string> = { travail: "Visa travail", etudes: "Visa études", tourisme: "Tourisme / visite", famille: "Regroupement familial", autre: "Autre projet" };

/** En dessous de ce nombre de décisions, aucun pourcentage n'est calculé : un taux sur 3 dossiers ne dit rien. */
export const MIN_OUTCOME_SAMPLE = 10;
export const OUTCOME_LABELS = { accepted: "Accordé", refused: "Refusé", withdrawn: "Retiré par le candidat" } as const;
export type OutcomeKind = keyof typeof OUTCOME_LABELS;

export type OutcomeRow = { destination: string; visaType: string; outcome: OutcomeKind };
export type OutcomeStat = { destination: string; visaType: string; accepted: number; refused: number; withdrawn: number; decided: number; ratePercent: number | null; lowSample: boolean };

/** Statistiques par destination et visa. Le taux ne compte que les décisions (accordé + refusé) et n'existe qu'au-delà de l'effectif minimal. */
export function computeOutcomeStats(rows: OutcomeRow[]): OutcomeStat[] {
  const groups = new Map<string, OutcomeStat>();
  for (const row of rows) {
    const key = `${row.destination.trim().toLowerCase()}|${row.visaType.trim().toLowerCase()}`;
    const stat = groups.get(key) ?? { destination: row.destination.trim(), visaType: row.visaType.trim(), accepted: 0, refused: 0, withdrawn: 0, decided: 0, ratePercent: null, lowSample: true };
    stat[row.outcome] += 1;
    groups.set(key, stat);
  }
  return Array.from(groups.values()).map((stat) => {
    const decided = stat.accepted + stat.refused;
    const lowSample = decided < MIN_OUTCOME_SAMPLE;
    return { ...stat, decided, lowSample, ratePercent: lowSample ? null : Math.round((stat.accepted / decided) * 100) };
  }).sort((a, b) => b.decided - a.decided || a.destination.localeCompare(b.destination));
}

export type AgentLoad = { id: number; label: string; open: number };

/** Répartit des dossiers non assignés : chacun va à l'agent le moins chargé à cet instant (égalité : le plus petit identifiant). */
export function planAssignments(agents: AgentLoad[], requestIds: number[]): Array<{ requestId: number; agentId: number }> {
  if (agents.length === 0) return [];
  const loads = new Map(agents.map((agent) => [agent.id, agent.open] as const));
  const plan: Array<{ requestId: number; agentId: number }> = [];
  for (const requestId of requestIds) {
    let best = agents[0].id;
    for (const agent of agents) {
      const load = loads.get(agent.id)!;
      const bestLoad = loads.get(best)!;
      if (load < bestLoad || (load === bestLoad && agent.id < best)) best = agent.id;
    }
    loads.set(best, loads.get(best)! + 1);
    plan.push({ requestId, agentId: best });
  }
  return plan;
}

export type ScheduleItemLike = { amount: number; dueOn: string; status: "pending" | "paid" | "waived" | "cancelled" };

export function scheduleSummary(items: ScheduleItemLike[], today: string): { total: number; paid: number; remaining: number; overdueCount: number; overdueAmount: number; nextDueOn: string | null } {
  const live = items.filter((item) => item.status !== "cancelled");
  const pending = live.filter((item) => item.status === "pending");
  const overdue = pending.filter((item) => item.dueOn < today);
  return {
    total: live.filter((item) => item.status !== "waived").reduce((sum, item) => sum + item.amount, 0),
    paid: live.filter((item) => item.status === "paid").reduce((sum, item) => sum + item.amount, 0),
    remaining: pending.reduce((sum, item) => sum + item.amount, 0),
    overdueCount: overdue.length,
    overdueAmount: overdue.reduce((sum, item) => sum + item.amount, 0),
    nextDueOn: pending.map((item) => item.dueOn).sort()[0] ?? null,
  };
}

/** Tables créées par les migrations 0088 à 0095 : la santé du système signale celles qui manquent. */
export const EXPECTED_TABLES: ReadonlyArray<{ migration: string; tables: string[] }> = [
  { migration: "0088", tables: ["study_institutions", "study_programs", "study_intakes", "study_tuition_fees", "study_applications", "study_application_events"] },
  { migration: "0089", tables: ["job_offers", "job_applications", "job_application_events", "job_offer_reports"] },
  { migration: "0090", tables: ["stay_programs", "stay_requests", "stay_request_events"] },
  { migration: "0091", tables: ["remote_slots", "case_next_actions", "remote_acknowledgements"] },
  { migration: "0092", tables: ["sensitive_action_requests", "satisfaction_responses"] },
  { migration: "0093", tables: ["bilan_templates", "case_outcomes", "payment_schedule_items"] },
  { migration: "0094", tables: ["content_reviews", "content_updates"] },
  { migration: "0095", tables: ["candidate_notification_prefs", "candidate_login_events"] },
];
