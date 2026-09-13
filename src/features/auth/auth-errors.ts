export type SessionError = "user_not_registered" | "unknown";

interface Base44LikeError {
  status?: number;
  data?: { extra_data?: { reason?: string } };
}

function isBase44Error(error: unknown): error is Base44LikeError {
  return typeof error === "object" && error !== null && "status" in error;
}

// null means "the user is simply signed out": show login, no message.
export function classifyAuthError(error: unknown): SessionError | null {
  if (!isBase44Error(error)) return "unknown";
  if (error.status === 401) return null;
  if (error.status === 403) {
    const reason = error.data?.extra_data?.reason;
    if (reason === "user_not_registered") return "user_not_registered";
    return null;
  }
  return "unknown";
}

// True only for responses that mean the token itself is not accepted.
export function isAuthRejection(error: unknown): boolean {
  return isBase44Error(error) && (error.status === 401 || error.status === 403);
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
