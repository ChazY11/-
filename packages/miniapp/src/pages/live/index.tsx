import { useEffect, useMemo, useState } from 'react';
import { Input, Text, Textarea, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import {
  getAllScriptPacks,
  getScriptPack,
  type Alignment,
  type DayPhaseStage,
  type LiveLogEventType,
  type LiveStateChange,
  type LiveVictoryAlignment,
  type NightRequestActionType,
} from '@clocktower/core';
import { useLiveRoomStore } from '@/store/live-room-store';
import { useGameStore } from '@/store/game-store';
import './index.scss';

const liveSupportedScriptIds = ['trouble_brewing', 'sects_and_violets'];

const alignmentOptions: { value: Alignment; label: string }[] = [
  { value: 'good', label: '善良阵营' },
  { value: 'evil', label: '邪恶阵营' },
];

const victoryOptions: { value: LiveVictoryAlignment; label: string }[] = [
  { value: 'good', label: '善良胜利' },
  { value: 'evil', label: '邪恶胜利' },
  { value: 'draw', label: '平局 / 特殊结算' },
  { value: 'unknown', label: '未记录' },
];

const nightActionTypes: { value: NightRequestActionType; label: string }[] = [
  { value: 'select_one_player', label: '选择 1 名目标' },
  { value: 'select_two_players', label: '选择 2 名目标' },
  { value: 'select_role', label: '选择角色' },
  { value: 'yes_no', label: '是 / 否' },
  { value: 'confirm_only', label: '仅确认' },
  { value: 'wait_for_result', label: '等待结果' },
];

const dayStageOptions: { value: DayPhaseStage; label: string }[] = [
  { value: 'discussion', label: '讨论阶段' },
  { value: 'nominations', label: '提名阶段' },
  { value: 'execution', label: '处决结果' },
  { value: 'closed', label: '白天结束' },
];

const storytellerPanels = [
  { key: 'overview', label: '总览' },
  { key: 'night', label: '夜晚' },
  { key: 'day', label: '白天' },
  { key: 'ending', label: '收口' },
  { key: 'logs', label: '日志' },
] as const;

const phaseLabelMap = {
  setup: '准备阶段',
  night: '夜晚阶段',
  day: '白天阶段',
  finished: '已结束',
} as const;

const statusLabelMap = {
  open: '可加入',
  locked: '已锁房',
  in_progress: '进行中',
  finished: '已结束',
} as const;

const logTypeLabelMap: Record<LiveLogEventType, string> = {
  room_created: '房间创建',
  member_joined: '成员加入',
  seat_assigned: '座位分配',
  room_locked: '锁房完成',
  identity_sent: '私发身份',
  night_phase_started: '夜晚开始',
  night_request_created: '夜间请求创建',
  night_request_submitted: '玩家提交夜间操作',
  night_request_resolved: '说书人裁定完成',
  night_result_delivered: '结果已回传',
  night_phase_completed: '夜晚结束',
  day_phase_started: '白天开始',
  day_public_state_updated: '白天公开状态更新',
  day_nomination_recorded: '记录提名',
  day_nomination_resolved: '提名结果更新',
  day_execution_recorded: '记录处决结果',
  day_phase_completed: '白天结束',
  game_finished: '对局结束',
  phase_changed: '阶段切换',
  system: '系统记录',
};

function parseStateChanges(raw: string): LiveStateChange[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [memberId, type, nextValue, ...summaryParts] = line.split('|').map((part) => part.trim());
      return {
        memberId,
        type: (type || 'status_tag') as LiveStateChange['type'],
        nextValue: nextValue === 'true' ? true : nextValue === 'false' ? false : nextValue,
        summary: summaryParts.join(' | ') || `${memberId} ${type} -> ${nextValue}`,
      };
    })
    .filter((change) => change.memberId && change.type);
}

function labelPhase(phase?: keyof typeof phaseLabelMap) {
  return phase ? phaseLabelMap[phase] ?? phase : '未开始';
}

function labelStatus(status?: keyof typeof statusLabelMap) {
  return status ? statusLabelMap[status] ?? status : '未知状态';
}

function labelDayStage(stage?: DayPhaseStage) {
  return dayStageOptions.find((item) => item.value === stage)?.label ?? '未开始';
}

function labelAlignment(alignment?: Alignment) {
  if (alignment === 'good') return '善良阵营';
  if (alignment === 'evil') return '邪恶阵营';
  return '未记录';
}

function labelNominationOutcome(outcome?: string) {
  if (outcome === 'advanced') return '已进入处决';
  if (outcome === 'rejected') return '未成立';
  return '待定';
}

function labelRequestStatus(status: string) {
  if (status === 'pending') return '待提交';
  if (status === 'submitted') return '待裁定';
  if (status === 'resolved') return '已完成';
  return status;
}

export default function LivePage() {
  const loadRooms = useLiveRoomStore((state) => state.loadRooms);
  const updateCloudEnv = useLiveRoomStore((state) => state.setCloudEnv);
  const createLiveRoom = useLiveRoomStore((state) => state.createLiveRoom);
  const joinLiveRoom = useLiveRoomStore((state) => state.joinLiveRoom);
  const selectRoom = useLiveRoomStore((state) => state.selectRoom);
  const assignMemberSeat = useLiveRoomStore((state) => state.assignMemberSeat);
  const toggleReady = useLiveRoomStore((state) => state.toggleReady);
  const lockCurrentRoom = useLiveRoomStore((state) => state.lockCurrentRoom);
  const startCurrentNight = useLiveRoomStore((state) => state.startCurrentNight);
  const finishCurrentNight = useLiveRoomStore((state) => state.finishCurrentNight);
  const updateCurrentDayState = useLiveRoomStore((state) => state.updateCurrentDayState);
  const recordCurrentNomination = useLiveRoomStore((state) => state.recordCurrentNomination);
  const resolveCurrentNomination = useLiveRoomStore((state) => state.resolveCurrentNomination);
  const recordCurrentExecution = useLiveRoomStore((state) => state.recordCurrentExecution);
  const finishCurrentDay = useLiveRoomStore((state) => state.finishCurrentDay);
  const finishCurrentGame = useLiveRoomStore((state) => state.finishCurrentGame);
  const dispatchMemberIdentity = useLiveRoomStore((state) => state.dispatchMemberIdentity);
  const createNightRequestForMember = useLiveRoomStore((state) => state.createNightRequestForMember);
  const submitVisibleNightRequest = useLiveRoomStore((state) => state.submitVisibleNightRequest);
  const resolveNightRequestForStoryteller = useLiveRoomStore((state) => state.resolveNightRequestForStoryteller);
  const rooms = useLiveRoomStore((state) => state.rooms);
  const currentUserId = useLiveRoomStore((state) => state.currentUserId);
  const cloudbase = useLiveRoomStore((state) => state.cloudbase);
  const room = useLiveRoomStore((state) => state.currentRoom());
  const myIdentity = useLiveRoomStore((state) => state.visibleIdentity());
  const myNightRequests = useLiveRoomStore((state) => state.visibleNightRequests());
  const consoleSummary = useLiveRoomStore((state) => state.nightConsoleSummary());
  const templates = useLiveRoomStore((state) => state.nightTemplates());
  const logs = useLiveRoomStore((state) => state.nightLogs());
  const publicDayTimeline = useLiveRoomStore((state) => state.publicDayTimeline());
  const finishedRooms = useLiveRoomStore((state) => state.finishedRooms());
  const importLiveReplay = useGameStore((state) => state.importLiveReplay);

  const [panel, setPanel] = useState<(typeof storytellerPanels)[number]['key']>('overview');
  const [storytellerName, setStorytellerName] = useState('说书人');
  const [joinName, setJoinName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [cloudEnv, setCloudEnv] = useState('');
  const [scriptId, setScriptId] = useState('trouble_brewing');
  const [playerCount, setPlayerCount] = useState('8');
  const [dispatchMemberId, setDispatchMemberId] = useState('');
  const [dispatchRoleId, setDispatchRoleId] = useState('');
  const [dispatchAlignment, setDispatchAlignment] = useState<Alignment>('good');
  const [requestMemberId, setRequestMemberId] = useState('');
  const [requestActionType, setRequestActionType] = useState<NightRequestActionType>('select_one_player');
  const [requestPrompt, setRequestPrompt] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [requestTemplateId, setRequestTemplateId] = useState('');
  const [submitRequestId, setSubmitRequestId] = useState('');
  const [submitTargets, setSubmitTargets] = useState('');
  const [submitRoleId, setSubmitRoleId] = useState('');
  const [submitYesNo, setSubmitYesNo] = useState<'yes' | 'no'>('yes');
  const [submitNote, setSubmitNote] = useState('');
  const [resolveRequestId, setResolveRequestId] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [deliveryText, setDeliveryText] = useState('');
  const [privateNote, setPrivateNote] = useState('');
  const [stateChanges, setStateChanges] = useState('');
  const [dayStage, setDayStage] = useState<DayPhaseStage>('discussion');
  const [daySummary, setDaySummary] = useState('');
  const [dayPublicNote, setDayPublicNote] = useState('');
  const [nomineeMemberId, setNomineeMemberId] = useState('');
  const [nominatorMemberId, setNominatorMemberId] = useState('');
  const [nominationSummary, setNominationSummary] = useState('');
  const [resolveNominationId, setResolveNominationId] = useState('');
  const [resolveNominationSummary, setResolveNominationSummary] = useState('');
  const [executionTargetId, setExecutionTargetId] = useState('');
  const [executionSummary, setExecutionSummary] = useState('');
  const [victoryAlignment, setVictoryAlignment] = useState<LiveVictoryAlignment>('good');
  const [finishReason, setFinishReason] = useState('');
  const [finishNote, setFinishNote] = useState('');

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const liveScripts = useMemo(
    () => getAllScriptPacks().filter((script) => liveSupportedScriptIds.includes(script.id)),
    [],
  );

  const currentScript = room ? getScriptPack(room.scriptId) : null;
  const currentMember = room?.members.find((member) => member.userId === currentUserId) ?? null;
  const isStoryteller = currentMember?.role === 'storyteller';
  const playerMembers = room?.members.filter((member) => member.role === 'player') ?? [];
  const alivePlayers = playerMembers.filter((member) => member.liveState.isAlive);

  const getMemberName = (memberId?: string) =>
    room?.members.find((member) => member.memberId === memberId)?.name ?? memberId ?? '未指定';

  useEffect(() => {
    if (!room?.dayState) return;
    setDayStage(room.dayState.stage);
    setDaySummary(room.dayState.summary);
    setNomineeMemberId(room.dayState.currentNomination?.nomineeMemberId ?? '');
    setExecutionTargetId(room.dayState.execution?.executedMemberId ?? '');
    setNominationSummary(room.dayState.currentNomination?.summary ?? '');
    setResolveNominationId(room.dayState.currentNomination?.nominationId ?? '');
    setResolveNominationSummary(room.dayState.currentNomination?.outcomeSummary ?? '');
    setExecutionSummary(room.dayState.execution?.summary ?? '');
  }, [room?.dayState]);

  useEffect(() => {
    if (room?.dayState?.currentNomination?.outcome === 'advanced' && !executionTargetId) {
      setExecutionTargetId(room.dayState.currentNomination.nomineeMemberId);
    }
    if (room?.dayState?.currentNomination?.outcome === 'advanced' && !executionSummary.trim()) {
      setExecutionSummary(`${getMemberName(room.dayState.currentNomination.nomineeMemberId)} 被处决`);
    }
  }, [
    executionSummary,
    executionTargetId,
    room?.dayState?.currentNomination?.nominationId,
    room?.dayState?.currentNomination?.outcome,
  ]);

  useEffect(() => {
    if (!room) return;
    if (room.currentPhase === 'night') setPanel('night');
    if (room.currentPhase === 'day') setPanel('day');
    if (room.currentPhase === 'finished') setPanel('ending');
  }, [room?.currentPhase, room?.roomId]);

  const toast = (title: string, icon: 'success' | 'none' = 'none') => Taro.showToast({ title, icon });

  const run = (fn: () => void, success: string, fail: string) => {
    try {
      fn();
      toast(success, 'success');
    } catch (error) {
      toast(error instanceof Error ? error.message : fail);
    }
  };

  const openReplay = (targetRoom = room) => {
    if (!targetRoom) return;
    importLiveReplay(targetRoom, 'storyteller');
    Taro.switchTab({ url: '/pages/game/index' });
  };

  const leaveRoom = () => {
    selectRoom(null);
    toast('已返回房间列表', 'success');
  };

  const renderChipList = (items: { key: string; label: string; active: boolean; onClick: () => void }[]) => (
    <View className="chip-grid">
      {items.map((item) => (
        <View key={item.key} className={`chip ${item.active ? 'active' : ''}`} onClick={item.onClick}>
          <Text>{item.label}</Text>
        </View>
      ))}
    </View>
  );

  if (!room) {
    return (
      <View className="page-scroll">
        <View className="container live-shell">
          <View className="hero-card">
            <Text className="title">实战房间</Text>
            <Text className="subtitle">
              线下聊天，线上执行。这里负责建房、发身份、夜晚操作、白天状态同步和整局收口。
            </Text>
          </View>

          <View className="quick-grid">
            <View className="panel quick-panel">
              <Text className="section-title">创建房间</Text>
              <Input
                className="input"
                value={storytellerName}
                onInput={(e) => setStorytellerName(e.detail.value)}
                placeholder="说书人名字"
              />
              <Input
                className="input"
                value={playerCount}
                onInput={(e) => setPlayerCount(e.detail.value)}
                placeholder="人数，例如 8"
              />
              <View className="script-list">
                {liveScripts.map((script) => (
                  <View
                    key={script.id}
                    className={`script-card ${scriptId === script.id ? 'active' : ''}`}
                    onClick={() => setScriptId(script.id)}
                  >
                    <Text className="script-name">{script.zhName}</Text>
                    <Text className="script-summary">{script.summary}</Text>
                  </View>
                ))}
              </View>
              <View
                className="btn primary full"
                onClick={() => {
                  if (!storytellerName.trim()) {
                    toast('请先输入说书人名字');
                    return;
                  }
                  createLiveRoom(storytellerName.trim(), scriptId, Number(playerCount) || 8, 'live');
                  toast('房间已创建', 'success');
                }}
              >
                <Text>创建实战房间</Text>
              </View>
            </View>

            <View className="panel quick-panel">
              <Text className="section-title">加入房间</Text>
              <Input
                className="input"
                value={inviteCode}
                onInput={(e) => setInviteCode(e.detail.value)}
                placeholder="邀请码"
              />
              <Input
                className="input"
                value={joinName}
                onInput={(e) => setJoinName(e.detail.value)}
                placeholder="玩家名字"
              />
              <View
                className="btn secondary full"
                onClick={() => run(
                  () => joinLiveRoom(inviteCode.trim().toUpperCase(), joinName.trim()),
                  '加入成功',
                  '加入失败',
                )}
              >
                <Text>加入实战房间</Text>
              </View>

              <Text className="section-title section-gap">云开发接入</Text>
              <Text className="hint">
                当前环境：
                {cloudbase.provider === 'cloudbase'
                  ? ` CloudBase ${cloudbase.envId}`
                  : ' 本地 mock 适配层'}
              </Text>
              <Input
                className="input"
                value={cloudEnv}
                onInput={(e) => setCloudEnv(e.detail.value)}
                placeholder="可选：CloudBase envId"
              />
              <View
                className="btn secondary full"
                onClick={() => {
                  updateCloudEnv(cloudEnv.trim());
                  toast('云环境已更新', 'success');
                }}
              >
                <Text>保存云环境</Text>
              </View>
            </View>
          </View>

          {rooms.filter((entry) => entry.status !== 'finished').length > 0 && (
            <View className="panel">
              <Text className="section-title">最近房间</Text>
              {rooms
                .filter((entry) => entry.status !== 'finished')
                .map((entry) => (
                  <View key={entry.roomId} className="room-row" onClick={() => selectRoom(entry.roomId)}>
                    <View>
                      <Text className="room-title">{entry.scriptName ?? entry.scriptId}</Text>
                      <Text className="room-meta">
                        {entry.inviteCode} · {labelStatus(entry.status)} · {entry.members.length} 人
                      </Text>
                    </View>
                    <Text className="link-text">进入</Text>
                  </View>
                ))}
            </View>
          )}

          {finishedRooms.length > 0 && (
            <View className="panel">
              <Text className="section-title">已结束对局</Text>
              {finishedRooms.map((entry) => (
                <View key={entry.roomId} className="room-row">
                  <View onClick={() => selectRoom(entry.roomId)}>
                    <Text className="room-title">{entry.scriptName ?? entry.scriptId}</Text>
                    <Text className="room-meta">
                      {entry.inviteCode} · 已结束 · 第 {entry.currentDay} 天 / 第 {entry.currentNight} 夜
                    </Text>
                  </View>
                  <View className="mini-btn secondary" onClick={() => openReplay(entry)}>
                    <Text>导入复盘</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }

  const visibleLogs = logs.filter((log) => {
    if (log.visibility === 'storyteller' && !isStoryteller) return false;
    if (log.visibility === 'private' && log.memberId !== currentMember?.memberId && !isStoryteller) return false;
    return true;
  });

  return (
    <View className="page-scroll">
      <View className="container live-shell">
        <View className="live-topbar">
          <View className="topbar-main">
            <Text className="eyebrow">邀请码</Text>
            <Text className="topbar-code">{room.inviteCode}</Text>
            <Text className="room-meta-line">
              {room.scriptName ?? room.scriptId} · {labelStatus(room.status)} · {labelPhase(room.currentPhase)}
            </Text>
          </View>
          <View className="topbar-actions">
            <View className="mini-btn secondary" onClick={leaveRoom}>
              <Text>返回列表</Text>
            </View>
            <View className="mini-btn secondary" onClick={leaveRoom}>
              <Text>退出房间</Text>
            </View>
          </View>
        </View>

        <View className="panel public-status-panel">
          <Text className="section-title">当前进度</Text>
          <View className="summary-grid">
            <View className="summary-cell">
              <Text className="summary-value">第 {room.currentDay} 天</Text>
              <Text className="summary-label">白天进度</Text>
            </View>
            <View className="summary-cell">
              <Text className="summary-value">第 {room.currentNight} 夜</Text>
              <Text className="summary-label">夜晚进度</Text>
            </View>
            <View className="summary-cell">
              <Text className="summary-value">{consoleSummary.phaseLabel || labelPhase(room.currentPhase)}</Text>
              <Text className="summary-label">当前阶段</Text>
            </View>
            <View className="summary-cell">
              <Text className="summary-value">{consoleSummary.stageLabel || labelDayStage(room.dayState?.stage)}</Text>
              <Text className="summary-label">当前子阶段</Text>
            </View>
          </View>
          <Text className="hint">live 模式只展示规则允许公开的信息，不显示训练/复盘里的策略建议。</Text>
        </View>

        {room.currentPhase === 'day' && room.dayState && (
          <View className="panel">
            <Text className="section-title">白天公开状态</Text>
            <Text className="identity-title">{room.dayState.summary}</Text>
            {room.dayState.publicNotes.map((note, index) => (
              <Text key={`${note}-${index}`} className="hint">· {note}</Text>
            ))}
            {room.dayState.currentNomination && (
              <Text className="hint">当前提名：{getMemberName(room.dayState.currentNomination.nomineeMemberId)}</Text>
            )}
            {room.dayState.execution && (
              <Text className="hint">
                当前处决：
                {room.dayState.execution.executedMemberId
                  ? getMemberName(room.dayState.execution.executedMemberId)
                  : '今天无人处决'}
              </Text>
            )}
          </View>
        )}

        {!isStoryteller && (
          <View className="panel">
            <Text className="section-title">玩家面板</Text>
            {myIdentity ? (
              <>
                <Text className="identity-title">{myIdentity.roleName}</Text>
                <Text className="identity-meta">{labelAlignment(myIdentity.alignment)}</Text>
                <Text className="identity-ability">{myIdentity.ability}</Text>
              </>
            ) : (
              <Text className="hint">说书人还没有发放身份，请稍候。</Text>
            )}

            {room.currentPhase === 'night' && myNightRequests.some((request) => request.status === 'pending') && (
              <>
                <Text className="section-title section-gap">你的夜晚操作</Text>
                {renderChipList(myNightRequests
                  .filter((request) => request.status === 'pending')
                  .map((request) => ({
                    key: request.requestId,
                    label: request.prompt,
                    active: submitRequestId === request.requestId,
                    onClick: () => setSubmitRequestId(request.requestId),
                  })))}
                <Input
                  className="input"
                  value={submitTargets}
                  onInput={(e) => setSubmitTargets(e.detail.value)}
                  placeholder="可选：目标 memberId，多个用空格分隔"
                />
                <Input
                  className="input"
                  value={submitRoleId}
                  onInput={(e) => setSubmitRoleId(e.detail.value)}
                  placeholder="可选：若要选角色，请填写 roleId"
                />
                {renderChipList([
                  { key: 'yes', label: '是', active: submitYesNo === 'yes', onClick: () => setSubmitYesNo('yes') },
                  { key: 'no', label: '否', active: submitYesNo === 'no', onClick: () => setSubmitYesNo('no') },
                ])}
                <Textarea
                  className="textarea"
                  value={submitNote}
                  onInput={(e) => setSubmitNote(e.detail.value)}
                  placeholder="可选：补充备注"
                  maxlength={300}
                />
                <View
                  className="btn secondary full"
                  onClick={() => run(
                    () => submitVisibleNightRequest(submitRequestId, {
                      selectedPlayerIds: submitTargets.split(/[\s,，]+/).map((item) => item.trim()).filter(Boolean),
                      selectedRoleId: submitRoleId || undefined,
                      yesNo: submitYesNo === 'yes',
                      confirmed: true,
                      note: submitNote || undefined,
                    }),
                    '夜晚操作已提交',
                    '提交失败',
                  )}
                >
                  <Text>提交夜晚操作</Text>
                </View>
              </>
            )}

            {myNightRequests.map((request) => (
              <View key={request.requestId} className="request-card">
                <Text className="request-title">{request.prompt}</Text>
                <Text className="request-meta">状态：{labelRequestStatus(request.status)}</Text>
                {request.resultDelivery && (
                  <Text className="identity-ability">回传结果：{request.resultDelivery.message}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {isStoryteller && (
          <>
            <View className="panel">
              <Text className="section-title">说书人工作台</Text>
              <Text className="hint">{consoleSummary.stateSummary}</Text>
              {renderChipList(storytellerPanels.map((item) => ({
                key: item.key,
                label: item.label,
                active: panel === item.key,
                onClick: () => setPanel(item.key),
              })))}
            </View>

            {panel === 'overview' && (
              <>
                <View className="panel">
                  <Text className="section-title">总览</Text>
                  <View className="summary-grid">
                    <View className="summary-cell">
                      <Text className="summary-value">{alivePlayers.length}</Text>
                      <Text className="summary-label">存活玩家</Text>
                    </View>
                    <View className="summary-cell">
                      <Text className="summary-value">{consoleSummary.pending + consoleSummary.submitted}</Text>
                      <Text className="summary-label">待处理项</Text>
                    </View>
                    <View className="summary-cell">
                      <Text className="summary-value">{consoleSummary.nominationCount}</Text>
                      <Text className="summary-label">今日提名数</Text>
                    </View>
                    <View className="summary-cell">
                      <Text className="summary-value">{room.outcome ? '已结束' : '进行中'}</Text>
                      <Text className="summary-label">对局状态</Text>
                    </View>
                  </View>
                  <View className="chip-grid">
                    <View
                      className="mini-btn"
                      onClick={() => run(() => startCurrentNight(), '已进入新一夜', '进入夜晚失败')}
                    >
                      <Text>开始新一夜</Text>
                    </View>
                    {room.currentPhase === 'night' && (
                      <View
                        className="mini-btn secondary"
                        onClick={() => {
                          const result = finishCurrentNight();
                          if (result) toast(result.message, result.ok ? 'success' : 'none');
                        }}
                      >
                        <Text>结束本夜</Text>
                      </View>
                    )}
                    {room.currentPhase === 'day' && (
                      <View
                        className="mini-btn secondary"
                        onClick={() => run(() => finishCurrentDay(), '白天已结束', '结束白天失败')}
                      >
                        <Text>结束白天</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View className="panel">
                  <Text className="section-title">玩家状态总览</Text>
                  {room.members.map((member) => (
                    <View key={member.memberId} className="member-row">
                      <View className="member-main">
                        <Text className="member-name">{member.name}</Text>
                        <Text className="member-meta">
                          {member.role === 'storyteller'
                            ? '说书人'
                            : `玩家 · ${member.seatNumber ? `${member.seatNumber} 号位` : '未排座位'} · ${member.ready ? '已准备' : '未准备'} · ${member.liveState.isAlive ? '存活' : '死亡'}`}
                        </Text>
                        {member.role === 'player' && (
                          <Text className="hint">
                            状态：
                            {[
                              member.liveState.poisoned ? '中毒' : null,
                              member.liveState.disabled ? '失能' : null,
                              ...member.liveState.statusTags,
                            ]
                              .filter(Boolean)
                              .join(' / ') || '无'}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {panel === 'night' && (
              <>
                {currentScript && room.status !== 'finished' && (
                  <View className="panel">
                    <Text className="section-title">身份私发</Text>
                    {renderChipList(playerMembers.map((member) => ({
                      key: member.memberId,
                      label: member.name,
                      active: dispatchMemberId === member.memberId,
                      onClick: () => setDispatchMemberId(member.memberId),
                    })))}
                    {renderChipList(alignmentOptions.map((option) => ({
                      key: option.value,
                      label: option.label,
                      active: dispatchAlignment === option.value,
                      onClick: () => setDispatchAlignment(option.value),
                    })))}
                    <View className="script-list">
                      {currentScript.roles.map((role) => (
                        <View
                          key={role.id}
                          className={`script-card compact ${dispatchRoleId === role.id ? 'active' : ''}`}
                          onClick={() => setDispatchRoleId(role.id)}
                        >
                          <Text className="script-name">{role.zhName}</Text>
                          <Text className="script-summary">{role.ability}</Text>
                        </View>
                      ))}
                    </View>
                    <View
                      className="btn secondary full"
                      onClick={() => run(
                        () => dispatchMemberIdentity(dispatchMemberId, dispatchRoleId, dispatchAlignment),
                        '身份已私发',
                        '发放失败',
                      )}
                    >
                      <Text>私发身份</Text>
                    </View>
                  </View>
                )}

                {room.currentPhase === 'night' && room.status !== 'finished' && (
                  <>
                    <View className="panel">
                      <Text className="section-title">夜晚请求模板</Text>
                      {renderChipList(templates.map((template) => ({
                        key: template.templateId,
                        label: template.label,
                        active: requestTemplateId === template.templateId,
                        onClick: () => {
                          setRequestTemplateId(template.templateId);
                          setRequestActionType(template.actionType);
                          setRequestPrompt(template.prompt);
                          setRequestDescription(template.description ?? '');
                        },
                      })))}
                    </View>

                    <View className="panel">
                      <Text className="section-title">创建夜晚请求</Text>
                      {renderChipList(playerMembers.map((member) => ({
                        key: member.memberId,
                        label: member.name,
                        active: requestMemberId === member.memberId,
                        onClick: () => setRequestMemberId(member.memberId),
                      })))}
                      {renderChipList(nightActionTypes.map((type) => ({
                        key: type.value,
                        label: type.label,
                        active: requestActionType === type.value,
                        onClick: () => setRequestActionType(type.value),
                      })))}
                      <Input className="input" value={requestPrompt} onInput={(e) => setRequestPrompt(e.detail.value)} placeholder="请求标题" />
                      <Textarea className="textarea" value={requestDescription} onInput={(e) => setRequestDescription(e.detail.value)} placeholder="可选：补充说明或限制" maxlength={300} />
                      <View
                        className="btn secondary full"
                        onClick={() => run(
                          () => createNightRequestForMember(
                            requestMemberId,
                            requestActionType,
                            requestPrompt.trim(),
                            requestDescription.trim() || undefined,
                            playerMembers.map((member) => member.memberId),
                            currentScript?.roles.map((role) => role.id),
                            requestActionType === 'select_two_players' ? 2 : requestActionType === 'select_one_player' ? 1 : undefined,
                            requestActionType === 'select_two_players' ? 2 : requestActionType === 'select_one_player' ? 1 : undefined,
                            requestTemplateId || undefined,
                          ),
                          '夜晚请求已创建',
                          '创建失败',
                        )}
                      >
                        <Text>创建夜晚请求</Text>
                      </View>
                    </View>

                    <View className="panel">
                      <Text className="section-title">说书人裁定</Text>
                      {room.nightRequests
                        .filter((request) => request.nightNumber === room.currentNight)
                        .map((request) => (
                          <View key={request.requestId} className="request-card">
                            <Text className="request-title">{request.actorPlayerName} · {request.prompt}</Text>
                            <Text className="request-meta">状态：{labelRequestStatus(request.status)}</Text>
                            {request.submittedPayload && (
                              <Text className="hint">
                                已提交：目标 {request.submittedPayload.selectedPlayerIds?.join('、') || '无'} / 角色 {request.submittedPayload.selectedRoleId || '无'}
                              </Text>
                            )}
                          </View>
                        ))}

                      {room.nightRequests.some((request) => request.status === 'submitted' && request.nightNumber === room.currentNight) && (
                        <>
                          {renderChipList(room.nightRequests
                            .filter((request) => request.status === 'submitted' && request.nightNumber === room.currentNight)
                            .map((request) => ({
                              key: request.requestId,
                              label: request.actorPlayerName,
                              active: resolveRequestId === request.requestId,
                              onClick: () => setResolveRequestId(request.requestId),
                            })))}
                          <Input className="input" value={resolutionText} onInput={(e) => setResolutionText(e.detail.value)} placeholder="裁定结果" />
                          <Input className="input" value={deliveryText} onInput={(e) => setDeliveryText(e.detail.value)} placeholder="回传给玩家的结果文案" />
                          <Textarea className="textarea" value={privateNote} onInput={(e) => setPrivateNote(e.detail.value)} placeholder="私密备注（仅说书人可见）" maxlength={300} />
                          <Textarea className="textarea" value={stateChanges} onInput={(e) => setStateChanges(e.detail.value)} placeholder="状态联动：memberId|type|nextValue|summary" maxlength={500} />
                          <View
                            className="btn secondary full"
                            onClick={() => run(
                              () => resolveNightRequestForStoryteller(
                                resolveRequestId,
                                resolutionText.trim(),
                                deliveryText.trim(),
                                privateNote.trim() || undefined,
                                parseStateChanges(stateChanges),
                              ),
                              '已裁定并回传',
                              '裁定失败',
                            )}
                          >
                            <Text>裁定并回传</Text>
                          </View>
                        </>
                      )}
                    </View>
                  </>
                )}
              </>
            )}

            {panel === 'day' && room.currentPhase === 'day' && room.status !== 'finished' && (
              <>
                <View className="panel">
                  <Text className="section-title">白天公开状态同步</Text>
                  {renderChipList(dayStageOptions.map((option) => ({
                    key: option.value,
                    label: option.label,
                    active: dayStage === option.value,
                    onClick: () => setDayStage(option.value),
                  })))}
                  <Textarea className="textarea" value={daySummary} onInput={(e) => setDaySummary(e.detail.value)} placeholder="填写当前白天公开摘要" maxlength={220} />
                  <Textarea className="textarea" value={dayPublicNote} onInput={(e) => setDayPublicNote(e.detail.value)} placeholder="可选：公开备注" maxlength={220} />
                  <View
                    className="btn secondary full"
                    onClick={() => run(
                      () => updateCurrentDayState(dayStage, daySummary.trim(), dayPublicNote.trim() || undefined),
                      '白天状态已更新',
                      '更新失败',
                    )}
                  >
                    <Text>更新白天公开状态</Text>
                  </View>
                </View>

                <View className="panel">
                  <Text className="section-title">提名与处决</Text>
                  {renderChipList(alivePlayers.map((member) => ({
                    key: member.memberId,
                    label: member.name,
                    active: nomineeMemberId === member.memberId,
                    onClick: () => setNomineeMemberId(member.memberId),
                  })))}
                  <Input className="input" value={nominatorMemberId} onInput={(e) => setNominatorMemberId(e.detail.value)} placeholder="可选：提名人 memberId" />
                  <Input className="input" value={nominationSummary} onInput={(e) => setNominationSummary(e.detail.value)} placeholder="提名摘要" />
                  <View
                    className="btn secondary full"
                    onClick={() => run(
                      () => recordCurrentNomination(nomineeMemberId, nominationSummary.trim(), nominatorMemberId || undefined),
                      '提名记录已保存',
                      '提名记录失败',
                    )}
                  >
                    <Text>记录提名</Text>
                  </View>

                  {room.dayState?.nominationHistory?.length > 0 && (
                    <>
                      {renderChipList(room.dayState.nominationHistory.map((record) => ({
                        key: record.nominationId,
                        label: `${getMemberName(record.nomineeMemberId)} · ${labelNominationOutcome(record.outcome)}`,
                        active: resolveNominationId === record.nominationId,
                        onClick: () => {
                          setResolveNominationId(record.nominationId);
                          setResolveNominationSummary(record.outcomeSummary ?? record.summary);
                          setExecutionTargetId(record.nomineeMemberId);
                        },
                      })))}
                      <Input className="input" value={resolveNominationSummary} onInput={(e) => setResolveNominationSummary(e.detail.value)} placeholder="提名结果公开摘要" />
                      <View className="chip-grid">
                        <View
                          className="mini-btn secondary"
                          onClick={() => run(
                            () => resolveCurrentNomination(resolveNominationId, false, resolveNominationSummary.trim() || undefined),
                            '提名结果已记为未成立',
                            '更新提名失败',
                          )}
                        >
                          <Text>记为未成立</Text>
                        </View>
                        <View
                          className="mini-btn secondary"
                          onClick={() => run(
                            () => resolveCurrentNomination(resolveNominationId, true, resolveNominationSummary.trim() || undefined),
                            '提名结果已推进到处决',
                            '更新提名失败',
                          )}
                        >
                          <Text>推进到处决</Text>
                        </View>
                      </View>
                    </>
                  )}

                  {renderChipList(alivePlayers.map((member) => ({
                    key: member.memberId,
                    label: member.name,
                    active: executionTargetId === member.memberId,
                    onClick: () => setExecutionTargetId(member.memberId),
                  })))}
                  <Input className="input" value={executionSummary} onInput={(e) => setExecutionSummary(e.detail.value)} placeholder="处决结果摘要" />
                  <View
                    className="btn secondary full"
                    onClick={() => run(
                      () => recordCurrentExecution(executionSummary.trim(), executionTargetId || undefined),
                      '处决结果已保存',
                      '处决记录失败',
                    )}
                  >
                    <Text>记录处决结果</Text>
                  </View>
                  <View
                    className="mini-btn secondary"
                    onClick={() => run(
                      () => recordCurrentExecution(executionSummary.trim() || '今天无人处决', undefined),
                      '已记录无人处决',
                      '记录失败',
                    )}
                  >
                    <Text>记录今天无人处决</Text>
                  </View>
                </View>
              </>
            )}

            {panel === 'ending' && (
              <>
                {room.status !== 'finished' && (
                  <View className="panel">
                    <Text className="section-title">结束对局</Text>
                    {renderChipList(victoryOptions.map((option) => ({
                      key: option.value,
                      label: option.label,
                      active: victoryAlignment === option.value,
                      onClick: () => setVictoryAlignment(option.value),
                    })))}
                    <Input className="input" value={finishReason} onInput={(e) => setFinishReason(e.detail.value)} placeholder="结束原因，例如：恶魔被处决 / 善良团灭" />
                    <Textarea className="textarea" value={finishNote} onInput={(e) => setFinishNote(e.detail.value)} placeholder="可选：归档备注" maxlength={300} />
                    <View
                      className="btn secondary full"
                      onClick={() => run(
                        () => finishCurrentGame(victoryAlignment, finishReason.trim(), finishNote.trim() || undefined),
                        '对局已结束',
                        '结束对局失败',
                      )}
                    >
                      <Text>结束当前对局</Text>
                    </View>
                  </View>
                )}

                {room.status === 'finished' && room.outcome && (
                  <View className="panel">
                    <Text className="section-title">已结束对局</Text>
                    <Text className="identity-title">
                      {victoryOptions.find((item) => item.value === room.outcome?.victoryAlignment)?.label ?? room.outcome.victoryAlignment}
                    </Text>
                    <Text className="identity-ability">{room.outcome.reason}</Text>
                    {room.outcome.note && <Text className="hint">{room.outcome.note}</Text>}
                    {room.archiveSeed && (
                      <Text className="hint">
                        归档种子：{room.archiveSeed.archiveId} · 事件数 {room.archiveSeed.eventCount} · 公开事件 {room.archiveSeed.publicEventCount}
                      </Text>
                    )}
                    {room.archiveSeed?.finalSummary && <Text className="hint">归档摘要：{room.archiveSeed.finalSummary}</Text>}
                    <View className="btn secondary full" onClick={() => openReplay(room)}>
                      <Text>导入训练 / 复盘</Text>
                    </View>
                  </View>
                )}
              </>
            )}

            {panel === 'logs' && (
              <View className="panel">
                <Text className="section-title">流程日志</Text>
                {visibleLogs.slice().reverse().map((log) => (
                  <View key={log.logId} className="log-row">
                    <Text className="log-type">{logTypeLabelMap[log.eventType] ?? log.eventType}</Text>
                    <Text className="log-text">{log.summary}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}
