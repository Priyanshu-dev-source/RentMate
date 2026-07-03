import { create } from "zustand";
import { api } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "OWNER" | "TENANT" | "ADMIN";
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: Record<string, string>) => Promise<User>;
  register: (data: Record<string, string>) => Promise<User>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<User | null>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Listen for the custom logout event from our api interceptor (401 handle)
  if (typeof window !== "undefined") {
    window.addEventListener("rentmate_logout", () => {
      set({ user: null, token: null, isAuthenticated: false, error: null });
    });
  }

  return {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (credentials) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post("/api/v1/auth/login", credentials);
        const { user, tokens } = response.data.data;

        localStorage.setItem("rentmate_token", tokens.accessToken);
        localStorage.setItem("rentmate_refresh_token", tokens.refreshToken);
        localStorage.setItem("rentmate_user", JSON.stringify(user));

        set({
          user,
          token: tokens.accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
        return user;
      } catch (err: any) {
        const errMsg = err.response?.data?.message || "Failed to log in";
        set({ error: errMsg, isLoading: false });
        throw new Error(errMsg);
      }
    },

    register: async (signupData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post("/api/v1/auth/register", signupData);
        const { user, tokens } = response.data.data;

        localStorage.setItem("rentmate_token", tokens.accessToken);
        localStorage.setItem("rentmate_refresh_token", tokens.refreshToken);
        localStorage.setItem("rentmate_user", JSON.stringify(user));

        set({
          user,
          token: tokens.accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
        return user;
      } catch (err: any) {
        const errMsg = err.response?.data?.message || "Failed to create account";
        set({ error: errMsg, isLoading: false });
        throw new Error(errMsg);
      }
    },

    logout: async () => {
      set({ isLoading: true });
      try {
        await api.post("/api/v1/auth/logout").catch(() => {});
      } finally {
        localStorage.removeItem("rentmate_token");
        localStorage.removeItem("rentmate_refresh_token");
        localStorage.removeItem("rentmate_user");
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        if (typeof window !== "undefined") {
          window.location.href = "/";
        }
      }
    },

    checkAuth: async () => {
      set({ isLoading: true, error: null });
      const token = localStorage.getItem("rentmate_token");

      if (!token) {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return null;
      }

      try {
        const response = await api.get("/api/v1/auth/me");
        const user = response.data.data;
        localStorage.setItem("rentmate_user", JSON.stringify(user));
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
        return user;
      } catch {
        localStorage.removeItem("rentmate_token");
        localStorage.removeItem("rentmate_refresh_token");
        localStorage.removeItem("rentmate_user");
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return null;
      }
    },

    clearError: () => set({ error: null }),
  };
});
