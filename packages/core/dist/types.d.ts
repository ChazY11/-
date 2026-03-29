export type Alignment = 'good' | 'evil';
export type RoleType = 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveler';
export type GamePhase = 'setup' | 'day' | 'night' | 'finished';
export type GameMode = 'good' | 'evil' | 'storyteller';
export type StatusTag = 'poison' | 'drunk' | 'madness' | 'resurrection' | 'role_swap' | 'alignment_change' | 'protection' | 'night_death' | 'execution_pressure';
export type MechanismTag = 'distance_logic' | 'public_claim_trigger' | 'outsider_count_shift' | 'false_info' | 'state_tracking' | 'night_order' | 'role_change' | 'alignment_shift' | 'madness' | 'resurrection' | 'death_pressure' | 'bluff_pressure';
export type PlayStyle = 'teaching' | 'balanced' | 'high_pressure' | 'high_confusion' | 'high_reversal' | 'theatrical';
export interface StorytellerControlLevers {
    infoDistortion: number;
    stateDisruption: number;
    resurrectionSwing: number;
    bluffPressure: number;
    publicConflict: number;
}
export interface RoleDef {
    id: string;
    name: string;
    zhName: string;
    type: RoleType;
    alignment: Alignment;
    ability: string;
    nightOrder?: number;
    firstNight?: boolean;
    otherNights?: boolean;
    setup?: boolean;
    jinxes?: string[];
    tags?: string[];
}
export interface ScriptPack {
    id: string;
    name: string;
    zhName: string;
    displayName?: string;
    edition: string;
    summary: string;
    supportedPlayerCounts: number[];
    playerCountRange?: [number, number];
    status: 'stable' | 'preview';
    roles: RoleDef[];
    nightOrder?: string[];
    statusTags?: StatusTag[];
    mechanismTags?: MechanismTag[];
    storytellerControlLevers?: StorytellerControlLevers;
    supportedPlayStyles?: PlayStyle[];
    riskWarnings?: string[];
    commonConflictTypes?: string[];
    storytellerGuidance?: string[];
    townsfolkCount: (playerCount: number) => number;
    outsiderCount: (playerCount: number) => number;
    minionCount: (playerCount: number) => number;
    demonCount: (playerCount: number) => number;
    validationRules: ValidationRule[];
}
export interface ValidationRule {
    id: string;
    description: string;
    validate: (game: Game, scriptPack: ScriptPack) => ValidationIssue[];
}
export interface NightAction {
    id: string;
    night: number;
    roleId: string;
    playerId: string;
    targetPlayerIds: string[];
    result?: string;
    order: number;
}
export interface StorytellerData {
    roleAssignments: Record<string, string>;
    nightActions: NightAction[];
    grimNotes: string;
}
export interface Game {
    id: string;
    name: string;
    scriptId: string;
    scriptName?: string;
    playerCount: number;
    players: Player[];
    events: GameEvent[];
    currentPhase: GamePhase;
    currentDay: number;
    currentNight: number;
    lastActiveAt: number;
    mode: GameMode;
    storytellerData?: StorytellerData;
    createdAt: number;
    updatedAt: number;
}
export interface Player {
    id: string;
    seatNumber: number;
    name: string;
    isAlive: boolean;
    hasGhostVote: boolean;
    claimedRole?: string;
    notes: string;
    state: PlayerState;
    suspicion: SuspicionLevel;
    actualRole?: string;
    actualAlignment?: Alignment;
    privateNotes?: string;
}
export type SuspicionLevel = 'unknown' | 'trusted' | 'neutral' | 'suspicious' | 'evil';
export interface PlayerState {
    poisoned: boolean;
    drunk: boolean;
    mad: boolean;
    protected: boolean;
    alignmentChanged: boolean;
    roleChanged: boolean;
    usedAbility: boolean;
    nominated: boolean;
    voted: boolean;
    executed: boolean;
    diedAtNight: boolean;
    customTags: string[];
}
export type EventType = 'claim_role' | 'claim_info' | 'nomination' | 'vote' | 'execution' | 'night_death' | 'ability_use' | 'ability_result' | 'status_change' | 'note';
export interface GameEvent {
    id: string;
    type: EventType;
    day: number;
    phase: GamePhase;
    timestamp: number;
    sourcePlayerId?: string;
    targetPlayerId?: string;
    data: EventData;
}
export type EventData = {
    roleId?: string;
    info?: string;
    claimedNumber?: number;
    claimedPlayers?: string[];
    nominatorId?: string;
    nomineeId?: string;
    votesFor?: string[];
    votesAgainst?: string[];
    passed?: boolean;
    diedPlayerId?: string;
    abilityRoleId?: string;
    abilityTargets?: string[];
    result?: string;
    statusField?: string;
    statusValue?: boolean;
    text?: string;
};
export type IssueSeverity = 'error' | 'warning' | 'info';
export interface ValidationIssue {
    id: string;
    severity: IssueSeverity;
    title?: string;
    message: string;
    impact?: string;
    involvedPlayerIds: string[];
    involvedEventIds: string[];
    ruleId: string;
}
export interface WorldState {
    id: string;
    assignments: RoleAssignment[];
    isValid: boolean;
    invalidReasons: string[];
    score: number;
    keyDeductions: string[];
}
export interface RoleAssignment {
    playerId: string;
    roleId: string;
    alignment: Alignment;
}
export interface SuspicionScore {
    playerId: string;
    evilProbability: number;
    reasons: string[];
}
export interface StrategySection {
    id: string;
    title: string;
    items: string[];
}
export interface StrategyHeadlineCard {
    id: string;
    title: string;
    value: string;
    detail: string;
    tone?: 'neutral' | 'good' | 'evil' | 'warning';
}
export interface StrategyOption {
    id: string;
    title: string;
    focus: string;
    risk: string;
    style?: PlayStyle;
    recommendedFor?: string;
    recommendedPlayers?: string;
    levers?: string[];
    guardrails?: string[];
}
export interface PerspectiveAdvice {
    perspective: GameMode;
    summary: string;
    headlineCards: StrategyHeadlineCard[];
    sections: StrategySection[];
    options?: StrategyOption[];
    openingSections?: StrategySection[];
    guardrailChecks?: string[];
}
export declare function createDefaultPlayerState(): PlayerState;
export declare function createDefaultStorytellerData(): StorytellerData;
export declare function createPlayer(seatNumber: number, name: string): Player;
export declare function createGame(name: string, scriptId: string, playerCount: number, mode?: GameMode): Game;
export declare function createEvent(type: EventType, day: number, phase: GamePhase, data: EventData, sourcePlayerId?: string, targetPlayerId?: string): GameEvent;
//# sourceMappingURL=types.d.ts.map