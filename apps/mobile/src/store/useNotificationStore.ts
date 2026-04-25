import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationSettings {
  pushAppointments: boolean;
  pushChat: boolean;
  pushPromotions: boolean;
  emailReports: boolean;
  emailSecurity: boolean;
}

interface NotificationState {
  settings: NotificationSettings;
  updateSetting: (key: keyof NotificationSettings, value: boolean) => Promise<void>;
  setSettings: (settings: NotificationSettings) => void;
  syncWithBackend: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      settings: {
        pushAppointments: true,
        pushChat: true,
        pushPromotions: false,
        emailReports: true,
        emailSecurity: true,
      },
      updateSetting: async (key, value) => {
        set((state) => ({
          settings: { ...state.settings, [key]: value }
        }));
        
        try {
          const { api } = await import('../services/api');
          await api.patch('/users/me', { [key]: value });
        } catch (error) {
          console.error('Failed to sync notification setting:', error);
        }
      },
      setSettings: (settings) => set({ settings }),
      syncWithBackend: async () => {
        try {
          const { api } = await import('../services/api');
          const res = await api.get('/users/me');
          const user = res.data;
          if (user) {
            set({
              settings: {
                pushAppointments: user.pushAppointments ?? true,
                pushChat: user.pushChat ?? true,
                pushPromotions: user.pushPromotions ?? false,
                emailReports: user.emailReports ?? true,
                emailSecurity: user.emailSecurity ?? true,
              }
            });
          }
        } catch (error) {
          console.error('Failed to fetch notification settings:', error);
        }
      }
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
