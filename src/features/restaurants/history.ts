import type { RestaurantLog } from "@/types/entities";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// visited_at is a plain calendar date; parse it as local time so it never shifts a day.
export function parseVisitDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? "");
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function formatVisitDate(value: string): string {
  const d = parseVisitDate(value);
  return d ? `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : "";
}

export interface MonthSection {
  key: string;
  title: string;
  data: RestaurantLog[];
}

export function groupLogsByMonth(logs: RestaurantLog[]): MonthSection[] {
  const byKey = new Map<string, { title: string; items: { log: RestaurantLog; date: Date }[] }>();
  for (const log of logs) {
    const date = parseVisitDate(log.visited_at);
    if (!date) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const entry = byKey.get(key) ?? { title: `${MONTHS[date.getMonth()]} ${date.getFullYear()}`, items: [] };
    entry.items.push({ log, date });
    byKey.set(key, entry);
  }
  return [...byKey.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, { title, items }]) => ({
      key,
      title,
      data: items.sort((a, b) => b.date.getTime() - a.date.getTime()).map((i) => i.log),
    }));
}
