const STORAGE_KEY = "safeInterview:hrUser";

/**
 * Сохранить данные HR после логина
 */
export function saveHrUser(user) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // игнорируем ошибки localStorage
  }
}

/**
 * Получить текущего HR (или null)
 */
export function getHrUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Очистить данные HR (логаут)
 */
export function clearHrUser() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}