import { v4 as uuidv4 } from 'uuid';

export type Alignment = 'good' | 'evil';
export type RoleType = 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveler';
export type GamePhase = 'setup' | 'day' | 'night' | 'finished';
export type GameMode = 'good' | 'evil' | 'storyteller';

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
  edition: string;
  summary: string;
  supportedPlayerCounts: number[];
  status: 'stable' | 'preview';
  roles: RoleDef[];
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
  roleAssignments: Record<string, string>;  // playerId -> roleId
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

export type EventType =
  | 'claim_role'
  | 'claim_info'
  | 'nomination'
  | 'vote'
  | 'execution'
  | 'night_death'
  | 'ability_use'
  | 'ability_result'
  | 'status_change'
  | 'note';

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

export function createDefaultPlayerState(): PlayerState {
  return {
    poisoned: false,
    drunk: false,
    mad: false,
    protected: false,
    alignmentChanged: false,
    roleChanged: false,
    usedAbility: false,
    nominated: false,
    voted: false,
    executed: false,
    diedAtNight: false,
    customTags: [],
  };
}

export function createDefaultStorytellerData(): StorytellerData {
  return {
    roleAssignments: {},
    nightActions: [],
    grimNotes: '',
  };
}

export function createPlayer(seatNumber: number, name: string): Player {
  return {
    id: uuidv4(),
    seatNumber,
    name,
    isAlive: true,
    hasGhostVote: true,
    notes: '',
    state: createDefaultPlayerState(),
    suspicion: 'unknown',
    actualAlignment: 'good',
    privateNotes: '',
  };
}

export function createGame(name: string, scriptId: string, playerCount: number, mode: GameMode = 'good'): Game {
  return {
    id: uuidv4(),
    name,
    scriptId,
    playerCount,
    players: [],
    events: [],
    currentPhase: 'setup',
    currentDay: 0,
    currentNight: 0,
    lastActiveAt: Date.now(),
    mode,
    storytellerData: createDefaultStorytellerData(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createEvent(
  type: EventType,
  day: number,
  phase: GamePhase,
  data: EventData,
  sourcePlayerId?: string,
  targetPlayerId?: string,
): GameEvent {
  return {
    id: uuidv4(),
    type,
    day,
    phase,
    timestamp: Date.now(),
    sourcePlayerId,
    targetPlayerId,
    data,
  };
}
