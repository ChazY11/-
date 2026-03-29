import { create } from 'zustand';
import type {
  Alignment,
  AppMode,
  DayPhaseStage,
  IdentityDelivery,
  LiveRoom,
  LiveStateChange,
  LiveVictoryAlignment,
  NightActionRequest,
  NightRequestActionType,
  NightRequestPayload,
  NightRequestTemplate,
} from '@clocktower/core';
import {
  assignSeat,
  createNightRequest,
  createRoom,
  createLiveUserId,
  dispatchIdentity,
  finishDay,
  finishGame,
  finishNight,
  getCurrentRoomId,
  getNightConsoleSummary,
  getNightLogs,
  getNightTemplates,
  getPublicDayTimeline,
  getOrCreateLiveUserId,
  getRoomById,
  getVisibleIdentity,
  getVisibleNightRequests,
  joinRoom,
  listLiveRooms,
  lockRoom,
  recordExecution,
  recordNomination,
  resolveNomination,
  resolveNightRequest,
  setCurrentRoomId,
  setLiveUserId,
  startNight,
  submitNightRequest,
  toggleMemberReady,
  updateDayPublicState,
  type FinishNightResult,
} from '@/lib/live-room-service';
import { getCloudEnvId, initCloudbase, setCloudEnvId, type CloudbaseInitResult } from '@/lib/cloudbase';

interface LiveRoomStore {
  rooms: LiveRoom[];
  currentRoomId: string | null;
  currentUserId: string;
  cloudbase: CloudbaseInitResult;
  loadRooms: () => void;
  setCloudEnv: (envId: string) => void;
  createLiveRoom: (storytellerName: string, scriptId: string, playerCount: number, mode?: AppMode) => LiveRoom;
  joinLiveRoom: (inviteCode: string, playerName: string) => LiveRoom;
  joinLiveRoomAsNewSession: (inviteCode: string, playerName: string) => LiveRoom;
  switchCurrentIdentity: (userId: string) => void;
  selectRoom: (roomId: string | null) => void;
  assignMemberSeat: (memberId: string, seatNumber: number) => void;
  toggleReady: (memberId: string) => void;
  lockCurrentRoom: () => void;
  startCurrentNight: () => void;
  finishCurrentNight: () => FinishNightResult | null;
  updateCurrentDayState: (stage: DayPhaseStage, summary: string, publicNote?: string) => void;
  recordCurrentNomination: (nomineeMemberId: string, summary: string, nominatorMemberId?: string) => void;
  resolveCurrentNomination: (nominationId: string, advancedToExecution: boolean, summary?: string) => void;
  recordCurrentExecution: (summary: string, executedMemberId?: string) => void;
  finishCurrentDay: () => void;
  finishCurrentGame: (victoryAlignment: LiveVictoryAlignment, reason: string, note?: string) => void;
  dispatchMemberIdentity: (memberId: string, roleId: string, alignment: Alignment) => void;
  createNightRequestForMember: (
    actorMemberId: string,
    actionType: NightRequestActionType,
    prompt: string,
    description?: string,
    allowedTargetIds?: string[],
    allowedRoleIds?: string[],
    minSelections?: number,
    maxSelections?: number,
    templateId?: string,
  ) => void;
  submitVisibleNightRequest: (requestId: string, payload: NightRequestPayload) => void;
  resolveNightRequestForStoryteller: (
    requestId: string,
    resolutionText: string,
    deliveryText: string,
    privateNote?: string,
    appliedStateChanges?: LiveStateChange[],
  ) => void;
  currentRoom: () => LiveRoom | undefined;
  visibleIdentity: () => IdentityDelivery | null;
  visibleNightRequests: () => NightActionRequest[];
  nightConsoleSummary: () => ReturnType<typeof getNightConsoleSummary>;
  nightTemplates: () => NightRequestTemplate[];
  nightLogs: () => ReturnType<typeof getNightLogs>;
  publicDayTimeline: () => ReturnType<typeof getPublicDayTimeline>;
  finishedRooms: () => LiveRoom[];
}

export const useLiveRoomStore = create<LiveRoomStore>((set, get) => ({
  rooms: [],
  currentRoomId: null,
  currentUserId: getOrCreateLiveUserId(),
  cloudbase: initCloudbase(getCloudEnvId()),

  loadRooms: () => {
    set({
      rooms: listLiveRooms(),
      currentRoomId: getCurrentRoomId(),
      currentUserId: getOrCreateLiveUserId(),
      cloudbase: initCloudbase(getCloudEnvId()),
    });
  },

  setCloudEnv: (envId) => {
    setCloudEnvId(envId);
    set({ cloudbase: initCloudbase(envId) });
  },

  createLiveRoom: (storytellerName, scriptId, playerCount, mode = 'live') => {
    const { room, currentUserId } = createRoom({ storytellerName, scriptId, playerCount, mode });
    set({ rooms: listLiveRooms(), currentRoomId: room.roomId, currentUserId });
    return room;
  },

  joinLiveRoom: (inviteCode, playerName) => {
    const result = joinRoom({ inviteCode, playerName });
    set({ rooms: listLiveRooms(), currentRoomId: result.room.roomId, currentUserId: result.currentUserId });
    return result.room;
  },

  joinLiveRoomAsNewSession: (inviteCode, playerName) => {
    const userId = createLiveUserId();
    const result = joinRoom({ inviteCode, playerName, userIdOverride: userId });
    set({ rooms: listLiveRooms(), currentRoomId: result.room.roomId, currentUserId: result.currentUserId });
    return result.room;
  },

  switchCurrentIdentity: (userId) => {
    setLiveUserId(userId);
    set({ currentUserId: userId, rooms: listLiveRooms(), currentRoomId: getCurrentRoomId() });
  },

  selectRoom: (roomId) => {
    setCurrentRoomId(roomId);
    set({ currentRoomId: roomId });
  },

  assignMemberSeat: (memberId, seatNumber) => {
    const roomId = get().currentRoomId;
    if (!roomId) return;
    assignSeat(roomId, memberId, seatNumber);
    set({ rooms: listLiveRooms() });
  },

  toggleReady: (memberId) => {
    const roomId = get().currentRoomId;
    if (!roomId) return;
    toggleMemberReady(roomId, memberId);
    set({ rooms: listLiveRooms() });
  },

  lockCurrentRoom: () => {
    const roomId = get().currentRoomId;
    if (!roomId) return;
    lockRoom(roomId);
    set({ rooms: listLiveRooms() });
  },

  startCurrentNight: () => {
    const roomId = get().currentRoomId;
    if (!roomId) return;
    startNight(roomId, get().currentUserId);
    set({ rooms: listLiveRooms() });
  },

  finishCurrentNight: () => {
    const roomId = get().currentRoomId;
    if (!roomId) return null;
    const result = finishNight(roomId, get().currentUserId);
    set({ rooms: listLiveRooms() });
    return result;
  },

  updateCurrentDayState: (stage, summary, publicNote) => {
    const roomId = get().currentRoomId;
    if (!roomId) return;
    updateDayPublicState({
      roomId,
      actingUserId: get().currentUserId,
      stage,
      summary,
      publicNote,
    });
    set({ rooms: listLiveRooms() });
  },

  recordCurrentNomination: (nomineeMemberId, summary, nominatorMemberId) => {
    const roomId = get().currentRoomId;
    if (!roomId) return;
    recordNomination({
      roomId,
      actingUserId: get().currentUserId,
      nomineeMemberId,
      nominatorMemberId,
      summary,
    });
    set({ rooms: listLiveRooms() });
  },

  resolveCurrentNomination: (nominationId, advancedToExecution, summary) => {
    const roomId = get().currentRoomId;
    if (!roomId) return;
    resolveNomination({
      roomId,
      actingUserId: get().currentUserId,
      nominationId,
      advancedToExecution,
      summary,
    });
    set({ rooms: listLiveRooms() });
  },

  recordCurrentExecution: (summary, executedMemberId) => {
    const roomId = get().currentRoomId;
    if (!roomId) return;
    recordExecution({
      roomId,
      actingUserId: get().currentUserId,
      executedMemberId,
      summary,
    });
    set({ rooms: listLiveRooms() });
  },

  finishCurrentDay: () => {
    const roomId = get().currentRoomId;
    if (!roomId) return;
    finishDay(roomId, get().currentUserId);
    set({ rooms: listLiveRooms() });
  },

  finishCurrentGame: (victoryAlignment, reason, note) => {
    const roomId = get().currentRoomId;
    if (!roomId) return;
    finishGame({
      roomId,
      actingUserId: get().currentUserId,
      victoryAlignment,
      reason,
      note,
    });
    set({ rooms: listLiveRooms() });
  },

  dispatchMemberIdentity: (memberId, roleId, alignment) => {
    const roomId = get().currentRoomId;
    if (!roomId) return;
    dispatchIdentity(roomId, memberId, roleId, alignment);
    set({ rooms: listLiveRooms() });
  },

  createNightRequestForMember: (
    actorMemberId,
    actionType,
    prompt,
    description,
    allowedTargetIds,
    allowedRoleIds,
    minSelections,
    maxSelections,
    templateId,
  ) => {
    const roomId = get().currentRoomId;
    if (!roomId) return;
    createNightRequest({
      roomId,
      actingUserId: get().currentUserId,
      actorMemberId,
      actionType,
      prompt,
      description,
      allowedTargetIds,
      allowedRoleIds,
      minSelections,
      maxSelections,
      templateId,
    });
    set({ rooms: listLiveRooms() });
  },

  submitVisibleNightRequest: (requestId, payload) => {
    const roomId = get().currentRoomId;
    if (!roomId) return;
    submitNightRequest(roomId, requestId, get().currentUserId, payload);
    set({ rooms: listLiveRooms() });
  },

  resolveNightRequestForStoryteller: (requestId, resolutionText, deliveryText, privateNote, appliedStateChanges) => {
    const roomId = get().currentRoomId;
    if (!roomId) return;
    resolveNightRequest({
      roomId,
      actingUserId: get().currentUserId,
      requestId,
      resolutionText,
      deliveryText,
      privateNote,
      appliedStateChanges,
    });
    set({ rooms: listLiveRooms() });
  },

  currentRoom: () => {
    const roomId = get().currentRoomId;
    if (!roomId) return undefined;
    return getRoomById(roomId) ?? get().rooms.find((room) => room.roomId === roomId);
  },

  visibleIdentity: () => {
    const room = get().currentRoom();
    return getVisibleIdentity(room ?? null, get().currentUserId);
  },

  visibleNightRequests: () => {
    const room = get().currentRoom();
    return getVisibleNightRequests(room ?? null, get().currentUserId);
  },

  nightConsoleSummary: () => {
    const room = get().currentRoom();
    return getNightConsoleSummary(room ?? null);
  },

  nightTemplates: () => {
    const room = get().currentRoom();
    return room ? getNightTemplates(room.scriptId) : [];
  },

  nightLogs: () => {
    const room = get().currentRoom();
    return getNightLogs(room ?? null);
  },

  publicDayTimeline: () => {
    const room = get().currentRoom();
    return getPublicDayTimeline(room ?? null);
  },

  finishedRooms: () => get().rooms.filter((room) => room.status === 'finished'),
}));
