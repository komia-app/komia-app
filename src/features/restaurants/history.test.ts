import { groupLogsByMonth, parseVisitDate } from "./history";
import type { RestaurantLog } from "@/types/entities";

const log = (id: string, visited_at: string): RestaurantLog => ({ id, user_id: "u", restaurant_id: "r", visited_at, overall_rating: 4 });

describe("parseVisitDate", () => {
  it("parses YYYY-MM-DD as a local date", () => {
    const d = parseVisitDate("2026-09-13");
    expect([d!.getFullYear(), d!.getMonth(), d!.getDate()]).toEqual([2026, 8, 13]);
  });

  it("returns null for junk", () => {
    expect(parseVisitDate("nope")).toBeNull();
    expect(parseVisitDate("")).toBeNull();
  });
});

describe("groupLogsByMonth", () => {
  it("groups by month, newest month and newest day first", () => {
    const sections = groupLogsByMonth([log("a", "2026-08-02"), log("b", "2026-09-13"), log("c", "2026-09-01")]);
    expect(sections.map((s) => s.key)).toEqual(["2026-09", "2026-08"]);
    expect(sections[0].title).toBe("September 2026");
    expect(sections[0].data.map((l) => l.id)).toEqual(["b", "c"]);
  });

  it("skips logs with unparseable dates", () => {
    expect(groupLogsByMonth([log("x", "bad")])).toEqual([]);
  });
});
