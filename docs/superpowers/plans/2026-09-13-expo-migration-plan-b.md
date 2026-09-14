# Expo Migration Plan B: Remaining Screens and Cleanup

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the Expo app: onboarding, My logs, log detail, profile with edit sheet, search, MIA chat, the polish found while testing Plan A, and the repo docs.

**Architecture:** Same as Plan A. Routes in `src/app` only, screen bodies in `src/screens/<name>/`, data hooks in `src/features/<domain>/`, colocated `StyleSheet` with tokens from `src/theme.ts`. New pure logic (history grouping, taste profile, onboarding step rules, chat history) lives in `features/` with colocated tests. Expo UI where proven on Android (`Button` with `label`, `BottomSheet`), React Native primitives elsewhere.

**Tech Stack:** Expo SDK 57, expo-router 57, @expo/ui 57, @expo/vector-icons (added in Task 1), TanStack Query 5, @base44/sdk, jest-expo.

**Spec:** `docs/superpowers/specs/2026-09-13-expo-migration-design.md`

**Plan A:** `docs/superpowers/plans/2026-09-13-expo-migration-plan-a.md` (done; branch `expo-migration` at commit b20f3bc or later).

## Global Constraints

- Branch `expo-migration`. Never commit to `main`.
- pnpm only. Package versions pinned by `pnpm exec expo install <pkg>` when adding a package; never hand-edit a version.
- TypeScript under `src/`, kebab-case files, `src/app` routes only.
- Styling: `StyleSheet.create` at the bottom of each file; tokens from `src/theme.ts`; no hex literal outside `src/theme.ts` and `app.config.ts`.
- No emojis anywhere: code, copy, commits, docs. The old onboarding titles and MIA greeting carried emojis; the new copy drops them.
- Expo UI `Button` must receive its text via `label` (a string child crashes on Android). `PrimaryButton` already does this; do not change it.
- Gates before every commit: `pnpm lint`, `pnpm typecheck`, `pnpm test` all clean.
- Commits: one logical change each, imperative subject, plain language, no trailers, no tool or AI mentions.
- Stage explicit paths only; never `git add -A`. Leave `.claude/` alone.
- The Android app is now a development build (`co.komia.app`, installed on the `Pixel_8_Pro` emulator). `pnpm android` rebuilds natively; for JS-only changes run `pnpm start`, `adb reverse tcp:8081 tcp:8081`, and launch the installed app. A native rebuild is needed only when a package with native code is added (Task 1 adds `@expo/vector-icons`, which needs a rebuild once for its fonts).
- The user's real account is signed in on the emulator build and has `onboarding_completed` false. Implementers never submit the onboarding on that account and never log it out. To reach the tabs for verification, apply the temporary bypass in `src/app/_layout.tsx` (`const onboarded = signedIn;` with a TEMP comment) and revert it before committing; `git diff src/app/_layout.tsx` must be empty at commit time unless the task changes that file on purpose.
- Verification on this machine is the Android dev build plus web (curl for boot, and a browser render for screens where the task says so). iOS is checked by the user.

## Environment the executor needs

- `.env` with the Base44 values and `GOOGLE_MAPS_ANDROID_API_KEY` (present).
- Android SDK at `~/Library/Android/sdk`, AVD `Pixel_8_Pro`, `adb` on PATH via `export PATH=$HOME/Library/Android/sdk/platform-tools:$HOME/Library/Android/sdk/emulator:$PATH`.
- Emulator: `emulator -avd Pixel_8_Pro -no-snapshot-load -no-boot-anim &`, wait for `adb shell getprop sys.boot_completed` to print `1`.
- Metro: `pnpm start` in the background, then `adb reverse tcp:8081 tcp:8081`, then `adb shell monkey -p co.komia.app -c android.intent.category.LAUNCHER 1`. Screenshots: `adb exec-out screencap -p > <file>`.
- Do not press the Android back key to dismiss the keyboard; it closes form sheets. Tap outside the field or use `adb shell input keyevent 111` only if verified harmless.

## File map

| Path | Responsibility |
|---|---|
| `src/components/rating-stars.tsx` | Stars drawn with vector icons (Task 1) |
| `src/components/mia-card.tsx` | Promo card that opens MIA (Task 6) |
| `src/features/restaurants/filter.ts`, `.test.ts` | `matchesQuery`, moved from `screens/map` (Task 6) |
| `src/features/restaurants/history.ts`, `.test.ts` | Visit date parsing and month grouping (Task 3) |
| `src/features/restaurants/use-restaurant-actions.ts` | Shared save and log handlers for map and search (Task 6) |
| `src/features/restaurants/queries.ts` | adds `useLog(id)` (Task 4) |
| `src/features/profile/taste-profile.ts`, `.test.ts` | `computeTasteProfile`, `computeLogStats` (Task 5) |
| `src/features/profile/mutations.ts` | `useUpdateProfile` (Task 5) |
| `src/features/onboarding/steps.ts`, `.test.ts` | Step constants, empty state, `canContinue` (Task 2) |
| `src/features/mia/chat.ts`, `.test.ts`, `use-mia-chat.ts` | Message model, history trimming, chat hook (Task 7) |
| `src/screens/onboarding/*` | Onboarding screen and selectors (Task 2) |
| `src/screens/my-logs/index.tsx` | My logs tab (Task 3) |
| `src/screens/log-detail/index.tsx` | Log detail (Task 4) |
| `src/screens/profile/index.tsx`, `src/screens/edit-profile/index.tsx` | Profile tab and edit sheet (Task 5) |
| `src/screens/search/index.tsx` | Search tab (Task 6) |
| `src/screens/mia/index.tsx` | MIA chat sheet (Task 7) |
| `src/app/edit-profile.tsx`, `src/app/_layout.tsx` | Edit profile sheet route and registration (Task 5) |
| `src/app/(tabs)/(map,search,lists,profile)/_layout.tsx` | MIA header button on the four tabs (Task 7) |
| `README.md`, `CLAUDE.md`, `AGENTS.md` | Docs (Task 8) |

---

### Task 1: Development noise and star icons

**Files:**
- Modify: `src/app/_layout.tsx`, `src/components/rating-stars.tsx`, `src/screens/map/restaurant-sheet.tsx`, `package.json` (via `expo install`)

**Interfaces:**
- Produces: unchanged `RatingStars` props; the stars now render as icons.

Two logical changes, two commits.

- [ ] **Step 1: Quiet the SDK's development-only console errors**

The Base44 SDK calls `console.error` for every failed request when not in production, and LogBox turns that into a red overlay even though the screens already show the message. In `src/app/_layout.tsx`, add after the imports:

```ts
import { LogBox } from "react-native";

// The Base44 SDK logs every failed request in development; the screens already
// show those errors, so keep them out of the LogBox overlay. Metro still prints them.
if (__DEV__) {
  LogBox.ignoreLogs([/^\[Base44 SDK Error\]/, /^Error data:/]);
}
```

Merge the `react-native` import with any existing one. Run the gates and commit: `Keep Base44 request errors out of the LogBox overlay in development`.

- [ ] **Step 2: Install vector icons**

```bash
pnpm exec expo install @expo/vector-icons
```

- [ ] **Step 3: Draw stars with icons**

Replace `src/components/rating-stars.tsx`:

```tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

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
          <MaterialCommunityIcons
            name={n <= value ? "star" : "star-outline"}
            size={size}
            color={n <= value ? colors.yellow : colors.line}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.xs },
});
```

- [ ] **Step 4: Let the sheet card fill the sheet**

In `src/screens/map/restaurant-sheet.tsx`, change the content style to `content: { padding: spacing.lg, width: "100%" }` and give the host view the full width: `<RNHostView matchContents style={styles.host}>` with `host: { width: "100%" }` added to the styles. If `RNHostView` rejects `width` in its style type, wrap the card in a plain `View` with `width: "100%"` instead and note it.

- [ ] **Step 5: Rebuild, run, verify**

`pnpm android` (native rebuild for the icon fonts), then with the temporary gate bypass: the map sheet shows filled and outlined stars and the card spans the sheet width; the log-visit sheet's tappable stars change on tap; a failed request (for example Save while offline via `adb shell svc wifi disable`, then re-enable) shows the alert without a red overlay. Screenshot the sheet. Revert the bypass.

- [ ] **Step 6: Gates and commit**

`pnpm test && pnpm typecheck && pnpm lint`, then stage `package.json`, `pnpm-lock.yaml`, `src/components/rating-stars.tsx`, `src/screens/map/restaurant-sheet.tsx` and commit: `Draw rating stars with vector icons and widen the sheet card`.

---

### Task 2: Onboarding

**Files:**
- Create: `src/features/onboarding/steps.ts`, `src/features/onboarding/steps.test.ts`, `src/screens/onboarding/chip-select.tsx`, `src/screens/onboarding/rank-select.tsx`, `src/screens/onboarding/scale-select.tsx`, `src/screens/onboarding/index.tsx`
- Modify: `src/app/onboarding.tsx`

**Interfaces:**
- Consumes: `useSession().refreshUser()`, `base44.auth.updateMe`, `TasteProfile` from `@/types/entities`, `PrimaryButton`, `BrandMark`, `TextField`.
- Produces: `STEPS`, `EMPTY_PROFILE`, `canContinue(step, data)`, `<OnboardingScreen />`.

- [ ] **Step 1: Write the failing step-rules test**

`src/features/onboarding/steps.test.ts`:
```ts
import { canContinue, EMPTY_PROFILE, STEPS } from "./steps";

describe("onboarding steps", () => {
  it("has seven steps with a question each", () => {
    expect(STEPS).toHaveLength(7);
    for (const s of STEPS) expect(s.question.length).toBeGreaterThan(0);
  });

  it("requires at least one cuisine on step 0", () => {
    expect(canContinue(0, EMPTY_PROFILE)).toBe(false);
    expect(canContinue(0, { ...EMPTY_PROFILE, cuisines: ["Italian"] })).toBe(true);
  });

  it("requires a price and an adventurousness on steps 2 and 3", () => {
    expect(canContinue(2, EMPTY_PROFILE)).toBe(false);
    expect(canContinue(2, { ...EMPTY_PROFILE, price: "$$" })).toBe(true);
    expect(canContinue(3, EMPTY_PROFILE)).toBe(false);
    expect(canContinue(3, { ...EMPTY_PROFILE, adventurousness: 3 })).toBe(true);
  });

  it("requires exactly five ranked priorities on step 5", () => {
    expect(canContinue(5, { ...EMPTY_PROFILE, priorities: ["a", "b", "c", "d"] })).toBe(false);
    expect(canContinue(5, { ...EMPTY_PROFILE, priorities: ["a", "b", "c", "d", "e"] })).toBe(true);
  });

  it("always allows the last step", () => {
    expect(canContinue(6, EMPTY_PROFILE)).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

`pnpm test -- onboarding/steps` fails with cannot find module.

- [ ] **Step 3: Write the step rules**

`src/features/onboarding/steps.ts`:
```ts
import type { TasteProfile } from "@/types/entities";

export const CUISINES = ["Italian", "Japanese", "Mexican", "Colombian", "Peruvian", "Korean", "Chinese", "Mediterranean", "Indian", "French", "American", "Arabic", "Vegetarian", "Vegan", "Fusion", "Street Food", "Other"];
export const EXPERIENCES = ["Casual and relaxed", "Fine dining", "Date", "With friends", "Family", "Brunch", "Cafe", "Bar", "Street food", "Something different", "Celebration"];
export const PRICES: { value: string; label: string; sublabel: string }[] = [
  { value: "$", label: "$ Budget friendly", sublabel: "Affordable, everyday eats" },
  { value: "$$", label: "$$ Mid range", sublabel: "Comfortable, balanced" },
  { value: "$$$", label: "$$$ Special occasion", sublabel: "Premium dining" },
  { value: "$$$$", label: "$$$$ High end", sublabel: "Luxury experiences" },
  { value: "depends", label: "It depends on the occasion", sublabel: "Flexible based on context" },
];
export const ADVENTURE: { value: number; label: string }[] = [
  { value: 1, label: "1. I prefer to stick to what I know" },
  { value: 2, label: "2. I sometimes try something new" },
  { value: 3, label: "3. I am open to experimenting" },
  { value: 4, label: "4. I love discovering new places" },
  { value: 5, label: "5. I always want to try something different" },
];
export const FLAVORS = ["Sweet", "Salty", "Spicy", "Sour", "Umami", "Smoky", "Spiced", "Creamy", "Fresh", "Light", "Intense"];
export const PRIORITIES = ["Food quality", "Taste", "Price", "Atmosphere", "Service", "Location", "Originality", "Presentation", "Portion size", "Reputation", "Overall experience"];
export const AVOID = ["Very spicy food", "Very sweet food", "Very greasy food", "Seafood", "Fish", "Meat", "Dairy", "Gluten", "Specific ingredients", "Very expensive restaurants", "Very loud places", "Very formal restaurants", "Restaurant chains", "Other"];

export interface StepInfo {
  question: string;
  hint: string;
}

export const STEPS: StepInfo[] = [
  { question: "What types of food do you enjoy the most?", hint: "Select up to 5." },
  { question: "When you go out to eat, what kind of experience are you looking for?", hint: "Select as many as you like." },
  { question: "How much do you usually like to spend at a restaurant?", hint: "Pick one." },
  { question: "How adventurous are you with food?", hint: "Rate from 1 to 5." },
  { question: "What flavors do you enjoy the most?", hint: "Select the ones you like most." },
  { question: "What matters most to you when choosing a restaurant?", hint: "Rank your top 5." },
  { question: "What do you not like or want to avoid?", hint: "Select everything that applies." },
];

export const EMPTY_PROFILE: TasteProfile = {
  cuisines: [],
  other_cuisines: "",
  experiences: [],
  price: null,
  adventurousness: null,
  flavors: [],
  disliked_flavors: "",
  priorities: [],
  avoid: [],
  avoid_notes: "",
};

export function canContinue(step: number, data: TasteProfile): boolean {
  switch (step) {
    case 0: return data.cuisines.length >= 1;
    case 1: return data.experiences.length >= 1;
    case 2: return data.price !== null;
    case 3: return data.adventurousness !== null;
    case 4: return data.flavors.length >= 1;
    case 5: return data.priorities.length === 5;
    default: return true;
  }
}
```

- [ ] **Step 4: Run it to verify it passes**

`pnpm test -- onboarding/steps`: 5 passing.

- [ ] **Step 5: Write the selectors**

`src/screens/onboarding/chip-select.tsx`:
```tsx
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, text } from "@/theme";

interface ChipSelectProps {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
}

export function ChipSelect({ options, value, onChange, max }: ChipSelectProps) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) return onChange(value.filter((v) => v !== opt));
    if (max && value.length >= max) return;
    onChange([...value, opt]);
  };
  return (
    <View style={styles.wrap}>
      {options.map((opt) => {
        const active = value.includes(opt);
        return (
          <Pressable key={opt} onPress={() => toggle(opt)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={styles.label}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  chipActive: { borderColor: colors.yellow, backgroundColor: colors.yellow },
  label: text.bodyStrong,
});
```

`src/screens/onboarding/rank-select.tsx`:
```tsx
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, text } from "@/theme";

interface RankSelectProps {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
}

export function RankSelect({ options, value, onChange, max = 5 }: RankSelectProps) {
  const available = options.filter((o) => !value.includes(o));
  const add = (opt: string) => value.length < max && onChange([...value, opt]);
  const remove = (opt: string) => onChange(value.filter((v) => v !== opt));

  return (
    <View style={styles.wrap}>
      <Text style={styles.overline}>Your top {max}</Text>
      {value.length === 0 ? (
        <Text style={styles.empty}>Tap options below to rank them in order.</Text>
      ) : (
        value.map((opt, i) => (
          <Pressable key={opt} onPress={() => remove(opt)} style={styles.ranked}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{i + 1}</Text>
            </View>
            <Text style={styles.rankedLabel}>{opt}</Text>
            <Text style={styles.remove}>Remove</Text>
          </Pressable>
        ))
      )}
      <Text style={[styles.overline, styles.optionsTitle]}>Options</Text>
      <View style={styles.chips}>
        {available.map((opt) => (
          <Pressable key={opt} onPress={() => add(opt)} disabled={value.length >= max} style={[styles.chip, value.length >= max && styles.chipDisabled]}>
            <Text style={styles.chipLabel}>{opt}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  overline: text.overline,
  optionsTitle: { marginTop: spacing.md },
  empty: { ...text.caption, textAlign: "center", padding: spacing.lg, borderWidth: 1, borderStyle: "dashed", borderColor: colors.line, borderRadius: radius.lg },
  ranked: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.navy, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  badge: { width: 28, height: 28, borderRadius: radius.pill, backgroundColor: colors.yellow, alignItems: "center", justifyContent: "center" },
  badgeText: { ...text.bodyStrong, color: colors.navy },
  rankedLabel: { ...text.bodyStrong, color: colors.white, flex: 1 },
  remove: { ...text.caption, color: colors.white },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2 },
  chipDisabled: { opacity: 0.4 },
  chipLabel: text.bodyStrong,
});
```

`src/screens/onboarding/scale-select.tsx`:
```tsx
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, text } from "@/theme";

interface ScaleOption<T> {
  value: T;
  label: string;
  sublabel?: string;
}

interface ScaleSelectProps<T extends string | number> {
  options: ScaleOption<T>[];
  value: T | null;
  onChange: (next: T) => void;
}

export function ScaleSelect<T extends string | number>({ options, value, onChange }: ScaleSelectProps<T>) {
  return (
    <View style={styles.wrap}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable key={String(opt.value)} onPress={() => onChange(opt.value)} style={[styles.row, active && styles.rowActive]}>
            <View style={[styles.radio, active && styles.radioActive]}>{active ? <View style={styles.dot} /> : null}</View>
            <View style={styles.labels}>
              <Text style={styles.label}>{opt.label}</Text>
              {opt.sublabel ? <Text style={styles.sublabel}>{opt.sublabel}</Text> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg },
  rowActive: { borderColor: colors.yellow, backgroundColor: colors.yellowSoft },
  radio: { width: 24, height: 24, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: colors.yellow, backgroundColor: colors.yellow },
  dot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.navy },
  labels: { flex: 1, gap: 2 },
  label: text.bodyStrong,
  sublabel: text.caption,
});
```

- [ ] **Step 6: Write the onboarding screen**

`src/screens/onboarding/index.tsx`:
```tsx
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandMark } from "@/components/brand-mark";
import { PrimaryButton } from "@/components/primary-button";
import { TextField } from "@/components/text-field";
import { useSession } from "@/features/auth/session-provider";
import { ADVENTURE, AVOID, canContinue, CUISINES, EMPTY_PROFILE, EXPERIENCES, FLAVORS, PRICES, PRIORITIES, STEPS } from "@/features/onboarding/steps";
import { base44 } from "@/lib/base44";
import { colors, radius, spacing, text } from "@/theme";
import type { TasteProfile } from "@/types/entities";

import { ChipSelect } from "./chip-select";
import { RankSelect } from "./rank-select";
import { ScaleSelect } from "./scale-select";

export function OnboardingScreen() {
  const { refreshUser } = useSession();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<TasteProfile>(EMPTY_PROFILE);
  const [submitting, setSubmitting] = useState(false);
  const total = STEPS.length;
  const last = step === total - 1;

  const set = <K extends keyof TasteProfile>(key: K, value: TasteProfile[K]) => setData((d) => ({ ...d, [key]: value }));

  const next = async () => {
    if (!last) return setStep(step + 1);
    setSubmitting(true);
    try {
      await base44.auth.updateMe({ taste_profile: data, onboarding_completed: true });
      await refreshUser();
    } catch (e) {
      setSubmitting(false);
      Alert.alert("Could not save your profile", e instanceof Error ? e.message : "Please try again.");
    }
  };

  const info = STEPS[step];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <BrandMark />
        <View style={styles.progress}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.bar, i <= step && styles.barActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>Step {step + 1} of {total}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.question}>{info.question}</Text>
        <Text style={styles.hint}>{info.hint}</Text>
        <View style={styles.content}>
          {step === 0 ? (
            <>
              <ChipSelect options={CUISINES} value={data.cuisines} onChange={(v) => set("cuisines", v)} max={5} />
              {data.cuisines.includes("Other") ? (
                <TextField label="Other cuisines you enjoy" value={data.other_cuisines} onChangeText={(v) => set("other_cuisines", v)} />
              ) : null}
            </>
          ) : null}
          {step === 1 ? <ChipSelect options={EXPERIENCES} value={data.experiences} onChange={(v) => set("experiences", v)} /> : null}
          {step === 2 ? <ScaleSelect options={PRICES} value={data.price} onChange={(v) => set("price", v)} /> : null}
          {step === 3 ? <ScaleSelect options={ADVENTURE} value={data.adventurousness} onChange={(v) => set("adventurousness", v)} /> : null}
          {step === 4 ? (
            <>
              <ChipSelect options={FLAVORS} value={data.flavors} onChange={(v) => set("flavors", v)} />
              <TextField label="Any flavors you dislike?" value={data.disliked_flavors} onChangeText={(v) => set("disliked_flavors", v)} placeholder="e.g. bitter, overly sweet" />
            </>
          ) : null}
          {step === 5 ? <RankSelect options={PRIORITIES} value={data.priorities} onChange={(v) => set("priorities", v)} max={5} /> : null}
          {step === 6 ? (
            <>
              <ChipSelect options={AVOID} value={data.avoid} onChange={(v) => set("avoid", v)} />
              {data.avoid.includes("Specific ingredients") || data.avoid.includes("Other") ? (
                <TextField label="Tell us more" value={data.avoid_notes} onChangeText={(v) => set("avoid_notes", v)} />
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.back}>
          <PrimaryButton onPress={() => setStep(Math.max(0, step - 1))} disabled={step === 0} variant="outlined">
            Back
          </PrimaryButton>
        </View>
        <View style={styles.forward}>
          <PrimaryButton onPress={() => void next()} disabled={!canContinue(step, data)} loading={submitting}>
            {last ? "Build my profile" : "Continue"}
          </PrimaryButton>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.sm },
  progress: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.md },
  bar: { flex: 1, height: 6, borderRadius: radius.pill, backgroundColor: colors.line },
  barActive: { backgroundColor: colors.yellow },
  stepLabel: text.overline,
  body: { padding: spacing.xl, gap: spacing.sm, paddingBottom: spacing.xxl },
  question: text.title,
  hint: { ...text.body, color: colors.inkMuted },
  content: { marginTop: spacing.lg, gap: spacing.lg },
  footer: { flexDirection: "row", gap: spacing.md, padding: spacing.xl, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.surface },
  back: { flex: 1 },
  forward: { flex: 2 },
});
```

- [ ] **Step 7: Point the route at the screen**

`src/app/onboarding.tsx`:
```tsx
import { OnboardingScreen } from "@/screens/onboarding";

export default function OnboardingRoute() {
  return <OnboardingScreen />;
}
```

- [ ] **Step 8: Verify on the dev build (no bypass needed)**

The signed-in account is not onboarded, so the app opens on this screen. Walk all seven steps with taps, confirm Continue disables until each rule is met, confirm the rank step needs five, and STOP at "Build my profile" without tapping it. Screenshot steps 1, 4, and 6. Also confirm web boots (curl 200).

- [ ] **Step 9: Gates and commit**

`pnpm test && pnpm typecheck && pnpm lint`. Commit: `Add the onboarding taste profile flow`.

---

### Task 3: My logs tab

**Files:**
- Create: `src/features/restaurants/history.ts`, `src/features/restaurants/history.test.ts`, `src/screens/my-logs/index.tsx`
- Modify: `src/app/(tabs)/(map,search,lists,profile)/lists.tsx`

**Interfaces:**
- Consumes: `useMyLogs`, `useMyListItems`, `useRestaurants`, `RestaurantLog`, `Restaurant`.
- Produces: `parseVisitDate(s)`, `groupLogsByMonth(logs)` returning `MonthSection[]` (`{ key, title, data }`), `<MyLogsScreen />`.

- [ ] **Step 1: Write the failing history test**

`src/features/restaurants/history.test.ts`:
```ts
import { groupLogsByMonth, parseVisitDate } from "./history";
import type { RestaurantLog } from "@/types/entities";

const log = (id: string, visited_at: string): RestaurantLog => ({ id, user_id: "u", restaurant_id: "r", visited_at, overall_rating: 4 });

describe("parseVisitDate", () => {
  it("parses YYYY-MM-DD as a local date", () => {
    const d = parseVisitDate("2026-09-13");
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 8, 13]);
  });

  it("returns null for junk", () => {
    expect(parseVisitDate("nope")).toBeNull();
    expect(parseVisitDate("")).toBeNull();
  });
});

describe("groupLogsByMonth", () => {
  it("groups by month, newest month and newest day first", () => {
    const sections = groupLogsByMonth([log("a", "2026-08-02"), log("b", "2026-09-13"), log("c", "2026-09-01")]);
    expect(sections.map((s) => s.key)).toEqual(["2026-09", "2026-08"]);
    expect(sections[0].title).toBe("September 2026");
    expect(sections[0].data.map((l) => l.id)).toEqual(["b", "c"]);
  });

  it("skips logs with unparseable dates", () => {
    expect(groupLogsByMonth([log("x", "bad")])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

`pnpm test -- history` fails with cannot find module.

- [ ] **Step 3: Write the helper**

`src/features/restaurants/history.ts`:
```ts
import type { RestaurantLog } from "@/types/entities";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// visited_at is a plain calendar date; parse it as local time so it never shifts a day.
export function parseVisitDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? "");
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function formatVisitDate(value: string): string {
  const d = parseVisitDate(value);
  return d ? `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : "";
}

export interface MonthSection {
  key: string;
  title: string;
  data: RestaurantLog[];
}

export function groupLogsByMonth(logs: RestaurantLog[]): MonthSection[] {
  const byKey = new Map<string, { title: string; items: { log: RestaurantLog; date: Date }[] }>();
  for (const log of logs) {
    const date = parseVisitDate(log.visited_at);
    if (!date) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const entry = byKey.get(key) ?? { title: `${MONTHS[date.getMonth()]} ${date.getFullYear()}`, items: [] };
    entry.items.push({ log, date });
    byKey.set(key, entry);
  }
  return [...byKey.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, { title, items }]) => ({
      key,
      title,
      data: items.sort((a, b) => b.date.getTime() - a.date.getTime()).map((i) => i.log),
    }));
}
```

- [ ] **Step 4: Run it to verify it passes**

`pnpm test -- history`: 4 passing.

- [ ] **Step 5: Write the screen**

`src/screens/my-logs/index.tsx`:
```tsx
import { Link } from "expo-router";
import { useMemo } from "react";
import { Pressable, SectionList, StyleSheet, Text, View } from "react-native";

import { RatingStars } from "@/components/rating-stars";
import { ScreenLoader } from "@/components/screen-loader";
import { formatVisitDate, groupLogsByMonth, parseVisitDate } from "@/features/restaurants/history";
import { useMyListItems, useMyLogs, useRestaurants } from "@/features/restaurants/queries";
import { colors, radius, spacing, text } from "@/theme";

export function MyLogsScreen() {
  const logs = useMyLogs();
  const saved = useMyListItems();
  const restaurants = useRestaurants();

  const nameById = useMemo(() => new Map((restaurants.data ?? []).map((r) => [r.id, r.name])), [restaurants.data]);
  const sections = useMemo(() => groupLogsByMonth(logs.data ?? []), [logs.data]);

  if (logs.isPending || saved.isPending) return <ScreenLoader />;

  return (
    <SectionList
      sections={sections}
      keyExtractor={(l) => l.id}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      refreshing={logs.isRefetching}
      onRefresh={() => void logs.refetch()}
      ListHeaderComponent={
        <View style={styles.stats}>
          <View style={[styles.stat, styles.statNavy]}>
            <Text style={[styles.statValue, styles.onNavy]}>{saved.data?.length ?? 0}</Text>
            <Text style={[styles.statLabel, styles.onNavy]}>Want to try</Text>
          </View>
          <View style={[styles.stat, styles.statYellow]}>
            <Text style={styles.statValue}>{logs.data?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Places logged</Text>
          </View>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>Your restaurant history starts with your first log.</Text>}
      renderSectionHeader={({ section }) => <Text style={styles.month}>{section.title.toUpperCase()}</Text>}
      renderItem={({ item }) => (
        <Link href={{ pathname: "/log/[id]", params: { id: item.id } }} asChild>
          <Pressable style={styles.row}>
            <Text style={styles.day}>{parseVisitDate(item.visited_at)?.getDate() ?? ""}</Text>
            <View style={styles.rowBody}>
              <Text style={styles.name}>{nameById.get(item.restaurant_id) ?? "Restaurant"}</Text>
              <View style={styles.meta}>
                <RatingStars value={Math.round(item.overall_rating)} size={12} />
                <Text style={styles.metaText}>{formatVisitDate(item.visited_at)}</Text>
              </View>
            </View>
          </Pressable>
        </Link>
      )}
      stickySectionHeadersEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  stats: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
  stat: { flex: 1, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.xl },
  statNavy: { backgroundColor: colors.navy },
  statYellow: { backgroundColor: colors.yellow },
  statValue: { fontSize: 30, fontWeight: "900", color: colors.navy },
  statLabel: text.caption,
  onNavy: { color: colors.white },
  month: { ...text.overline, color: colors.navy, marginTop: spacing.md, marginBottom: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.lg, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg },
  day: { width: 32, fontSize: 24, fontWeight: "900", color: colors.navy },
  rowBody: { flex: 1, gap: spacing.xs },
  name: text.bodyStrong,
  meta: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  metaText: text.caption,
  empty: { ...text.caption, textAlign: "center", padding: spacing.xl },
});
```

- [ ] **Step 6: Point the route at it**

`src/app/(tabs)/(map,search,lists,profile)/lists.tsx` renders `<MyLogsScreen />` from `@/screens/my-logs`.

- [ ] **Step 7: Verify with the bypass**

My logs tab shows two stat cards (1 saved, 1 logged from Plan A testing), a month header, and a row for Lumbre Cocina with four stars; pull to refresh works; tapping the row pushes the log detail placeholder. Screenshot. Revert the bypass.

- [ ] **Step 8: Gates and commit**

Commit: `Add the My logs tab with monthly history`.

---

### Task 4: Log detail

**Files:**
- Create: `src/screens/log-detail/index.tsx`
- Modify: `src/features/restaurants/queries.ts`, `src/app/(tabs)/(map,search,lists,profile)/log/[id].tsx`

**Interfaces:**
- Produces: `useLog(id)`; `<LogDetailScreen id />`.

- [ ] **Step 1: Add the query**

In `src/features/restaurants/queries.ts`, after `useRestaurant`:
```ts
export function useLog(id: string) {
  return useQuery({
    queryKey: logKeys.detail(id),
    queryFn: async () => (await base44.entities.RestaurantLog.get(id)) as RestaurantLog,
    enabled: id.length > 0,
  });
}
```

- [ ] **Step 2: Write the screen**

`src/screens/log-detail/index.tsx`:
```tsx
import { Image } from "expo-image";
import { Link, Stack } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { RatingStars } from "@/components/rating-stars";
import { ScreenLoader } from "@/components/screen-loader";
import { formatVisitDate } from "@/features/restaurants/history";
import { useLog, useRestaurant } from "@/features/restaurants/queries";
import { colors, radius, spacing, text } from "@/theme";

const SUB_RATINGS: { key: "food_rating" | "service_rating" | "ambiance_rating" | "value_rating"; label: string }[] = [
  { key: "food_rating", label: "Food" },
  { key: "service_rating", label: "Service" },
  { key: "ambiance_rating", label: "Ambiance" },
  { key: "value_rating", label: "Value" },
];

export function LogDetailScreen({ id }: { id: string }) {
  const log = useLog(id);
  const restaurant = useRestaurant(log.data?.restaurant_id ?? "");

  if (id.length === 0 || log.isError || (!log.isPending && !log.data)) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Log not found.</Text>
      </View>
    );
  }
  if (log.isPending) return <ScreenLoader />;
  const l = log.data;
  const r = restaurant.data;
  const subs = SUB_RATINGS.filter((s) => typeof l[s.key] === "number");

  return (
    <>
      <Stack.Screen.Title>{r?.name ?? "Visit"}</Stack.Screen.Title>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <Image source={r?.image_url ? { uri: r.image_url } : undefined} style={styles.hero} contentFit="cover" transition={150} />
        <View style={styles.header}>
          <Link href={{ pathname: "/restaurant/[id]", params: { id: l.restaurant_id } }} style={styles.name}>
            {r?.name ?? "Restaurant"}
          </Link>
          <Text style={styles.date}>{formatVisitDate(l.visited_at)}</Text>
          <View style={styles.ratingRow}>
            <RatingStars value={Math.round(l.overall_rating)} />
            <Text style={styles.ratingText}>{l.overall_rating.toFixed(1)} overall</Text>
          </View>
        </View>

        {subs.length > 0 ? (
          <View style={styles.group}>
            {subs.map((s) => (
              <View key={s.key} style={styles.subRow}>
                <Text style={styles.subLabel}>{s.label}</Text>
                <Text style={styles.subValue}>{Number(l[s.key]).toFixed(1)}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {l.review ? (
          <View style={styles.group}>
            <Text style={styles.overline}>Review</Text>
            <Text style={styles.body}>{l.review}</Text>
          </View>
        ) : null}

        {l.dishes && l.dishes.length > 0 ? (
          <View style={styles.group}>
            <Text style={styles.overline}>Dishes</Text>
            <View style={styles.chips}>
              {l.dishes.map((d) => (
                <Text key={d} style={styles.chip}>{d}</Text>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.group}>
          {typeof l.price_paid === "number" ? <Fact label="Price paid" value={`$${l.price_paid}`} /> : null}
          {l.occasion ? <Fact label="Occasion" value={l.occasion} /> : null}
          {l.visibility ? <Fact label="Visibility" value={l.visibility} /> : null}
          {typeof l.would_return === "boolean" ? <Fact label="Would return" value={l.would_return ? "Yes" : "No"} /> : null}
        </View>
      </ScrollView>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.subRow}>
      <Text style={styles.subLabel}>{label}</Text>
      <Text style={styles.subValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface },
  content: { paddingBottom: spacing.xxl, gap: spacing.lg },
  hero: { height: 200, width: "100%", backgroundColor: colors.surfaceMuted },
  header: { paddingHorizontal: spacing.lg, gap: spacing.xs },
  name: text.title,
  date: text.caption,
  ratingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs },
  ratingText: text.caption,
  group: { marginHorizontal: spacing.lg, backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  subRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.xs },
  subLabel: { ...text.body, color: colors.inkMuted },
  subValue: text.bodyStrong,
  overline: text.overline,
  body: text.body,
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { ...text.caption, color: colors.ink, backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { ...text.body, color: colors.inkMuted },
});
```

- [ ] **Step 3: Point the route at it**

`src/app/(tabs)/(map,search,lists,profile)/log/[id].tsx` reads `id` with `useLocalSearchParams<{ id: string }>()` and renders `<LogDetailScreen id={id ?? ""} />`.

- [ ] **Step 4: Verify with the bypass**

From My logs, open the Lumbre Cocina row: title, hero, date, stars, "Would return: Yes" (rating 4). The restaurant name links to the detail screen. Screenshot. Revert the bypass.

- [ ] **Step 5: Gates and commit**

Commit: `Add the log detail screen`.

---

### Task 5: Profile tab and edit sheet

**Files:**
- Create: `src/features/profile/taste-profile.ts`, `src/features/profile/taste-profile.test.ts`, `src/features/profile/mutations.ts`, `src/screens/profile/index.tsx`, `src/screens/edit-profile/index.tsx`, `src/app/edit-profile.tsx`
- Modify: `src/app/_layout.tsx` (register the sheet), `src/app/(tabs)/(map,search,lists,profile)/profile.tsx`

**Interfaces:**
- Consumes: `useCurrentUser`, `useSession().signOut/refreshUser`, `useMyLogs`, `useRestaurants`, `base44.auth.updateMe`.
- Produces: `computeTasteProfile(logs, restaurants, user)`, `computeLogStats(logs)`, `useUpdateProfile()`, `<ProfileScreen />`, `<EditProfileScreen />`, route `/edit-profile`.

- [ ] **Step 1: Write the failing taste-profile test**

`src/features/profile/taste-profile.test.ts`:
```ts
import { computeLogStats, computeTasteProfile } from "./taste-profile";
import type { Restaurant, RestaurantLog, User } from "@/types/entities";

const r = (id: string, cuisines: string[], price_level: Restaurant["price_level"], tags: string[], neighborhood: string): Restaurant => ({ id, name: id, cuisines, price_level, tags, neighborhood });
const l = (restaurant_id: string, overall_rating: number, review?: string): RestaurantLog => ({ id: restaurant_id + overall_rating, user_id: "u", restaurant_id, visited_at: "2026-09-01", overall_rating, review });
const user: User = { id: "u", email: "u@example.com" };

describe("computeTasteProfile", () => {
  it("is empty without logs", () => {
    expect(computeTasteProfile([], [], user)).toEqual({ favorite_cuisines: [], preferred_price: [], favorite_types: [], preferred_locations: [] });
  });

  it("ranks cuisines, prices, tags, and neighbourhoods by frequency", () => {
    const restaurants = [r("a", ["Italian"], "$$", ["cozy"], "Chapinero"), r("b", ["Italian", "Pizza"], "$$$", ["cozy", "date"], "Usaquen")];
    const logs = [l("a", 4), l("b", 5), l("a", 3)];
    const p = computeTasteProfile(logs, restaurants, user);
    expect(p.favorite_cuisines[0]).toBe("Italian");
    expect(p.preferred_price).toEqual(["$$", "$$$"]);
    expect(p.favorite_types[0]).toBe("cozy");
    expect(p.preferred_locations[0]).toBe("Chapinero");
  });

  it("prefers the user's declared favourite cuisines", () => {
    const p = computeTasteProfile([l("a", 4)], [r("a", ["Italian"], "$", [], "X")], { ...user, favorite_cuisines: ["Thai"] });
    expect(p.favorite_cuisines).toEqual(["Thai"]);
  });
});

describe("computeLogStats", () => {
  it("counts logs and reviews and averages ratings to one decimal", () => {
    expect(computeLogStats([l("a", 4, "nice"), l("b", 5)])).toEqual({ logged: 2, reviews: 1, average: "4.5" });
    expect(computeLogStats([])).toEqual({ logged: 0, reviews: 0, average: "0.0" });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

`pnpm test -- taste-profile` fails with cannot find module.

- [ ] **Step 3: Write the helpers**

`src/features/profile/taste-profile.ts`:
```ts
import type { Restaurant, RestaurantLog, User } from "@/types/entities";

export interface TasteSummary {
  favorite_cuisines: string[];
  preferred_price: string[];
  favorite_types: string[];
  preferred_locations: string[];
}

function top(counts: Map<string, number>, n: number): string[] {
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
}

function bump(counts: Map<string, number>, key: string | undefined) {
  if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
}

export function computeTasteProfile(logs: RestaurantLog[], restaurants: Restaurant[], user: User | null): TasteSummary {
  const empty: TasteSummary = { favorite_cuisines: [], preferred_price: [], favorite_types: [], preferred_locations: [] };
  if (logs.length === 0) return empty;
  const byId = new Map(restaurants.map((r) => [r.id, r]));
  const cuisines = new Map<string, number>();
  const prices = new Map<string, number>();
  const tags = new Map<string, number>();
  const places = new Map<string, number>();
  for (const log of logs) {
    const r = byId.get(log.restaurant_id);
    if (!r) continue;
    r.cuisines.forEach((c) => bump(cuisines, c));
    bump(prices, r.price_level);
    (r.tags ?? []).forEach((t) => bump(tags, t));
    bump(places, r.neighborhood ?? r.city);
  }
  return {
    favorite_cuisines: user?.favorite_cuisines?.length ? user.favorite_cuisines : top(cuisines, 5),
    preferred_price: top(prices, 2),
    favorite_types: top(tags, 5),
    preferred_locations: top(places, 4),
  };
}

export interface LogStats {
  logged: number;
  reviews: number;
  average: string;
}

export function computeLogStats(logs: RestaurantLog[]): LogStats {
  const reviews = logs.filter((l) => l.review && l.review.length > 0).length;
  const sum = logs.reduce((s, l) => s + (l.overall_rating ?? 0), 0);
  return { logged: logs.length, reviews, average: (logs.length ? sum / logs.length : 0).toFixed(1) };
}
```

- [ ] **Step 4: Run it to verify it passes**

`pnpm test -- taste-profile`: 4 passing.

- [ ] **Step 5: Write the update mutation**

`src/features/profile/mutations.ts`:
```ts
import { useMutation } from "@tanstack/react-query";

import { useSession } from "@/features/auth/session-provider";
import { base44 } from "@/lib/base44";

export interface ProfileUpdate {
  home_city: string;
  favorite_cuisines: string[];
}

export function useUpdateProfile() {
  const { refreshUser } = useSession();
  return useMutation({
    mutationFn: async (update: ProfileUpdate) => {
      await base44.auth.updateMe(update);
      await refreshUser();
    },
  });
}
```

- [ ] **Step 6: Write the profile screen**

`src/screens/profile/index.tsx`:
```tsx
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenLoader } from "@/components/screen-loader";
import { useCurrentUser, useSession } from "@/features/auth/session-provider";
import { computeLogStats, computeTasteProfile } from "@/features/profile/taste-profile";
import { useMyLogs, useRestaurants } from "@/features/restaurants/queries";
import { colors, radius, spacing, text } from "@/theme";

export function ProfileScreen() {
  const router = useRouter();
  const user = useCurrentUser();
  const { signOut } = useSession();
  const logs = useMyLogs();
  const restaurants = useRestaurants();

  const stats = useMemo(() => computeLogStats(logs.data ?? []), [logs.data]);
  const taste = useMemo(() => computeTasteProfile(logs.data ?? [], restaurants.data ?? [], user), [logs.data, restaurants.data, user]);

  if (!user || logs.isPending) return <ScreenLoader />;

  const initial = (user.full_name || user.email || "K")[0].toUpperCase();
  const username = "@" + user.email.split("@")[0];

  const confirmLogout = () =>
    Alert.alert("Log out?", undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => void signOut() },
    ]);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View>
          <Text style={styles.name}>{user.full_name || "Food explorer"}</Text>
          <Text style={styles.username}>{username}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <Stat label="Logged" value={String(stats.logged)} />
        <Stat label="Reviews" value={String(stats.reviews)} />
        <Stat label="Avg rating" value={stats.average} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>MIA taste profile</Text>
        <Taste label="Favorite cuisines" items={taste.favorite_cuisines} />
        <Taste label="Preferred price range" items={taste.preferred_price} />
        <Taste label="Favorite restaurant types" items={taste.favorite_types} />
        <Taste label="Preferred locations" items={taste.preferred_locations} />
        {stats.logged === 0 ? <Text style={styles.hint}>Log restaurants to unlock your taste profile.</Text> : null}
      </View>

      <View style={styles.rows}>
        <Row label="Edit profile" onPress={() => router.push("/edit-profile")} />
        <Row label="Log out" onPress={confirmLogout} destructive />
      </View>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Taste({ label, items }: { label: string; items: string[] }) {
  return (
    <View style={styles.taste}>
      <Text style={styles.overline}>{label}</Text>
      <View style={styles.chips}>
        {items.length ? items.map((t) => <Text key={t} style={styles.chip}>{t}</Text>) : <Text style={styles.hint}>Nothing yet</Text>}
      </View>
    </View>
  );
}

function Row({ label, onPress, destructive }: { label: string; onPress: () => void; destructive?: boolean }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={[styles.rowLabel, destructive && styles.rowDanger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  identity: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  avatar: { width: 72, height: 72, borderRadius: radius.pill, backgroundColor: colors.yellow, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 28, fontWeight: "900", color: colors.navy },
  name: text.title,
  username: text.caption,
  stats: { flexDirection: "row", gap: spacing.md },
  stat: { flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, alignItems: "center", gap: spacing.xs },
  statValue: { fontSize: 22, fontWeight: "900", color: colors.navy },
  statLabel: text.overline,
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  cardTitle: text.heading,
  taste: { gap: spacing.xs },
  overline: text.overline,
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { ...text.caption, color: colors.ink, backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  hint: text.caption,
  rows: { backgroundColor: colors.white, borderRadius: radius.xl, overflow: "hidden" },
  row: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowLabel: text.bodyStrong,
  rowDanger: { color: colors.danger },
});
```

- [ ] **Step 7: Write the edit sheet and route**

`src/screens/edit-profile/index.tsx`:
```tsx
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { TextField } from "@/components/text-field";
import { useCurrentUser } from "@/features/auth/session-provider";
import { useUpdateProfile } from "@/features/profile/mutations";
import { colors, spacing, text } from "@/theme";

export function EditProfileScreen() {
  const router = useRouter();
  const user = useCurrentUser();
  const update = useUpdateProfile();
  const [homeCity, setHomeCity] = useState(user?.home_city ?? "");
  const [cuisines, setCuisines] = useState((user?.favorite_cuisines ?? []).join(", "));

  const save = async () => {
    try {
      await update.mutateAsync({
        home_city: homeCity.trim(),
        favorite_cuisines: cuisines.split(",").map((c) => c.trim()).filter(Boolean),
      });
      router.back();
    } catch (e) {
      Alert.alert("Could not update your profile", e instanceof Error ? e.message : undefined);
    }
  };

  return (
    <View style={styles.root}>
      <Text style={styles.overline}>Profile</Text>
      <Text style={styles.title}>Edit profile</Text>
      <TextField label="Name" value={user?.full_name ?? ""} editable={false} />
      <TextField label="Home city" value={homeCity} onChangeText={setHomeCity} placeholder="e.g. Bogota" />
      <TextField label="Favorite cuisines" value={cuisines} onChangeText={setCuisines} placeholder="Italian, Japanese" autoCapitalize="words" />
      <PrimaryButton onPress={() => void save()} loading={update.isPending}>
        Save
      </PrimaryButton>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.xl, gap: spacing.lg, backgroundColor: colors.surface },
  overline: { ...text.overline, color: colors.orange },
  title: text.title,
});
```

`src/app/edit-profile.tsx`:
```tsx
import { EditProfileScreen } from "@/screens/edit-profile";

export default function EditProfileRoute() {
  return <EditProfileScreen />;
}
```

In `src/app/_layout.tsx`, inside the first `Stack.Protected` after `log-visit`, register:
```tsx
<Stack.Screen
  name="edit-profile"
  options={{ presentation: "formSheet", sheetAllowedDetents: [0.7, 1], sheetGrabberVisible: true, headerShown: false }}
/>
```

`src/app/(tabs)/(map,search,lists,profile)/profile.tsx` renders `<ProfileScreen />`.

- [ ] **Step 8: Verify with the bypass**

Profile shows the initial, name or "Food explorer", username, three stats, the taste card (Colombian appears from the one log), and the two rows. Edit profile opens as a sheet; change home city to "Bogota" and save; the sheet closes and the profile re-renders. Do NOT tap Log out with the user's account beyond the confirmation dialog: open it, screenshot, tap Cancel. Revert the bypass.

- [ ] **Step 9: Gates and commit**

Commit: `Add the profile tab with taste summary and edit sheet`.

---

### Task 6: Search tab and shared restaurant actions

**Files:**
- Create: `src/features/restaurants/filter.ts` (moved), `src/features/restaurants/filter.test.ts` (moved), `src/features/restaurants/use-restaurant-actions.ts`, `src/components/mia-card.tsx`, `src/screens/search/index.tsx`
- Delete: `src/screens/map/filter.ts`, `src/screens/map/filter.test.ts`
- Modify: `src/screens/map/index.tsx`, `src/screens/map/index.web.tsx`, `src/app/(tabs)/(map,search,lists,profile)/search.tsx`

- [ ] **Step 1: Move the filter**

`git mv src/screens/map/filter.ts src/features/restaurants/filter.ts` and the test alongside; fix the two import paths in `src/screens/map/index.tsx` and `index.web.tsx` to `@/features/restaurants/filter`. Gates pass. Commit: `Move the restaurant query filter into the restaurants feature`.

- [ ] **Step 2: Extract the shared actions**

`src/features/restaurants/use-restaurant-actions.ts`:
```ts
import { useRouter } from "expo-router";
import { Alert } from "react-native";

import type { Restaurant } from "@/types/entities";

import { useSaveRestaurant } from "./mutations";

// Save and log-visit behave the same on every screen that shows a restaurant card.
export function useRestaurantActions(beforeLog?: () => void) {
  const router = useRouter();
  const save = useSaveRestaurant();

  const onSave = async (r: Restaurant) => {
    try {
      const result = await save.mutateAsync(r);
      Alert.alert(result === "saved" ? "Saved to Want to try" : "Already in Want to try");
    } catch (e) {
      Alert.alert("Could not save", e instanceof Error ? e.message : undefined);
    }
  };

  const onLog = (r: Restaurant) => {
    beforeLog?.();
    router.push({ pathname: "/log-visit", params: { id: r.id } });
  };

  return { onSave, onLog };
}
```

In `src/screens/map/index.tsx`, replace the local `onSave` and `onLog` with `const { onSave, onLog } = useRestaurantActions(() => setSelected(null));` and drop the now unused imports. In `index.web.tsx`, use `useRestaurantActions()` for both handlers. Commit: `Share save and log-visit handlers across restaurant screens`.

- [ ] **Step 3: Write the MIA card**

`src/components/mia-card.tsx`:
```tsx
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, text } from "@/theme";

export function MiaCard() {
  return (
    <Link href="/mia" asChild>
      <Pressable style={styles.card}>
        <Text style={styles.overline}>Meet MIA</Text>
        <Text style={styles.title}>Recommendations made for you</Text>
        <Text style={styles.body}>Every rating and restaurant you save helps MIA learn your cuisines, price range, neighborhoods, and dining style.</Text>
        <View style={styles.cta}>
          <Text style={styles.ctaText}>Ask MIA</Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.navy, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  overline: { ...text.overline, color: colors.yellow },
  title: { ...text.heading, color: colors.white },
  body: { ...text.body, color: colors.white, opacity: 0.8 },
  cta: { alignSelf: "flex-start", backgroundColor: colors.orange, borderRadius: radius.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, marginTop: spacing.xs },
  ctaText: { ...text.bodyStrong, color: colors.white },
});
```

- [ ] **Step 4: Write the search screen**

`src/screens/search/index.tsx`:
```tsx
import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { MiaCard } from "@/components/mia-card";
import { RestaurantCard } from "@/components/restaurant-card";
import { ScreenLoader } from "@/components/screen-loader";
import { matchesQuery } from "@/features/restaurants/filter";
import { useRestaurants } from "@/features/restaurants/queries";
import { useRestaurantActions } from "@/features/restaurants/use-restaurant-actions";
import { spacing, text } from "@/theme";

export function SearchScreen() {
  const restaurants = useRestaurants();
  const { onSave, onLog } = useRestaurantActions();
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () =>
      (restaurants.data ?? [])
        .filter((r) => matchesQuery(r, query))
        .sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0)),
    [restaurants.data, query],
  );

  if (restaurants.isPending) return <ScreenLoader />;

  return (
    <>
      <Stack.SearchBar placeholder="Cuisine, restaurant, neighborhood" onChangeText={(e) => setQuery(e.nativeEvent.text)} hideWhenScrolling={false} />
      <FlatList
        data={visible}
        keyExtractor={(r) => r.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <MiaCard />
            <View style={styles.titleRow}>
              <Text style={styles.title}>Top picks</Text>
              <Text style={styles.count}>{visible.length} places</Text>
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No restaurants match your search.</Text>}
        renderItem={({ item }) => <RestaurantCard restaurant={item} onSave={onSave} onLog={onLog} />}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  header: { gap: spacing.lg },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  title: text.heading,
  count: text.caption,
  empty: { ...text.caption, textAlign: "center", padding: spacing.xl },
});
```

`src/app/(tabs)/(map,search,lists,profile)/search.tsx` renders `<SearchScreen />`.

- [ ] **Step 5: Verify with the bypass**

Search tab lists five cards sorted by rating under the MIA card; the header search (icon on Android) filters; Save and Log visit work from a card; the MIA card opens the placeholder sheet. Screenshot. Revert the bypass.

- [ ] **Step 6: Gates and commit**

Commit: `Add the search tab`.

---

### Task 7: MIA chat sheet

**Files:**
- Create: `src/features/mia/chat.ts`, `src/features/mia/chat.test.ts`, `src/features/mia/use-mia-chat.ts`, `src/screens/mia/index.tsx`
- Modify: `src/app/mia.tsx`, `src/app/(tabs)/(map,search,lists,profile)/_layout.tsx`

**Interfaces:**
- Consumes: `base44.functions.invoke("miaChat", { message, history })` resolving to `{ data: { reply: string } }`.
- Produces: `ChatMessage`, `GREETING`, `SUGGESTIONS`, `historyFor(messages)`, `useMiaChat()`, `<MiaScreen />`.

- [ ] **Step 1: Write the failing chat test**

`src/features/mia/chat.test.ts`:
```ts
import { type ChatMessage, GREETING, historyFor } from "./chat";

const m = (role: ChatMessage["role"], content: string): ChatMessage => ({ id: content, role, content });

describe("historyFor", () => {
  it("sends only role and content", () => {
    expect(historyFor([m("assistant", "hi"), m("user", "yo")])).toEqual([
      { role: "assistant", content: "hi" },
      { role: "user", content: "yo" },
    ]);
  });

  it("keeps the last eight messages", () => {
    const many = Array.from({ length: 12 }, (_, i) => m("user", String(i)));
    expect(historyFor(many).map((h) => h.content)).toEqual(["4", "5", "6", "7", "8", "9", "10", "11"]);
  });

  it("has a greeting without emojis", () => {
    expect(GREETING.role).toBe("assistant");
    expect(/[\u{1F300}-\u{1FAFF}]/u.test(GREETING.content)).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

`pnpm test -- mia/chat` fails with cannot find module.

- [ ] **Step 3: Write the chat model**

`src/features/mia/chat.ts`:
```ts
export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
}

export const GREETING: ChatMessage = {
  id: "greeting",
  role: "assistant",
  content: "Hola, soy MIA, tu asistente de restaurantes en KOMIA. Preguntame que lugar probar, que pedir, o donde ir segun tu gusto.",
};

export const SUGGESTIONS = [
  "Donde puedo cenar bien en Chapinero?",
  "Recomiendame algo para una cita",
  "Que pedir en un brunch?",
  "Lugares baratos y buenos",
];

export const FAILURE_REPLY = "Tuve un problema conectandome. Intenta de nuevo.";

// The backend keeps the last eight turns; send no more than that.
export function historyFor(messages: ChatMessage[]): { role: ChatMessage["role"]; content: string }[] {
  return messages.slice(-8).map(({ role, content }) => ({ role, content }));
}
```

- [ ] **Step 4: Run it to verify it passes**

`pnpm test -- mia/chat`: 3 passing.

- [ ] **Step 5: Write the hook**

`src/features/mia/use-mia-chat.ts`:
```ts
import { useCallback, useState } from "react";

import { base44 } from "@/lib/base44";

import { type ChatMessage, FAILURE_REPLY, GREETING, historyFor } from "./chat";

let counter = 0;
const nextId = () => `m${Date.now()}-${counter++}`;

export function useMiaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [loading, setLoading] = useState(false);

  const send = useCallback(
    async (raw: string) => {
      const content = raw.trim();
      if (!content || loading) return;
      const history = historyFor(messages);
      const next = [...messages, { id: nextId(), role: "user" as const, content }];
      setMessages(next);
      setLoading(true);
      try {
        const res = (await base44.functions.invoke("miaChat", { message: content, history })) as { data?: { reply?: string } };
        const reply = res.data?.reply ?? FAILURE_REPLY;
        setMessages([...next, { id: nextId(), role: "assistant", content: reply }]);
      } catch {
        setMessages([...next, { id: nextId(), role: "assistant", content: FAILURE_REPLY }]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading],
  );

  return { messages, loading, send };
}
```

- [ ] **Step 6: Write the screen**

`src/screens/mia/index.tsx`:
```tsx
import { useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { SUGGESTIONS } from "@/features/mia/chat";
import { useMiaChat } from "@/features/mia/use-mia-chat";
import { colors, radius, spacing, text } from "@/theme";

export function MiaScreen() {
  const { messages, loading, send } = useMiaChat();
  const [input, setInput] = useState("");

  const submit = () => {
    const value = input;
    setInput("");
    void send(value);
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <Text style={styles.overline}>MIA</Text>
        <Text style={styles.title}>Tu asistente gastronomico</Text>
      </View>
      <FlatList
        data={[...messages].reverse()}
        inverted
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.bubbleRow, item.role === "user" && styles.bubbleRowUser]}>
            <Text style={[styles.bubble, item.role === "user" ? styles.bubbleUser : styles.bubbleAssistant]}>{item.content}</Text>
          </View>
        )}
        ListHeaderComponent={loading ? <Text style={styles.typing}>MIA esta escribiendo</Text> : null}
      />
      {messages.length <= 1 ? (
        <View style={styles.suggestions}>
          {SUGGESTIONS.map((s) => (
            <Pressable key={s} onPress={() => void send(s)} style={styles.suggestion}>
              <Text style={styles.suggestionText}>{s}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <View style={styles.composer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Preguntale a MIA"
          placeholderTextColor={colors.inkFaint}
          style={styles.input}
          onSubmitEditing={submit}
          returnKeyType="send"
        />
        <Pressable onPress={submit} disabled={loading || input.trim().length === 0} style={[styles.sendButton, (loading || input.trim().length === 0) && styles.sendDisabled]}>
          <Text style={styles.sendText}>Enviar</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { backgroundColor: colors.navy, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, gap: spacing.xs },
  overline: { ...text.overline, color: colors.yellow },
  title: { ...text.heading, color: colors.white },
  list: { padding: spacing.lg, gap: spacing.sm },
  bubbleRow: { flexDirection: "row", justifyContent: "flex-start" },
  bubbleRowUser: { justifyContent: "flex-end" },
  bubble: { ...text.body, maxWidth: "80%", borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, overflow: "hidden" },
  bubbleAssistant: { backgroundColor: colors.white },
  bubbleUser: { backgroundColor: colors.yellow, fontWeight: "600" },
  typing: { ...text.caption, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  suggestions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  suggestion: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  suggestionText: text.caption,
  composer: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.white },
  input: { flex: 1, height: 44, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, paddingHorizontal: spacing.lg, ...text.body },
  sendButton: { height: 44, borderRadius: radius.pill, backgroundColor: colors.orange, paddingHorizontal: spacing.lg, alignItems: "center", justifyContent: "center" },
  sendDisabled: { opacity: 0.5 },
  sendText: { ...text.bodyStrong, color: colors.white },
});
```

`src/app/mia.tsx` renders `<MiaScreen />`.

- [ ] **Step 7: Open MIA from every tab header**

In `src/app/(tabs)/(map,search,lists,profile)/_layout.tsx`, give the tab screen a header button on both platforms:

```tsx
import { Link, Stack } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
```

and change the tab `Stack.Screen` options to:

```tsx
<Stack.Screen
  name={screen}
  options={{
    title: titles[screen],
    headerLargeTitleEnabled: true,
    headerRight: () => (
      <Link href="/mia" asChild>
        <Pressable hitSlop={8} style={styles.mia}>
          <Text style={styles.miaText}>MIA</Text>
        </Pressable>
      </Link>
    ),
  }}
/>
```

with, at the bottom of the file:

```tsx
const styles = StyleSheet.create({
  mia: { backgroundColor: colors.orange, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  miaText: { ...text.caption, color: colors.white },
});
```

(import `radius`, `spacing`, `text` from `@/theme`). The map screen sets `title: ""` and `headerTransparent`; confirm the MIA button still shows there.

- [ ] **Step 8: Verify with the bypass**

Tap MIA from the map header: the sheet opens with the greeting and four suggestions; tap a suggestion; a reply arrives from the backend (the function calls the LLM, so allow a few seconds); type a message and send. Screenshot the conversation. Revert the bypass.

- [ ] **Step 9: Gates and commit**

Commit: `Add the MIA chat sheet and header button`.

---

### Task 8: Docs and repo cleanup

**Files:**
- Modify: `README.md`, `CLAUDE.md`, `AGENTS.md`, `docs/superpowers/specs/2026-09-13-expo-migration-design.md`

- [ ] **Step 1: Rewrite README.md**

Keep the intro, then these sections in order: Requirements (Node 22.13+, pnpm 11, Android Studio with an emulator and a Google Maps Android key, Xcode for iOS), Run locally (`.env` from `.env.example` including the Maps key, `pnpm android` for the first native build and after native changes, `pnpm start` plus the installed app for JS changes, `pnpm ios`, `pnpm web` as development-only), Checks (`pnpm lint`, `pnpm typecheck`, `pnpm test`), Project layout (the `src/` tree from the spec's section 1 as it exists now, plus `base44/`), Publish (unchanged), Docs (unchanged). Plain language, no emojis.

- [ ] **Step 2: Rewrite CLAUDE.md**

Replace the "What this is", "Commands", and "Architecture" sections to describe the Expo app: routes in `src/app`, screens, features, the session provider and gate, the data layer on TanStack Query, styling rules, the Android dev build requirement for maps, the no-emoji rule, and the gates. Keep the user's "How to talk to the user" section verbatim at the end.

- [ ] **Step 3: Update AGENTS.md**

Replace the Vite references (`vite.config.js`, `pnpm dev`, `serveCommand`) with the Expo commands from the README. Keep the Base44 references.

- [ ] **Step 4: Update the spec's open items**

In the spec, under "Open items", record: Google login outcome A is provisional until the user completes a round trip; Android needs a development build for Google Maps (Expo Go cannot use the app's key); brand icons are still the template placeholders.

- [ ] **Step 5: Gates and commit**

One commit per file: `Rewrite README for the Expo app`, `Describe the Expo app in CLAUDE.md`, `Point AGENTS.md at the Expo commands`, `Record the remaining open items in the migration spec`.

---

## Done criteria for Plan B

- Every tab and sheet has a real screen; no "(placeholder)" text remains in `src/`.
- The onboarding flow renders all seven steps; the user completes it on their own account.
- My logs, log detail, profile, edit profile, search, and MIA verified on the Android dev build with the user's account (via the temporary bypass where needed, always reverted).
- Gates clean, one logical change per commit, no trailers, no emojis.
- README, CLAUDE.md, AGENTS.md describe the Expo app.

## Out of scope, noted for later

- Brand icons and splash artwork (need assets from the owner).
- Transparent map header and native search bar polish on Android; Expo UI button tint on Android.
- Dark mode. Offline retry screen. PKCE or state check on the Google login flow.
- A browser-render bar for web checks; web stays development-only.
