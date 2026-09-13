import type { Restaurant } from "@/types/entities";

export function matchesQuery(r: Restaurant, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [r.name, r.neighborhood, r.city, ...(r.cuisines ?? []), ...(r.tags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}
