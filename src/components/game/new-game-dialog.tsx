"use client";

import { useMemo, useState } from 'react';
import { useGameStore } from '@/store/game-store';
import { getAllScriptPacks, getDefaultScriptPack } from '@clocktower/core';
import type { GameMode } from '@clocktower/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, AlertTriangle, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parsePlayerNames } from '@clocktower/core';

interface NewGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const modeOptions: { value: GameMode; label: string; description: string }[] = [
  { value: 'good', label: '正派视角', description: '只看公开信息，适合普通镇民记录。' },
  { value: 'evil', label: '反派视角', description: '保留公开信息记录，方便反派阵营协作推演。' },
  { value: 'storyteller', label: '说书人视角', description: '可配置真实角色、私密状态与隐藏备注。' },
];

export function NewGameDialog({ open, onOpenChange, onCreated }: NewGameDialogProps) {
  const defaultScript = getDefaultScriptPack();
  const scripts = getAllScriptPacks();
  const { newGameWithPlayers } = useGameStore();

  const [name, setName] = useState('');
  const [scriptId, setScriptId] = useState(defaultScript.id);
  const [mode, setMode] = useState<GameMode>('good');
  const [playerCount, setPlayerCount] = useState(7);
  const [playerCountManual, setPlayerCountManual] = useState(false);
  const [playerText, setPlayerText] = useState('');
  const [players, setPlayers] = useState<string[]>([]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [importDuplicates, setImportDuplicates] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');

  const selectedScript = scripts.find((script) => script.id === scriptId) ?? defaultScript;
  const nameInvalid = touched && !name.trim();

  const duplicates = useMemo(() => {
    const seen = new Set<string>();
    const dups = new Set<string>();
    for (const player of players) {
      const key = player.toLocaleLowerCase();
      if (seen.has(key)) dups.add(key);
      seen.add(key);
    }
    return dups;
  }, [players]);

  const handleParseText = () => {
    const parsed = parsePlayerNames(playerText);
    if (parsed.names.length === 0) return;

    const merged = [...players];
    for (const playerName of parsed.names) {
      if (!merged.some((name) => name.toLocaleLowerCase() === playerName.toLocaleLowerCase())) {
        merged.push(playerName);
      }
    }

    setPlayers(merged);
    setImportDuplicates(parsed.duplicates);
    setPlayerText('');

    if (!playerCountManual) {
      setPlayerCount(Math.max(5, Math.min(15, merged.length)));
    }
  };

  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleParseText();
    }
  };

  const removePlayer = (idx: number) => {
    const next = players.filter((_, index) => index !== idx);
    setPlayers(next);
    if (!playerCountManual && next.length >= 5) {
      setPlayerCount(Math.min(15, next.length));
    }
  };

  const movePlayer = (idx: number, direction: -1 | 1) => {
    const nextIndex = idx + direction;
    if (nextIndex < 0 || nextIndex >= players.length) return;
    const next = [...players];
    [next[idx], next[nextIndex]] = [next[nextIndex], next[idx]];
    setPlayers(next);
  };

  const updatePlayerName = (idx: number, nextName: string) => {
    const next = [...players];
    next[idx] = nextName.trim() || players[idx];
    setPlayers(next);
    setEditingIdx(null);
  };

  const handlePlayerCountClick = (count: number) => {
    setPlayerCount(count);
    setPlayerCountManual(true);
  };

  const reset = () => {
    setName('');
    setScriptId(defaultScript.id);
    setMode('good');
    setPlayerCount(7);
    setPlayerCountManual(false);
    setPlayerText('');
    setPlayers([]);
    setEditingIdx(null);
    setImportDuplicates([]);
    setTouched(false);
    setError('');
  };

  const handleCreate = async () => {
    setTouched(true);
    if (!name.trim()) {
      setError('请输入对局名称');
      return;
    }

    const finalCount = players.length > 0 ? Math.max(playerCount, players.length) : playerCount;
    await newGameWithPlayers(name.trim(), scriptId, players, finalCount, mode);
    reset();
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建对局</DialogTitle>
        </DialogHeader>
        <div className="mt-2 max-h-[72vh] space-y-4 overflow-y-auto">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">
              对局名称 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setError('');
              }}
              onBlur={() => setTouched(true)}
              placeholder="例如：周五晚场"
              className={cn(
                "h-11 w-full rounded-lg border bg-transparent px-3 text-foreground transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                nameInvalid && "border-destructive focus:ring-destructive",
              )}
              autoFocus
            />
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">脚本</label>
            <div className="flex flex-col gap-2">
              {scripts.map((script) => (
                <button
                  key={script.id}
                  onClick={() => setScriptId(script.id)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left transition-colors",
                    scriptId === script.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{script.zhName}</span>
                    <Badge variant={script.status === 'stable' ? 'success' : 'warning'} className="text-[10px]">
                      {script.status === 'stable' ? '稳定' : '预览'}
                    </Badge>
                  </div>
                  <div className="mt-1 text-[11px] opacity-85">{script.summary}</div>
                </button>
              ))}
            </div>
            <div className="mt-2 rounded-xl border border-border/70 bg-card/70 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{selectedScript.zhName}</div>
                <div className="text-[11px] text-muted-foreground">{selectedScript.supportedPlayerCounts[0]} - {selectedScript.supportedPlayerCounts.at(-1)} 人</div>
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">{selectedScript.summary}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedScript.roles.slice(0, 8).map((role) => (
                  <Badge key={role.id} variant="outline" className="text-[10px]">
                    {role.zhName}
                  </Badge>
                ))}
                {selectedScript.roles.length > 8 && (
                  <Badge variant="outline" className="text-[10px]">
                    +{selectedScript.roles.length - 8} 个角色
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">视角模式</label>
            <div className="space-y-2">
              {modeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setMode(option.value)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2 text-left transition-colors",
                    mode === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground',
                  )}
                >
                  <div className="text-sm font-medium">{option.label}</div>
                  <div className="mt-1 text-[11px] opacity-85">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">玩家名单</label>
            <div className="relative">
              <textarea
                value={playerText}
                onChange={(e) => setPlayerText(e.target.value)}
                onKeyDown={handleTextKeyDown}
                onBlur={() => {
                  if (playerText.trim()) handleParseText();
                }}
                placeholder={"支持每行一个名字，也支持中文逗号、英文逗号、顿号、空格\n例如：张三 李四 王五 赵六 小明 阿花 老王"}
                rows={3}
                className="w-full resize-none rounded-lg border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {playerText.trim() && (
                <Button size="sm" className="absolute bottom-2 right-2 h-7 text-xs" onClick={handleParseText}>
                  导入
                </Button>
              )}
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>会自动去掉空项、前后空格，并保留输入顺序。</span>
              <span>创建后直接进入当前对局。</span>
            </div>

            {players.length > 0 ? (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">已导入 {players.length} 名玩家</span>
                  {duplicates.size > 0 && (
                    <span className="flex items-center gap-1 text-xs text-yellow-500">
                      <AlertTriangle className="h-3 w-3" />
                      名单里有重复名字
                    </span>
                  )}
                </div>
                {importDuplicates.length > 0 && (
                  <div className="text-[11px] text-yellow-500">
                    导入文本中检测到重复：{importDuplicates.join('、')}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {players.map((player, index) => (
                    <div
                      key={`${player}-${index}`}
                      className={cn(
                        "flex items-center gap-1 rounded-lg border py-1 pl-2 pr-1 text-sm",
                        duplicates.has(player.toLocaleLowerCase())
                          ? "border-yellow-500/50 bg-yellow-500/10"
                          : "border-border",
                      )}
                    >
                      <span className="font-mono text-[10px] text-muted-foreground">{index + 1}</span>
                      {editingIdx === index ? (
                        <input
                          type="text"
                          defaultValue={player}
                          onBlur={(e) => updatePlayerName(index, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updatePlayerName(index, (e.target as HTMLInputElement).value);
                            }
                          }}
                          className="w-20 border-b border-primary bg-transparent text-sm text-foreground focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <span className="max-w-24 cursor-pointer truncate" onClick={() => setEditingIdx(index)}>
                          {player}
                        </span>
                      )}
                      <button
                        onClick={() => movePlayer(index, -1)}
                        className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        disabled={index === 0}
                        aria-label="上移"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => movePlayer(index, 1)}
                        className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        disabled={index === players.length - 1}
                        aria-label="下移"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removePlayer(index)}
                        className="p-0.5 text-muted-foreground hover:text-destructive"
                        aria-label="删除玩家"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  点名字可改名，箭头可调整顺序，删除后人数会自动同步。
                </p>
              </div>
            ) : (
              <p className="mt-1 text-[11px] text-muted-foreground">也可以先建空局，稍后再补玩家。</p>
            )}
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm text-muted-foreground">玩家人数</label>
              {players.length > 0 && players.length !== playerCount && (
                <span className="text-[11px] text-yellow-500">
                  名单 {players.length} 人 / 设定 {playerCount} 人
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((count) => (
                <button
                  key={count}
                  onClick={() => handlePlayerCountClick(count)}
                  className={cn(
                    "h-10 w-10 rounded-lg border text-sm font-medium transition-colors",
                    playerCount === count
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground',
                    players.length > 0 && count === players.length && playerCount !== count && 'border-yellow-500/50',
                  )}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={handleCreate}>
            <Sparkles className="h-4 w-4" />
            创建对局{players.length > 0 ? `（含 ${players.length} 名玩家）` : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
