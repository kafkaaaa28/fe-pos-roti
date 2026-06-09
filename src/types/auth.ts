export type Role = "MANAGER" | "STAFF" | "KASIR" | "CUSTOMER";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  phone?: string;
  password: string;
  passwordConfirmation: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};
