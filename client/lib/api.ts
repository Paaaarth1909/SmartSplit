import {
  CreateExpensePayload,
  Expense,
  PreviewSplitPayload,
  ComputedSplit,
} from "../components/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";

// ── Expenses ───────────────────────────────────────────────────────

export async function createExpense(
  payload: CreateExpensePayload
): Promise<Expense> {
  const res = await fetch(`${API_BASE}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch(`${API_BASE}/expenses/group/${groupId}`);
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to preview split");
  }
  const json = await res.json();
  return json.data;
}
