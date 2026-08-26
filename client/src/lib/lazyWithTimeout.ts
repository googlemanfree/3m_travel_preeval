import { ComponentType, LazyExoticComponent, lazy } from "react";

export const LAZY_PAGE_TIMEOUT_MS = 15_000;
export const CHUNK_RELOAD_NOTICE_KEY = "3m_chunk_reload_notice";

export async function clearStaleClientCaches(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const registrations = await navigator.serviceWorker?.getRegistrations?.();
    await Promise.all((registrations ?? []).map((registration) => registration.unregister()));
  } catch {
    // Une politique de navigateur peut bloquer la gestion des service workers.
  }
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  } catch {
    // Le chargement peut continuer même si Cache Storage est indisponible.
  }
}
const LAZY_PAGE_TIMEOUT_MESSAGE =
  "Failed to fetch dynamically imported module: page load timed out after 15000ms";

type LazyModule<T extends ComponentType<unknown>> = { default: T };
type LazyLoader<T extends ComponentType<unknown>> = () => Promise<LazyModule<T>>;

/**
 * Wraps a React.lazy loader with a finite timeout and automatic retry logic
 * to prevent transient chunk load failures or network timeouts from throwing
 * unhandled "Oops" error screens to the user.
 */
export function lazyWithTimeout<T extends ComponentType<unknown>>(
  loader: LazyLoader<T>,
  timeoutMs = LAZY_PAGE_TIMEOUT_MS,
  retries = 2,
): LazyExoticComponent<T> {
  return lazy(async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        const timeout = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error(LAZY_PAGE_TIMEOUT_MESSAGE));
          }, timeoutMs);
        });

        const mod = await Promise.race([loader(), timeout]);
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        return mod;
      } catch (err) {
        lastError = err;
        if (attempt < retries) {
          // Attente courte exponentielle avant de retenter
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        }
      }
    }
    throw lastError;
  });
}
