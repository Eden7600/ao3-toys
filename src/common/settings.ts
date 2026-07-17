import { localExtStorage } from "@webext-core/storage";

/**
 * Converts a value to a plain object, removing any Proxy wrappers
 * that might be added by reactive frameworks like Vue
 */
function toPlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export {
  defaultSettings,
  normalizeStoredSettings,
  type Settings,
  type StoredSettings,
} from "@src/common/settings-schema";
import {
  normalizeStoredSettings,
  type Settings,
  type StoredSettings,
} from "@src/common/settings-schema";

const SETTINGS_STORAGE_KEY = "settings";

export async function getAllSettings(): Promise<Settings> {
  const storedSettings = (await localExtStorage.getItem(
    SETTINGS_STORAGE_KEY,
  )) as StoredSettings | null;

  return normalizeStoredSettings(storedSettings);
}

export async function getSetting<T extends keyof Settings>(
  key: T,
): Promise<Settings[T]> {
  const settings = await getAllSettings();

  return settings[key];
}

export async function setSetting<T extends keyof Settings>(
  key: T,
  value: Settings[T],
): Promise<void> {
  console.log(`Setting ${key} to:`, value);
  const currentSettings = await getAllSettings();
  const updatedSettings = { ...currentSettings, [key]: value };
  await localExtStorage.setItem(
    SETTINGS_STORAGE_KEY,
    toPlainObject(updatedSettings),
  );
}

export async function setAllSettings(
  newSettings: Partial<Settings>,
): Promise<void> {
  console.log("Setting all settings to:", newSettings);
  const currentSettings = await getAllSettings();
  const updatedSettings = { ...currentSettings, ...newSettings };
  await localExtStorage.setItem(
    SETTINGS_STORAGE_KEY,
    toPlainObject(updatedSettings),
  );
}

export async function resetAllSettings(): Promise<void> {
  console.log("Resetting all settings to defaults");
  await localExtStorage.removeItem(SETTINGS_STORAGE_KEY);
}
