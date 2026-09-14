import { useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { SUGGESTIONS } from "@/features/mia/chat";
import { useMiaChat } from "@/features/mia/use-mia-chat";
import { colors, radius, spacing, text } from "@/theme";

export function MiaScreen() {
  const { messages, loading, send } = useMiaChat();
  const [input, setInput] = useState("");

  const submit = () => {
    if (loading || input.trim().length === 0) return;
    const value = input;
    setInput("");
    void send(value);
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <Text style={styles.overline}>MIA</Text>
        <Text style={styles.title}>Tu asistente gastronomico</Text>
      </View>
      <FlatList
        data={[...messages].reverse()}
        inverted
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.bubbleRow, item.role === "user" && styles.bubbleRowUser]}>
            <Text style={[styles.bubble, item.role === "user" ? styles.bubbleUser : styles.bubbleAssistant]}>{item.content}</Text>
          </View>
        )}
        ListHeaderComponent={loading ? <Text style={styles.typing}>MIA esta escribiendo</Text> : null}
      />
      {messages.length <= 1 ? (
        <View style={styles.suggestions}>
          {SUGGESTIONS.map((s) => (
            <Pressable key={s} onPress={() => void send(s)} style={styles.suggestion}>
              <Text style={styles.suggestionText}>{s}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <View style={styles.composer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Preguntale a MIA"
          placeholderTextColor={colors.inkFaint}
          style={styles.input}
          onSubmitEditing={submit}
          returnKeyType="send"
        />
        <Pressable onPress={submit} disabled={loading || input.trim().length === 0} style={[styles.sendButton, (loading || input.trim().length === 0) && styles.sendDisabled]}>
          <Text style={styles.sendText}>Enviar</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { backgroundColor: colors.navy, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, gap: spacing.xs },
  overline: { ...text.overline, color: colors.yellow },
  title: { ...text.heading, color: colors.white },
  list: { padding: spacing.lg, gap: spacing.sm },
  bubbleRow: { flexDirection: "row", justifyContent: "flex-start" },
  bubbleRowUser: { justifyContent: "flex-end" },
  bubble: { ...text.body, maxWidth: "80%", borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, overflow: "hidden" },
  bubbleAssistant: { backgroundColor: colors.white },
  bubbleUser: { backgroundColor: colors.yellow, fontWeight: "600" },
  typing: { ...text.caption, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  suggestions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  suggestion: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  suggestionText: text.caption,
  composer: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.white },
  input: { flex: 1, height: 44, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, paddingHorizontal: spacing.lg, ...text.body },
  sendButton: { height: 44, borderRadius: radius.pill, backgroundColor: colors.orange, paddingHorizontal: spacing.lg, alignItems: "center", justifyContent: "center" },
  sendDisabled: { opacity: 0.5 },
  sendText: { ...text.bodyStrong, color: colors.white },
});
