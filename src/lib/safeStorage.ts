import { StateStorage } from "zustand/middleware";

/**
 * Safe localStorage wrapper that gracefully catches QuotaExceededError
 * and prevents the browser runtime from crashing when storing media or large states.
 */
export const safeStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(name);
    } catch (err) {
      console.warn(`[SafeStorage] Failed to read key "${name}":`, err);
      return null;
    }
  },

  setItem: (name: string, value: string): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(name, value);
    } catch (err: unknown) {
      const isQuota =
        err instanceof DOMException &&
        (err.name === "QuotaExceededError" ||
          err.code === 22 ||
          err.name === "NS_ERROR_DOM_QUOTA_REACHED");

      if (isQuota) {
        console.warn(
          `[SafeStorage] Quota exceeded while saving "${name}". Storing safely without crashing runtime.`
        );
      } else {
        console.warn(`[SafeStorage] Failed to write key "${name}":`, err);
      }
    }
  },

  removeItem: (name: string): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(name);
    } catch (err) {
      console.warn(`[SafeStorage] Failed to remove key "${name}":`, err);
    }
  },
};

