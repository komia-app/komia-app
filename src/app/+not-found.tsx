import { Redirect } from "expo-router";

// Unknown routes fall back to the map tab.
export default function NotFoundRoute() {
  return <Redirect href="/map" />;
}
