import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandMark } from "@/components/brand-mark";
import { PrimaryButton } from "@/components/primary-button";
import { TextField } from "@/components/text-field";
import { useSession } from "@/features/auth/session-provider";
import { ADVENTURE, AVOID, canContinue, CUISINES, EMPTY_PROFILE, EXPERIENCES, FLAVORS, PRICES, PRIORITIES, STEPS } from "@/features/onboarding/steps";
import { base44 } from "@/lib/base44";
import { colors, radius, spacing, text } from "@/theme";
import type { TasteProfile } from "@/types/entities";

import { ChipSelect } from "./chip-select";
import { RankSelect } from "./rank-select";
import { ScaleSelect } from "./scale-select";

export function OnboardingScreen() {
  const { refreshUser } = useSession();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<TasteProfile>(EMPTY_PROFILE);
  const [submitting, setSubmitting] = useState(false);
  const total = STEPS.length;
  const last = step === total - 1;

  const set = <K extends keyof TasteProfile>(key: K, value: TasteProfile[K]) => setData((d) => ({ ...d, [key]: value }));

  const next = async () => {
    if (!last) return setStep(step + 1);
    setSubmitting(true);
    try {
      await base44.auth.updateMe({ taste_profile: data, onboarding_completed: true });
      await refreshUser();
    } catch (e) {
      setSubmitting(false);
      Alert.alert("Could not save your profile", e instanceof Error ? e.message : "Please try again.");
    }
  };

  const info = STEPS[step];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <BrandMark />
        <View style={styles.progress}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.bar, i <= step && styles.barActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>Step {step + 1} of {total}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.question}>{info.question}</Text>
        <Text style={styles.hint}>{info.hint}</Text>
        <View style={styles.content}>
          {step === 0 ? (
            <>
              <ChipSelect options={CUISINES} value={data.cuisines} onChange={(v) => set("cuisines", v)} max={5} />
              {data.cuisines.includes("Other") ? (
                <TextField label="Other cuisines you enjoy" value={data.other_cuisines} onChangeText={(v) => set("other_cuisines", v)} />
              ) : null}
            </>
          ) : null}
          {step === 1 ? <ChipSelect options={EXPERIENCES} value={data.experiences} onChange={(v) => set("experiences", v)} /> : null}
          {step === 2 ? <ScaleSelect options={PRICES} value={data.price} onChange={(v) => set("price", v)} /> : null}
          {step === 3 ? <ScaleSelect options={ADVENTURE} value={data.adventurousness} onChange={(v) => set("adventurousness", v)} /> : null}
          {step === 4 ? (
            <>
              <ChipSelect options={FLAVORS} value={data.flavors} onChange={(v) => set("flavors", v)} />
              <TextField label="Any flavors you dislike?" value={data.disliked_flavors} onChangeText={(v) => set("disliked_flavors", v)} placeholder="e.g. bitter, overly sweet" />
            </>
          ) : null}
          {step === 5 ? <RankSelect options={PRIORITIES} value={data.priorities} onChange={(v) => set("priorities", v)} max={5} /> : null}
          {step === 6 ? (
            <>
              <ChipSelect options={AVOID} value={data.avoid} onChange={(v) => set("avoid", v)} />
              {data.avoid.includes("Specific ingredients") || data.avoid.includes("Other") ? (
                <TextField label="Tell us more" value={data.avoid_notes} onChangeText={(v) => set("avoid_notes", v)} />
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.back}>
          <PrimaryButton onPress={() => setStep(Math.max(0, step - 1))} disabled={step === 0} variant="outlined">
            Back
          </PrimaryButton>
        </View>
        <View style={styles.forward}>
          <PrimaryButton onPress={() => void next()} disabled={!canContinue(step, data)} loading={submitting}>
            {last ? "Build my profile" : "Continue"}
          </PrimaryButton>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.sm },
  progress: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.md },
  bar: { flex: 1, height: 6, borderRadius: radius.pill, backgroundColor: colors.line },
  barActive: { backgroundColor: colors.yellow },
  stepLabel: text.overline,
  body: { padding: spacing.xl, gap: spacing.sm, paddingBottom: spacing.xxl },
  question: text.title,
  hint: { ...text.body, color: colors.inkMuted },
  content: { marginTop: spacing.lg, gap: spacing.lg },
  footer: { flexDirection: "row", gap: spacing.md, padding: spacing.xl, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.surface },
  back: { flex: 1 },
  forward: { flex: 2 },
});
