import { Redirect } from "expo-router";

import { useSession } from "@/features/auth/session-provider";

// Unknown routes fall back to the map tab, or to login when signed out.
export default function NotFoundRoute() {
  const { state } = useSession();
  return <Redirect href={state.status === "signed-in" ? "/map" : "/login"} />;
}
