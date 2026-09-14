import "@/lib/crypto-polyfill";

import { createClient } from "@base44/sdk";

const appId = process.env.EXPO_PUBLIC_BASE44_APP_ID;
const appBaseUrl = process.env.EXPO_PUBLIC_BASE44_APP_BASE_URL;

if (!appId || !appBaseUrl) {
  throw new Error(
    "Set EXPO_PUBLIC_BASE44_APP_ID and EXPO_PUBLIC_BASE44_APP_BASE_URL in .env",
  );
}

// serverUrl is the hosted app origin; the SDK appends /api itself, which is
// the same path the old Vite proxy forwarded.
export const base44 = createClient({
  appId,
  serverUrl: appBaseUrl,
  appBaseUrl,
  functionsVersion: process.env.EXPO_PUBLIC_BASE44_FUNCTIONS_VERSION,
});

export const base44Urls = {
  appBaseUrl,
  appId,
};
