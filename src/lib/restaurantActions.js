import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";

export async function saveRestaurant(restaurant) {
  const u = await base44.auth.me();
  let [list] = await base44.entities.SavedList.filter({ user_id: u.id, is_default: true });
  if (!list) list = await base44.entities.SavedList.create({ user_id: u.id, name: "Want to try", icon: "bookmark", is_default: true });
  const exists = await base44.entities.ListItem.filter({ user_id: u.id, list_id: list.id, restaurant_id: restaurant.id });
  if (!exists.length) await base44.entities.ListItem.create({ user_id: u.id, list_id: list.id, restaurant_id: restaurant.id, want_to_try: true });
  toast({ title: "Saved to Want to try" });
}

export async function logVisit(restaurant, { rating, review }) {
  const u = await base44.auth.me();
  await base44.entities.RestaurantLog.create({
    user_id: u.id,
    restaurant_id: restaurant.id,
    visited_at: new Date().toISOString().slice(0, 10),
    overall_rating: rating,
    review,
    visibility: "friends",
    would_return: rating >= 4
  });
  toast({ title: "Visit added to your log" });
}