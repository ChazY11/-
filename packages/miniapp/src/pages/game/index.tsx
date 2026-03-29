import { useEffect, useMemo, useState } from 'react';
import { View, Text, Input, Textarea, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useGameStore } from '@/store/game-store';
import { getAllScriptPacks, getScriptPack, parsePlayerNames } from '@clocktower/core';
import type { EventType, Game, GameMode, Player, SuspicionLevel } from '@clocktower/core';
import './index.scss';

const phaseLabels: Record<string, string> = {
  setup: '准备阶段',
  night: '夜晚',
  day: '白天',
  finished: '已结束',
};

const modeConfig: Record<GameMode, { label: string; hint: string }> = {
  good: { label: '正派视角', hint: '只显示公开信息，适合普通玩家记录局势。' },
  evil: { label: '反派视角', hint: '保留公开信息，方便反派阵营协同推演。' },
  storyteller: { label: '说书人视角', hint: '可见真实身份、私密备注与状态，用于主持整局。' },
};

const suspicionOptions: { value: SuspicionLevel; label: string }[] = [
  { value: 'trusted', label: '可信' },
  { value: 'neutral', label: '中立' },
  { value: 'suspicious', label: '可疑' },
  { value: 'evil', label: '偏邪' },
  { value: 'unknown', label: '未知' },
];

const storytellerStateFields: { key: keyof Player['state']; label: string }[] = [
  { key: 'poisoned', label: '中毒' },
  { key: 'drunk', label: '醉酒' },
  { key: 'mad', label: '发疯' },
  { key: 'protected', label: '保护' },
  { key: 'roleChanged', label: '换角' },
  { key: 'alignmentChanged', label: '换边' },
];

export default function GamePage() {
  const {
    games,
    currentGameId,
    loadGames,
    selectGame,
    deleteGame,
    advancePhase,
    newGameWithPlayers,
    importDemoGame,
    addPlayer,
    updatePlayer,
    removePlayer,
    setPlayerSuspicion,
    assignRole,
    setPlayerState,
    addNightAction,
    addEvent,
  } = useGameStore();
  const game = useGameStore((s) => s.games.find((entry) => entry.id === s.currentGameId));
  const [showCreate, setShowCreate] = useState(false);
  const [gameName, setGameName] = useState('');
  const [scriptId, setScriptId] = useState('trouble_brewing');
  const [mode, setMode] = useState<GameMode>('good');
  const [playerText, setPlayerText] = useState('');
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showNightPanel, setShowNightPanel] = useState(false);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const scripts = getAllScriptPacks();
  const scriptPack = game ? getScriptPack(game.scriptId) : null;
  const editingPlayer = game?.players.find((player) => player.id === editingPlayerId) ?? null;
  const parsedPlayers = useMemo(() => parsePlayerNames(playerText), [playerText]);

  const handleCreate = () => {
    if (!gameName.trim()) {
      Taro.showToast({ title: '请输入对局名称', icon: 'none' });
      return;
    }
    if (parsedPlayers.duplicates.length > 0) {
      Taro.showToast({ title: '玩家名单有重复名字', icon: 'none' });
      return;
    }
    newGameWithPlayers(gameName.trim(), scriptId, parsedPlayers.names, undefined, mode);
    setShowCreate(false);
    setGameName('');
    setPlayerText('');
    setEditingPlayerId(null);
  };

  const handleQuickAddPlayer = () => {
    if (!newPlayerName.trim()) return;
    addPlayer(newPlayerName.trim());
    setNewPlayerName('');
  };

  const confirmDeleteGame = (id: string, name: string) => {
    Taro.showModal({
      title: '确认删除对局',
      content: `确定删除「${name}」吗？`,
      success: (res) => {
        if (res.confirm) deleteGame(id);
      },
    });
  };

  if (showCreate) {
    return (
      <View className="page-scroll">
        <View className="container">
          <Text className="title">新建对局</Text>
          <Text className="subtitle">沿用网页端成熟的建局流程，支持批量导入玩家。</Text>

          <View className="panel">
            <Text className="label">对局名称</Text>
            <Input className="input" value={gameName} onInput={(e) => setGameName(e.detail.value)} placeholder="例如: 周五晚场" />

            <Text className="label">模式</Text>
            <View className="chip-grid">
              {(['good', 'evil', 'storyteller'] as GameMode[]).map((value) => (
                <View key={value} className={`chip ${mode === value ? 'active' : ''}`} onClick={() => setMode(value)}>
                  <Text>{modeConfig[value].label}</Text>
                </View>
              ))}
            </View>
            <Text className="hint">{modeConfig[mode].hint}</Text>

            <Text className="label">脚本</Text>
            <View className="script-list">
              {scripts.map((script) => (
                <View key={script.id} className={`script-card ${scriptId === script.id ? 'active' : ''}`} onClick={() => setScriptId(script.id)}>
                  <Text className="script-name">{script.zhName}</Text>
                  <Text className="script-summary">{script.summary}</Text>
                </View>
              ))}
            </View>

            <Text className="label">批量导入玩家</Text>
            <Textarea
              className="textarea"
              value={playerText}
              onInput={(e) => setPlayerText(e.detail.value)}
              maxlength={500}
              placeholder="支持换行、空格、逗号分隔"
            />
            <Text className="hint">已识别 {parsedPlayers.names.length} 名玩家</Text>
            {parsedPlayers.duplicates.length > 0 && (
              <Text className="warning-text">重复玩家: {parsedPlayers.duplicates.join('、')}</Text>
            )}
          </View>

          <View className="btn-row">
            <View className="btn primary" onClick={handleCreate}><Text>创建对局</Text></View>
            <View className="btn secondary" onClick={() => setShowCreate(false)}><Text>取消</Text></View>
          </View>
        </View>
      </View>
    );
  }

  if (!game || !scriptPack) {
    const recent = [...games].sort((a, b) => (b.lastActiveAt ?? b.updatedAt) - (a.lastActiveAt ?? a.updatedAt))[0];

    return (
      <View className="page-scroll">
        <View className="container">
          <Text className="title">染钟楼逻辑助手</Text>
          <Text className="subtitle">首页 / 对局列表。这里承接旧网页版本的建局与续局入口。</Text>

          <View className="recent-card" onClick={() => Taro.navigateTo({ url: '/pages/live/index' })}>
            <Text className="recent-label">实战房间模式</Text>
            <Text className="recent-title">进入微信小程序半联机执行房间</Text>
            <Text className="recent-meta">live 模式只负责建房、发身份、流程执行与状态同步，不向玩家端开放策略建议。</Text>
          </View>

          {recent && (
            <View className="recent-card" onClick={() => selectGame(recent.id)}>
              <Text className="recent-label">继续最近一局</Text>
              <Text className="recent-title">{recent.name}</Text>
              <Text className="recent-meta">{getScriptPack(recent.scriptId)?.zhName ?? recent.scriptId} · {recent.players.length} 人 · {phaseLabels[recent.currentPhase]}</Text>
            </View>
          )}

          <View className="panel">
            <View className="btn primary full" onClick={() => setShowCreate(true)}><Text>新建对局</Text></View>
            <View className="btn secondary full" onClick={() => importDemoGame()}><Text>导入演示对局</Text></View>
          </View>

          <View className="guide-list">
            <View className="guide-card"><Text className="guide-step">1</Text><View className="guide-main"><Text className="guide-title">创建对局</Text><Text className="guide-desc">选择脚本、模式，并一次性导入整桌玩家。</Text></View></View>
            <View className="guide-card"><Text className="guide-step">2</Text><View className="guide-main"><Text className="guide-title">记录事件</Text><Text className="guide-desc">记录报身份、提名、处决、夜间行动和备注。</Text></View></View>
            <View className="guide-card"><Text className="guide-step">3</Text><View className="guide-main"><Text className="guide-title">查看逻辑与世界线</Text><Text className="guide-desc">复用网页版核心校验与世界线算法做推理支持。</Text></View></View>
          </View>

          <View className="section-header">
            <Text className="section-title">已有对局</Text>
            <Text className="section-meta">{games.length} 局</Text>
          </View>

          {games.length === 0 ? (
            <View className="empty-card">
              <Text className="empty-title">还没有对局</Text>
              <Text className="empty-desc">先创建一局，或导入演示对局体验完整流程。</Text>
            </View>
          ) : (
            <View className="list-block">
              {games.map((entry) => (
                <View key={entry.id} className={`list-card ${entry.id === currentGameId ? 'active' : ''}`}>
                  <View className="list-main" onClick={() => selectGame(entry.id)}>
                    <Text className="list-title">{entry.name}</Text>
                    <Text className="list-meta">{getScriptPack(entry.scriptId)?.zhName ?? entry.scriptId} · {entry.players.length} 人 · {phaseLabels[entry.currentPhase]} · {modeConfig[entry.mode].label}</Text>
                  </View>
                  <View className="delete-link" onClick={() => confirmDeleteGame(entry.id, entry.name)}><Text>删除</Text></View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }

  const aliveCount = game.players.filter((player) => player.isAlive).length;

  return (
    <View className="page-scroll">
      <View className="container">
        <View className="header-row">
          <View onClick={() => selectGame(null)}><Text className="back-link">返回对局列表</Text></View>
          <View className="phase-badge"><Text>{phaseLabels[game.currentPhase]}{game.currentPhase === 'night' ? ` ${game.currentNight}` : ''}{game.currentPhase === 'day' ? ` ${game.currentDay}` : ''}</Text></View>
        </View>

        <Text className="game-title">{game.name}</Text>
        <Text className="game-meta">{scriptPack.zhName} · {modeConfig[game.mode].label} · 存活 {aliveCount}/{game.players.length} · 事件 {game.events.length}</Text>

        <View className={`mode-card ${game.mode === 'storyteller' ? 'storyteller-card' : ''}`}>
          <Text className="mode-title">{modeConfig[game.mode].label}</Text>
          <Text className="mode-hint">{modeConfig[game.mode].hint}</Text>
          {game.mode === 'storyteller' && (
            <Text className="storyteller-tip">已进入说书人控局模式。下方玩家卡支持直接切状态、看真实角色和维护私密备注。</Text>
          )}
        </View>

        <View className="status-strip">
          <Text className="status-line">当前阶段: {phaseLabels[game.currentPhase]}</Text>
          <Text className="status-line">当前轮次: 第 {Math.max(game.currentDay, 1)} 天 / 第 {Math.max(game.currentNight, 1)} 夜</Text>
        </View>

        {game.currentPhase !== 'finished' && (
          <View className="btn primary full" onClick={advancePhase}><Text>{game.currentPhase === 'setup' ? '进入首夜' : game.currentPhase === 'night' ? '进入白天' : '进入夜晚'}</Text></View>
        )}

        {game.mode === 'storyteller' && (
          <View className="panel storyteller-panel">
            <View className="night-panel-header">
              <View>
                <Text className="section-title">说书人夜间流程</Text>
                <Text className="night-hint">把夜晚行动、影响状态和死亡结果顺手记录进当前对局。</Text>
              </View>
              <View className="btn secondary compact-btn" onClick={() => setShowNightPanel(!showNightPanel)}>
                <Text>{showNightPanel ? '收起' : '进入面板'}</Text>
              </View>
            </View>
            {showNightPanel && (
              <NightFlowPanel
                game={game}
                scriptId={game.scriptId}
                onAddNightAction={addNightAction}
                onAddEvent={addEvent}
                onSetPlayerState={setPlayerState}
                onUpdatePlayer={updatePlayer}
              />
            )}
          </View>
        )}

        <View className="panel">
          <Text className="section-title">玩家列表</Text>
          <View className="quick-add-row">
            <Input className="input flex-input" value={newPlayerName} onInput={(e) => setNewPlayerName(e.detail.value)} placeholder="临时加玩家" />
            <View className="btn secondary small-btn" onClick={handleQuickAddPlayer}><Text>添加</Text></View>
          </View>

          <View className="player-list">
            {game.players.map((player) => {
              const claimed = player.claimedRole ? scriptPack.roles.find((role) => role.id === player.claimedRole) : null;
              const actual = player.actualRole ? scriptPack.roles.find((role) => role.id === player.actualRole) : null;
              return (
                <View key={player.id} className={`player-card ${editingPlayerId === player.id ? 'active' : ''} ${!player.isAlive ? 'dead' : ''}`}>
                  <View className="player-top" onClick={() => setEditingPlayerId(player.id)}>
                    <View className="seat"><Text>{player.seatNumber}</Text></View>
                    <View className="player-main">
                      <Text className="player-name">{player.name}</Text>
                      <Text className="player-info">公开: {claimed?.zhName ?? '未报身份'}</Text>
                      <Text className="player-info">怀疑度: {suspicionOptions.find((item) => item.value === player.suspicion)?.label ?? '未知'}</Text>
                      {game.mode === 'storyteller' && (
                        <>
                          <Text className="player-secret">私密真实: {actual?.zhName ?? '未分配真实角色'}</Text>
                          <Text className="player-secret">私密备注: {player.privateNotes?.trim() ? player.privateNotes : '暂无'}</Text>
                        </>
                      )}
                    </View>
                  </View>

                  {game.mode === 'storyteller' && (
                    <View className="storyteller-quick">
                      <Text className="quick-label">说书人快捷状态</Text>
                      <View className="quick-chip-grid">
                        {storytellerStateFields.map((field) => (
                          <View
                            key={`${player.id}-${field.key}`}
                            className={`mini-chip ${player.state[field.key] ? 'active' : ''}`}
                            onClick={() => setPlayerState(player.id, field.key, !player.state[field.key])}
                          >
                            <Text>{field.label}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {editingPlayer && (
          <PlayerEditor
            player={editingPlayer}
            mode={game.mode}
            scriptId={game.scriptId}
            onUpdatePlayer={updatePlayer}
            onSetSuspicion={setPlayerSuspicion}
            onAssignRole={assignRole}
            onToggleState={setPlayerState}
            onRemove={removePlayer}
          />
        )}
      </View>
    </View>
  );
}

function NightFlowPanel({
  game,
  scriptId,
  onAddNightAction,
  onAddEvent,
  onSetPlayerState,
  onUpdatePlayer,
}: {
  game: Game;
  scriptId: string;
  onAddNightAction: (action: { night: number; roleId: string; playerId: string; targetPlayerIds: string[]; result?: string; order: number }) => void;
  onAddEvent: (type: EventType, data: Record<string, unknown>, sourcePlayerId?: string, targetPlayerId?: string) => void;
  onSetPlayerState: (playerId: string, field: keyof Player['state'], value: boolean) => void;
  onUpdatePlayer: (playerId: string, updates: Partial<Player>) => void;
}) {
  const scriptPack = getScriptPack(scriptId);
  const nightRoles = (scriptPack?.roles ?? []).filter((role) => role.firstNight || role.otherNights).sort((a, b) => (a.nightOrder ?? 999) - (b.nightOrder ?? 999));
  const [roleId, setRoleId] = useState(nightRoles[0]?.id ?? '');
  const [actorId, setActorId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [resultText, setResultText] = useState('');
  const [deathTargetId, setDeathTargetId] = useState('');
  const [selectedEffects, setSelectedEffects] = useState<Record<string, boolean>>({
    poisoned: false,
    drunk: false,
    mad: false,
    protected: false,
    roleChanged: false,
    alignmentChanged: false,
  });

  const toggleEffect = (key: keyof typeof selectedEffects) => {
    setSelectedEffects((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRecordStep = () => {
    if (!roleId || !actorId) {
      Taro.showToast({ title: '请选择行动角色与玩家', icon: 'none' });
      return;
    }

    const night = Math.max(game.currentNight, 1);
    const order = (game.storytellerData?.nightActions.filter((item) => item.night === night).length ?? 0) + 1;

    onAddNightAction({
      night,
      roleId,
      playerId: actorId,
      targetPlayerIds: targetId ? [targetId] : [],
      result: resultText.trim() || undefined,
      order,
    });

    onAddEvent('ability_use', {
      abilityRoleId: roleId,
      result: resultText.trim() || undefined,
      abilityTargets: targetId ? [targetId] : [],
    }, actorId, targetId || undefined);

    if (resultText.trim()) {
      onAddEvent('ability_result', { result: resultText.trim() }, actorId, targetId || undefined);
    }

    (Object.entries(selectedEffects) as [keyof typeof selectedEffects, boolean][])
      .filter(([, active]) => active && targetId)
      .forEach(([field]) => {
        if (!targetId) return;
        onSetPlayerState(targetId, field as keyof Player['state'], true);
        onAddEvent('status_change', { statusField: field, statusValue: true }, actorId, targetId);
      });

    if (deathTargetId) {
      const deathPlayer = game.players.find((item) => item.id === deathTargetId);
      onUpdatePlayer(deathTargetId, {
        isAlive: false,
        state: deathPlayer ? { ...deathPlayer.state, diedAtNight: true } : undefined,
      });
      onAddEvent('night_death', { diedPlayerId: deathTargetId }, actorId, deathTargetId);
    }

    Taro.showToast({ title: '夜间步骤已记录', icon: 'success' });
    setResultText('');
    setTargetId('');
    setDeathTargetId('');
    setSelectedEffects({
      poisoned: false,
      drunk: false,
      mad: false,
      protected: false,
      roleChanged: false,
      alignmentChanged: false,
    });
  };

  return (
    <View className="night-flow-body">
      <Text className="night-caption">当前夜晚: 第 {Math.max(game.currentNight, 1)} 夜</Text>

      <Text className="label">行动角色</Text>
      <ScrollView scrollX className="picker-scroll">
        <View className="chip-row">
          {nightRoles.map((role) => (
            <View key={role.id} className={`chip ${roleId === role.id ? 'active' : ''}`} onClick={() => setRoleId(role.id)}>
              <Text>{role.zhName}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Text className="label">行动玩家</Text>
      <ScrollView scrollX className="picker-scroll">
        <View className="chip-row">
          {game.players.map((player) => (
            <View key={`night-actor-${player.id}`} className={`chip ${actorId === player.id ? 'active' : ''}`} onClick={() => setActorId(player.id)}>
              <Text>#{player.seatNumber} {player.name}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Text className="label">目标玩家</Text>
      <ScrollView scrollX className="picker-scroll">
        <View className="chip-row">
          <View className={`chip ${!targetId ? 'active' : ''}`} onClick={() => setTargetId('')}>
            <Text>无目标</Text>
          </View>
          {game.players.map((player) => (
            <View key={`night-target-${player.id}`} className={`chip ${targetId === player.id ? 'active' : ''}`} onClick={() => setTargetId(player.id)}>
              <Text>#{player.seatNumber} {player.name}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Text className="label">行动结果 / 备注</Text>
      <Textarea className="textarea" value={resultText} onInput={(e) => setResultText(e.detail.value)} maxlength={300} placeholder="记录今夜结果、说书人备注或处理说明" />

      <Text className="label">本夜影响状态</Text>
      <View className="quick-chip-grid">
        {(Object.keys(selectedEffects) as (keyof typeof selectedEffects)[]).map((field) => (
          <View key={`night-effect-${field}`} className={`mini-chip ${selectedEffects[field] ? 'active' : ''}`} onClick={() => toggleEffect(field)}>
            <Text>{storytellerStateFields.find((item) => item.key === field)?.label ?? field}</Text>
          </View>
        ))}
      </View>

      <Text className="label">夜间死亡结果</Text>
      <ScrollView scrollX className="picker-scroll">
        <View className="chip-row">
          <View className={`chip ${!deathTargetId ? 'active' : ''}`} onClick={() => setDeathTargetId('')}>
            <Text>无人死亡</Text>
          </View>
          {game.players.filter((player) => player.isAlive).map((player) => (
            <View key={`night-death-${player.id}`} className={`chip ${deathTargetId === player.id ? 'active' : ''}`} onClick={() => setDeathTargetId(player.id)}>
              <Text>#{player.seatNumber} {player.name}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="btn primary full" onClick={handleRecordStep}>
        <Text>记录当前夜间步骤</Text>
      </View>

      {(game.storytellerData?.nightActions ?? []).filter((item) => item.night === Math.max(game.currentNight, 1)).length > 0 && (
        <View className="night-history">
          <Text className="quick-label">本夜已记录步骤</Text>
          {(game.storytellerData?.nightActions ?? [])
            .filter((item) => item.night === Math.max(game.currentNight, 1))
            .map((item) => {
              const role = scriptPack?.roles.find((entry) => entry.id === item.roleId);
              const player = game.players.find((entry) => entry.id === item.playerId);
              const target = game.players.find((entry) => entry.id === item.targetPlayerIds[0]);
              return (
                <View key={item.id} className="night-history-item">
                  <Text className="night-history-title">{item.order}. {role?.zhName ?? item.roleId} · {player?.name ?? item.playerId}</Text>
                  <Text className="night-history-desc">目标: {target?.name ?? '无'} {item.result ? `· ${item.result}` : ''}</Text>
                </View>
              );
            })}
        </View>
      )}
    </View>
  );
}

function PlayerEditor({
  player,
  mode,
  scriptId,
  onUpdatePlayer,
  onSetSuspicion,
  onAssignRole,
  onToggleState,
  onRemove,
}: {
  player: Player;
  mode: GameMode;
  scriptId: string;
  onUpdatePlayer: (playerId: string, updates: Partial<Player>) => void;
  onSetSuspicion: (playerId: string, level: SuspicionLevel) => void;
  onAssignRole: (playerId: string, roleId: string, alignment: 'good' | 'evil') => void;
  onToggleState: (playerId: string, field: keyof Player['state'], value: boolean) => void;
  onRemove: (playerId: string) => void;
}) {
  const scriptPack = getScriptPack(scriptId);
  const roles = scriptPack?.roles ?? [];

  const confirmRemovePlayer = () => {
    Taro.showModal({
      title: '确认删除玩家',
      content: `确定删除 #${player.seatNumber} ${player.name} 吗？`,
      success: (res) => {
        if (res.confirm) onRemove(player.id);
      },
    });
  };

  return (
    <View className="panel">
      <Text className="section-title">编辑玩家 #{player.seatNumber} {player.name}</Text>

      <Text className="subheading">公开信息</Text>
      <Text className="label">玩家名字</Text>
      <Input className="input" value={player.name} onInput={(e) => onUpdatePlayer(player.id, { name: e.detail.value })} placeholder="玩家名字" />

      <Text className="label">报身份</Text>
      <ScrollView scrollX className="picker-scroll"><View className="chip-row">
        <View className={`chip ${!player.claimedRole ? 'active' : ''}`} onClick={() => onUpdatePlayer(player.id, { claimedRole: undefined })}><Text>未报</Text></View>
        {roles.map((role) => (
          <View key={`${player.id}-claimed-${role.id}`} className={`chip ${player.claimedRole === role.id ? 'active' : ''}`} onClick={() => onUpdatePlayer(player.id, { claimedRole: role.id })}><Text>{role.zhName}</Text></View>
        ))}
      </View></ScrollView>

      <Text className="label">公开备注</Text>
      <Textarea className="textarea" value={player.notes} onInput={(e) => onUpdatePlayer(player.id, { notes: e.detail.value })} maxlength={400} placeholder="记录发言、报数、站边理由等公开信息" />

      <Text className="label">怀疑度</Text>
      <View className="chip-grid">
        {suspicionOptions.map((item) => (
          <View key={`${player.id}-sus-${item.value}`} className={`chip ${player.suspicion === item.value ? 'active' : ''}`} onClick={() => onSetSuspicion(player.id, item.value)}><Text>{item.label}</Text></View>
        ))}
      </View>

      <Text className="label">基础状态</Text>
      <View className="chip-grid">
        <View className={`chip ${player.isAlive ? 'active' : ''}`} onClick={() => onUpdatePlayer(player.id, { isAlive: !player.isAlive })}><Text>{player.isAlive ? '存活' : '死亡'}</Text></View>
        <View className={`chip ${player.hasGhostVote ? 'active' : ''}`} onClick={() => onUpdatePlayer(player.id, { hasGhostVote: !player.hasGhostVote })}><Text>{player.hasGhostVote ? '有鬼票' : '无鬼票'}</Text></View>
        {storytellerStateFields.map((field) => (
          <View key={`${player.id}-state-${field.key}`} className={`chip ${player.state[field.key] ? 'active' : ''}`} onClick={() => onToggleState(player.id, field.key, !player.state[field.key])}><Text>{field.label}</Text></View>
        ))}
      </View>

      {mode === 'storyteller' && (
        <>
          <Text className="subheading private-heading">私密真实信息</Text>

          <Text className="label">真实角色</Text>
          <ScrollView scrollX className="picker-scroll"><View className="chip-row">
            <View className={`chip ${!player.actualRole ? 'active' : ''}`} onClick={() => onUpdatePlayer(player.id, { actualRole: undefined, actualAlignment: 'good' })}><Text>未分配</Text></View>
            {roles.map((role) => (
              <View key={`${player.id}-actual-${role.id}`} className={`chip ${player.actualRole === role.id ? 'active' : ''}`} onClick={() => onAssignRole(player.id, role.id, role.alignment)}><Text>{role.zhName}</Text></View>
            ))}
          </View></ScrollView>

          <Text className="label">私密备注</Text>
          <Textarea className="textarea private-textarea" value={player.privateNotes ?? ''} onInput={(e) => onUpdatePlayer(player.id, { privateNotes: e.detail.value })} maxlength={400} placeholder="这里只在说书人视角展示" />
        </>
      )}

      <View className="btn danger full" onClick={confirmRemovePlayer}><Text>删除玩家</Text></View>
    </View>
  );
}
