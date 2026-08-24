export type EmailDeliverySummary = {
  total: number;
  sent: number;
  failed: number;
  pending: number;
};

export type EmailErrorType = "invalid_recipient" | "domain_unverified" | "rate_limit" | "configuration";

export const emailErrorPatterns: Record<EmailErrorType, string[]> = {
  invalid_recipient: ["Invalid `to`", "invalid email", "recipient"],
  domain_unverified: ["domain", "verify", "verified"],
  rate_limit: ["rate limit", "too many"],
  configuration: ["api key", "unauthorized", "authentication"],
};

export function summarizeEmailDeliveryLogs(logs: Array<{ status: string }>): EmailDeliverySummary {
  return {
    total: logs.length,
    sent: logs.filter((log) => log.status === "sent").length,
    failed: logs.filter((log) => log.status === "failed").length,
    pending: logs.filter((log) => log.status === "pending").length,
  };
}

export type EmailDeliveryTrendPoint = {
  date: string;
  label: string;
  sent: number;
  failed: number;
  pending: number;
  successRate: number | null;
};

export function buildEmailDeliveryTrend30Days(logs: Array<{ status: string; createdAt: Date }>, now = new Date()): EmailDeliveryTrendPoint[] {
  const dayMs = 24 * 60 * 60 * 1000;
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const startUtc = todayUtc - (29 * dayMs);
  const points = new Map<string, EmailDeliveryTrendPoint>();
  for (let index = 0; index < 30; index += 1) {
    const day = new Date(startUtc + (index * dayMs));
    const date = day.toISOString().slice(0, 10);
    points.set(date, {
      date,
      label: `${String(day.getUTCDate()).padStart(2, "0")}/${String(day.getUTCMonth() + 1).padStart(2, "0")}`,
      sent: 0,
      failed: 0,
      pending: 0,
      successRate: null,
    });
  }
  for (const log of logs) {
    const date = log.createdAt.toISOString().slice(0, 10);
    const point = points.get(date);
    if (!point) continue;
    if (log.status === "sent") point.sent += 1;
    else if (log.status === "failed") point.failed += 1;
    else if (log.status === "pending") point.pending += 1;
  }
  return Array.from(points.values()).map((point) => {
    const finalized = point.sent + point.failed;
    return { ...point, successRate: finalized ? Math.round((point.sent / finalized) * 100) : null };
  });
}
