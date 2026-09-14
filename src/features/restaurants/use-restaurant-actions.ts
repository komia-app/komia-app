import { useRouter } from "expo-router";
import { Alert } from "react-native";

import type { Restaurant } from "@/types/entities";

import { useSaveRestaurant } from "./mutations";

// Save and log-visit behave the same on every screen that shows a restaurant card.
export function useRestaurantActions(beforeLog?: () => void) {
  const router = useRouter();
  const save = useSaveRestaurant();

  const onSave = async (r: Restaurant) => {
    try {
      const result = await save.mutateAsync(r);
      Alert.alert(result === "saved" ? "Saved to Want to try" : "Already in Want to try");
    } catch (e) {
      Alert.alert("Could not save", e instanceof Error ? e.message : undefined);
    }
  };

  const onLog = (r: Restaurant) => {
    beforeLog?.();
    router.push({ pathname: "/log-visit", params: { id: r.id } });
  };

  return { onSave, onLog };
}
