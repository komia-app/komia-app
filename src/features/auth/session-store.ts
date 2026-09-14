import * as SecureStore from "expo-secure-store";

export const SESSION_TOKEN_KEY = "komia.session.token";

export const sessionStore = {
  getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(SESSION_TOKEN_KEY);
  },
  setToken(token: string): Promise<void> {
    return SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
  },
  clearToken(): Promise<void> {
    return SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
  },
};
