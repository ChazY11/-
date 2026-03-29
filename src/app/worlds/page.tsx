"use client";

import { useMemo, useState } from 'react';
import { useGameStore } from '@/store/game-store';
import { getScriptPack, generateWorlds } from '@clocktower/core';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronDown, ChevronUp, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorldState } from '@clocktower/core';

export default function WorldsPage() {
  const game = useGameStore((s) => s.currentGame)();
  const scriptPack = game ? getScriptPack(game.scriptId) : null;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [demonFilter, setDemonFilter] = useState<string | null>(null);

  const worlds = useMemo(() => {
    if (!game || !scriptPack) return [];
    void refreshKey;
    return generateWorlds(game, scriptPack, 50);
  }, [game, scriptPack, refreshKey]);

  if (!game || !scriptPack) {
    return <div className="p-4 py-20 text-center text-muted-foreground">请先在对局页创建或进入一个对局</div>;
  }

  if (game.players.length === 0) {
    return <div className="p-4 py-20 text-center text-muted-foreground">请先添加玩家</div>;
  }

  const filteredWorlds = demonFilter
    ? worlds.filter((world) =>
        world.assignments.some((assignment) => {
          const role = scriptPack.roles.find((r) => r.id === assignment.roleId);
          return role?.type === 'demon' && assignment.playerId === demonFilter;
        }),
      )
    : worlds;

  const topWorlds = filteredWorlds.slice(0, 5);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">世界线</h1>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{worlds.length} 条候选</Badge>
          <Button size="icon" variant="ghost" onClick={() => setRefreshKey((value) => value + 1)} className="h-9 w-9">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-2 p-3">
          <p className="text-sm font-medium">怎么看候选世界线</p>
          <p className="text-xs text-muted-foreground">
            候选世界线 = 在当前公开信息下，可能成立的一组角色分配方案。
          </p>
          <p className="text-xs text-muted-foreground">
            分数越高，表示它和你已经记录的身份、死亡、提名与备注越贴近。
          </p>
          <p className="text-[11px] text-muted-foreground">
            建议和逻辑页一起看：世界线负责给出“可能怎么分”，逻辑页负责提醒“哪里有冲突”。
          </p>
        </CardContent>
      </Card>

      {game.players.length > 0 && worlds.length > 0 && (
        <div>
          <span className="text-[11px] font-medium text-muted-foreground">按恶魔候选筛选</span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <button
              onClick={() => setDemonFilter(null)}
              className={cn(
                "rounded-md px-2 py-1 text-xs transition-colors",
                !demonFilter ? 'bg-primary/15 font-medium text-primary' : 'text-muted-foreground',
              )}
            >
              全部
            </button>
            {game.players.map((player) => (
              <button
                key={player.id}
                onClick={() => setDemonFilter(demonFilter === player.id ? null : player.id)}
                className={cn(
                  "rounded-md px-2 py-1 text-xs transition-colors",
                  demonFilter === player.id
                    ? 'bg-red-500/15 font-medium text-red-400'
                    : 'text-muted-foreground',
                )}
              >
                #{player.seatNumber}
              </button>
            ))}
          </div>
        </div>
      )}

      {filteredWorlds.length === 0 && worlds.length > 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">当前筛选条件下没有候选世界线</div>
      ) : worlds.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <GitBranch className="mx-auto mb-2 h-10 w-10 text-muted-foreground opacity-70" />
            <p className="text-sm text-muted-foreground">暂时无法生成候选世界线</p>
            <p className="mt-1 text-xs text-muted-foreground">请先确认玩家人数与公开信息是否已录入</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {topWorlds.map((world, index) => (
            <WorldCard
              key={world.id}
              world={world}
              index={index}
              game={game}
              scriptPack={scriptPack}
              expanded={expandedId === world.id}
              onToggle={() => setExpandedId(expandedId === world.id ? null : world.id)}
            />
          ))}
        </div>
      )}

      {filteredWorlds.length > 5 && (
        <p className="text-center text-xs text-muted-foreground">
          当前显示前 5 条（共 {filteredWorlds.length} 条候选世界线）
        </p>
      )}
    </div>
  );
}

function WorldCard({
  world,
  index,
  game,
  scriptPack,
  expanded,
  onToggle,
}: {
  world: WorldState;
  index: number;
  game: { players: { id: string; name: string; seatNumber: number }[] };
  scriptPack: { roles: { id: string; zhName: string; type: string; alignment: string }[] };
  expanded: boolean;
  onToggle: () => void;
}) {
  const demons = world.assignments.filter((assignment) => {
    const role = scriptPack.roles.find((r) => r.id === assignment.roleId);
    return role?.type === 'demon';
  });

  const minions = world.assignments.filter((assignment) => {
    const role = scriptPack.roles.find((r) => r.id === assignment.roleId);
    return role?.type === 'minion';
  });

  return (
    <Card className={cn(!world.isValid && "border-destructive/30 opacity-60")}>
      <CardContent className="p-0">
        <button className="flex w-full items-center gap-3 p-3 text-left" onClick={onToggle}>
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
            {index + 1}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                恶魔:{' '}
                {demons
                  .map((demon) => {
                    const player = game.players.find((p) => p.id === demon.playerId);
                    return `#${player?.seatNumber ?? '?'}`;
                  })
                  .join(', ')}
              </span>
              <Badge variant="secondary" className="text-[10px]">
                分数 {world.score}
              </Badge>
              {!world.isValid && (
                <Badge variant="destructive" className="text-[10px]">
                  无效
                </Badge>
              )}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              爪牙:{' '}
              {minions
                .map((minion) => {
                  const player = game.players.find((p) => p.id === minion.playerId);
                  const role = scriptPack.roles.find((r) => r.id === minion.roleId);
                  return `#${player?.seatNumber ?? '?'}(${role?.zhName ?? '?'})`;
                })
                .join(', ')}
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          )}
        </button>

        {expanded && (
          <div className="space-y-2 border-t px-3 pb-3 pt-2">
            <div>
              <div className="mb-1 text-xs text-muted-foreground">角色分配</div>
              <div className="grid grid-cols-2 gap-1">
                {world.assignments.map((assignment) => {
                  const player = game.players.find((p) => p.id === assignment.playerId);
                  const role = scriptPack.roles.find((r) => r.id === assignment.roleId);
                  return (
                    <div
                      key={assignment.playerId}
                      className={cn(
                        "rounded px-2 py-1 text-xs",
                        assignment.alignment === 'evil'
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-blue-500/10 text-blue-400',
                      )}
                    >
                      #{player?.seatNumber} {player?.name}: {role?.zhName}
                    </div>
                  );
                })}
              </div>
            </div>

            {world.keyDeductions.length > 0 && (
              <div>
                <div className="mb-1 text-xs text-muted-foreground">关键推理</div>
                <ul className="space-y-0.5">
                  {world.keyDeductions.map((reason, index) => (
                    <li key={index} className="text-xs text-foreground/80">
                      - {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {world.invalidReasons.length > 0 && (
              <div>
                <div className="mb-1 text-xs text-red-400">无效原因</div>
                <ul className="space-y-0.5">
                  {world.invalidReasons.map((reason, index) => (
                    <li key={index} className="text-xs text-red-400/80">
                      - {reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
