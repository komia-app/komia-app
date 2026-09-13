import { ActivityIndicator, StyleSheet, View } from "react-native";

import { colors } from "@/theme";

export function ScreenLoader() {
  return (
    <View style={styles.root}>
      <ActivityIndicator size="large" color={colors.navy} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
});
