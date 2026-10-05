export type SchedulerExecution = {
  id: string;
  job: string;
  path: string;
  mode: "off" | "dry-run" | "live";
  startedAt: Date;
  finishedAt: Date;
  status: "success" | "failed";
  planned: number;
  sent: number;
  failed: number;
  source: "schedule" | "manual";
  error?: string;
};

const MAX_HISTORY = 50;
const history: SchedulerExecution[] = [];

export function recordSchedulerExecution(entry: Omit<SchedulerExecution, "id">): SchedulerExecution {
  const recorded: SchedulerExecution = { ...entry, id: `${entry.finishedAt.getTime()}-${history.length + 1}` };
  history.unshift(recorded);
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  return recorded;
}

export function getSchedulerHistory(limit = 20): SchedulerExecution[] {
  return history.slice(0, Math.max(1, Math.min(limit, MAX_HISTORY)));
}

export function clearSchedulerHistoryForTests() {
  history.length = 0;
}
