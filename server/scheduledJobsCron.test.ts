import { afterEach, describe, expect, it, vi } from "vitest";
import { CronJob } from "cron";
import {
  resolveScheduledJobsMode,
  shouldDispatchJob,
  SCHEDULED_JOBS,
  PLATFORM_CRON_ONLY_PATHS,
  initScheduledJobsCron,
  type ScheduledJobSpec,
} from "./cron/scheduledJobsCron";

afterEach(() => {
  delete process.env.SCHEDULED_JOBS_MODE;
  delete process.env.CRON_SECRET;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("resolveScheduledJobsMode", () => {
  it("reste désactivé par défaut, y compris pour une valeur inconnue ou vide", () => {
    expect(resolveScheduledJobsMode(undefined)).toBe("off");
    expect(resolveScheduledJobsMode("")).toBe("off");
    expect(resolveScheduledJobsMode("nimportequoi")).toBe("off");
  });

  it("reconnaît dry-run et live, insensible à la casse et aux espaces", () => {
    expect(resolveScheduledJobsMode("dry-run")).toBe("dry-run");
    expect(resolveScheduledJobsMode(" LIVE ")).toBe("live");
    expect(resolveScheduledJobsMode("Dry-Run")).toBe("dry-run");
  });
});

describe("shouldDispatchJob", () => {
  const withPreview: ScheduledJobSpec = { path: "/x", cronTime: "0 0 * * * *", label: "avec aperçu", candidateFacing: true, supportsDryRun: true };
  const withoutPreview: ScheduledJobSpec = { path: "/y", cronTime: "0 0 * * * *", label: "sans aperçu", candidateFacing: true, supportsDryRun: false };

  it("ne déclenche jamais rien en mode off", () => {
    expect(shouldDispatchJob(withPreview, "off")).toBe(false);
    expect(shouldDispatchJob(withoutPreview, "off")).toBe(false);
  });

  it("en dry-run, ne déclenche que les tâches qui savent prévisualiser sans effet de bord", () => {
    expect(shouldDispatchJob(withPreview, "dry-run")).toBe(true);
    expect(shouldDispatchJob(withoutPreview, "dry-run")).toBe(false);
  });

  it("en live, déclenche toutes les tâches, avec ou sans aperçu", () => {
    expect(shouldDispatchJob(withPreview, "live")).toBe(true);
    expect(shouldDispatchJob(withoutPreview, "live")).toBe(true);
  });
});

describe("SCHEDULED_JOBS", () => {
  it("couvre les 5 endpoints planifiables via CRON_SECRET, chacun avec une expression cron valide", () => {
    const paths = SCHEDULED_JOBS.map((job) => job.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.sort()).toEqual([
      "/api/scheduled/compliance-monthly-report",
      "/api/scheduled/document-reminders",
      "/api/scheduled/evaluation-bilan-job",
      "/api/scheduled/evaluation-job",
      "/api/scheduled/passport-pending-weekly-alert",
    ]);
    for (const job of SCHEDULED_JOBS) {
      // Construire une CronJob valide la syntaxe sans jamais la démarrer (4e argument = false).
      expect(() => new CronJob(job.cronTime, () => {}, null, false)).not.toThrow();
    }
  });

  it("exclut explicitement les 2 endpoints qui exigent un jeton de session Manus (CRON_SECRET seul y échouerait toujours)", () => {
    expect(PLATFORM_CRON_ONLY_PATHS).toEqual(["/api/scheduled/external-link-check", "/api/scheduled/evaluation-review-deadline-alerts"]);
    for (const path of PLATFORM_CRON_ONLY_PATHS) {
      expect(SCHEDULED_JOBS.some((job) => job.path === path)).toBe(false);
    }
  });

  it("marque document-reminders comme seule tâche avec un aperçu sans effet de bord", () => {
    const supportingDryRun = SCHEDULED_JOBS.filter((job) => job.supportsDryRun).map((job) => job.path);
    expect(supportingDryRun).toEqual(["/api/scheduled/document-reminders"]);
  });

  it("marque evaluation-job et evaluation-bilan-job comme tâches à risque candidat (volume d'e-mails réels)", () => {
    const candidateFacing = SCHEDULED_JOBS.filter((job) => job.candidateFacing).map((job) => job.path).sort();
    expect(candidateFacing).toEqual([
      "/api/scheduled/document-reminders",
      "/api/scheduled/evaluation-bilan-job",
      "/api/scheduled/evaluation-job",
    ]);
  });
});

describe("initScheduledJobsCron", () => {
  it("ne programme aucune tâche quand SCHEDULED_JOBS_MODE est absent", () => {
    delete process.env.SCHEDULED_JOBS_MODE;
    const jobs = initScheduledJobsCron(3000);
    expect(jobs).toEqual([]);
  });

  it("programme une CronJob par tâche en mode dry-run ou live", async () => {
    process.env.SCHEDULED_JOBS_MODE = "dry-run";
    const jobs = initScheduledJobsCron(3000);
    try {
      expect(jobs).toHaveLength(SCHEDULED_JOBS.length);
    } finally {
      await Promise.all(jobs.map((job) => job.stop()));
    }
  });

  it("n'appelle jamais un endpoint tant que CRON_SECRET est absent, même en mode live", async () => {
    process.env.SCHEDULED_JOBS_MODE = "live";
    delete process.env.CRON_SECRET;
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const jobs = initScheduledJobsCron(3000);
    try {
      // Déclenche manuellement les callbacks programmées, sans attendre leur cadence réelle.
      await Promise.all(jobs.map((job) => job.fireOnTick()));
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      await Promise.all(jobs.map((job) => job.stop()));
    }
  });

  it("en dry-run, appelle uniquement document-reminders, avec {dryRun:true} et le secret attendu", async () => {
    process.env.SCHEDULED_JOBS_MODE = "dry-run";
    process.env.CRON_SECRET = "test-secret";
    const fetchSpy = vi.fn().mockResolvedValue({ status: 200, json: async () => ({ sent: 0 }) });
    vi.stubGlobal("fetch", fetchSpy);
    const jobs = initScheduledJobsCron(4242);
    try {
      await Promise.all(jobs.map((job) => job.fireOnTick()));
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, init] = fetchSpy.mock.calls[0];
      expect(url).toBe("http://127.0.0.1:4242/api/scheduled/document-reminders");
      expect(init.method).toBe("POST");
      expect(init.headers.Authorization).toBe("Bearer test-secret");
      expect(init.body).toBe(JSON.stringify({ dryRun: true }));
    } finally {
      await Promise.all(jobs.map((job) => job.stop()));
    }
  });
});
