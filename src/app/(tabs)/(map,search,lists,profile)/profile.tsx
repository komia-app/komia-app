import { StyleSheet, Text, View } from "react-native";

import { text } from "@/theme";

export default function ProfileRoute() {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>profile</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center" },
  label: text.caption,
});
