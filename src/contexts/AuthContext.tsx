import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getMeRequest, loginRequest, registerRequest, updateProfileRequest } from "../services/auth.service";
import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload } from "../types/auth";
import { normalizeRole } from "../utils/auth";

const TOKEN_KEY = "pos-roti-token";
const USER_KEY = "pos-roti-user";

type ProfilePayload = Pick<AuthUser, "name" | "email" | "phone">;

type AuthCtx = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  registerCustomer: (payload: RegisterPayload) => Promise<AuthUser>;
  updateUserProfile: (payload: ProfilePayload) => Promise<AuthUser | null>;
  refreshUser: () => Promise<AuthUser | null>;
  setAuthSession: (payload: AuthResponse) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthCtx | null>(null);

function getStoredUser() {
  const rawUser = localStorage.getItem(USER_KEY);

  if (!rawUser) return null;

  try {
    const parsed = JSON.parse(rawUser) as AuthUser;
    return { ...parsed, role: normalizeRole(parsed.role) };
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());

  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  const setAuthSession = (payload: AuthResponse) => {
    const normalizedUser = { ...payload.user, role: normalizeRole(payload.user.role) };

    localStorage.setItem(TOKEN_KEY, payload.token);
    localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));

    setToken(payload.token);
    setUser(normalizedUser);
  };

  const login = async (payload: LoginPayload) => {
    const response = await loginRequest(payload);
    setAuthSession(response);
    return response.user;
  };

  const registerCustomer = async (payload: RegisterPayload) => {
    const response = await registerRequest(payload);
    setAuthSession(response);
    return response.user;
  };

  const persistUser = (nextUser: AuthUser) => {
    const normalizedUser = { ...nextUser, role: normalizeRole(nextUser.role) };
    localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
    localStorage.setItem(
      "beard-papas-customer-profile",
      JSON.stringify({ name: normalizedUser.name, email: normalizedUser.email, phone: normalizedUser.phone || "" }),
    );
    localStorage.setItem(
      "bread-papa-customer-profile",
      JSON.stringify({ name: normalizedUser.name, email: normalizedUser.email, phone: normalizedUser.phone || "" }),
    );
    setUser(normalizedUser);
    return normalizedUser;
  };

  const updateUserProfile = async (payload: ProfilePayload) => {
    if (!user) return null;

    const cleanPayload = {
      name: payload.name.trim(),
      email: payload.email.trim(),
      phone: payload.phone?.trim() || undefined,
    };

    try {
      const updatedUser = await updateProfileRequest(cleanPayload);
      return persistUser(updatedUser);
    } catch {
      return persistUser({ ...user, ...cleanPayload });
    }
  };

  const refreshUser = async () => {
    try {
      const freshUser = await getMeRequest();
      return persistUser(freshUser);
    } catch {
      return user;
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setToken(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      login,
      registerCustomer,
      updateUserProfile,
      refreshUser,
      setAuthSession,
      logout,
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }

  return ctx;
}
