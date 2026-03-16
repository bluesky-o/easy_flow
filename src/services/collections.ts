import { storageGet, storageSet } from '../storage/browserAPI'

const COLLECTION_KEY = 'collections'
const DEFAULT_COLLECTIONS: string[] = []

/**
 * Retrieves all saved collection names from storage.
 * Falls back to ["General"] if nothing is stored yet.
 *
 * @returns {Promise<string[]>} Array of collection name strings
 */
export async function getCollections(): Promise<string[]> {
  const result = await storageGet([COLLECTION_KEY])
  const data = result[COLLECTION_KEY]
  return Array.isArray(data) && data.length > 0 ? (data as string[]) : DEFAULT_COLLECTIONS
}

/**
 * Persists a new collection name to storage.
 * Silently ignores duplicates (case-insensitive).
 *
 * @param {string | null | undefined} name - Collection name to add
 * @returns {Promise<boolean>} true if added, false if duplicate or invalid
 */
export async function saveCollection(name: string | null | undefined): Promise<boolean> {
  if (!name || typeof name !== 'string') return false

  const trimmed = name.trim()
  if (!trimmed) return false

  const collections = await getCollections()
  const isDuplicate = collections.some(
    (c) => c.toLowerCase() === trimmed.toLowerCase()
  )
  if (isDuplicate) return false

  await storageSet({ [COLLECTION_KEY]: [...collections, trimmed] })
  return true
}

/**
 * Removes a collection by name from storage.
 *
 * @param {string} name - Collection name to remove
 * @returns {Promise<boolean>} true if removed, false if not found or protected
 */
export async function removeCollection(name: string): Promise<boolean> {
  if (!name) return false

  const collections = await getCollections()
  const filtered = collections.filter((c) => c !== name)
  if (filtered.length === collections.length) return false

  await storageSet({ [COLLECTION_KEY]: filtered })
  return true
}