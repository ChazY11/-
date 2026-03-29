import { useEffect, useMemo, useState } from 'react';
import { View, Text, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useGameStore } from '@/store/game-store';
import { useSettingsStore } from '@/store/settings-store';
import { getAllScriptPacks } from '@clocktower/core';
import type { GameMode } from '@clocktower/core';
import { exportAllGames, exportCurrentGame, parseImportText } from '@/lib/data-transfer';
import './index.scss';

const modeOptions: { value: GameMode; label: string; description: string }[] = [
  { value: 'good', label: '正派视角', description: '只显示公开信息。' },
  { value: 'evil', label: '反派视角', description: '保留公开信息，适合做反派协同推演。' },
  { value: 'storyteller', label: '说书人视角', description: '可见真实角色、私密信息与说书人备注。' },
];

export default function SettingsPage() {
  const scripts = getAllScriptPacks();
  const games = useGameStore((s) => s.games);
  const currentGame = useGameStore((s) => s.games.find((entry) => entry.id === s.currentGameId));
  const loadGames = useGameStore((s) => s.loadGames);
  const setGameMode = useGameStore((s) => s.setGameMode);
  const setStorytellerNotes = useGameStore((s) => s.setStorytellerNotes);
  const importGame = useGameStore((s) => s.importGame);
  const clearCurrentGame = useGameStore((s) => s.clearCurrentGame);
  const clearAllGames = useGameStore((s) => s.clearAllGames);
  const showAdvancedLogic = useSettingsStore((s) => s.showAdvancedLogic);
  const loadSettings = useSettingsStore((s) => s.loadSettings);
  const toggleAdvancedLogic = useSettingsStore((s) => s.toggleAdvancedLogic);
  const [transferText, setTransferText] = useState('');

  useEffect(() => {
    loadSettings();
    loadGames();
  }, [loadGames, loadSettings]);

  const currentExportText = useMemo(() => currentGame ? exportCurrentGame(currentGame) : '', [currentGame]);
  const allExportText = useMemo(() => exportAllGames(games), [games]);

  const handleCopy = async () => {
    if (!transferText.trim()) {
      Taro.showToast({ title: '没有可复制的数据', icon: 'none' });
      return;
    }
    await Taro.setClipboardData({ data: transferText });
  };

  const handleImport = () => {
    try {
      const payload = parseImportText(transferText);
      Taro.showModal({
        title: '确认导入',
        content: `将导入 ${payload.games.length} 个对局到本地，是否继续？`,
        success: (res) => {
          if (!res.confirm) return;
          payload.games.forEach((game) => importGame(game));
          Taro.showToast({ title: payload.scope === 'single' ? '对局导入成功' : '备份导入成功', icon: 'success' });
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '导入失败';
      Taro.showToast({ title: message, icon: 'none', duration: 2500 });
    }
  };

  const confirmClearCurrent = () => {
    if (!currentGame) {
      Taro.showToast({ title: '当前没有选中的对局', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '确认清空当前对局',
      content: `确定删除「${currentGame.name}」吗？`,
      success: (res) => {
        if (res.confirm) {
          clearCurrentGame();
          Taro.showToast({ title: '当前对局已删除', icon: 'success' });
        }
      },
    });
  };

  const confirmClearAll = () => {
    Taro.showModal({
      title: '确认清空全部数据',
      content: '确定要清空所有本地对局数据吗？此操作不可撤销。',
      success: (res) => {
        if (res.confirm) {
          clearAllGames();
          Taro.showToast({ title: '全部数据已清空', icon: 'success' });
        }
      },
    });
  };

  return (
    <View className="page-scroll">
      <View className="container">
      <Text className="title">设置</Text>
      <Text className="subtitle">集中管理视角模式、数据导入导出和脚本支持状态。</Text>

      <View className="section">
        <Text className="section-title">逻辑提示</Text>
        <View className="setting-card">
          <View className="setting-main">
            <Text className="setting-title">高级逻辑提示</Text>
            <Text className="setting-desc">开启后，在逻辑页显示更多提示与嫌疑分析。</Text>
          </View>
          <View className={`toggle ${showAdvancedLogic ? 'active' : ''}`} onClick={toggleAdvancedLogic}>
            <Text>{showAdvancedLogic ? '已开启' : '已关闭'}</Text>
          </View>
        </View>
      </View>

      {currentGame ? (
        <>
          <View className="section">
            <Text className="section-title">当前对局模式</Text>
            {modeOptions.map((option) => (
              <View key={option.value} className={`mode-card ${currentGame.mode === option.value ? 'active' : ''}`} onClick={() => setGameMode(option.value)}>
                <Text className="mode-title">{option.label}</Text>
                <Text className="mode-desc">{option.description}</Text>
              </View>
            ))}
          </View>

          {currentGame.mode === 'storyteller' && (
            <View className="section">
              <Text className="section-title">说书人隐藏备注</Text>
              <Textarea className="textarea" value={currentGame.storytellerData?.grimNotes ?? ''} onInput={(e) => setStorytellerNotes(e.detail.value)} maxlength={500} placeholder="记录真实配置、夜间信息、隐性提醒等" />
            </View>
          )}
        </>
      ) : (
        <View className="section">
          <Text className="section-title">当前对局</Text>
          <View className="empty-card"><Text>当前没有选中的对局，可先去首页创建或打开一局。</Text></View>
        </View>
      )}

      <View className="section">
        <Text className="section-title">数据管理</Text>
        <Text className="section-hint">导出前先确认当前文本框内容，导入时会自动校验格式与脚本兼容性。</Text>
        <View className="action-row">
          <View className="action-btn" onClick={() => setTransferText(currentExportText || '')}><Text>导出当前对局</Text></View>
          <View className="action-btn" onClick={() => setTransferText(allExportText)}><Text>导出全部数据</Text></View>
        </View>
        <View className="action-row">
          <View className="action-btn" onClick={handleCopy}><Text>复制当前文本</Text></View>
          <View className="action-btn primary-btn" onClick={handleImport}><Text>导入文本</Text></View>
        </View>
        <Textarea
          className="textarea transfer-textarea"
          value={transferText}
          onInput={(e) => setTransferText(e.detail.value)}
          maxlength={200000}
          placeholder="这里可粘贴导出的 JSON，也可点击上方按钮生成当前对局 / 全部数据的备份文本"
        />
        <Text className="helper-text">支持导入单局 JSON、完整备份 JSON，或直接粘贴单个对局对象。导入前会做脚本兼容与格式校验。</Text>

        <View className="action-row">
          <View className="danger-btn half" onClick={confirmClearCurrent}><Text>清空当前对局</Text></View>
          <View className="danger-btn half" onClick={confirmClearAll}><Text>清空全部数据</Text></View>
        </View>
      </View>

      <View className="section">
        <Text className="section-title">支持的脚本包</Text>
        {scripts.map((script) => (
          <View key={script.id} className="script-card">
            <Text className="script-name">{script.zhName}</Text>
            <Text className="script-summary">{script.summary}</Text>
            <Text className="script-meta">{script.status === 'stable' ? '稳定' : '预览'} · 脚本 ID: {script.id} · 支持 {script.supportedPlayerCounts.join(' / ')} 人</Text>
          </View>
        ))}
      </View>

      <View className="about">
        <Text>染钟楼逻辑助手 v0.6 preview</Text>
        <Text>小程序版 · 已接入世界线、逻辑校验与说书人夜间流程</Text>
      </View>
      </View>
    </View>
  );
}
