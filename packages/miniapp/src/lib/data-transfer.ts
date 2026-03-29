import type { Game } from '@clocktower/core';
import { createDefaultStorytellerData, getScriptPack } from '@clocktower/core';

export interface ImportPayload {
  games: Game[];
  scope: 'single' | 'multiple';
}

export function exportCurrentGame(game: Game): string {
  return JSON.stringify({
    type: 'clocktower-game',
    version: 1,
    game,
  }, null, 2);
}

export function exportAllGames(games: Game[]): string {
  return JSON.stringify({
    type: 'clocktower-backup',
    version: 1,
    games,
  }, null, 2);
}

function normalizeGame(input: unknown): Game {
  if (!input || typeof input !== 'object') {
    throw new Error('数据格式错误: 找不到有效对局对象');
  }

  const game = input as Partial<Game>;
  if (!game.id || !game.name || !game.scriptId) {
    throw new Error('数据格式错误: 对局缺少 id、name 或 scriptId');
  }

  const scriptPack = getScriptPack(game.scriptId);
  if (!scriptPack) {
    throw new Error(`脚本不兼容: 未找到脚本 ${game.scriptId}`);
  }

  return {
    id: game.id,
    name: game.name,
    scriptId: game.scriptId,
    scriptName: scriptPack.zhName,
    playerCount: Number(game.playerCount ?? 0),
    players: Array.isArray(game.players) ? game.players : [],
    events: Array.isArray(game.events) ? game.events : [],
    currentPhase: game.currentPhase ?? 'setup',
    currentDay: Number(game.currentDay ?? 0),
    currentNight: Number(game.currentNight ?? 0),
    lastActiveAt: Number(game.lastActiveAt ?? Date.now()),
    mode: game.mode ?? 'good',
    storytellerData: game.storytellerData ?? createDefaultStorytellerData(),
    createdAt: Number(game.createdAt ?? Date.now()),
    updatedAt: Number(game.updatedAt ?? Date.now()),
  };
}

export function parseImportText(text: string): ImportPayload {
  if (!text.trim()) {
    throw new Error('空数据状态: 请输入要导入的 JSON');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('导入失败: JSON 格式不正确');
  }

  if (Array.isArray(parsed)) {
    return {
      scope: 'multiple',
      games: parsed.map(normalizeGame),
    };
  }

  if (parsed && typeof parsed === 'object') {
    const record = parsed as Record<string, unknown>;
    if (record.type === 'clocktower-game' && record.game) {
      return {
        scope: 'single',
        games: [normalizeGame(record.game)],
      };
    }
    if (record.type === 'clocktower-backup' && Array.isArray(record.games)) {
      return {
        scope: record.games.length <= 1 ? 'single' : 'multiple',
        games: record.games.map(normalizeGame),
      };
    }
    if ('scriptId' in record && 'players' in record) {
      return {
        scope: 'single',
        games: [normalizeGame(record)],
      };
    }
  }

  throw new Error('数据格式错误: 无法识别导入内容');
}
