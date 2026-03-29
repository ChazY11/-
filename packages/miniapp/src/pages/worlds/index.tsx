import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { useGameStore } from '@/store/game-store';
import { getScriptPack, generateWorlds } from '@clocktower/core';
import type { WorldState } from '@clocktower/core';
import './index.scss';

export default function WorldsPage() {
  const game = useGameStore((s) => s.games.find((entry) => entry.id === s.currentGameId));
  const loadGames = useGameStore((s) => s.loadGames);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [demonFilter, setDemonFilter] = useState<string | null>(null);
  const scriptPack = game ? getScriptPack(game.scriptId) : null;

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const worlds = useMemo(() => {
    if (!game || !scriptPack) return [];
    void refreshKey;
    return generateWorlds(game, scriptPack, 50);
  }, [game, refreshKey, scriptPack]);

  if (!game || !scriptPack) {
    return <View className="container empty"><Text>请先在对局页创建或进入一个对局</Text></View>;
  }

  const filteredWorlds = demonFilter
    ? worlds.filter((world) => world.assignments.some((assignment) => {
        const role = scriptPack.roles.find((item) => item.id === assignment.roleId);
        return role?.type === 'demon' && assignment.playerId === demonFilter;
      }))
    : worlds;

  return (
    <View className="page-scroll">
      <View className="container">
      <View className="page-header">
        <View>
          <Text className="title">世界线</Text>
          <Text className="subtitle">基于公开信息生成可能成立的身份分配候选。</Text>
        </View>
        <View className="refresh-btn" onClick={() => setRefreshKey((value) => value + 1)}>
          <Text>刷新</Text>
        </View>
      </View>

      <View className="intro-card">
        <Text className="intro-title">怎么看候选世界线</Text>
        <Text className="intro-text">分数越高，表示它和已经记录的报身份、死亡、提名与备注越贴近。</Text>
        <Text className="intro-text">建议和逻辑页一起看: 世界线负责给出“可能怎么分”，逻辑页负责提醒“哪里有冲突”。</Text>
      </View>

      {game.players.length > 0 && worlds.length > 0 && (
        <View className="filter-row">
          <Text className="filter-label">按恶魔候选筛选</Text>
          <ScrollView scrollX className="filter-scroll">
            <View className="chip-row">
              <View className={`chip ${!demonFilter ? 'active' : ''}`} onClick={() => setDemonFilter(null)}>
                <Text>全部</Text>
              </View>
              {game.players.map((player) => (
                <View
                  key={player.id}
                  className={`chip ${demonFilter === player.id ? 'danger' : ''}`}
                  onClick={() => setDemonFilter(demonFilter === player.id ? null : player.id)}
                >
                  <Text>#{player.seatNumber} {player.name}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {worlds.length === 0 ? (
        <View className="empty-card">
          <Text className="empty-title">暂时无法生成候选世界线</Text>
          <Text className="empty-text">请先录入玩家、报身份和关键事件，世界线列表才会更有参考价值。</Text>
        </View>
      ) : filteredWorlds.length === 0 ? (
        <View className="empty-card">
          <Text className="empty-title">当前筛选条件下没有候选世界线</Text>
        </View>
      ) : (
        <View className="world-list">
          {filteredWorlds.slice(0, 8).map((world, index) => (
            <WorldCard
              key={world.id}
              world={world}
              index={index}
              expanded={expandedId === world.id}
              onToggle={() => setExpandedId(expandedId === world.id ? null : world.id)}
              playerLookup={game.players.map((player) => ({ id: player.id, name: player.name, seatNumber: player.seatNumber }))}
              roleLookup={scriptPack.roles.map((role) => ({
                id: role.id,
                zhName: role.zhName,
                type: role.type,
              }))}
            />
          ))}
        </View>
      )}
      </View>
    </View>
  );
}

function WorldCard({
  world,
  index,
  expanded,
  onToggle,
  playerLookup,
  roleLookup,
}: {
  world: WorldState;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  playerLookup: { id: string; name: string; seatNumber: number }[];
  roleLookup: { id: string; zhName: string; type: string }[];
}) {
  const demons = world.assignments.filter((assignment) => roleLookup.find((role) => role.id === assignment.roleId)?.type === 'demon');
  const minions = world.assignments.filter((assignment) => roleLookup.find((role) => role.id === assignment.roleId)?.type === 'minion');

  return (
    <View className={`world-card ${!world.isValid ? 'invalid' : ''}`}>
      <View className="world-summary" onClick={onToggle}>
        <View className="world-rank"><Text>{index + 1}</Text></View>
        <View className="world-main">
          <Text className="world-title">
            恶魔:
            {' '}
            {demons.map((assignment) => {
              const player = playerLookup.find((item) => item.id === assignment.playerId);
              return `#${player?.seatNumber ?? '?'}`;
            }).join(', ')}
          </Text>
          <Text className="world-subtitle">
            爪牙:
            {' '}
            {minions.map((assignment) => {
              const player = playerLookup.find((item) => item.id === assignment.playerId);
              const role = roleLookup.find((item) => item.id === assignment.roleId);
              return `#${player?.seatNumber ?? '?'}(${role?.zhName ?? '?'})`;
            }).join(', ')}
          </Text>
        </View>
        <View className="badge-stack">
          <Text className="badge">分数 {world.score}</Text>
          {!world.isValid && <Text className="badge danger">无效</Text>}
        </View>
      </View>

      {expanded && (
        <View className="world-detail">
          <Text className="detail-title">角色分配</Text>
          <View className="assignment-list">
            {world.assignments.map((assignment) => {
              const player = playerLookup.find((item) => item.id === assignment.playerId);
              const role = roleLookup.find((item) => item.id === assignment.roleId);
              return (
                <View key={`${world.id}-${assignment.playerId}`} className={`assignment-pill ${assignment.alignment === 'evil' ? 'evil' : 'good'}`}>
                  <Text>#{player?.seatNumber} {player?.name}: {role?.zhName}</Text>
                </View>
              );
            })}
          </View>

          {world.keyDeductions.length > 0 && (
            <View className="reason-block">
              <Text className="detail-title">关键推理</Text>
              {world.keyDeductions.map((reason, idx) => (
                <Text key={`${world.id}-deduction-${idx}`} className="reason-text">• {reason}</Text>
              ))}
            </View>
          )}

          {world.invalidReasons.length > 0 && (
            <View className="reason-block">
              <Text className="detail-title danger-text">无效原因</Text>
              {world.invalidReasons.map((reason, idx) => (
                <Text key={`${world.id}-invalid-${idx}`} className="reason-text danger-text">• {reason}</Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
