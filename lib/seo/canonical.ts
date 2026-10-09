/** One production canonical origin, regardless of preview/staging environment. */
export const CANONICAL_ORIGIN = "https://sysone.top";

export function canonicalUrl(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//") || /[?#\\]/.test(path) || path.split("/").includes("..")) {
    throw new Error("invalid_canonical_path");
  }
  const normalized = path === "/" ? "/" : path.replace(/\/+$/, "");
  return `${CANONICAL_ORIGIN}${normalized}`;
}
