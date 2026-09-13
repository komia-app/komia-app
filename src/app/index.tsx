import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { base44 } from "@/lib/base44";
import { colors, spacing, text } from "@/theme";

export default function Index() {
  const [status, setStatus] = useState("checking backend");

  useEffect(() => {
    base44.app
      .getPublicSettings()
      .then(() => setStatus("backend reachable"))
      .catch((error: unknown) => setStatus(`backend error: ${String(error)}`));
  }, []);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>KOMIA</Text>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  title: text.title,
  status: text.caption,
});
