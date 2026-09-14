import { Redirect } from "expo-router";

import { useSession } from "@/features/auth/session-provider";

// The root path has no screen of its own: signed-in users go to the map,
// everyone else to login. The gate in _layout.tsx handles onboarding.
export default function IndexRoute() {
  const { state } = useSession();
  return <Redirect href={state.status === "signed-in" ? "/map" : "/login"} />;
}
