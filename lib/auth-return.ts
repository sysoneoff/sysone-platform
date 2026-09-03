export const DEFAULT_AUTH_RETURN_TO = "/account";

export function normalizeAuthReturnTo(
  value: unknown,
  fallback = DEFAULT_AUTH_RETURN_TO,
) {
  if (typeof value !== "string") {
    return fallback;
  }

  const candidate = value.trim();

  if (
    !candidate ||
    candidate.length > 2048 ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\")
  ) {
    return fallback;
  }

  try {
    const base = "https://sysone.local";
    const url = new URL(candidate, base);

    if (url.origin !== base) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
