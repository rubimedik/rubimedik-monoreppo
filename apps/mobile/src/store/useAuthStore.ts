import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole } from '@repo/shared';

interface User {
  id: string;
  email: string;
  roles: UserRole[];
  activeRole: UserRole;
  referralCode: string;
  specialistProfile?: any;
  hospitalProfile?: any;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  hasSeenOnboarding: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setActiveRole: (role: UserRole) => void;
  setUser: (user: User | null) => void;
  setHydrated: (state: boolean) => void;
  setHasSeenOnboarding: (state: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isHydrated: false,
      hasSeenOnboarding: false,
      setAuth: (user, accessToken, refreshToken) => 
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      setTokens: (accessToken, refreshToken) => 
        set({ accessToken, refreshToken }),
      setActiveRole: (role) => 
        set((state) => ({
          user: state.user ? { ...state.user, activeRole: role } : null
        })),
      setUser: (user) => set({ user }),
      setHydrated: (state) => set({ isHydrated: state }),
      setHasSeenOnboarding: (state) => set({ hasSeenOnboarding: state }),
      logout: () => 
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: (state) => {
        return () => state.setHydrated(true);
      }
    }
  )
);
