import { Redirect } from "expo-router";

import { useSession } from "@/features/auth/session-provider";

// The root path has no screen of its own: signed-in users who have finished
// onboarding go to the map, signed-in users who have not go to onboarding,
// and everyone else goes to login.
export default function IndexRoute() {
  const { state } = useSession();
  const target = state.status !== "signed-in" ? "/login" : state.user.onboarding_completed === true ? "/map" : "/onboarding";
  return <Redirect href={target} />;
}
