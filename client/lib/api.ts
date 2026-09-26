import axios from "axios";
import {
  CreateExpensePayload,
  Expense,
  PreviewSplitPayload,
  ComputedSplit,
} from "../components/types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5050/api";

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
}

export async function registerUser(payload: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to register");
  }
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function loginUser(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to log in");
  }
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function forgotPasswordUser(payload: {
  email: string;
  newPassword: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to reset password");
  }
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function getMe(): Promise<AuthUser> {
  const token = getAuthToken();
  if (!token) throw new Error("No session token");

  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    removeAuthToken();
    throw new Error(data.error || "Failed to fetch user");
  }
  return data.user;
}

// ── Expenses ───────────────────────────────────────────────────────

export async function createExpense(
  payload: CreateExpensePayload
): Promise<Expense> {
  const res = await fetch(`${API_BASE}/expenses`, {
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
  const res = await fetch(`${API_BASE}/expenses/group/${groupId}`, {
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
  const res = await fetch(`${API_BASE}/expenses/preview-split`, {
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
  const res = await fetch(`${API_BASE}/groups/${groupId}/settle`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to settle payment");
  }
  return data;
}
