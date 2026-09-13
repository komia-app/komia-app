import { Link } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import { PrimaryButton } from "@/components/primary-button";
import { TextField } from "@/components/text-field";
import { errorMessage } from "@/features/auth/auth-errors";
import { useSession } from "@/features/auth/session-provider";
import { base44 } from "@/lib/base44";
import { colors, text } from "@/theme";

import { AuthShell } from "./auth-shell";

export function RegisterScreen() {
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState<"form" | "otp">("form");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const register = async () => {
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email: email.trim(), password });
      setStage("otp");
    } catch (e) {
      setError(errorMessage(e, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = (await base44.auth.verifyOtp({ email: email.trim(), otpCode: otp.trim() })) as {
        access_token?: string;
      };
      if (result?.access_token) {
        await signIn(result.access_token);
        return;
      }
      const login = await base44.auth.loginViaEmailPassword(email.trim(), password);
      await signIn(login.access_token);
    } catch (e) {
      setError(errorMessage(e, "Invalid verification code"));
      setLoading(false);
    }
  };

  const resend = async () => {
    setError("");
    setNotice("");
    try {
      await base44.auth.resendOtp(email.trim());
      setNotice("Code sent. Check your email.");
    } catch (e) {
      setError(errorMessage(e, "Failed to resend code"));
    }
  };

  if (stage === "otp") {
    return (
      <AuthShell
        title="Check your email"
        subtitle={`We sent a 6-digit code to ${email.trim()}`}
        footer={
          <Text style={styles.link} onPress={resend}>
            Send a new code
          </Text>
        }
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        <TextField
          label="Verification code"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          autoComplete="one-time-code"
          placeholder="123456"
        />
        <PrimaryButton onPress={verify} loading={loading} disabled={otp.trim().length < 6}>
          Verify
        </PrimaryButton>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start logging the places you love"
      footer={
        <Text style={styles.footerText}>
          Already have an account?{" "}
          <Link href="/login" style={styles.link}>
            Log in
          </Link>
        </Text>
      }
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
        autoComplete="new-password"
        placeholder="At least 8 characters"
      />
      <TextField
        label="Confirm password"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoComplete="new-password"
        placeholder="Repeat your password"
      />
      <PrimaryButton
        onPress={register}
        loading={loading}
        disabled={!email || password.length < 8 || !confirm}
      >
        Create account
      </PrimaryButton>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  error: { ...text.caption, color: colors.danger },
  notice: { ...text.caption, color: colors.navy },
  link: { ...text.bodyStrong, color: colors.navy },
  footerText: text.body,
});
