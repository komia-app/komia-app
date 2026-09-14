export const SESSION_TOKEN_KEY = "komia.session.token";

// Web is development-only, so a blocked or full localStorage degrades to "no token"
// rather than failing the app.
function withStorage<T>(fn: (storage: Storage) => T, fallback: T): T {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return fallback;
    return fn(storage);
  } catch {
    return fallback;
  }
}

export const sessionStore = {
  async getToken(): Promise<string | null> {
    return withStorage((s) => s.getItem(SESSION_TOKEN_KEY), null);
  },
  async setToken(token: string): Promise<void> {
    withStorage((s) => s.setItem(SESSION_TOKEN_KEY, token), undefined);
  },
  async clearToken(): Promise<void> {
    withStorage((s) => s.removeItem(SESSION_TOKEN_KEY), undefined);
  },
};
