"use client";

import { useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Swords, ScrollText, Brain, GitBranch, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/store/game-store';

const tabs = [
  { path: '/game', label: '对局', icon: Swords, requiresGame: false },
  { path: '/events', label: '事件', icon: ScrollText, requiresGame: true },
  { path: '/logic', label: '逻辑', icon: Brain, requiresGame: true },
  { path: '/worlds', label: '世界线', icon: GitBranch, requiresGame: true },
  { path: '/settings', label: '设置', icon: Settings, requiresGame: false },
];

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const hasActiveGame = useGameStore((s) => s.currentGameId !== null);
  const [toast, setToast] = useState('');

  const handleTab = useCallback(
    (tab: typeof tabs[number]) => {
      if (tab.requiresGame && !hasActiveGame) {
        setToast('请先创建或进入一个对局');
        setTimeout(() => setToast(''), 2000);
        return;
      }
      router.push(tab.path);
    },
    [hasActiveGame, router],
  );

  return (
    <>
      {toast && (
        <div className="pointer-events-none fixed bottom-20 left-4 right-4 z-50 flex justify-center duration-200 animate-in fade-in slide-in-from-bottom-2">
          <div className="rounded-lg border bg-card px-4 py-2.5 text-sm shadow-lg">{toast}</div>
        </div>
      )}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-md">
        <div className="flex items-stretch justify-around" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {tabs.map((tab) => {
            const isActive = pathname === tab.path || pathname.startsWith(`${tab.path}/`);
            const isDisabled = tab.requiresGame && !hasActiveGame;
            const Icon = tab.icon;
            return (
              <button
                key={tab.path}
                onClick={() => handleTab(tab)}
                className={cn(
                  "relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 pb-1 pt-2 transition-colors",
                  isActive && !isDisabled && "text-primary",
                  isDisabled && "text-muted-foreground/40",
                  !isActive && !isDisabled && "text-muted-foreground active:text-foreground",
                )}
              >
                {isActive && !isDisabled && <div className="absolute left-1/4 right-1/4 top-0 h-0.5 rounded-full bg-primary" />}
                <Icon className={cn("h-5 w-5", isActive && !isDisabled && "scale-110")} />
                <span className={cn("text-[11px] leading-none", isActive && !isDisabled && "font-semibold")}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
