import { applyScriptMeta } from '../script-meta';
import { troubleBrewingPack } from './trouble-brewing';
import { dreamsVanishingPack } from './dreams-vanishing';
import { badMoonRisingPack } from './bad-moon-rising';
import { sectsAndVioletsPack } from './sects-and-violets';
import { clashingThunderPack, iAmModaviousPack, midnightCarnivalPack, outedEvilPack, } from './community-preview';
const scriptPacks = [
    troubleBrewingPack,
    dreamsVanishingPack,
    badMoonRisingPack,
    sectsAndVioletsPack,
    clashingThunderPack,
    iAmModaviousPack,
    outedEvilPack,
    midnightCarnivalPack,
].map(applyScriptMeta);
const scriptRegistry = new Map(scriptPacks.map((pack) => [pack.id, pack]));
export function getScriptPack(id) {
    return scriptRegistry.get(id);
}
export function getAllScriptPacks() {
    return scriptPacks;
}
export function getDefaultScriptPack() {
    return scriptPacks[0];
}
export { troubleBrewingPack, dreamsVanishingPack, badMoonRisingPack, sectsAndVioletsPack, clashingThunderPack, iAmModaviousPack, outedEvilPack, midnightCarnivalPack, };
//# sourceMappingURL=index.js.map