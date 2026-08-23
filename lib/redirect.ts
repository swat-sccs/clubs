/** Same-site relative path only. Rejects protocol-relative `//evil.com`. */
export function safeRelativePath(
  raw: string | string[] | undefined,
  fallback: string
): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("\\")) return fallback;
  return value;
}
