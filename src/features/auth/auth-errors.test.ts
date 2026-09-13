import { classifyAuthError, isAuthRejection } from "./auth-errors";

describe("classifyAuthError", () => {
  it("returns null for 401 (plain signed-out)", () => {
    expect(classifyAuthError({ status: 401 })).toBeNull();
  });

  it("returns user_not_registered for the Base44 403 reason", () => {
    const error = { status: 403, data: { extra_data: { reason: "user_not_registered" } } };
    expect(classifyAuthError(error)).toBe("user_not_registered");
  });

  it("returns null for 403 auth_required", () => {
    const error = { status: 403, data: { extra_data: { reason: "auth_required" } } };
    expect(classifyAuthError(error)).toBeNull();
  });

  it("returns unknown for anything else", () => {
    expect(classifyAuthError(new Error("network"))).toBe("unknown");
    expect(classifyAuthError({ status: 500 })).toBe("unknown");
  });
});

describe("isAuthRejection", () => {
  it("is true for 401 and 403", () => {
    expect(isAuthRejection({ status: 401 })).toBe(true);
    expect(isAuthRejection({ status: 403 })).toBe(true);
  });

  it("is false for network errors and other statuses", () => {
    expect(isAuthRejection(new Error("network"))).toBe(false);
    expect(isAuthRejection({ status: 500 })).toBe(false);
  });
});
