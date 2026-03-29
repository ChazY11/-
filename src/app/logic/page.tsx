"use client";

import { useMemo, useState } from 'react';
import { useGameStore } from '@/store/game-store';
import { useSettingsStore } from '@/store/settings-store';
import { getScriptPack, validateGame, calculateSuspicion } from '@clocktower/core';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Info, Shield, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IssueSeverity } from '@clocktower/core';

const severityConfig: Record<
  IssueSeverity,
  { label: string; icon: typeof AlertCircle; color: string; badgeVariant: 'destructive' | 'warning' | 'info' }
> = {
  error: { label: '严重冲突', icon: AlertCircle, color: 'text-red-500', badgeVariant: 'destructive' },
  warning: { label: '警告', icon: AlertTriangle, color: 'text-yellow-500', badgeVariant: 'warning' },
  info: { label: '提示', icon: Info, color: 'text-blue-500', badgeVariant: 'info' },
};

type FilterMode = 'all' | 'error' | 'warning' | 'info';

export default function LogicPage() {
  const game = useGameStore((s) => s.currentGame)();
  const showAdvanced = useSettingsStore((s) => s.showAdvancedLogic);
  const [filter, setFilter] = useState<FilterMode>('all');

  const scriptPack = game ? getScriptPack(game.scriptId) : null;

  const issues = useMemo(() => {
    if (!game || !scriptPack) return [];
    return validateGame(game, scriptPack);
  }, [game, scriptPack]);

  const suspicionScores = useMemo(() => {
    if (!game || !scriptPack) return [];
    return calculateSuspicion(game, scriptPack);
  }, [game, scriptPack]);

  if (!game || !scriptPack) {
    return <div className="p-4 py-20 text-center text-muted-foreground">请先在对局页创建或进入一个对局</div>;
  }

  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');
  const infos = issues.filter((issue) => issue.severity === 'info');

  const filteredIssues = issues.filter((issue) => {
    if (issue.severity === 'info' && !showAdvanced) return false;
    if (filter === 'all') return true;
    return issue.severity === filter;
  });

  const statusText =
    errors.length > 0
      ? '存在严重逻辑冲突'
      : warnings.length > 0
        ? '存在可疑点，请结合世界线一起判断'
        : '当前没有发现硬性冲突';

  const statusColor = errors.length > 0 ? 'text-red-500' : warnings.length > 0 ? 'text-yellow-500' : 'text-green-500';
  const StatusIcon = errors.length > 0 ? AlertCircle : warnings.length > 0 ? AlertTriangle : CheckCircle2;

  return (
    <div className="space-y-3 p-4">
      <h1 className="text-xl font-bold">逻辑校验</h1>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <StatusIcon className={cn("h-8 w-8", statusColor)} />
            <div className="flex-1">
              <div className={cn("text-sm font-semibold", statusColor)}>{statusText}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {game.players.length} 名玩家 · {game.events.length} 条事件 · {game.players.filter((player) => player.claimedRole).length} 人已报身份
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            {errors.length > 0 && <Badge variant="destructive" className="text-xs">{errors.length} 严重冲突</Badge>}
            {warnings.length > 0 && <Badge variant="warning" className="text-xs">{warnings.length} 警告</Badge>}
            {showAdvanced && infos.length > 0 && <Badge variant="info" className="text-xs">{infos.length} 提示</Badge>}
            {issues.length === 0 && <Badge variant="success" className="text-xs">暂无异常</Badge>}
          </div>
        </CardContent>
      </Card>

      {issues.length > 0 && (
        <div className="flex gap-1.5">
          {([
            ['all', '全部'] as const,
            ['error', '冲突'] as const,
            ['warning', '警告'] as const,
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs transition-colors",
                filter === key ? 'bg-primary/15 font-medium text-primary' : 'text-muted-foreground',
              )}
            >
              {label}
            </button>
          ))}
          {showAdvanced && (
            <button
              onClick={() => setFilter('info')}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs transition-colors",
                filter === 'info' ? 'bg-primary/15 font-medium text-primary' : 'text-muted-foreground',
              )}
            >
              提示
            </button>
          )}
        </div>
      )}

      {filteredIssues.length === 0 && issues.length === 0 ? (
        <Card>
          <CardContent className="space-y-2 p-5 text-center">
            <Shield className="mx-auto h-10 w-10 text-green-500/60" />
            <div>
              <p className="text-sm font-medium">当前没有检测到硬性冲突</p>
              <p className="mt-1 text-xs text-muted-foreground">建议继续结合事件记录和世界线一起判断。</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredIssues.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">当前筛选条件下没有问题</div>
      ) : (
        <div className="space-y-2">
          {filteredIssues.map((issue) => {
            const config = severityConfig[issue.severity];
            const Icon = config.icon;
            const involvedPlayers = issue.involvedPlayerIds
              .map((id) => game.players.find((player) => player.id === id))
              .filter(Boolean);

            return (
              <Card key={issue.id}>
                <CardContent className="space-y-2 p-3">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4 flex-shrink-0", config.color)} />
                    <span className={cn("flex-1 text-sm font-semibold", config.color)}>{issue.title || config.label}</span>
                    <Badge variant={config.badgeVariant} className="text-[10px]">{config.label}</Badge>
                  </div>

                  {involvedPlayers.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {involvedPlayers.map((player) => (
                        <Badge key={player!.id} variant="outline" className="text-[10px]">
                          #{player!.seatNumber} {player!.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-foreground/80">{issue.message}</p>
                  {issue.impact && <p className="text-[11px] text-muted-foreground">影响：{issue.impact}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showAdvanced && suspicionScores.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">嫌疑分析</h2>
          {suspicionScores
            .sort((a, b) => b.evilProbability - a.evilProbability)
            .map((score) => {
              const player = game.players.find((entry) => entry.id === score.playerId);
              if (!player) return null;
              const pct = Math.round(score.evilProbability * 100);
              return (
                <Card key={score.playerId}>
                  <CardContent className="flex items-center gap-3 p-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {player.seatNumber}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{player.name}</div>
                      <div className="truncate text-[10px] text-muted-foreground">{score.reasons.join(' · ')}</div>
                    </div>
                    <div
                      className={cn(
                        "text-sm font-bold",
                        pct >= 70 ? "text-red-500" : pct >= 50 ? "text-yellow-500" : "text-green-500",
                      )}
                    >
                      {pct}%
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}
