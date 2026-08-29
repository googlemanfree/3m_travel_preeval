import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("initial render order", () => {
  it("does not ship a blue boot splash or a timeout replacement", () => {
    const html = read("client/index.html");
    expect(html).not.toContain("boot-fallback");
    expect(html).not.toContain("BOOT_TIMEOUT_MS");
    expect(html.match(/<script type=\"module\" src=\"\/src\/main\.tsx\"><\/script>/g)).toHaveLength(1);
  });

  it("keeps prerender content-only so React owns header and footer order", () => {
    const prerender = read("server/publicPrerender.ts");
    expect(prerender).toContain('const body = `<main class="seo-prerender"');
    expect(prerender).not.toContain('data-prerendered="true"><header>');
    expect(prerender).not.toContain('</main><footer>');
  });
});
