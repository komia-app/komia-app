import type { SavedList } from "@/types/entities";

export const DEFAULT_LIST = { name: "Want to try", icon: "bookmark", is_default: true } as const;

interface BuildLogVisitInput {
  userId: string;
  restaurantId: string;
  rating: number;
  review: string;
  today: Date;
}

// The visit date is the user's calendar day, not the UTC day.
export function localDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function buildLogVisitPayload({ userId, restaurantId, rating, review, today }: BuildLogVisitInput) {
  return {
    user_id: userId,
    restaurant_id: restaurantId,
    visited_at: localDateString(today),
    overall_rating: rating,
    review: review.trim(),
    visibility: "friends" as const,
    would_return: rating >= 4,
  };
}

export function pickDefaultList(lists: SavedList[]): SavedList | undefined {
  return lists.find((l) => l.is_default === true);
}
