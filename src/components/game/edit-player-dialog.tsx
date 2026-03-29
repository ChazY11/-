"use client";

import { useState } from 'react';
import { useGameStore } from '@/store/game-store';
import type { GameMode, Player, ScriptPack, SuspicionLevel } from '@clocktower/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const suspicionOptions: { value: SuspicionLevel; label: string }[] = [
  { value: 'unknown', label: '未知' },
  { value: 'trusted', label: '可信' },
  { value: 'neutral', label: '中立' },
  { value: 'suspicious', label: '可疑' },
  { value: 'evil', label: '邪恶' },
];

const storytellerStateFields: { key: keyof Player['state']; label: string }[] = [
  { key: 'poisoned', label: '中毒' },
  { key: 'drunk', label: '醉酒' },
  { key: 'mad', label: '疯狂' },
  { key: 'protected', label: '受保护' },
  { key: 'roleChanged', label: '换角' },
  { key: 'alignmentChanged', label: '换阵营' },
];

interface EditPlayerDialogProps {
  player: Player;
  scriptPack: ScriptPack;
  mode: GameMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPlayerDialog({ player, scriptPack, mode, open, onOpenChange }: EditPlayerDialogProps) {
  const { updatePlayer, removePlayer } = useGameStore();
  const [name, setName] = useState(player.name);
  const [isAlive, setIsAlive] = useState(player.isAlive);
  const [claimedRole, setClaimedRole] = useState(player.claimedRole ?? '');
  const [suspicion, setSuspicion] = useState<SuspicionLevel>(player.suspicion);
  const [notes, setNotes] = useState(player.notes);
  const [actualRole, setActualRole] = useState(player.actualRole ?? '');
  const [actualAlignment, setActualAlignment] = useState(player.actualAlignment ?? 'good');
  const [privateNotes, setPrivateNotes] = useState(player.privateNotes ?? '');
  const [privateState, setPrivateState] = useState(player.state);

  const handleSave = () => {
    updatePlayer(player.id, {
      name: name.trim() || player.name,
      isAlive,
      claimedRole: claimedRole || undefined,
      suspicion,
      notes,
      actualRole: mode === 'storyteller' ? actualRole || undefined : player.actualRole,
      actualAlignment: mode === 'storyteller' ? actualAlignment : player.actualAlignment,
      privateNotes: mode === 'storyteller' ? privateNotes : player.privateNotes,
      state: mode === 'storyteller' ? privateState : player.state,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    removePlayer(player.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑 #{player.seatNumber} {player.name}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 max-h-[65vh] space-y-4 overflow-y-auto">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">昵称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 w-full rounded-lg border bg-transparent px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">状态</label>
            <div className="flex gap-2">
              <button
                onClick={() => setIsAlive(true)}
                className={cn(
                  "flex-1 rounded-lg border py-2 text-sm",
                  isAlive ? 'border-green-500 bg-green-500/10 text-green-500' : 'border-border text-muted-foreground',
                )}
              >
                存活
              </button>
              <button
                onClick={() => setIsAlive(false)}
                className={cn(
                  "flex-1 rounded-lg border py-2 text-sm",
                  !isAlive ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-border text-muted-foreground',
                )}
              >
                死亡
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">公开报身份</label>
            <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
              <button
                onClick={() => setClaimedRole('')}
                className={cn(
                  "rounded-md border px-2 py-1.5 text-xs",
                  !claimedRole ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground',
                )}
              >
                未声明
              </button>
              {scriptPack.roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setClaimedRole(role.id)}
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-xs transition-colors",
                    claimedRole === role.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground',
                  )}
                >
                  <span className={`role-${role.type}`}>{role.zhName}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">嫌疑等级</label>
            <div className="flex gap-1.5">
              {suspicionOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSuspicion(option.value)}
                  className={cn(
                    "flex-1 rounded-lg border py-2 text-xs transition-colors",
                    suspicion === option.value
                      ? `border-current suspicion-${option.value}`
                      : 'border-border text-muted-foreground',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">公开备注</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="所有视角都能看到的记录..."
            />
          </div>

          {mode === 'storyteller' && (
            <>
              <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
                <div className="text-sm font-medium text-primary">说书人私密信息</div>

                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">真实角色</label>
                  <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                    <button
                      onClick={() => setActualRole('')}
                      className={cn(
                        "rounded-md border px-2 py-1.5 text-xs",
                        !actualRole ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground',
                      )}
                    >
                      未分配
                    </button>
                    {scriptPack.roles.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => setActualRole(role.id)}
                        className={cn(
                          "rounded-md border px-2 py-1.5 text-xs transition-colors",
                          actualRole === role.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground',
                        )}
                      >
                        <span className={`role-${role.type}`}>{role.zhName}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">真实阵营</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActualAlignment('good')}
                      className={cn(
                        "flex-1 rounded-lg border py-2 text-sm",
                        actualAlignment === 'good'
                          ? 'border-green-500 bg-green-500/10 text-green-500'
                          : 'border-border text-muted-foreground',
                      )}
                    >
                      善良
                    </button>
                    <button
                      onClick={() => setActualAlignment('evil')}
                      className={cn(
                        "flex-1 rounded-lg border py-2 text-sm",
                        actualAlignment === 'evil'
                          ? 'border-red-500 bg-red-500/10 text-red-500'
                          : 'border-border text-muted-foreground',
                      )}
                    >
                      邪恶
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">私密状态</label>
                  <div className="flex flex-wrap gap-1.5">
                    {storytellerStateFields.map((field) => (
                      <button
                        key={field.key}
                        onClick={() => setPrivateState((state) => ({ ...state, [field.key]: !state[field.key] }))}
                        className={cn(
                          "rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
                          privateState[field.key]
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground',
                        )}
                      >
                        {field.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">私密备注</label>
                  <textarea
                    value={privateNotes}
                    onChange={(e) => setPrivateNotes(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-lg border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="只有说书人模式可见的备注..."
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleSave}>保存</Button>
            <Button variant="destructive" onClick={handleDelete}>删除</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
