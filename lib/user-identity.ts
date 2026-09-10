const USERNAME_PREFIX = "username:";

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function userIdentityKey(
  preferredUsername: unknown,
  fallbackSubject: unknown,
) {
  if (typeof preferredUsername === "string") {
    const username = normalizeUsername(preferredUsername);
    if (username) return `${USERNAME_PREFIX}${username}`;
  }

  return typeof fallbackSubject === "string" ? fallbackSubject.trim() : "";
}
