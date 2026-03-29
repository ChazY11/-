"use client";

import { useState } from 'react';
import { useGameStore } from '@/store/game-store';
import { getScriptPack } from '@clocktower/core';
import {
  Trash2,
  Undo2,
  MessageSquare,
  UserCheck,
  Vote,
  Skull,
  Moon,
  Zap,
  Info,
  StickyNote,
  Sun,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EventForm } from '@/components/events/event-form';
import type { EventType } from '@clocktower/core';
import { cn } from '@/lib/utils';

const eventTypeConfig: Record<EventType, { label: string; icon: typeof MessageSquare; color: string }> = {
  claim_role: { label: '报身份', icon: UserCheck, color: 'text-blue-400' },
  claim_info: { label: '报信息', icon: MessageSquare, color: 'text-cyan-400' },
  nomination: { label: '提名', icon: Vote, color: 'text-yellow-400' },
  vote: { label: '投票', icon: Vote, color: 'text-amber-400' },
  execution: { label: '处决', icon: Skull, color: 'text-red-400' },
  night_death: { label: '夜杀', icon: Moon, color: 'text-purple-400' },
  ability_use: { label: '能力', icon: Zap, color: 'text-green-400' },
  ability_result: { label: '结果', icon: Info, color: 'text-emerald-400' },
  status_change: { label: '状态', icon: Sparkles, color: 'text-orange-400' },
  note: { label: '备注', icon: StickyNote, color: 'text-gray-400' },
};

const eventGroups: { label: string; icon: typeof Sun; types: EventType[]; hint: string }[] = [
  {
    label: '白天事件',
    icon: Sun,
    types: ['claim_role', 'claim_info', 'nomination', 'vote', 'execution'],
    hint: '高频事件优先放在最前面，方便单手快速录入。',
  },
  {
    label: '夜晚事件',
    icon: Moon,
    types: ['night_death', 'ability_use', 'ability_result'],
    hint: '用于记录夜杀、能力使用与反馈结果。',
  },
  {
    label: '通用事件',
    icon: StickyNote,
    types: ['status_change', 'note'],
    hint: '补充状态变化与自由备注。',
  },
];

function getEventSummary(
  event: { type: EventType; data: Record<string, unknown>; sourcePlayerId?: string; targetPlayerId?: string },
  players: { id: string; name: string; seatNumber: number }[],
  scriptPack: ReturnType<typeof getScriptPack>,
): string {
  const source = players.find((player) => player.id === event.sourcePlayerId);
  const target = players.find((player) => player.id === event.targetPlayerId);
  const role = event.data.roleId && scriptPack ? scriptPack.roles.find((r) => r.id === event.data.roleId) : null;

  switch (event.type) {
    case 'claim_role':
      return `${source?.name ?? '?'} 声称自己是 ${role?.zhName ?? '?'}`;
    case 'claim_info':
      return `${source?.name ?? '?'}: ${event.data.info ?? '?'}`;
    case 'nomination':
      return `${source?.name ?? '?'} 提名 ${target?.name ?? '?'}`;
    case 'vote':
      return `${target?.name ?? '?'} ${event.data.passed ? '投票通过' : '投票未过'}`;
    case 'execution':
      return `${target?.name ?? '?'} 被处决`;
    case 'night_death':
      return `${target?.name ?? '?'} 夜晚死亡`;
    case 'ability_use':
      return `${source?.name ?? '?'} 使用能力 -> ${target?.name ?? '?'}`;
    case 'ability_result':
      return `${source?.name ?? '?'} 结果: ${event.data.result ?? '?'}`;
    case 'status_change':
      return `${target?.name ?? '?'} ${event.data.statusField ?? '状态变化'}`;
    case 'note':
      return (event.data.text as string) ?? '备注';
    default:
      return '未知事件';
  }
}

export default function EventsPage() {
  const game = useGameStore((s) => s.currentGame)();
  const removeEvent = useGameStore((s) => s.removeEvent);
  const addEvent = useGameStore((s) => s.addEvent);
  const undoLastEvent = useGameStore((s) => s.undoLastEvent);
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<EventType | null>(null);
  const [quickNote, setQuickNote] = useState('');

  if (!game) {
    return <div className="p-4 py-20 text-center text-muted-foreground">请先在对局页创建或进入一个对局</div>;
  }

  const scriptPack = getScriptPack(game.scriptId);
  const events = [...game.events].reverse();
  const lastEvent = game.events.length > 0 ? game.events[game.events.length - 1] : null;

  const handleQuickNote = () => {
    if (!quickNote.trim()) return;
    addEvent('note', { text: quickNote.trim() });
    setQuickNote('');
  };

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">事件记录</h1>
        <Badge variant="secondary">{game.events.length} 条</Badge>
      </div>

      {lastEvent && (
        <button
          onClick={undoLastEvent}
          className="w-full rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <div className="flex items-center gap-2">
            <Undo2 className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="min-w-0 flex-1 truncate text-left">
              撤销上一条：{getEventSummary(lastEvent, game.players, scriptPack)}
            </span>
          </div>
        </button>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={quickNote}
          onChange={(e) => setQuickNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleQuickNote();
          }}
          placeholder="快速备注..."
          className="h-9 flex-1 rounded-lg border bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button size="sm" variant="outline" className="h-9" onClick={handleQuickNote} disabled={!quickNote.trim()}>
          <StickyNote className="h-3.5 w-3.5" />
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        常用事件已经按白天、夜晚、通用分组。高频记录尽量控制在 1 到 2 步内完成。
      </p>

      <div className="space-y-2">
        {eventGroups.map((group) => {
          const GroupIcon = group.icon;
          return (
            <Card key={group.label}>
              <CardContent className="space-y-2 p-3">
                <div className="flex items-center gap-2">
                  <GroupIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">{group.label}</span>
                  {group.label === '白天事件' && (
                    <Badge variant="outline" className="text-[10px]">
                      常用优先
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">{group.hint}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.types.map((type) => {
                    const config = eventTypeConfig[type];
                    const Icon = config.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          setSelectedType(type);
                          setShowForm(true);
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 transition-colors hover:bg-accent"
                      >
                        <Icon className={cn("h-3.5 w-3.5", config.color)} />
                        <span className="text-xs">{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {events.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">还没有记录任何事件</div>
      ) : (
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium text-muted-foreground">历史记录</div>
          {events.map((event) => {
            const config = eventTypeConfig[event.type];
            const Icon = config.icon;
            return (
              <Card key={event.id} className="overflow-hidden">
                <CardContent className="flex items-start gap-2 p-2.5">
                  <Icon className={cn("mt-0.5 h-4 w-4 flex-shrink-0", config.color)} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium">{config.label}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {getEventSummary(event, game.players, scriptPack)}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px]">
                      {event.phase === 'night' ? `夜 ${event.day}` : `日 ${event.day}`}
                    </Badge>
                    <button onClick={() => removeEvent(event.id)} className="p-1 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedType && scriptPack && (
        <EventForm
          type={selectedType}
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open);
            if (!open) setSelectedType(null);
          }}
          game={game}
          scriptPack={scriptPack}
        />
      )}
    </div>
  );
}
