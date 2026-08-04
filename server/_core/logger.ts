/**
 * Logger structuré — 3M Travel & Services
 *
 * Émet des logs JSON sur une seule ligne (format standard pour les
 * plateformes d'hébergement modernes : elles capturent automatiquement
 * stdout/stderr et permettent de filtrer/rechercher par champ ensuite).
 *
 * Usage :
 *   logger.info("admin.login.success", { email, adminType });
 *   logger.warn("admin.login.failed", { email, reason: "wrong_password" });
 *   logger.error("payment.webhook.failed", { orderId }, error);
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

function redact(context: LogContext): LogContext {
  // Ne jamais logger de secrets/données sensibles même si passés par erreur.
  const SENSITIVE_KEYS = ["password", "passwordHash", "token", "sessionToken", "authorization", "cardNumber", "cvv"];
  const clean: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
      clean[key] = "[REDACTED]";
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

function emit(level: LogLevel, event: string, context: LogContext = {}, err?: unknown) {
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...redact(context),
  };

  if (err) {
    if (err instanceof Error) {
      entry.error = { message: err.message, stack: err.stack, name: err.name };
    } else {
      entry.error = String(err);
    }
  }

  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (event: string, context?: LogContext) => emit("debug", event, context),
  info: (event: string, context?: LogContext) => emit("info", event, context),
  warn: (event: string, context?: LogContext) => emit("warn", event, context),
  error: (event: string, context?: LogContext, err?: unknown) => emit("error", event, context, err),
};

/**
 * Mesure la durée d'une opération et la journalise automatiquement.
 * Usage :
 *   const result = await withTiming("admin.login", { email }, () => doLogin());
 */
export async function withTiming<T>(
  event: string,
  context: LogContext,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    logger.info(`${event}.completed`, { ...context, durationMs: Date.now() - start });
    return result;
  } catch (err) {
    logger.error(`${event}.failed`, { ...context, durationMs: Date.now() - start }, err);
    throw err;
  }
}
