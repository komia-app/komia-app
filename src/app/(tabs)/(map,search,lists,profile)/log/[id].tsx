import { useLocalSearchParams } from "expo-router";

import { LogDetailScreen } from "@/screens/log-detail";

export default function LogDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LogDetailScreen id={id ?? ""} />;
}
