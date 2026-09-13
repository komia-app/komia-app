export function computeTasteProfile(logs, restaurantMap, user) {
  const profile = {
    favorite_cuisines: [],
    preferred_price: [],
    favorite_types: [],
    preferred_locations: [],
  };
  if (!logs || !logs.length) return profile;

  const cuisineCount = {};
  const priceCount = {};
  const tagCount = {};
  const locCount = {};

  logs.forEach((log) => {
    const r = restaurantMap[log.restaurant_id];
    if (!r) return;
    (r.cuisines || []).forEach((c) => { cuisineCount[c] = (cuisineCount[c] || 0) + 1; });
    if (r.price_level) priceCount[r.price_level] = (priceCount[r.price_level] || 0) + 1;
    (r.tags || []).forEach((t) => { tagCount[t] = (tagCount[t] || 0) + 1; });
    const loc = r.neighborhood || r.city;
    if (loc) locCount[loc] = (locCount[loc] || 0) + 1;
  });

  const top = (obj, n) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);

  profile.favorite_cuisines = user?.favorite_cuisines?.length ? user.favorite_cuisines : top(cuisineCount, 5);
  profile.preferred_price = top(priceCount, 2);
  profile.favorite_types = top(tagCount, 5);
  profile.preferred_locations = top(locCount, 4);
  return profile;
}