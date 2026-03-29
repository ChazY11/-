const PLAYER_NAME_SPLIT_REGEX = /[\r\n,\uFF0C\u3001\s]+/;
export function parsePlayerNames(raw) {
    const seen = new Set();
    const duplicates = new Set();
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
export function hasDuplicateNames(names) {
    const seen = new Set();
    for (const name of names) {
        const normalized = name.trim().toLocaleLowerCase();
        if (!normalized)
            continue;
        if (seen.has(normalized))
            return true;
        seen.add(normalized);
    }
    return false;
}
//# sourceMappingURL=player-import.js.map