import type { Alignment, GamePhase } from './types';
export type AppMode = 'live' | 'training' | 'replay';
export type LiveRoomStatus = 'open' | 'locked' | 'in_progress' | 'finished';
export type RoomMemberRole = 'storyteller' | 'player';
export type NightRequestActionType = 'select_one_player' | 'select_two_players' | 'select_role' | 'yes_no' | 'confirm_only' | 'wait_for_result';
export type NightRequestStatus = 'pending' | 'submitted' | 'resolved';
export type DayPhaseStage = 'discussion' | 'nominations' | 'execution' | 'closed';
export type LiveStateChangeType = 'alive' | 'poisoned' | 'disabled' | 'status_tag';
export type LiveVictoryAlignment = Alignment | 'draw' | 'unknown';
export type LiveNominationOutcome = 'pending' | 'advanced' | 'rejected';
export type LiveLogEventType = 'room_created' | 'member_joined' | 'seat_assigned' | 'room_locked' | 'identity_sent' | 'night_phase_started' | 'night_request_created' | 'night_request_submitted' | 'night_request_resolved' | 'night_result_delivered' | 'night_phase_completed' | 'day_phase_started' | 'day_public_state_updated' | 'day_nomination_recorded' | 'day_nomination_resolved' | 'day_execution_recorded' | 'day_phase_completed' | 'game_finished' | 'phase_changed' | 'system';
export interface RoomMemberLiveState {
    isAlive: boolean;
    poisoned: boolean;
    disabled: boolean;
    statusTags: string[];
}
export interface RoomMember {
    memberId: string;
    userId: string;
    name: string;
    role: RoomMemberRole;
    seatNumber?: number;
    ready: boolean;
    connected: boolean;
    joinedAt: number;
    lastSeenAt: number;
    liveState: RoomMemberLiveState;
}
export interface RoomSeat {
    seatNumber: number;
    memberId?: string;
}
export interface LiveRoomLog {
    logId: string;
    roomId: string;
    nightNumber?: number;
    dayNumber?: number;
    eventType: LiveLogEventType;
    actorMemberId?: string;
    targetRequestId?: string;
    summary: string;
    visibility: 'public' | 'storyteller' | 'private';
    memberId?: string;
    createdAt: number;
}
export interface IdentityDelivery {
    memberId: string;
    roleId: string;
    roleName: string;
    ability: string;
    alignment: Alignment;
    teammates?: string[];
    sentAt: number;
}
export interface NightRequestOptions {
    minSelections?: number;
    maxSelections?: number;
    allowedTargetIds?: string[];
    allowedRoleIds?: string[];
    yesLabel?: string;
    noLabel?: string;
}
export interface NightRequestPayload {
    selectedPlayerIds?: string[];
    selectedRoleId?: string;
    yesNo?: boolean;
    confirmed?: boolean;
    note?: string;
}
export interface LiveStateChange {
    memberId: string;
    type: LiveStateChangeType;
    nextValue: boolean | string;
    summary: string;
}
export interface NightRequestResolution {
    resultText: string;
    privateNote?: string;
    appliedStateChanges?: LiveStateChange[];
    resolvedAt: number;
}
export interface NightResultDelivery {
    message: string;
    deliveredAt: number;
}
export interface NightActionRequest {
    requestId: string;
    roomId: string;
    phase: 'night';
    nightNumber: number;
    actorMemberId: string;
    actorPlayerName: string;
    actorRoleId?: string;
    actionType: NightRequestActionType;
    prompt: string;
    description?: string;
    options?: NightRequestOptions;
    status: NightRequestStatus;
    submittedPayload?: NightRequestPayload;
    storytellerResolution?: NightRequestResolution;
    resultDelivery?: NightResultDelivery;
    createdAt: number;
    updatedAt: number;
}
export interface NightRequestTemplate {
    templateId: string;
    scriptId: string;
    roleId?: string;
    label: string;
    actionType: NightRequestActionType;
    prompt: string;
    description?: string;
    options?: NightRequestOptions;
}
export interface ScriptNightTemplatePack {
    scriptId: string;
    templates: NightRequestTemplate[];
}
export interface LiveNominationRecord {
    nominationId: string;
    nominatorMemberId?: string;
    nomineeMemberId: string;
    summary: string;
    enteredExecution: boolean;
    outcome: LiveNominationOutcome;
    outcomeSummary?: string;
    createdAt: number;
}
export interface LiveExecutionRecord {
    executedMemberId?: string;
    summary: string;
    createdAt: number;
}
export interface LiveDayState {
    dayNumber: number;
    stage: DayPhaseStage;
    summary: string;
    publicNotes: string[];
    currentNomination?: LiveNominationRecord;
    nominationHistory: LiveNominationRecord[];
    execution?: LiveExecutionRecord;
}
export interface LiveGameOutcome {
    victoryAlignment: LiveVictoryAlignment;
    reason: string;
    note?: string;
    finishedAt: number;
}
export interface LiveArchiveSeed {
    archiveId: string;
    roomId: string;
    scriptId: string;
    scriptName?: string;
    playerCount: number;
    currentDay: number;
    currentNight: number;
    outcome?: LiveGameOutcome;
    exportedAt: number;
    eventCount: number;
    publicEventCount: number;
    finalSummary?: string;
}
export interface LiveRoom {
    roomId: string;
    inviteCode: string;
    hostId: string;
    storytellerId: string;
    mode: AppMode;
    scriptId: string;
    scriptName?: string;
    playerCount: number;
    status: LiveRoomStatus;
    currentPhase: GamePhase | 'lobby';
    currentDay: number;
    currentNight: number;
    members: RoomMember[];
    seats: RoomSeat[];
    logs: LiveRoomLog[];
    identityDeliveries: Record<string, IdentityDelivery>;
    nightRequests: NightActionRequest[];
    dayState?: LiveDayState;
    outcome?: LiveGameOutcome;
    archiveSeed?: LiveArchiveSeed;
    createdAt: number;
    updatedAt: number;
}
export interface CreateLiveRoomInput {
    storytellerName: string;
    storytellerUserId: string;
    scriptId: string;
    scriptName?: string;
    playerCount: number;
    mode?: AppMode;
}
export interface CreateNightRequestInput {
    roomId: string;
    nightNumber: number;
    actorMemberId: string;
    actorPlayerName: string;
    actorRoleId?: string;
    actionType: NightRequestActionType;
    prompt: string;
    description?: string;
    options?: NightRequestOptions;
}
export declare function generateInviteCode(): string;
export declare function createLiveMemberState(): RoomMemberLiveState;
export declare function createLiveRoom(input: CreateLiveRoomInput): LiveRoom;
export declare function createNightActionRequest(input: CreateNightRequestInput): NightActionRequest;
//# sourceMappingURL=live-room.d.ts.map