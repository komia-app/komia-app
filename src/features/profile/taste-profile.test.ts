import { computeLogStats, computeTasteProfile } from "./taste-profile";
import type { Restaurant, RestaurantLog, User } from "@/types/entities";

const r = (id: string, cuisines: string[], price_level: Restaurant["price_level"], tags: string[], neighborhood: string): Restaurant => ({ id, name: id, cuisines, price_level, tags, neighborhood });
const l = (restaurant_id: string, overall_rating: number, review?: string): RestaurantLog => ({ id: restaurant_id + overall_rating, user_id: "u", restaurant_id, visited_at: "2026-09-01", overall_rating, review });
const user: User = { id: "u", email: "u@example.com" };

describe("computeTasteProfile", () => {
  it("is empty without logs", () => {
    expect(computeTasteProfile([], [], user)).toEqual({ favorite_cuisines: [], preferred_price: [], favorite_types: [], preferred_locations: [] });
  });

  it("ranks cuisines, prices, tags, and neighbourhoods by frequency", () => {
    const restaurants = [r("a", ["Italian"], "$$", ["cozy"], "Chapinero"), r("b", ["Italian", "Pizza"], "$$$", ["cozy", "date"], "Usaquen")];
    const logs = [l("a", 4), l("b", 5), l("a", 3)];
    const p = computeTasteProfile(logs, restaurants, user);
    expect(p.favorite_cuisines[0]).toBe("Italian");
    expect(p.preferred_price).toEqual(["$$", "$$$"]);
    expect(p.favorite_types[0]).toBe("cozy");
    expect(p.preferred_locations[0]).toBe("Chapinero");
  });

  it("prefers the user's declared favourite cuisines", () => {
    const p = computeTasteProfile([l("a", 4)], [r("a", ["Italian"], "$", [], "X")], { ...user, favorite_cuisines: ["Thai"] });
    expect(p.favorite_cuisines).toEqual(["Thai"]);
  });
});

describe("computeLogStats", () => {
  it("counts logs and reviews and averages ratings to one decimal", () => {
    expect(computeLogStats([l("a", 4, "nice"), l("b", 5)])).toEqual({ logged: 2, reviews: 1, average: "4.5" });
    expect(computeLogStats([])).toEqual({ logged: 0, reviews: 0, average: "0.0" });
  });
});
