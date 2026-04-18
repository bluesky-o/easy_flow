import { storageGet, storageSet } from '../storage/browserAPI'

const COLLECTION_KEY = 'collections'
const DEFAULT_COLLECTIONS: string[] = []

function arraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false
  return left.every((value, index) => value === right[index])
}

async function mutateCollections(
  mutator: (current: string[]) => string[]
): Promise<void> {
  const maxAttempts = 3

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const current = await getCollections()
    const next = mutator(current)

    await storageSet({ [COLLECTION_KEY]: next })

    const stored = await getCollections()
    if (arraysEqual(stored, next)) {
      return
    }
  }

  throw new Error('Failed to persist collections')
}

/**
 * Retrieves all saved collection names from storage.
 * Falls back to an empty list if nothing is stored yet.
 *
 * @returns {Promise<string[]>} Array of collection name strings
 */
export async function getCollections(): Promise<string[]> {
  const result = await storageGet([COLLECTION_KEY])
  const data = result[COLLECTION_KEY]
  return Array.isArray(data) ? (data as string[]) : DEFAULT_COLLECTIONS
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

  let added = false

  await mutateCollections((current) => {
    const isDuplicate = current.some((collection) => collection.toLowerCase() === trimmed.toLowerCase())
    if (isDuplicate) {
      return current
    }

    added = true
    return [...current, trimmed]
  })

  return added
}

/**
 * Overwrites the saved collection order.
 *
 * @param {string[]} collections - Full ordered collection list
 * @returns {Promise<void>}
 */
export async function setCollections(collections: string[]): Promise<void> {
  await mutateCollections(() => [...collections])
}

/**
 * Removes a collection by name from storage.
 *
 * @param {string} name - Collection name to remove
 * @returns {Promise<boolean>} true if removed, false if not found or protected
 */
export async function removeCollection(name: string): Promise<boolean> {
  if (!name) return false

  let removed = false

  await mutateCollections((current) => {
    const filtered = current.filter((collection) => collection !== name)
    removed = filtered.length !== current.length
    return filtered
  })

  return removed
}