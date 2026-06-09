import api from "./api";
import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload, Role } from "../types/auth";
import { normalizeRole } from "../utils/auth";

const LOCAL_CUSTOMERS_KEY = "pos-roti-local-customers";

const DEMO_ACCOUNTS: Array<AuthUser & { password: string }> = [
  {
    id: "USR-MANAGER-001",
    name: "Manager Toko",
    email: "manager@test.com",
    password: "123",
    role: "MANAGER",
  },
  {
    id: "USR-STAFF-001",
    name: "Staff Produksi",
    email: "staff@test.com",
    password: "123",
    role: "STAFF",
  },
  {
    id: "USR-KASIR-001",
    name: "Kasir Toko",
    email: "cashier@test.com",
    password: "123",
    role: "KASIR",
  },
  {
    id: "CUS-DEMO-001",
    name: "Customer Demo",
    email: "customer@test.com",
    password: "123",
    role: "CUSTOMER",
  },
];

type LocalCustomer = AuthUser & {
  password: string;
  phone?: string;
};

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

function readLocalCustomers(): LocalCustomer[] {
  const raw = localStorage.getItem(LOCAL_CUSTOMERS_KEY);

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as LocalCustomer[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalCustomers(customers: LocalCustomer[]) {
  localStorage.setItem(LOCAL_CUSTOMERS_KEY, JSON.stringify(customers));
}

function createDemoToken(user: AuthUser) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  };

  return `demo.${btoa(JSON.stringify(payload))}.token`;
}

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

function shouldUseLocalFallback(error: unknown) {
  if (typeof error !== "object" || error === null) return true;

  const maybeAxiosError = error as { response?: { status?: number } };

  return !maybeAxiosError.response || maybeAxiosError.response.status === 404;
}

function localLogin({ email, password }: LoginPayload): AuthResponse {
  const normalizedEmail = email.trim().toLowerCase();

  const localCustomers = readLocalCustomers();
  const account = [...DEMO_ACCOUNTS, ...localCustomers].find(
    (item) => item.email.toLowerCase() === normalizedEmail && item.password === password
  );

  if (!account) {
    throw new Error("Email atau password salah");
  }

  const user: AuthUser = {
    id: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    phone: account.phone,
  };

  return {
    token: createDemoToken(user),
    user,
  };
}

function localRegister(payload: RegisterPayload): AuthResponse {
  const name = payload.name.trim();
  const email = payload.email.trim().toLowerCase();
  const password = payload.password.trim();
  const passwordConfirmation = payload.passwordConfirmation.trim();

  if (!name || !email || !password) {
    throw new Error("Nama, email, dan password wajib diisi");
  }

  if (password.length < 6) {
    throw new Error("Password minimal 6 karakter");
  }

  if (password !== passwordConfirmation) {
    throw new Error("Konfirmasi password tidak sama");
  }

  const emailAlreadyUsed = [...DEMO_ACCOUNTS, ...readLocalCustomers()].some(
    (item) => item.email.toLowerCase() === email
  );

  if (emailAlreadyUsed) {
    throw new Error("Email sudah terdaftar");
  }

  const user: AuthUser = {
    id: `CUS-${Date.now()}`,
    name,
    email,
    role: "CUSTOMER" satisfies Role,
    phone: payload.phone?.trim() || undefined,
  };

  const newCustomer: LocalCustomer = {
    ...user,
    phone: payload.phone?.trim() || undefined,
    password,
  };

  writeLocalCustomers([...readLocalCustomers(), newCustomer]);

  return {
    token: createDemoToken(user),
    user,
  };
}

export async function loginRequest(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const { data } = await api.post<RawAuthResponse>("/auth/login", payload);
    return mapAuthResponse(data);
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      return localLogin(payload);
    }

    throw error;
  }
}

export async function registerRequest(payload: RegisterPayload): Promise<AuthResponse> {
  try {
    const { data } = await api.post<RawAuthResponse>("/auth/register", {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      password: payload.password,
      role: "CUSTOMER",
    });

    return mapAuthResponse(data);
  } catch (error) {
    if (shouldUseLocalFallback(error)) {
      return localRegister(payload);
    }

    throw error;
  }
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
