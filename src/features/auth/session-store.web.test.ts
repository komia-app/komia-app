import { sessionStore, SESSION_TOKEN_KEY } from "./session-store.web";

function fakeLocalStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

describe("sessionStore (web)", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      value: fakeLocalStorage(),
      configurable: true,
    });
  });

  it("round-trips a token", async () => {
    await sessionStore.setToken("web-token");
    await expect(sessionStore.getToken()).resolves.toBe("web-token");
    expect(globalThis.localStorage.getItem(SESSION_TOKEN_KEY)).toBe("web-token");
  });

  it("clears the token", async () => {
    await sessionStore.setToken("web-token");
    await sessionStore.clearToken();
    await expect(sessionStore.getToken()).resolves.toBeNull();
  });

  it("returns null when storage throws", async () => {
    Object.defineProperty(globalThis, "localStorage", {
      get() {
        throw new Error("blocked");
      },
      configurable: true,
    });
    await expect(sessionStore.getToken()).resolves.toBeNull();
  });

  it("does not throw when a storage call fails", async () => {
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: () => {
          throw new Error("blocked");
        },
        setItem: () => {
          throw new Error("quota");
        },
        removeItem: () => {
          throw new Error("blocked");
        },
      },
      configurable: true,
    });
    await expect(sessionStore.setToken("x")).resolves.toBeUndefined();
    await expect(sessionStore.clearToken()).resolves.toBeUndefined();
    await expect(sessionStore.getToken()).resolves.toBeNull();
  });
});
