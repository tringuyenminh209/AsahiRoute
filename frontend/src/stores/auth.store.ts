import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "admin" | "deliverer";

export interface UserSettings {
  lang: "ja" | "en" | "vi" | "zh" | "ko" | "ne";
  font_size: "small" | "medium" | "large" | "extra_large";
  voice_guide: boolean;
  dark_mode: "auto" | "on" | "off";
  onboarding_done: boolean;
}

export interface AuthUser {
  id: number;
  shop_id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  settings: UserSettings;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, user) =>
        set({ token, user, isAuthenticated: true }),

      updateSettings: (settings) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, settings: { ...state.user.settings, ...settings } }
            : null,
        })),

      logout: () =>
        set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: "asahi-auth",
      // token と user のみ永続化
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
