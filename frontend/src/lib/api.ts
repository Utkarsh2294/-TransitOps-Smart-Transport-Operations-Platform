export type ApiErrorResponse = {
  field: string;
  message: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export const apiRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({
      field: "request",
      message: "Request failed",
    }))) as ApiErrorResponse;
    throw error;
  }

  return response.json() as Promise<T>;
};

