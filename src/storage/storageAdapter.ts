import { storageGet, storageSet } from './browserAPI';

export interface Bookmark {
  id: number;
  title: string;
  url: string;
  groupId: string;
  tags: string[];
}

const STORAGE_KEY = 'bookmarks';

type StoredBookmark = [number, string, string, string, string];

function generateSimpleId(): number {
  return Date.now();
}

function normalizeTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags.filter((tag): tag is string => typeof tag === 'string');
  }

  if (typeof tags === 'string' && tags.trim()) {
    return [tags.trim()];
  }

  return [];
}

function normalizeId(id: unknown): number {
  if (typeof id === 'number' && Number.isFinite(id)) {
    return Math.trunc(id);
  }

  if (typeof id === 'string') {
    const parsed = Number(id);
    if (Number.isFinite(parsed)) {
      return Math.trunc(parsed);
    }

    // Deterministically map string ids (UUIDs) to numeric ids using a
    // non-cryptographic hash. This avoids generating new Date-based ids on
    // each save which could collide across multiple items saved in the same
    // millisecond.
    let h = 2166136261 >>> 0;
    for (let i = 0; i < id.length; i++) {
      h = Math.imul(h ^ id.charCodeAt(i), 16777619) >>> 0;
    }
    return h;
  }

  return generateSimpleId();
}

function normalizeBookmark(bookmark: unknown): Bookmark {
  if (Array.isArray(bookmark)) {
    const [id, title, url, groupId, tags] = bookmark as StoredBookmark;

    return {
      id: normalizeId(id),
      title: typeof title === 'string' ? title : '',
      url: typeof url === 'string' ? url : '',
      groupId: typeof groupId === 'string' ? groupId : '',
      tags: normalizeTags(tags),
    };
  }

  if (!bookmark || typeof bookmark !== 'object') {
    return {
      id: generateSimpleId(),
      title: '',
      url: '',
      groupId: '',
      tags: [],
    };
  }

  const record = bookmark as Record<string, unknown>;

  return {
    id: normalizeId(record.id),
    title: typeof record.title === 'string' ? record.title : '',
    url: typeof record.url === 'string' ? record.url : '',
    groupId: typeof record.groupId === 'string' ? record.groupId : '',
    tags: normalizeTags(record.tags),
  };
}

function encodeBookmark(bookmark: Bookmark): StoredBookmark {
  return [
    normalizeId(bookmark.id),
    bookmark.title,
    bookmark.url,
    bookmark.groupId,
    bookmark.tags.join(', '),
  ];
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

  // Normalize into the in-memory shape but DO NOT rewrite storage automatically.
  // Automatic rewrites caused data to be overwritten when IDs couldn't be parsed
  // (e.g. UUID strings). Keep load non-destructive; writes will always use the
  // compact encoding via `saveBookmarks` when the user performs a save.
  const normalized = data.map((bookmark) => normalizeBookmark(bookmark));
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
    [STORAGE_KEY]: bookmarks.map((bookmark) => encodeBookmark(bookmark)),
  });
}