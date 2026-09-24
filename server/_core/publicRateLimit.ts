/**
 * Limitation de débit pour les formulaires publics (aucune authentification requise).
 *
 * Fenêtre fixe en mémoire, une par processus : suffisant pour freiner un envoi en rafale ou l'usage d'un
 * formulaire pour envoyer des e-mails à des tiers. La table est bornée (`maxKeys`) pour ne pas grossir
 * sans fin sous attaque. Trois clés cumulées : l'adresse du client, l'adresse e-mail saisie, et un plafond
 * global qui borne le pire cas même si l'en-tête `x-forwarded-for` est falsifié par l'appelant.
 */
import { TRPCError } from "@trpc/server";

export type LimitDecision = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export function createFixedWindowLimiter(options: { limit: number; windowMs: number; maxKeys?: number }) {
  const { limit, windowMs, maxKeys = 5000 } = options;
  const windows = new Map<string, { count: number; resetAt: number }>();

  const prune = (now: number) => {
    for (const [key, entry] of Array.from(windows.entries())) if (entry.resetAt <= now) windows.delete(key);
    // Toujours trop plein après purge (attaque à clés uniques) : on repart de zéro plutôt que de grossir.
    if (windows.size >= maxKeys) windows.clear();
  };

  return {
    check(key: string, now = Date.now()): LimitDecision {
      const current = windows.get(key);
      if (!current || current.resetAt <= now) {
        if (!current && windows.size >= maxKeys) prune(now);
        windows.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true };
      }
      if (current.count >= limit) return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
      current.count += 1;
      return { allowed: true };
    },
    /** Pour les tests. */
    size: () => windows.size,
    reset: () => windows.clear(),
  };
}

type RequestLike = { headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string | undefined } } | undefined | null;

/**
 * Adresse du client, ou null quand aucune n'est identifiable (appel interne, test : une vraie requête HTTP a
 * toujours au moins l'adresse de son socket) : aucune limite n'est alors appliquée.
 */
export function clientKeyOf(request: RequestLike): string | null {
  if (!request) return null;
  const forwarded = request.headers?.["x-forwarded-for"];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim();
  return first || request.socket?.remoteAddress || null;
}

const formatWait = (seconds: number) => (seconds >= 120 ? `${Math.ceil(seconds / 60)} minutes` : `${seconds} seconde(s)`);

export type SubmissionGuardOptions = {
  perClient: { limit: number; windowMs: number };
  perEmail: { limit: number; windowMs: number };
  global: { limit: number; windowMs: number };
};

/** Trois limiteurs cumulés pour un formulaire public qui écrit en base et envoie un e-mail. */
export function createSubmissionGuard(options: SubmissionGuardOptions) {
  const byClient = createFixedWindowLimiter(options.perClient);
  const byEmail = createFixedWindowLimiter(options.perEmail);
  const overall = createFixedWindowLimiter({ ...options.global, maxKeys: 1 });

  return {
    /** Lève TOO_MANY_REQUESTS si l'une des limites est atteinte. Sans requête HTTP, ne fait rien. */
    assertAllowed(request: RequestLike, email: string, now = Date.now()) {
      const client = clientKeyOf(request);
      if (client === null) return;
      const checks: Array<[string, LimitDecision]> = [
        ["client", byClient.check(client, now)],
        ["email", byEmail.check(email.trim().toLowerCase(), now)],
        ["global", overall.check("global", now)],
      ];
      const refused = checks.find(([, decision]) => !decision.allowed);
      if (!refused) return;
      const decision = refused[1] as { allowed: false; retryAfterSeconds: number };
      const message =
        refused[0] === "email"
          ? `Plusieurs demandes ont déjà été envoyées avec cette adresse e-mail. Réessayez dans ${formatWait(decision.retryAfterSeconds)}, ou contactez-nous directement.`
          : `Trop de demandes envoyées depuis votre connexion. Réessayez dans ${formatWait(decision.retryAfterSeconds)}.`;
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message });
    },
    reset() {
      byClient.reset();
      byEmail.reset();
      overall.reset();
    },
  };
}

/** Réglage des formulaires d'évaluation : large pour un usage normal (famille, agence), serré contre l'abus. */
export const EVALUATION_SUBMISSION_LIMITS: SubmissionGuardOptions = {
  perClient: { limit: 8, windowMs: 60 * 60_000 },
  perEmail: { limit: 3, windowMs: 60 * 60_000 },
  global: { limit: 150, windowMs: 60 * 60_000 },
};
