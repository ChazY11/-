"use client";

import { useState } from 'react';
import { useGameStore } from '@/store/game-store';
import { getScriptPack } from '@clocktower/core';
import type { GameMode, Player } from '@clocktower/core';
import { Plus, Play, Trash2, ChevronRight, Swords, ScrollText, GitBranch, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlayerCard } from '@/components/game/player-card';
import { GrimoireView } from '@/components/game/grimoire-view';
import { NewGameDialog } from '@/components/game/new-game-dialog';
import { AddPlayerDialog } from '@/components/game/add-player-dialog';
import { EditPlayerDialog } from '@/components/game/edit-player-dialog';
import { demoGame } from '@clocktower/core';
import { cn } from '@/lib/utils';

const phaseLabels: Record<string, string> = {
  setup: '准备阶段',
  night: '夜晚',
  day: '白天',
  finished: '已结束',
};

const modeConfig: Record<GameMode, { label: string; hint: string; variant: 'secondary' | 'warning' | 'destructive' | 'success' }> = {
  good: {
    label: '正派视角',
    hint: '只展示公开信息，适合普通玩家记录局势。',
    variant: 'success',
  },
  evil: {
    label: '反派视角',
    hint: '保留公开信息，适合反派阵营做协同推演。',
    variant: 'warning',
  },
  storyteller: {
    label: '说书人视角',
    hint: '可见真实角色、私密状态和隐藏备注。',
    variant: 'destructive',
  },
};

export default function GamePage() {
  const games = useGameStore((s) => s.games);
  const currentGameId = useGameStore((s) => s.currentGameId);
  const selectGame = useGameStore((s) => s.selectGame);
  const deleteGame = useGameStore((s) => s.deleteGame);
  const advancePhase = useGameStore((s) => s.advancePhase);
  const importGame = useGameStore((s) => s.importGame);
  const game = useGameStore((s) => s.currentGame)();
  const [showNewGame, setShowNewGame] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showGameList, setShowGameList] = useState(!currentGameId);

  const scriptPack = game ? getScriptPack(game.scriptId) : null;

  if (showGameList || !game) {
    return (
      <div className="space-y-4 p-4">
        <div className="pb-1 pt-2 text-center">
          <h1 className="text-lg font-bold">血染钟楼 · 逻辑助手</h1>
          <p className="mt-1 text-xs text-muted-foreground">记录事件 · 检查冲突 · 推演世界线</p>
        </div>

        {games.length === 0 ? (
          <div className="space-y-6">
            <div className="space-y-4 rounded-xl border border-dashed border-border p-6 text-center">
              <Swords className="mx-auto h-10 w-10 text-primary opacity-70" />
              <div>
                <p className="font-medium">还没有对局</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  创建一局开始记录，或先加载演示对局体验核心功能。
                </p>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => setShowNewGame(true)}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  新建对局
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => importGame(demoGame)}>
                  <Play className="mr-1.5 h-4 w-4" />
                  演示对局
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="px-1 text-xs font-medium text-muted-foreground">快速上手</p>
              {[
                { step: '1', title: '创建对局', desc: '选择脚本、视角、人数，并快速导入玩家', icon: Swords },
                { step: '2', title: '记录玩家与事件', desc: '记录报身份、提名、投票、备注等公开信息', icon: ScrollText },
                { step: '3', title: '查看逻辑与世界线', desc: '自动发现冲突，并给出候选分配方案', icon: GitBranch },
              ].map((item) => (
                <Card key={item.step}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                      {item.step}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                    <item.icon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <>
            {(() => {
              const recent = [...games].sort((a, b) => (b.lastActiveAt ?? b.updatedAt) - (a.lastActiveAt ?? a.updatedAt))[0];
              if (!recent) return null;
              const recentScriptPack = getScriptPack(recent.scriptId);
              return (
                <Card
                  className="cursor-pointer border-primary/50 bg-primary/5 transition-colors active:bg-primary/10"
                  onClick={() => {
                    selectGame(recent.id);
                    setShowGameList(false);
                  }}
                >
                  <CardContent className="p-3">
                    <div className="mb-1 text-[11px] font-medium text-primary">继续最近一局</div>
                    <div className="truncate font-medium">{recent.name}</div>
                    <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{recentScriptPack?.zhName}</span>
                      <span>{recent.players.length}人</span>
                      <span>{phaseLabels[recent.currentPhase]}</span>
                      <span>{modeConfig[recent.mode].label}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{games.length} 个对局</p>
              <Button size="sm" onClick={() => setShowNewGame(true)}>
                <Plus className="mr-1 h-4 w-4" />
                新建
              </Button>
            </div>

            <div className="space-y-2">
              {games.map((entry) => {
                const entryScriptPack = getScriptPack(entry.scriptId);
                return (
                  <Card
                    key={entry.id}
                    className={cn(
                      "cursor-pointer transition-colors active:bg-accent",
                      entry.id === currentGameId && "border-primary",
                    )}
                    onClick={() => {
                      selectGame(entry.id);
                      setShowGameList(false);
                    }}
                  >
                    <CardContent className="flex items-center justify-between p-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{entry.name}</div>
                        <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>{entryScriptPack?.zhName ?? entry.scriptId}</span>
                          <span>{entry.players.length}人</span>
                          <span>{phaseLabels[entry.currentPhase]}</span>
                          <span>{modeConfig[entry.mode].label}</span>
                        </div>
                      </div>
                      <div className="ml-2 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteGame(entry.id);
                          }}
                          className="p-2 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        <div className="pt-4 text-center text-[11px] text-muted-foreground/50">由 Chaz 开发</div>

        <NewGameDialog
          open={showNewGame}
          onOpenChange={setShowNewGame}
          onCreated={() => {
            setShowNewGame(false);
            setShowGameList(false);
          }}
        />
      </div>
    );
  }

  const aliveCount = game.players.filter((player) => player.isAlive).length;
  const deadCount = game.players.filter((player) => !player.isAlive).length;
  const modeInfo = modeConfig[game.mode];

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => setShowGameList(true)} className="text-sm text-muted-foreground hover:text-foreground">
            返回对局列表
          </button>
          <h1 className="text-lg font-bold">{game.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {phaseLabels[game.currentPhase]}
            {game.currentPhase === 'night' && ` ${game.currentNight}`}
            {game.currentPhase === 'day' && ` ${game.currentDay}`}
          </Badge>
          {game.mode !== 'storyteller' && (
            <Button size="sm" variant="outline" onClick={advancePhase}>
              <Play className="mr-1 h-3 w-3" />
              推进
            </Button>
          )}
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="space-y-1 p-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <Badge variant={modeInfo.variant}>{modeInfo.label}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{modeInfo.hint}</p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>{scriptPack?.zhName}</span>
        <span>·</span>
        <span>存活 {aliveCount}</span>
        <span>·</span>
        <span>死亡 {deadCount}</span>
        <span>·</span>
        <span>事件 {game.events.length}</span>
      </div>

      {game.mode === 'storyteller' && scriptPack ? (
        <GrimoireView game={game} scriptPack={scriptPack} />
      ) : (
        <div className="space-y-2">
          {game.players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              scriptPack={scriptPack!}
              mode={game.mode}
              onClick={() => setEditingPlayer(player)}
            />
          ))}
        </div>
      )}

      {game.players.length < game.playerCount && (
        <Button variant="outline" className="w-full" onClick={() => setShowAddPlayer(true)}>
          <Plus className="mr-1 h-4 w-4" />
          添加玩家 ({game.players.length}/{game.playerCount})
        </Button>
      )}

      <AddPlayerDialog open={showAddPlayer} onOpenChange={setShowAddPlayer} />
      {editingPlayer && (
        <EditPlayerDialog
          player={editingPlayer}
          scriptPack={scriptPack!}
          mode={game.mode}
          open={!!editingPlayer}
          onOpenChange={(open) => {
            if (!open) setEditingPlayer(null);
          }}
        />
      )}
    </div>
  );
}
