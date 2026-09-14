import { buildOnboardingUpdate, canContinue, EMPTY_PROFILE, STEPS } from "./steps";

describe("onboarding steps", () => {
  it("has seven steps with a question each", () => {
    expect(STEPS).toHaveLength(7);
    for (const s of STEPS) expect(s.question.length).toBeGreaterThan(0);
  });

  it("requires at least one cuisine on step 0", () => {
    expect(canContinue(0, EMPTY_PROFILE)).toBe(false);
    expect(canContinue(0, { ...EMPTY_PROFILE, cuisines: ["Italian"] })).toBe(true);
  });

  it("requires a price and an adventurousness on steps 2 and 3", () => {
    expect(canContinue(2, EMPTY_PROFILE)).toBe(false);
    expect(canContinue(2, { ...EMPTY_PROFILE, price: "$$" })).toBe(true);
    expect(canContinue(3, EMPTY_PROFILE)).toBe(false);
    expect(canContinue(3, { ...EMPTY_PROFILE, adventurousness: 3 })).toBe(true);
  });

  it("requires exactly five ranked priorities on step 5", () => {
    expect(canContinue(5, { ...EMPTY_PROFILE, priorities: ["a", "b", "c", "d"] })).toBe(false);
    expect(canContinue(5, { ...EMPTY_PROFILE, priorities: ["a", "b", "c", "d", "e"] })).toBe(true);
  });

  it("always allows the last step", () => {
    expect(canContinue(6, EMPTY_PROFILE)).toBe(true);
  });
});

describe("buildOnboardingUpdate", () => {
  it("copies cuisines without Other and a concrete price level", () => {
    const u = buildOnboardingUpdate({ ...EMPTY_PROFILE, cuisines: ["Italian", "Other"], price: "$$" });
    expect(u.favorite_cuisines).toEqual(["Italian"]);
    expect(u.price_preferences).toEqual(["$$"]);
    expect(u.onboarding_completed).toBe(true);
    expect(u.taste_profile.cuisines).toEqual(["Italian", "Other"]);
  });

  it("leaves price preferences empty when the answer is not a level", () => {
    expect(buildOnboardingUpdate({ ...EMPTY_PROFILE, price: "depends" }).price_preferences).toEqual([]);
  });
});
