import { Redirect } from "expo-router";

// The root path has no screen of its own. The gate in _layout.tsx sends
// signed-out users to login when the map is not allowed.
export default function IndexRoute() {
  return <Redirect href="/map" />;
}
