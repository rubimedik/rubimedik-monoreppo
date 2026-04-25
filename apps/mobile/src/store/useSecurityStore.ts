import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

interface SecurityState {
  isPinEnabled: boolean;
  isBiometricsEnabled: boolean;
  lastLockTime: number | null;
  supportedBiometrics: LocalAuthentication.AuthenticationType[];
  setIsPinEnabled: (enabled: boolean) => void;
  setIsBiometricsEnabled: (enabled: boolean) => void;
  setLastLockTime: (time: number | null) => void;
  setSupportedBiometrics: (types: LocalAuthentication.AuthenticationType[]) => void;
  savePin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  authenticate: () => Promise<boolean>;
}

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set, get) => ({
      isPinEnabled: false,
      isBiometricsEnabled: false,
      lastLockTime: null,
      supportedBiometrics: [],
      setIsPinEnabled: (enabled) => set({ isPinEnabled: enabled }),
      setIsBiometricsEnabled: (enabled) => set({ isBiometricsEnabled: enabled }),
      setLastLockTime: (time) => set({ lastLockTime: time }),
      setSupportedBiometrics: (types) => set({ supportedBiometrics: types }),
      
      savePin: async (pin: string) => {
        await SecureStore.setItemAsync('user_pin', pin);
        set({ isPinEnabled: true });
      },

      verifyPin: async (pin: string) => {
        const savedPin = await SecureStore.getItemAsync('user_pin');
        return savedPin === pin;
      },

      authenticate: async () => {
        const { isBiometricsEnabled } = get();
        if (!isBiometricsEnabled) return false;

        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (hasHardware && isEnrolled) {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to unlock RubiMedik',
                fallbackLabel: 'Use PIN',
                cancelLabel: 'Cancel',
                disableDeviceFallback: false,
            });
            return result.success;
        }
        return false;
      }
    }),
    {
      name: 'security-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
