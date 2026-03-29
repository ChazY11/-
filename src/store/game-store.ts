import { create } from 'zustand';
import type { Game, GameMode, Player, SuspicionLevel, StorytellerData, EventType, EventData } from '@clocktower/core';
import { createGame, createPlayer, createEvent, createDefaultStorytellerData, getScriptPack } from '@clocktower/core';
import { saveGame, loadGame, loadAllGames, deleteGame as deleteGameFromDB } from '@/lib/db';

interface GameStore {
  games: Game[];
  currentGameId: string | null;
  isLoading: boolean;
  currentGame: () => Game | undefined;
  loadGames: () => Promise<void>;
  newGame: (name: string, scriptId: string, playerCount: number, mode?: GameMode) => Promise<Game>;
  newGameWithPlayers: (name: string, scriptId: string, playerNames: string[], playerCount?: number, mode?: GameMode) => Promise<Game>;
  selectGame: (id: string) => Promise<void>;
  deleteGame: (id: string) => Promise<void>;
  importGame: (game: Game) => Promise<void>;
  updateCurrentGame: (updates: Partial<Game>) => void;
  setGameMode: (mode: GameMode) => void;
  setStorytellerNotes: (notes: string) => void;
  assignRole: (playerId: string, roleId: string, alignment: 'good' | 'evil') => void;
  setPlayerState: (playerId: string, field: keyof Player['state'], value: boolean) => void;
  addPlayer: (name: string) => void;
  updatePlayer: (playerId: string, updates: Partial<Player>) => void;
  removePlayer: (playerId: string) => void;
  setPlayerSuspicion: (playerId: string, level: SuspicionLevel) => void;
  addEvent: (type: EventType, data: EventData, sourcePlayerId?: string, targetPlayerId?: string) => void;
  removeEvent: (eventId: string) => void;
  undoLastEvent: () => void;
  advancePhase: () => void;
  persist: () => Promise<void>;
}

function updateGameInState(games: Game[], updated: Game) {
  return games.map((game) => (game.id === updated.id ? updated : game));
}

export const useGameStore = create<GameStore>((set, get) => ({
  games: [],
  currentGameId: null,
  isLoading: false,

  currentGame: () => {
    const { games, currentGameId } = get();
    return games.find((game) => game.id === currentGameId);
  },

  loadGames: async () => {
    set({ isLoading: true });
    const games = await loadAllGames();
    set({ games, isLoading: false });
  },

  newGame: async (name, scriptId, playerCount, mode = 'good') => {
    const scriptPack = getScriptPack(scriptId);
    const game = {
      ...createGame(name, scriptId, playerCount, mode),
      scriptName: scriptPack?.zhName ?? scriptId,
    };
    await saveGame(game);
    set((state) => ({
      games: [...state.games, game],
      currentGameId: game.id,
    }));
    return game;
  },

  newGameWithPlayers: async (name, scriptId, playerNames, playerCount, mode = 'good') => {
    const sanitizedNames = playerNames.map((playerName) => playerName.trim()).filter(Boolean);
    const finalPlayerCount = Math.max(playerCount ?? 0, sanitizedNames.length || 0, 5);
    const scriptPack = getScriptPack(scriptId);
    const game = {
      ...createGame(name, scriptId, finalPlayerCount, mode),
      players: sanitizedNames.map((playerName, index) => createPlayer(index + 1, playerName)),
      scriptName: scriptPack?.zhName ?? scriptId,
      lastActiveAt: Date.now(),
      updatedAt: Date.now(),
      storytellerData: createDefaultStorytellerData(),
    };

    await saveGame(game);
    set((state) => ({
      games: [...state.games, game],
      currentGameId: game.id,
    }));
    return game;
  },

  selectGame: async (id) => {
    const game = await loadGame(id);
    if (!game) return;
    set((state) => ({
      games: updateGameInState(state.games, game),
      currentGameId: id,
    }));
  },

  deleteGame: async (id) => {
    await deleteGameFromDB(id);
    set((state) => ({
      games: state.games.filter((game) => game.id !== id),
      currentGameId: state.currentGameId === id ? null : state.currentGameId,
    }));
  },

  importGame: async (game) => {
    const normalizedGame = {
      ...game,
      mode: game.mode ?? 'good',
      storytellerData: game.storytellerData ?? createDefaultStorytellerData(),
    };
    await saveGame(normalizedGame);
    set((state) => ({
      games: [...state.games.filter((entry) => entry.id !== normalizedGame.id), normalizedGame],
      currentGameId: normalizedGame.id,
    }));
  },

  updateCurrentGame: (updates) => {
    const game = get().currentGame();
    if (!game) return;
    const updated = {
      ...game,
      ...updates,
      updatedAt: Date.now(),
      lastActiveAt: Date.now(),
    };
    set((state) => ({
      games: updateGameInState(state.games, updated),
    }));
    get().persist();
  },

  setGameMode: (mode) => {
    get().updateCurrentGame({ mode });
  },

  setStorytellerNotes: (notes) => {
    const game = get().currentGame();
    if (!game) return;
    get().updateCurrentGame({
      storytellerData: {
        ...(game.storytellerData ?? createDefaultStorytellerData()),
        grimNotes: notes,
      },
    });
  },

  assignRole: (playerId, roleId, alignment) => {
    const game = get().currentGame();
    if (!game) return;
    const sd: StorytellerData = game.storytellerData ?? createDefaultStorytellerData();
    sd.roleAssignments = { ...sd.roleAssignments, [playerId]: roleId };
    const updated = {
      ...game,
      storytellerData: sd,
      players: game.players.map(p => p.id === playerId ? { ...p, actualRole: roleId, actualAlignment: alignment } : p),
      updatedAt: Date.now(),
    };
    set(state => ({ games: updateGameInState(state.games, updated) }));
    get().persist();
  },

  setPlayerState: (playerId, field, value) => {
    const game = get().currentGame();
    if (!game) return;
    const updated = {
      ...game,
      players: game.players.map(p => p.id === playerId ? { ...p, state: { ...p.state, [field]: value } } : p),
      updatedAt: Date.now(),
    };
    set(state => ({ games: updateGameInState(state.games, updated) }));
    get().persist();
  },

  addPlayer: (name) => {
    const game = get().currentGame();
    if (!game) return;
    const seatNumber = game.players.length + 1;
    const player = createPlayer(seatNumber, name);
    const updated = {
      ...game,
      players: [...game.players, player],
      updatedAt: Date.now(),
    };
    set((state) => ({
      games: updateGameInState(state.games, updated),
    }));
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
    set((state) => ({
      games: updateGameInState(state.games, updated),
    }));
    get().persist();
  },

  removePlayer: (playerId) => {
    const game = get().currentGame();
    if (!game) return;
    const updated = {
      ...game,
      players: game.players
        .filter((player) => player.id !== playerId)
        .map((player, index) => ({ ...player, seatNumber: index + 1 })),
      updatedAt: Date.now(),
    };
    set((state) => ({
      games: updateGameInState(state.games, updated),
    }));
    get().persist();
  },

  setPlayerSuspicion: (playerId, level) => {
    get().updatePlayer(playerId, { suspicion: level });
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
    set((state) => ({
      games: updateGameInState(state.games, updated),
    }));
    get().persist();
  },

  removeEvent: (eventId) => {
    const game = get().currentGame();
    if (!game) return;
    const updated = {
      ...game,
      events: game.events.filter((event) => event.id !== eventId),
      updatedAt: Date.now(),
    };
    set((state) => ({
      games: updateGameInState(state.games, updated),
    }));
    get().persist();
  },

  undoLastEvent: () => {
    const game = get().currentGame();
    if (!game || game.events.length === 0) return;
    const updated = {
      ...game,
      events: game.events.slice(0, -1),
      updatedAt: Date.now(),
    };
    set((state) => ({
      games: updateGameInState(state.games, updated),
    }));
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

    const updated = {
      ...game,
      currentPhase,
      currentDay,
      currentNight,
      lastActiveAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => ({
      games: updateGameInState(state.games, updated),
    }));
    get().persist();
  },

  persist: async () => {
    const game = get().currentGame();
    if (game) {
      await saveGame(game);
    }
  },
}));
