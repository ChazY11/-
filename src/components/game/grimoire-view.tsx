"use client";

import { useState } from 'react';
import { useGameStore } from '@/store/game-store';
import type { Game, Player, ScriptPack, RoleDef } from '@clocktower/core';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Shield, Droplets, Wine, Zap } from 'lucide-react';
import { NightOrderPanel } from './night-order-panel';
import { PhaseControl } from './phase-control';

interface GrimoireViewProps {
  game: Game;
  scriptPack: ScriptPack;
}

const roleTypeOrder: Record<string, number> = { townsfolk: 0, outsider: 1, minion: 2, demon: 3, traveler: 4 };

const roleTypeLabels: Record<string, string> = {
  townsfolk: '镇民',
  outsider: '外来者',
  minion: '爪牙',
  demon: '恶魔',
};

const roleTypeColors: Record<string, string> = {
  townsfolk: 'text-blue-400',
  outsider: 'text-cyan-400',
  minion: 'text-orange-400',
  demon: 'text-red-400',
};

export function GrimoireView({ game, scriptPack }: GrimoireViewProps) {
  const { assignRole, updatePlayer, setPlayerState, setStorytellerNotes } = useGameStore();
  const [assigningPlayer, setAssigningPlayer] = useState<Player | null>(null);
  const [showRoles, setShowRoles] = useState(true);
  const [notes, setNotes] = useState(game.storytellerData?.grimNotes ?? '');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  const assignments = game.storytellerData?.roleAssignments ?? {};
  const assignedRoleIds = new Set(Object.values(assignments));

  const handleAssign = (player: Player, role: RoleDef) => {
    assignRole(player.id, role.id, role.alignment);
    setAssigningPlayer(null);
  };

  const handleClearRole = (player: Player) => {
    assignRole(player.id, '', 'good');
    updatePlayer(player.id, { actualRole: undefined, actualAlignment: undefined });
  };

  const sortedRoles = [...scriptPack.roles]
    .filter(r => r.type !== 'traveler')
    .sort((a, b) => (roleTypeOrder[a.type] ?? 9) - (roleTypeOrder[b.type] ?? 9));

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="bg-purple-500/15 text-purple-400 border-purple-500/30">
          说书人魔典
        </Badge>
        <Button size="sm" variant="ghost" onClick={() => setShowRoles(!showRoles)} className="text-xs">
          {showRoles ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
          {showRoles ? '隐藏角色' : '显示角色'}
        </Button>
      </div>

      {/* Phase + Night order */}
      <PhaseControl game={game} />
      <NightOrderPanel game={game} scriptPack={scriptPack} />

      {/* Player cards */}
      <div className="space-y-1.5">
        {game.players.map(player => {
          const roleId = assignments[player.id];
          const role = roleId ? scriptPack.roles.find(r => r.id === roleId) : null;

          return (
            <Card
              key={player.id}
              className={cn(
                "transition-all",
                !player.isAlive && "opacity-50",
                role?.alignment === 'evil' && showRoles && "border-red-500/30",
              )}
            >
              <CardContent className="p-2.5 flex items-center gap-2">
                <button
                  onClick={() => updatePlayer(player.id, { isAlive: !player.isAlive })}
                  className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                    player.isAlive ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive line-through"
                  )}
                >
                  {player.seatNumber}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-sm font-medium truncate", !player.isAlive && "line-through text-muted-foreground")}>
                      {player.name}
                    </span>
                    {player.state.poisoned && <Droplets className="h-3 w-3 text-green-500 flex-shrink-0" />}
                    {player.state.drunk && <Wine className="h-3 w-3 text-purple-400 flex-shrink-0" />}
                    {player.state.protected && <Shield className="h-3 w-3 text-yellow-400 flex-shrink-0" />}
                  </div>
                  {showRoles && role ? (
                    <span className={cn("text-xs", roleTypeColors[role.type])}>
                      {role.zhName}
                      <span className="text-muted-foreground/60 ml-1">({roleTypeLabels[role.type]})</span>
                    </span>
                  ) : showRoles && !role ? (
                    <span className="text-xs text-muted-foreground/50">未分配</span>
                  ) : null}
                </div>

                {/* Quick state toggles */}
                <div className="flex gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => setPlayerState(player.id, 'poisoned', !player.state.poisoned)}
                    className={cn("p-1.5 rounded-md transition-colors", player.state.poisoned ? "bg-green-500/20 text-green-500" : "text-muted-foreground/30")}
                    title="中毒"
                  >
                    <Droplets className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setPlayerState(player.id, 'drunk', !player.state.drunk)}
                    className={cn("p-1.5 rounded-md transition-colors", player.state.drunk ? "bg-purple-500/20 text-purple-400" : "text-muted-foreground/30")}
                    title="醉酒"
                  >
                    <Wine className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setPlayerState(player.id, 'protected', !player.state.protected)}
                    className={cn("p-1.5 rounded-md transition-colors", player.state.protected ? "bg-yellow-500/20 text-yellow-400" : "text-muted-foreground/30")}
                    title="保护"
                  >
                    <Shield className="h-3.5 w-3.5" />
                  </button>
                </div>

                <Button size="sm" variant="ghost" onClick={() => setAssigningPlayer(player)} className="h-8 px-2 text-xs flex-shrink-0">
                  <Zap className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Storyteller notes */}
      <div>
        <label className="text-xs text-muted-foreground font-medium mb-1 block">说书人备忘</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={() => setStorytellerNotes(notes)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border bg-transparent text-foreground text-sm resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="记录关键决策、夜晚结果..."
        />
      </div>

      {/* Role assignment dialog */}
      {assigningPlayer && (
        <Dialog open={!!assigningPlayer} onOpenChange={(open) => { if (!open) setAssigningPlayer(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>分配角色 · #{assigningPlayer.seatNumber} {assigningPlayer.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2 max-h-[60vh] overflow-y-auto">
              <div className="flex gap-1.5">
                <button onClick={() => setRoleFilter(null)} className={cn("px-2.5 py-1 rounded-md text-xs", !roleFilter ? 'bg-primary/15 text-primary font-medium' : 'text-muted-foreground')}>全部</button>
                {Object.entries(roleTypeLabels).map(([type, label]) => (
                  <button key={type} onClick={() => setRoleFilter(roleFilter === type ? null : type)} className={cn("px-2.5 py-1 rounded-md text-xs", roleFilter === type ? 'bg-primary/15 text-primary font-medium' : 'text-muted-foreground')}>{label}</button>
                ))}
              </div>

              {assignments[assigningPlayer.id] && (
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => { handleClearRole(assigningPlayer); setAssigningPlayer(null); }}>清除当前角色</Button>
              )}

              <div className="grid grid-cols-2 gap-1.5">
                {sortedRoles
                  .filter(r => !roleFilter || r.type === roleFilter)
                  .map(role => {
                    const isAssigned = assignedRoleIds.has(role.id) && assignments[assigningPlayer.id] !== role.id;
                    const isCurrent = assignments[assigningPlayer.id] === role.id;
                    return (
                      <button
                        key={role.id}
                        onClick={() => handleAssign(assigningPlayer, role)}
                        disabled={isAssigned}
                        className={cn(
                          "px-2 py-2 rounded-lg border text-xs text-left transition-colors",
                          isCurrent && "border-primary bg-primary/10",
                          isAssigned && "opacity-30 cursor-not-allowed",
                          !isCurrent && !isAssigned && "border-border hover:bg-accent",
                        )}
                      >
                        <span className={roleTypeColors[role.type]}>{role.zhName}</span>
                        {isAssigned && <span className="text-[10px] text-muted-foreground ml-1">已用</span>}
                      </button>
                    );
                  })}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
