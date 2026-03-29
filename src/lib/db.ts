import { openDB, type IDBPDatabase } from 'idb';
import type { Game } from '@clocktower/core';

const DB_NAME = 'clocktower';
const DB_VERSION = 1;
const GAMES_STORE = 'games';
const SETTINGS_STORE = 'settings';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(GAMES_STORE)) {
          db.createObjectStore(GAMES_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE);
        }
      },
    });
  }
  return dbPromise;
}

// Games
export async function saveGame(game: Game): Promise<void> {
  const db = await getDB();
  await db.put(GAMES_STORE, { ...game, updatedAt: Date.now() });
}

export async function loadGame(id: string): Promise<Game | undefined> {
  const db = await getDB();
  return db.get(GAMES_STORE, id);
}

export async function loadAllGames(): Promise<Game[]> {
  const db = await getDB();
  return db.getAll(GAMES_STORE);
}

export async function deleteGame(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(GAMES_STORE, id);
}

export async function clearAllGames(): Promise<void> {
  const db = await getDB();
  await db.clear(GAMES_STORE);
}

// Settings
export async function saveSetting(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put(SETTINGS_STORE, value, key);
}

export async function loadSetting<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  return db.get(SETTINGS_STORE, key);
}

// Export / Import
export async function exportAllData(): Promise<string> {
  const db = await getDB();
  const games = await db.getAll(GAMES_STORE);
  const keys = await db.getAllKeys(SETTINGS_STORE);
  const settings: Record<string, unknown> = {};
  for (const key of keys) {
    settings[String(key)] = await db.get(SETTINGS_STORE, key);
  }
  return JSON.stringify({ games, settings, exportedAt: Date.now() }, null, 2);
}

export async function importData(jsonStr: string): Promise<void> {
  const data = JSON.parse(jsonStr);
  const db = await getDB();
  if (data.games) {
    const tx = db.transaction(GAMES_STORE, 'readwrite');
    for (const game of data.games) {
      await tx.store.put(game);
    }
    await tx.done;
  }
  if (data.settings) {
    const tx = db.transaction(SETTINGS_STORE, 'readwrite');
    for (const [key, value] of Object.entries(data.settings)) {
      await tx.store.put(value, key);
    }
    await tx.done;
  }
}
