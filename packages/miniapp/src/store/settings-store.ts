import { create } from 'zustand';
import Taro from '@tarojs/taro';

const SETTINGS_KEY = 'clocktower_settings';

interface MiniappSettings {
  showAdvancedLogic: boolean;
}

interface SettingsStore extends MiniappSettings {
  loadSettings: () => void;
  toggleAdvancedLogic: () => void;
}

function loadStoredSettings(): MiniappSettings {
  try {
    const raw = Taro.getStorageSync(SETTINGS_KEY);
    return {
      showAdvancedLogic: raw?.showAdvancedLogic ?? false,
    };
  } catch {
    return {
      showAdvancedLogic: false,
    };
  }
}

function persistSettings(settings: MiniappSettings) {
  try {
    Taro.setStorageSync(SETTINGS_KEY, settings);
  } catch {
    // Ignore storage errors and keep the in-memory value.
  }
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  showAdvancedLogic: false,

  loadSettings: () => {
    set(loadStoredSettings());
  },

  toggleAdvancedLogic: () => {
    const next = !get().showAdvancedLogic;
    const settings = { showAdvancedLogic: next };
    set(settings);
    persistSettings(settings);
  },
}));
