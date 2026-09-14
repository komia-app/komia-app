import { buildLogVisitPayload, DEFAULT_LIST, localDateString, pickDefaultList } from "./payloads";
import type { SavedList } from "@/types/entities";

describe("buildLogVisitPayload", () => {
  const base = { userId: "u1", restaurantId: "r1", today: new Date(2026, 8, 13, 15, 0) };

  it("marks a 4 or 5 rating as would_return", () => {
    const p = buildLogVisitPayload({ ...base, rating: 4, review: "" });
    expect(p).toEqual({
      user_id: "u1",
      restaurant_id: "r1",
      visited_at: "2026-09-13",
      overall_rating: 4,
      review: "",
      visibility: "friends",
      would_return: true,
    });
  });

  it("marks a 3 or lower as not would_return", () => {
    expect(buildLogVisitPayload({ ...base, rating: 3, review: "meh" }).would_return).toBe(false);
  });

  it("trims the review", () => {
    expect(buildLogVisitPayload({ ...base, rating: 5, review: "  great  " }).review).toBe("great");
  });

  it("uses the local calendar day, not the UTC day", () => {
    const lateEvening = new Date(2026, 8, 13, 23, 30);
    expect(buildLogVisitPayload({ ...base, today: lateEvening, rating: 5, review: "" }).visited_at).toBe(
      "2026-09-13",
    );
  });
});

describe("localDateString", () => {
  it("zero-pads the month and day", () => {
    expect(localDateString(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("pickDefaultList", () => {
  const list = (id: string, is_default?: boolean): SavedList => ({ id, user_id: "u1", name: id, is_default });

  it("returns the default list when present", () => {
    expect(pickDefaultList([list("a"), list("b", true)])?.id).toBe("b");
  });

  it("returns undefined when there is none", () => {
    expect(pickDefaultList([list("a")])).toBeUndefined();
    expect(pickDefaultList([])).toBeUndefined();
  });

  it("exposes the default list shape used on first save", () => {
    expect(DEFAULT_LIST).toEqual({ name: "Want to try", icon: "bookmark", is_default: true });
  });
});
