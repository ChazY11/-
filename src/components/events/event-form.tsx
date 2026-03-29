"use client";

import { useState } from 'react';
import { useGameStore } from '@/store/game-store';
import type { EventType, EventData, Game, ScriptPack } from '@clocktower/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EventFormProps {
  type: EventType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: Game;
  scriptPack: ScriptPack;
}

interface PlayerPickerProps {
  game: Game;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const typeLabels: Record<EventType, string> = {
  claim_role: '报身份',
  claim_info: '报信息',
  nomination: '提名',
  vote: '投票',
  execution: '处决',
  night_death: '夜间死亡',
  ability_use: '使用能力',
  ability_result: '能力结果',
  status_change: '状态变化',
  note: '笔记',
};

function PlayerPicker({ game, label, value, onChange }: PlayerPickerProps) {
  return (
    <div>
      <label className="mb-1 block text-sm text-muted-foreground">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {game.players.map((player) => (
          <button
            key={player.id}
            onClick={() => onChange(player.id)}
            className={cn(
              "h-10 w-10 rounded-lg border text-sm font-medium transition-colors",
              value === player.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground',
              !player.isAlive && 'opacity-50',
            )}
          >
            {player.seatNumber}
          </button>
        ))}
      </div>
    </div>
  );
}

export function EventForm({ type, open, onOpenChange, game, scriptPack }: EventFormProps) {
  const addEvent = useGameStore((s) => s.addEvent);
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [text, setText] = useState('');
  const [passed, setPassed] = useState(false);

  const reset = () => {
    setSourceId('');
    setTargetId('');
    setRoleId('');
    setText('');
    setPassed(false);
  };

  const handleSubmit = () => {
    const data: EventData = {};

    switch (type) {
      case 'claim_role':
        data.roleId = roleId;
        break;
      case 'claim_info':
        data.info = text;
        break;
      case 'nomination':
        data.nominatorId = sourceId;
        data.nomineeId = targetId;
        break;
      case 'vote':
        data.passed = passed;
        break;
      case 'execution':
      case 'night_death':
        data.diedPlayerId = targetId;
        break;
      case 'ability_use':
        data.abilityRoleId = roleId;
        data.abilityTargets = targetId ? [targetId] : [];
        break;
      case 'ability_result':
        data.result = text;
        break;
      case 'status_change':
        data.statusField = text;
        break;
      case 'note':
        data.text = text;
        break;
    }

    addEvent(type, data, sourceId || undefined, targetId || undefined);
    reset();
    onOpenChange(false);
  };

  const needsSource = ['claim_role', 'claim_info', 'nomination', 'ability_use', 'ability_result'].includes(type);
  const needsTarget = ['nomination', 'vote', 'execution', 'night_death', 'ability_use'].includes(type);
  const needsRole = ['claim_role', 'ability_use'].includes(type);
  const needsText = ['claim_info', 'ability_result', 'status_change', 'note'].includes(type);
  const needsPassFail = type === 'vote';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>记录{typeLabels[type]}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 max-h-[60vh] space-y-4 overflow-y-auto">
          {needsSource && <PlayerPicker game={game} label="来源玩家" value={sourceId} onChange={setSourceId} />}
          {needsTarget && <PlayerPicker game={game} label="目标玩家" value={targetId} onChange={setTargetId} />}

          {needsRole && (
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">角色</label>
              <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto">
                {scriptPack.roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setRoleId(role.id)}
                    className={cn(
                      "rounded-md border px-2 py-1.5 text-xs transition-colors",
                      roleId === role.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground',
                    )}
                  >
                    {role.zhName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {needsText && (
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">
                {type === 'note' ? '笔记内容' : type === 'claim_info' ? '信息内容' : type === 'ability_result' ? '结果' : '状态字段'}
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-lg border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="输入内容..."
                autoFocus
              />
            </div>
          )}

          {needsPassFail && (
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">投票结果</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPassed(true)}
                  className={cn(
                    "flex-1 rounded-lg border py-2 text-sm",
                    passed ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-border text-muted-foreground',
                  )}
                >
                  通过（处决）
                </button>
                <button
                  onClick={() => setPassed(false)}
                  className={cn(
                    "flex-1 rounded-lg border py-2 text-sm",
                    !passed ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-border text-muted-foreground',
                  )}
                >
                  未通过
                </button>
              </div>
            </div>
          )}

          <Button className="w-full" onClick={handleSubmit}>
            记录
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
