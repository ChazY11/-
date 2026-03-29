const distributionTable = {
    5: [3, 0, 1, 1],
    6: [3, 1, 1, 1],
    7: [5, 0, 1, 1],
    8: [5, 1, 1, 1],
    9: [5, 2, 1, 1],
    10: [7, 0, 2, 1],
    11: [7, 1, 2, 1],
    12: [7, 2, 2, 1],
    13: [9, 0, 3, 1],
    14: [9, 1, 3, 1],
    15: [9, 2, 3, 1],
};
function getDistribution(playerCount) {
    var _a;
    const clamped = Math.max(5, Math.min(15, playerCount));
    return (_a = distributionTable[clamped]) !== null && _a !== void 0 ? _a : distributionTable[5];
}
export function standardTownsfolkCount(playerCount) {
    return getDistribution(playerCount)[0];
}
export function standardOutsiderCount(playerCount) {
    return getDistribution(playerCount)[1];
}
export function standardMinionCount(playerCount) {
    return getDistribution(playerCount)[2];
}
export function standardDemonCount(playerCount) {
    return getDistribution(playerCount)[3];
}
//# sourceMappingURL=standard-player-counts.js.map