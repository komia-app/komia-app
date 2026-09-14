import type { Restaurant, RestaurantLog, User } from "@/types/entities";

export interface TasteSummary {
  favorite_cuisines: string[];
  preferred_price: string[];
  favorite_types: string[];
  preferred_locations: string[];
}

function top(counts: Map<string, number>, n: number): string[] {
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
}

function bump(counts: Map<string, number>, key: string | undefined) {
  if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
}

export function computeTasteProfile(logs: RestaurantLog[], restaurants: Restaurant[], user: User | null): TasteSummary {
  const empty: TasteSummary = { favorite_cuisines: [], preferred_price: [], favorite_types: [], preferred_locations: [] };
  if (logs.length === 0) return empty;
  const byId = new Map(restaurants.map((r) => [r.id, r]));
  const cuisines = new Map<string, number>();
  const prices = new Map<string, number>();
  const tags = new Map<string, number>();
  const places = new Map<string, number>();
  for (const log of logs) {
    const r = byId.get(log.restaurant_id);
    if (!r) continue;
    r.cuisines.forEach((c) => bump(cuisines, c));
    bump(prices, r.price_level);
    (r.tags ?? []).forEach((t) => bump(tags, t));
    bump(places, r.neighborhood ?? r.city);
  }
  return {
    favorite_cuisines: user?.favorite_cuisines?.length ? user.favorite_cuisines : top(cuisines, 5),
    preferred_price: top(prices, 2),
    favorite_types: top(tags, 5),
    preferred_locations: top(places, 4),
  };
}

export interface LogStats {
  logged: number;
  reviews: number;
  average: string;
}

export function computeLogStats(logs: RestaurantLog[]): LogStats {
  const reviews = logs.filter((l) => l.review && l.review.length > 0).length;
  const sum = logs.reduce((s, l) => s + (l.overall_rating ?? 0), 0);
  return { logged: logs.length, reviews, average: (logs.length ? sum / logs.length : 0).toFixed(1) };
}
