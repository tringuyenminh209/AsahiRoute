import api from "../lib/api";
import { AuthUser, UserSettings } from "../stores/auth.store";

export interface LoginPayload {
  email: string;
  password: string;
  device_name?: string;
}

export interface LoginResponse {
  token: string;
  token_type: string;
  expires_at: string;
  user: AuthUser;
}

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const res = await api.post<{ success: boolean; data: LoginResponse }>("/auth/login", {
      ...payload,
      device_name: payload.device_name ?? navigator.userAgent,
    });
    return res.data.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },

  async me(): Promise<AuthUser> {
    const res = await api.get<{ success: boolean; data: AuthUser }>("/auth/me");
    return res.data.data;
  },

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const res = await api.put<{ success: boolean; data: { settings: UserSettings } }>(
      "/auth/settings",
      settings
    );
    return res.data.data.settings;
  },
};
