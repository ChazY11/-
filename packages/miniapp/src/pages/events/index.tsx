import { useEffect, useMemo, useState } from 'react';
import { View, Text, Input, Textarea, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useGameStore } from '@/store/game-store';
import { getScriptPack } from '@clocktower/core';
import type { EventType } from '@clocktower/core';
import './index.scss';

const eventTypeConfig: Record<EventType, { label: string; group: 'day' | 'night' | 'general'; summary: string }> = {
  claim_role: { label: '报身份', group: 'day', summary: '记录玩家的公开身份声明' },
  claim_info: { label: '报信息', group: 'day', summary: '记录公开报数、报验人或口头信息' },
  nomination: { label: '提名', group: 'day', summary: '记录谁提名了谁' },
  vote: { label: '投票', group: 'day', summary: '记录投票结果' },
  execution: { label: '处决', group: 'day', summary: '记录白天处决' },
  night_death: { label: '夜杀', group: 'night', summary: '记录夜间死亡' },
  ability_use: { label: '能力使用', group: 'night', summary: '记录夜间行动或技能释放' },
  ability_result: { label: '能力结果', group: 'night', summary: '记录收到的能力结果' },
  status_change: { label: '状态变化', group: 'general', summary: '记录中毒、醉酒、保命等状态变化' },
  note: { label: '备注', group: 'general', summary: '记录自由文本备注' },
};

const eventGroups = [
  { key: 'day', label: '白天事件', hint: '高频操作优先，适合快速落地对话与票型。' },
  { key: 'night', label: '夜晚事件', hint: '记录首夜与后续夜间行动及结果。' },
  { key: 'general', label: '通用事件', hint: '补充状态变化和自由备注。' },
] as const;

export default function EventsPage() {
  const game = useGameStore((s) => s.games.find((entry) => entry.id === s.currentGameId));
  const { addEvent, undoLastEvent, removeEvent, loadGames } = useGameStore();
  const [quickNote, setQuickNote] = useState('');
  const [selectedType, setSelectedType] = useState<EventType>('claim_role');
  const [sourcePlayerId, setSourcePlayerId] = useState('');
  const [targetPlayerId, setTargetPlayerId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [detailText, setDetailText] = useState('');
  const [passed, setPassed] = useState(true);
  const [statusField, setStatusField] = useState('poisoned');
  const scriptPack = game ? getScriptPack(game.scriptId) : null;

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const groupedEvents = useMemo(() => [...(game?.events ?? [])].reverse(), [game?.events]);

  if (!game || !scriptPack) {
    return <View className="container empty"><Text>请先在对局页创建或选择一个对局</Text></View>;
  }

  const handleQuickNote = () => {
    if (!quickNote.trim()) return;
    addEvent('note', { text: quickNote.trim() });
    setQuickNote('');
  };

  const handleSubmit = () => {
    const payload: Record<string, unknown> = {};
    switch (selectedType) {
      case 'claim_role':
        if (!sourcePlayerId || !roleId) return Taro.showToast({ title: '请选择玩家和角色', icon: 'none' });
        payload.roleId = roleId;
        break;
      case 'claim_info':
        if (!sourcePlayerId || !detailText.trim()) return Taro.showToast({ title: '请填写报信息内容', icon: 'none' });
        payload.info = detailText.trim();
        break;
      case 'nomination':
        if (!sourcePlayerId || !targetPlayerId) return Taro.showToast({ title: '请选择提名人与被提名人', icon: 'none' });
        payload.nominatorId = sourcePlayerId;
        payload.nomineeId = targetPlayerId;
        break;
      case 'vote':
        if (!targetPlayerId) return Taro.showToast({ title: '请选择投票目标', icon: 'none' });
        payload.passed = passed;
        break;
      case 'execution':
      case 'night_death':
        if (!targetPlayerId) return Taro.showToast({ title: '请选择目标玩家', icon: 'none' });
        payload.diedPlayerId = targetPlayerId;
        break;
      case 'ability_use':
      case 'ability_result':
        if (!sourcePlayerId || !detailText.trim()) return Taro.showToast({ title: '请填写技能相关内容', icon: 'none' });
        payload.result = detailText.trim();
        break;
      case 'status_change':
        if (!targetPlayerId) return Taro.showToast({ title: '请选择目标玩家', icon: 'none' });
        payload.statusField = statusField;
        payload.statusValue = true;
        break;
      case 'note':
        if (!detailText.trim()) return Taro.showToast({ title: '请输入备注', icon: 'none' });
        payload.text = detailText.trim();
        break;
    }

    addEvent(selectedType, payload, sourcePlayerId || undefined, targetPlayerId || undefined);
    setDetailText('');
    if (selectedType === 'claim_role') setRoleId('');
  };

  const getEventSummary = (event: typeof game.events[number]) => {
    const source = game.players.find((player) => player.id === event.sourcePlayerId);
    const target = game.players.find((player) => player.id === event.targetPlayerId);
    const role = event.data.roleId ? scriptPack.roles.find((item) => item.id === event.data.roleId) : null;
    switch (event.type) {
      case 'claim_role': return `${source?.name ?? '?'} 声称自己是 ${role?.zhName ?? '?'}`;
      case 'claim_info': return `${source?.name ?? '?'}: ${event.data.info ?? ''}`;
      case 'nomination': return `${source?.name ?? '?'} 提名 ${target?.name ?? '?'}`;
      case 'vote': return `${target?.name ?? '?'} ${event.data.passed ? '投票通过' : '投票未过'}`;
      case 'execution': return `${target?.name ?? '?'} 被处决`;
      case 'night_death': return `${target?.name ?? '?'} 夜间死亡`;
      case 'ability_use': return `${source?.name ?? '?'} 使用能力 ${event.data.result ? `· ${event.data.result}` : ''}`;
      case 'ability_result': return `${source?.name ?? '?'} 得到结果: ${event.data.result ?? ''}`;
      case 'status_change': return `${target?.name ?? '?'} 状态变化: ${event.data.statusField ?? ''}`;
      case 'note': return (event.data.text as string) ?? '备注';
      default: return event.type;
    }
  };

  return (
    <View className="page-scroll">
      <View className="container">
        <Text className="title">事件记录</Text>
        <Text className="subtitle">把白天对话、夜间行动和关键状态变化沉淀成可回看的事件流。</Text>
        <Text className="count">{game.events.length} 条事件</Text>

        {game.mode === 'storyteller' && game.currentPhase === 'night' && (
          <View className="panel">
            <Text className="section-title">夜间流程入口</Text>
            <Text className="helper-text">当前是第 {Math.max(game.currentNight, 1)} 夜。需要顺着记录夜间行动时，可回到对局页使用说书人夜间流程面板。</Text>
            <View className="btn primary full" onClick={() => Taro.switchTab({ url: '/pages/game/index' })}>
              <Text>回到对局页夜间流程</Text>
            </View>
          </View>
        )}

        <View className="panel">
          <Text className="label">快速备注</Text>
          <Text className="helper-text">适合快速补一句话重点，不用切完整录入表单。</Text>
          <View className="quick-row">
            <Input className="input flex-input" value={quickNote} onInput={(e) => setQuickNote(e.detail.value)} onConfirm={handleQuickNote} placeholder="一句话记下本轮重点" />
            <View className="btn secondary small-btn" onClick={handleQuickNote}><Text>添加</Text></View>
          </View>
        </View>

        <View className="panel">
          <Text className="section-title">录入事件</Text>
          {eventGroups.map((group) => (
            <View key={group.key} className="group-block">
              <Text className="group-title">{group.label}</Text>
              <Text className="group-hint">{group.hint}</Text>
              <View className="chip-grid">
                {Object.entries(eventTypeConfig).filter(([, config]) => config.group === group.key).map(([type, config]) => (
                  <View key={type} className={`chip ${selectedType === type ? 'active' : ''}`} onClick={() => setSelectedType(type as EventType)}>
                    <Text>{config.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

          <Text className="helper-text">{eventTypeConfig[selectedType].summary}</Text>

          <Text className="label">来源玩家</Text>
          <ScrollView scrollX className="picker-scroll"><View className="chip-row">
            <View className={`chip ${!sourcePlayerId ? 'active' : ''}`} onClick={() => setSourcePlayerId('')}><Text>无</Text></View>
            {game.players.map((player) => (
              <View key={`src-${player.id}`} className={`chip ${sourcePlayerId === player.id ? 'active' : ''}`} onClick={() => setSourcePlayerId(player.id)}><Text>#{player.seatNumber} {player.name}</Text></View>
            ))}
          </View></ScrollView>

          <Text className="label">目标玩家</Text>
          <ScrollView scrollX className="picker-scroll"><View className="chip-row">
            <View className={`chip ${!targetPlayerId ? 'active' : ''}`} onClick={() => setTargetPlayerId('')}><Text>无</Text></View>
            {game.players.map((player) => (
              <View key={`target-${player.id}`} className={`chip ${targetPlayerId === player.id ? 'active' : ''}`} onClick={() => setTargetPlayerId(player.id)}><Text>#{player.seatNumber} {player.name}</Text></View>
            ))}
          </View></ScrollView>

          {selectedType === 'claim_role' && (
            <>
              <Text className="label">角色</Text>
              <ScrollView scrollX className="picker-scroll"><View className="chip-row">
                {scriptPack.roles.map((role) => (
                  <View key={role.id} className={`chip ${roleId === role.id ? 'active' : ''}`} onClick={() => setRoleId(role.id)}><Text>{role.zhName}</Text></View>
                ))}
              </View></ScrollView>
            </>
          )}

          {selectedType === 'vote' && (
            <>
              <Text className="label">投票结果</Text>
              <View className="chip-grid">
                <View className={`chip ${passed ? 'active' : ''}`} onClick={() => setPassed(true)}><Text>通过</Text></View>
                <View className={`chip ${!passed ? 'active' : ''}`} onClick={() => setPassed(false)}><Text>未过</Text></View>
              </View>
            </>
          )}

          {selectedType === 'status_change' && (
            <>
              <Text className="label">状态字段</Text>
              <View className="chip-grid">
                {['poisoned', 'drunk', 'protected', 'executed', 'diedAtNight'].map((field) => (
                  <View key={field} className={`chip ${statusField === field ? 'active' : ''}`} onClick={() => setStatusField(field)}><Text>{field}</Text></View>
                ))}
              </View>
            </>
          )}

          {!['claim_role', 'vote', 'execution', 'night_death', 'status_change'].includes(selectedType) && (
            <>
              <Text className="label">详细内容</Text>
              <Textarea className="textarea" value={detailText} onInput={(e) => setDetailText(e.detail.value)} maxlength={400} placeholder="填写本条事件的补充说明" />
            </>
          )}

          <View className="btn primary full" onClick={handleSubmit}><Text>录入当前事件</Text></View>
        </View>

        {game.events.length > 0 && <View className="undo-row" onClick={undoLastEvent}><Text>撤销最后一条事件</Text></View>}

        <Text className="section-title history-title">历史记录</Text>
        {groupedEvents.length === 0 ? (
          <View className="empty-card">
            <Text className="empty-title">还没有记录任何事件</Text>
            <Text className="empty-text">先从一条快速备注、报身份或提名开始，事件流就会逐渐成型。</Text>
          </View>
        ) : (
          <View className="event-list">
            {groupedEvents.map((event) => (
              <View key={event.id} className="event-item">
                <View className="event-main">
                  <Text className="event-type">{eventTypeConfig[event.type].label}</Text>
                  <Text className="event-summary">{getEventSummary(event)}</Text>
                  <Text className="event-phase">{event.phase === 'night' ? `夜 ${event.day}` : `日 ${event.day}`}</Text>
                </View>
                <View className="delete-link" onClick={() => removeEvent(event.id)}><Text>删除</Text></View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
