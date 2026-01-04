interface StorageInterface {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

class SafeStorage implements StorageInterface {
  private storage: Storage | null = null
  private fallback: Map<string, string> = new Map()

  constructor(storageType: "localStorage" | "sessionStorage" = "localStorage") {
    try {
      const testStorage = storageType === "localStorage" ? window.localStorage : window.sessionStorage
      // Test if storage is available and working
      const testKey = "__storage_test__"
      testStorage.setItem(testKey, "test")
      testStorage.removeItem(testKey)
      this.storage = testStorage
    } catch {
      this.storage = null
    }
  }

  getItem(key: string): string | null {
    try {
      if (this.storage) {
        return this.storage.getItem(key)
      }
      return this.fallback.get(key) || null
    } catch {
      return this.fallback.get(key) || null
    }
  }

  setItem(key: string, value: string): void {
    try {
      if (this.storage) {
        this.storage.setItem(key, value)
      }
      this.fallback.set(key, value)
    } catch {
      this.fallback.set(key, value)
    }
  }

  removeItem(key: string): void {
    try {
      if (this.storage) {
        this.storage.removeItem(key)
      }
      this.fallback.delete(key)
    } catch {
      this.fallback.delete(key)
    }
  }
}

// Create singleton instances
export const safeLocalStorage = new SafeStorage("localStorage")
export const safeSessionStorage = new SafeStorage("sessionStorage")

// Theme-specific storage utilities
export const STORAGE_KEYS = {
  THEME: "vrc-theme",
  CUSTOM_COLOR: "user-theme-color",
  THEME_PREFERENCES: "vrc-theme-preferences",
} as const

export const validateTheme = (theme: string): theme is "light" | "dark" | "chrome" | "system" => {
  return ["light", "dark", "chrome", "system"].includes(theme)
}

export const validateColor = (color: string): boolean => {
  return /^#[0-9A-F]{6}$/i.test(color)
}

export const getStoredTheme = (): "light" | "dark" | "chrome" | "system" => {
  const stored = safeLocalStorage.getItem(STORAGE_KEYS.THEME)
  return stored && validateTheme(stored) ? stored : "light"
}

export const getStoredCustomColor = (): string | null => {
  const stored = safeLocalStorage.getItem(STORAGE_KEYS.CUSTOM_COLOR)
  return stored && validateColor(stored) ? stored : null
}

export const setStoredTheme = (theme: "light" | "dark" | "chrome" | "system"): void => {
  safeLocalStorage.setItem(STORAGE_KEYS.THEME, theme)
}

export const setStoredCustomColor = (color: string): void => {
  if (validateColor(color)) {
    safeLocalStorage.setItem(STORAGE_KEYS.CUSTOM_COLOR, color)
  }
}

export const removeStoredCustomColor = (): void => {
  safeLocalStorage.removeItem(STORAGE_KEYS.CUSTOM_COLOR)
}
