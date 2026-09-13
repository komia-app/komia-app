import type { SavedList } from "@/types/entities";

export const DEFAULT_LIST = { name: "Want to try", icon: "bookmark", is_default: true } as const;

interface BuildLogVisitInput {
  userId: string;
  restaurantId: string;
  rating: number;
  review: string;
  today: Date;
}

export function buildLogVisitPayload({ userId, restaurantId, rating, review, today }: BuildLogVisitInput) {
  return {
    user_id: userId,
    restaurant_id: restaurantId,
    visited_at: today.toISOString().slice(0, 10),
    overall_rating: rating,
    review: review.trim(),
    visibility: "friends" as const,
    would_return: rating >= 4,
  };
}

export function pickDefaultList(lists: SavedList[]): SavedList | undefined {
  return lists.find((l) => l.is_default === true);
}
