const KEY = "smart-recycle_recent_q";

export function readRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed)
      ? parsed.filter((row): row is string => typeof row === "string").slice(0, 8)
      : [];
  } catch {
    return [];
  }
}

export function pushRecentSearch(query: string): string[] {
  const next = [query.trim(), ...readRecentSearches().filter((row) => row !== query.trim())]
    .filter(Boolean)
    .slice(0, 8);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
