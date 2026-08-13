import { lazy, type ComponentType, type LazyExoticComponent } from "react";

export const LAZY_PAGE_TIMEOUT_MS = 15_000;
export const CHUNK_RELOAD_NOTICE_KEY = "3m_chunk_reload_notice";
const LAZY_PAGE_TIMEOUT_MESSAGE =
  "Failed to fetch dynamically imported module: page load timed out after 15000ms";

type LazyModule<T extends ComponentType<unknown>> = { default: T };
type LazyLoader<T extends ComponentType<unknown>> = () => Promise<LazyModule<T>>;

/**
 * Wraps a React.lazy loader with a finite timeout. A stalled module request
 * must reject so the existing ErrorBoundary/chunk recovery flow can reload the
 * page once instead of leaving the global Suspense fallback visible forever.
 */
export function lazyWithTimeout<T extends ComponentType<unknown>>(
  loader: LazyLoader<T>,
  timeoutMs = LAZY_PAGE_TIMEOUT_MS,
): LazyExoticComponent<T> {
  return lazy(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(LAZY_PAGE_TIMEOUT_MESSAGE));
      }, timeoutMs);
    });

    return Promise.race([loader(), timeout]).finally(() => {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    });
  });
}
