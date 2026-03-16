const _globalBrowser = (globalThis as unknown as Record<string, unknown>)['browser'] as typeof browser | undefined;
const _nativeAPI = _globalBrowser?.storage?.local ? _globalBrowser : null;

/**
 * Reads one or more keys from extension local storage.
 *
 * @param {string | string[]} keys - Key(s) to retrieve
 * @returns {Promise<Record<string, unknown>>}
 */
export async function storageGet(
  keys: string | string[]
): Promise<Record<string, unknown>> {
  if (_nativeAPI) {
    // Firefox
    return _nativeAPI.storage.local.get(keys) as Promise<Record<string, unknown>>;
  }
  // Chrome
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(result as Record<string, unknown>);
      }
    });
  });
}

/**
 * Writes key-value pairs to extension local storage.
 *
 * @param {Record<string, unknown>} items - Object of key-value pairs to store
 * @returns {Promise<void>}
 */
export async function storageSet(items: Record<string, unknown>): Promise<void> {
  if (_nativeAPI) {
    // Firefox
    return _nativeAPI.storage.local.set(items) as Promise<void>;
  }
  // Chrome / Brave
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(items, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

/** Minimal shape of a tab object we actually use */
export interface CrossTab {
  id?: number;
  title?: string;
  url?: string;
}

/**
 * Returns the currently active tab in the current window.
 *
 * @returns {Promise<CrossTab | null>} Active tab or null if unavailable
 */
export async function getActiveTab(): Promise<CrossTab | null> {
  const queryInfo = { active: true, currentWindow: true };

  if (_nativeAPI) {
    // Firefox
    const tabs = await (_nativeAPI.tabs.query(queryInfo) as Promise<CrossTab[]>);
    return tabs?.[0] ?? null;
  }

  // Chrome
  return new Promise((resolve) => {
    chrome.tabs.query(queryInfo, (tabs) => {
      if (chrome.runtime.lastError || !tabs?.length) {
        resolve(null);
      } else {
        resolve(tabs[0] as CrossTab);
      }
    });
  });
}
