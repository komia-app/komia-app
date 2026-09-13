# Expo Migration Plan A: Foundation, Auth, Map, Detail

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Vite frontend with an Expo SDK 57 app that boots on iOS, Android, and web, signs users in against the hosted Base44 backend, and ships the map and restaurant detail screens natively.

**Architecture:** Expo Router with native tabs and a shared stack group; a session provider that owns the auth token in secure storage and gates routes with `Stack.Protected`; TanStack Query hooks over the Base44 SDK for reads and writes; screens built from Expo UI universal components with colocated `StyleSheet` and tokens from `src/theme.ts`.

**Tech Stack:** Expo SDK 57 (React Native 0.86.3, React 19.2.3), expo-router 57, @expo/ui 57, react-native-maps 1.27.2, expo-secure-store, expo-web-browser, expo-location, @base44/sdk 0.8.x, @tanstack/react-query 5, TypeScript 6, jest-expo, pnpm 11.

**Spec:** `docs/superpowers/specs/2026-09-13-expo-migration-design.md`

**Plan B** (written after this plan has run) covers: My logs, Log detail, Profile, Onboarding, Search, MIA chat, final cleanup, README and CLAUDE.md rewrite.

## Global Constraints

- Branch: `expo-migration`. Never commit to `main`.
- Node 22.13 or newer. pnpm 11 (`packageManager` in `package.json`). Never use npm or yarn.
- `.npmrc` contains `node-linker=hoisted`. `pnpm-workspace.yaml` keeps its core-js build denial.
- Package versions are pinned exactly as listed in Task 1. Do not "upgrade" while implementing.
- All source is TypeScript under `src/`. File names are kebab-case.
- `src/app` contains routes only. Screen bodies live in `src/screens/<name>/`, shared UI in `src/components/`, data code in `src/features/<domain>/`.
- Styling is `StyleSheet.create` at the bottom of each component file. Colours, spacing, radii, and type sizes come from `src/theme.ts`. No hex literal appears in a screen or component file.
- Expo UI (`@expo/ui`) first for buttons, sheets, lists, sliders, and form groups. React Native primitives for layout and text inputs.
- Web is development-only. A screen must not crash on web, but it may be simplified there via a `.web.tsx` variant.
- Gates before every commit: `pnpm lint`, `pnpm typecheck`, `pnpm test` all pass clean.
- Commits: one logical change each, imperative subject line, no trailers of any kind, no emojis, no tool attribution.
- No emojis anywhere: code, copy, commits, docs.
- The Base44 backend (`base44/`) is not modified except `base44/config.jsonc`.

## Environment the executor needs

A `.env` file at the repo root (gitignored) with the three Base44 values. Copy them from the existing `.env.local` or the Base44 dashboard:

```
EXPO_PUBLIC_BASE44_APP_ID=<app id>
EXPO_PUBLIC_BASE44_APP_BASE_URL=https://<your-app>.base44.app
EXPO_PUBLIC_BASE44_FUNCTIONS_VERSION=<functions version, may be empty>
GOOGLE_MAPS_ANDROID_API_KEY=
```

Run-by-hand checks use `pnpm web` (opens a browser), `pnpm ios` (iOS simulator with Expo Go), and `pnpm android` (Android emulator with Expo Go). Nothing in this plan needs a development build.

## File map

| Path | Responsibility |
|---|---|
| `package.json`, `app.config.ts`, `tsconfig.json`, `eslint.config.js`, `.npmrc`, `.env.example` | Project config |
| `src/theme.ts` | Design tokens |
| `src/types/entities.ts` | Entity types from `base44/entities` |
| `src/lib/base44.ts` | The one SDK client |
| `src/lib/query-client.ts` | TanStack Query client |
| `src/features/auth/session-store.ts`, `.web.ts` | Token persistence |
| `src/features/auth/auth-errors.ts` | Classify SDK errors into session errors |
| `src/features/auth/session-provider.tsx` | Session state, sign in, sign out, refresh |
| `src/features/auth/google-login.ts` | Native Google login (spike) |
| `src/features/restaurants/keys.ts` | Query keys |
| `src/features/restaurants/payloads.ts` | Pure payload builders (tested) |
| `src/features/restaurants/queries.ts` | Read hooks |
| `src/features/restaurants/mutations.ts` | Save and log-visit hooks |
| `src/components/screen-loader.tsx` | Full-screen spinner |
| `src/components/text-field.tsx` | Labelled text input |
| `src/components/primary-button.tsx` | Brand button on top of Expo UI `Button` |
| `src/components/restaurant-card.tsx` | Card used by map sheet and lists |
| `src/components/rating-stars.tsx` | Read-only and tappable stars |
| `src/screens/auth/auth-shell.tsx` | Shared frame for auth screens |
| `src/screens/auth/login.tsx`, `register.tsx`, `forgot-password.tsx`, `reset-password.tsx`, `not-registered.tsx` | Auth screen bodies |
| `src/screens/map/index.tsx`, `index.web.tsx`, `restaurant-sheet.tsx`, `filter.ts` | Map tab |
| `src/screens/restaurant-detail/index.tsx`, `info-rows.tsx` | Restaurant detail |
| `src/screens/log-visit/index.tsx` | Log-visit sheet body |
| `src/app/**` | Routes (listed per task) |

---

### Task 1: Replace the Vite app with the Expo scaffold

**Files:**
- Delete: `vite.config.js`, `index.html`, `tailwind.config.js`, `postcss.config.js`, `jsconfig.json`, `eslint.config.js`, `components.json` (if present), `src/` (entire old tree), `dist/` (if present)
- Create: `package.json` (rewrite), `app.config.ts`, `tsconfig.json`, `eslint.config.js`, `.npmrc`, `.env.example`, `src/app/_layout.tsx`, `src/app/index.tsx`, `assets/images/*`
- Modify: `.gitignore`, `base44/config.jsonc`, `README.md` (Run locally section only)

**Interfaces:**
- Produces: a bootable Expo project; `pnpm lint`, `pnpm typecheck`, `pnpm test` scripts.

- [ ] **Step 1: Confirm the branch and clean state**

Run: `git branch --show-current && git status --short`
Expected: `expo-migration` and no tracked changes (an untracked `.claude/` is fine).

- [ ] **Step 2: Delete the Vite app**

```bash
git rm -r -q src vite.config.js index.html tailwind.config.js postcss.config.js jsconfig.json eslint.config.js
git rm -q components.json 2>/dev/null || true
rm -rf dist node_modules
```

- [ ] **Step 3: Write `package.json`**

```json
{
  "name": "komia",
  "version": "1.0.0",
  "private": true,
  "main": "expo-router/entry",
  "packageManager": "pnpm@11.10.0",
  "scripts": {
    "start": "expo start",
    "ios": "expo start --ios",
    "android": "expo start --android",
    "web": "expo start --web",
    "lint": "expo lint",
    "typecheck": "tsc --noEmit",
    "test": "jest"
  },
  "jest": {
    "preset": "jest-expo",
    "testMatch": ["<rootDir>/src/**/*.test.ts", "<rootDir>/src/**/*.test.tsx"]
  },
  "dependencies": {
    "@base44/sdk": "^0.8.48",
    "@expo/ui": "~57.0.18",
    "@tanstack/react-query": "^5.102.8",
    "expo": "~57.0.22",
    "expo-constants": "~57.0.18",
    "expo-font": "~57.0.4",
    "expo-image": "~57.0.5",
    "expo-linking": "~57.0.10",
    "expo-location": "~57.0.17",
    "expo-router": "~57.0.21",
    "expo-secure-store": "~57.0.4",
    "expo-splash-screen": "~57.0.9",
    "expo-status-bar": "~57.0.1",
    "expo-symbols": "~57.0.3",
    "expo-system-ui": "~57.0.4",
    "expo-web-browser": "~57.0.3",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "react-native": "0.86.3",
    "react-native-gesture-handler": "~2.32.0",
    "react-native-maps": "1.27.2",
    "react-native-reanimated": "4.5.1",
    "react-native-safe-area-context": "~5.7.0",
    "react-native-screens": "~4.26.0",
    "react-native-web": "~0.21.0",
    "react-native-worklets": "0.10.1"
  },
  "devDependencies": {
    "@testing-library/react-native": "^14.0.1",
    "@types/jest": "^29.5.14",
    "@types/react": "~19.2.2",
    "eslint": "^9.39.0",
    "eslint-config-expo": "~57.0.2",
    "jest": "~29.7.0",
    "jest-expo": "~57.0.5",
    "typescript": "~6.0.3"
  }
}
```

- [ ] **Step 4: Write `.npmrc`, `tsconfig.json`, `eslint.config.js`, `.env.example`**

`.npmrc`:
```
node-linker=hoisted
```

`tsconfig.json`:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"],
      "@/assets/*": ["./assets/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"],
  "exclude": ["node_modules", "dist"]
}
```

`eslint.config.js`:
```js
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([expoConfig, { ignores: ["dist/*", ".expo/*"] }]);
```

`.env.example`:
```
EXPO_PUBLIC_BASE44_APP_ID=
EXPO_PUBLIC_BASE44_APP_BASE_URL=https://your-app.base44.app
EXPO_PUBLIC_BASE44_FUNCTIONS_VERSION=
GOOGLE_MAPS_ANDROID_API_KEY=
```

- [ ] **Step 5: Write `app.config.ts`**

```ts
import type { ConfigContext, ExpoConfig } from "expo/config";

const locationReason = "KOMIA shows restaurants near you on the map.";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "KOMIA",
  slug: "komia",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "komia",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  ios: {
    bundleIdentifier: "co.komia.app",
    supportsTablet: false,
    infoPlist: {
      NSLocationWhenInUseUsageDescription: locationReason,
    },
  },
  android: {
    package: "co.komia.app",
    adaptiveIcon: {
      backgroundColor: "#10375C",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: "single",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
    ["expo-location", { locationWhenInUsePermission: locationReason }],
    [
      "expo-splash-screen",
      {
        backgroundColor: "#10375C",
        image: "./assets/images/splash-icon.png",
        imageWidth: 120,
      },
    ],
    [
      "react-native-maps",
      { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? "" },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
```

Hex literals are allowed here because this is config, not a component.

- [ ] **Step 6: Copy placeholder image assets**

Create the default template once in the scratchpad and copy only the image files:

```bash
SCRATCH=/private/tmp/claude-501/-Users-ayano-komia-app/1275b366-587f-4c7e-81ce-bb4d5f877ab3/scratchpad
[ -d "$SCRATCH/komia-tpl" ] || (cd "$SCRATCH" && pnpm dlx create-expo-app@latest komia-tpl --template default --no-install)
mkdir -p assets/images
for f in icon.png splash-icon.png favicon.png android-icon-foreground.png android-icon-background.png android-icon-monochrome.png; do
  cp "$SCRATCH/komia-tpl/assets/images/$f" assets/images/$f
done
```

These are placeholders. Replacing them with KOMIA artwork is an open item for Plan B.

- [ ] **Step 7: Write the placeholder routes**

`src/app/_layout.tsx`:
```tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

`src/app/index.tsx`:
```tsx
import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.root}>
      <Text>KOMIA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center" },
});
```

- [ ] **Step 8: Update `.gitignore`**

Append these lines (keep everything already there):

```
# Expo
.expo/
web-build/
expo-env.d.ts
*.tsbuildinfo
/ios
/android
.kotlin/
*.orig.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision
.metro-health-check*

# env: keep the example
!.env.example
```

- [ ] **Step 9: Update `base44/config.jsonc`**

```jsonc
{
  "name": "untitled",
  "site": {
    "installCommand": "pnpm install",
    "buildCommand": "pnpm exec expo export --platform web",
    "serveCommand": "pnpm web",
    "outputDirectory": "./dist"
  }
}
```

- [ ] **Step 10: Install and run the gates**

```bash
pnpm install
pnpm typecheck
pnpm lint
```

Expected: `pnpm install` finishes without a build-script prompt (core-js stays denied). `pnpm typecheck` prints nothing. `pnpm lint` prints nothing. `expo-env.d.ts` and `.expo/` appear and are ignored by git.

If `pnpm lint` complains that `eslint-config-expo/flat` cannot be resolved, run `pnpm exec expo lint` once, accept its generated config, then re-apply the `ignores` line above.

- [ ] **Step 11: Boot on web**

Run: `pnpm web` and open the printed URL.
Expected: a page showing the text "KOMIA". Stop the server.

- [ ] **Step 12: Update README run section**

In `README.md`, replace the "Requirements" and "Run locally" sections with:

~~~markdown
## Requirements

- Node.js 22.13 or newer
- pnpm 11 (`corepack enable` picks the version from `package.json`)
- For iOS: Xcode with a simulator, or Expo Go on a device
- For Android: Android Studio with an emulator, or Expo Go on a device

## Run locally

```bash
pnpm install
cp .env.example .env   # fill in the Base44 values
pnpm ios               # or pnpm android, or pnpm web
```

The app talks to the hosted Base44 backend directly. There is no local backend in this setup; `base44 dev` is not used by the Expo app.
~~~

Leave the rest of the README for Plan B.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "Replace Vite frontend with Expo SDK 57 scaffold"
```

---

### Task 2: Theme, entity types, and the SDK client

**Files:**
- Create: `src/theme.ts`, `src/types/entities.ts`, `src/lib/base44.ts`, `src/lib/query-client.ts`

**Interfaces:**
- Produces: `theme.colors.*`, `theme.spacing.*`, `theme.radius.*`, `theme.text.*`; types `Restaurant`, `RestaurantLog`, `SavedList`, `ListItem`, `User`, `Follow`, `Recommendation`, `PriceLevel`, `Visibility`; `base44` client; `queryClient`.

- [ ] **Step 1: Write `src/theme.ts`**

```ts
export const colors = {
  navy: "#10375C",
  navyDeep: "#071b2d",
  yellow: "#F3C623",
  yellowSoft: "#fff8dc",
  orange: "#EB8317",
  surface: "#f8fafb",
  surfaceMuted: "#eef2f5",
  white: "#ffffff",
  ink: "#10375C",
  inkMuted: "#64748b",
  inkFaint: "#94a3b8",
  line: "#e2e8f0",
  danger: "#dc2626",
  dangerSoft: "#fee2e2",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const text = {
  title: { fontSize: 24, fontWeight: "800" as const, color: colors.ink },
  heading: { fontSize: 18, fontWeight: "800" as const, color: colors.ink },
  body: { fontSize: 15, fontWeight: "400" as const, color: colors.ink },
  bodyStrong: { fontSize: 15, fontWeight: "700" as const, color: colors.ink },
  caption: { fontSize: 12, fontWeight: "600" as const, color: colors.inkMuted },
  overline: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    color: colors.inkFaint,
  },
} as const;

export const theme = { colors, spacing, radius, text } as const;
```

- [ ] **Step 2: Write `src/types/entities.ts`**

```ts
// Hand-written from base44/entities/*.jsonc. When an entity file changes, change this file.

export type PriceLevel = "$" | "$$" | "$$$" | "$$$$";
export type Visibility = "private" | "friends" | "public";

interface BaseRecord {
  id: string;
  created_date?: string;
  updated_date?: string;
}

export interface Restaurant extends BaseRecord {
  name: string;
  description?: string;
  cuisines: string[];
  secondary_cuisines?: string[];
  price_level: PriceLevel;
  address?: string;
  neighborhood?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  average_rating?: number;
  rating_count?: number;
  tags?: string[];
  restaurant_type?: string;
  awards?: string[];
  phone?: string;
  website?: string;
  opening_hours?: string;
  vegetarian_friendly?: boolean;
  vegan_friendly?: boolean;
  outdoor_seating?: boolean;
  fine_dining?: boolean;
  casual?: boolean;
  romantic?: boolean;
  family_friendly?: boolean;
  is_featured?: boolean;
}

export interface RestaurantLog extends BaseRecord {
  user_id: string;
  restaurant_id: string;
  visited_at: string;
  overall_rating: number;
  food_rating?: number;
  service_rating?: number;
  ambiance_rating?: number;
  value_rating?: number;
  review?: string;
  dishes?: string[];
  price_paid?: number;
  occasion?: string;
  visibility?: Visibility;
  would_return?: boolean;
  photos?: string[];
  likes_count?: number;
}

export interface SavedList extends BaseRecord {
  user_id: string;
  name: string;
  description?: string;
  icon?: string;
  is_default?: boolean;
  visibility?: Visibility;
}

export interface ListItem extends BaseRecord {
  user_id: string;
  list_id: string;
  restaurant_id: string;
  note?: string;
  want_to_try?: boolean;
}

export interface Follow extends BaseRecord {
  follower_id: string;
  following_id: string;
  status?: "pending" | "accepted";
}

export interface Recommendation extends BaseRecord {
  user_id: string;
  restaurant_id: string;
  score: number;
  reasons?: string[];
  source?: "mia_profile" | "trending" | "social" | "editorial";
  status?: "new" | "viewed" | "saved" | "dismissed" | "visited";
  generated_at?: string;
  model_version?: string;
  feedback?: "like" | "dislike" | "none";
}

export interface TasteProfile {
  cuisines: string[];
  other_cuisines: string;
  experiences: string[];
  price: string | null;
  adventurousness: number | null;
  flavors: string[];
  disliked_flavors: string;
  priorities: string[];
  avoid: string[];
  avoid_notes: string;
}

export interface User extends BaseRecord {
  email: string;
  full_name?: string;
  role?: "admin" | "user";
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  home_city?: string;
  favorite_cuisines?: string[];
  disliked_cuisines?: string[];
  dietary_preferences?: string[];
  price_preferences?: PriceLevel[];
  taste_tags?: string[];
  preferred_distance_km?: number;
  mia_profile_summary?: string;
  mia_profile_version?: number;
  mia_last_updated?: string;
  onboarding_completed?: boolean;
  taste_profile?: TasteProfile;
}
```

- [ ] **Step 3: Write `src/lib/base44.ts`**

```ts
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
```

- [ ] **Step 4: Write `src/lib/query-client.ts`**

```ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});
```

- [ ] **Step 5: Wire the client into the placeholder route to prove it bundles**

Replace `src/app/index.tsx` with:

```tsx
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { base44 } from "@/lib/base44";
import { colors, spacing, text } from "@/theme";

export default function Index() {
  const [status, setStatus] = useState("checking backend");

  useEffect(() => {
    base44.app
      .getPublicSettings()
      .then(() => setStatus("backend reachable"))
      .catch((error: unknown) => setStatus(`backend error: ${String(error)}`));
  }, []);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>KOMIA</Text>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  title: text.title,
  status: text.caption,
});
```

- [ ] **Step 6: Run the gates and boot on iOS and web**

```bash
pnpm typecheck && pnpm lint
pnpm ios
```

Expected: the simulator shows "KOMIA" then "backend reachable". Then `pnpm web` shows the same.

If iOS logs `crypto.getRandomValues is not a function` (the SDK's `uuid` dependency), install `expo-crypto` with `pnpm exec expo install expo-crypto` and add `import "expo-crypto";` as the first line of `src/lib/base44.ts`. Record which happened in the commit message body.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add theme tokens, entity types, and the Base44 client"
```

---

### Task 3: Session store

**Files:**
- Create: `src/features/auth/session-store.ts`, `src/features/auth/session-store.web.ts`, `src/features/auth/session-store.test.ts`, `src/features/auth/session-store.web.test.ts`

**Interfaces:**
- Produces: `sessionStore: { getToken(): Promise<string | null>; setToken(token: string): Promise<void>; clearToken(): Promise<void> }` from `@/features/auth/session-store`.

- [ ] **Step 1: Write the failing native test**

`src/features/auth/session-store.test.ts`:
```ts
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test -- session-store.test`
Expected: FAIL, cannot find module `./session-store`.

- [ ] **Step 3: Write the native store**

`src/features/auth/session-store.ts`:
```ts
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
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm test -- session-store.test`
Expected: PASS, 4 tests.

- [ ] **Step 5: Write the failing web test**

`src/features/auth/session-store.web.test.ts`:
```ts
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
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `pnpm test -- session-store.web.test`
Expected: FAIL, cannot find module `./session-store.web`.

- [ ] **Step 7: Write the web store**

`src/features/auth/session-store.web.ts`:
```ts
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
```

- [ ] **Step 8: Run all tests and gates**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: 7 tests pass, no type or lint output.

- [ ] **Step 9: Commit**

```bash
git add src/features/auth
git commit -m "Add session token store for native and web"
```

---

### Task 4: Session provider, auth gate, and navigation skeleton

**Files:**
- Create: `src/features/auth/auth-errors.ts`, `src/features/auth/auth-errors.test.ts`, `src/features/auth/session-provider.tsx`, `src/components/screen-loader.tsx`
- Create routes: `src/app/(auth)/_layout.tsx`, `src/app/(auth)/login.tsx`, `src/app/(auth)/register.tsx`, `src/app/(auth)/forgot-password.tsx`, `src/app/(auth)/reset-password.tsx`, `src/app/(auth)/not-registered.tsx`, `src/app/onboarding.tsx`, `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/(map,search,lists,profile)/_layout.tsx`, `src/app/(tabs)/(map,search,lists,profile)/map.tsx`, `.../search.tsx`, `.../lists.tsx`, `.../profile.tsx`, `.../restaurant/[id].tsx`, `.../log/[id].tsx`, `src/app/mia.tsx`
- Modify: `src/app/_layout.tsx`
- Delete: `src/app/index.tsx`

**Interfaces:**
- Consumes: `sessionStore`, `base44`, `queryClient`, `User`.
- Produces: `useSession(): { state: SessionState; signIn(token: string): Promise<void>; signOut(): Promise<void>; refreshUser(): Promise<void> }`; `SessionState = { status: "loading" } | { status: "signed-out"; error?: SessionError } | { status: "signed-in"; user: User }`; `SessionError = "user_not_registered" | "unknown"`; `classifyAuthError(error: unknown): SessionError | null`; `<ScreenLoader />`.

- [ ] **Step 1: Write the failing classifier test**

`src/features/auth/auth-errors.test.ts`:
```ts
import { classifyAuthError } from "./auth-errors";

describe("classifyAuthError", () => {
  it("returns null for 401 (plain signed-out)", () => {
    expect(classifyAuthError({ status: 401 })).toBeNull();
  });

  it("returns user_not_registered for the Base44 403 reason", () => {
    const error = { status: 403, data: { extra_data: { reason: "user_not_registered" } } };
    expect(classifyAuthError(error)).toBe("user_not_registered");
  });

  it("returns null for 403 auth_required", () => {
    const error = { status: 403, data: { extra_data: { reason: "auth_required" } } };
    expect(classifyAuthError(error)).toBeNull();
  });

  it("returns unknown for anything else", () => {
    expect(classifyAuthError(new Error("network"))).toBe("unknown");
    expect(classifyAuthError({ status: 500 })).toBe("unknown");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test -- auth-errors`
Expected: FAIL, cannot find module `./auth-errors`.

- [ ] **Step 3: Write the classifier**

`src/features/auth/auth-errors.ts`:
```ts
export type SessionError = "user_not_registered" | "unknown";

interface Base44LikeError {
  status?: number;
  data?: { extra_data?: { reason?: string } };
}

function isBase44Error(error: unknown): error is Base44LikeError {
  return typeof error === "object" && error !== null && "status" in error;
}

// null means "the user is simply signed out": show login, no message.
export function classifyAuthError(error: unknown): SessionError | null {
  if (!isBase44Error(error)) return "unknown";
  if (error.status === 401) return null;
  if (error.status === 403) {
    const reason = error.data?.extra_data?.reason;
    if (reason === "user_not_registered") return "user_not_registered";
    return null;
  }
  return "unknown";
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm test -- auth-errors`
Expected: PASS, 4 tests.

- [ ] **Step 5: Write the screen loader**

`src/components/screen-loader.tsx`:
```tsx
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { colors } from "@/theme";

export function ScreenLoader() {
  return (
    <View style={styles.root}>
      <ActivityIndicator size="large" color={colors.navy} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
});
```

- [ ] **Step 6: Write the session provider**

`src/features/auth/session-provider.tsx`:
```tsx
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { base44, base44Urls } from "@/lib/base44";
import type { User } from "@/types/entities";

import { classifyAuthError, type SessionError } from "./auth-errors";
import { sessionStore } from "./session-store";

export type SessionState =
  | { status: "loading" }
  | { status: "signed-out"; error?: SessionError }
  | { status: "signed-in"; user: User };

interface SessionContextValue {
  state: SessionState;
  signIn(token: string): Promise<void>;
  signOut(): Promise<void>;
  refreshUser(): Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

// The SDK has no public way to drop its bearer header without a page redirect,
// so signing out replaces it with a value the backend will reject.
const SIGNED_OUT_TOKEN = "signed-out";

async function fetchUser(): Promise<User> {
  return (await base44.auth.me()) as User;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  const signIn = useCallback(async (token: string) => {
    base44.auth.setToken(token, false);
    await sessionStore.setToken(token);
    const user = await fetchUser();
    setState({ status: "signed-in", user });
  }, []);

  const signOut = useCallback(async () => {
    await sessionStore.clearToken();
    setState({ status: "signed-out" });
    base44.auth.setToken(SIGNED_OUT_TOKEN, false);
    try {
      await fetch(`${base44Urls.appBaseUrl}/api/apps/auth/logout`, { method: "GET" });
    } catch {
      // Best effort: the local token is already gone.
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const user = await fetchUser();
    setState({ status: "signed-in", user });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        await base44.app.getPublicSettings();
        const token = await sessionStore.getToken();
        if (!token) {
          if (!cancelled) setState({ status: "signed-out" });
          return;
        }
        base44.auth.setToken(token, false);
        const user = await fetchUser();
        if (!cancelled) setState({ status: "signed-in", user });
      } catch (error) {
        await sessionStore.clearToken();
        if (!cancelled) setState({ status: "signed-out", error: classifyAuthError(error) ?? undefined });
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ state, signIn, signOut, refreshUser }),
    [state, signIn, signOut, refreshUser],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside SessionProvider");
  return value;
}

export function useCurrentUser(): User {
  const { state } = useSession();
  if (state.status !== "signed-in") throw new Error("useCurrentUser called while signed out");
  return state.user;
}
```

Note on `signOut`: the SDK's `logout()` assigns `window.location.href`, which navigates away on web and throws on native. Replacing the bearer with a rejected value keeps the SDK from sending the old token; the next `signIn` replaces it.

- [ ] **Step 7: Write the root layout with the gate**

`src/app/_layout.tsx`:
```tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { ScreenLoader } from "@/components/screen-loader";
import { SessionProvider, useSession } from "@/features/auth/session-provider";
import { queryClient } from "@/lib/query-client";
import { colors } from "@/theme";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RootNavigator />
      </SessionProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const { state } = useSession();
  const loading = state.status === "loading";

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return <ScreenLoader />;

  const signedIn = state.status === "signed-in";
  const onboarded = signedIn && state.user.onboarding_completed === true;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }}>
      <Stack.Protected guard={signedIn && onboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="mia"
          options={{
            presentation: "formSheet",
            sheetAllowedDetents: [0.6, 1],
            sheetGrabberVisible: true,
            headerShown: false,
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={signedIn && !onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
```

- [ ] **Step 8: Write the auth group layout and placeholder auth routes**

`src/app/(auth)/_layout.tsx`:
```tsx
import { Stack } from "expo-router";

import { colors } from "@/theme";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface },
      }}
    />
  );
}
```

Each of `login.tsx`, `register.tsx`, `forgot-password.tsx`, `reset-password.tsx`, `not-registered.tsx` under `src/app/(auth)/` is a placeholder for now. Write `login.tsx` and copy the same shape for the other four, changing the label:

```tsx
import { StyleSheet, Text, View } from "react-native";

import { text } from "@/theme";

export default function LoginRoute() {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>login (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center" },
  label: text.caption,
});
```

`src/app/onboarding.tsx` and `src/app/mia.tsx` get the same placeholder with labels "onboarding (placeholder)" and "mia (placeholder)".

- [ ] **Step 9: Write the tabs layout**

`src/app/(tabs)/_layout.tsx`:
```tsx
import { NativeTabs } from "expo-router/unstable-native-tabs";

import { colors } from "@/theme";

export default function TabsLayout() {
  return (
    <NativeTabs
      tintColor={colors.yellow}
      backgroundColor={colors.navy}
      iconColor={{ default: colors.white, selected: colors.yellow }}
      labelStyle={{ default: { color: colors.white }, selected: { color: colors.yellow } }}
      indicatorColor={colors.navyDeep}
    >
      <NativeTabs.Trigger name="(map)">
        <NativeTabs.Trigger.Icon sf={{ default: "map", selected: "map.fill" }} md="map" />
        <NativeTabs.Trigger.Label>Map</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(lists)">
        <NativeTabs.Trigger.Icon sf={{ default: "list.bullet.rectangle", selected: "list.bullet.rectangle.fill" }} md="checklist" />
        <NativeTabs.Trigger.Label>My logs</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(profile)">
        <NativeTabs.Trigger.Icon sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }} md="person" />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(search)" role="search">
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

Search is last so iOS 26 can merge it with the search bar.

- [ ] **Step 10: Write the shared stack group layout and placeholder tab routes**

`src/app/(tabs)/(map,search,lists,profile)/_layout.tsx`:
```tsx
import { Stack } from "expo-router";

import { colors } from "@/theme";

export const unstable_settings = {
  map: { anchor: "map" },
  search: { anchor: "search" },
  lists: { anchor: "lists" },
  profile: { anchor: "profile" },
};

const titles: Record<string, string> = {
  map: "Map",
  search: "Search",
  lists: "My logs",
  profile: "Profile",
};

export default function TabStackLayout({ segment }: { segment: string }) {
  const screen = segment.match(/\((.*)\)/)?.[1] ?? "map";

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.navy,
        headerTitleStyle: { color: colors.navy },
        headerLargeTitleStyle: { color: colors.navy },
        headerStyle: { backgroundColor: colors.surface },
        contentStyle: { backgroundColor: colors.surface },
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen name={screen} options={{ title: titles[screen], headerLargeTitleEnabled: true }} />
      <Stack.Screen name="restaurant/[id]" options={{ title: "" }} />
      <Stack.Screen name="log/[id]" options={{ title: "" }} />
    </Stack>
  );
}
```

Under the same folder, `map.tsx`, `search.tsx`, `lists.tsx`, `profile.tsx`, `restaurant/[id].tsx`, and `log/[id].tsx` are placeholders with the same shape as the auth placeholder and labels "map", "search", "lists", "profile", "restaurant detail", "log detail".

- [ ] **Step 11: Delete the old index route and run the gates**

```bash
git rm -q src/app/index.tsx
pnpm test && pnpm typecheck && pnpm lint
```

Expected: 11 tests pass, no type or lint output. If typecheck reports an unknown `Stack.Screen` name, the route file for that name is missing or misspelled.

- [ ] **Step 12: Run on iOS and web, then commit**

Run: `pnpm ios`
Expected: the splash hides and the "login (placeholder)" screen shows, because no token is stored. Web shows the same.

The signed-in branch of the gate is exercised by the real login in Task 5.

```bash
git add -A
git commit -m "Add session provider, auth gate, and navigation skeleton"
```

---

### Task 5: Auth shell, form components, and the login screen

**Files:**
- Create: `src/components/text-field.tsx`, `src/components/primary-button.tsx`, `src/components/brand-mark.tsx`, `src/screens/auth/auth-shell.tsx`, `src/screens/auth/login.tsx`
- Modify: `src/app/(auth)/login.tsx`

**Interfaces:**
- Consumes: `useSession().signIn`, `base44.auth.loginViaEmailPassword`.
- Produces: `<TextField label value onChangeText secureTextEntry? keyboardType? autoCapitalize? autoComplete? />`, `<PrimaryButton onPress disabled? loading? variant?="filled"|"outlined">label</PrimaryButton>`, `<AuthShell title subtitle footer?>children</AuthShell>`, `<BrandMark />`.

- [ ] **Step 1: Write the brand mark**

`src/components/brand-mark.tsx`:
```tsx
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "@/theme";

export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, inverse && styles.dotInverse]} />
      <Text style={[styles.word, inverse && styles.wordInverse]}>KOMIA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dot: { width: 14, height: 14, borderRadius: radius.pill, backgroundColor: colors.yellow },
  dotInverse: { backgroundColor: colors.navy },
  word: { fontSize: 20, fontWeight: "900", letterSpacing: 2, color: colors.navy },
  wordInverse: { color: colors.white },
});
```

- [ ] **Step 2: Write the text field**

`src/components/text-field.tsx`:
```tsx
import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";

import { colors, radius, spacing, text } from "@/theme";

interface TextFieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  error?: string;
}

export function TextField({ label, error, ...input }: TextFieldProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.inkFaint}
        style={[styles.input, error ? styles.inputError : null]}
        {...input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: text.caption,
  input: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    fontSize: 15,
    color: colors.ink,
  },
  inputError: { borderColor: colors.danger },
  error: { ...text.caption, color: colors.danger },
});
```

- [ ] **Step 3: Write the primary button**

`src/components/primary-button.tsx`:
```tsx
import { Button, Host } from "@expo/ui";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { colors, radius } from "@/theme";

interface PrimaryButtonProps {
  children: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "filled" | "outlined";
}

export function PrimaryButton({ children, onPress, disabled, loading, variant = "filled" }: PrimaryButtonProps) {
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.navy} />
      </View>
    );
  }
  return (
    <Host matchContents>
      <Button
        variant={variant}
        onPress={onPress}
        disabled={disabled}
        style={variant === "filled" ? styles.filled : styles.outlined}
      >
        {children}
      </Button>
    </Host>
  );
}

const styles = StyleSheet.create({
  filled: { backgroundColor: colors.yellow, borderRadius: radius.lg, height: 48 },
  outlined: { borderColor: colors.line, borderWidth: 1, borderRadius: radius.lg, height: 48 },
  loading: { height: 48, alignItems: "center", justifyContent: "center" },
});
```

If `Button` ignores `backgroundColor` on iOS, keep the component and record it; the brand tint is polish, not behaviour.

- [ ] **Step 4: Write the auth shell**

`src/screens/auth/auth-shell.tsx`:
```tsx
import type { PropsWithChildren, ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandMark } from "@/components/brand-mark";
import { colors, radius, spacing, text } from "@/theme";

interface AuthShellProps extends PropsWithChildren {
  title: string;
  subtitle: string;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <BrandMark inverse />
          </View>
          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            <View style={styles.body}>{children}</View>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.navy },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "flex-end" },
  header: { padding: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: text.title,
  subtitle: { ...text.body, color: colors.inkMuted },
  body: { marginTop: spacing.lg, gap: spacing.lg },
  footer: { marginTop: spacing.xl, alignItems: "center" },
});
```

- [ ] **Step 5: Write the login screen body**

`src/screens/auth/login.tsx`:
```tsx
import { Link } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { TextField } from "@/components/text-field";
import { useSession } from "@/features/auth/session-provider";
import { base44 } from "@/lib/base44";
import { colors, spacing, text } from "@/theme";

import { AuthShell } from "./auth-shell";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function LoginScreen() {
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.loginViaEmailPassword(email.trim(), password);
      if (!result.access_token) throw new Error("No token returned");
      await signIn(result.access_token);
    } catch (e) {
      setError(errorMessage(e, "Invalid email or password"));
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your account"
      footer={
        <Text style={styles.footerText}>
          Don't have an account?{" "}
          <Link href="/register" style={styles.link}>
            Create one
          </Link>
        </Text>
      }
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="you@example.com"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        placeholder="Your password"
      />
      <View style={styles.forgot}>
        <Link href="/forgot-password" style={styles.link}>
          Forgot password?
        </Link>
      </View>
      <PrimaryButton onPress={submit} loading={loading} disabled={!email || !password}>
        Log in
      </PrimaryButton>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  error: { ...text.caption, color: colors.danger },
  forgot: { alignItems: "flex-end", marginTop: -spacing.sm },
  link: { ...text.bodyStrong, color: colors.navy },
  footerText: text.body,
});
```

The Google button is added in Task 7 once the spike decides how it works.

- [ ] **Step 6: Point the route at the screen**

`src/app/(auth)/login.tsx`:
```tsx
import { LoginScreen } from "@/screens/auth/login";

export default function LoginRoute() {
  return <LoginScreen />;
}
```

- [ ] **Step 7: Gates, then log in for real**

```bash
pnpm test && pnpm typecheck && pnpm lint
pnpm ios
```

Expected: the login screen renders. Enter a real account from the hosted app. After submit, the screen switches to the "map (placeholder)" tab (if that account has completed onboarding) or "onboarding (placeholder)". Kill and relaunch the app: it opens straight to the same place, proving the token was stored. Repeat on web.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Add login screen and shared auth form components"
```

---

### Task 6: Register with OTP, forgot password, reset password, not registered

**Files:**
- Create: `src/screens/auth/register.tsx`, `src/screens/auth/forgot-password.tsx`, `src/screens/auth/reset-password.tsx`, `src/screens/auth/not-registered.tsx`
- Modify: `src/app/(auth)/register.tsx`, `src/app/(auth)/forgot-password.tsx`, `src/app/(auth)/reset-password.tsx`, `src/app/(auth)/not-registered.tsx`, `src/app/(auth)/_layout.tsx`

**Interfaces:**
- Consumes: `base44.auth.register({ email, password })`, `base44.auth.verifyOtp({ email, otpCode })` (returns `{ access_token? }`), `base44.auth.resendOtp(email)`, `base44.auth.resetPasswordRequest(email)`, `base44.auth.resetPassword({ resetToken, newPassword })`, `useSession().signIn`, `useSession().state.error`.

- [ ] **Step 1: Write the register screen**

`src/screens/auth/register.tsx`:
```tsx
import { Link } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { TextField } from "@/components/text-field";
import { useSession } from "@/features/auth/session-provider";
import { base44 } from "@/lib/base44";
import { colors, text } from "@/theme";

import { AuthShell } from "./auth-shell";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function RegisterScreen() {
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState<"form" | "otp">("form");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const register = async () => {
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email: email.trim(), password });
      setStage("otp");
    } catch (e) {
      setError(errorMessage(e, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = (await base44.auth.verifyOtp({ email: email.trim(), otpCode: otp.trim() })) as {
        access_token?: string;
      };
      if (result?.access_token) {
        await signIn(result.access_token);
        return;
      }
      const login = await base44.auth.loginViaEmailPassword(email.trim(), password);
      await signIn(login.access_token);
    } catch (e) {
      setError(errorMessage(e, "Invalid verification code"));
      setLoading(false);
    }
  };

  const resend = async () => {
    setError("");
    setNotice("");
    try {
      await base44.auth.resendOtp(email.trim());
      setNotice("Code sent. Check your email.");
    } catch (e) {
      setError(errorMessage(e, "Failed to resend code"));
    }
  };

  if (stage === "otp") {
    return (
      <AuthShell
        title="Check your email"
        subtitle={`We sent a 6-digit code to ${email.trim()}`}
        footer={
          <Text style={styles.link} onPress={resend}>
            Send a new code
          </Text>
        }
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        <TextField
          label="Verification code"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          autoComplete="one-time-code"
          placeholder="123456"
        />
        <PrimaryButton onPress={verify} loading={loading} disabled={otp.trim().length < 6}>
          Verify
        </PrimaryButton>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start logging the places you love"
      footer={
        <Text style={styles.footerText}>
          Already have an account?{" "}
          <Link href="/login" style={styles.link}>
            Log in
          </Link>
        </Text>
      }
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="you@example.com"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        placeholder="At least 8 characters"
      />
      <TextField
        label="Confirm password"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoComplete="new-password"
        placeholder="Repeat your password"
      />
      <PrimaryButton
        onPress={register}
        loading={loading}
        disabled={!email || password.length < 8 || !confirm}
      >
        Create account
      </PrimaryButton>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  error: { ...text.caption, color: colors.danger },
  notice: { ...text.caption, color: colors.navy },
  link: { ...text.bodyStrong, color: colors.navy },
  footerText: text.body,
});
```

- [ ] **Step 2: Write the forgot password screen**

`src/screens/auth/forgot-password.tsx`:
```tsx
import { Link } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { TextField } from "@/components/text-field";
import { base44 } from "@/lib/base44";
import { colors, text } from "@/theme";

import { AuthShell } from "./auth-shell";

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email.trim());
      setSent(true);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Could not send the reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We will email you a reset link"
      footer={
        <Link href="/login" style={styles.link}>
          Back to log in
        </Link>
      }
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {sent ? (
        <Text style={styles.notice}>Check your inbox. Open the link on this device to set a new password.</Text>
      ) : (
        <>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <PrimaryButton onPress={submit} loading={loading} disabled={!email}>
            Send reset link
          </PrimaryButton>
        </>
      )}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  error: { ...text.caption, color: colors.danger },
  notice: text.body,
  link: { ...text.bodyStrong, color: colors.navy },
});
```

- [ ] **Step 3: Write the reset password screen**

The reset link carries `?token=`. On native the link arrives via the `komia://reset-password?token=...` scheme only if Base44 is configured to send it; otherwise the user opens it on web. The screen reads the param either way.

`src/screens/auth/reset-password.tsx`:
```tsx
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { TextField } from "@/components/text-field";
import { base44 } from "@/lib/base44";
import { colors, text } from "@/theme";

import { AuthShell } from "./auth-shell";

export function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (!token) {
      setError("This reset link is missing its token. Request a new one.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken: token, newPassword: password });
      router.replace("/login");
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Could not reset the password");
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Then log in with it"
      footer={
        <Link href="/login" style={styles.link}>
          Back to log in
        </Link>
      }
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextField
        label="New password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        placeholder="At least 8 characters"
      />
      <TextField
        label="Confirm password"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoComplete="new-password"
        placeholder="Repeat it"
      />
      <PrimaryButton onPress={submit} loading={loading} disabled={password.length < 8 || !confirm}>
        Save password
      </PrimaryButton>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  error: { ...text.caption, color: colors.danger },
  link: { ...text.bodyStrong, color: colors.navy },
});
```

- [ ] **Step 4: Write the not-registered screen**

`src/screens/auth/not-registered.tsx`:
```tsx
import { StyleSheet, Text } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { useSession } from "@/features/auth/session-provider";
import { text } from "@/theme";

import { AuthShell } from "./auth-shell";

export function NotRegisteredScreen() {
  const { signOut } = useSession();
  return (
    <AuthShell title="No access yet" subtitle="This account is not registered for KOMIA">
      <Text style={styles.body}>Ask an admin to add you, then log in again.</Text>
      <PrimaryButton onPress={() => void signOut()} variant="outlined">
        Log out
      </PrimaryButton>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  body: text.body,
});
```

- [ ] **Step 5: Route the auth group by session error**

Replace `src/app/(auth)/_layout.tsx`:
```tsx
import { Stack } from "expo-router";

import { useSession } from "@/features/auth/session-provider";
import { colors } from "@/theme";

export default function AuthLayout() {
  const { state } = useSession();
  const notRegistered = state.status === "signed-out" && state.error === "user_not_registered";

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface },
      }}
    >
      <Stack.Protected guard={notRegistered}>
        <Stack.Screen name="not-registered" />
      </Stack.Protected>
      <Stack.Protected guard={!notRegistered}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
      </Stack.Protected>
    </Stack>
  );
}
```

Then point each route at its screen, same shape as Task 5 step 6: `register.tsx` renders `RegisterScreen`, `forgot-password.tsx` renders `ForgotPasswordScreen`, `reset-password.tsx` renders `ResetPasswordScreen`, `not-registered.tsx` renders `NotRegisteredScreen`.

- [ ] **Step 6: Gates and run**

```bash
pnpm test && pnpm typecheck && pnpm lint
pnpm ios
```

Expected: from login, "Create one" opens register; registering a throwaway email moves to the code stage; the correct code signs in. "Forgot password?" sends and shows the notice. Web behaves the same.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add register, password reset, and not-registered screens"
```

---

### Task 7: Google login spike

This task decides how Google login works on native. Its output is a decision recorded in the spec, plus whichever code path the decision keeps.

**Files:**
- Create: `src/features/auth/google-login.ts`
- Maybe create: `src/app/auth/native.tsx` (bridge, only in outcome B)
- Modify: `src/screens/auth/login.tsx`, `src/screens/auth/register.tsx`, `docs/superpowers/specs/2026-09-13-expo-migration-design.md` (section 3, Google login)

**Interfaces:**
- Consumes: `base44Urls`, `useSession().signIn`.
- Produces: `startGoogleLogin(): Promise<string | null>` returning the access token or null when the user cancelled.

- [ ] **Step 1: Write the native Google login helper**

`src/features/auth/google-login.ts`:
```ts
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
```

- [ ] **Step 2: Add the Google button to login and register**

In `src/screens/auth/login.tsx` and `src/screens/auth/register.tsx` (form stage only), add above the first `TextField`:

```tsx
<PrimaryButton onPress={google} variant="outlined">
  Continue with Google
</PrimaryButton>
```

and the handler inside each component:

```tsx
const google = async () => {
  setError("");
  try {
    const token = await startGoogleLogin();
    if (token) await signIn(token);
  } catch (e) {
    setError(errorMessage(e, "Google login failed"));
  }
};
```

with `import { startGoogleLogin } from "@/features/auth/google-login";`.

- [ ] **Step 3: Run the spike on iOS**

Run: `pnpm ios`, tap "Continue with Google", complete the Google flow.

Observe which of these happens and write the letter down:

- **A.** The browser sheet closes and the app signs in. Base44 accepted the `komia://auth` return URL. Keep everything as written.
- **B.** The browser lands on a Base44 or web page, or an error about the redirect URL, and the sheet never closes on its own. Base44 refuses the custom scheme. Go to step 4.
- **C.** Google login itself errors before the redirect (for example the provider is not enabled for this app). Remove the Google button from both screens, keep `google-login.ts`, and go to step 5.

- [ ] **Step 4: Outcome B only: add the web bridge route**

Change `startGoogleLogin` so the return URL is the hosted web bridge, and the bridge forwards to the app:

```ts
export async function startGoogleLogin(): Promise<string | null> {
  const appReturnUrl = Linking.createURL("auth");
  const bridgeUrl = `${base44Urls.appBaseUrl}/auth/native?to=${encodeURIComponent(appReturnUrl)}`;
  const result = await WebBrowser.openAuthSessionAsync(buildGoogleLoginUrl(bridgeUrl), appReturnUrl);
  if (result.type !== "success") return null;
  return tokenFromRedirect(result.url);
}
```

`src/app/auth/native.tsx` (this route exists in the web export that Base44 publishes; on native it just goes home):
```tsx
import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

import { ScreenLoader } from "@/components/screen-loader";

export default function NativeAuthBridge() {
  const { access_token, to } = useLocalSearchParams<{ access_token?: string; to?: string }>();

  useEffect(() => {
    if (Platform.OS !== "web" || !access_token || !to) return;
    const target = new URL(to);
    target.searchParams.set("access_token", access_token);
    window.location.replace(target.toString());
  }, [access_token, to]);

  if (Platform.OS !== "web") return <Redirect href="/" />;
  return <ScreenLoader />;
}
```

Also add `<Stack.Screen name="auth/native" />` outside the `Stack.Protected` groups in `src/app/_layout.tsx` so the route is reachable while signed out. This route needs the web export published to Base44 (push to `main` after merge, then publish from the dashboard) before it can be tested end to end. Until then, record outcome B as "bridge written, untested" in the spec.

- [ ] **Step 5: Record the outcome in the spec**

In `docs/superpowers/specs/2026-09-13-expo-migration-design.md`, under "Google login", replace the sentence "Its outcome is recorded here when known:" with "Outcome (spike run on <date>): <A, B, or C, one sentence on what was observed>." Keep the three bullets beneath it.

- [ ] **Step 6: Gates and commit**

```bash
pnpm test && pnpm typecheck && pnpm lint
git add -A
git commit -m "Add native Google login and record the redirect spike outcome"
```

---

### Task 8: Restaurants data layer

**Files:**
- Create: `src/features/restaurants/keys.ts`, `src/features/restaurants/payloads.ts`, `src/features/restaurants/payloads.test.ts`, `src/features/restaurants/queries.ts`, `src/features/restaurants/mutations.ts`

**Interfaces:**
- Consumes: `base44.entities.*`, `useCurrentUser()`, entity types.
- Produces:
  - `restaurantKeys.all`, `restaurantKeys.detail(id)`, `logKeys.mine(userId)`, `listKeys.mine(userId)`, `listItemKeys.mine(userId)`
  - `buildLogVisitPayload({ userId, restaurantId, rating, review, today })`
  - `pickDefaultList(lists)`, `DEFAULT_LIST`
  - `useRestaurants()`, `useRestaurant(id)`, `useMyLogs()`, `useMyLists()`, `useMyListItems()`
  - `useSaveRestaurant()` returning a mutation with `mutateAsync(restaurant: Restaurant)`
  - `useLogVisit()` returning a mutation with `mutateAsync({ restaurant, rating, review })`

- [ ] **Step 1: Write the failing payload tests**

`src/features/restaurants/payloads.test.ts`:
```ts
import { buildLogVisitPayload, DEFAULT_LIST, pickDefaultList } from "./payloads";
import type { SavedList } from "@/types/entities";

describe("buildLogVisitPayload", () => {
  const base = { userId: "u1", restaurantId: "r1", today: new Date("2026-09-13T15:00:00Z") };

  it("marks a 4 or 5 rating as would_return", () => {
    const p = buildLogVisitPayload({ ...base, rating: 4, review: "" });
    expect(p).toEqual({
      user_id: "u1",
      restaurant_id: "r1",
      visited_at: "2026-09-13",
      overall_rating: 4,
      review: "",
      visibility: "friends",
      would_return: true,
    });
  });

  it("marks a 3 or lower as not would_return", () => {
    expect(buildLogVisitPayload({ ...base, rating: 3, review: "meh" }).would_return).toBe(false);
  });

  it("trims the review", () => {
    expect(buildLogVisitPayload({ ...base, rating: 5, review: "  great  " }).review).toBe("great");
  });
});

describe("pickDefaultList", () => {
  const list = (id: string, is_default?: boolean): SavedList => ({ id, user_id: "u1", name: id, is_default });

  it("returns the default list when present", () => {
    expect(pickDefaultList([list("a"), list("b", true)])?.id).toBe("b");
  });

  it("returns undefined when there is none", () => {
    expect(pickDefaultList([list("a")])).toBeUndefined();
    expect(pickDefaultList([])).toBeUndefined();
  });

  it("exposes the default list shape used on first save", () => {
    expect(DEFAULT_LIST).toEqual({ name: "Want to try", icon: "bookmark", is_default: true });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test -- payloads`
Expected: FAIL, cannot find module `./payloads`.

- [ ] **Step 3: Write the payload builders**

`src/features/restaurants/payloads.ts`:
```ts
import type { SavedList } from "@/types/entities";

export const DEFAULT_LIST = { name: "Want to try", icon: "bookmark", is_default: true } as const;

interface BuildLogVisitInput {
  userId: string;
  restaurantId: string;
  rating: number;
  review: string;
  today: Date;
}

export function buildLogVisitPayload({ userId, restaurantId, rating, review, today }: BuildLogVisitInput) {
  return {
    user_id: userId,
    restaurant_id: restaurantId,
    visited_at: today.toISOString().slice(0, 10),
    overall_rating: rating,
    review: review.trim(),
    visibility: "friends" as const,
    would_return: rating >= 4,
  };
}

export function pickDefaultList(lists: SavedList[]): SavedList | undefined {
  return lists.find((l) => l.is_default === true);
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm test -- payloads`
Expected: PASS, 6 tests.

- [ ] **Step 5: Write the query keys**

`src/features/restaurants/keys.ts`:
```ts
export const restaurantKeys = {
  all: ["restaurants"] as const,
  detail: (id: string) => ["restaurants", id] as const,
};

export const logKeys = {
  mine: (userId: string) => ["logs", userId] as const,
  detail: (id: string) => ["logs", "detail", id] as const,
};

export const listKeys = {
  mine: (userId: string) => ["lists", userId] as const,
};

export const listItemKeys = {
  mine: (userId: string) => ["list-items", userId] as const,
};
```

- [ ] **Step 6: Write the read hooks**

`src/features/restaurants/queries.ts`:
```ts
import { useQuery } from "@tanstack/react-query";

import { useCurrentUser } from "@/features/auth/session-provider";
import { base44 } from "@/lib/base44";
import type { ListItem, Restaurant, RestaurantLog, SavedList } from "@/types/entities";

import { listItemKeys, listKeys, logKeys, restaurantKeys } from "./keys";

export function useRestaurants() {
  return useQuery({
    queryKey: restaurantKeys.all,
    queryFn: async () => (await base44.entities.Restaurant.list()) as Restaurant[],
  });
}

export function useRestaurant(id: string) {
  return useQuery({
    queryKey: restaurantKeys.detail(id),
    queryFn: async () => (await base44.entities.Restaurant.get(id)) as Restaurant,
    enabled: id.length > 0,
  });
}

export function useMyLogs() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: logKeys.mine(user.id),
    queryFn: async () =>
      (await base44.entities.RestaurantLog.filter({ user_id: user.id }, "-visited_at")) as RestaurantLog[],
  });
}

export function useMyLists() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: listKeys.mine(user.id),
    queryFn: async () => (await base44.entities.SavedList.filter({ user_id: user.id })) as SavedList[],
  });
}

export function useMyListItems() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: listItemKeys.mine(user.id),
    queryFn: async () => (await base44.entities.ListItem.filter({ user_id: user.id })) as ListItem[],
  });
}
```

- [ ] **Step 7: Write the mutations**

`src/features/restaurants/mutations.ts`:
```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useCurrentUser } from "@/features/auth/session-provider";
import { base44 } from "@/lib/base44";
import type { ListItem, Restaurant, SavedList } from "@/types/entities";

import { listItemKeys, listKeys, logKeys } from "./keys";
import { buildLogVisitPayload, DEFAULT_LIST, pickDefaultList } from "./payloads";

export type SaveResult = "saved" | "already-saved";

export function useSaveRestaurant() {
  const user = useCurrentUser();
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (restaurant: Restaurant): Promise<SaveResult> => {
      const lists = (await base44.entities.SavedList.filter({ user_id: user.id })) as SavedList[];
      let list = pickDefaultList(lists);
      if (!list) {
        list = (await base44.entities.SavedList.create({ user_id: user.id, ...DEFAULT_LIST })) as SavedList;
      }
      const existing = (await base44.entities.ListItem.filter({
        user_id: user.id,
        list_id: list.id,
        restaurant_id: restaurant.id,
      })) as ListItem[];
      if (existing.length > 0) return "already-saved";
      await base44.entities.ListItem.create({
        user_id: user.id,
        list_id: list.id,
        restaurant_id: restaurant.id,
        want_to_try: true,
      });
      return "saved";
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: listKeys.mine(user.id) });
      void client.invalidateQueries({ queryKey: listItemKeys.mine(user.id) });
    },
  });
}

interface LogVisitInput {
  restaurant: Restaurant;
  rating: number;
  review: string;
}

export function useLogVisit() {
  const user = useCurrentUser();
  const client = useQueryClient();

  return useMutation({
    mutationFn: async ({ restaurant, rating, review }: LogVisitInput) => {
      const payload = buildLogVisitPayload({
        userId: user.id,
        restaurantId: restaurant.id,
        rating,
        review,
        today: new Date(),
      });
      await base44.entities.RestaurantLog.create(payload);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: logKeys.mine(user.id) });
    },
  });
}
```

- [ ] **Step 8: Gates and commit**

```bash
pnpm test && pnpm typecheck && pnpm lint
git add src/features/restaurants
git commit -m "Add restaurant queries and save and log-visit mutations"
```

If typecheck complains that `base44.entities.Restaurant` is not typed, the SDK exposes entities as `Record<string, EntityModule>`; the `as` casts above are the intended boundary. Do not add `any`.

---

### Task 9: Map tab

**Files:**
- Create: `src/components/rating-stars.tsx`, `src/components/restaurant-card.tsx`, `src/screens/map/filter.ts`, `src/screens/map/filter.test.ts`, `src/screens/map/restaurant-sheet.tsx`, `src/screens/map/index.tsx`, `src/screens/map/index.web.tsx`, `src/app/log-visit.tsx` (placeholder)
- Modify: `src/app/(tabs)/(map,search,lists,profile)/map.tsx`, `src/app/_layout.tsx`

**Interfaces:**
- Consumes: `useRestaurants`, `useSaveRestaurant`, `useLogVisit`, `Restaurant`.
- Produces: `matchesQuery(restaurant, query)`, `<RatingStars value onChange? size? />`, `<RestaurantCard restaurant onSave onLog compact? />`, `<RestaurantSheet restaurant onDismiss onSave onLog />`, `<MapScreen />`.

- [ ] **Step 1: Write the failing filter test**

`src/screens/map/filter.test.ts`:
```ts
import { matchesQuery } from "./filter";
import type { Restaurant } from "@/types/entities";

const r: Restaurant = {
  id: "1",
  name: "Salvo Patria",
  cuisines: ["Colombian"],
  price_level: "$$",
  neighborhood: "Chapinero",
  city: "Bogota",
  tags: ["brunch"],
};

describe("matchesQuery", () => {
  it("matches name, neighbourhood, cuisine, and tag, case-insensitively", () => {
    expect(matchesQuery(r, "salvo")).toBe(true);
    expect(matchesQuery(r, "CHAPINERO")).toBe(true);
    expect(matchesQuery(r, "colombian")).toBe(true);
    expect(matchesQuery(r, "brunch")).toBe(true);
  });

  it("does not match unrelated text", () => {
    expect(matchesQuery(r, "sushi")).toBe(false);
  });

  it("treats blank queries as match-all", () => {
    expect(matchesQuery(r, "   ")).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test -- screens/map/filter`
Expected: FAIL, cannot find module `./filter`.

- [ ] **Step 3: Write the filter**

`src/screens/map/filter.ts`:
```ts
import type { Restaurant } from "@/types/entities";

export function matchesQuery(r: Restaurant, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [r.name, r.neighborhood, r.city, ...(r.cuisines ?? []), ...(r.tags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `pnpm test -- screens/map/filter`
Expected: PASS, 3 tests.

- [ ] **Step 5: Write rating stars**

`src/components/rating-stars.tsx`:
```tsx
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "@/theme";

interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
}

export function RatingStars({ value, onChange, size = 20 }: RatingStarsProps) {
  return (
    <View style={styles.row} accessibilityRole={onChange ? "adjustable" : "text"} accessibilityLabel={`${value} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={onChange ? () => onChange(n) : undefined} disabled={!onChange} hitSlop={6}>
          <Text style={[styles.star, { fontSize: size }, n <= value ? styles.on : styles.off]}>*</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.xs },
  star: { fontWeight: "900", lineHeight: 24 },
  on: { color: colors.yellow },
  off: { color: colors.line },
});
```

The asterisk is a placeholder glyph so the component has no icon dependency. Replace it with `SymbolView` from `expo-symbols` (`star.fill`) in Plan B's polish pass if the asterisk looks wrong on device.

- [ ] **Step 6: Write the restaurant card**

`src/components/restaurant-card.tsx`:
```tsx
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { RatingStars } from "@/components/rating-stars";
import { colors, radius, spacing, text } from "@/theme";
import type { Restaurant } from "@/types/entities";

interface RestaurantCardProps {
  restaurant: Restaurant;
  onSave: (r: Restaurant) => void;
  onLog: (r: Restaurant) => void;
}

export function RestaurantCard({ restaurant, onSave, onLog }: RestaurantCardProps) {
  return (
    <View style={styles.card}>
      <View>
        <Image source={restaurant.image_url ? { uri: restaurant.image_url } : undefined} style={styles.image} contentFit="cover" transition={150} />
        <Text style={styles.price}>{restaurant.price_level}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.titleCol}>
            <Link href={{ pathname: "/restaurant/[id]", params: { id: restaurant.id } }} style={styles.name}>
              {restaurant.name}
            </Link>
            <Text style={styles.cuisines}>{restaurant.cuisines.join(" / ")}</Text>
          </View>
          {typeof restaurant.average_rating === "number" ? (
            <View style={styles.ratingPill}>
              <Text style={styles.ratingText}>{restaurant.average_rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.address}>
          {[restaurant.neighborhood, restaurant.address].filter(Boolean).join(" / ")}
        </Text>
        <RatingStars value={Math.round(restaurant.average_rating ?? 0)} size={14} />
        <View style={styles.actions}>
          <Pressable style={[styles.action, styles.actionOutline]} onPress={() => onSave(restaurant)}>
            <Text style={styles.actionText}>Save</Text>
          </Pressable>
          <Pressable style={[styles.action, styles.actionFilled]} onPress={() => onLog(restaurant)}>
            <Text style={styles.actionText}>Log visit</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.xl, overflow: "hidden" },
  image: { height: 160, width: "100%", backgroundColor: colors.surfaceMuted },
  price: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    ...text.caption,
    color: colors.ink,
  },
  body: { padding: spacing.lg, gap: spacing.sm },
  titleRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  titleCol: { flex: 1, gap: spacing.xs },
  name: text.heading,
  cuisines: text.caption,
  ratingPill: {
    backgroundColor: colors.yellowSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: "flex-start",
  },
  ratingText: text.bodyStrong,
  address: text.caption,
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  action: { flex: 1, height: 40, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  actionOutline: { borderWidth: 1, borderColor: colors.line },
  actionFilled: { backgroundColor: colors.yellow },
  actionText: text.bodyStrong,
});
```

- [ ] **Step 7: Write the restaurant sheet**

`src/screens/map/restaurant-sheet.tsx`:
```tsx
import { BottomSheet, Host, RNHostView } from "@expo/ui";
import { StyleSheet, View } from "react-native";

import { RestaurantCard } from "@/components/restaurant-card";
import { spacing } from "@/theme";
import type { Restaurant } from "@/types/entities";

interface RestaurantSheetProps {
  restaurant: Restaurant | null;
  onDismiss: () => void;
  onSave: (r: Restaurant) => void;
  onLog: (r: Restaurant) => void;
}

export function RestaurantSheet({ restaurant, onDismiss, onSave, onLog }: RestaurantSheetProps) {
  return (
    <Host>
      <BottomSheet isPresented={restaurant !== null} onDismiss={onDismiss} snapPoints={["half", "full"]} showDragIndicator>
        <RNHostView matchContents>
          <View style={styles.content}>
            {restaurant ? <RestaurantCard restaurant={restaurant} onSave={onSave} onLog={onLog} /> : null}
          </View>
        </RNHostView>
      </BottomSheet>
    </Host>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg },
});
```

`RNHostView` is the Expo UI bridge for placing React Native views inside a native SwiftUI or Compose container; the sheet content is a React Native card, so it needs it.

- [ ] **Step 8: Write the native map screen**

`src/screens/map/index.tsx`:
```tsx
import * as Location from "expo-location";
import { Stack, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";

import { ScreenLoader } from "@/components/screen-loader";
import { useSaveRestaurant } from "@/features/restaurants/mutations";
import { useRestaurants } from "@/features/restaurants/queries";
import { colors } from "@/theme";
import type { Restaurant } from "@/types/entities";

import { matchesQuery } from "./filter";
import { RestaurantSheet } from "./restaurant-sheet";

const BOGOTA: Region = { latitude: 4.6517, longitude: -74.0627, latitudeDelta: 0.08, longitudeDelta: 0.08 };

export function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const restaurants = useRestaurants();
  const save = useSaveRestaurant();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Restaurant | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function locate() {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted" || cancelled) return;
      const pos = await Location.getCurrentPositionAsync({});
      if (cancelled) return;
      mapRef.current?.animateToRegion(
        { latitude: pos.coords.latitude, longitude: pos.coords.longitude, latitudeDelta: 0.03, longitudeDelta: 0.03 },
        600,
      );
    }
    void locate();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(
    () => (restaurants.data ?? []).filter((r) => r.latitude && r.longitude && matchesQuery(r, query)),
    [restaurants.data, query],
  );

  const onSave = async (r: Restaurant) => {
    const result = await save.mutateAsync(r);
    Alert.alert(result === "saved" ? "Saved to Want to try" : "Already in Want to try");
  };

  const onLog = (r: Restaurant) => {
    setSelected(null);
    router.push({ pathname: "/log-visit", params: { id: r.id } });
  };

  if (restaurants.isPending) return <ScreenLoader />;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerTransparent: true, headerLargeTitleEnabled: false, title: "" }} />
      <Stack.SearchBar placeholder="Search restaurants" onChangeText={(e) => setQuery(e.nativeEvent.text)} hideWhenScrolling={false} />
      <MapView ref={mapRef} style={styles.map} initialRegion={BOGOTA} showsUserLocation onPress={() => setSelected(null)}>
        {visible.map((r) => (
          <Marker
            key={r.id}
            coordinate={{ latitude: r.latitude as number, longitude: r.longitude as number }}
            pinColor={colors.yellow}
            onPress={() => setSelected(r)}
          />
        ))}
      </MapView>
      <RestaurantSheet restaurant={selected} onDismiss={() => setSelected(null)} onSave={onSave} onLog={onLog} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  map: { flex: 1 },
});
```

- [ ] **Step 9: Write the web stand-in**

`src/screens/map/index.web.tsx`:
```tsx
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, TextInput, View } from "react-native";

import { RestaurantCard } from "@/components/restaurant-card";
import { ScreenLoader } from "@/components/screen-loader";
import { useSaveRestaurant } from "@/features/restaurants/mutations";
import { useRestaurants } from "@/features/restaurants/queries";
import { colors, radius, spacing } from "@/theme";
import type { Restaurant } from "@/types/entities";

import { matchesQuery } from "./filter";

// Web is development-only: the map library has no web build, so this lists the same data.
export function MapScreen() {
  const router = useRouter();
  const restaurants = useRestaurants();
  const save = useSaveRestaurant();
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () => (restaurants.data ?? []).filter((r) => matchesQuery(r, query)),
    [restaurants.data, query],
  );

  const onLog = (r: Restaurant) => router.push({ pathname: "/log-visit", params: { id: r.id } });

  if (restaurants.isPending) return <ScreenLoader />;

  return (
    <View style={styles.root}>
      <TextInput value={query} onChangeText={setQuery} placeholder="Search restaurants" style={styles.search} />
      <FlatList
        data={visible}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <RestaurantCard restaurant={item} onSave={(r) => void save.mutateAsync(r)} onLog={onLog} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  search: {
    margin: spacing.lg,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
  },
  list: { paddingHorizontal: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
});
```

- [ ] **Step 10: Add the log-visit sheet route as a placeholder**

Typed routes reject `/log-visit` until a file exists, so the route is created here and filled in Task 10.

`src/app/log-visit.tsx`:
```tsx
import { StyleSheet, Text, View } from "react-native";

import { text } from "@/theme";

export default function LogVisitRoute() {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>log visit (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center" },
  label: text.caption,
});
```

In `src/app/_layout.tsx`, inside the first `Stack.Protected` (signed in and onboarded), after the `mia` screen add:

```tsx
<Stack.Screen
  name="log-visit"
  options={{
    presentation: "formSheet",
    sheetAllowedDetents: [0.7, 1],
    sheetGrabberVisible: true,
    headerShown: false,
  }}
/>
```

- [ ] **Step 11: Point the route at the screen**

`src/app/(tabs)/(map,search,lists,profile)/map.tsx`:
```tsx
import { MapScreen } from "@/screens/map";

export default function MapRoute() {
  return <MapScreen />;
}
```

- [ ] **Step 12: Gates and run**

```bash
pnpm test && pnpm typecheck && pnpm lint
pnpm ios
```

Expected on iOS: Apple Maps fills the tab, pins appear in yellow, the location prompt shows the KOMIA reason, typing in the search bar hides pins that do not match, tapping a pin opens the sheet with the card, "Save" shows the alert, "Log visit" opens the placeholder sheet, the name links to the detail placeholder. `pnpm android` shows Google Maps with the same behaviour (Expo Go carries its own key). `pnpm web` shows the list stand-in.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "Add map tab with pins, search bar, and restaurant sheet"
```

---

### Task 10: Restaurant detail and the log-visit sheet

**Files:**
- Create: `src/screens/restaurant-detail/index.tsx`, `src/screens/restaurant-detail/info-rows.tsx`, `src/screens/log-visit/index.tsx`
- Modify: `src/app/(tabs)/(map,search,lists,profile)/restaurant/[id].tsx`, `src/app/log-visit.tsx`

**Interfaces:**
- Consumes: `useRestaurant`, `useSaveRestaurant`, `useLogVisit`, `RatingStars`.
- Produces: `<RestaurantDetailScreen id />`, `<LogVisitScreen restaurantId />`, route `/log-visit?id=`.

- [ ] **Step 1: Write the info rows**

`src/screens/restaurant-detail/info-rows.tsx`:
```tsx
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, text } from "@/theme";
import type { Restaurant } from "@/types/entities";

const ATTRIBUTES: { key: keyof Restaurant; label: string }[] = [
  { key: "vegetarian_friendly", label: "Vegetarian friendly" },
  { key: "vegan_friendly", label: "Vegan friendly" },
  { key: "outdoor_seating", label: "Outdoor seating" },
  { key: "fine_dining", label: "Fine dining" },
  { key: "casual", label: "Casual" },
  { key: "romantic", label: "Romantic" },
  { key: "family_friendly", label: "Family friendly" },
];

function Row({ label, value }: { label: string; value?: string | number }) {
  if (value === undefined || value === "") return null;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{String(value)}</Text>
    </View>
  );
}

export function InfoRows({ restaurant }: { restaurant: Restaurant }) {
  const attributes = ATTRIBUTES.filter((a) => restaurant[a.key] === true);
  return (
    <View style={styles.group}>
      <Row label="Address" value={[restaurant.address, restaurant.neighborhood, restaurant.city].filter(Boolean).join(", ")} />
      <Row label="Cuisine" value={[...restaurant.cuisines, ...(restaurant.secondary_cuisines ?? [])].join(", ")} />
      <Row label="Price" value={restaurant.price_level} />
      <Row label="Type" value={restaurant.restaurant_type} />
      <Row label="Hours" value={restaurant.opening_hours} />
      <Row label="Phone" value={restaurant.phone} />
      <Row label="Website" value={restaurant.website} />
      <Row label="Awards" value={restaurant.awards?.join(", ")} />
      {attributes.length > 0 ? (
        <View style={styles.chips}>
          {attributes.map((a) => (
            <Text key={a.key} style={styles.chip}>
              {a.label}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  row: { gap: spacing.xs },
  label: text.overline,
  value: text.bodyStrong,
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs },
  chip: {
    ...text.caption,
    color: colors.ink,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
```

- [ ] **Step 2: Write the detail screen**

`src/screens/restaurant-detail/index.tsx`:
```tsx
import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { RatingStars } from "@/components/rating-stars";
import { ScreenLoader } from "@/components/screen-loader";
import { useSaveRestaurant } from "@/features/restaurants/mutations";
import { useRestaurant } from "@/features/restaurants/queries";
import { colors, spacing, text } from "@/theme";

import { InfoRows } from "./info-rows";

export function RestaurantDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const restaurant = useRestaurant(id);
  const save = useSaveRestaurant();

  if (restaurant.isPending) return <ScreenLoader />;
  if (!restaurant.data) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Restaurant not found.</Text>
      </View>
    );
  }
  const r = restaurant.data;

  const onSave = async () => {
    const result = await save.mutateAsync(r);
    Alert.alert(result === "saved" ? "Saved to Want to try" : "Already in Want to try");
  };

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <Image source={r.image_url ? { uri: r.image_url } : undefined} style={styles.hero} contentFit="cover" transition={150} />
        <View style={styles.header}>
          <Text style={styles.name}>{r.name}</Text>
          <View style={styles.ratingRow}>
            <RatingStars value={Math.round(r.average_rating ?? 0)} />
            {typeof r.average_rating === "number" ? (
              <Text style={styles.ratingText}>
                {r.average_rating.toFixed(1)} ({r.rating_count ?? 0})
              </Text>
            ) : null}
          </View>
          {r.description ? <Text style={styles.description}>{r.description}</Text> : null}
        </View>
        <InfoRows restaurant={r} />
      </ScrollView>
      <Stack.Screen.Title>{r.name}</Stack.Screen.Title>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="bookmark" onPress={() => void onSave()} />
        <Stack.Toolbar.Button icon="plus.circle" onPress={() => router.push({ pathname: "/log-visit", params: { id: r.id } })} />
      </Stack.Toolbar>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface },
  content: { paddingBottom: spacing.xxl, gap: spacing.lg },
  hero: { height: 240, width: "100%", backgroundColor: colors.surfaceMuted },
  header: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  name: text.title,
  ratingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  ratingText: text.caption,
  description: { ...text.body, color: colors.inkMuted },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { ...text.body, color: colors.inkMuted },
});
```

`Stack.Toolbar` renders header buttons on iOS and Android in SDK 57. On web the toolbar is ignored; that is acceptable because web is development-only. If Android shows no buttons, add a `headerRight` option via `<Stack.Screen options={{ headerRight: ... }} />` with two `Pressable` texts "Save" and "Log" and note it in the commit body.

- [ ] **Step 3: Write the log-visit sheet body**

`src/screens/log-visit/index.tsx`:
```tsx
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { RatingStars } from "@/components/rating-stars";
import { ScreenLoader } from "@/components/screen-loader";
import { useLogVisit } from "@/features/restaurants/mutations";
import { useRestaurant } from "@/features/restaurants/queries";
import { colors, radius, spacing, text } from "@/theme";

export function LogVisitScreen({ restaurantId }: { restaurantId: string }) {
  const router = useRouter();
  const restaurant = useRestaurant(restaurantId);
  const logVisit = useLogVisit();
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");

  if (restaurant.isPending) return <ScreenLoader />;
  if (!restaurant.data) {
    return (
      <View style={styles.root}>
        <Text style={styles.muted}>Restaurant not found.</Text>
      </View>
    );
  }
  const r = restaurant.data;

  const submit = async () => {
    try {
      await logVisit.mutateAsync({ restaurant: r, rating, review });
      router.back();
      Alert.alert("Visit added to your log");
    } catch (e) {
      Alert.alert("Could not save the visit", e instanceof Error ? e.message : undefined);
    }
  };

  return (
    <View style={styles.root}>
      <Text style={styles.overline}>Log a visit</Text>
      <Text style={styles.name}>{r.name}</Text>
      <Text style={styles.question}>How was it?</Text>
      <RatingStars value={rating} onChange={setRating} size={32} />
      <TextInput
        value={review}
        onChangeText={setReview}
        placeholder="What should your friends know?"
        placeholderTextColor={colors.inkFaint}
        multiline
        style={styles.review}
      />
      <PrimaryButton onPress={() => void submit()} loading={logVisit.isPending}>
        Add to my log
      </PrimaryButton>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.xl, gap: spacing.md, backgroundColor: colors.surface },
  overline: { ...text.overline, color: colors.orange },
  name: text.title,
  question: { ...text.bodyStrong, marginTop: spacing.sm },
  review: {
    minHeight: 112,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    padding: spacing.lg,
    textAlignVertical: "top",
    ...text.body,
  },
  muted: { ...text.body, color: colors.inkMuted },
});
```

- [ ] **Step 4: Replace the placeholder sheet route**

`src/app/log-visit.tsx`:
```tsx
import { useLocalSearchParams } from "expo-router";

import { LogVisitScreen } from "@/screens/log-visit";

export default function LogVisitRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LogVisitScreen restaurantId={id ?? ""} />;
}
```

The root layout already presents this route as a form sheet (Task 9, step 10).

- [ ] **Step 5: Point the detail route at the screen**

`src/app/(tabs)/(map,search,lists,profile)/restaurant/[id].tsx`:
```tsx
import { useLocalSearchParams } from "expo-router";

import { RestaurantDetailScreen } from "@/screens/restaurant-detail";

export default function RestaurantRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RestaurantDetailScreen id={id ?? ""} />;
}
```

- [ ] **Step 6: Gates and run**

```bash
pnpm test && pnpm typecheck && pnpm lint
pnpm ios
```

Expected on iOS: tapping a name in the map sheet pushes the detail screen with the hero image, large title, info group, and two header buttons; the bookmark saves with an alert; the plus opens the log-visit form sheet; submitting closes it and alerts. Relaunch and confirm the log persists by opening the same restaurant and logging again (the "My logs" tab lands in Plan B). Repeat the push and sheet on Android. On web, the detail page renders without the toolbar and the sheet opens as a plain screen.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Add restaurant detail screen and log-visit sheet"
```

---

## Done criteria for Plan A

- All ten tasks committed on `expo-migration`, each commit passing lint, typecheck, and tests.
- iOS and Android through Expo Go: boot, log in with email, see the map with pins, open a restaurant, save it, log a visit, relaunch and stay signed in.
- Web: boots, logs in, shows the list stand-in and the detail page.
- Spec section 3 records the Google login outcome.
- Open for Plan B: My logs, Log detail, Profile, Onboarding (currently a placeholder that blocks new users), Search, MIA, brand icons, README and CLAUDE.md rewrite, dropping leftover unused dependencies if any.
