import { storageGet, storageSet } from '../storage/browserAPI'

const COLLECTION_KEY = 'collections'
const DEFAULT_COLLECTIONS: CollectionState[] = []

export interface CollectionState {
  name: string
  isCollapsed: boolean
}

type StoredCollection = [string, number]

function arraysEqual(left: CollectionState[], right: CollectionState[]): boolean {
  if (left.length !== right.length) return false
  return left.every(
    (value, index) =>
      value.name === right[index].name && value.isCollapsed === right[index].isCollapsed
  )
}

function normalizeCollection(collection: unknown): CollectionState {
  if (Array.isArray(collection)) {
    const [name, isCollapsed] = collection as StoredCollection
    return {
      name: typeof name === 'string' ? name : '',
      isCollapsed: isCollapsed === 1,
    }
  }

  if (typeof collection === 'string') {
    return {
      name: collection,
      isCollapsed: false,
    }
  }

  if (collection && typeof collection === 'object') {
    const record = collection as Record<string, unknown>
    return {
      name: typeof record.name === 'string' ? record.name : '',
      isCollapsed: record.isCollapsed === true,
    }
  }

  return {
    name: '',
    isCollapsed: false,
  }
}

function encodeCollection(collection: CollectionState): StoredCollection {
  return [collection.name, collection.isCollapsed ? 1 : 0]
}

async function mutateCollections(
  mutator: (current: CollectionState[]) => CollectionState[]
): Promise<void> {
  const maxAttempts = 3

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const current = await getCollections()
    const next = mutator(current)

    await storageSet({ [COLLECTION_KEY]: next.map(encodeCollection) })

    const stored = await getCollections()
    if (arraysEqual(stored, next)) {
      return
    }
  }

  throw new Error('Failed to persist collections')
}

/**
 * Retrieves all saved collection records from storage.
 * Falls back to an empty list if nothing is stored yet.
 *
 * @returns {Promise<CollectionState[]>} Array of collection records
 */
export async function getCollections(): Promise<CollectionState[]> {
  const result = await storageGet([COLLECTION_KEY])
  const data = result[COLLECTION_KEY]
  return Array.isArray(data) ? data.map(normalizeCollection) : DEFAULT_COLLECTIONS
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
    const isDuplicate = current.some((collection) => collection.name.toLowerCase() === trimmed.toLowerCase())
    if (isDuplicate) {
      return current
    }

    added = true
    return [...current, { name: trimmed, isCollapsed: false }]
  })

  return added
}

/**
 * Overwrites the saved collection order.
 *
 * @param {CollectionState[]} collections - Full ordered collection list
 * @returns {Promise<void>}
 */
export async function setCollections(collections: CollectionState[]): Promise<void> {
  await mutateCollections(() => collections.map(normalizeCollection))
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
    const filtered = current.filter((collection) => collection.name !== name)
    removed = filtered.length !== current.length
    return filtered
  })

  return removed
}

export async function setCollectionCollapsed(name: string, isCollapsed: boolean): Promise<boolean> {
  if (!name) return false

  let updated = false

  await mutateCollections((current) => {
    const next = current.map((collection) => {
      if (collection.name !== name) return collection
      updated = collection.isCollapsed !== isCollapsed
      return { ...collection, isCollapsed }
    })

    return next
  })

  return updated
}