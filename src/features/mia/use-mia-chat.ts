import { useCallback, useState } from "react";

import { base44 } from "@/lib/base44";

import { type ChatMessage, FAILURE_REPLY, GREETING, historyFor } from "./chat";

let counter = 0;
const nextId = () => `m${Date.now()}-${counter++}`;

export function useMiaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [loading, setLoading] = useState(false);

  const send = useCallback(
    async (raw: string) => {
      const content = raw.trim();
      if (!content || loading) return;
      const history = historyFor(messages);
      const next = [...messages, { id: nextId(), role: "user" as const, content }];
      setMessages(next);
      setLoading(true);
      try {
        const res = (await base44.functions.invoke("miaChat", { message: content, history })) as { data?: { reply?: string } };
        const reply = res.data?.reply ?? FAILURE_REPLY;
        setMessages([...next, { id: nextId(), role: "assistant", content: reply }]);
      } catch {
        setMessages([...next, { id: nextId(), role: "assistant", content: FAILURE_REPLY }]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading],
  );

  return { messages, loading, send };
}
