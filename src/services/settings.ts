import { storageGet, storageSet } from '../storage/browserAPI'

const SETTINGS_KEY = 'settings'

export interface AppSettings {
  isCompact?: boolean
}

export async function getSettings(): Promise<AppSettings> {
  const res = await storageGet([SETTINGS_KEY])
  const settings = res[SETTINGS_KEY]
  if (settings && typeof settings === 'object') return settings as AppSettings
  return {}
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await storageSet({ [SETTINGS_KEY]: settings })
}
