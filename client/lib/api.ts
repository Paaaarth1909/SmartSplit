import axios from "axios";
import {
  CreateExpensePayload,
  Expense,
  PreviewSplitPayload,
  ComputedSplit,
} from "../components/types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://smartsplit-1qz1.onrender.com/api";

const TOKEN_KEY = "smartsplit_auth_token";

// Attach JWT token to all axios outgoing requests
if (typeof window !== "undefined") {
  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
    document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=604800; SameSite=Lax`;
  }
}

export function removeAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
  }
}

export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// ── Auth API ────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  fullName: string;
  preferredName?: string;
  email: string;
  phone?: string;
  avatar?: string;
  preferences?: {
    currency?: string;
    theme?: string;
    compactDensity?: boolean;
    liveForex?: boolean;
    acousticFeedback?: boolean;
  };
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: AuthUser;
  error?: string;
  otp?: string;
}

// Safe fetch wrapper that surfaces a helpful message if Render is restarting or waking up
async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (err: any) {
    if (err instanceof TypeError || String(err?.message || err).toLowerCase().includes("fetch")) {
      throw new Error(
        "Unable to connect to the backend server. Render may be restarting, deploying, or waking up from sleep. Please wait 10-20 seconds and try again."
      );
    }
    throw err;
  }
}

// Helper to safely parse API responses, preventing "Unexpected token '<' is not valid JSON"
async function parseApiResponse<T = any>(
  res: Response,
  fallbackError: string
): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  let data: any = null;

  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(
          "API endpoint not found (404). If Render recently finished or failed a deployment, please ensure the latest backend build is active."
        );
      }
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        throw new Error(
          "The backend server is waking up or deploying on Render. Please wait 15-30 seconds and try again."
        );
      }
      throw new Error(fallbackError || text || `Server request failed with status ${res.status}`);
    }
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || fallbackError);
  }

  return (data ?? { success: true }) as T;
}

export async function registerUser(payload: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
}): Promise<AuthResponse> {
  const res = await apiFetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseApiResponse<AuthResponse>(res, "Failed to register");
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function loginUser(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await apiFetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseApiResponse<AuthResponse>(res, "Failed to log in");
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function requestPasswordResetOtp(payload: {
  email: string;
}): Promise<AuthResponse> {
  const res = await apiFetch(`${API_BASE}/auth/forgot-password/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseApiResponse<AuthResponse>(res, "Failed to request OTP");
}

export async function forgotPasswordUser(payload: {
  email: string;
  otp: string;
  newPassword: string;
}): Promise<AuthResponse> {
  const res = await apiFetch(`${API_BASE}/auth/forgot-password/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseApiResponse<AuthResponse>(res, "Failed to reset password");
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function getMe(): Promise<AuthUser> {
  const token = getAuthToken();
  if (!token) throw new Error("No session token");

  const res = await apiFetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders(),
  });
  const data = await parseApiResponse<{ success: boolean; user: AuthUser }>(
    res,
    "Failed to fetch user"
  );
  return data.user;
}

// ── Expenses ───────────────────────────────────────────────────────

export async function createExpense(
  payload: CreateExpensePayload
): Promise<Expense> {
  const res = await apiFetch(`${API_BASE}/expenses`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to create expense");
  }
  const json = await res.json();
  return json.data;
}

export async function listGroupExpenses(
  groupId: string
): Promise<Expense[]> {
  const res = await apiFetch(`${API_BASE}/expenses/group/${groupId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to load expenses");
  const json = await res.json();
  return json.data;
}

// ── Split Preview ──────────────────────────────────────────────────

export async function previewSplit(
  payload: PreviewSplitPayload
): Promise<ComputedSplit[]> {
  const res = await apiFetch(`${API_BASE}/expenses/preview-split`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to preview split");
  }
  const json = await res.json();
  return json.data;
}

export async function settleDebt(
  groupId: string,
  payload: {
    payerId: string;
    receiverId: string;
    amount: number;
    notes?: string;
  }
) {
  const res = await apiFetch(`${API_BASE}/groups/${groupId}/settle`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return parseApiResponse(res, "Failed to settle payment");
}
