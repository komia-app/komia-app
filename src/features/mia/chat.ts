export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
}

export const GREETING: ChatMessage = {
  id: "greeting",
  role: "assistant",
  content: "Hola, soy MIA, tu asistente de restaurantes en KOMIA. Preguntame que lugar probar, que pedir, o donde ir segun tu gusto.",
};

export const SUGGESTIONS = [
  "Donde puedo cenar bien en Chapinero?",
  "Recomiendame algo para una cita",
  "Que pedir en un brunch?",
  "Lugares baratos y buenos",
];

export const FAILURE_REPLY = "Tuve un problema conectandome. Intenta de nuevo.";

// The backend keeps the last eight turns; send no more than that.
export function historyFor(messages: ChatMessage[]): { role: ChatMessage["role"]; content: string }[] {
  return messages.slice(-8).map(({ role, content }) => ({ role, content }));
}
