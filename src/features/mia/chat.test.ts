import { type ChatMessage, GREETING, historyFor } from "./chat";

const m = (role: ChatMessage["role"], content: string): ChatMessage => ({ id: content, role, content });

describe("historyFor", () => {
  it("sends only role and content", () => {
    expect(historyFor([m("assistant", "hi"), m("user", "yo")])).toEqual([
      { role: "assistant", content: "hi" },
      { role: "user", content: "yo" },
    ]);
  });

  it("keeps the last eight messages", () => {
    const many = Array.from({ length: 12 }, (_, i) => m("user", String(i)));
    expect(historyFor(many).map((h) => h.content)).toEqual(["4", "5", "6", "7", "8", "9", "10", "11"]);
  });

  it("has a greeting without emojis", () => {
    expect(GREETING.role).toBe("assistant");
    expect(/[\u{1F300}-\u{1FAFF}]/u.test(GREETING.content)).toBe(false);
  });
});
