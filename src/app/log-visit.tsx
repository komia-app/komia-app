import { useLocalSearchParams } from "expo-router";

import { LogVisitScreen } from "@/screens/log-visit";

export default function LogVisitRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LogVisitScreen restaurantId={id ?? ""} />;
}
