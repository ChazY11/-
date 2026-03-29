"use client";

import { useRef } from 'react';
import { useSettingsStore } from '@/store/settings-store';
import { useGameStore } from '@/store/game-store';
import type { GameMode } from '@clocktower/core';
import { exportAllData, importData, clearAllGames } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Download, Upload, Trash2, Sun, Moon, Eye, Sparkles, ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils';

const modeOptions: { value: GameMode; label: string; description: string }[] = [
  { value: 'good', label: '正派视角', description: '只显示公开信息。' },
  { value: 'evil', label: '反派视角', description: '保留公开信息，用于反派协作推演。' },
  { value: 'storyteller', label: '说书人视角', description: '可见真实角色、私密状态和隐藏备注。' },
];

export default function SettingsPage() {
  const { theme, setTheme, showAdvancedLogic, toggleAdvancedLogic } = useSettingsStore();
  const currentGame = useGameStore((s) => s.currentGame)();
  const loadGames = useGameStore((s) => s.loadGames);
  const setGameMode = useGameStore((s) => s.setGameMode);
  const setStorytellerNotes = useGameStore((s) => s.setStorytellerNotes);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    const json = await exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clocktower-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await importData(text);
    await loadGames();
    if (fileInputRef.current) fileInputRef.current.value = '';
    alert('导入成功');
  };

  const handleClear = async () => {
    if (!confirm('确定要清空所有本地数据吗？此操作不可撤销。')) return;
    await clearAllGames();
    await loadGames();
    alert('数据已清空');
  };

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold">设置</h1>

      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            <div>
              <div className="text-sm font-medium">主题</div>
              <div className="text-xs text-muted-foreground">{theme === 'dark' ? '深色模式' : '浅色模式'}</div>
            </div>
          </div>
          <Switch checked={theme === 'light'} onCheckedChange={(checked) => setTheme(checked ? 'light' : 'dark')} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5" />
            <div>
              <div className="text-sm font-medium">高级逻辑提示</div>
              <div className="text-xs text-muted-foreground">显示更详细的逻辑推理信息。</div>
            </div>
          </div>
          <Switch checked={showAdvancedLogic} onCheckedChange={toggleAdvancedLogic} />
        </CardContent>
      </Card>

      {currentGame && (
        <>
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">当前对局模式</h2>
            <Card>
              <CardContent className="space-y-2 p-3">
                {modeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setGameMode(option.value)}
                    className={cn(
                      "w-full rounded-xl border px-3 py-2 text-left transition-colors",
                      currentGame.mode === option.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-sm font-medium">{option.label}</span>
                    </div>
                    <div className="mt-1 text-[11px] opacity-85">{option.description}</div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {currentGame.mode === 'storyteller' && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">说书人隐藏备注</h2>
              <Card>
                <CardContent className="space-y-2 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ScrollText className="h-4 w-4" />
                    这里只在说书人视角下使用，用于记录开局与夜晚安排。
                  </div>
                  <textarea
                    value={currentGame.storytellerData?.grimNotes ?? ''}
                    onChange={(e) => setStorytellerNotes(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-lg border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="记录真实配置、夜晚信息或隐藏提醒..."
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">数据管理</h2>
        <Card>
          <CardContent className="space-y-2 p-3">
            <Button variant="outline" className="w-full justify-start" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              导出 JSON
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              导入 JSON
            </Button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            <Button variant="destructive" className="w-full justify-start" onClick={handleClear}>
              <Trash2 className="mr-2 h-4 w-4" />
              清空所有数据
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-1 pb-2 pt-6 text-center text-xs text-muted-foreground">
        <p>血染钟楼 · 逻辑助手 v0.5 alpha</p>
        <p>支持暗流涌动与梦殒春宵基础开局</p>
        <p className="pt-1 text-muted-foreground/60">由 Chaz 开发</p>
      </div>
    </div>
  );
}
