import type { Game, ScriptPack, ValidationIssue } from './types';
/**
 * Run all validation rules against the current game state.
 * Returns a list of issues sorted by severity (errors first).
 */
export declare function validateGame(game: Game, scriptPack: ScriptPack): ValidationIssue[];
//# sourceMappingURL=validator.d.ts.map