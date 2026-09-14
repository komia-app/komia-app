import { matchesQuery } from "./filter";
import type { Restaurant } from "@/types/entities";

const r: Restaurant = {
  id: "1",
  name: "Salvo Patria",
  cuisines: ["Colombian"],
  price_level: "$$",
  neighborhood: "Chapinero",
  city: "Bogota",
  tags: ["brunch"],
};

describe("matchesQuery", () => {
  it("matches name, neighbourhood, cuisine, and tag, case-insensitively", () => {
    expect(matchesQuery(r, "salvo")).toBe(true);
    expect(matchesQuery(r, "CHAPINERO")).toBe(true);
    expect(matchesQuery(r, "colombian")).toBe(true);
    expect(matchesQuery(r, "brunch")).toBe(true);
  });

  it("does not match unrelated text", () => {
    expect(matchesQuery(r, "sushi")).toBe(false);
  });

  it("treats blank queries as match-all", () => {
    expect(matchesQuery(r, "   ")).toBe(true);
  });
});
