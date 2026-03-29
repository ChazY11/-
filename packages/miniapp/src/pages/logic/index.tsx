import { useEffect, useMemo, useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useGameStore } from '@/store/game-store';
import { useSettingsStore } from '@/store/settings-store';
import {
  calculateSuspicion,
  getPerspectiveAdvice,
  getScriptPack,
  getStrategyPackFocus,
  getStrategyPackSupportLevel,
  validateGame,
} from '@clocktower/core';
import type { GameMode, IssueSeverity } from '@clocktower/core';
import './index.scss';

const severityLabels: Record<IssueSeverity, string> = {
  error: '严重冲突',
  warning: '警告',
  info: '提示',
};

const modeTitles: Record<GameMode, { title: string; hint: string }> = {
  good: {
    title: '正派视角',
    hint: '只展示公开信息下的合理推断、矛盾点与世界线压力。',
  },
  evil: {
    title: '反派视角',
    hint: '只基于当前公开局势做伪装、误导与节奏选择建议，不泄露说书人真相。',
  },
  storyteller: {
    title: '说书人视角',
    hint: '结合脚本机制、局势节奏与公平性风险输出控局辅助。',
  },
};

type FilterMode = 'all' | 'error' | 'warning' | 'info';

export default function LogicPage() {
  const game = useGameStore((s) => s.games.find((entry) => entry.id === s.currentGameId));
  const loadGames = useGameStore((s) => s.loadGames);
  const scriptPack = game ? getScriptPack(game.scriptId) : null;
  const showAdvancedLogic = useSettingsStore((s) => s.showAdvancedLogic);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const [filter, setFilter] = useState<FilterMode>('all');

  useEffect(() => {
    loadGames();
    loadSettings();
  }, [loadGames, loadSettings]);

  const issues = useMemo(() => {
    if (!game || !scriptPack) return [];
    return validateGame(game, scriptPack);
  }, [game, scriptPack]);

  const suspicionScores = useMemo(() => {
    if (!game || !scriptPack) return [];
    return calculateSuspicion(game, scriptPack).sort((a, b) => b.evilProbability - a.evilProbability);
  }, [game, scriptPack]);

  const perspectiveAdvice = useMemo(() => {
    if (!game || !scriptPack) return null;
    return getPerspectiveAdvice(game, scriptPack, game.mode);
  }, [game, scriptPack]);

  if (!game || !scriptPack || !perspectiveAdvice) {
    return <View className="container empty"><Text>请先在对局页创建或选择一个对局</Text></View>;
  }

  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');
  const infos = issues.filter((issue) => issue.severity === 'info');
  const filteredIssues = issues.filter((issue) => {
    if (issue.severity === 'info' && !showAdvancedLogic) return false;
    return filter === 'all' ? true : issue.severity === filter;
  });

  const claimedByType: Record<string, number> = { townsfolk: 0, outsider: 0, minion: 0, demon: 0 };
  let unknownCount = 0;
  for (const player of game.players) {
    if (player.claimedRole) {
      const role = scriptPack.roles.find((item) => item.id === player.claimedRole);
      if (role) claimedByType[role.type] += 1;
      else unknownCount += 1;
    } else {
      unknownCount += 1;
    }
  }

  const modeInfo = modeTitles[game.mode];
  const strategySupport = getStrategyPackSupportLevel(scriptPack.id);
  const strategyFocus = getStrategyPackFocus(scriptPack.id);
  const statusText = errors.length > 0
    ? '当前存在严重逻辑冲突'
    : warnings.length > 0
      ? '当前有可疑点，建议结合世界线继续缩圈'
      : '当前未发现明显硬冲突';

  return (
    <View className="page-scroll">
      <View className="container">
        <Text className="title">多视角辅助</Text>
        <Text className="subtitle">
          这里开始承接多脚本、多视角辅助系统。同一局势会按正派、反派、说书人模式输出不同建议。
        </Text>

        <View className="jump-strategy" onClick={() => Taro.navigateTo({ url: '/pages/strategy/index' })}>
          <Text>进入策略页</Text>
        </View>

        <View className="perspective-card">
          <Text className="perspective-title">{modeInfo.title}</Text>
          <Text className="perspective-hint">{modeInfo.hint}</Text>
          <Text className="perspective-summary">{perspectiveAdvice.summary}</Text>
        </View>

        <View className="script-meta-card">
          <Text className="section-title">脚本策略元数据</Text>
          <Text className="meta-line">
            {scriptPack.displayName ?? scriptPack.zhName} · 支持 {scriptPack.playerCountRange?.[0] ?? scriptPack.supportedPlayerCounts[0]}-{scriptPack.playerCountRange?.[1] ?? scriptPack.supportedPlayerCounts[scriptPack.supportedPlayerCounts.length - 1]} 人
          </Text>
          <Text className="meta-line">机制标签：{(scriptPack.mechanismTags ?? []).join(' / ') || '待补充'}</Text>
          <Text className="meta-line">状态标签：{(scriptPack.statusTags ?? []).join(' / ') || '待补充'}</Text>
          <Text className="meta-line">适合风格：{(scriptPack.supportedPlayStyles ?? []).join(' / ') || 'balanced'}</Text>
          <Text className="meta-line">策略模块：{strategySupport === 'full' ? '完整专属模块' : '元数据模式'}</Text>
          <Text className="meta-line">当前重点：{strategyFocus}</Text>
          {(scriptPack.riskWarnings ?? []).length > 0 && (
            <View className="badge-row">
              {(scriptPack.riskWarnings ?? []).slice(0, 3).map((warning) => (
                <Text key={warning} className="badge warning">{warning}</Text>
              ))}
            </View>
          )}
        </View>

        <View className="advice-list">
          {perspectiveAdvice.sections.map((section) => (
            <View key={section.id} className="advice-card">
              <Text className="advice-title">{section.title}</Text>
              {section.items.map((item, index) => (
                <Text key={`${section.id}-${index}`} className="advice-item">• {item}</Text>
              ))}
            </View>
          ))}
        </View>

        <View className={`status-card ${errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'ok'}`}>
          <Text className="status-text">{statusText}</Text>
          <Text className="status-meta">
            {game.players.length} 名玩家 · {game.events.length} 条事件 · {game.players.filter((player) => player.claimedRole).length} 人已报身份
          </Text>
          <View className="badge-row">
            {errors.length > 0 && <Text className="badge danger">{errors.length} 个严重冲突</Text>}
            {warnings.length > 0 && <Text className="badge warning">{warnings.length} 个警告</Text>}
            {showAdvancedLogic && infos.length > 0 && <Text className="badge info">{infos.length} 个提示</Text>}
            {issues.length === 0 && <Text className="badge success">暂无异常</Text>}
          </View>
        </View>

        <View className="alignment-grid">
          <View className="alignment-cell"><Text className="alignment-count">{claimedByType.townsfolk}</Text><Text className="alignment-label">镇民</Text><Text className="alignment-expected">预期 {scriptPack.townsfolkCount(game.playerCount)}</Text></View>
          <View className="alignment-cell"><Text className="alignment-count">{claimedByType.outsider}</Text><Text className="alignment-label">外来者</Text><Text className="alignment-expected">预期 {scriptPack.outsiderCount(game.playerCount)}</Text></View>
          <View className="alignment-cell"><Text className="alignment-count">{claimedByType.minion}</Text><Text className="alignment-label">爪牙</Text><Text className="alignment-expected">预期 {scriptPack.minionCount(game.playerCount)}</Text></View>
          <View className="alignment-cell"><Text className="alignment-count">{claimedByType.demon}</Text><Text className="alignment-label">恶魔</Text><Text className="alignment-expected">预期 {scriptPack.demonCount(game.playerCount)}</Text></View>
        </View>
        {unknownCount > 0 && <Text className="unknown-hint">{unknownCount} 名玩家尚未报身份</Text>}

        {issues.length > 0 && (
          <View className="filter-row">
            {(['all', 'error', 'warning'] as FilterMode[]).map((mode) => (
              <View key={mode} className={`chip ${filter === mode ? 'active' : ''}`} onClick={() => setFilter(mode)}>
                <Text>{mode === 'all' ? '全部' : severityLabels[mode]}</Text>
              </View>
            ))}
            {showAdvancedLogic && (
              <View className={`chip ${filter === 'info' ? 'active' : ''}`} onClick={() => setFilter('info')}>
                <Text>提示</Text>
              </View>
            )}
          </View>
        )}

        {filteredIssues.length === 0 ? (
          <View className="no-issues"><Text>{issues.length === 0 ? '当前没有检测到硬冲突' : '当前筛选条件下没有问题'}</Text></View>
        ) : (
          <View className="issue-list">
            {filteredIssues.map((issue) => (
              <View key={issue.id} className={`issue-card severity-${issue.severity}`}>
                <View className="issue-header">
                  <Text className="issue-title">{issue.title || severityLabels[issue.severity]}</Text>
                  <Text className="issue-badge">{severityLabels[issue.severity]}</Text>
                </View>
                <Text className="issue-message">{issue.message}</Text>
                {issue.impact && <Text className="issue-impact">影响：{issue.impact}</Text>}
                {issue.involvedPlayerIds.length > 0 && (
                  <Text className="issue-impact">
                    涉及玩家：
                    {issue.involvedPlayerIds.map((id) => {
                      const player = game.players.find((item) => item.id === id);
                      return player ? ` #${player.seatNumber}${player.name}` : ` ${id}`;
                    }).join('、')}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {showAdvancedLogic && game.mode !== 'storyteller' && suspicionScores.length > 0 && (
          <View className="suspicion-block">
            <Text className="section-title">{game.mode === 'evil' ? '公开风险排序' : '公开嫌疑分析'}</Text>
            {suspicionScores.map((score) => {
              const player = game.players.find((item) => item.id === score.playerId);
              if (!player) return null;
              const percent = Math.round(score.evilProbability * 100);
              return (
                <View key={score.playerId} className="suspicion-card">
                  <View className="seat"><Text>{player.seatNumber}</Text></View>
                  <View className="suspicion-main">
                    <Text className="player-title">{player.name}</Text>
                    <Text className="reason-line">{score.reasons.join(' · ')}</Text>
                  </View>
                  <Text className={`score ${percent >= 70 ? 'high' : percent >= 50 ? 'mid' : 'low'}`}>{percent}%</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}
