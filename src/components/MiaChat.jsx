import React, { useState } from "react";
import { Sparkles, X, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SUGGESTIONS = [
  "¿Dónde puedo cenar bien en Chapinero?",
  "Recomiéndame algo para una cita",
  "¿Qué pedir en un brunch?",
  "Lugares baratos y buenos"
];

export default function MiaChat({ onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "¡Hola! Soy MIA 🍽️ Tu asistente de restaurantes en KOMIA. Pregúntame qué lugar probar, qué pedir, o dónde ir según tu gusto." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await base44.functions.invoke("miaChat", {
        message: content,
        history: messages.map(m => ({ role: m.role, content: m.content }))
      });
      setMessages([...next, { role: "assistant", content: res.data.reply }]);
    } catch (e) {
      setMessages([...next, { role: "assistant", content: "Tuve un problema conectándome. Intenta de nuevo 🙏" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#071b2d]/60" onClick={onClose}>
      <div className="flex h-[85vh] w-full max-w-md flex-col rounded-t-[2rem] bg-[#f8fafb]" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between rounded-t-[2rem] bg-[#10375C] px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#EB8317]"><Sparkles className="h-6 w-6" /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#F3C623]">MIA</p>
              <h2 className="text-lg font-extrabold leading-tight">Tu asistente gastronómico</h2>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/10 p-2"><X className="h-5 w-5" /></button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${m.role === "user" ? "bg-[#F3C623] font-semibold text-[#10375C]" : "bg-white text-[#10375C] shadow-sm"}`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-400 shadow-sm">
                <span className="inline-flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#EB8317]" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#EB8317]" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-[#EB8317]" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 px-4 pb-2">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)} className="rounded-full border border-[#10375C]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#10375C]">
                {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={e => { e.preventDefault(); send(); }} className="flex items-center gap-2 border-t bg-white p-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Pregúntale a MIA..."
            className="flex-1 rounded-full bg-slate-100 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#F3C623]"
          />
          <button type="submit" disabled={loading || !input.trim()} className="grid h-11 w-11 place-items-center rounded-full bg-[#EB8317] text-white disabled:opacity-50">
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}