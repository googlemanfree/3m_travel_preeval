import jwt from "jsonwebtoken";

export type PortraitProof = {
  type: "candidate_portrait";
  email: string;
  key: string;
  url: string;
  captureMethod: "camera" | "gallery";
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET est obligatoire pour vérifier un portrait.");
  return secret;
}

export function createPortraitProof(input: Omit<PortraitProof, "type">): string {
  return jwt.sign({ type: "candidate_portrait", ...input }, getJwtSecret(), {
    expiresIn: "15m",
    subject: input.email,
  });
}

export function verifyPortraitProof(token: string, candidateEmail: string, avatarUrl?: string): PortraitProof {
  try {
    const proof = jwt.verify(token, getJwtSecret()) as Partial<PortraitProof>;
    if (proof.type !== "candidate_portrait" || proof.email !== candidateEmail || !proof.key || !proof.url) {
      throw new Error("invalid portrait proof");
    }
    if (avatarUrl && proof.url !== avatarUrl) throw new Error("portrait URL mismatch");
    if (proof.captureMethod !== "camera" && proof.captureMethod !== "gallery") throw new Error("invalid capture method");
    return proof as PortraitProof;
  } catch {
    throw new Error("Le portrait n’est plus valide. Reprenez une photo puis réessayez.");
  }
}
