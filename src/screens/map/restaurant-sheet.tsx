import { BottomSheet, Host, RNHostView } from "@expo/ui";
import { StyleSheet, View } from "react-native";

import { RestaurantCard } from "@/components/restaurant-card";
import { spacing } from "@/theme";
import type { Restaurant } from "@/types/entities";

interface RestaurantSheetProps {
  restaurant: Restaurant | null;
  onDismiss: () => void;
  onSave: (r: Restaurant) => void;
  onLog: (r: Restaurant) => void;
}

export function RestaurantSheet({ restaurant, onDismiss, onSave, onLog }: RestaurantSheetProps) {
  return (
    <Host>
      <BottomSheet isPresented={restaurant !== null} onDismiss={onDismiss} snapPoints={["half", "full"]} showDragIndicator>
        <RNHostView matchContents style={styles.host}>
          <View style={styles.content}>
            {restaurant ? <RestaurantCard restaurant={restaurant} onSave={onSave} onLog={onLog} /> : null}
          </View>
        </RNHostView>
      </BottomSheet>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: { width: "100%" },
  content: { padding: spacing.lg, width: "100%" },
});
