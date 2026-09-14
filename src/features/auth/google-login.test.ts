import { buildGoogleLoginUrl, tokenFromRedirect } from "./google-login";

// expo-linking's real `parse` needs a native module that isn't available under
// jest-expo, so it's mocked minimally here to just parse query params from the URL.
jest.mock("expo-linking", () => ({
  parse: (url: string) => {
    const parsed = new URL(url.replace("komia://", "https://x/"));
    const queryParams: Record<string, string> = {};
    parsed.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    return { queryParams };
  },
  createURL: jest.fn(),
}));

jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));

jest.mock("@/lib/base44", () => ({
  base44Urls: { appBaseUrl: "https://example.base44.app", appId: "app123" },
}));

describe("buildGoogleLoginUrl", () => {
  it("targets the Base44 Google login endpoint with the app id and encoded return url", () => {
    expect(buildGoogleLoginUrl("komia://auth")).toBe(
      "https://example.base44.app/api/apps/auth/login?app_id=app123&from_url=komia%3A%2F%2Fauth",
    );
  });
});

describe("tokenFromRedirect", () => {
  it("reads access_token from the redirect url", () => {
    expect(tokenFromRedirect("komia://auth?access_token=abc123")).toBe("abc123");
  });

  it("returns null when the token is missing or empty", () => {
    expect(tokenFromRedirect("komia://auth")).toBeNull();
    expect(tokenFromRedirect("komia://auth?access_token=")).toBeNull();
  });
});
