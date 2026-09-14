import { Redirect } from "expo-router";

import { useSession } from "@/features/auth/session-provider";

// Unknown routes fall back to the map tab for onboarded users, to onboarding
// for signed-in users who have not finished it, or to login when signed out.
export default function NotFoundRoute() {
  const { state } = useSession();
  const target = state.status !== "signed-in" ? "/login" : state.user.onboarding_completed === true ? "/map" : "/onboarding";
  return <Redirect href={target} />;
}
