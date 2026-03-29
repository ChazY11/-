"use client";

import { useEffect } from 'react';
import { TabBar } from './tab-bar';
import { ServiceWorkerRegister } from './sw-register';
import { useSettingsStore } from '@/store/settings-store';
import { useGameStore } from '@/store/game-store';

export function AppShell({ children }: { children: React.ReactNode }) {
  const loadSettings = useSettingsStore(s => s.loadSettings);
  const loadGames = useGameStore(s => s.loadGames);

  useEffect(() => {
    loadSettings();
    loadGames();
  }, [loadSettings, loadGames]);

  return (
    <div className="flex flex-col h-dvh">
      <ServiceWorkerRegister />
      <main className="flex-1 overflow-y-auto pb-16">
        {children}
      </main>
      <TabBar />
    </div>
  );
}
