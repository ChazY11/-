"use client";

import { useMemo, useState } from 'react';
import { useGameStore } from '@/store/game-store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { parsePlayerNames } from '@clocktower/core';

interface AddPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPlayerDialog({ open, onOpenChange }: AddPlayerDialogProps) {
  const [name, setName] = useState('');
  const addPlayer = useGameStore((s) => s.addPlayer);
  const currentGame = useGameStore((s) => s.currentGame)();

  const duplicateIncomingNames = useMemo(() => {
    const parsed = parsePlayerNames(name);
    if (!currentGame || parsed.names.length === 0) return [];
    const existing = new Set(currentGame.players.map((player) => player.name.toLocaleLowerCase()));
    return parsed.names.filter((playerName) => existing.has(playerName.toLocaleLowerCase()));
  }, [currentGame, name]);

  const handleAdd = () => {
    const parsed = parsePlayerNames(name);
    if (parsed.names.length === 0) return;
    for (const playerName of parsed.names) {
      addPlayer(playerName);
    }
    setName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加玩家</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-4">
          <textarea
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={"支持换行、中文逗号、英文逗号、顿号、空格\n按 Enter 立即批量加入"}
            rows={3}
            className="w-full resize-none rounded-lg border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
          <p className="text-[11px] text-muted-foreground">
            直接粘贴一串名字也可以，不必一个个手打。
          </p>
          {duplicateIncomingNames.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-yellow-500">
              <AlertTriangle className="h-3.5 w-3.5" />
              已存在同名玩家：{duplicateIncomingNames.join('、')}
            </div>
          )}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleAdd} disabled={!name.trim()}>
              添加
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              完成
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
