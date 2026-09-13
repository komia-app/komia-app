import * as SecureStore from "expo-secure-store";

import { sessionStore, SESSION_TOKEN_KEY } from "./session-store";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mocked = SecureStore as jest.Mocked<typeof SecureStore>;

describe("sessionStore (native)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("reads the token from secure storage", async () => {
    mocked.getItemAsync.mockResolvedValue("abc");
    await expect(sessionStore.getToken()).resolves.toBe("abc");
    expect(mocked.getItemAsync).toHaveBeenCalledWith(SESSION_TOKEN_KEY);
  });

  it("returns null when nothing is stored", async () => {
    mocked.getItemAsync.mockResolvedValue(null);
    await expect(sessionStore.getToken()).resolves.toBeNull();
  });

  it("writes the token", async () => {
    await sessionStore.setToken("xyz");
    expect(mocked.setItemAsync).toHaveBeenCalledWith(SESSION_TOKEN_KEY, "xyz");
  });

  it("clears the token", async () => {
    await sessionStore.clearToken();
    expect(mocked.deleteItemAsync).toHaveBeenCalledWith(SESSION_TOKEN_KEY);
  });
});
