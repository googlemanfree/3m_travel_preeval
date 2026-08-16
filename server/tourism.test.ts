import { describe, expect, it } from "vitest";
import { buildTourismServiceTypes } from "./routers/tourism";
describe("packs Tourisme", () => { it("compose un pack Explorer", () => expect(buildTourismServiceTypes("explorer", ["hotel"])).toEqual(["hotel", "vehicle", "pack"])); it("préserve le véhicule seul", () => expect(buildTourismServiceTypes(undefined, ["vehicle"])).toEqual(["vehicle"])); });
