import { Link } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { TextField } from "@/components/text-field";
import { errorMessage } from "@/features/auth/auth-errors";
import { startGoogleLogin } from "@/features/auth/google-login";
import { useSession } from "@/features/auth/session-provider";
import { base44 } from "@/lib/base44";
import { colors, spacing, text } from "@/theme";

import { AuthShell } from "./auth-shell";

export function LoginScreen() {
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const google = async () => {
    setError("");
    try {
      const token = await startGoogleLogin();
      if (token) await signIn(token);
    } catch (e) {
      setError(errorMessage(e, "Google login failed"));
    }
  };

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.loginViaEmailPassword(email.trim(), password);
      if (!result.access_token) throw new Error("No token returned");
      await signIn(result.access_token);
    } catch (e) {
      setError(errorMessage(e, "Invalid email or password"));
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your account"
      footer={
        <Text style={styles.footerText}>
          Don&apos;t have an account?{" "}
          <Link href="/register" style={styles.link}>
            Create one
          </Link>
        </Text>
      }
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton onPress={google} variant="outlined">
        Continue with Google
      </PrimaryButton>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="you@example.com"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        placeholder="Your password"
      />
      <View style={styles.forgot}>
        <Link href="/forgot-password" style={styles.link}>
          Forgot password?
        </Link>
      </View>
      <PrimaryButton onPress={submit} loading={loading} disabled={!email || !password}>
        Log in
      </PrimaryButton>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  error: { ...text.caption, color: colors.danger },
  forgot: { alignItems: "flex-end", marginTop: -spacing.sm },
  link: { ...text.bodyStrong, color: colors.navy },
  footerText: text.body,
});
