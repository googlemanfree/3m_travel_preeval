import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const appSource = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

describe("routes canoniques des pages de service", () => {
  it("expose les pages demandées et redirige les anciens chemins sans dupliquer les composants", () => {
    expect(appSource).toContain('path={"/canada"} component={Canada}');
    expect(appSource).toContain('path={"/schengen"} component={Schengen}');
    expect(appSource).toContain('path={"/etudes"} component={VisaEtudes}');
    expect(appSource).toContain('path={"/billets"} component={Billets}');
    expect(appSource).toContain('path={"/formation"} component={Formation}');
    expect(appSource).toContain('Redirect to="/etudes"');
    expect(appSource).toContain('Redirect to="/billets"');
  });
});
