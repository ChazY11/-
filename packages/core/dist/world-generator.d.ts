import type { Game, ScriptPack, WorldState } from './types';
/**
 * Generate candidate world states based on current game information.
 * This is an MVP brute-force approach that generates possible role assignments
 * and scores them against observed events.
 */
export declare function generateWorlds(game: Game, scriptPack: ScriptPack, maxResults?: number): WorldState[];
//# sourceMappingURL=world-generator.d.ts.map