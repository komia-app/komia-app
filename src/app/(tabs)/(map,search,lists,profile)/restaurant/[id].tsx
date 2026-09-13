import { useLocalSearchParams } from "expo-router";

import { RestaurantDetailScreen } from "@/screens/restaurant-detail";

export default function RestaurantRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RestaurantDetailScreen id={id ?? ""} />;
}
