# KOMIA code standards

Each rule has an id so a review can name it. A rule applies to code that is
added or changed. Old code that breaks a rule is left alone unless the task is
about it.

## Where code goes

- **ORG-1** `src/app/` holds route files only. A route file renders one screen
  from `src/screens/<name>/` and does nothing else: no hooks, no state, no
  styles. Layout files (`_layout.tsx`) are the one exception and may hold
  navigator setup.
- **ORG-2** A screen's body lives in `src/screens/<name>/index.tsx`. Parts used
  by only that screen sit next to it in the same folder. A component moves to
  `src/components/` only once a second screen uses it.
- **ORG-3** Data code lives in `src/features/<domain>/`: query keys in
  `keys.ts`, reads in `queries.ts`, writes in `mutations.ts`. Logic that does
  not need React (building a payload, filtering, grouping, date math) goes in
  its own plain file with a `*.test.ts` next to it.
- **ORG-4** When platforms need different code beyond a line or two, add a
  platform file next to the shared one (`<name>.web.tsx`, `<name>.ios.tsx`,
  `<name>.android.tsx`) with the same exports. Do not spread `Platform.OS`
  checks through a component. Imports from `@expo/ui/swift-ui` or
  `@expo/ui/jetpack-compose` go only in platform files.
- **ORG-5** File and folder names are kebab-case. Components and screens are
  PascalCase named exports (`export function MapScreen`). Route files use a
  default export, because Expo Router requires it.
- **ORG-6** Imports come in three groups with a blank line between them:
  packages, then `@/` paths, then `./` paths. Use `@/` across folders and `./`
  inside one feature or screen folder.

## Data and backend

- **DATA-1** Only files in `src/features/` call `base44.entities.*` or
  `base44.functions.*`. Screens and components call the hooks those files
  export.
- **DATA-2** Every query key comes from the factory in that feature's
  `keys.ts`, built from the most general part to the most specific
  (`["logs", "detail", id]`). No array literals as keys inside hooks. No
  `undefined` inside a key.
- **DATA-3** A query that needs the signed-in user takes `userId` from
  `useCurrentUser()`, puts it in the key, and sets
  `enabled: userId.length > 0`. Never use `user!.id`.
- **DATA-4** Every write goes through `useMutation`. On success it invalidates
  the keys whose data it changed, with `void client.invalidateQueries(...)`.
  Screens never call `refetch()` to pick up their own writes.
- **DATA-5** Data from the backend stays in the query cache. Do not copy
  `query.data` into `useState`. Derive filtered or sorted views during render.
- **DATA-6** List reads (`list`, `filter`) pass `PAGE_LIMIT`. The SDK default
  page is small and silently cuts results.
- **DATA-7** A new or renamed field is changed in three places together:
  `base44/entities/<Entity>.jsonc`, `src/types/entities.ts`, and the code that
  uses it. Every entity keeps an `rls` block. Never widen an `rls` rule to make
  a screen work.
- **DATA-8** A backend function in `base44/functions/` gets the user from
  `createClientFromRequest(req)` and `base44.auth.me()`, and returns 401 when
  there is none. It never trusts a `user_id` sent in the request body.
- **DATA-9** Dates from the backend are calendar days (`YYYY-MM-DD`) in local
  time. Parse them with `parseVisitDate` and write them with
  `localDateString`. Never use `Date.parse`, `new Date(string)`, or
  `toISOString()` on them.

## React

- **RCT-1** React Compiler is on (`experiments.reactCompiler` in
  `app.config.ts`). Do not add `useMemo`, `useCallback`, or `React.memo` for
  speed. The compiler does that.
- **RCT-2** `useEffect` is only for keeping in step with something outside
  React: a subscription, a timer, a native API, the splash screen. It always
  returns a cleanup when it starts something. Do not use it to compute a value
  from props or state (compute it in render), to react to a tap (do it in the
  handler), or to reset state when a prop changes (pass a `key`).
- **RCT-3** Components and hooks are pure. They do not change props, state, or
  module variables during render. Hooks are called at the top level, never
  inside a condition, loop, or early return.
- **RCT-4** A screen that reads data handles three cases on screen: loading
  (`isPending`, shown with `ScreenLoader`), failure (`isError`, a message and a
  way to retry), and no rows (a short empty message). A spinner that never ends
  on failure is a bug.
- **RCT-5** List item keys are stable ids from the data, never the array index.

## UI

- **UI-1** Colours, spacing, radii, and text styles come from `@/theme`. Hex
  values and raw `rgba()` appear only in `src/theme.ts` and `app.config.ts`.
  If a value is missing, add a token to `src/theme.ts`.
- **UI-2** Styles go in one `StyleSheet.create` at the bottom of the file. An
  inline style object is only for a value computed at render time.
- **UI-3** For sheets, pickers, sliders, switches, and menus, use `@expo/ui`.
  Do not add a community picker or bottom-sheet library.
- **UI-4** Images use `Image` from `expo-image`, not from `react-native`.
- **UI-5** Data from the backend renders in `FlatList` or `SectionList`, never
  as `.map()` inside a `ScrollView`.
- **UI-6** Scroll views and lists set `contentInsetAdjustmentBehavior="automatic"`
  or use `react-native-safe-area-context`. No fixed top padding to clear the
  status bar.
- **UI-7** Icons come from `expo-symbols` or `@expo/vector-icons`.
- **UI-8** Links to routes with ids use the object form, so typed routes check
  them: `{ pathname: "/log/[id]", params: { id } }`. Never build a path by
  joining strings.
- **UI-9** Who may see which screens is decided only by the `Stack.Protected`
  guards in `src/app/_layout.tsx`. No `useEffect` or `<Redirect>` auth checks in
  screens. A temporary bypass such as `const onboarded = signedIn;` is never
  committed.
- **UI-10** An Expo UI `Button` takes its text through the `label` prop. A
  string child crashes on Android.
- **UI-11** Text shown to users has no emojis and no raw markdown markers.

## Accessibility

- **A11Y-1** Every `Pressable` (and any other touchable) sets
  `accessibilityRole`. One whose content is not plain text, such as an icon
  button, also sets `accessibilityLabel`.
- **A11Y-2** An image that carries meaning has `accessibilityLabel`. A purely
  decorative one sets `accessible={false}`.
- **A11Y-3** A `TextInput` has a visible label or an `accessibilityLabel`. A
  placeholder alone does not count.
- **A11Y-4** Touch targets are at least 44 by 44 points. Use `hitSlop` to grow
  a small icon.
- **A11Y-5** Section titles set `accessibilityRole="header"`.

## TypeScript

- **TS-1** No `any`, `@ts-ignore`, or `@ts-expect-error`. Use `unknown` and
  narrow it. `as` casts are only for SDK results in `src/features/`, cast to a
  type from `@/types/entities`.
- **TS-2** No non-null `!` on a value that can be missing at run time.
- **TS-3** Type-only imports use `import type`.
- **TS-4** Use string unions and discriminated unions (like the session
  `status`) instead of `enum` or loose booleans.
- **TS-5** Every promise is awaited, returned, or marked `void`. A network call
  in a screen runs through a mutation or inside `try`/`catch`, and the user
  sees an `Alert` or an inline message when it fails.
- **TS-6** No `console.log` or `console.error` in `src/`.

## Security

- **SEC-1** Anything named `EXPO_PUBLIC_*` is copied into the app bundle in
  plain text. Only values that are safe to publish go there. Real secrets live
  in the Base44 function environment and are read only in `base44/functions/`.
  Read env vars with dot notation (`process.env.EXPO_PUBLIC_X`); other forms
  are not filled in.
- **SEC-2** The session token is read and written only through
  `src/features/auth/session-store`. Never put tokens or passwords in
  AsyncStorage, logs, error messages, or query keys.
- **SEC-3** Checks in the app are for the user's convenience. Real protection is
  the `rls` block and the auth check in backend functions. Every new entity or
  function decides who may read and write before it ships.
- **SEC-4** Route params and deep-link values are untrusted text. Check their
  shape before using them in a query or URL.
- **SEC-5** Open outside links with `expo-web-browser` and only for `https:`
  URLs.
- **SEC-6** Text a user types that goes into an LLM prompt (MIA) is kept apart
  from the instructions and treated as data, never as instructions.
- **SEC-7** No new package without asking the user first. Add an Expo or React
  Native package with `pnpm expo install <pkg>` so it matches the SDK.
- **SEC-8** Never write the values of `KOMIA_TEST_EMAIL`,
  `KOMIA_TEST_PASSWORD`, or any `.env` value into a committed file.

## Tests and checks

- **TEST-1** New logic in a plain file under `src/features/` comes with a
  `*.test.ts` next to it.
- **TEST-2** A bug fix comes with a test that fails without the fix.
- **TEST-3** Screens are checked by running the app, not with snapshot tests.
  When a component test is written, it finds elements by role, label, or text
  (`getByRole`, `getByLabelText`, `getByText`), not by `testID` first, and
  uses `userEvent` for taps and typing. A test asserts real behaviour, not only
  that a mock was called.
- **TEST-4** `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass with no errors
  before the work is called done.

## Comments and commits

- **CMT-1** A comment says why the code is this way, not what it does. Most
  functions need none. Match the sparse style of the files around it.
- **CMT-2** No emojis in code, comments, copy, docs, or commit messages. Write
  in plain words.
- **CMT-3** One logical change per commit, with an imperative subject line and
  no trailers. A refactor and a behaviour change go in separate commits.
