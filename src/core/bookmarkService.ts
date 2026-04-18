import { getBookmarks, saveBookmarks } from '../storage/storageAdapter';
import type { Bookmark } from '../storage/storageAdapter';
import { isValidUrl } from '../utils/utils';
import { saveCollection } from '../services/collections';
import { storageGet, storageSet } from '../storage/browserAPI';

export type { Bookmark };

const BOOKMARK_ORDER_INITIALIZED_KEY = 'bookmarkOrderInitialized';

async function ensureBookmarkOrderInitialized(): Promise<Bookmark[]> {
  const [bookmarks, orderState] = await Promise.all([
    getBookmarks(),
    storageGet([BOOKMARK_ORDER_INITIALIZED_KEY]),
  ]);

  if (orderState[BOOKMARK_ORDER_INITIALIZED_KEY] === true) {
    return bookmarks;
  }

  const sortedBookmarks = [...bookmarks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  await Promise.all([
    saveBookmarks(sortedBookmarks),
    storageSet({ [BOOKMARK_ORDER_INITIALIZED_KEY]: true }),
  ]);

  return sortedBookmarks;
}

/**
 * Creates a new Bookmark object with a generated ID and timestamp.
 * Does NOT persist it - call {@link addBookmark} to save.
 *
 * @param {string} title   - Page title (falls back to URL if empty)
 * @param {string} url     - Page URL - must be a valid URL
 * @param {string} [groupId] - Optional group name (will be normalised)
 * @param {string[]} [tags]  - Optional tag array
 * @returns {Bookmark} Unsaved bookmark object
 * @throws {Error} If `url` is not a valid URL
 */
export function createBookmark(
  title: string,
  url: string,
  groupId?: string,
  tags?: string[]
): Bookmark {
  if (!isValidUrl(url)) {
    throw new Error(`createBookmark: invalid URL "${url}"`);
  }

  return {
    id: crypto.randomUUID(),
    title: title?.trim() || url,
    url: url.trim(),
    groupId: groupId?.trim() ?? '',
    tags: tags ?? [],
    createdAt: new Date().toISOString(),
  };
}

/**
 * Persists a new bookmark to storage.
 * Prevents duplicate URLs - if a bookmark with the same URL already exists,
 * the operation is skipped and `false` is returned.
 *
 * @param {Bookmark} bookmark - Bookmark to persist
 * @returns {Promise<boolean>} `true` if saved, `false` if duplicate
 */
export async function addBookmark(bookmark: Bookmark): Promise<boolean> {
  const existing = await ensureBookmarkOrderInitialized();
  const isDuplicate = existing.some((b) => b.url === bookmark.url);
  if (isDuplicate) return false;

  if (bookmark.groupId) {
    await saveCollection(bookmark.groupId);
  }

  await saveBookmarks([bookmark, ...existing]);
  return true;
}

/**
 * Removes a bookmark by its ID.
 * Silently does nothing if the ID is not found.
 *
 * @param {string} id - UUID of the bookmark to remove
 * @returns {Promise<boolean>} `true` if removed, `false` if not found
 */
export async function removeBookmark(id: string): Promise<boolean> {
  if (!id) return false;
  const existing = await ensureBookmarkOrderInitialized();
  const filtered = existing.filter((b) => b.id !== id);
  if (filtered.length === existing.length) return false; // nothing removed
  await saveBookmarks(filtered);
  return true;
}

/**
 * Persists an explicit bookmark display order.
 *
 * @param {Bookmark[]} bookmarks - Full ordered bookmark list
 * @returns {Promise<void>}
 */
export async function saveBookmarkOrder(bookmarks: Bookmark[]): Promise<void> {
  await Promise.all([
    saveBookmarks(bookmarks),
    storageSet({ [BOOKMARK_ORDER_INITIALIZED_KEY]: true }),
  ]);
}

/**
 * Retrieves all stored bookmarks.
 *
 * @returns {Promise<Bookmark[]>} All bookmarks in persisted display order
 */
export async function fetchBookmarks(): Promise<Bookmark[]> {
  return ensureBookmarkOrderInitialized();
}

/**
 * Finds a bookmark by its URL.
 * Useful for checking if the current tab is already bookmarked.
 *
 * @param {string} url - URL to look up
 * @returns {Promise<Bookmark | null>} Matching bookmark or null
 */
export async function findBookmarkByUrl(url: string): Promise<Bookmark | null> {
  if (!isValidUrl(url)) return null;
  const existing = await ensureBookmarkOrderInitialized();
  return existing.find((b) => b.url === url) ?? null;
}
