import { StyleSheet, Text, View } from "react-native";

import { text } from "@/theme";

export default function LogVisitRoute() {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>log visit (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center" },
  label: text.caption,
});
