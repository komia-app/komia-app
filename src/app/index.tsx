import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View style={styles.root}>
      <Text>KOMIA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center" },
});
