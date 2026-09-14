import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { TextField } from "@/components/text-field";
import { errorMessage } from "@/features/auth/auth-errors";
import { base44 } from "@/lib/base44";
import { colors, text } from "@/theme";

import { AuthShell } from "./auth-shell";

export function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (!token) {
      setError("This reset link is missing its token. Request a new one.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken: token, newPassword: password });
      router.replace("/login");
    } catch (e) {
      setError(errorMessage(e, "Could not reset the password"));
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Then log in with it"
      footer={
        <Link href="/login" style={styles.link}>
          Back to log in
        </Link>
      }
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextField
        label="New password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        placeholder="At least 8 characters"
      />
      <TextField
        label="Confirm password"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoComplete="new-password"
        placeholder="Repeat it"
      />
      <PrimaryButton onPress={submit} loading={loading} disabled={password.length < 8 || !confirm}>
        Save password
      </PrimaryButton>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  error: { ...text.caption, color: colors.danger },
  link: { ...text.bodyStrong, color: colors.navy },
});
