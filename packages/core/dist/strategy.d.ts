import type { Game, GameMode, PerspectiveAdvice, ScriptPack } from './types';
export declare function getPerspectiveAdvice(game: Game, scriptPack: ScriptPack, perspective?: GameMode): PerspectiveAdvice;
export declare function getStrategyPackSupportLevel(scriptId: string): 'full' | 'meta_only';
export declare function getStrategyPackFocus(scriptId: string): string;
//# sourceMappingURL=strategy.d.ts.map