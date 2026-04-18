export function faviconUrl(url: string): string {
  try {
    const { origin } = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`
  } catch {
    return ''
  }
}

export function formatBookmarkDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso))
  } catch {
    return ''
  }
}