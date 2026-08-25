import bcrypt from "bcryptjs";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { generateSecret, generateURI, verify } from "otplib";
import { and, eq, isNull } from "drizzle-orm";
import { securityRecoveryCodes, securityTotpFactors } from "../drizzle/schema";
import { getDb } from "./db";

export type TwoFactorActor = "admin" | "employer";

const encryptionKey = () => createHash("sha256").update(process.env.JWT_SECRET || "3m-local-mfa-key").digest();

function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${ciphertext.toString("base64url")}`;
}

function decryptSecret(value: string) {
  const [ivRaw, tagRaw, encryptedRaw] = value.split(".");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, "base64url")), decipher.final()]).toString("utf8");
}

const makeRecoveryCodes = () => Array.from({ length: 8 }, () => `${randomBytes(3).toString("hex").toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`);

export async function getTwoFactorStatus(actorType: TwoFactorActor, actorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Base indisponible.");
  const factor = (await db.select().from(securityTotpFactors).where(and(eq(securityTotpFactors.actorType, actorType), eq(securityTotpFactors.actorId, actorId))).limit(1))[0];
  return { enabled: Boolean(factor?.enabled), enrolledAt: factor?.enrolledAt ?? null };
}

export async function beginTwoFactorEnrollment(actorType: TwoFactorActor, actorId: number, label: string) {
  const db = await getDb();
  if (!db) throw new Error("Base indisponible.");
  const secret = generateSecret();
  const secretCiphertext = encryptSecret(secret);
  const current = (await db.select().from(securityTotpFactors).where(and(eq(securityTotpFactors.actorType, actorType), eq(securityTotpFactors.actorId, actorId))).limit(1))[0];
  if (current) await db.update(securityTotpFactors).set({ secretCiphertext, enabled: false, enrolledAt: null }).where(eq(securityTotpFactors.id, current.id));
  else await db.insert(securityTotpFactors).values({ actorType, actorId, secretCiphertext, enabled: false });
  return { otpAuthUri: generateURI({ issuer: "3M Travel & Services", label, secret }) };
}

export async function confirmTwoFactorEnrollment(actorType: TwoFactorActor, actorId: number, token: string) {
  const db = await getDb();
  if (!db) throw new Error("Base indisponible.");
  const factor = (await db.select().from(securityTotpFactors).where(and(eq(securityTotpFactors.actorType, actorType), eq(securityTotpFactors.actorId, actorId))).limit(1))[0];
  if (!factor) throw new Error("Commencez d’abord l’enrôlement 2FA.");
  const result = await verify({ secret: decryptSecret(factor.secretCiphertext), token });
  if (!result.valid) throw new Error("Code d’authentification invalide.");
  const recoveryCodes = makeRecoveryCodes();
  await db.delete(securityRecoveryCodes).where(and(eq(securityRecoveryCodes.actorType, actorType), eq(securityRecoveryCodes.actorId, actorId)));
  await db.insert(securityRecoveryCodes).values(await Promise.all(recoveryCodes.map(async (code) => ({ actorType, actorId, codeHash: await bcrypt.hash(code, 12) }))));
  await db.update(securityTotpFactors).set({ enabled: true, enrolledAt: new Date() }).where(eq(securityTotpFactors.id, factor.id));
  return { recoveryCodes };
}

export async function verifyTwoFactor(actorType: TwoFactorActor, actorId: number, token: string) {
  const db = await getDb();
  if (!db) throw new Error("Base indisponible.");
  const factor = (await db.select().from(securityTotpFactors).where(and(eq(securityTotpFactors.actorType, actorType), eq(securityTotpFactors.actorId, actorId), eq(securityTotpFactors.enabled, true))).limit(1))[0];
  if (!factor) return { required: false, valid: true, recovery: false };
  const normalized = token.trim().toUpperCase();
  const totp = await verify({ secret: decryptSecret(factor.secretCiphertext), token: normalized });
  if (totp.valid) return { required: true, valid: true, recovery: false };
  const codes = await db.select().from(securityRecoveryCodes).where(and(eq(securityRecoveryCodes.actorType, actorType), eq(securityRecoveryCodes.actorId, actorId), isNull(securityRecoveryCodes.usedAt)));
  for (const code of codes) {
    if (await bcrypt.compare(normalized, code.codeHash)) {
      await db.update(securityRecoveryCodes).set({ usedAt: new Date() }).where(eq(securityRecoveryCodes.id, code.id));
      return { required: true, valid: true, recovery: true };
    }
  }
  return { required: true, valid: false, recovery: false };
}
