export const CONTACT_DRAFT_STORAGE_KEY = "3m-contact-draft-v1";
export const CONTACT_QUEUE_STORAGE_KEY = "3m-contact-queue-v1";
export const OFFLINE_QUEUE_CHANGED_EVENT = "3m:offline-queue-changed";

export type ContactFormDraft = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

type QueuedAction<T> = {
  payload: T;
  queuedAt: string;
};

function canUseStorage() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

export function readLocalDraft<T>(key: string): T | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeLocalDraft<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Le stockage peut être plein ou désactivé : le formulaire continue à fonctionner.
  }
}

export function removeLocalDraft(key: string) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignorer les restrictions de stockage du navigateur.
  }
}

export function readQueuedAction<T>(key: string): QueuedAction<T> | null {
  return readLocalDraft<QueuedAction<T>>(key);
}

export function queueAction<T>(key: string, payload: T) {
  writeLocalDraft<QueuedAction<T>>(key, {
    payload,
    queuedAt: new Date().toISOString(),
  });
  window.dispatchEvent(new Event(OFFLINE_QUEUE_CHANGED_EVENT));
}

export function removeQueuedAction(key: string) {
  removeLocalDraft(key);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OFFLINE_QUEUE_CHANGED_EVENT));
  }
}
