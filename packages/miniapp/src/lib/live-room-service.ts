import Taro from '@tarojs/taro';
import {
  createLiveMemberState,
  createLiveRoom,
  createNightActionRequest,
  createPlayer,
  getNightRequestTemplate,
  getNightRequestTemplates,
  getScriptPack,
  type Alignment,
  type AppMode,
  type DayPhaseStage,
  type IdentityDelivery,
  type LiveRoom,
  type LiveRoomLog,
  type LiveStateChange,
  type LiveVictoryAlignment,
  type LiveArchiveSeed,
  type NightActionRequest,
  type NightRequestActionType,
  type NightRequestPayload,
  type NightRequestResolution,
  type NightRequestTemplate,
  type RoomMember,
} from '@clocktower/core';
import { initCloudbase } from './cloudbase';

const LIVE_ROOM_STORAGE_KEY = 'clocktower_live_rooms';
const LIVE_USER_KEY = 'clocktower_live_user_id';
const CURRENT_ROOM_KEY = 'clocktower_live_current_room_id';

function loadRooms(): LiveRoom[] {
  try {
    const raw = Taro.getStorageSync(LIVE_ROOM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRooms(rooms: LiveRoom[]) {
  try {
    Taro.setStorageSync(LIVE_ROOM_STORAGE_KEY, JSON.stringify(rooms));
  } catch {
    // Ignore mock persistence failure.
  }
}

function saveCurrentRoomId(roomId: string | null) {
  if (roomId) Taro.setStorageSync(CURRENT_ROOM_KEY, roomId);
  else Taro.removeStorageSync(CURRENT_ROOM_KEY);
}

function upsertRoom(room: LiveRoom) {
  const rooms = loadRooms();
  const nextRooms = [...rooms.filter((entry) => entry.roomId !== room.roomId), room];
  saveRooms(nextRooms);
  return room;
}

function assertRoom(roomId: string) {
  const room = getRoomById(roomId);
  if (!room) throw new Error('房间不存在');
  return room;
}

function getMemberByUserId(room: LiveRoom, userId: string) {
  return room.members.find((member) => member.userId === userId) ?? null;
}

function assertStoryteller(room: LiveRoom, userId: string) {
  const member = getMemberByUserId(room, userId);
  if (!member || member.role !== 'storyteller') {
    throw new Error('只有说书人可以执行该操作');
  }
  return member;
}

function assertPhase(room: LiveRoom, phase: LiveRoom['currentPhase']) {
  if (room.currentPhase !== phase) {
    throw new Error(`当前阶段不是 ${phase}`);
  }
}

function assertNotFinished(room: LiveRoom) {
  if (room.status === 'finished' || room.currentPhase === 'finished') {
    throw new Error('该对局已经结束，不能继续修改');
  }
}

function appendLog(
  room: LiveRoom,
  input: Omit<LiveRoomLog, 'logId' | 'roomId' | 'createdAt'>,
): LiveRoom {
  return {
    ...room,
    logs: [
      ...room.logs,
      {
        ...input,
        logId: `roomlog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        roomId: room.roomId,
        createdAt: Date.now(),
      },
    ],
    updatedAt: Date.now(),
  };
}

function applyStateChanges(room: LiveRoom, changes?: LiveStateChange[]) {
  if (!changes?.length) return room;

  const nextMembers = room.members.map((member) => {
    const memberChanges = changes.filter((change) => change.memberId === member.memberId);
    if (memberChanges.length === 0) return member;

    let nextState = { ...member.liveState };
    for (const change of memberChanges) {
      if (change.type === 'alive') nextState.isAlive = Boolean(change.nextValue);
      if (change.type === 'poisoned') nextState.poisoned = Boolean(change.nextValue);
      if (change.type === 'disabled') nextState.disabled = Boolean(change.nextValue);
      if (change.type === 'status_tag' && typeof change.nextValue === 'string') {
        if (!nextState.statusTags.includes(change.nextValue)) {
          nextState.statusTags = [...nextState.statusTags, change.nextValue];
        }
      }
    }

    return { ...member, liveState: nextState };
  });

  return { ...room, members: nextMembers, updatedAt: Date.now() };
}

function createArchiveSeed(room: LiveRoom): LiveArchiveSeed {
  return {
    archiveId: `archive-${room.roomId}`,
    roomId: room.roomId,
    scriptId: room.scriptId,
    scriptName: room.scriptName,
    playerCount: room.playerCount,
    currentDay: room.currentDay,
    currentNight: room.currentNight,
    outcome: room.outcome,
    exportedAt: Date.now(),
    eventCount: room.logs.length,
    publicEventCount: room.logs.filter((log) => log.visibility === 'public').length,
    finalSummary: room.outcome ? `${room.outcome.victoryAlignment} 胜利：${room.outcome.reason}` : room.dayState?.summary,
  };
}

function assertTargetsExist(room: LiveRoom, targetIds: string[]) {
  const validIds = new Set(room.members.filter((member) => member.role === 'player').map((member) => member.memberId));
  for (const targetId of targetIds) {
    if (!validIds.has(targetId)) {
      throw new Error(`目标玩家不存在：${targetId}`);
    }
  }
}

function validateRequestPayload(room: LiveRoom, request: NightActionRequest, payload: NightRequestPayload) {
  const targetIds = payload.selectedPlayerIds ?? [];
  const roleId = payload.selectedRoleId;
  const options = request.options;

  if (request.actionType === 'select_one_player') {
    if (targetIds.length !== 1) throw new Error('该请求必须且只能选择 1 名目标');
    assertTargetsExist(room, targetIds);
  }

  if (request.actionType === 'select_two_players') {
    if (targetIds.length !== 2) throw new Error('该请求必须选择 2 名不同的目标');
    if (new Set(targetIds).size !== 2) throw new Error('该请求必须选择 2 名不同的目标');
    assertTargetsExist(room, targetIds);
  }

  if (request.actionType === 'select_role') {
    if (!roleId) throw new Error('该请求必须选择角色');
    if (options?.allowedRoleIds?.length && !options.allowedRoleIds.includes(roleId)) {
      throw new Error('所选角色不在允许范围内');
    }
  }

  if (request.actionType === 'yes_no' && typeof payload.yesNo !== 'boolean') {
    throw new Error('该请求必须提交明确的是 / 否结果');
  }

  if (options?.minSelections !== undefined && targetIds.length < options.minSelections) {
    throw new Error(`至少需要选择 ${options.minSelections} 个目标`);
  }

  if (options?.maxSelections !== undefined && targetIds.length > options.maxSelections) {
    throw new Error(`最多只能选择 ${options.maxSelections} 个目标`);
  }

  if (options?.allowedTargetIds?.length) {
    for (const targetId of targetIds) {
      if (!options.allowedTargetIds.includes(targetId)) {
        throw new Error('所选目标不在允许范围内');
      }
    }
  }
}

function buildNightPublicSummary(room: LiveRoom) {
  const currentNightRequests = room.nightRequests.filter((request) => request.nightNumber === room.currentNight);
  const deathChanges = currentNightRequests
    .flatMap((request) => request.storytellerResolution?.appliedStateChanges ?? [])
    .filter((change) => change.type === 'alive' && change.nextValue === false);

  const deadNames = deathChanges
    .map((change) => room.members.find((member) => member.memberId === change.memberId)?.name)
    .filter((name): name is string => Boolean(name));

  const publicNotes = deadNames.length > 0
    ? [`昨夜死亡：${deadNames.join('、')}`]
    : ['昨夜无人死亡或结果未公开。'];

  const summary = deadNames.length > 0
    ? `第 ${room.currentDay + 1} 天开始。昨夜死亡：${deadNames.join('、')}。`
    : `第 ${room.currentDay + 1} 天开始。昨夜暂无公开死亡结果。`;

  return { summary, publicNotes };
}

export function getOrCreateLiveUserId() {
  try {
    const cached = Taro.getStorageSync(LIVE_USER_KEY);
    if (cached) return cached;
    const generated = `wxu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    Taro.setStorageSync(LIVE_USER_KEY, generated);
    return generated;
  } catch {
    return `wxu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

export function setCurrentRoomId(roomId: string | null) {
  saveCurrentRoomId(roomId);
}

export interface CreateRoomPayload {
  storytellerName: string;
  scriptId: string;
  playerCount: number;
  mode?: AppMode;
}

export interface JoinRoomPayload {
  inviteCode: string;
  playerName: string;
}

export interface CreateNightRequestPayload {
  roomId: string;
  actingUserId: string;
  actorMemberId: string;
  actionType: NightRequestActionType;
  prompt: string;
  description?: string;
  allowedTargetIds?: string[];
  allowedRoleIds?: string[];
  maxSelections?: number;
  minSelections?: number;
  templateId?: string;
}

export interface ResolveNightRequestPayload {
  roomId: string;
  actingUserId: string;
  requestId: string;
  resolutionText: string;
  deliveryText: string;
  privateNote?: string;
  appliedStateChanges?: LiveStateChange[];
}

export interface UpdateDayStatePayload {
  roomId: string;
  actingUserId: string;
  stage: DayPhaseStage;
  summary: string;
  publicNote?: string;
}

export interface RecordNominationPayload {
  roomId: string;
  actingUserId: string;
  nomineeMemberId: string;
  nominatorMemberId?: string;
  summary: string;
}

export interface RecordExecutionPayload {
  roomId: string;
  actingUserId: string;
  executedMemberId?: string;
  summary: string;
}

export interface ResolveNominationPayload {
  roomId: string;
  actingUserId: string;
  nominationId: string;
  advancedToExecution: boolean;
  summary?: string;
}

export interface FinishNightResult {
  ok: boolean;
  pending: number;
  submitted: number;
  message: string;
  room?: LiveRoom;
}

export interface FinishGamePayload {
  roomId: string;
  actingUserId: string;
  victoryAlignment: LiveVictoryAlignment;
  reason: string;
  note?: string;
}

function buildNominationPublicSummary(room: LiveRoom, payload: ResolveNominationPayload, targetName: string) {
  if (payload.advancedToExecution) {
    return payload.summary?.trim() || `${targetName} 的提名进入处决阶段`;
  }
  return payload.summary?.trim() || `${targetName} 的提名未进入处决阶段`;
}

export function listLiveRooms() {
  return loadRooms();
}

export function getCurrentRoomId() {
  try {
    return Taro.getStorageSync(CURRENT_ROOM_KEY) || null;
  } catch {
    return null;
  }
}

export function getRoomById(roomId: string) {
  return loadRooms().find((room) => room.roomId === roomId) ?? null;
}

export function createRoom(payload: CreateRoomPayload) {
  const userId = getOrCreateLiveUserId();
  const scriptPack = getScriptPack(payload.scriptId);
  initCloudbase();

  const room = createLiveRoom({
    storytellerName: payload.storytellerName,
    storytellerUserId: userId,
    scriptId: payload.scriptId,
    scriptName: scriptPack?.zhName ?? payload.scriptId,
    playerCount: payload.playerCount,
    mode: payload.mode ?? 'live',
  });

  upsertRoom(room);
  saveCurrentRoomId(room.roomId);
  return { room, currentUserId: userId };
}

export function joinRoom(payload: JoinRoomPayload) {
  const userId = getOrCreateLiveUserId();
  const rooms = loadRooms();
  const room = rooms.find((entry) => entry.inviteCode === payload.inviteCode.trim().toUpperCase());

  if (!room) throw new Error('房间不存在或邀请码错误');
  if (room.status !== 'open') throw new Error('房间已锁定，当前不能加入');

  const existingMember = room.members.find((member) => member.userId === userId);
  if (existingMember) {
    saveCurrentRoomId(room.roomId);
    return { room, currentUserId: userId, member: existingMember };
  }

  const member: RoomMember = {
    memberId: `member-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    name: payload.playerName.trim(),
    role: 'player',
    ready: false,
    connected: true,
    joinedAt: Date.now(),
    lastSeenAt: Date.now(),
    liveState: createLiveMemberState(),
  };

  const nextRoom = appendLog(
    { ...room, members: [...room.members, member] },
    {
      eventType: 'member_joined',
      actorMemberId: member.memberId,
      summary: `${member.name} 加入了房间`,
      visibility: 'public',
    },
  );

  upsertRoom(nextRoom);
  saveCurrentRoomId(nextRoom.roomId);
  return { room: nextRoom, currentUserId: userId, member };
}

export function assignSeat(roomId: string, memberId: string, seatNumber: number) {
  const room = assertRoom(roomId);
  assertNotFinished(room);
  const targetSeat = room.seats.find((seat) => seat.seatNumber === seatNumber);
  if (!targetSeat) throw new Error('座位不存在');

  const nextSeats = room.seats.map((seat) => {
    if (seat.memberId === memberId) return { ...seat, memberId: undefined };
    if (seat.seatNumber === seatNumber) return { ...seat, memberId };
    return seat;
  });

  const member = room.members.find((entry) => entry.memberId === memberId);
  const nextMembers = room.members.map((entry) => (
    entry.memberId === memberId ? { ...entry, seatNumber } : entry
  ));

  return upsertRoom(appendLog(
    { ...room, seats: nextSeats, members: nextMembers, updatedAt: Date.now() },
    {
      eventType: 'seat_assigned',
      actorMemberId: memberId,
      summary: `${member?.name ?? '玩家'} 被安排到 ${seatNumber} 号位`,
      visibility: 'storyteller',
      memberId,
    },
  ));
}

export function toggleMemberReady(roomId: string, memberId: string) {
  const room = assertRoom(roomId);
  assertNotFinished(room);
  return upsertRoom({
    ...room,
    members: room.members.map((member) => (
      member.memberId === memberId ? { ...member, ready: !member.ready, lastSeenAt: Date.now() } : member
    )),
    updatedAt: Date.now(),
  });
}

export function lockRoom(roomId: string) {
  const room = assertRoom(roomId);
  assertNotFinished(room);
  return upsertRoom(appendLog(
    { ...room, status: 'locked', currentPhase: 'setup', updatedAt: Date.now() },
    {
      eventType: 'room_locked',
      actorMemberId: room.storytellerId,
      summary: '房间已锁定，准备发放身份',
      visibility: 'public',
    },
  ));
}

export function dispatchIdentity(roomId: string, memberId: string, roleId: string, alignment: Alignment) {
  const room = assertRoom(roomId);
  assertNotFinished(room);
  const member = room.members.find((entry) => entry.memberId === memberId);
  if (!member) throw new Error('成员不存在');

  const scriptPack = getScriptPack(room.scriptId);
  const role = scriptPack?.roles.find((entry) => entry.id === roleId);
  if (!scriptPack || !role) throw new Error('角色不属于当前脚本');

  const teammateNames = alignment === 'evil'
    ? room.members
        .filter((entry) => entry.memberId !== memberId)
        .filter((entry) => room.identityDeliveries[entry.memberId]?.alignment === 'evil')
        .map((entry) => entry.name)
    : [];

  const delivery: IdentityDelivery = {
    memberId,
    roleId,
    roleName: role.zhName,
    ability: role.ability,
    alignment,
    teammates: teammateNames,
    sentAt: Date.now(),
  };

  return upsertRoom(appendLog(
    {
      ...room,
      identityDeliveries: {
        ...room.identityDeliveries,
        [memberId]: delivery,
      },
      updatedAt: Date.now(),
    },
    {
      eventType: 'identity_sent',
      actorMemberId: room.storytellerId,
      summary: `已向 ${member.name} 私发身份`,
      visibility: 'storyteller',
      memberId,
    },
  ));
}

export function getNightTemplates(scriptId: string): NightRequestTemplate[] {
  return getNightRequestTemplates(scriptId);
}

export function getNightTemplate(scriptId: string, templateId: string) {
  return getNightRequestTemplate(scriptId, templateId);
}

export function createNightRequest(payload: CreateNightRequestPayload) {
  const room = assertRoom(payload.roomId);
  assertNotFinished(room);
  assertStoryteller(room, payload.actingUserId);
  assertPhase(room, 'night');

  const member = room.members.find((entry) => entry.memberId === payload.actorMemberId);
  if (!member) throw new Error('行动成员不存在');

  const template = payload.templateId ? getNightRequestTemplate(room.scriptId, payload.templateId) : undefined;
  const prompt = payload.prompt || template?.prompt;
  if (!prompt) throw new Error('夜晚请求缺少说明');

  const request = createNightActionRequest({
    roomId: room.roomId,
    nightNumber: Math.max(room.currentNight, 1),
    actorMemberId: member.memberId,
    actorPlayerName: member.name,
    actorRoleId: room.identityDeliveries[member.memberId]?.roleId,
    actionType: payload.actionType || template?.actionType || 'confirm_only',
    prompt,
    description: payload.description ?? template?.description,
    options: {
      ...(template?.options ?? {}),
      allowedTargetIds: payload.allowedTargetIds ?? template?.options?.allowedTargetIds,
      allowedRoleIds: payload.allowedRoleIds ?? template?.options?.allowedRoleIds,
      maxSelections: payload.maxSelections ?? template?.options?.maxSelections,
      minSelections: payload.minSelections ?? template?.options?.minSelections,
    },
  });

  return upsertRoom(appendLog(
    {
      ...room,
      status: room.status === 'locked' ? 'in_progress' : room.status,
      nightRequests: [...room.nightRequests, request],
      updatedAt: Date.now(),
    },
    {
      eventType: 'night_request_created',
      actorMemberId: room.storytellerId,
      targetRequestId: request.requestId,
      nightNumber: request.nightNumber,
      summary: `已为 ${member.name} 创建夜晚请求：${request.prompt}`,
      visibility: 'storyteller',
      memberId: member.memberId,
    },
  ));
}

export function submitNightRequest(
  roomId: string,
  requestId: string,
  actingUserId: string,
  submittedPayload: NightRequestPayload,
) {
  const room = assertRoom(roomId);
  assertNotFinished(room);
  assertPhase(room, 'night');

  const request = room.nightRequests.find((entry) => entry.requestId === requestId);
  if (!request) throw new Error('夜晚请求不存在');
  if (request.nightNumber !== room.currentNight) throw new Error('不能提交旧夜晚的请求');

  const member = getMemberByUserId(room, actingUserId);
  if (!member || member.memberId !== request.actorMemberId) {
    throw new Error('你只能提交自己的夜晚请求');
  }
  if (request.status !== 'pending') throw new Error('该请求当前不可提交');

  validateRequestPayload(room, request, submittedPayload);

  const nextRequests = room.nightRequests.map((entry) => (
    entry.requestId === requestId
      ? { ...entry, status: 'submitted' as const, submittedPayload, updatedAt: Date.now() }
      : entry
  ));

  return upsertRoom(appendLog(
    { ...room, nightRequests: nextRequests, updatedAt: Date.now() },
    {
      eventType: 'night_request_submitted',
      actorMemberId: request.actorMemberId,
      targetRequestId: request.requestId,
      nightNumber: request.nightNumber,
      summary: `${request.actorPlayerName} 已提交夜晚操作`,
      visibility: 'storyteller',
      memberId: request.actorMemberId,
    },
  ));
}

export function resolveNightRequest(payload: ResolveNightRequestPayload) {
  const room = assertRoom(payload.roomId);
  assertNotFinished(room);
  assertStoryteller(room, payload.actingUserId);
  assertPhase(room, 'night');

  const request = room.nightRequests.find((entry) => entry.requestId === payload.requestId);
  if (!request) throw new Error('夜晚请求不存在');
  if (request.nightNumber !== room.currentNight) throw new Error('不能裁定旧夜晚的请求');
  if (request.status !== 'submitted') throw new Error('只有已提交的请求可以裁定');

  const resolution: NightRequestResolution = {
    resultText: payload.resolutionText,
    privateNote: payload.privateNote,
    appliedStateChanges: payload.appliedStateChanges,
    resolvedAt: Date.now(),
  };

  const nextRequests = room.nightRequests.map((entry) => (
    entry.requestId === payload.requestId
      ? {
          ...entry,
          status: 'resolved' as const,
          storytellerResolution: resolution,
          resultDelivery: { message: payload.deliveryText, deliveredAt: Date.now() },
          updatedAt: Date.now(),
        }
      : entry
  ));

  const withRequest = { ...room, nightRequests: nextRequests, updatedAt: Date.now() };
  const withState = applyStateChanges(withRequest, payload.appliedStateChanges);
  const withResolvedLog = appendLog(withState, {
    eventType: 'night_request_resolved',
    actorMemberId: room.storytellerId,
    targetRequestId: request.requestId,
    nightNumber: request.nightNumber,
    summary: `已裁定 ${request.actorPlayerName} 的夜晚操作`,
    visibility: 'storyteller',
    memberId: request.actorMemberId,
  });
  const withDeliveryLog = appendLog(withResolvedLog, {
    eventType: 'night_result_delivered',
    actorMemberId: room.storytellerId,
    targetRequestId: request.requestId,
    nightNumber: request.nightNumber,
    summary: `已向 ${request.actorPlayerName} 回传夜晚结果`,
    visibility: 'private',
    memberId: request.actorMemberId,
  });

  return upsertRoom(withDeliveryLog);
}

export function startNight(roomId: string, actingUserId: string) {
  const room = assertRoom(roomId);
  assertNotFinished(room);
  assertStoryteller(room, actingUserId);
  if (!['setup', 'day'].includes(room.currentPhase)) {
    throw new Error('当前阶段不能进入夜晚');
  }

  const nextNight = room.currentNight + 1;
  const nextRoom = appendLog(
    {
      ...room,
      currentPhase: 'night',
      currentNight: nextNight,
      status: 'in_progress',
      dayState: room.currentPhase === 'day' ? { ...room.dayState, stage: 'closed' } : room.dayState,
      updatedAt: Date.now(),
    },
    {
      eventType: 'night_phase_started',
      actorMemberId: room.storytellerId,
      nightNumber: nextNight,
      summary: `进入第 ${nextNight} 夜`,
      visibility: 'public',
    },
  );

  return upsertRoom(nextRoom);
}

export function finishNight(roomId: string, actingUserId: string): FinishNightResult {
  const room = assertRoom(roomId);
  assertNotFinished(room);
  assertStoryteller(room, actingUserId);
  assertPhase(room, 'night');

  const activeRequests = room.nightRequests.filter((request) => request.nightNumber === room.currentNight);
  const pending = activeRequests.filter((request) => request.status === 'pending').length;
  const submitted = activeRequests.filter((request) => request.status === 'submitted').length;

  if (pending > 0 || submitted > 0) {
    return {
      ok: false,
      pending,
      submitted,
      message: `本夜仍有 ${pending} 个待提交请求、${submitted} 个待裁定请求，不能结束。`,
    };
  }

  const nightSummary = buildNightPublicSummary(room);
  const nextDay = room.currentDay + 1;
  const completedNight = appendLog(
    {
      ...room,
      currentPhase: 'day',
      currentDay: nextDay,
      dayState: {
        dayNumber: nextDay,
        stage: 'discussion',
        summary: nightSummary.summary,
        publicNotes: nightSummary.publicNotes,
        nominationHistory: [],
      },
      updatedAt: Date.now(),
    },
    {
      eventType: 'night_phase_completed',
      actorMemberId: room.storytellerId,
      nightNumber: room.currentNight,
      summary: `第 ${room.currentNight} 夜已结束`,
      visibility: 'public',
    },
  );
  const withDayLog = appendLog(completedNight, {
    eventType: 'day_phase_started',
    actorMemberId: room.storytellerId,
    dayNumber: nextDay,
    summary: `进入第 ${nextDay} 天讨论阶段`,
    visibility: 'public',
  });

  const saved = upsertRoom(withDayLog);
  return {
    ok: true,
    pending: 0,
    submitted: 0,
    message: `第 ${saved.currentNight} 夜已结束，已进入第 ${saved.currentDay} 天`,
    room: saved,
  };
}

export function updateDayPublicState(payload: UpdateDayStatePayload) {
  const room = assertRoom(payload.roomId);
  assertNotFinished(room);
  assertStoryteller(room, payload.actingUserId);
  assertPhase(room, 'day');

  const currentDay = Math.max(room.currentDay, 1);
  const publicNotes = [
    ...(room.dayState?.publicNotes ?? []),
    ...(payload.publicNote ? [payload.publicNote] : []),
  ];

  const nextRoom = appendLog(
    {
      ...room,
      dayState: {
        dayNumber: currentDay,
        stage: payload.stage,
        summary: payload.summary,
        publicNotes,
        currentNomination: room.dayState?.currentNomination,
        nominationHistory: room.dayState?.nominationHistory ?? [],
        execution: room.dayState?.execution,
      },
      updatedAt: Date.now(),
    },
    {
      eventType: 'day_public_state_updated',
      actorMemberId: room.storytellerId,
      dayNumber: currentDay,
      summary: payload.summary,
      visibility: 'public',
    },
  );

  return upsertRoom(nextRoom);
}

export function recordNomination(payload: RecordNominationPayload) {
  const room = assertRoom(payload.roomId);
  assertNotFinished(room);
  assertStoryteller(room, payload.actingUserId);
  assertPhase(room, 'day');

  const nominee = room.members.find((member) => member.memberId === payload.nomineeMemberId);
  if (!nominee) throw new Error('被提名目标不存在');
  const nominator = payload.nominatorMemberId
    ? room.members.find((member) => member.memberId === payload.nominatorMemberId)
    : undefined;

  const summary = payload.summary.trim() || `${nominee.name} 被提名`;
  const nominationRecord = {
    nominationId: `nom-${Date.now()}`,
    nominatorMemberId: payload.nominatorMemberId,
    nomineeMemberId: payload.nomineeMemberId,
    summary,
    enteredExecution: false,
    outcome: 'pending' as const,
    createdAt: Date.now(),
  };
  const nextRoom = appendLog(
    {
      ...room,
      dayState: {
        dayNumber: Math.max(room.currentDay, 1),
        stage: 'nominations',
        summary,
        publicNotes: room.dayState?.publicNotes ?? [],
        currentNomination: nominationRecord,
        nominationHistory: [...(room.dayState?.nominationHistory ?? []), nominationRecord],
        execution: room.dayState?.execution,
      },
      updatedAt: Date.now(),
    },
    {
      eventType: 'day_nomination_recorded',
      actorMemberId: room.storytellerId,
      dayNumber: Math.max(room.currentDay, 1),
      summary: nominator ? `${nominator.name} 提名了 ${nominee.name}` : summary,
      visibility: 'public',
    },
  );

  return upsertRoom(nextRoom);
}

export function recordExecution(payload: RecordExecutionPayload) {
  const room = assertRoom(payload.roomId);
  assertNotFinished(room);
  assertStoryteller(room, payload.actingUserId);
  assertPhase(room, 'day');

  const executed = payload.executedMemberId
    ? room.members.find((member) => member.memberId === payload.executedMemberId)
    : undefined;
  const summary = payload.summary.trim() || (executed ? `${executed.name} 被处决` : '今天无人处决');
  const publicNotes = [...(room.dayState?.publicNotes ?? []), summary];

  let nextRoom: LiveRoom = {
    ...room,
    dayState: {
      dayNumber: Math.max(room.currentDay, 1),
      stage: 'execution',
      summary,
      publicNotes,
      currentNomination: room.dayState?.currentNomination
        ? { ...room.dayState.currentNomination, enteredExecution: true }
        : room.dayState?.currentNomination,
      nominationHistory: (room.dayState?.nominationHistory ?? []).map((record) => (
        room.dayState?.currentNomination && record.nominationId === room.dayState.currentNomination.nominationId
          ? { ...record, enteredExecution: true, outcome: 'advanced' as const }
          : record
      )),
      execution: {
        executedMemberId: payload.executedMemberId,
        summary,
        createdAt: Date.now(),
      },
    },
    updatedAt: Date.now(),
  };

  if (executed) {
    nextRoom = applyStateChanges(nextRoom, [
      {
        memberId: executed.memberId,
        type: 'alive',
        nextValue: false,
        summary: `${executed.name} 被处决`,
      },
    ]);
  }

  const withLog = appendLog(nextRoom, {
    eventType: 'day_execution_recorded',
    actorMemberId: room.storytellerId,
    dayNumber: Math.max(room.currentDay, 1),
    summary,
    visibility: 'public',
  });

  return upsertRoom(withLog);
}

export function resolveNomination(payload: ResolveNominationPayload) {
  const room = assertRoom(payload.roomId);
  assertNotFinished(room);
  assertStoryteller(room, payload.actingUserId);
  assertPhase(room, 'day');

  const record = (room.dayState?.nominationHistory ?? []).find((entry) => entry.nominationId === payload.nominationId);
  if (!record) throw new Error('提名记录不存在');

  const targetName = room.members.find((member) => member.memberId === record.nomineeMemberId)?.name ?? record.nomineeMemberId;
  const summary = buildNominationPublicSummary(room, payload, targetName);
  const outcome = payload.advancedToExecution ? 'advanced' as const : 'rejected' as const;

  const nextHistory = (room.dayState?.nominationHistory ?? []).map((entry) => (
    entry.nominationId === payload.nominationId
      ? { ...entry, enteredExecution: payload.advancedToExecution, outcome, outcomeSummary: summary }
      : entry
  ));

  const activeNomination = room.dayState?.currentNomination?.nominationId === payload.nominationId
    ? { ...room.dayState.currentNomination, enteredExecution: payload.advancedToExecution, outcome, outcomeSummary: summary }
    : room.dayState?.currentNomination;

  const nextRoom = appendLog(
    {
      ...room,
      dayState: room.dayState ? {
        ...room.dayState,
        stage: payload.advancedToExecution ? 'execution' : 'nominations',
        summary,
        currentNomination: activeNomination,
        nominationHistory: nextHistory,
      } : room.dayState,
      updatedAt: Date.now(),
    },
    {
      eventType: 'day_nomination_resolved',
      actorMemberId: room.storytellerId,
      dayNumber: Math.max(room.currentDay, 1),
      summary,
      visibility: 'public',
    },
  );

  return upsertRoom(nextRoom);
}

export function finishDay(roomId: string, actingUserId: string) {
  const room = assertRoom(roomId);
  assertNotFinished(room);
  assertStoryteller(room, actingUserId);
  assertPhase(room, 'day');

  const nextRoom = appendLog(
    {
      ...room,
      currentPhase: 'setup',
      dayState: room.dayState ? { ...room.dayState, stage: 'closed' } : room.dayState,
      updatedAt: Date.now(),
    },
    {
      eventType: 'day_phase_completed',
      actorMemberId: room.storytellerId,
      dayNumber: room.currentDay,
      summary: `第 ${room.currentDay} 天已结束，准备进入下一夜`,
      visibility: 'public',
    },
  );

  return upsertRoom(nextRoom);
}

export function finishGame(payload: FinishGamePayload) {
  const room = assertRoom(payload.roomId);
  assertNotFinished(room);
  assertStoryteller(room, payload.actingUserId);
  const outcome = {
    victoryAlignment: payload.victoryAlignment,
    reason: payload.reason,
    note: payload.note,
    finishedAt: Date.now(),
  };

  const finishedRoom = appendLog(
    {
      ...room,
      status: 'finished',
      currentPhase: 'finished',
      outcome,
      archiveSeed: createArchiveSeed({
        ...room,
        status: 'finished',
        currentPhase: 'finished',
        outcome,
      }),
      updatedAt: Date.now(),
    },
    {
      eventType: 'game_finished',
      actorMemberId: room.storytellerId,
      summary: `对局结束：${payload.victoryAlignment} 胜利。${payload.reason}`,
      visibility: 'public',
    },
  );

  return upsertRoom(finishedRoom);
}

export function getVisibleIdentity(room: LiveRoom | null, userId: string) {
  if (!room) return null;
  const member = room.members.find((entry) => entry.userId === userId);
  if (!member) return null;
  return room.identityDeliveries[member.memberId] ?? null;
}

export function getVisibleNightRequests(room: LiveRoom | null, userId: string): NightActionRequest[] {
  if (!room) return [];
  const member = room.members.find((entry) => entry.userId === userId);
  if (!member) return [];
  if (member.role === 'storyteller') {
    return room.nightRequests.filter((request) => request.nightNumber === room.currentNight);
  }
  return room.nightRequests.filter((request) => (
    request.actorMemberId === member.memberId && request.nightNumber === room.currentNight
  ));
}

export function getNightConsoleSummary(room: LiveRoom | null) {
  if (!room) {
    return {
      total: 0,
      pending: 0,
      submitted: 0,
      resolved: 0,
      phaseLabel: '无对局',
      stageLabel: '无阶段',
      stateSummary: '当前没有 live 流程',
      nominationCount: 0,
      archiveLabel: '未归档',
    };
  }

  const currentNightRequests = room.nightRequests.filter((request) => request.nightNumber === Math.max(room.currentNight, 1));
  const pending = currentNightRequests.filter((request) => request.status === 'pending').length;
  const submitted = currentNightRequests.filter((request) => request.status === 'submitted').length;
  const resolved = currentNightRequests.filter((request) => request.status === 'resolved').length;

  return {
    total: currentNightRequests.length,
    pending,
    submitted,
    resolved,
    phaseLabel: room.currentPhase,
    stageLabel: room.currentPhase === 'day' ? room.dayState?.stage ?? 'discussion' : 'night',
    stateSummary: room.currentPhase === 'night'
      ? `第 ${Math.max(room.currentNight, 1)} 夜：待提交 ${pending} / 待裁定 ${submitted} / 已完成 ${resolved}`
      : room.currentPhase === 'day'
        ? `第 ${Math.max(room.currentDay, 1)} 天：${room.dayState?.summary ?? '等待白天更新'}`
        : room.currentPhase === 'finished'
          ? '本局已结束'
          : '等待进入下一阶段',
    nominationCount: room.dayState?.nominationHistory?.length ?? 0,
    archiveLabel: room.archiveSeed ? room.archiveSeed.archiveId : '未归档',
  };
}

export function getNightLogs(room: LiveRoom | null) {
  if (!room) return [];
  return room.logs.filter((log) => (
    log.eventType.startsWith('night_')
      || log.eventType === 'day_phase_started'
      || log.eventType === 'day_public_state_updated'
      || log.eventType === 'day_nomination_recorded'
      || log.eventType === 'day_nomination_resolved'
      || log.eventType === 'day_execution_recorded'
      || log.eventType === 'day_phase_completed'
      || log.eventType === 'game_finished'
  ));
}

export function getPublicDayTimeline(room: LiveRoom | null) {
  if (!room) return [];

  return room.logs.filter((log) => (
    log.visibility === 'public'
      && (
        log.eventType === 'day_phase_started'
        || log.eventType === 'day_public_state_updated'
        || log.eventType === 'day_nomination_recorded'
        || log.eventType === 'day_nomination_resolved'
        || log.eventType === 'day_execution_recorded'
        || log.eventType === 'day_phase_completed'
      )
  ));
}

export function createTrainingSeedFromRoom(room: LiveRoom) {
  return {
    id: `training-${room.roomId}`,
    name: `${room.scriptName ?? room.scriptId} 训练复盘`,
    scriptId: room.scriptId,
    playerCount: room.playerCount,
    players: room.seats.map((seat) => {
      const member = room.members.find((entry) => entry.memberId === seat.memberId);
      return createPlayer(seat.seatNumber, member?.name ?? `玩家${seat.seatNumber}`);
    }),
  };
}
