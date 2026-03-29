import { useEffect, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useGameStore } from '@/store/game-store';
import {
  getPerspectiveAdvice,
  getScriptPack,
  getStrategyPackFocus,
  getStrategyPackSupportLevel,
} from '@clocktower/core';
import type { GameMode } from '@clocktower/core';
import './index.scss';

const modeTitles: Record<GameMode, { title: string; hint: string }> = {
  good: {
    title: '正派策略',
    hint: '聚焦公开信息、关键矛盾与今天更合理的行动建议。',
  },
  evil: {
    title: '反派策略',
    hint: '聚焦伪装路线、误导方向和当前最危险的公开信息。',
  },
  storyteller: {
    title: '说书控局',
    hint: '聚焦开局配置、风格模板、今晚目标和公平性护栏。',
  },
};

export default function StrategyPage() {
  const game = useGameStore((s) => s.games.find((entry) => entry.id === s.currentGameId));
  const loadGames = useGameStore((s) => s.loadGames);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const scriptPack = game ? getScriptPack(game.scriptId) : null;
  const advice = useMemo(() => {
    if (!game || !scriptPack) return null;
    return getPerspectiveAdvice(game, scriptPack, game.mode);
  }, [game, scriptPack]);

  if (!game || !scriptPack || !advice) {
    return (
      <View className="page-scroll">
        <View className="container empty">
          <Text className="empty-title">暂无策略上下文</Text>
          <Text className="empty-text">请先回到对局页创建或打开一个对局。</Text>
          <View className="jump-btn" onClick={() => Taro.switchTab({ url: '/pages/game/index' })}>
            <Text>回到对局页</Text>
          </View>
        </View>
      </View>
    );
  }

  const modeInfo = modeTitles[game.mode];
  const supportLevel = getStrategyPackSupportLevel(scriptPack.id);
  const focusText = getStrategyPackFocus(scriptPack.id);

  return (
    <View className="page-scroll">
      <View className="container">
        <Text className="title">策略中心</Text>
        <Text className="subtitle">
          这里承接多脚本、多视角辅助决策。逻辑页偏事实，策略页偏建议、方案、风格与护栏。
        </Text>

        <View className={`hero-card mode-${game.mode}`}>
          <Text className="hero-title">{modeInfo.title}</Text>
          <Text className="hero-hint">{modeInfo.hint}</Text>
          <Text className="hero-summary">{advice.summary}</Text>
          <Text className="hero-meta">
            {scriptPack.displayName ?? scriptPack.zhName} · {game.currentPhase === 'night'
              ? `第 ${Math.max(game.currentNight, 1)} 夜`
              : `第 ${Math.max(game.currentDay, 1)} 天`}
          </Text>
        </View>

        <View className="support-card">
          <Text className="support-title">脚本专属策略模块</Text>
          <Text className="support-line">
            当前状态：{supportLevel === 'full' ? '完整专属模块已启用' : '元数据模式'}
          </Text>
          <Text className="support-line">当前重点：{focusText}</Text>
          <Text className="support-line">
            {supportLevel === 'full'
              ? '这一板会输出脚本专属的正派、反派、说书人建议，而不是只套通用模板。'
              : '这一板当前先走策略元数据、风格模板和风险提示，后续再补更深的专属推理。'}
          </Text>
        </View>

        <View className="headline-grid">
          {advice.headlineCards.map((card) => (
            <View key={card.id} className={`headline-card ${card.tone ?? 'neutral'}`}>
              <Text className="headline-label">{card.title}</Text>
              <Text className="headline-value">{card.value}</Text>
              <Text className="headline-detail">{card.detail}</Text>
            </View>
          ))}
        </View>

        {game.mode === 'storyteller' && advice.openingSections && advice.openingSections.length > 0 && (
          <View className="section">
            <Text className="section-title">开局与夜前建议</Text>
            <View className="section-list">
              {advice.openingSections.map((section) => (
                <View key={section.id} className="section-card">
                  <Text className="section-card-title">{section.title}</Text>
                  {section.items.map((item, index) => (
                    <Text key={`${section.id}-${index}`} className="section-item">• {item}</Text>
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}

        {advice.options && advice.options.length > 0 && (
          <View className="section">
            <Text className="section-title">{game.mode === 'storyteller' ? '风格模板与三案式方案' : '策略方案'}</Text>
            <View className="option-list">
              {advice.options.map((option) => (
                <View key={option.id} className="option-card">
                  <Text className="option-title">{option.title}</Text>
                  <Text className="option-focus">建议：{option.focus}</Text>
                  <Text className="option-risk">风险：{option.risk}</Text>
                  {option.recommendedFor && (
                    <Text className="option-meta">适合场景：{option.recommendedFor}</Text>
                  )}
                  {option.recommendedPlayers && (
                    <Text className="option-meta">适合玩家：{option.recommendedPlayers}</Text>
                  )}
                  {option.levers && option.levers.length > 0 && (
                    <Text className="option-meta">推荐杠杆：{option.levers.join(' / ')}</Text>
                  )}
                  {option.guardrails && option.guardrails.length > 0 && (
                    <View className="option-guardrails">
                      {option.guardrails.map((guardrail) => (
                        <Text key={`${option.id}-${guardrail}`} className="guardrail-chip">{guardrail}</Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        <View className="section">
          <Text className="section-title">策略建议</Text>
          <View className="section-list">
            {advice.sections.map((section) => (
              <View key={section.id} className="section-card">
                <Text className="section-card-title">{section.title}</Text>
                {section.items.map((item, index) => (
                  <Text key={`${section.id}-${index}`} className="section-item">• {item}</Text>
                ))}
              </View>
            ))}
          </View>
        </View>

        {game.mode === 'storyteller' && advice.guardrailChecks && advice.guardrailChecks.length > 0 && (
          <View className="section">
            <Text className="section-title">公平性护栏检查</Text>
            <View className="guardrail-list">
              {advice.guardrailChecks.map((item) => (
                <Text key={item} className="guardrail-line">• {item}</Text>
              ))}
            </View>
          </View>
        )}

        <View className="section">
          <Text className="section-title">脚本策略标签</Text>
          <View className="tag-card">
            <Text className="tag-line">机制标签：{(scriptPack.mechanismTags ?? []).join(' / ') || '待补充'}</Text>
            <Text className="tag-line">状态标签：{(scriptPack.statusTags ?? []).join(' / ') || '待补充'}</Text>
            <Text className="tag-line">支持风格：{(scriptPack.supportedPlayStyles ?? []).join(' / ') || 'balanced'}</Text>
            <Text className="tag-line">常见冲突：{(scriptPack.commonConflictTypes ?? []).slice(0, 2).join(' / ') || '待补充'}</Text>
          </View>
        </View>

        <View className="jump-row">
          <View className="jump-btn secondary" onClick={() => Taro.navigateBack()}>
            <Text>返回上一页</Text>
          </View>
          <View className="jump-btn" onClick={() => Taro.switchTab({ url: '/pages/logic/index' })}>
            <Text>回到逻辑页</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
