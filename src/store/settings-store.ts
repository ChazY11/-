import { create } from 'zustand';
import { saveSetting, loadSetting } from '@/lib/db';

interface SettingsStore {
  theme: 'dark' | 'light';
  showAdvancedLogic: boolean;
  isLoaded: boolean;

  loadSettings: () => Promise<void>;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleAdvancedLogic: () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  theme: 'dark',
  showAdvancedLogic: false,
  isLoaded: false,

  loadSettings: async () => {
    const theme = await loadSetting<'dark' | 'light'>('theme');
    const showAdvancedLogic = await loadSetting<boolean>('showAdvancedLogic');
    set({
      theme: theme ?? 'dark',
      showAdvancedLogic: showAdvancedLogic ?? false,
      isLoaded: true,
    });
    // Apply theme
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  },

  setTheme: (theme) => {
    set({ theme });
    saveSetting('theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  },

  toggleAdvancedLogic: () => {
    const next = !get().showAdvancedLogic;
    set({ showAdvancedLogic: next });
    saveSetting('showAdvancedLogic', next);
  },
}));
