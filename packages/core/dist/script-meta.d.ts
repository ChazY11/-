import type { MechanismTag, PlayStyle, ScriptPack, StatusTag, StorytellerControlLevers } from './types';
interface ScriptStrategyMeta {
    displayName: string;
    playerCountRange: [number, number];
    statusTags: StatusTag[];
    mechanismTags: MechanismTag[];
    storytellerControlLevers: StorytellerControlLevers;
    supportedPlayStyles: PlayStyle[];
    riskWarnings: string[];
    commonConflictTypes: string[];
    storytellerGuidance: string[];
}
export declare function applyScriptMeta(scriptPack: ScriptPack): ScriptPack;
export declare function getScriptMeta(scriptId: string): ScriptStrategyMeta | undefined;
export {};
//# sourceMappingURL=script-meta.d.ts.map