import { apiRequest } from "./api";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type AuthResponse = {
  token: string;
  user: AuthUser;
};

const TOKEN_KEY = "transitops_token";
const USER_KEY = "transitops_user";

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const getUser = (): AuthUser | null => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => !!getToken();

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const login = async (email: string, password: string): Promise<AuthUser> => {
  const { token, user } = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
};

export const register = async (
  name: string,
  email: string,
  password: string,
  role: string,
): Promise<AuthUser> => {
  const { token, user } = await apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, role }),
  });
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
};
