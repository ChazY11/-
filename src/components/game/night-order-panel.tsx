"use client";

import type { Game, Player, ScriptPack, RoleDef } from '@clocktower/core';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Moon, Droplets, Wine } from 'lucide-react';

interface NightOrderPanelProps {
  game: Game;
  scriptPack: ScriptPack;
}

const roleTypeColors: Record<string, string> = {
  townsfolk: 'text-blue-400',
  outsider: 'text-cyan-400',
  minion: 'text-orange-400',
  demon: 'text-red-400',
};

export function NightOrderPanel({ game, scriptPack }: NightOrderPanelProps) {
  const assignments = game.storytellerData?.roleAssignments ?? {};
  const isFirstNight = game.currentNight === 1;

  const nightRoles: { role: RoleDef; player: Player }[] = [];
  for (const player of game.players) {
    if (!player.isAlive) continue;
    const roleId = assignments[player.id];
    if (!roleId) continue;
    const role = scriptPack.roles.find(r => r.id === roleId);
    if (!role || !role.nightOrder) continue;
    if (isFirstNight && !role.firstNight) continue;
    if (!isFirstNight && !role.otherNights) continue;
    nightRoles.push({ role, player });
  }

  nightRoles.sort((a, b) => (a.role.nightOrder ?? 99) - (b.role.nightOrder ?? 99));

  if (game.currentPhase !== 'night' && game.currentPhase !== 'setup') return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Moon className="h-4 w-4 text-purple-400" />
        <h3 className="text-sm font-medium">
          {isFirstNight ? '首夜行动顺序' : `第 ${game.currentNight} 夜行动顺序`}
        </h3>
        <Badge variant="secondary" className="text-[10px]">{nightRoles.length} 个角色</Badge>
      </div>

      {nightRoles.length === 0 ? (
        <Card>
          <CardContent className="p-3 text-center text-xs text-muted-foreground">
            {Object.keys(assignments).length === 0 ? '请先分配角色' : '当前夜晚没有角色需要行动'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1">
          {nightRoles.map(({ role, player }, idx) => (
            <Card key={`${player.id}-${role.id}`}>
              <CardContent className="p-2.5 flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-purple-500/15 text-purple-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-xs font-medium", roleTypeColors[role.type])}>{role.zhName}</span>
                    <span className="text-xs text-muted-foreground">#{player.seatNumber} {player.name}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5 line-clamp-2">{role.ability}</p>
                </div>
                <div className="flex gap-0.5 flex-shrink-0">
                  {player.state.poisoned && <Droplets className="h-3 w-3 text-green-500" />}
                  {player.state.drunk && <Wine className="h-3 w-3 text-purple-400" />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
