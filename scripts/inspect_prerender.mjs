import { readFile } from "node:fs/promises";
const source = await readFile(new URL("../server/publicPrerender.ts", import.meta.url), "utf8");
console.log("source_has_legal", source.includes("RC/YAO/2019/A/2567 · NIU M092618996818Q"));
console.log("source_legal_index", source.indexOf("RC/YAO/2019/A/2567"));
