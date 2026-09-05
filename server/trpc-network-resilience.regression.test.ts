import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const readProjectFile = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("tRPC network resilience", () => {
  it("uses the same-origin API and retries transient fetch failures twice", () => {
    const main = readProjectFile("client/src/main.tsx");
    expect(main).toContain('url: "/api/trpc"');
    expect(main).toContain('cache: "no-store"');
    expect(main).toContain("const maxNetworkRetries = 2");
    expect(main).toContain("attempt === maxNetworkRetries");
    expect(main).toContain("await new Promise");
  });
});
