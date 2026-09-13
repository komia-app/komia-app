import { Link } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { TextField } from "@/components/text-field";
import { errorMessage } from "@/features/auth/auth-errors";
import { base44 } from "@/lib/base44";
import { colors, text } from "@/theme";

import { AuthShell } from "./auth-shell";

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email.trim());
      setSent(true);
    } catch (e) {
      setError(errorMessage(e, "Could not send the reset email"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We will email you a reset link"
      footer={
        <Link href="/login" style={styles.link}>
          Back to log in
        </Link>
      }
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {sent ? (
        <Text style={styles.notice}>Check your inbox. Open the link on this device to set a new password.</Text>
      ) : (
        <>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <PrimaryButton onPress={submit} loading={loading} disabled={!email}>
            Send reset link
          </PrimaryButton>
        </>
      )}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  error: { ...text.caption, color: colors.danger },
  notice: text.body,
  link: { ...text.bodyStrong, color: colors.navy },
});
