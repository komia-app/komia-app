import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useCurrentUser } from "@/features/auth/session-provider";
import { base44 } from "@/lib/base44";
import type { ListItem, Restaurant, SavedList } from "@/types/entities";

import { listItemKeys, listKeys, logKeys } from "./keys";
import { buildLogVisitPayload, DEFAULT_LIST, pickDefaultList } from "./payloads";
import { PAGE_LIMIT } from "./queries";

export type SaveResult = "saved" | "already-saved";

export function useSaveRestaurant() {
  const user = useCurrentUser();
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (restaurant: Restaurant): Promise<SaveResult> => {
      if (!user) throw new Error("Sign in to save restaurants");
      const lists = (await base44.entities.SavedList.filter(
        { user_id: user.id },
        undefined,
        PAGE_LIMIT,
      )) as SavedList[];
      let list = pickDefaultList(lists);
      if (!list) {
        list = (await base44.entities.SavedList.create({ user_id: user.id, ...DEFAULT_LIST })) as SavedList;
      }
      const existing = (await base44.entities.ListItem.filter(
        {
          user_id: user.id,
          list_id: list.id,
          restaurant_id: restaurant.id,
        },
        undefined,
        PAGE_LIMIT,
      )) as ListItem[];
      if (existing.length > 0) return "already-saved";
      await base44.entities.ListItem.create({
        user_id: user.id,
        list_id: list.id,
        restaurant_id: restaurant.id,
        want_to_try: true,
      });
      return "saved";
    },
    onSuccess: () => {
      if (!user) return;
      void client.invalidateQueries({ queryKey: listKeys.mine(user.id) });
      void client.invalidateQueries({ queryKey: listItemKeys.mine(user.id) });
    },
  });
}

interface LogVisitInput {
  restaurant: Restaurant;
  rating: number;
  review: string;
}

export function useLogVisit() {
  const user = useCurrentUser();
  const client = useQueryClient();

  return useMutation({
    mutationFn: async ({ restaurant, rating, review }: LogVisitInput) => {
      if (!user) throw new Error("Sign in to log a visit");
      const payload = buildLogVisitPayload({
        userId: user.id,
        restaurantId: restaurant.id,
        rating,
        review,
        today: new Date(),
      });
      await base44.entities.RestaurantLog.create(payload);
    },
    onSuccess: () => {
      if (!user) return;
      void client.invalidateQueries({ queryKey: logKeys.mine(user.id) });
    },
  });
}
