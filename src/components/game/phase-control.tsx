"use client";

import { useGameStore } from '@/store/game-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Moon, Sun, Play, Flag, SkipForward } from 'lucide-react';
import type { Game, GamePhase } from '@clocktower/core';

interface PhaseControlProps {
  game: Game;
}

const phaseConfig: Record<GamePhase, { label: string; icon: typeof Moon; color: string; bgColor: string }> = {
  setup: { label: '准备阶段', icon: Play, color: 'text-gray-400', bgColor: 'bg-gray-500/10' },
  night: { label: '夜晚', icon: Moon, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  day: { label: '白天', icon: Sun, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  finished: { label: '已结束', icon: Flag, color: 'text-muted-foreground', bgColor: 'bg-muted/30' },
};

export function PhaseControl({ game }: PhaseControlProps) {
  const advancePhase = useGameStore(s => s.advancePhase);
  const config = phaseConfig[game.currentPhase];
  const Icon = config.icon;
  const aliveCount = game.players.filter(p => p.isAlive).length;

  const nextPhaseLabel = game.currentPhase === 'setup' ? '进入首夜'
    : game.currentPhase === 'night' ? '进入白天'
    : game.currentPhase === 'day' ? '进入夜晚'
    : '游戏结束';

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", config.bgColor)}>
              <Icon className={cn("h-4 w-4", config.color)} />
            </div>
            <div>
              <div className={cn("text-sm font-semibold", config.color)}>
                {config.label}
                {game.currentPhase === 'night' && ` ${game.currentNight}`}
                {game.currentPhase === 'day' && ` ${game.currentDay}`}
              </div>
              <div className="text-[10px] text-muted-foreground">存活 {aliveCount} 人</div>
            </div>
          </div>
          {game.currentPhase !== 'finished' && (
            <Button size="sm" onClick={advancePhase} className="gap-1.5">
              <SkipForward className="h-3.5 w-3.5" />
              {nextPhaseLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
