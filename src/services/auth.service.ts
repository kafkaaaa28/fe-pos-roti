import api from "./api";
import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload } from "../types/auth";
import { normalizeRole } from "../utils/auth";

type RawAuthResponse = {
  token?: string;
  user?: Partial<AuthUser>;
  tokens?: {
    accessToken?: string;
  };
  data?: {
    token?: string;
    user?: Partial<AuthUser>;
    tokens?: {
      accessToken?: string;
    };
  };
};

function mapAuthResponse(response: RawAuthResponse): AuthResponse {
  const token = response.tokens?.accessToken ?? response.token ?? response.data?.tokens?.accessToken ?? response.data?.token;
  const user = response.user ?? response.data?.user;

  if (!token || !user?.id || !user?.email || !user?.name) {
    throw new Error("Format response auth tidak sesuai");
  }

  return {
    token,
    user: {
      id: String(user.id),
      name: String(user.name),
      email: String(user.email),
      role: normalizeRole(user.role),
      phone: user.phone ? String(user.phone) : undefined,
    },
  };
}

export async function loginRequest(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<RawAuthResponse>("/auth/login", payload);
  return mapAuthResponse(data);
}

export async function registerRequest(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<RawAuthResponse>("/auth/register", {
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    password: payload.password,
    role: "CUSTOMER",
  });

  return mapAuthResponse(data);
}

export async function updateProfileRequest(payload: { name?: string; email?: string; phone?: string }): Promise<AuthUser> {
  const { data } = await api.patch<AuthUser>("/auth/me", payload);
  return {
    id: String(data.id),
    name: String(data.name),
    email: String(data.email),
    role: normalizeRole(data.role),
    phone: data.phone ? String(data.phone) : undefined,
  };
}

export async function getMeRequest(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>("/auth/me");
  return {
    id: String(data.id),
    name: String(data.name),
    email: String(data.email),
    role: normalizeRole(data.role),
    phone: data.phone ? String(data.phone) : undefined,
  };
}
