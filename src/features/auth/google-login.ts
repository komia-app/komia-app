import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { base44Urls } from "@/lib/base44";

WebBrowser.maybeCompleteAuthSession();

export function buildGoogleLoginUrl(returnUrl: string): string {
  const query = `app_id=${encodeURIComponent(base44Urls.appId)}&from_url=${encodeURIComponent(returnUrl)}`;
  return `${base44Urls.appBaseUrl}/api/apps/auth/login?${query}`;
}

export function tokenFromRedirect(url: string): string | null {
  const parsed = Linking.parse(url);
  const token = parsed.queryParams?.access_token;
  return typeof token === "string" && token.length > 0 ? token : null;
}

// Returns the access token, or null if the user cancelled or no token came back.
export async function startGoogleLogin(): Promise<string | null> {
  const returnUrl = Linking.createURL("auth");
  const result = await WebBrowser.openAuthSessionAsync(buildGoogleLoginUrl(returnUrl), returnUrl);
  if (result.type !== "success") return null;
  return tokenFromRedirect(result.url);
}
