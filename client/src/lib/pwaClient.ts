export const isPwaPreviewHost = () =>
  /\.manus\.computer$|\.manuspre\.computer$|\.manuscomputer\.ai$/i.test(window.location.hostname);

export async function resetPwaCache() {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ("caches" in window) {
    const cacheKeys = await caches.keys();
    await Promise.all(cacheKeys.filter((key) => key.startsWith("3m-travel-pwa")).map((key) => caches.delete(key)));
  }

  sessionStorage.removeItem("3m_pwa_controller_reloaded");
  window.location.reload();
}

export function activatePwaUpdate(registration?: ServiceWorkerRegistration | null) {
  const waitingWorker = registration?.waiting;
  if (waitingWorker) waitingWorker.postMessage({ type: "SKIP_WAITING" });
  window.setTimeout(() => window.location.reload(), 700);
}
