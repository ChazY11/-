"use client";

import type { GameMode, Player, ScriptPack, SuspicionLevel } from '@clocktower/core';
import { useGameStore } from '@/store/game-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const suspicionLabels: Record<string, string> = {
  unknown: '未知',
  trusted: '可信',
  neutral: '中立',
  suspicious: '可疑',
  evil: '邪恶',
};

const suspicionCycle: SuspicionLevel[] = ['unknown', 'trusted', 'neutral', 'suspicious', 'evil'];

interface PlayerCardProps {
  player: Player;
  scriptPack: ScriptPack;
  mode: GameMode;
  onClick: () => void;
}

const privateStateLabels: { key: keyof Player['state']; label: string }[] = [
  { key: 'poisoned', label: '中毒' },
  { key: 'drunk', label: '醉酒' },
  { key: 'mad', label: '疯狂' },
  { key: 'protected', label: '受保护' },
  { key: 'roleChanged', label: '换角' },
  { key: 'alignmentChanged', label: '换阵营' },
];

export function PlayerCard({ player, scriptPack, mode, onClick }: PlayerCardProps) {
  const updatePlayer = useGameStore((s) => s.updatePlayer);
  const claimedRole = player.claimedRole ? scriptPack.roles.find((role) => role.id === player.claimedRole) : null;
  const actualRole = player.actualRole ? scriptPack.roles.find((role) => role.id === player.actualRole) : null;
  const activePrivateStates = privateStateLabels.filter((state) => player.state[state.key]);

  const toggleAlive = (e: React.MouseEvent) => {
    e.stopPropagation();
    updatePlayer(player.id, {
      isAlive: !player.isAlive,
      hasGhostVote: !player.isAlive ? true : player.hasGhostVote,
    });
  };

  const cycleSuspicion = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = suspicionCycle.indexOf(player.suspicion);
    const next = suspicionCycle[(idx + 1) % suspicionCycle.length];
    updatePlayer(player.id, { suspicion: next });
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all active:scale-[0.98]",
        !player.isAlive && "opacity-60",
        `suspicion-bg-${player.suspicion}`,
      )}
      onClick={onClick}
    >
      <CardContent className="space-y-2 p-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleAlive}
            className={cn(
              "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors",
              player.isAlive
                ? "bg-primary/20 text-primary"
                : "bg-destructive/20 text-destructive line-through",
            )}
          >
            {player.seatNumber}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className={cn("truncate font-medium", !player.isAlive && "text-muted-foreground line-through")}>
                {player.name}
              </span>
              {mode === 'storyteller' && player.actualAlignment && (
                <Badge variant={player.actualAlignment === 'evil' ? 'destructive' : 'success'} className="text-[10px]">
                  {player.actualAlignment === 'evil' ? '邪恶' : '善良'}
                </Badge>
              )}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              {claimedRole && <span className={cn("text-xs", `role-${claimedRole.type}`)}>明面：{claimedRole.zhName}</span>}
              {mode === 'storyteller' && actualRole && (
                <span className={cn("text-xs font-medium", `role-${actualRole.type}`)}>真实：{actualRole.zhName}</span>
              )}
              {player.notes && <span className="truncate text-xs text-muted-foreground">· {player.notes}</span>}
            </div>
          </div>

          <button
            onClick={cycleSuspicion}
            className={cn(
              "flex-shrink-0 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
              `suspicion-${player.suspicion}`,
              player.suspicion === 'unknown' && 'border-border',
              player.suspicion === 'trusted' && 'border-green-500/30 bg-green-500/10',
              player.suspicion === 'neutral' && 'border-yellow-500/30 bg-yellow-500/10',
              player.suspicion === 'suspicious' && 'border-orange-500/30 bg-orange-500/10',
              player.suspicion === 'evil' && 'border-red-500/30 bg-red-500/10',
            )}
          >
            {suspicionLabels[player.suspicion]}
          </button>
        </div>

        {mode === 'storyteller' && (activePrivateStates.length > 0 || player.privateNotes) && (
          <div className="space-y-1 rounded-lg border border-border/70 bg-background/60 p-2">
            {activePrivateStates.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {activePrivateStates.map((state) => (
                  <Badge key={state.key} variant="warning" className="text-[10px]">
                    {state.label}
                  </Badge>
                ))}
              </div>
            )}
            {player.privateNotes && <div className="text-[11px] text-muted-foreground">隐藏备注：{player.privateNotes}</div>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
