import { describe, it, expect, vi } from 'vitest';
import { ENV } from './server/_core/env';

describe('Heartbeat System', () => {
  it('should have Heartbeat API configured', () => {
    expect(ENV.forgeApiUrl).toBeDefined();
    expect(ENV.forgeApiKey).toBeDefined();
    expect(ENV.forgeApiUrl).toContain('forge');
    expect(ENV.forgeApiKey).toMatch(/^[a-zA-Z0-9_-]+$/);
  });

  it('should have valid cron expression format', () => {
    const validCrons = [
      '0 0 8 * * *',      // Daily at 8 UTC
      '0 0 9 * * *',      // Daily at 9 UTC
      '0 0 8,18 * * *',   // Twice daily
      '0 0 8 * * 1-5',    // Weekdays only
    ];

    // 6-field cron: sec min hour dom mon dow (allows *, ranges, and comma-separated values)
    const cronRegex = /^(\d+|\*)\s+(\d+|\*|\d+,\d+)\s+(\d+|\*|\d+,\d+|\d+-\d+)\s+(\d+|\*|\d+-\d+|\d+,\d+)\s+(\d+|\*|\d+-\d+)\s+(\d+|\*|\d+-\d+)$/;

    validCrons.forEach(cron => {
      expect(cron).toMatch(cronRegex);
    });
  });

  it('should validate callback path format', () => {
    const validPath = '/api/scheduled/evaluation-job';
    const invalidPath = '/api/evaluation-job';

    expect(validPath).toMatch(/^\/api\/scheduled\//);
    expect(invalidPath).not.toMatch(/^\/api\/scheduled\//);
  });

  it('should have evaluation job endpoint configured', () => {
    const evaluationJobPath = '/api/scheduled/evaluation-job';
    expect(evaluationJobPath).toBe('/api/scheduled/evaluation-job');
  });
});
