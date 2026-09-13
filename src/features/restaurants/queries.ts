import { useQuery } from "@tanstack/react-query";

import { useCurrentUser } from "@/features/auth/session-provider";
import { base44 } from "@/lib/base44";
import type { ListItem, Restaurant, RestaurantLog, SavedList } from "@/types/entities";

import { listItemKeys, listKeys, logKeys, restaurantKeys } from "./keys";

// The SDK caps unbounded reads at a small default page; these lists are small enough to fetch whole.
const PAGE_LIMIT = 500;

export function useRestaurants() {
  return useQuery({
    queryKey: restaurantKeys.all,
    queryFn: async () => (await base44.entities.Restaurant.list(undefined, PAGE_LIMIT)) as Restaurant[],
  });
}

export function useRestaurant(id: string) {
  return useQuery({
    queryKey: restaurantKeys.detail(id),
    queryFn: async () => (await base44.entities.Restaurant.get(id)) as Restaurant,
    enabled: id.length > 0,
  });
}

export function useMyLogs() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: logKeys.mine(user.id),
    queryFn: async () =>
      (await base44.entities.RestaurantLog.filter(
        { user_id: user.id },
        "-visited_at",
        PAGE_LIMIT,
      )) as RestaurantLog[],
  });
}

export function useMyLists() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: listKeys.mine(user.id),
    queryFn: async () =>
      (await base44.entities.SavedList.filter({ user_id: user.id }, undefined, PAGE_LIMIT)) as SavedList[],
  });
}

export function useMyListItems() {
  const user = useCurrentUser();
  return useQuery({
    queryKey: listItemKeys.mine(user.id),
    queryFn: async () =>
      (await base44.entities.ListItem.filter({ user_id: user.id }, undefined, PAGE_LIMIT)) as ListItem[],
  });
}
