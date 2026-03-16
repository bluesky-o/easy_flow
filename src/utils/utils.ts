/**
 * Parses a comma-separated tag string into a trimmed, deduplicated array.
 * Filters out empty strings caused by trailing commas or double spaces.
 *
 * @param {string | null | undefined} input - Raw tag string e.g. "vue, js, , dev"
 * @returns {string[]} Cleaned array e.g. ["vue", "js", "dev"]
 */
export function parseTags(input: string | null | undefined): string[] {
  if (!input || typeof input !== 'string') return [];
  const seen = new Set<string>();
  return input
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0 && !seen.has(tag) && seen.add(tag) !== undefined);
}

/**
 * Validates whether a string is a well-formed URL.
 *
 * @param {string | null | undefined} url - URL string to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely truncates a string to a maximum length, appending "…" if cut.
 *
 * @param {string | null | undefined} str - Input string
 * @param {number} maxLength - Maximum allowed length (default: 60)
 * @returns {string} Truncated string or empty string if input is nullish
 */
export function truncate(str: string | null | undefined, maxLength = 60): string {
  if (!str || typeof str !== 'string') return '';
  return str.length > maxLength ? `${str.slice(0, maxLength)}…` : str;
}
