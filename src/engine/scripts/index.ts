import type { ScriptPack } from '../types';
import { troubleBrewingPack } from './trouble-brewing';
import { dreamsVanishingPack } from './dreams-vanishing';
import { badMoonRisingPack } from './bad-moon-rising';
import { sectsAndVioletsPack } from './sects-and-violets';

const scriptPacks: ScriptPack[] = [
  troubleBrewingPack,
  dreamsVanishingPack,
  badMoonRisingPack,
  sectsAndVioletsPack,
];

const scriptRegistry: Map<string, ScriptPack> = new Map(
  scriptPacks.map((pack) => [pack.id, pack]),
);

export function getScriptPack(id: string): ScriptPack | undefined {
  return scriptRegistry.get(id);
}

export function getAllScriptPacks(): ScriptPack[] {
  return scriptPacks;
}

export function getDefaultScriptPack(): ScriptPack {
  return scriptPacks[0];
}

export { troubleBrewingPack, dreamsVanishingPack, badMoonRisingPack, sectsAndVioletsPack };
