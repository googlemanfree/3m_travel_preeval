import { readFile } from "node:fs/promises";
const source = await readFile(new URL("../server/publicPrerender.ts", import.meta.url), "utf8");
console.log("source_has_legal", source.includes("CM-NSI-01-2026-B13-01038 · NIU M092618996818Q"));
console.log("source_legal_index", source.indexOf("CM-NSI-01-2026-B13-01038"));
