export const SESSION_TOKEN_KEY = "komia.session.token";

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export const sessionStore = {
  async getToken(): Promise<string | null> {
    return storage()?.getItem(SESSION_TOKEN_KEY) ?? null;
  },
  async setToken(token: string): Promise<void> {
    storage()?.setItem(SESSION_TOKEN_KEY, token);
  },
  async clearToken(): Promise<void> {
    storage()?.removeItem(SESSION_TOKEN_KEY);
  },
};
