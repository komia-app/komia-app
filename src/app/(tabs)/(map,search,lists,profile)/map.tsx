import { StyleSheet, Text, View } from "react-native";

import { text } from "@/theme";

export default function MapRoute() {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>map</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center" },
  label: text.caption,
});
