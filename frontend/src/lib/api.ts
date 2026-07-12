export type ApiErrorResponse = {
  field: string;
  message: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";
const DEMO_TOKEN = import.meta.env.VITE_DEMO_TOKEN;
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export const apiRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const isFormData = init?.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(DEMO_TOKEN ? { Authorization: `Bearer ${DEMO_TOKEN}` } : {}),
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

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;
export const apiOrigin = API_ORIGIN;
export const demoToken = DEMO_TOKEN;
