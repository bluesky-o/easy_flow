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

function normalizeTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags.filter((tag): tag is string => typeof tag === 'string');
  }

  if (typeof tags === 'string' && tags.trim()) {
    return [tags.trim()];
  }

  return [];
}

function normalizeBookmark(bookmark: Partial<Bookmark> | Record<string, unknown>): Bookmark {
  return {
    id: typeof bookmark.id === 'string' && bookmark.id ? bookmark.id : crypto.randomUUID(),
    title: typeof bookmark.title === 'string' ? bookmark.title : '',
    url: typeof bookmark.url === 'string' ? bookmark.url : '',
    groupId: typeof bookmark.groupId === 'string' ? bookmark.groupId : '',
    tags: normalizeTags(bookmark.tags),
    createdAt: typeof bookmark.createdAt === 'string' ? bookmark.createdAt : new Date().toISOString(),
  };
}

/**
 * Retrieves all bookmarks from extension local storage.
 * Returns an empty array if nothing is stored yet.
 *
 * @returns {Promise<Bookmark[]>}
 */
export async function getBookmarks(): Promise<Bookmark[]> {
  const result = await storageGet([STORAGE_KEY]);
  const data = result[STORAGE_KEY];
  if (!Array.isArray(data)) return [];

  const normalized = data.map((bookmark) => normalizeBookmark(bookmark as Record<string, unknown>));
  const needsRewrite = JSON.stringify(normalized) !== JSON.stringify(data);

  if (needsRewrite) {
    await saveBookmarks(normalized);
  }

  return normalized;
}

/**
 * Overwrites the entire bookmarks array in extension local storage.
 *
 * @param {Bookmark[]} bookmarks - Full array to persist
 * @returns {Promise<void>}
 */
export async function saveBookmarks(bookmarks: Bookmark[]): Promise<void> {
  await storageSet({
    [STORAGE_KEY]: bookmarks.map((bookmark) => normalizeBookmark(bookmark)),
  });
}