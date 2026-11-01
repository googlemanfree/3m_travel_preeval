import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { commitFromEnv, readCommitFromGitFiles, resolveBuildMarker } from "./publicBuildMarker";

const SHA = "7aa6649f0123456789abcdef0123456789abcdef";
const created: string[] = [];

function repo(files: Record<string, string>) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "marker-"));
  created.push(root);
  for (const [name, content] of Object.entries(files)) {
    const target = path.join(root, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  return root;
}

afterEach(() => {
  for (const dir of created.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe("commit du build lu sans l'exécutable git", () => {
  it("HEAD détaché", () => {
    const root = repo({ ".git/HEAD": `${SHA}\n` });
    expect(readCommitFromGitFiles(root, fs, path.join)).toBe("7aa6649f");
  });

  it("branche avec fichier de référence", () => {
    const root = repo({ ".git/HEAD": "ref: refs/heads/main\n", ".git/refs/heads/main": `${SHA}\n` });
    expect(readCommitFromGitFiles(root, fs, path.join)).toBe("7aa6649f");
  });

  it("branche présente seulement dans packed-refs", () => {
    const root = repo({ ".git/HEAD": "ref: refs/heads/main\n", ".git/packed-refs": `# pack-refs\n${SHA} refs/heads/main\n` });
    expect(readCommitFromGitFiles(root, fs, path.join)).toBe("7aa6649f");
  });

  it("worktree : .git est un fichier qui pointe vers le vrai dossier", () => {
    const root = repo({ ".git": "gitdir: real-git\n", "real-git/HEAD": `${SHA}\n` });
    expect(readCommitFromGitFiles(root, fs, path.join)).toBe("7aa6649f");
  });

  it("sans dépôt, ou avec une référence douteuse, rien n'est inventé", () => {
    expect(readCommitFromGitFiles(repo({ "a.txt": "x" }), fs, path.join)).toBeUndefined();
    expect(readCommitFromGitFiles(repo({ ".git/HEAD": "ref: ../../etc/passwd\n" }), fs, path.join)).toBeUndefined();
    expect(readCommitFromGitFiles(repo({ ".git/HEAD": "ref: refs/heads/main\n" }), fs, path.join)).toBeUndefined();
  });

  it("variables de la plateforme de déploiement", () => {
    expect(commitFromEnv({ SOURCE_COMMIT: SHA })).toBe("7aa6649f");
    expect(commitFromEnv({ GIT_COMMIT: "pas un commit" })).toBeUndefined();
    expect(commitFromEnv({})).toBeUndefined();
  });

  it("le marqueur final porte le commit retrouvé", () => {
    expect(resolveBuildMarker({}, () => "7aa6649f", new Date(Date.UTC(2026, 10, 1, 12, 5)))).toBe("7aa6649f.202611011205");
  });
});
