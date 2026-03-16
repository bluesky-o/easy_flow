import { storageGet, storageSet } from './browserAPI';

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  groupId: string;
  tags: string[];
  createdAt: string;
}

const STORAGE_KEY = 'bookmarks';

/**
 * Retrieves all bookmarks from extension local storage.
 * Returns an empty array if nothing is stored yet.
 *
 * @returns {Promise<Bookmark[]>}
 */
export async function getBookmarks(): Promise<Bookmark[]> {
  const result = await storageGet([STORAGE_KEY]);
  const data = result[STORAGE_KEY];
  return Array.isArray(data) ? (data as Bookmark[]) : [];
}

/**
 * Overwrites the entire bookmarks array in extension local storage.
 *
 * @param {Bookmark[]} bookmarks - Full array to persist
 * @returns {Promise<void>}
 */
export async function saveBookmarks(bookmarks: Bookmark[]): Promise<void> {
  await storageSet({ [STORAGE_KEY]: bookmarks });
}