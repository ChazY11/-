export interface ParsedPlayerNames {
  names: string[];
  duplicates: string[];
}

const PLAYER_NAME_SPLIT_REGEX = /[\r\n,\uFF0C\u3001\s]+/;

export function parsePlayerNames(raw: string): ParsedPlayerNames {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  const names = raw
    .split(PLAYER_NAME_SPLIT_REGEX)
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => {
      const normalized = name.toLocaleLowerCase();
      if (seen.has(normalized)) {
        duplicates.add(name);
      }
      seen.add(normalized);
      return name;
    });

  return {
    names,
    duplicates: [...duplicates],
  };
}

export function hasDuplicateNames(names: string[]): boolean {
  const seen = new Set<string>();
  for (const name of names) {
    const normalized = name.trim().toLocaleLowerCase();
    if (!normalized) continue;
    if (seen.has(normalized)) return true;
    seen.add(normalized);
  }
  return false;
}
