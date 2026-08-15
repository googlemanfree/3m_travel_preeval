import { randomBytes } from "node:crypto";
import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { parse as parseCookieHeader } from "cookie";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { candidates } from "../drizzle/schema";
import { getDb } from "./db";
import { storagePut } from "./storage";

const GOOGLE_STATE_COOKIE = "candidate_google_oauth_state";
export const GOOGLE_HANDOFF_COOKIE = "candidate_google_oauth_handoff";
const OAUTH_TTL_MS = 10 * 60 * 1000;
const HANDOFF_TTL_MS = 5 * 60 * 1000;
const SITE_URL = (process.env.SITE_URL || "https://www.3mtravelagency.com").replace(/\/$/, "");
const GOOGLE_REDIRECT_URI = `${SITE_URL}/api/auth/google/callback`;

type GoogleProfile = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

function isTrustedGooglePictureUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "lh3.googleusercontent.com" ||
        url.hostname.endsWith(".googleusercontent.com"))
    );
  } catch {
    return false;
  }
}

async function importGoogleProfilePicture(profile: GoogleProfile, candidate: typeof candidates.$inferSelect) {
  if (!profile.picture || candidate.avatarUrl || !isTrustedGooglePictureUrl(profile.picture)) {
    return candidate;
  }

  try {
    const response = await fetch(profile.picture, { redirect: "error" });
    const contentType = response.headers.get("content-type")?.split(";")[0].toLowerCase() || "";
    const contentLength = Number(response.headers.get("content-length") || 0);
    const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

    if (!response.ok || !acceptedTypes.has(contentType) || contentLength > 2 * 1024 * 1024) {
      return candidate;
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > 2 * 1024 * 1024) return candidate;

    const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const stored = await storagePut(`candidates/${candidate.id}/google-profile.${extension}`, bytes, contentType);
    const db = await getDb();
    if (!db) return candidate;

    await db
      .update(candidates)
      .set({
        avatarUrl: stored.url,
        avatarVerificationStatus: candidate.avatarVerificationStatus === "missing" ? "pending" : candidate.avatarVerificationStatus,
        avatarVerificationMethod: "gallery",
        avatarVerificationReason:
          candidate.avatarVerificationStatus === "missing"
            ? "Photo Google importée : validation du portrait requise."
            : candidate.avatarVerificationReason,
      })
      .where(eq(candidates.id, candidate.id));

    return {
      ...candidate,
      avatarUrl: stored.url,
      avatarVerificationStatus: candidate.avatarVerificationStatus === "missing" ? "pending" : candidate.avatarVerificationStatus,
    };
  } catch {
    return candidate;
  }
}

function oauthCookieOptions(req: Request) {
  const forwardedProto = req.header("x-forwarded-proto");
  const secure = process.env.NODE_ENV === "production" || forwardedProto === "https";
  // Le callback Google est une redirection cross-site. En production, None
  // garantit que le handoff reste disponible au premier appel tRPC après le
  // retour sur /login ; le mode local conserve Lax pour éviter d’exiger HTTPS.
  return { httpOnly: true, sameSite: secure ? ("none" as const) : ("lax" as const), secure, path: "/" };
}

export function isGoogleOAuthConfigured() {
  return Boolean(process.env.VITE_GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.JWT_SECRET);
}

export function buildGoogleAuthorizationUrl(state: string) {
  const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_OAUTH_NOT_CONFIGURED");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCode(code: string): Promise<GoogleProfile> {
  const clientId = process.env.VITE_GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenResponse.ok) throw new Error("GOOGLE_TOKEN_EXCHANGE_FAILED");

  const tokenPayload = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenPayload.access_token) throw new Error("GOOGLE_ACCESS_TOKEN_MISSING");

  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
  });
  if (!profileResponse.ok) throw new Error("GOOGLE_PROFILE_FETCH_FAILED");
  return profileResponse.json() as Promise<GoogleProfile>;
}

async function findOrCreateVerifiedCandidate(profile: GoogleProfile) {
  const email = profile.email?.trim().toLowerCase();
  if (!email || profile.email_verified !== true) throw new Error("GOOGLE_EMAIL_NOT_VERIFIED");

  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");

  const existing = await db.select().from(candidates).where(eq(candidates.email, email)).limit(1);
  if (existing.length) {
    const candidate = existing[0];
    if (!candidate.emailVerified) {
      await db.update(candidates).set({ emailVerified: true, verificationToken: null, verificationExpiresAt: null }).where(eq(candidates.id, candidate.id));
      return importGoogleProfilePicture(profile, { ...candidate, emailVerified: true });
    }
    return importGoogleProfilePicture(profile, candidate);
  }

  const generatedPassword = randomBytes(32).toString("hex");
  const passwordHash = await bcrypt.hash(generatedPassword, 12);
  await db.insert(candidates).values({
    fullName: profile.name?.trim() || email.split("@")[0],
    email,
    passwordHash,
    emailVerified: true,
    dossierStatus: "nouveau",
    destination: "autre",
  });
  const created = await db.select().from(candidates).where(eq(candidates.email, email)).limit(1);
  if (!created.length) throw new Error("CANDIDATE_CREATE_FAILED");
  return importGoogleProfilePicture(profile, created[0]);
}

export function registerGoogleCandidateOAuthRoutes(app: Express) {
  app.get("/api/auth/google/start", (req, res) => {
    if (!isGoogleOAuthConfigured()) {
      res.redirect(302, "/login?oauth_error=google_unavailable");
      return;
    }
    const state = randomBytes(32).toString("hex");
    res.cookie(GOOGLE_STATE_COOKIE, state, { ...oauthCookieOptions(req), maxAge: OAUTH_TTL_MS });
    res.redirect(302, buildGoogleAuthorizationUrl(state));
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const expectedState = parseCookieHeader(req.headers.cookie || "")[GOOGLE_STATE_COOKIE];
    res.clearCookie(GOOGLE_STATE_COOKIE, oauthCookieOptions(req));

    if (!code || !state || !expectedState || state !== expectedState || !isGoogleOAuthConfigured()) {
      res.redirect(302, "/login?oauth_error=google");
      return;
    }

    try {
      const profile = await exchangeCode(code);
      const candidate = await findOrCreateVerifiedCandidate(profile);
      const secret = process.env.JWT_SECRET!;
      const handoff = jwt.sign({ candidateId: candidate.id, type: "candidate_google_handoff" }, secret, { expiresIn: "5m" });
      res.cookie(GOOGLE_HANDOFF_COOKIE, handoff, { ...oauthCookieOptions(req), maxAge: HANDOFF_TTL_MS });
      res.redirect(302, "/login?oauth=google");
    } catch (error) {
      console.error("[GoogleOAuth] Candidate callback failed", error instanceof Error ? error.message : "unknown");
      res.redirect(302, "/login?oauth_error=google");
    }
  });
}
