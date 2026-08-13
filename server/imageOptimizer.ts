import { spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function optimizeImageBuffer(inputBuffer: Buffer, maxWidth = 1600, maxHeight = 1600, quality = 82): Buffer {
  const tmpIn = join(tmpdir(), `img-in-${randomUUID()}.bin`);
  const tmpOut = join(tmpdir(), `img-out-${randomUUID()}.webp`);

  try {
    writeFileSync(tmpIn, inputBuffer);
    const script = `
from PIL import Image
import sys

try:
    im = Image.open(sys.argv[1])
    if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
        bg = Image.new('RGB', im.size, (255, 255, 255))
        if im.mode == 'P':
            im = im.convert('RGBA')
        bg.paste(im, mask=im.split()[-1])
        im = bg
    else:
        im = im.convert('RGB')

    im.thumbnail((${maxWidth}, ${maxHeight}), Image.Resampling.LANCZOS)
    im.save(sys.argv[2], 'WEBP', quality=${quality}, method=6)
    sys.exit(0)
except Exception as e:
    print(str(e), file=sys.stderr)
    sys.exit(1)
`;
    const scriptPath = join(tmpdir(), `opt-${randomUUID()}.py`);
    writeFileSync(scriptPath, script);

    const result = spawnSync("python3", [scriptPath, tmpIn, tmpOut], { timeout: 15000 });
    try { unlinkSync(scriptPath); } catch {}

    if (result.status !== 0) {
      throw new Error(result.stderr?.toString() || "Erreur de traitement image Python");
    }

    const optimized = Buffer.from(require("fs").readFileSync(tmpOut));
    try { unlinkSync(tmpIn); } catch {}
    try { unlinkSync(tmpOut); } catch {}
    return optimized;
  } catch (err) {
    try { unlinkSync(tmpIn); } catch {}
    try { unlinkSync(tmpOut); } catch {}
    // Fallback direct si l'optimisation échoue
    return inputBuffer;
  }
}
