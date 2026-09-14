import { StyleSheet, Text } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { useSession } from "@/features/auth/session-provider";
import { text } from "@/theme";

import { AuthShell } from "./auth-shell";

export function NotRegisteredScreen() {
  const { signOut } = useSession();
  return (
    <AuthShell title="No access yet" subtitle="This account is not registered for KOMIA">
      <Text style={styles.body}>Ask an admin to add you, then log in again.</Text>
      <PrimaryButton onPress={() => void signOut()} variant="outlined">
        Log out
      </PrimaryButton>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  body: text.body,
});
