import { create } from 'zustand';
import Taro from '@tarojs/taro';
import type {
  Game, GameMode, Player, SuspicionLevel, StorytellerData, LiveRoom,
  EventType, EventData, NightAction,
} from '@clocktower/core';
import {
  createGame, createPlayer, createEvent, createDefaultStorytellerData,
  getScriptPack, demoGame,
} from '@clocktower/core';

const STORAGE_KEY = 'clocktower_games';
const CURRENT_KEY = 'clocktower_current_game_id';

function loadGamesFromStorage(): Game[] {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGamesToStorage(games: Game[]) {
  try {
    Taro.setStorageSync(STORAGE_KEY, JSON.stringify(games));
  } catch {
    // Keep the in-memory state even if persistence fails.
  }
}

interface GameStore {
  games: Game[];
  currentGameId: string | null;
  currentGame: () => Game | undefined;
  loadGames: () => void;
  newGame: (name: string, scriptId: string, playerCount: number, mode?: GameMode) => Game;
  newGameWithPlayers: (name: string, scriptId: string, playerNames: string[], playerCount?: number, mode?: GameMode) => Game;
  selectGame: (id: string | null) => void;
  deleteGame: (id: string) => void;
  clearCurrentGame: () => void;
  clearAllGames: () => void;
  importGame: (game: Game) => void;
  importLiveReplay: (room: LiveRoom, mode?: GameMode) => Game;
  importDemoGame: () => void;
  addPlayer: (name: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  removePlayer: (playerId: string) => void;
  setPlayerSuspicion: (playerId: string, level: SuspicionLevel) => void;
  setGameMode: (mode: GameMode) => void;
  assignRole: (playerId: string, roleId: string, alignment: 'good' | 'evil') => void;
  setPlayerState: (playerId: string, field: keyof Player['state'], value: boolean) => void;
  setStorytellerNotes: (notes: string) => void;
  addNightAction: (action: Omit<NightAction, 'id'>) => void;
  addEvent: (type: EventType, data: EventData, sourcePlayerId?: string, targetPlayerId?: string) => void;
  removeEvent: (eventId: string) => void;
  undoLastEvent: () => void;
  advancePhase: () => void;
  persist: () => void;
}

function updateGame(games: Game[], updated: Game) {
  return games.map((game) => (game.id === updated.id ? updated : game));
}

function saveCurrentGameId(id: string | null) {
  if (id) Taro.setStorageSync(CURRENT_KEY, id);
  else Taro.removeStorageSync(CURRENT_KEY);
}

function createReplayGameFromLiveRoom(room: LiveRoom, mode: GameMode): Game {
  const baseGame = createGame(
    `${room.scriptName ?? room.scriptId} 复盘`,
    room.scriptId,
    room.playerCount,
    mode,
  );

  const memberIdToPlayerId: Record<string, string> = {};
  const players = room.seats.map((seat) => {
    const member = room.members.find((entry) => entry.memberId === seat.memberId);
    const identity = member ? room.identityDeliveries[member.memberId] : undefined;
    const player = createPlayer(seat.seatNumber, member?.name ?? `玩家${seat.seatNumber}`);
    if (member) memberIdToPlayerId[member.memberId] = player.id;
    return {
      ...player,
      isAlive: member?.liveState.isAlive ?? true,
      actualRole: identity?.roleId,
      actualAlignment: identity?.alignment ?? 'good',
      privateNotes: member?.liveState.statusTags.join(' / ') || '',
      state: {
        ...player.state,
        poisoned: member?.liveState.poisoned ?? false,
        usedAbility: false,
      },
    };
  });

  const storytellerData = createDefaultStorytellerData();
  storytellerData.roleAssignments = Object.fromEntries(
    Object.entries(room.identityDeliveries).map(([memberId, delivery]) => [memberIdToPlayerId[memberId] ?? memberId, delivery.roleId]),
  );
  storytellerData.grimNotes = room.logs
    .slice(-12)
    .map((log) => `${new Date(log.createdAt).toLocaleString()}: ${log.summary}`)
    .join('\n');

  const publicDayChain = room.logs
    .filter((log) => log.visibility === 'public' && (
      log.eventType === 'day_phase_started'
      || log.eventType === 'day_public_state_updated'
      || log.eventType === 'day_nomination_recorded'
      || log.eventType === 'day_nomination_resolved'
      || log.eventType === 'day_execution_recorded'
      || log.eventType === 'day_phase_completed'
    ))
    .slice(-12)
    .map((log) => `[${log.eventType}] ${log.summary}`)
    .join('\n');

  if (publicDayChain) {
    storytellerData.grimNotes = `${storytellerData.grimNotes}\n\n白天公开链\n${publicDayChain}`.trim();
  }

  const events = room.logs.map((log) => createEvent(
    'note',
    log.dayNumber ?? log.nightNumber ?? 0,
    room.currentPhase === 'finished' ? 'finished' : room.currentPhase,
    { text: `[${log.eventType}] ${log.summary}` },
  ));

  if (room.outcome) {
    events.push(createEvent(
      'note',
      room.currentDay || room.currentNight || 0,
      'finished',
      { text: `[game_finished] ${room.outcome.victoryAlignment} 胜利：${room.outcome.reason}${room.outcome.note ? `；备注：${room.outcome.note}` : ''}` },
    ));
  }

  if (room.archiveSeed) {
    events.push(createEvent(
      'note',
      room.currentDay || room.currentNight || 0,
      'finished',
      { text: `[archive] ${room.archiveSeed.archiveId} / 事件数 ${room.archiveSeed.eventCount} / 公开事件 ${room.archiveSeed.publicEventCount}${room.archiveSeed.finalSummary ? ` / ${room.archiveSeed.finalSummary}` : ''}` },
    ));
  }

  return {
    ...baseGame,
    name: `${room.scriptName ?? room.scriptId} 复盘 ${new Date().toLocaleDateString()}`,
    scriptName: room.scriptName,
    players,
    events,
    currentPhase: 'finished',
    currentDay: room.currentDay,
    currentNight: room.currentNight,
    storytellerData,
    lastActiveAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  games: [],
  currentGameId: null,

  currentGame: () => {
    const { games, currentGameId } = get();
    return games.find((game) => game.id === currentGameId);
  },

  loadGames: () => {
    const games = loadGamesFromStorage();
    const currentGameId = Taro.getStorageSync(CURRENT_KEY) || null;
    set({ games, currentGameId });
  },

  newGame: (name, scriptId, playerCount, mode = 'good') => {
    const scriptPack = getScriptPack(scriptId);
    const game: Game = {
      ...createGame(name, scriptId, playerCount, mode),
      scriptName: scriptPack?.zhName ?? scriptId,
      storytellerData: createDefaultStorytellerData(),
    };
    set((state) => ({ games: [...state.games, game], currentGameId: game.id }));
    saveCurrentGameId(game.id);
    get().persist();
    return game;
  },

  newGameWithPlayers: (name, scriptId, playerNames, playerCount, mode = 'good') => {
    const names = playerNames.map((playerName) => playerName.trim()).filter(Boolean);
    const count = Math.max(playerCount ?? 0, names.length || 0, 5);
    const scriptPack = getScriptPack(scriptId);
    const game: Game = {
      ...createGame(name, scriptId, count, mode),
      players: names.map((playerName, index) => createPlayer(index + 1, playerName)),
      scriptName: scriptPack?.zhName ?? scriptId,
      storytellerData: createDefaultStorytellerData(),
      lastActiveAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => ({ games: [...state.games, game], currentGameId: game.id }));
    saveCurrentGameId(game.id);
    get().persist();
    return game;
  },

  selectGame: (id) => {
    set({ currentGameId: id });
    saveCurrentGameId(id);
  },

  deleteGame: (id) => {
    const nextCurrentId = get().currentGameId === id ? null : get().currentGameId;
    set((state) => ({
      games: state.games.filter((game) => game.id !== id),
      currentGameId: nextCurrentId,
    }));
    saveCurrentGameId(nextCurrentId);
    get().persist();
  },

  clearCurrentGame: () => {
    const currentGameId = get().currentGameId;
    if (!currentGameId) return;
    get().deleteGame(currentGameId);
  },

  clearAllGames: () => {
    set({ games: [], currentGameId: null });
    saveCurrentGameId(null);
    saveGamesToStorage([]);
  },

  importGame: (game) => {
    const normalizedGame: Game = {
      ...game,
      mode: game.mode ?? 'good',
      storytellerData: game.storytellerData ?? createDefaultStorytellerData(),
      lastActiveAt: game.lastActiveAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => ({
      games: [...state.games.filter((entry) => entry.id !== normalizedGame.id), normalizedGame],
      currentGameId: normalizedGame.id,
    }));
    saveCurrentGameId(normalizedGame.id);
    get().persist();
  },

  importLiveReplay: (room, mode = 'storyteller') => {
    const replayGame = createReplayGameFromLiveRoom(room, mode);
    get().importGame(replayGame);
    return replayGame;
  },

  importDemoGame: () => {
    get().importGame({
      ...demoGame,
      id: `demo-${Date.now()}`,
      name: `${demoGame.name} ${new Date().toLocaleTimeString()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastActiveAt: Date.now(),
    });
  },

  addPlayer: (name) => {
    const game = get().currentGame();
    if (!game) return;
    const player = createPlayer(game.players.length + 1, name);
    const updated = { ...game, players: [...game.players, player], updatedAt: Date.now() };
    set((state) => ({ games: updateGame(state.games, updated) }));
    get().persist();
  },

  updatePlayer: (playerId, updates) => {
    const game = get().currentGame();
    if (!game) return;
    const updated = {
      ...game,
      players: game.players.map((player) => (player.id === playerId ? { ...player, ...updates } : player)),
      updatedAt: Date.now(),
    };
    set((state) => ({ games: updateGame(state.games, updated) }));
    get().persist();
  },

  removePlayer: (playerId) => {
    const game = get().currentGame();
    if (!game) return;
    const updated = {
      ...game,
      players: game.players.filter((player) => player.id !== playerId).map((player, index) => ({ ...player, seatNumber: index + 1 })),
      updatedAt: Date.now(),
    };
    set((state) => ({ games: updateGame(state.games, updated) }));
    get().persist();
  },

  setPlayerSuspicion: (playerId, level) => {
    get().updatePlayer(playerId, { suspicion: level });
  },

  setGameMode: (mode) => {
    const game = get().currentGame();
    if (!game) return;
    const updated = { ...game, mode, updatedAt: Date.now() };
    set((state) => ({ games: updateGame(state.games, updated) }));
    get().persist();
  },

  assignRole: (playerId, roleId, alignment) => {
    const game = get().currentGame();
    if (!game) return;
    const storytellerData: StorytellerData = game.storytellerData ?? createDefaultStorytellerData();
    storytellerData.roleAssignments = { ...storytellerData.roleAssignments, [playerId]: roleId };
    const updated = {
      ...game,
      storytellerData,
      players: game.players.map((player) => player.id === playerId ? { ...player, actualRole: roleId, actualAlignment: alignment } : player),
      updatedAt: Date.now(),
    };
    set((state) => ({ games: updateGame(state.games, updated) }));
    get().persist();
  },

  setPlayerState: (playerId, field, value) => {
    const game = get().currentGame();
    if (!game) return;
    const updated = {
      ...game,
      players: game.players.map((player) => (
        player.id === playerId ? { ...player, state: { ...player.state, [field]: value } } : player
      )),
      updatedAt: Date.now(),
    };
    set((state) => ({ games: updateGame(state.games, updated) }));
    get().persist();
  },

  setStorytellerNotes: (notes) => {
    const game = get().currentGame();
    if (!game) return;
    const updated = {
      ...game,
      storytellerData: { ...(game.storytellerData ?? createDefaultStorytellerData()), grimNotes: notes },
      updatedAt: Date.now(),
    };
    set((state) => ({ games: updateGame(state.games, updated) }));
    get().persist();
  },

  addNightAction: (action) => {
    const game = get().currentGame();
    if (!game) return;
    const storytellerData = game.storytellerData ?? createDefaultStorytellerData();
    const nextAction: NightAction = {
      ...action,
      id: `night-action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };
    const updated = {
      ...game,
      storytellerData: {
        ...storytellerData,
        nightActions: [...storytellerData.nightActions, nextAction],
      },
      updatedAt: Date.now(),
      lastActiveAt: Date.now(),
    };
    set((state) => ({ games: updateGame(state.games, updated) }));
    get().persist();
  },

  addEvent: (type, data, sourcePlayerId, targetPlayerId) => {
    const game = get().currentGame();
    if (!game) return;
    const event = createEvent(
      type,
      game.currentPhase === 'night' ? game.currentNight : game.currentDay,
      game.currentPhase,
      data,
      sourcePlayerId,
      targetPlayerId,
    );
    const updated = {
      ...game,
      events: [...game.events, event],
      lastActiveAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => ({ games: updateGame(state.games, updated) }));
    get().persist();
  },

  removeEvent: (eventId) => {
    const game = get().currentGame();
    if (!game) return;
    const updated = { ...game, events: game.events.filter((event) => event.id !== eventId), updatedAt: Date.now() };
    set((state) => ({ games: updateGame(state.games, updated) }));
    get().persist();
  },

  undoLastEvent: () => {
    const game = get().currentGame();
    if (!game || game.events.length === 0) return;
    const updated = { ...game, events: game.events.slice(0, -1), updatedAt: Date.now() };
    set((state) => ({ games: updateGame(state.games, updated) }));
    get().persist();
  },

  advancePhase: () => {
    const game = get().currentGame();
    if (!game) return;
    let { currentPhase, currentDay, currentNight } = game;
    if (currentPhase === 'setup') {
      currentPhase = 'night';
      currentNight = 1;
    } else if (currentPhase === 'night') {
      currentPhase = 'day';
      currentDay = currentNight;
    } else if (currentPhase === 'day') {
      currentPhase = 'night';
      currentNight = currentDay + 1;
    }
    const updated = { ...game, currentPhase, currentDay, currentNight, lastActiveAt: Date.now(), updatedAt: Date.now() };
    set((state) => ({ games: updateGame(state.games, updated) }));
    get().persist();
  },

  persist: () => {
    saveGamesToStorage(get().games);
  },
}));
